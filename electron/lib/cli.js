"use strict";
/* Every backend capability is a real `codex` invocation. Nothing about the agent,
   the sandbox or the config schema is reimplemented here — this module only knows
   how to find the binary, run it, and hand the output back verbatim. */

const { spawn, execFile, execFileSync } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

/** Where the `codex` this process runs actually came from, and why. Resolved once —
 *  probing PATH on every invocation would add a process spawn to every call. */
let resolved = null;

/** Search order, and the reasoning behind it:
 *
 *  1. `CODEX_BIN` — an explicit override always wins.
 *  2. The user's own install. It owns their login, their `~/.codex` and their update
 *     channel. Shadowing it with a bundled copy is how a machine ends up "logged
 *     out" in this app and logged in everywhere else.
 *  3. The copy bundled with the installer, so the app is useful on a machine that
 *     has never installed Codex.
 */
function resolveCodex() {
  if (resolved) return resolved;

  if (process.env.CODEX_BIN) {
    resolved = { bin: process.env.CODEX_BIN, source: "CODEX_BIN", bundled: false };
    return resolved;
  }

  try {
    const out = require("node:child_process").execFileSync(
      process.platform === "win32" ? "where" : "which",
      ["codex"],
      { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] },
    );
    const first = out.split(/\r?\n/).find((l) => l.trim());
    if (first) {
      resolved = { bin: first.trim(), source: "installed on this machine", bundled: false };
      return resolved;
    }
  } catch {
    /* nothing on PATH — fall through to the bundled copy */
  }

  const fs = require("node:fs");
  // Packaged: resources/codex-bin/. From a checkout: vendor/codex-bin/.
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, "codex-bin", "bin", "codex.exe") : null,
    path.join(__dirname, "..", "..", "vendor", "codex-bin", "bin", "codex.exe"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      resolved = { bin: candidate, source: "bundled with Codex Studio", bundled: true };
      return resolved;
    }
  }

  // Nothing found. Return the bare name so the failure message names the real
  // problem — "could not run `codex`" — rather than a path nobody recognises.
  resolved = { bin: "codex", source: "not found", bundled: false };
  return resolved;
}

function codexBin() {
  return resolveCodex().bin;
}

function codexSource() {
  return resolveCodex();
}

/** Windows resolves `codex` to a .cmd shim, which `spawn` will not execute without
 *  a shell. Everything here goes through `shell: true` on win32 for that reason, so
 *  arguments must never be interpolated into a string — they stay an argv array. */
const WIN = process.platform === "win32";

const DEFAULT_TIMEOUT = 120_000;

function run(args, opts = {}) {
  return new Promise((resolve) => {
    execFile(
      codexBin(),
      args,
      {
        cwd: opts.cwd || undefined,
        timeout: opts.timeout || DEFAULT_TIMEOUT,
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
        shell: WIN,
      },
      (err, stdout, stderr) => {
        resolve({
          code: err && typeof err.code === "number" ? err.code : err ? -1 : 0,
          stdout: String(stdout || ""),
          stderr: String(stderr || (err ? err.message : "")),
          ok: !err,
        });
      },
    );
  });
}

/** Some Codex subcommands print a human banner before the JSON body, so the parse
 *  retries from the first `{`/`[` rather than failing the whole call. */
function parseLooseJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through to the salvage path below */
  }
  const brace = trimmed.indexOf("{");
  const bracket = trimmed.indexOf("[");
  const start =
    brace === -1 ? bracket : bracket === -1 ? brace : Math.min(brace, bracket);
  if (start === -1) return null;
  try {
    return JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
}

async function runJson(args, opts) {
  const out = await run(args, opts);
  const parsed = parseLooseJson(out.stdout);
  if (parsed === null) {
    if (!out.ok) {
      throw new Error(
        `\`codex ${args.join(" ")}\` exited ${out.code}: ${out.stderr.trim() || "no output"}`,
      );
    }
    throw new Error(
      `\`codex ${args.join(" ")}\` did not return JSON: ${out.stdout.slice(0, 200)}`,
    );
  }
  return parsed;
}

/** Spawn a program and stream every stdout/stderr line to `onLine` as it arrives.
 *  Both pipes are read concurrently — draining one to completion before touching
 *  the other deadlocks the moment a chatty process fills the pipe nobody is reading.
 *
 *  `opts.onSpawn` is called with the child the instant it exists, before any output
 *  has arrived. A caller that only wants the transcript can keep ignoring it; a caller
 *  that has to be able to stop the run needs the handle from the first moment, because
 *  a run the user cancels before it prints anything is exactly the one worth stopping. */
function stream(program, args, opts, onLine) {
  const options = opts || {};
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(program, args, {
        cwd: options.cwd || undefined,
        windowsHide: true,
        shell: WIN,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      reject(new Error(`could not start \`${program}\`: ${e.message}`));
      return;
    }

    if (typeof options.onSpawn === "function") options.onSpawn(child);

    const lines = [];
    const pump = (streamHandle, level) => {
      let buffer = "";
      streamHandle.setEncoding("utf8");
      streamHandle.on("data", (chunk) => {
        buffer += chunk;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const text = buffer.slice(0, nl).replace(/\r$/, "");
          buffer = buffer.slice(nl + 1);
          const line = { level, text };
          lines.push(line);
          onLine(line);
        }
      });
      streamHandle.on("end", () => {
        if (!buffer) return;
        const line = { level, text: buffer };
        lines.push(line);
        onLine(line);
      });
    };
    pump(child.stdout, "out");
    pump(child.stderr, "error");

    child.on("error", (e) => reject(new Error(`could not start \`${program}\`: ${e.message}`)));
    child.on("close", (code) => resolve({ code: code == null ? -1 : code, lines }));
  });
}

/** Kill a process and every descendant it spawned. Returns whether anything was
 *  actually killed.
 *
 *  `child.kill()` is not enough here. Everything goes through `shell: true` on Windows
 *  (see WIN above), so the pid Node reports is the `cmd.exe` wrapper — signalling it
 *  leaves `codex` itself, and whatever `codex` spawned in turn, running to completion
 *  with nobody left reading the output. `/T` is the whole point: it walks the
 *  descendant tree. `/F` skips asking politely, which is what a Stop button means.
 *
 *  Synchronous on purpose. Electron's `before-quit` does not await anything, so an
 *  async kill would lose the race against the process exiting and the run would
 *  survive the app that started it. */
function killTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;

  if (WIN) {
    try {
      execFileSync("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
        timeout: 10_000,
      });
      return true;
    } catch {
      /* Exit 128 means the pid was already gone; ENOENT means this machine has no
         taskkill. Both fall through to the signal below, which reports the truth
         either way rather than claiming a kill that did not happen. */
    }
  }

  try {
    // No tree here — a single process, which is all a non-Windows host or a machine
    // without taskkill can promise.
    process.kill(pid, "SIGKILL");
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  codexHome,
  codexBin,
  codexSource,
  run,
  runJson,
  parseLooseJson,
  stream,
  killTree,
  WIN,
};
