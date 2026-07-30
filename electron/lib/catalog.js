"use strict";
/* Everything the GUI lists — MCP servers, plugins, marketplaces, skills, hooks,
   feature flags, saved sessions, auth and doctor — read from the real CLI and the
   real CODEX_HOME, then normalised into the shapes the frontend renders. */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
const cli = require("./cli");
const config = require("./config");

const str = (v, k) => (v && typeof v[k] === "string" ? v[k] : "");

/* ------------------------------------------------------------------ MCP */

async function mcpList() {
  const raw = await cli.runJson(["mcp", "list", "--json"]);
  const servers = Array.isArray(raw) ? raw : [];
  return servers.map((s) => {
    const transport = s.transport || {};
    const kind = str(transport, "type") || "stdio";
    const enabled = s.enabled !== false;
    const auth = str(s, "auth_status");
    return {
      name: str(s, "name"),
      transport: kind,
      command: str(transport, "command"),
      args: Array.isArray(transport.args) ? transport.args : [],
      url: str(transport, "url"),
      cwd: str(transport, "cwd"),
      enabled,
      status: !enabled ? "disabled" : s.disabled_reason ? "error" : "configured",
      disabledReason: s.disabled_reason ?? null,
      oauth: auth !== "unsupported" && auth !== "",
      authStatus: auth,
      startupTimeoutSec: s.startup_timeout_sec ?? null,
      toolTimeoutSec: s.tool_timeout_sec ?? null,
    };
  });
}

/** Enable/disable is a config edit, not a CLI verb — Codex reads
 *  `mcp_servers.<name>.enabled` on its next run. */
async function mcpToggle(name) {
  const root = config.readToml();
  const key = `mcp_servers.${name}.enabled`;
  const current = config.getPath(root, key);
  config.setPath(key, current === false ? true : false);
  return mcpList();
}

async function mcpRemove(name) {
  const out = await cli.run(["mcp", "remove", name]);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex mcp remove ${name} failed`);
  return mcpList();
}

async function mcpAdd(spec) {
  const transport = spec.transport || "stdio";
  const argv = ["mcp", "add", spec.name];
  if (transport === "stdio") {
    if (!spec.command) throw new Error("a stdio MCP server needs a command");
    argv.push("--", spec.command, ...(spec.args || []));
  } else {
    if (!spec.url) throw new Error("an HTTP MCP server needs a URL");
    argv.push("--url", spec.url);
  }
  const out = await cli.run(argv);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex ${argv.join(" ")} failed`);
  return mcpList();
}

/* -------------------------------------------------------------- plugins */

function pluginRow(p) {
  return {
    id: str(p, "pluginId"),
    name: str(p, "name"),
    marketplace: str(p, "marketplaceName"),
    version: str(p, "version"),
    installed: p.installed === true,
    enabled: p.enabled === true,
    path: (p.source && str(p.source, "path")) || "",
    installPolicy: str(p, "installPolicy"),
    authPolicy: str(p, "authPolicy"),
    desc: str(p, "description"),
  };
}

async function pluginList() {
  const raw = await cli.runJson(["plugin", "list", "--json"]);
  return (raw.installed || []).map(pluginRow);
}

/** Everything the configured marketplaces offer, installed or not — this is what
 *  the Extend ▸ Plugin marketplace browser renders. */
async function pluginCatalog() {
  const raw = await cli.runJson(["plugin", "list", "--available", "--json"]);
  const rows = [];
  for (const key of ["installed", "available"]) {
    if (Array.isArray(raw[key])) rows.push(...raw[key].map(pluginRow));
  }
  const seen = new Set();
  return rows
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function pluginInstall(name) {
  const out = await cli.run(["plugin", "add", name]);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex plugin add ${name} failed`);
  return pluginList();
}

async function pluginUninstall(name) {
  const out = await cli.run(["plugin", "remove", name]);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex plugin remove ${name} failed`);
  return pluginList();
}

async function marketplaceList() {
  const raw = await cli.runJson(["plugin", "marketplace", "list", "--json"]);
  const arr = Array.isArray(raw) ? raw : raw.marketplaces || [];
  return arr.map((m) => ({
    name: str(m, "name"),
    url: str(m, "root") || str(m, "source"),
    plugins: m.pluginCount ?? null,
  }));
}

