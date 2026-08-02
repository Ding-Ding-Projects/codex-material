"use strict";
/* Every backend capability is a real `codex` invocation. Nothing about the agent,
   the sandbox or the config schema is reimplemented here — this module only knows
   how to find the binary, run it, and hand the output back verbatim. */

const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const WIN = process.platform === "win32";
const DEFAULT_TIMEOUT = 120_000;
const MAX_BUFFER = 32 * 1024 * 1024;

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
}

function launcherKind(program) {
  if (!WIN) return "native";
  const ext = path.extname(String(program || "")).toLowerCase();
  if (ext === ".cmd" || ext === ".bat") return "batch";
  if (!ext || ext === ".exe" || ext === ".com") return "native";
  return "unsupported";
}

/** Describe an executable without asking a shell to reinterpret its arguments.
 *
 * Batch files are deliberately refused. There is no general cmd.exe quoting scheme
 * that preserves arbitrary `%`, `!`, quotes, metacharacters and empty arguments through
 * both cmd and batch expansion. Codex Studio ships a native executable and prefers a
 * native installed copy, so silently weakening that boundary is unnecessary. */
function launchSpec(program, args) {
  const file = String(program || "");
  if (!file) throw new Error("no executable was given");
  const kind = launcherKind(file);
  if (kind === "batch") {
    const error = new Error(
      `refusing to launch batch shim \`${file}\`: it cannot preserve arbitrary Codex arguments; install or select codex.exe`,
    );
    error.code = "CODEX_UNSAFE_LAUNCHER";
    throw error;
  }
  if (kind === "unsupported") {
    const error = new Error(`unsupported Codex launcher \`${file}\`; select a native .exe or .com executable`);
    error.code = "CODEX_UNSUPPORTED_LAUNCHER";
    throw error;
  }
  return { file, args: Array.isArray(args) ? args.map(String) : [], kind, shell: false };
}

/** Where the `codex` this process runs actually came from, and why. Resolved once —
 *  probing PATH on every invocation would add a process spawn to every call. */
let resolved = null;

/** Search order, and the reasoning behind it:
 *
 *  1. `CODEX_BIN` — an explicit override always wins (and is validated at launch).
 *  2. The user's native install. It owns their login, their `~/.codex` and their update
 *     channel. A native candidate ranks ahead of a batch shim even when `where` lists
 *     the shim first.
 *  3. The native copy bundled with the installer, so the app is useful on a machine
 *     that has never installed Codex and never needs a shell to carry user input.
 *  4. A discovered batch shim only as an explanatory failure; it is never executed.
 */
function resolveCodex() {
  if (resolved) return resolved;

  if (process.env.CODEX_BIN) {
    const bin = process.env.CODEX_BIN;
    resolved = {
      bin,
      source: "CODEX_BIN",
      bundled: false,
      kind: launcherKind(bin),
    };
    return resolved;
  }

  let discovered = [];
  try {
    const out = execFileSync(process.platform === "win32" ? "where" : "which", ["codex"], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    });
    discovered = out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const native = discovered.find((candidate) => launcherKind(candidate) === "native");
    if (native) {
      resolved = {
        bin: native,
        source: "installed on this machine",
        bundled: false,
        kind: "native",
      };
      return resolved;
    }
  } catch {
    /* nothing on PATH — fall through to the bundled copy */
  }

  // Packaged: resources/codex-bin/. From a checkout: vendor/codex-bin/.
  const candidates = [
    process.resourcesPath ? path.join(process.resourcesPath, "codex-bin", "bin", "codex.exe") : null,
    path.join(__dirname, "..", "..", "vendor", "codex-bin", "bin", "codex.exe"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      resolved = {
        bin: candidate,
        source: "bundled with Codex Studio",
        bundled: true,
        kind: "native",
      };
      return resolved;
    }
  }

  if (discovered.length) {
    resolved = {
      bin: discovered[0],
      source: "unsafe batch shim found on this machine",
      bundled: false,
      kind: launcherKind(discovered[0]),
    };
    return resolved;
  }

  // Nothing found. Return the bare name so the failure message names the real
  // problem — "could not run `codex`" — rather than a path nobody recognises.
  resolved = { bin: "codex", source: "not found", bundled: false, kind: "native" };
  return resolved;
}

function codexBin() {
  return resolveCodex().bin;
}

function codexSource() {
  return resolveCodex();
}

