/* Tests for the Electron main-process modules.
 *
 * Everything here runs under plain Node with no Electron and no `codex` binary — the
 * modules that need either are exercised only through their pure parts. A test that
 * silently passes because the tool it exercises is absent is worse than no test, so
 * anything genuinely unrunnable here says so instead of pretending.
 *
 *   node tools/test-backend.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Every module that reads CODEX_HOME resolves it per call, so a test can point the
 *  whole backend at a scratch directory. It is set and restored around each block,
 *  and the tests below never run concurrently — node:test runs a file serially. */
function withTempHome(fn) {
  const previous = process.env.CODEX_HOME;
  const home = mkdtempSync(join(tmpdir(), "codex-studio-test-"));
  process.env.CODEX_HOME = home;
  try {
    return fn(home);
  } finally {
    if (previous === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previous;
    rmSync(home, { recursive: true, force: true });
  }
}

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore", windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------- cli */

const cli = require(join(root, "electron", "lib", "cli.js"));

test("cli.parseLooseJson reads clean JSON", () => {
  assert.deepEqual(cli.parseLooseJson('{"a":1}'), { a: 1 });
  assert.deepEqual(cli.parseLooseJson("  [1,2]  "), [1, 2]);
});

test("cli.parseLooseJson salvages JSON printed after a human banner", () => {
  // Several Codex subcommands print a heading before the machine-readable body.
  const out = 'Codex Doctor v0.145.0\nNotes\n{"schemaVersion":1,"checks":{}}';
  assert.deepEqual(cli.parseLooseJson(out), { schemaVersion: 1, checks: {} });
});

test("cli.parseLooseJson returns null rather than throwing on non-JSON", () => {
  assert.equal(cli.parseLooseJson("not json at all"), null);
  assert.equal(cli.parseLooseJson(""), null);
  // A `{` with nothing valid after it must not be reported as parsed.
  assert.equal(cli.parseLooseJson("prefix { unterminated"), null);
});

test("cli.parseJsonOutcome accepts a nonzero doctor report only when explicitly allowed", () => {
  const failedHealth = {
    code: 1,
    ok: false,
    stdout: '{"overallStatus":"fail","checks":{"auth":{"status":"fail"}}}',
    stderr: "",
  };
  assert.throws(
    () => cli.parseJsonOutcome(["doctor", "--json", "--all"], failedHealth),
    /exited 1/,
  );
  assert.deepEqual(
    cli.parseJsonOutcome(["doctor", "--json", "--all"], failedHealth, { allowNonzeroJson: true }),
    { overallStatus: "fail", checks: { auth: { status: "fail" } } },
  );
  assert.throws(
    () => cli.parseJsonOutcome(
      ["doctor", "--json", "--all"],
      { ...failedHealth, stdout: "not json" },
      { allowNonzeroJson: true },
    ),
    /exited 1/,
  );
});

test("cli.codexSource explains where the binary came from", () => {
  // Do not poison the module's process-wide resolution cache with an invented path:
  // later tests exercise the same helper through the real IPC command.
  const where = cli.codexSource();
  assert.ok(typeof where.bin === "string" && where.bin.length > 0);
  assert.ok(typeof where.source === "string" && where.source.length > 0);
  assert.equal(typeof where.bundled, "boolean");
  assert.ok(["native", "batch", "unsupported"].includes(where.kind));
});

test("cli.launchSpec refuses batch shims rather than shell-parsing user input", () => {
  assert.throws(
    () => cli.launchSpec("C:/tools/codex.cmd", ["hello & goodbye", "%PATH%"]),
    (error) => error.code === "CODEX_UNSAFE_LAUNCHER" && /cannot preserve arbitrary Codex arguments/.test(error.message),
  );
  assert.equal(cli.launchSpec("C:/tools/codex.EXE", ["hello world"]).shell, false);
});

/* ------------------------------------------------------------------ config */

const config = require(join(root, "electron", "lib", "config.js"));

test("config.getPath walks a dotted key and reports a miss as undefined", () => {
  const root_ = { mcp_servers: { github: { enabled: false } }, model: "gpt-5.1" };
  assert.equal(config.getPath(root_, "mcp_servers.github.enabled"), false);
  assert.equal(config.getPath(root_, "model"), "gpt-5.1");
  assert.equal(config.getPath(root_, "mcp_servers.missing.enabled"), undefined);
  // A key that crosses a scalar must not throw.
  assert.equal(config.getPath(root_, "model.nested.deeper"), undefined);
});

test("config.setPath creates nested tables and round-trips through disk", () => {
  withTempHome(() => {
    config.setPath("mcp_servers.github.enabled", false);
    const read = config.readToml();
    assert.equal(read.mcp_servers.github.enabled, false);

    config.setPath("model", "gpt-5.1-codex-max");
    assert.equal(config.readToml().model, "gpt-5.1-codex-max");

    // Overwriting a scalar leaves its neighbours alone.
    config.setPath("mcp_servers.github.enabled", true);
    const after = config.readToml();
    assert.equal(after.mcp_servers.github.enabled, true);
    assert.equal(after.model, "gpt-5.1-codex-max");
  });
});

test("config.removePath deletes only the key it names", () => {
  withTempHome(() => {
    config.setPath("model", "o3");
    config.setPath("approval_policy", "untrusted");
    config.removePath("model");
    const read = config.readToml();
    assert.equal(read.model, undefined);
    assert.equal(read.approval_policy, "untrusted");
  });
});

test("config.writeText refuses invalid TOML and leaves the file untouched", () => {
  withTempHome(() => {
    config.writeText('model = "o3"\n');
    const before = config.readText();
    assert.throws(() => config.writeText("this is [not toml"), /refusing to write invalid TOML/);
    assert.equal(config.readText(), before);
  });
});

test("config.writeText backs the previous file up before replacing it", () => {
  withTempHome((home) => {
    config.writeText('model = "o3"\n');
    const result = config.writeText('model = "gpt-5.1"\n');
    assert.ok(result.backup, "a backup path should be reported");
    assert.ok(existsSync(result.backup), "the backup should exist on disk");
    assert.match(readFileSync(result.backup, "utf8"), /o3/);
    assert.match(config.readText(), /gpt-5\.1/);
    assert.ok(result.path.startsWith(home));
  });
});

test("config.readToml surfaces a parse error naming the file", () => {
  withTempHome((home) => {
    mkdirSync(home, { recursive: true });
    writeFileSync(join(home, "config.toml"), "definitely [ not ] valid = = toml\n", "utf8");
    assert.throws(() => config.readToml(), /config\.toml does not parse/);
  });
});

/* ------------------------------------------------------------------ skills */

const catalog = require(join(root, "electron", "lib", "catalog.js"));

test("catalog.skillList reads user skills and honours the .disabled suffix", () => {
  withTempHome((home) => {
    const skills = join(home, "skills");
    mkdirSync(join(skills, "release-notes"), { recursive: true });
    writeFileSync(
      join(skills, "release-notes", "SKILL.md"),
      "name: release-notes\ndescription: Drafts release notes.\n",
      "utf8",
    );
    mkdirSync(join(skills, "repo-triage.disabled"), { recursive: true });
    writeFileSync(join(skills, "repo-triage.disabled", "SKILL.md"), "name: repo-triage\n", "utf8");

    const list = catalog.skillList(null);
    const byName = Object.fromEntries(list.map((s) => [s.name, s]));
    assert.equal(byName["release-notes"].enabled, true);
    assert.equal(byName["release-notes"].desc, "Drafts release notes.");
    assert.equal(byName["repo-triage"].enabled, false, "a .disabled suffix means off");
  });
});

test("catalog.skillToggle renames the directory both ways", () => {
  withTempHome((home) => {
    const dir = join(home, "skills", "demo");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "SKILL.md"), "name: demo\n", "utf8");

    const off = catalog.skillToggle(dir);
    assert.ok(off.to.endsWith(".disabled"));
    assert.ok(!existsSync(dir));

    const on = catalog.skillToggle(off.to);
    assert.ok(!on.to.endsWith(".disabled"));
    assert.ok(existsSync(dir));
  });
});