async function marketplaceAdd(name, url) {
  const out = await cli.run(["plugin", "marketplace", "add", name, url || ""]);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex plugin marketplace add ${name} failed`);
  return marketplaceList();
}

async function marketplaceRemove(name) {
  const out = await cli.run(["plugin", "marketplace", "remove", name]);
  if (!out.ok) throw new Error(out.stderr.trim() || `codex plugin marketplace remove ${name} failed`);
  return marketplaceList();
}

/* --------------------------------------------------------------- skills */

function scanSkills(root, source, out) {
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const manifest = path.join(dir, "SKILL.md");
    if (!fs.existsSync(manifest)) continue;
    // A skill is off when its directory carries the `.disabled` suffix — the same
    // convention the CLI itself uses when skipping one.
    const enabled = !entry.name.endsWith(".disabled");
    let desc = "";
    try {
      const head = fs.readFileSync(manifest, "utf8").split("\n").slice(0, 20);
      const line = head.find((l) => l.startsWith("description:"));
      if (line) desc = line.slice("description:".length).trim();
    } catch {
      /* an unreadable manifest still lists, just without its description */
    }
    out.push({
      name: entry.name.replace(/\.disabled$/, ""),
      dir,
      path: manifest,
      enabled,
      source,
      desc,
    });
  }
}

function skillList(projectCwd) {
  const out = [];
  scanSkills(path.join(cli.codexHome(), "skills"), "user", out);
  scanSkills(path.join(os.homedir(), ".agents", "skills"), "user", out);
  if (projectCwd) scanSkills(path.join(projectCwd, ".codex", "skills"), "project", out);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Enabling/disabling a skill renames its directory — the state lives on disk, so
 *  it survives regardless of which client wrote it. */
function skillToggle(dir) {
  if (!fs.existsSync(path.join(dir, "SKILL.md"))) {
    throw new Error(`${dir} is not a skill directory`);
  }
  const name = path.basename(dir);
  const parent = path.dirname(dir);
  const dest = name.endsWith(".disabled")
    ? path.join(parent, name.replace(/\.disabled$/, ""))
    : path.join(parent, `${name}.disabled`);
  fs.renameSync(dir, dest);
  return { from: dir, to: dest };
}

/* ---------------------------------------------------------------- hooks */

/** Hooks are declared in config.toml under `[hooks.<event>]`. Untrusted hooks are
 *  reported but can never be switched on from the GUI. */
function hookList() {
  const root = config.readToml();
  const table = root.hooks;
  const out = [];
  if (table && typeof table === "object") {
    for (const [event, value] of Object.entries(table)) {
      const entries = Array.isArray(value) ? value : [value];
      entries.forEach((entry, i) => {
        if (!entry || typeof entry !== "object") return;
        const trusted = entry.trusted === true;
        out.push({
          event,
          index: i,
          name: entry.name || `${event}#${i}`,
          command: entry.command || "",
          scope: entry.scope || "user",
          trusted,
          enabled: entry.enabled === undefined ? trusted : entry.enabled === true,
        });
      });
    }
  }
  return out;
}

function hookToggle(event, index) {
  const target = hookList().find((h) => h.event === event && h.index === index);
  if (!target) throw new Error(`no hook ${event}#${index}`);
  if (!target.trusted) {
    throw new Error("untrusted hooks never run and cannot be enabled here");
  }
  const root = config.readToml();
  const value = root.hooks && root.hooks[event];
  if (Array.isArray(value)) {
    const copy = value.map((x, i) => (i === index ? { ...x, enabled: !target.enabled } : x));
    config.setPath(`hooks.${event}`, copy);
  } else {
    config.setPath(`hooks.${event}.enabled`, !target.enabled);
  }
  return hookList();
}

/* ------------------------------------------------------------- features */

/** `codex features list` prints `key  <stage words>  <bool>` — parse from both ends
 *  so a multi-word stage such as "under development" stays intact. */
async function featureList() {
  const out = await cli.run(["features", "list"]);
  const rows = [];
  for (const line of out.stdout.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;
    const state = parts[parts.length - 1];
    if (state !== "true" && state !== "false") continue;
    rows.push({
      key: parts[0],
      stage: parts.slice(1, -1).join(" "),
      enabled: state === "true",
    });
  }
  if (!rows.length && !out.ok) throw new Error(out.stderr.trim() || "codex features list failed");
  return rows;
}

async function featureSet(key, value) {
  const verb = value ? "enable" : "disable";
  const out = await cli.run(["features", verb, key]);
  if (!out.ok) throw new Error(`\`codex features ${verb} ${key}\` failed: ${out.stderr.trim()}`);
  return featureList();
}

/* ------------------------------------------------------------- sessions */

/** Read only the first line of a rollout. They routinely run to several megabytes
 *  and the session_meta record is always first. */
function readSessionMeta(file) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    let input;
    try {
      input = fs.createReadStream(file, { encoding: "utf8", end: 65535 });
    } catch {
      finish(null);
      return;
    }
    const rl = readline.createInterface({ input });
    rl.once("line", (line) => {
      rl.close();
      input.destroy();
      try {
        const parsed = JSON.parse(line);
        finish(parsed && parsed.type === "session_meta" ? parsed.payload || null : null);
      } catch {
        finish(null);
      }
    });
    rl.once("close", () => finish(null));
    input.once("error", () => finish(null));
  });
}