function killTreeDetailed(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return { killed: false, complete: false, reason: "invalid pid", systemCode: null };
  }

  if (WIN) {
    try {
      execFileSync("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
        timeout: 10_000,
      });
      return { killed: true, complete: true, reason: "process tree terminated", systemCode: null };
    } catch (error) {
      // A best-effort direct kill stops the process we can name, but it is not reported
      // as a complete tree cancellation because descendants may have survived.
      let killed = false;
      try {
        process.kill(pid, "SIGKILL");
        killed = true;
      } catch {
        /* already gone or inaccessible */
      }
      return {
        killed,
        complete: false,
        reason: killed ? "only the named process could be terminated" : "the process was already gone or could not be terminated",
        systemCode: error && error.code ? String(error.code) : null,
      };
    }
  }

  try {
    process.kill(pid, "SIGKILL");
    return { killed: true, complete: true, reason: "process terminated", systemCode: null };
  } catch (error) {
    return {
      killed: false,
      complete: false,
      reason: "the process was already gone or could not be terminated",
      systemCode: error && error.code ? String(error.code) : null,
    };
  }
}

/** Kill a process and every descendant it spawned. Returns true only when the complete
 *  tree-kill operation was confirmed. Synchronous on purpose: Electron's `before-quit`
 *  does not await anything, so an asynchronous kill can lose the race against exit. */
function killTree(pid) {
  return killTreeDetailed(pid).complete;
}

function runProgram(program, args, opts = {}) {
  return new Promise((resolve) => {
    let spec;
    try {
      spec = launchSpec(program, args);
    } catch (error) {
      resolve({
        code: -1,
        exitCode: null,
        signal: null,
        systemCode: error.code || null,
        stdout: "",
        stderr: error.message,
        ok: false,
        killed: false,
        timedOut: false,
        cancelled: false,
      });
      return;
    }

    let child;
    try {
      child = spawn(spec.file, spec.args, {
        cwd: opts.cwd || undefined,
        windowsHide: true,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      resolve({
        code: -1,
        exitCode: null,
        signal: null,
        systemCode: error.code || null,
        stdout: "",
        stderr: `could not start \`${program}\`: ${error.message}`,
        ok: false,
        killed: false,
        timedOut: false,
        cancelled: false,
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    let launchError = null;
    let timedOut = false;
    let cancelled = false;
    let overflow = false;
    let timer = null;
    let settled = false;
    const signal = opts.signal || null;

    const stop = (reason) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      if (reason === "timeout") timedOut = true;
      if (reason === "abort") cancelled = true;
      killTreeDetailed(child.pid);
    };
    const onAbort = () => stop("abort");
    if (signal) {
      if (signal.aborted) cancelled = true;
      else signal.addEventListener("abort", onAbort, { once: true });
    }
    const timeout = opts.timeout === undefined ? DEFAULT_TIMEOUT : Number(opts.timeout);
    if (timeout > 0) timer = setTimeout(() => stop("timeout"), timeout);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length + stderr.length > MAX_BUFFER && !overflow) {
        overflow = true;
        stop("overflow");
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stdout.length + stderr.length > MAX_BUFFER && !overflow) {
        overflow = true;
        stop("overflow");
      }
    });
    child.on("error", (error) => {
      launchError = error;
    });
    child.on("close", (exitCode, closeSignal) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
      const systemCode = overflow ? "ENOBUFS" : launchError && launchError.code ? String(launchError.code) : null;
      const detail = overflow
        ? `output exceeded ${MAX_BUFFER} bytes`
        : launchError
          ? `could not start \`${program}\`: ${launchError.message}`
          : "";
      if (!stderr && detail) stderr = detail;
      const code = typeof exitCode === "number" ? exitCode : -1;
      resolve({
        code,
        exitCode: typeof exitCode === "number" ? exitCode : null,
        signal: closeSignal || null,
        systemCode,
        stdout,
        stderr,
        ok: code === 0 && !launchError && !timedOut && !cancelled && !overflow,
        killed: !!child.killed,
        timedOut,
        cancelled,
      });
    });

    if (cancelled) stop("abort");
  });
}