test("catalog.skillToggle refuses a directory that is not a skill", () => {
  withTempHome((home) => {
    const dir = join(home, "not-a-skill");
    mkdirSync(dir, { recursive: true });
    assert.throws(() => catalog.skillToggle(dir), /is not a skill directory/);
  });
});

test("catalog.hookList reports untrusted hooks as present but off", () => {
  withTempHome(() => {
    config.writeText(
      [
        "[hooks.pre-tool-use]",
        'name = "block-force-push"',
        'command = "python block.py"',
        "trusted = true",
        "",
        "[hooks.post-tool-use]",
        'name = "audit"',
        'command = "node audit.js"',
        "trusted = false",
        "",
      ].join("\n"),
    );
    const hooks = catalog.hookList();
    const byName = Object.fromEntries(hooks.map((h) => [h.name, h]));
    assert.equal(byName["block-force-push"].trusted, true);
    assert.equal(byName["block-force-push"].enabled, true, "a trusted hook defaults to on");
    assert.equal(byName["audit"].trusted, false);
    assert.equal(byName["audit"].enabled, false, "an untrusted hook is never on");
  });
});

test("catalog.hookToggle refuses to enable an untrusted hook", () => {
  withTempHome(() => {
    config.writeText(
      ['[hooks.post-tool-use]', 'name = "audit"', 'command = "node audit.js"', "trusted = false", ""].join("\n"),
    );
    assert.throws(() => catalog.hookToggle("post-tool-use", 0), /untrusted hooks never run/);
  });
});

