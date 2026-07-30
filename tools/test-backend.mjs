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
import { execFileSync } from "node:child_process";

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

/* ------------------------------------------------------------- preload IPC */

test("every command the preload exposes is registered by the main process", () => {
  const preload = readFileSync(join(root, "electron", "preload.js"), "utf8");
  const commands = readFileSync(join(root, "electron", "commands.js"), "utf8");

  const exposed = [...preload.matchAll(/^\s{2}"([a-z_]+)",$/gm)].map((m) => m[1]);
  assert.ok(exposed.length > 30, `expected the preload to list the command surface, saw ${exposed.length}`);

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