function run(args, opts = {}) {
  return runProgram(codexBin(), args, opts);
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
  const start = brace === -1 ? bracket : bracket === -1 ? brace : Math.min(brace, bracket);
  if (start === -1) return null;
  try {
    return JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
}

function parseJsonOutcome(args, out, opts = {}) {
  const invocation = JSON.stringify(["codex"].concat(args || []));
  const parsed = parseLooseJson(out.stdout);
  if (!out.ok && !(opts.allowNonzeroJson && parsed !== null)) {
    throw new Error(`${invocation} exited ${out.code}: ${out.stderr.trim() || "no output"}`);
  }
  if (parsed === null) {
    throw new Error(`${invocation} did not return JSON: ${out.stdout.slice(0, 200)}`);
  }
  return parsed;
}

async function runJson(args, opts) {
  const out = await run(args, opts);
  return parseJsonOutcome(args, out, opts);
}

/** Spawn a program and stream every stdout/stderr line to `onLine` as it arrives.
 *  Both pipes are read concurrently — draining one to completion before touching
 *  the other deadlocks the moment a chatty process fills the pipe nobody is reading.
 *
 *  `opts.onSpawn` is called with the child the instant it exists. Callback exceptions
 *  become controlled failures: the process tree is stopped and the promise rejects
 *  once the child closes rather than escaping an EventEmitter callback. */
function stream(program, args, opts, onLine) {
  const options = opts || {};
  const receive = typeof onLine === "function" ? onLine : () => {};
  return new Promise((resolve, reject) => {
    let spec;
    try {
      spec = launchSpec(program, args);
    } catch (error) {
      reject(error);
      return;
    }

    let child;
    try {
      child = spawn(spec.file, spec.args, {
        cwd: options.cwd || undefined,
        windowsHide: true,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      reject(new Error(`could not start \`${program}\`: ${error.message}`));
      return;
    }

    const lines = [];
    let callbackError = null;
    let launchError = null;
    let timedOut = false;
    let cancelled = false;
    let settled = false;
    let timer = null;
    const abortSignal = options.signal || null;

    const stop = (reason) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      if (reason === "timeout") timedOut = true;
      if (reason === "abort") cancelled = true;
      killTreeDetailed(child.pid);
    };
    const failCallback = (error) => {
      if (callbackError) return;
      callbackError = error instanceof Error ? error : new Error(String(error));
      stop("callback");
    };
    const emit = (line) => {
      lines.push(line);
      if (callbackError) return;
      try {
        receive(line);
      } catch (error) {
        failCallback(error);
      }
    };
    const pump = (streamHandle, level) => {
      let buffer = "";
      streamHandle.setEncoding("utf8");
      streamHandle.on("data", (chunk) => {
        buffer += chunk;
        let nl;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const text = buffer.slice(0, nl).replace(/\r$/, "");
          buffer = buffer.slice(nl + 1);
          emit({ level, text });
        }
      });
      streamHandle.on("end", () => {
        if (!buffer) return;
        emit({ level, text: buffer.replace(/\r$/, "") });
      });
    };

    // Install all process and pipe listeners before exposing the child to callers.
    pump(child.stdout, "out");
    pump(child.stderr, "error");
    child.on("error", (error) => {
      launchError = error;
    });
    child.on("close", (exitCode, closeSignal) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (abortSignal) abortSignal.removeEventListener("abort", onAbort);
      if (callbackError) {
        reject(callbackError);
        return;
      }
      if (launchError) {
        const error = new Error(`could not start \`${program}\`: ${launchError.message}`);
        error.code = launchError.code;
        reject(error);
        return;
      }
      resolve({
        code: typeof exitCode === "number" ? exitCode : -1,
        exitCode: typeof exitCode === "number" ? exitCode : null,
        signal: closeSignal || null,
        lines,
        killed: !!child.killed,
        timedOut,
        cancelled,
      });
    });

    const onAbort = () => stop("abort");
    if (abortSignal) {
      if (abortSignal.aborted) cancelled = true;
      else abortSignal.addEventListener("abort", onAbort, { once: true });
    }
    const timeout = Number(options.timeout || 0);
    if (timeout > 0) timer = setTimeout(() => stop("timeout"), timeout);

    if (typeof options.onSpawn === "function") {
      try {
        options.onSpawn(child);
      } catch (error) {
        failCallback(error);
      }
    }
    if (cancelled) stop("abort");
  });
}

module.exports = {
  codexHome,
  codexBin,
  codexSource,
  launcherKind,
  launchSpec,
  runProgram,
  run,
  runJson,
  parseJsonOutcome,
  parseLooseJson,
  stream,
  killTree,
  killTreeDetailed,
  WIN,
};