/* ----------------------------------------------------------------- history */

const history = require(join(root, "electron", "lib", "history.js"));

test("history records real changes and never rewrites them", { skip: !hasGit() && "git is not installed" }, () => {
  withTempHome(() => {
    const first = history.commit("Created the Personal profile", "profile", { profiles: ["personal"] });
    assert.equal(first.committed, true);

    // An unchanged state records nothing, so the panel stays a list of real events.
    const repeat = history.commit("Created the Personal profile", "profile", { profiles: ["personal"] });
    assert.equal(repeat.committed, false);

    const second = history.commit("Deleted the GitHub account", "account", { profiles: [] });
    assert.equal(second.committed, true);

    const log = history.log(10);
    assert.equal(log.commits.length, 2);
    assert.equal(log.commits[0].message, "Deleted the GitHub account");
    assert.equal(log.commits[0].kind, "account");
    assert.equal(log.commits[1].message, "Created the Personal profile");

    // Reading an older revision returns exactly what was stored, and the newer one
    // is still there afterwards — history is append-only.
    const older = history.show(log.commits[1].id);
    assert.deepEqual(older, { profiles: ["personal"] });
    assert.equal(history.log(10).commits.length, 2);
  });
});

test("history.log is empty, not an error, before anything is committed", { skip: !hasGit() && "git is not installed" }, () => {
  withTempHome(() => {
    const log = history.log(10);
    assert.deepEqual(log.commits, []);
  });
});

/* ----------------------------------------------------------------- editors */

const editors = require(join(root, "electron", "lib", "editors.js"));

test("editors.detect returns a well-formed list", () => {
  const { editors: found } = editors.detect();
  assert.ok(Array.isArray(found));
  for (const e of found) {
    assert.ok(e.id && typeof e.id === "string");
    assert.ok(e.label && typeof e.label === "string");
    assert.ok(e.exe && typeof e.exe === "string");
  }
});

test("editors.open refuses a path that does not exist", () => {
  assert.throws(() => editors.open(join(tmpdir(), "definitely-not-here-4821"), null, null), /does not exist/);
});

/* --------------------------------------------------------------------- wsl */

const wsl = require(join(root, "electron", "lib", "wsl.js"));

test("wsl.list always answers, even with no WSL installed", async () => {
  const listed = await wsl.list();
  assert.ok(Array.isArray(listed.distros));
  assert.equal(typeof listed.instances, "object");
});

test("wsl.stop on an unknown session reports absent rather than throwing", () => {
  const result = wsl.stop("no-such-session");
  assert.equal(result.status, "absent");
});

/* ------------------------------------------------------------- run control */

/** Does this pid still name a live process? Signal 0 asks the OS without touching it. */
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Poll until `check` holds. A kill is asynchronous however it is issued, so the
 *  alternative is a fixed sleep that is either flaky or needlessly slow. */
async function until(check, ms = 8000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return check();
}