function walkRollouts(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkRollouts(p, out);
    else if (entry.name.endsWith(".jsonl")) out.push(p);
  }
}

async function sessionList(limit = 300) {
  const home = cli.codexHome();
  const files = [];
  const archived = [];
  walkRollouts(path.join(home, "sessions"), files);
  walkRollouts(path.join(home, "archived_sessions"), archived);

  const all = files.map((f) => ({ f, archived: false })).concat(archived.map((f) => ({ f, archived: true })));
  // Sort by mtime before reading any metadata: only the newest `limit` files are
  // worth opening, and there are routinely hundreds on disk.
  const stamped = all
    .map((x) => {
      let updated = 0;
      try {
        updated = Math.floor(fs.statSync(x.f).mtimeMs / 1000);
      } catch {
        /* a file that vanished mid-scan simply sorts last */
      }
      return { ...x, updated };
    })
    .sort((a, b) => b.updated - a.updated)
    .slice(0, limit);

  const rows = [];
  for (const item of stamped) {
    const meta = (await readSessionMeta(item.f)) || {};
    const stem = path.basename(item.f, ".jsonl");
    const id = meta.id || stem.split("-").slice(-5).join("-") || stem;
    const cwd = meta.cwd || "";
    const name = meta.name || (cwd ? path.basename(cwd) : String(id).slice(0, 8));
    rows.push({
      id,
      name,
      cwd,
      path: item.f,
      updatedAt: item.updated,
      archived: item.archived,
      originator: meta.originator || "",
      cliVersion: meta.cli_version || "",
      interactive: meta.originator !== "codex_exec",
    });
  }
  return rows;
}

async function sessionAction(id, action) {
  const verb = { archive: "archive", unarchive: "unarchive", delete: "delete" }[action];
  if (!verb) throw new Error(`unknown session action \`${action}\``);
  const out = await cli.run([verb, id]);
  if (!out.ok) throw new Error(`\`codex ${verb} ${id}\` failed: ${out.stderr.trim()}`);
  return sessionList();
}

/* ----------------------------------------------------------------- auth */

async function authStatus() {
  const out = await cli.run(["login", "status"]);
  const text = `${out.stdout}${out.stderr}`;
  const line = (text.trim().split("\n")[0] || "").trim();
  const lower = line.toLowerCase();
  const method = lower.includes("api key")
    ? "api"
    : lower.includes("chatgpt")
      ? "chatgpt"
      : lower.includes("not logged in") || !lower
        ? "none"
        : "unknown";
  const authFile = path.join(cli.codexHome(), "auth.json");
  return {
    method,
    detail: line,
    account:
      text
        .split("\n")
        .map((l) => (l.includes("account:") ? l.split("account:")[1].trim() : null))
        .find(Boolean) || null,
    store: fs.existsSync(authFile) ? "file" : "keyring",
    authFile,
    ok: out.ok,
  };
}

/* --------------------------------------------------------------- doctor */

/** `codex doctor --json` is a flat map of checks; the GUI renders them grouped by
 *  category, so regroup here rather than in the view layer. */
async function doctor() {
  const raw = await cli.runJson(["doctor", "--json", "--all"], { timeout: 180_000 });
  const checks = raw.checks || {};
  const groups = [];
  for (const key of Object.keys(checks).sort()) {
    const check = checks[key];
    const category = str(check, "category") || "other";
    const details = check.details && typeof check.details === "object"
      ? Object.entries(check.details).map(([k, v]) => `${k}: ${String(v).trim()}`)
      : [];
    const row = {
      name: str(check, "id") || key,
      ok: str(check, "status") === "ok",
      status: str(check, "status"),
      detail: str(check, "summary"),
      details,
      remediation: check.remediation ?? null,
    };
    const hit = groups.find((g) => g.name === category);
    if (hit) hit.checks.push(row);
    else groups.push({ name: category, checks: [row] });
  }
  return {
    at: raw.generatedAt ?? null,
    version: raw.codexVersion ?? null,
    overall: raw.overallStatus ?? null,
    groups,
  };
}

module.exports = {
  mcpList,
  mcpToggle,
  mcpRemove,
  mcpAdd,
  pluginList,
  pluginCatalog,
  pluginInstall,
  pluginUninstall,
  marketplaceList,
  marketplaceAdd,
  marketplaceRemove,
  skillList,
  skillToggle,
  hookList,
  hookToggle,
  featureList,
  featureSet,
  sessionList,
  sessionAction,
  authStatus,
  doctor,
};
