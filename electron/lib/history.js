"use strict";
/* Local, git-backed version history for everything Studio owns.
 *
 * The repository lives beside the app's own data (`$CODEX_HOME/studio`) — never as a
 * `.git` inside a user's project — and is never pushed. Restoring writes a *new*
 * commit rather than rewinding, so history is append-only: an undo can be undone,
 * and that undo undone in turn.
 *
 * The snapshot covers every user-managed record, not just documents: profiles,
 * sessions, accounts, MCP servers, appearance and settings travel together, because
 * restoring an account without the configuration it ran under is a subtly wrong
 * state. */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const cli = require("./cli");
const config = require("./config");

const SNAPSHOT = "studio-state.json";
const CONFIG_COPY = "codex-config.toml";

function repo() {
  return path.join(cli.codexHome(), "studio");
}

function git(args, opts = {}) {
  try {
    const stdout = execFileSync("git", ["-C", repo(), ...args], {
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, stdout, stderr: "" };
  } catch (e) {
    if (opts.tolerant) return { ok: false, stdout: e.stdout || "", stderr: e.stderr || e.message };
    return { ok: false, stdout: e.stdout || "", stderr: e.stderr || e.message };
  }
}

function ensureRepo() {
  const dir = repo();
  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(path.join(dir, ".git"))) return;
  execFileSync("git", ["-C", dir, "init", "--initial-branch", "main"], {
    windowsHide: true,
    stdio: "ignore",
  });
  // A committer identity is required even for a local-only repo; set it on this repo
  // alone so the user's global git config is left untouched.
  git(["config", "user.name", "Codex Studio"], { tolerant: true });
  git(["config", "user.email", "studio@codex.local"], { tolerant: true });
  fs.writeFileSync(
    path.join(dir, ".gitignore"),
    "# Codex Studio history — local only, never pushed.\n*.bak\n",
    "utf8",
  );
}

/** Record a revision. An unchanged state records nothing, so the history panel stays
 *  a list of real events rather than a list of saves. */
function commit(message, kind, snapshot) {
  ensureRepo();
  const dir = repo();
  fs.writeFileSync(path.join(dir, SNAPSHOT), JSON.stringify(snapshot ?? {}, null, 2), "utf8");
  // Keep the live config.toml beside the snapshot so a restore can show what the CLI
  // itself was configured with at that revision.
  try {
    fs.writeFileSync(path.join(dir, CONFIG_COPY), config.readText(), "utf8");
  } catch {
    /* an unreadable config is not a reason to lose the snapshot */
  }
  git(["add", "-A"], { tolerant: true });
  const staged = git(["diff", "--cached", "--quiet"], { tolerant: true });
  if (staged.ok) return { committed: false, reason: "nothing changed" };
  const out = git(["commit", "-m", `[${kind || "change"}] ${message}`]);
  if (!out.ok) throw new Error(out.stderr.trim() || "git commit failed");
  const id = git(["rev-parse", "--short", "HEAD"], { tolerant: true });
  return {
    committed: true,
    id: id.stdout.trim(),
    message,
    kind: kind || "change",
    repo: dir,
  };
}

function log(limit = 200) {
  ensureRepo();
  // Space-separated rather than a delimiter character: the short hash and the epoch
  // never contain a space, so splitting on the first two is unambiguous even when
  // the subject does.
  const out = git(["log", "--pretty=format:%h %at %s", "-n", String(limit)], {
    tolerant: true,
  });
  // A repository with no commits yet is an empty history, not an error.
  if (!out.ok) return { commits: [], repo: repo() };
  const commits = out.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const m = /^(\S+)\s+(\d+)\s?(.*)$/.exec(line);
      if (!m) return null;
      const tagged = /^\[([^\]]+)\]\s(.*)$/.exec(m[3]);
      return {
        id: m[1],
        at: Number(m[2]) || 0,
        kind: tagged ? tagged[1] : "change",
        message: tagged ? tagged[2] : m[3],
      };
    })
    .filter(Boolean);
  return { commits, repo: repo() };
}

/** The snapshot as it stood at `id`. The caller applies it and then commits the
 *  result as a fresh revision — this never mutates history. */
function show(id) {
  ensureRepo();
  const out = git(["show", `${id}:${SNAPSHOT}`], { tolerant: true });
  if (!out.ok) throw new Error(`revision ${id} has no snapshot: ${out.stderr.trim()}`);
  try {
    return JSON.parse(out.stdout);
  } catch (e) {
    throw new Error(`revision ${id} snapshot does not parse: ${e.message}`);
  }
}

/** Unified diff of the snapshot between a revision and its parent, so the history
 *  panel can say what actually changed rather than that something did. */
function diff(id) {
  ensureRepo();
  const out = git(["show", "--format=", "--unified=1", id], { tolerant: true });
  return { id, diff: out.stdout };
}

/** Drop revisions older than `keep`. Retention is explicit user action, never
 *  automatic — nothing here runs on a timer. */
function prune(keep = 100) {
  ensureRepo();
  const count = git(["rev-list", "--count", "HEAD"], { tolerant: true });
  const total = Number(count.stdout.trim()) || 0;
  if (total <= keep) return { pruned: 0, kept: total };
  const root = `HEAD~${keep}`;
  const graft = git(["replace", "--graft", root], { tolerant: true });
  if (!graft.ok) throw new Error(graft.stderr.trim() || "could not prune the history");
  git(["filter-branch", "--force", "--", "HEAD"], { tolerant: true });
  git(["replace", "-d", root], { tolerant: true });
  return { pruned: total - keep, kept: keep };
}

module.exports = { repo, commit, log, show, diff, prune };