/** A process that outlives the test unless something actually kills it. */
function sleeper() {
  return spawn(process.execPath, ["-e", "setTimeout(() => {}, 120000);"], {
    windowsHide: true,
    stdio: "ignore",
  });
}

function reap(pid) {
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    /* already gone, which is what the test wanted anyway */
  }
}

test("cli.killTree reports false for a pid nothing is using", () => {
  // The whole point of the Stop path: a run that ended a moment before the user
  // reached the button is answered with `false`, never an exception.
  assert.equal(cli.killTree(2_147_483_646), false);
  assert.equal(cli.killTree(0), false);
  assert.equal(cli.killTree(-1), false);
  assert.equal(cli.killTree(undefined), false);
  assert.equal(cli.killTree("1234"), false);
});

test("cli.killTree kills the process and everything under it", async () => {
  // `codex` is spawned through a shell and spawns children of its own, so killing the
  // pid Node reports is not enough — this asserts the grandchild dies too.
  const script =
    "const { spawn } = require('node:child_process');" +
    "const kid = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 120000);'], { stdio: 'ignore' });" +
    "console.log(kid.pid);" +
    "setTimeout(() => {}, 120000);";
  const parent = spawn(process.execPath, ["-e", script], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  });
  const grandchild = await new Promise((resolve, reject) => {
    let buffer = "";
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    const timer = setTimeout(
      () => finish(reject, new Error("the child never reported its own child's pid")),
      15000,
    );
    parent.stdout.setEncoding("utf8");
    parent.stdout.on("data", (chunk) => {
      buffer += chunk;
      const nl = buffer.indexOf("\n");
      if (nl !== -1) finish(resolve, Number(buffer.slice(0, nl).trim()));
    });
    parent.on("error", (error) => finish(reject, error));
    parent.on("exit", (code) => {
      if (!settled) finish(reject, new Error(`the child exited ${code} before reporting its child's pid`));
    });
  });

  try {
    assert.ok(alive(parent.pid), "the parent should be running before it is killed");
    assert.ok(alive(grandchild), "the grandchild should be running before it is killed");

    assert.equal(cli.killTree(parent.pid), true);
    assert.ok(await until(() => !alive(parent.pid)), "the parent should be gone");
    assert.ok(await until(() => !alive(grandchild)), "the grandchild should be gone too");
  } finally {
    reap(grandchild);
    reap(parent.pid);
  }
});

function argvFixture() {
  const dir = mkdtempSync(join(tmpdir(), "codex argv fixture "));
  const executable = join(dir, cli.WIN ? "node copy.exe" : "node copy");
  const script = join(dir, "print argv.js");
  copyFileSync(process.execPath, executable);
  chmodSync(executable, 0o755);
  writeFileSync(script, "process.stdout.write(JSON.stringify(process.argv.slice(2)) + '\\n');\n", "utf8");
  return { dir, executable, script };
}

