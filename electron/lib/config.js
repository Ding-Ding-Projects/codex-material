"use strict";
/* `~/.codex/config.toml` access.
 *
 * The GUI never edits the file as text — it hands over a dotted key path and a JSON
 * value, and this module rewrites the document. Every write backs the previous file
 * up first, so a bad edit stays recoverable from disk even if the in-app history is
 * lost. */

const fs = require("node:fs");
const path = require("node:path");
const toml = require("smol-toml");
const { codexHome } = require("./cli");

function configPath() {
  return path.join(codexHome(), "config.toml");
}

function readText() {
  try {
    return fs.readFileSync(configPath(), "utf8");
  } catch {
    return "";
  }
}

function readToml() {
  const text = readText();
  if (!text.trim()) return {};
  try {
    return toml.parse(text);
  } catch (e) {
    throw new Error(`${configPath()} does not parse: ${e.message}`);
  }
}

/** Copy the current config next to itself before it is replaced. Returns the backup
 *  path when one was made — no file yet means there is nothing to back up. */
function backup() {
  const p = configPath();
  if (!fs.existsSync(p)) return null;
  const stamp = Math.floor(Date.now() / 1000);
  const dest = path.join(path.dirname(p), `config.toml.studio-${stamp}.bak`);
  try {
    fs.copyFileSync(p, dest);
    return dest;
  } catch {
    return null;
  }
}

function writeText(text) {
  try {
    toml.parse(text);
  } catch (e) {
    throw new Error(`refusing to write invalid TOML: ${e.message}`);
  }
  const p = configPath();
  const backedUp = backup();
  fs.mkdirSync(codexHome(), { recursive: true });
  fs.writeFileSync(p, text, "utf8");
  return { written: true, path: p, backup: backedUp, bytes: Buffer.byteLength(text) };
}

function getPath(root, dotted) {
  let cursor = root;
  for (const part of String(dotted).split(".").filter(Boolean)) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

/** Set (or, with `null`, remove) a dotted key such as `mcp_servers.github.enabled`.
 *  Intermediate tables are created as needed. */
function setPath(dotted, value) {
  const parts = String(dotted).split(".").filter(Boolean);
  if (!parts.length) throw new Error("empty config key");
  const root = readToml();
  let cursor = root;
  for (const part of parts.slice(0, -1)) {
    if (cursor[part] == null || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  const leaf = parts[parts.length - 1];
  if (value === null || value === undefined) delete cursor[leaf];
  else cursor[leaf] = value;
  return writeText(toml.stringify(root) + "\n");
}

function removePath(dotted) {
  return setPath(dotted, null);
}

module.exports = { configPath, readText, readToml, backup, writeText, getPath, setPath, removePath };
