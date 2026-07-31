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
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
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

test("cli.codexSource explains where the binary came from", () => {
  const previous = process.env.CODEX_BIN;
  process.env.CODEX_BIN = "C:/somewhere/codex.exe";
  try {
    // The resolution is cached after the first call, so this only holds when the
    // override is the first thing asked for — which is why it is asserted on the
    // shape rather than on a specific answer.
    const where = cli.codexSource();
    assert.ok(typeof where.bin === "string" && where.bin.length > 0);
    assert.ok(typeof where.source === "string" && where.source.length > 0);
    assert.equal(typeof where.bundled, "boolean");
  } finally {
    if (previous === undefined) delete process.env.CODEX_BIN;
    else process.env.CODEX_BIN = previous;
  }
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
    parent.stdout.setEncoding("utf8");
    parent.stdout.on("data", (chunk) => {
      buffer += chunk;
      const nl = buffer.indexOf("\n");
      if (nl !== -1) resolve(Number(buffer.slice(0, nl).trim()));
    });
    parent.on("error", reject);
    setTimeout(() => reject(new Error("the child never reported its own child's pid")), 15000);
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

test("cli.stream hands the caller the child the moment it starts", async () => {
  const child = { value: null };
  // Quoted because stream() runs through a shell on Windows, where the node path
  // contains a space.
  const program = cli.WIN ? `"${process.execPath}"` : process.execPath;
  const lines = [];
  const out = await cli.stream(
    program,
    ["-e", cli.WIN ? '"console.log(1)"' : "console.log(1)"],
    { onSpawn: (c) => { child.value = c; } },
    (line) => lines.push(line),
  );
  assert.ok(child.value, "onSpawn should have been called");
  assert.equal(typeof child.value.pid, "number");
  assert.equal(out.code, 0);
  assert.deepEqual(lines.map((l) => l.text), ["1"]);
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

/* ------------------------------------------------- dim sum release codenames */

const roster = JSON.parse(readFileSync(join(root, "app", "dimsum", "roster.json"), "utf8"));

function codename(...args) {
  const out = execFileSync(process.execPath, [join(root, "tools", "release-codename.mjs"), ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  return JSON.parse(out);
}

test("the roster names every catalog dish in both languages, with unique ids", () => {
  assert.ok(Array.isArray(roster.dishes) && roster.dishes.length > 0, "the roster lists no dishes");
  assert.equal(
    roster.dishes.length,
    roster.named,
    "the roster's own count disagrees with the list it ships",
  );
  const ids = roster.dishes.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids would make --derive ambiguous");
  for (const d of roster.dishes) {
    assert.ok(d.en && d.en.trim(), `${d.id} has no English name`);
    assert.ok(d.yue && d.yue.trim(), `${d.id} has no Cantonese name`);
    assert.ok(d.slug && d.slug.trim(), `${d.id} has no slug — the release asset is named from it`);
  }
});

test("every roster entry claiming a bundled photo has one on disk", () => {
  for (const d of roster.dishes) {
    if (!d.image) continue;
    const path = join(root, "app", d.image);
    assert.ok(existsSync(path), `${d.id} names ${d.image}, which is not bundled — the release would 404`);
  }
});

test("a build past the bundled photo slice is still named", () => {
  // The defect this pins: the index came from the run number while the roster was the
  // 72-dish photo slice, so every build past 72 published with no code name at all.
  const bundled = roster.withBundledImage;
  assert.ok(roster.dishes.length > bundled, "the roster must outrun the photo slice, or it fixes nothing");

  const beyond = codename("--derive", String(bundled + 1));
  assert.equal(beyond.assigned, true, `build ${bundled + 1} lost its code name: ${beyond.reason || ""}`);
  assert.ok(beyond.codeName.includes("·"), "a code name carries both languages");
  assert.equal(beyond.bundledImage, null, "a dish outside the photo slice must not claim a photo");

  const inside = codename("--derive", "1");
  assert.equal(inside.assigned, true, "build 1 should be named");
  assert.ok(inside.bundledImage, "build 1 is inside the photo slice and should carry its photo");
  assert.ok(existsSync(join(root, "app", inside.bundledImage)), "the photo it names is not on disk");
});

test("two different builds never share a code name", () => {
  const seen = new Map();
  for (const n of [1, 2, 3, 72, 73, 400, roster.dishes.length]) {
    const dish = codename("--derive", String(n));
    assert.equal(dish.assigned, true, `build ${n} was not named`);
    assert.ok(!seen.has(dish.codeName), `builds ${seen.get(dish.codeName)} and ${n} both got ${dish.codeName}`);
    seen.set(dish.codeName, n);
  }
});

test("running out of dishes reports itself and never blocks a release", () => {
  const past = codename("--derive", String(roster.dishes.length + 1));
  assert.equal(past.assigned, false, "there is no dish that far out, so it must not claim one");
  assert.ok(past.reason && past.reason.length > 0, "an unnamed build must say why");
  // execFileSync would have thrown on a non-zero exit. A release is never gated on
  // decoration: the installers are the point, the code name is a label beside them.
});