test("cli.stream preserves every argv item without shell interpretation", async () => {
  const fixture = argvFixture();
  const child = { value: null };
  const expected = [
    "hello world",
    "",
    'a "quoted" value',
    "trailing\\\\",
    "廣東話 🥟",
    "line one\nline two",
    "-leading-option",
    "a&b|c<d>e^f(g)h%i!j",
    "%PATH%",
  ];
  const lines = [];
  try {
    const out = await cli.stream(
      fixture.executable,
      [fixture.script].concat(expected),
      { onSpawn: (c) => { child.value = c; } },
      (line) => lines.push(line),
    );
    assert.ok(child.value, "onSpawn should have been called");
    assert.equal(typeof child.value.pid, "number");
    assert.equal(out.code, 0);
    assert.deepEqual(lines.map((line) => line.level), ["out"]);
    assert.deepEqual(JSON.parse(lines[0].text), expected);
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
});

test("cli.runProgram reports nonzero exits even when stdout is valid JSON", async () => {
  const out = await cli.runProgram(
    process.execPath,
    ["-e", "process.stdout.write('{\\\"looks\\\":\\\"valid\\\"}'); process.stderr.write('nope'); process.exit(7);"],
    { timeout: 5000 },
  );
  assert.equal(out.ok, false);
  assert.equal(out.code, 7);
  assert.equal(out.exitCode, 7);
  assert.equal(out.stdout, '{"looks":"valid"}');
  assert.equal(out.stderr, "nope");
  assert.equal(out.timedOut, false);
});

test("cli.runProgram distinguishes launch failures and timeouts", async () => {
  const missing = join(tmpdir(), "codex-studio-no-such-program.exe");
  const absent = await cli.runProgram(missing, [], { timeout: 1000 });
  assert.equal(absent.ok, false);
  assert.equal(absent.systemCode, "ENOENT");
  assert.match(absent.stderr, /could not start/);

  const slow = await cli.runProgram(
    process.execPath,
    ["-e", "setTimeout(() => {}, 120000);"],
    { timeout: 100 },
  );
  assert.equal(slow.ok, false);
  assert.equal(slow.timedOut, true);
});

test("cli.stream contains callback failures and reaps the child", async () => {
  await assert.rejects(
    cli.stream(
      process.execPath,
      ["-e", "console.log('ready'); setTimeout(() => {}, 120000);"],
      {},
      () => { throw new Error("line callback failed"); },
    ),
    /line callback failed/,
  );

  await assert.rejects(
    cli.stream(
      process.execPath,
      ["-e", "setTimeout(() => {}, 120000);"],
      { onSpawn: () => { throw new Error("spawn callback failed"); } },
      () => {},
    ),
    /spawn callback failed/,
  );
});

/** commands.js is Electron main-process code, but everything it does about runs is
 *  plain Node. Standing in a minimal `electron` lets these tests call the handlers the
 *  app really registers — testing a hand-written copy of the logic would only ever
 *  prove the copy right. */
function loadCommands() {
  const handlers = new Map();
  const quitHooks = [];
  const commandsPath = join(root, "electron", "commands.js");
  const electronPath = createRequire(commandsPath).resolve("electron");
  require.cache[electronPath] = {
    id: electronPath,
    filename: electronPath,
    path: dirname(electronPath),
    loaded: true,
    children: [],
    paths: [],
    parent: null,
    exports: {
      ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
      app: {
        isPackaged: false,
        on: (event, fn) => {
          if (event === "before-quit") quitHooks.push(fn);
        },
      },
    },
  };
  return { commands: require(commandsPath), handlers, quitHooks };
}

const { commands: commandsModule, handlers: ipc, quitHooks } = loadCommands();
const invoke = (name, args) => ipc.get(name)(null, args || {});

test("codex_run conversation mode streams semantic events and returns the canonical transcript", async () => {
  const previous = {
    headless: process.env.CODEX_STUDIO_HEADLESS,
    fixture: process.env.CODEX_STUDIO_CONVERSATION_FIXTURE,
    runtime: process.env.CODEX_STUDIO_CONVERSATION_RUNTIME,
    log: process.env.CODEX_STUDIO_CONVERSATION_LOG,
  };
  const dir = mkdtempSync(join(tmpdir(), "codex conversation fixture "));
  const logFile = join(dir, "argv.jsonl");
  const target = {
    isDestroyed: () => false,
    webContents: { send: (_channel, payload) => streamed.push(payload) },
  };
  const streamed = [];
  const prompt = 'hello "quoted" & 廣東話\nline two %PATH%!';

  try {
    process.env.CODEX_STUDIO_HEADLESS = "1";
    process.env.CODEX_STUDIO_CONVERSATION_FIXTURE = join(root, "tools", "conversation-fixture.cjs");
    process.env.CODEX_STUDIO_CONVERSATION_RUNTIME = process.execPath;
    process.env.CODEX_STUDIO_CONVERSATION_LOG = logFile;
    commandsModule.setWindow(target);

    const result = await invoke("codex_run", {
      id: "conversation-initial",
      args: ["exec", "--profile", "A B", "--json", prompt],
      stream: "codex://stdout",
      protocol: "conversation",
    });

    assert.equal(result.code, 0);
    assert.equal(result.conversation.status, "completed");
    assert.equal(result.conversation.threadId, "smoke-thread-蝦餃");
    assert.equal(result.conversation.text, "Initial answer from the authored conversation fixture.");
    assert.equal(result.conversation.partial, "");
    assert.deepEqual(
      streamed.map((entry) => entry.event.kind),
      ["thread", "message", "complete"],
    );
    assert.ok(streamed.every((entry) => entry.protocol === "conversation"));
    assert.ok(streamed.every((entry) => !entry.text), "conversation events should never carry raw JSON as prose");

    const rows = readFileSync(logFile, "utf8").trim().split(/\r?\n/).map(JSON.parse);
    assert.deepEqual(rows[0].argv, ["exec", "--profile", "A B", "--json", prompt]);
  } finally {
    commandsModule.setWindow(null);
    for (const [key, value] of Object.entries(previous)) {
      const env = key === "headless"
        ? "CODEX_STUDIO_HEADLESS"
        : key === "fixture"
          ? "CODEX_STUDIO_CONVERSATION_FIXTURE"
          : key === "runtime"
            ? "CODEX_STUDIO_CONVERSATION_RUNTIME"
            : "CODEX_STUDIO_CONVERSATION_LOG";
      if (value === undefined) delete process.env[env];
      else process.env[env] = value;
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("codex_cancel answers for a run that is not running instead of throwing", async () => {
  const unknown = await invoke("codex_cancel", { id: "run-never-existed" });
  assert.equal(unknown.cancelled, false);
  assert.match(unknown.reason, /already finished/);

  // Stop pressed a moment after a run ended on its own is not an error, so nothing
  // here rejects — a rejection would put a red notification on a successful run.
  const nameless = await invoke("codex_cancel", {});
  assert.equal(nameless.cancelled, false);
  assert.ok(nameless.reason, "a refusal should say why");
});

test("codex_running lists the live runs and codex_cancel kills one", async () => {
  assert.deepEqual((await invoke("codex_running")).ids, [], "nothing is running yet");

  const child = sleeper();
  commandsModule.runs.set("run-alpha", { child, pid: child.pid, startedAt: Date.now(), cancelled: false });
  try {
    const listed = await invoke("codex_running");
    assert.deepEqual(listed.ids, ["run-alpha"]);
    assert.equal(listed.runs[0].pid, child.pid);

    const stopped = await invoke("codex_cancel", { id: "run-alpha" });
    assert.equal(stopped.cancelled, true);
    assert.equal(stopped.pid, child.pid);
    assert.ok(await until(() => !alive(child.pid)), "the run's process should be gone");
  } finally {
    reap(child.pid);
    commandsModule.runs.delete("run-alpha");
  }
});

test("quitting kills every tracked run", async () => {
  assert.ok(quitHooks.length > 0, "commands.js should register a before-quit hook");

  const first = sleeper();
  const second = sleeper();
  commandsModule.runs.set("run-one", { child: first, pid: first.pid, startedAt: Date.now(), cancelled: false });
  commandsModule.runs.set("run-two", { child: second, pid: second.pid, startedAt: Date.now(), cancelled: false });
  try {
    for (const hook of quitHooks) hook();
    assert.equal(commandsModule.runs.size, 0, "a quit should leave nothing tracked");
    assert.ok(await until(() => !alive(first.pid)), "the first run should be gone");
    assert.ok(await until(() => !alive(second.pid)), "the second run should be gone");
  } finally {
    reap(first.pid);
    reap(second.pid);
    commandsModule.runs.clear();
  }
});

/* ------------------------------------------------------------- preload IPC */

test("every command the preload exposes is registered by the main process", () => {
  const preload = readFileSync(join(root, "electron", "preload.js"), "utf8");
  const commands = readFileSync(join(root, "electron", "commands.js"), "utf8");

  const exposed = [...preload.matchAll(/^\s{2}"([a-z_]+)",$/gm)].map((m) => m[1]);
  assert.ok(exposed.length > 30, `expected the preload to list the command surface, saw ${exposed.length}`);

  // The Stop button is only real if both halves of it are wired: named here, and
  // registered over there.
  for (const name of ["codex_cancel", "codex_running"]) {
    assert.ok(exposed.includes(name), `${name} should be exposed to the renderer`);
  }

  const registered = new Set([...commands.matchAll(/^command\("([a-z_]+)"/gm)].map((m) => m[1]));
  const missing = exposed.filter((name) => !registered.has(name));
  assert.deepEqual(
    missing,
    [],
    // A name in one list and not the other is a command the UI can call and the
    // backend will refuse — which shows up as a mystery error at runtime.
    `these are exposed to the renderer but never registered: ${missing.join(", ")}`,
  );
});
