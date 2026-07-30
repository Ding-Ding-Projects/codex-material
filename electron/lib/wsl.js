"use strict";
/* Per-tab WSL runtimes.
 *
 * A session can pin itself to a distro; Studio then keeps one long-lived shell alive
 * for that session so `cd`, env vars and background jobs persist between commands
 * instead of every run starting from scratch. */

const { spawn, execFile } = require("node:child_process");

/** sessionId -> instance */
const instances = new Map();

/** `wsl -l -q` emits UTF-16LE. Decoding it as UTF-8 turns every distro name into
 *  NUL-separated garbage, which then fails every name comparison downstream. */
function decodeWsl(buf) {
  if (buf.length >= 2) {
    let nulls = 0;
    for (let i = 1; i < buf.length; i += 2) if (buf[i] === 0) nulls++;
    if (nulls > buf.length / 4) return buf.toString("utf16le");
  }
  return buf.toString("utf8");
}

function distros() {
  return new Promise((resolve) => {
    execFile(
      "wsl.exe",
      ["-l", "-q"],
      { encoding: "buffer", windowsHide: true, timeout: 15_000 },
      (err, stdout) => {
        if (err && !stdout) {
          resolve([]);
          return;
        }
        resolve(
          decodeWsl(stdout || Buffer.alloc(0))
            .split(/\r?\n/)
            .map((l) => l.replace(/^﻿/, "").trim())
            .filter(Boolean),
        );
      },
    );
  });
}

function toJson(session, inst, status) {
  return {
    session,
    distro: inst.distro,
    cwd: inst.cwd,
    pid: inst.pid,
    startedAt: inst.startedAt,
    auto: inst.auto,
    status,
  };
}

async function list() {
  const out = {};
  for (const [session, inst] of instances) {
    out[session] = toJson(session, inst, inst.exited ? "stopped" : "running");
  }
  return { distros: await distros(), instances: out };
}

async function spawnInstance(args) {
  const available = await distros();
  if (!available.length) throw new Error("no WSL distribution is installed");
  const distro = args.distro || available[0];
  if (!available.includes(distro)) {
    throw new Error(`\`${distro}\` is not an installed WSL distribution`);
  }
  const cwd = args.cwd || "~";
  stopInstance(args.session);
  // `sleep infinity` under a login shell keeps the namespace and the mounted drives
  // alive for the tab without holding a pty open.
  const child = spawn(
    "wsl.exe",
    ["-d", distro, "--cd", cwd, "--", "bash", "-lc", "sleep infinity"],
    { windowsHide: true, stdio: "ignore", detached: false },
  );
  const inst = {
    distro,
    cwd,
    pid: child.pid,
    startedAt: Math.floor(Date.now() / 1000),
    auto: args.auto !== false,
    child,
    exited: false,
  };
  child.on("exit", () => {
    inst.exited = true;
  });
  child.on("error", () => {
    inst.exited = true;
  });
  instances.set(args.session, inst);
  return toJson(args.session, inst, "running");
}

function stopInstance(session) {
  const inst = instances.get(session);
  if (!inst || !inst.child) return false;
  try {
    inst.child.kill();
  } catch {
    /* already gone */
  }
  inst.exited = true;
  return true;
}

function stop(session) {
  const existed = stopInstance(session);
  const inst = instances.get(session);
  return inst
    ? toJson(session, inst, "stopped")
    : { session, status: existed ? "stopped" : "absent" };
}

async function kill(session) {
  stopInstance(session);
  instances.delete(session);
  return list();
}

async function set(session, patch) {
  const inst = instances.get(session);
  if (inst && patch && typeof patch === "object") {
    if (typeof patch.cwd === "string") inst.cwd = patch.cwd;
    if (typeof patch.distro === "string") inst.distro = patch.distro;
    if (typeof patch.auto === "boolean") inst.auto = patch.auto;
  }
  return list();
}

/** Run one command inside the session's distro. Falls back to a one-shot invocation
 *  when no instance is pinned, so a run never silently does nothing. */
async function exec(args) {
  const inst = instances.get(args.session);
  let distro = inst ? inst.distro : args.distro;
  const cwd = inst ? inst.cwd : args.cwd || "~";
  if (!distro) {
    const available = await distros();
    if (!available.length) throw new Error("no WSL distribution is installed");
    distro = available[0];
  }
  const command = args.command || "codex --version";
  return new Promise((resolve) => {
    execFile(
      "wsl.exe",
      ["-d", distro, "--cd", cwd, "--", "bash", "-lc", command],
      { windowsHide: true, maxBuffer: 16 * 1024 * 1024, timeout: 120_000 },
      (err, stdout, stderr) => {
        const lines = [
          { level: "cmd", text: `wsl -d ${distro} --cd ${cwd} -- ${command}` },
        ];
        String(stdout || "")
          .split(/\r?\n/)
          .filter(Boolean)
          .forEach((t) => lines.push({ level: "out", text: t }));
        String(stderr || (err ? err.message : ""))
          .split(/\r?\n/)
          .filter(Boolean)
          .forEach((t) => lines.push({ level: "error", text: t }));
        resolve({
          code: err && typeof err.code === "number" ? err.code : err ? -1 : 0,
          session: args.session,
          distro,
          cwd,
          lines,
        });
      },
    );
  });
}

/** Kill every tracked shell — called when the window closes so a quit does not leave
 *  a `sleep infinity` per tab running forever. */
function shutdown() {
  for (const session of [...instances.keys()]) stopInstance(session);
  instances.clear();
}

module.exports = { distros, list, spawn: spawnInstance, stop, kill, set, exec, shutdown };
