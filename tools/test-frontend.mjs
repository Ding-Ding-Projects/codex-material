#!/usr/bin/env node
/* Codex Studio — frontend test runner.
   Run with `node tools/test-frontend.mjs`. No npm install, no jsdom, no build
   step: the app's modules are plain IIFEs that assign to `window`, so each one is
   read off disk and evaluated in a node:vm context holding a minimal browser
   shim. That keeps the tests honest — they exercise the exact bytes the WebView2
   runtime will load, not a transpiled copy.

   A module that has not been written yet is skipped with a message rather than
   failed, so this runner is useful from the first file onwards. A module that
   exists but does not expose the surface these tests probe for IS a failure, and
   the message names every identifier that was tried. */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------------------------------------------------------------- reporting */

const summary = new Map();

function bucket(file) {
  if (!summary.has(file)) summary.set(file, { pass: 0, fail: 0, skip: 0, note: "" });
  return summary.get(file);
}

function unit(file, name, fn, options) {
  test(`${file} — ${name}`, options || {}, async (t) => {
    try {
      await fn(t);
      bucket(file).pass += 1;
    } catch (error) {
      bucket(file).fail += 1;
      process.exitCode = 1;
      throw error;
    }
  });
}

function skipFile(file, why) {
  const entry = bucket(file);
  entry.skip += 1;
  entry.note = why;
  test(`${file} — skipped`, { skip: why }, () => {});
}

process.on("exit", () => {
  const width = Math.max(...[...summary.keys()].map((k) => k.length), 10);
  const lines = ["", "Codex Studio frontend modules"];
  for (const [file, s] of summary) {
    const label = file.padEnd(width);
    if (s.skip && !s.pass && !s.fail) lines.push(`  ${label}  skipped — ${s.note}`);
    else if (s.fail) lines.push(`  ${label}  ${s.fail} failed, ${s.pass} passed`);
    else lines.push(`  ${label}  ${s.pass} passed`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n"));
});

/* ------------------------------------------------------------ browser shim */

function makeElement(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    children: [],
    attributes: {},
    style: {},
    dataset: {},
    className: "",
    textContent: "",
    innerHTML: "",
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute(key, value) { this.attributes[key] = String(value); },
    getAttribute(key) { return key in this.attributes ? this.attributes[key] : null; },
    removeAttribute(key) { delete this.attributes[key]; },
    appendChild(child) { this.children.push(child); return child; },
    append(...kids) { this.children.push(...kids); },
    insertBefore(child) { this.children.unshift(child); return child; },
    remove() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    closest: () => null,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    focus() {},
    blur() {}
  };
}

function makeDocument() {
  return {
    documentElement: makeElement("html"),
    head: makeElement("head"),
    body: makeElement("body"),
    createElement: (tag) => makeElement(tag),
    createElementNS: (_ns, tag) => makeElement(tag),
    createTextNode: (text) => ({ nodeType: 3, textContent: String(text) }),
    createDocumentFragment: () => makeElement("#fragment"),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {}
  };
}

/** Console output the tests can inspect — a module that "warns instead of
    throwing" has to leave a trace somewhere, and this is it. */
function makeConsole(log) {
  const record = (level) => (...args) => {
    log.push({ level, text: args.map((a) => (typeof a === "string" ? a : String(a))).join(" ") });
  };
  return { log: record("log"), info: record("info"), warn: record("warn"), error: record("error"), debug: record("debug") };
}

function makeContext() {
  const consoleLog = [];
  const storage = new Map();
  const ctx = {
    console: makeConsole(consoleLog),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    URL,
    TextEncoder,
    TextDecoder,
    performance: { now: () => Number(process.hrtime.bigint()) / 1e6 },
    localStorage: {
      getItem: (k) => (storage.has(String(k)) ? storage.get(String(k)) : null),
      setItem: (k, v) => { storage.set(String(k), String(v)); },
      removeItem: (k) => { storage.delete(String(k)); },
      clear: () => storage.clear(),
      key: (i) => [...storage.keys()][i] ?? null,
      get length() { return storage.size; }
    },
    navigator: { language: "en-US", languages: ["en-US"], userAgent: "node" },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init && init.detail; }
    }
  };
  ctx.document = makeDocument();
  ctx.window = ctx;
  ctx.self = ctx;
  ctx.__log = consoleLog;
  return vm.createContext(ctx);
}

function evaluateInto(ctx, relative) {
  const absolute = path.join(ROOT, relative);
  vm.runInContext(fs.readFileSync(absolute, "utf8"), ctx, { filename: absolute });
  return ctx;
}

/** Declare a module's tests. `body` only runs when the file is on disk and
    evaluates cleanly; anything else becomes a skip or a single failing test. */
function suite(relative, body, dependencies) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    skipFile(relative, "file does not exist yet");
    return;
  }
  let ctx;
  try {
    ctx = makeContext();
    for (const dep of dependencies || []) {
      if (fs.existsSync(path.join(ROOT, dep))) evaluateInto(ctx, dep);
    }
    evaluateInto(ctx, relative);
  } catch (error) {
    unit(relative, "loads without throwing", () => { throw error; });
    return;
  }
  body(ctx, relative);
}

/* ------------------------------------------------------------ shape probing */

/** Anything a module returns carries the vm realm's prototypes, so a structurally
    identical array would still fail deepStrictEqual. Normalise before comparing. */
function plain(value) {
  return JSON.parse(JSON.stringify(value === undefined ? null : value));
}

function probe(object, names) {
  if (!object) return undefined;
  for (const name of names) {
    if (object[name] !== undefined && object[name] !== null) return object[name];
  }
  return undefined;
}

function require_(value, what, names) {
  assert.ok(
    value !== undefined && value !== null,
    `${what} was not found — probed for ${names.map((n) => `\`${n}\``).join(", ")}`
  );
  return value;
}

function requireFn(value, what, names) {
  require_(value, what, names);
  assert.equal(typeof value, "function", `${what} must be a function, got ${typeof value}`);
  return value;
}

/** Call `fn` with each candidate argument list until one produces an acceptable
    result. These modules are new enough that their exact signature is not pinned
    yet; the assertions on the *result* are what matters and stay strict. */
function callAny(fn, argSets, accept, what) {
  const tried = [];
  for (const args of argSets) {
    try {
      const out = fn(...args);
      if (accept(out)) return out;
      tried.push(`${JSON.stringify(args)} → unusable result`);
    } catch (error) {
      tried.push(`${JSON.stringify(args)} → ${error.message}`);
    }
  }
  assert.fail(`${what} did not answer any known call shape:\n    ${tried.join("\n    ")}`);
}

/* ------------------------------------------------------------- TOML subset */

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let quoted = false;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === "\\") i += 1;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === "[") depth += 1;
    else if (c === "]") depth -= 1;
    else if (c === "," && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.filter((p) => p.trim() !== "");
}

function parseTomlValue(raw, line) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return splitTopLevel(raw.slice(1, -1)).map((p) => parseTomlValue(p.trim(), line));
  }
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) return JSON.parse(raw);
  throw new Error(`line ${line}: TOML would reject the value ${raw}`);
}

/** A deliberately small TOML reader. It accepts only what a real parser accepts,
    so anything CX.toToml emits that trips it up is a genuine defect, not a gap in
    the fixture. */
function parseToml(text) {
  const root = {};
  let table = root;
  String(text).split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      table = header[1]
        .split(".")
        .reduce((node, key) => (node[key] = node[key] || {}), root);
      return;
    }
    const eq = line.indexOf("=");
    if (eq === -1) throw new Error(`line ${index + 1}: not a TOML statement — ${raw}`);
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error(`line ${index + 1}: TOML would reject the bare key ${key}`);
    table[key] = parseTomlValue(line.slice(eq + 1).trim(), index + 1);
  });
  return root;
}

/* ================================================================ codex-core */

suite("app/codex-core.js", (ctx, file) => {
  const CX = ctx.CX;

  unit(file, "exports the documented runtime surface", () => {
    assert.ok(CX, "codex-core.js must assign window.CX");
    for (const key of ["bridge", "store", "toToml", "evaluate", "color", "i18n", "narrator", "vcs", "LIMITS"]) {
      assert.ok(CX[key] !== undefined, `CX.${key} is missing`);
    }
    assert.equal(CX.bridge.mode, "browser", "with no CODEX_BRIDGE present the bridge must fall back, not throw");
  });

  unit(file, "the colour translator is bidirectional", () => {
    /* The panel prints twelve representations of the current colour. It used to read
       exactly one of them back, so it would show you `oklch(0.85 0.06 300)` and then
       reject that string if you typed it into the field underneath. The proof is a
       round trip: emit every space, parse each one, and confirm the colour survives —
       taking the arithmetic on trust is how an inverse transform ends up subtly wrong
       in one space and nobody notices for a year. */
    const C = CX.color;
    requireFn(C.parse, "CX.color.parse", ["parse"]);
    const COLOURS = ["#D0BCFF", "#FF6347", "#008080", "#000000", "#FFFFFF", "#F2B8B5", "#4B0082"];
    let worst = 0;
    for (const hex of COLOURS) {
      const rows = C.translate(hex);
      assert.ok(rows.length >= 12, `translate() should emit every space, got ${rows.length}`);
      for (const [space, text] of rows) {
        const back = C.parse(text);
        assert.ok(back, `${space} emitted "${text}" and parse() could not read it back`);
        const a = C.hexToRgb(hex), b = C.hexToRgb(back);
        const d = Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
        worst = Math.max(worst, d);
        assert.ok(d <= 3, `${space}: ${hex} -> "${text}" -> ${back} drifted ${d} per channel`);
      }
    }
    assert.ok(worst <= 3, `worst round-trip drift was ${worst}`);

    // Named colours, alpha, and an honest null for anything that is not a colour.
    assert.equal(C.parse("tomato"), "#ff6347");
    assert.equal(C.parse("TOMATO"), "#ff6347", "names are case-insensitive");
    assert.equal(C.parse("rgb(255 99 71 / 0.5)"), "#ff634780", "alpha must survive, not be dropped");
    assert.equal(C.parse("rgb(255,99,71)"), "#ff6347", "the legacy comma form must parse");
    for (const junk of ["not a colour", "rgb(a b c)", "", null, "wat(1 2 3)"]) {
      assert.equal(C.parse(junk), null, `parse(${JSON.stringify(junk)}) must return null, never a guess`);
    }
  });

  unit(file, "evaluate refuses catastrophic backtracking instead of freezing", () => {
    // A single RegExp.exec cannot be interrupted from JavaScript, so the ms budget
    // only helps BETWEEN matches. These shapes spend their whole time inside one
    // call and would hang the window outright — they have to be refused up front.
    const evil = "a".repeat(30) + "!";
    for (const pattern of ["(a+)+$", "(a+){1,20}$", "(a+){1,10}$", "(a|a)*$", "(x|xx)+y"]) {
      const started = Date.now();
      const res = CX.evaluate(pattern, "gi", evil);
      const elapsed = Date.now() - started;
      assert.equal(res.ok, false, `${pattern} should be refused`);
      assert.match(res.error, /^Refused: /, `${pattern} must say plainly that it was refused`);
      assert.ok(elapsed < 250, `${pattern} took ${elapsed}ms — it should be refused, not run`);
      assert.ok(res.refused && res.refused.length > 2, `${pattern} should name its offending fragment`);
    }
    // Calibrated against the real engine rather than folklore. Each of these was
    // measured with a raw RegExp on 26 hostile characters; the guard has to agree
    // with the stopwatch in both directions. Over-refusing is a real cost: the
    // previous rule rejected every repeated group containing an unbounded quantifier
    // anywhere, which killed "(\.\w+)+$" and "[A-Z][a-z]+(\s[A-Z][a-z]+)*" —
    // both measuring 0.0 ms — while missing "(a?a?)+$" at 195 seconds.
    const MEASURED_CATASTROPHIC = ["(a+)+$", "(a?a?)+$", "([a-z]*)+$", "(a|a)*$", "(a+|b)+$", "([a-z]?[a-z]?)+$", "((a+))+$"];
    const MEASURED_FINE = ["(a+a)+$", "(ab)+$", "(a+b)+$", "([A-Z][a-z]+)+$", "(\.\w+)+$",
      "(\s[A-Z][a-z]+)*$", "(\s*,\s*)+$", "(?:abc)+$", "(foo|bar)+$", "(https?://)+"];
    for (const pattern of MEASURED_CATASTROPHIC) {
      const r = CX.evaluate(pattern, "g", evil);
      assert.equal(r.ok, false, `${pattern} was measured as catastrophic and must be refused`);
    }
    for (const pattern of MEASURED_FINE) {
      const r = CX.evaluate(pattern, "g", "abc.tar.gz Hello World foo, bar https://x");
      assert.notEqual(r.ok, false, `${pattern} was measured at ~0 ms and must not be refused: ${r.error}`);
    }

    // The refusal must state the reason that actually applies. "(a?)+" returns in a
    // fraction of a millisecond — telling the user it would hang the window is false,
    // and a message that cries catastrophe every time teaches people to ignore it.
    const nullableMsg = CX.evaluate("(a?)+", "g", "aaa").error;
    const unanchoredMsg = CX.evaluate("(a+)+$", "g", "aaa").error;
    const branchesMsg = CX.evaluate("(a|a)*", "g", "aaa").error;
    assert.match(nullableMsg, /match nothing/, "a nullable body must be described as nullable");
    assert.match(unanchoredMsg, /fixed number of times|anchor/, "an unanchored body must be described as unanchored");
    assert.match(branchesMsg, /branches/, "overlapping branches must be described as such");
    assert.ok(new Set([nullableMsg, unanchoredMsg, branchesMsg]).size === 3,
      "the three refusal shapes must not share one message");

    // Bounding the outer repeat is not a fix, so the message must not suggest it.
    const advice = CX.evaluate("(a+)+$", "g", "aaa").error;
    assert.ok(!/for example \{1,20\}/.test(advice), "the remedy must not recommend the worse rewrite");

    // And the ordinary patterns a user actually types still work.
    for (const [pattern, sample, expect] of [
      ["^(mcp|plugin)-", "mcp-server", 1],
      ["(ab){1,3}", "ababab", 1],
      ["\\d+", "abc 123", 1],
      ["^(a|b)+$", "ababab", 1],
    ]) {
      const res = CX.evaluate(pattern, "gi", sample);
      assert.equal(res.ok, true, `${pattern} should be allowed: ${res.error}`);
      assert.equal(res.matches.length, expect);
    }
  });

  unit(file, "evaluate terminates on a zero-width match", () => {
    for (const pattern of ["a*", "(?:)", "\\b"]) {
      const res = CX.evaluate(pattern, "g", "bbb ccc");
      assert.equal(res.ok, true, `${pattern}: ${res.error}`);
      assert.equal(res.timedOut, false, `${pattern} must finish, not hit the time guard`);
      assert.ok(res.matches.length > 0, `${pattern} matched nothing`);
      assert.ok(res.matches.length <= CX.LIMITS.matches);
      let previous = -1;
      for (const m of res.matches) {
        assert.ok(m.index > previous, `${pattern} stalled: two matches at index ${m.index}`);
        previous = m.index;
      }
    }
  }, { timeout: 5000 });

  unit(file, "evaluate reports an invalid pattern instead of throwing", () => {
    for (const pattern of ["(unclosed", "a{2,1}", "[z-a]", "(?<=*)"]) {
      const res = CX.evaluate(pattern, "", "sample text");
      assert.equal(res.ok, false, `${pattern} should have been rejected`);
      assert.ok(typeof res.error === "string" && res.error.length > 0, `${pattern} gave no reason`);
      assert.equal(res.matches.length, 0);
    }
    const empty = CX.evaluate("", "", "sample");
    assert.equal(empty.ok, false);
    assert.match(empty.error, /Empty pattern/);
  });

  unit(file, "evaluate honours its match cap and its size bounds", () => {
    const sample = "a".repeat(CX.LIMITS.matches + 120);
    const capped = CX.evaluate("a", "g", sample);
    assert.equal(capped.matches.length, CX.LIMITS.matches);
    assert.equal(capped.truncated, true, "hitting the cap must be reported, not hidden");

    const under = CX.evaluate("a", "g", "aaa");
    assert.equal(under.truncated, false);

    const hugeSample = CX.evaluate("a", "", "x".repeat(CX.LIMITS.sample + 1));
    assert.equal(hugeSample.ok, false);
    assert.ok(hugeSample.error.includes(String(CX.LIMITS.sample)), hugeSample.error);

    const hugePattern = CX.evaluate("a".repeat(CX.LIMITS.pattern + 1), "", "aaa");
    assert.equal(hugePattern.ok, false);
    assert.ok(hugePattern.error.includes(String(CX.LIMITS.pattern)), hugePattern.error);
  });

  unit(file, "evaluate reports capture groups and named groups", () => {
    const res = CX.evaluate("(?<key>\\w+)=(\\w+)", "g", "model=fast mode=safe");
    assert.equal(res.ok, true, res.error);
    assert.equal(res.matches.length, 2);
    assert.deepEqual(plain(res.matches[0].groups), ["model", "fast"]);
    assert.equal(res.matches[0].named.key, "model");
    assert.equal(res.matches[1].index, "model=fast ".length);
  });

  unit(file, "color.translate round-trips a known hex", () => {
    const rows = new Map(CX.color.translate("#3366ff"));
    for (const space of ["HEX", "HEX8", "RGB", "RGBA", "HSL", "HSV", "HWB", "LAB", "LCH", "OKLAB", "OKLCH", "CMYK"]) {
      assert.ok(rows.has(space), `the translator is missing ${space}`);
    }
    assert.equal(rows.get("HEX"), "#3366FF");
    assert.equal(rows.get("RGB"), "rgb(51 102 255)");
    assert.equal(rows.get("HSL"), "hsl(225 100% 60%)");

    // Shorthand in, canonical out, and back again with no drift.
    assert.equal(new Map(CX.color.translate("#fff")).get("HEX"), "#FFFFFF");
    assert.equal(CX.color.rgbToHex(CX.color.hexToRgb("#3366ff")).toLowerCase(), "#3366ff");
    assert.equal(CX.color.hexToRgb("#3366ff").a, 1);

    assert.deepEqual(plain(CX.color.translate("nonsense")), [], "an unparseable colour must translate to nothing, not to NaN");
    assert.equal(CX.color.hexToRgb("#12345"), null);

    const white = CX.color.hexToRgb("#ffffff");
    const black = CX.color.hexToRgb("#000000");
    assert.equal(Math.round(CX.color.contrast(white, black)), 21);
  });

  unit(file, "toToml emits parseable TOML for nested keys", () => {
    const toml = CX.toToml({
      model: "gpt-5.1-codex-max",
      "tools.web_search": true,
      "mcp_servers.github.command": "gh-mcp",
      "mcp_servers.github.args": ["serve", "--json"],
      "sandbox_workspace_write.network_access": false,
      "history.max_bytes": 1048576,
      dropped_empty: "",
      dropped_null: null
    });
    const parsed = parseToml(toml);

    assert.equal(parsed.model, "gpt-5.1-codex-max");
    assert.equal(parsed.tools.web_search, true);
    assert.equal(parsed.mcp_servers.github.command, "gh-mcp");
    assert.deepEqual(plain(parsed.mcp_servers.github.args), ["serve", "--json"]);
    assert.equal(parsed.sandbox_workspace_write.network_access, false);
    assert.equal(parsed.history.max_bytes, 1048576);
    assert.ok(!("dropped_empty" in parsed), "a blank value must not be written as an override");
    assert.ok(!("dropped_null" in parsed), "a null value must not be written as an override");

    // Root scalars have to precede the first table header or TOML re-reads them
    // as members of that table.
    const firstHeader = toml.indexOf("[");
    assert.ok(firstHeader === -1 || toml.indexOf("model =") < firstHeader, toml);

    const nothing = CX.toToml({});
    assert.deepEqual(parseToml(nothing), {}, nothing);
    assert.match(nothing, /^#/, "an empty override set must say so in a comment, not be blank");
  });

  unit(file, "i18n renders every mode and both funny levels", () => {
    const { i18n } = CX;
    i18n.mode = "en";
    i18n.funny = { en: 1, yue: 1 };
    assert.equal(i18n.t("act.run"), "Run");
    assert.equal(i18n.t("nav.session"), "Session");

    i18n.mode = "yue";
    assert.equal(i18n.t("act.run"), "執行", "level 1 Cantonese is the professional wording");
    i18n.funny.yue = 5;
    const loud = i18n.t("act.run");
    assert.notEqual(loud, "執行", "level 5 must actually differ, or the slider is not wired");

    i18n.mode = "bi";
    const both = i18n.t("act.run");
    assert.ok(both.includes("Run"), both);
    assert.ok(both.includes(loud), both);

    assert.equal(i18n.t("no.such.key"), "no.such.key", "a missing key must degrade to its own name");
  });
});

/* =================================================================== cx-i18n */

const PLACEHOLDER = /\{[A-Za-z0-9_.]+\}/g;

function placeholders(text) {
  return new Set(String(text).match(PLACEHOLDER) || []);
}

function i18nRoot(ctx) {
  const direct = probe(ctx, ["CX_I18N", "CXI18N", "CX_LANG", "I18N"]);
  if (direct) return direct;
  return probe(ctx.CX || {}, ["i18n", "I18N", "lang", "strings"]);
}

function i18nTable(root) {
  const named = probe(root, ["T", "TABLE", "table", "STRINGS", "strings", "KEYS", "keys", "entries", "messages"]);
  if (named && typeof named === "object") return named;
  // The module may export the table itself; accept it when its values look like
  // entries rather than functions.
  const values = Object.values(root || {});
  if (values.length && values.every((v) => Array.isArray(v) || (v && typeof v === "object"))) return root;
  return null;
}

function sideOf(entry, lang) {
  if (Array.isArray(entry)) return lang === "en" ? entry[0] : entry[1];
  if (entry && typeof entry === "object") {
    if (lang === "en") return entry.en ?? entry.english;
    return entry.yue ?? entry.zh ?? entry.hk ?? entry.cantonese;
  }
  return undefined;
}

/** The five funny levels for one key in one language. A bare string means the key
    reads the same at every level (a proper noun, a version number); an array must
    carry exactly one entry per level. */
function levelsOf(entry, lang) {
  const side = sideOf(entry, lang);
  if (typeof side === "string") return [side, side, side, side, side];
  if (Array.isArray(side)) return side;
  return null;
}

/** Render one key at one mode and one funny level. The module owns its own
    signature — positional `(key, mode, funny)` or a mode carried on the object —
    so try each in turn and fail with everything that was attempted. */
function renderAt(root, render, key, mode, lvl) {
  const funny = { en: lvl, yue: lvl };
  const attempts = [
    () => render.call(root, key, mode, funny),
    () => render.call(root, key, mode, lvl),
    () => render.call(root, key, { mode, funny }),
    () => { root.mode = mode; root.funny = funny; return render.call(root, key); }
  ];
  const tried = [];
  for (const attempt of attempts) {
    try {
      const out = attempt();
      if (typeof out === "string" && out.length > 0 && out !== key) return out;
      tried.push(`returned ${JSON.stringify(out)}`);
    } catch (error) {
      tried.push(error.message);
    }
  }
  assert.fail(`could not render \`${key}\` in ${mode} mode at level ${lvl}:\n    ${tried.join("\n    ")}`);
}

suite("app/cx-i18n.js", (ctx, file) => {
  const root = i18nRoot(ctx);
  const table = root ? i18nTable(root) : null;
  const keys = table ? Object.keys(table).filter((k) => levelsOf(table[k], "en") !== null) : [];

  unit(file, "exports a key table", () => {
    require_(root, "the i18n export", ["window.CX_I18N", "window.CXI18N", "window.I18N", "CX.i18n"]);
    require_(table, "the string table", ["T", "TABLE", "STRINGS", "KEYS", "entries", "messages"]);
    assert.ok(keys.length > 0, "the string table is empty");
  });

  unit(file, "every key has exactly 5 levels in both languages", () => {
    assert.ok(keys.length > 0, "no keys to check");
    for (const key of keys) {
      for (const lang of ["en", "yue"]) {
        const side = sideOf(table[key], lang);
        assert.ok(side !== undefined && side !== null, `${key} has no ${lang} copy`);
        if (Array.isArray(side)) {
          assert.equal(side.length, 5, `${key}.${lang} has ${side.length} levels, not 5`);
        }
        const levels = levelsOf(table[key], lang);
        assert.equal(levels.length, 5, `${key}.${lang} does not resolve to 5 levels`);
        levels.forEach((text, i) => {
          assert.equal(typeof text, "string", `${key}.${lang} level ${i + 1} is not a string`);
          assert.ok(text.trim().length > 0, `${key}.${lang} level ${i + 1} is blank`);
        });
      }
    }
  });

  unit(file, "the funny sliders actually change the copy", () => {
    for (const lang of ["en", "yue"]) {
      const varying = keys.filter((k) => {
        const levels = levelsOf(table[k], lang);
        return levels[0] !== levels[4];
      });
      assert.ok(
        varying.length > 0,
        `no ${lang} key differs between level 1 and level 5 — the slider would be inert`
      );
    }
  });

  unit(file, "error and warning placeholders survive every funny level", () => {
    // Matched anywhere in the key, because these categories are named both as a
    // prefix (`err.mcpAddFailed`) and as a segment (`notify.error`).
    const risky = keys.filter((k) =>
      /(^|\.)(err|error|warn|warning|danger|destructive|confirm|security|fail|failed)(\.|$)/.test(k)
    );
    assert.ok(
      risky.length > 0,
      `the table has no error or warning keys at all — the categories that must never lose a fact are unwritten (${keys.length} keys present)`
    );
    for (const key of risky) {
      for (const lang of ["en", "yue"]) {
        const levels = levelsOf(table[key], lang);
        const required = placeholders(levels[0]);
        levels.forEach((text, i) => {
          for (const token of required) {
            assert.ok(
              text.includes(token),
              `${key}.${lang} level ${i + 1} dropped ${token} — the message would name nothing the user can act on:\n    ${text}`
            );
          }
        });
      }
    }
  });

  unit(file, "no key drops a placeholder as the level rises", () => {
    for (const key of keys) {
      for (const lang of ["en", "yue"]) {
        const levels = levelsOf(table[key], lang);
        const required = placeholders(levels[0]);
        levels.forEach((text, i) => {
          for (const token of required) {
            assert.ok(text.includes(token), `${key}.${lang} level ${i + 1} dropped ${token}`);
          }
        });
      }
    }
  });

  unit(file, "bilingual mode joins both languages at every funny level", () => {
    const names = ["t", "resolve", "render", "format", "text", "translate", "get", "str", "s"];
    const render = requireFn(probe(root, names), "the render function", names);
    const sample = keys.find((k) => {
      const en = levelsOf(table[k], "en");
      const yue = levelsOf(table[k], "yue");
      return en && yue && en[0] !== yue[0];
    });
    assert.ok(sample, "every key reads identically in both languages, so bilingual mode cannot be checked");

    for (const lvl of [1, 2, 3, 4, 5]) {
      const en = renderAt(root, render, sample, "en", lvl);
      const yue = renderAt(root, render, sample, "yue", lvl);
      const bi = renderAt(root, render, sample, "bi", lvl);
      assert.equal(en, levelsOf(table[sample], "en")[lvl - 1], `en level ${lvl} rendered the wrong row`);
      assert.equal(yue, levelsOf(table[sample], "yue")[lvl - 1], `yue level ${lvl} rendered the wrong row`);
      assert.ok(bi.includes(en), `bilingual level ${lvl} dropped the English side: ${bi}`);
      assert.ok(bi.includes(yue), `bilingual level ${lvl} dropped the Cantonese side: ${bi}`);
      assert.ok(bi.length > en.length, `bilingual level ${lvl} returned only one language: ${bi}`);
    }
  });
});

/* ================================================================= cx-dimsum */

function dishField(dish, names) {
  const direct = probe(dish, names);
  if (typeof direct === "string") return direct;
  return undefined;
}

function dishName(dish, lang) {
  const flat = dishField(dish, lang === "en" ? ["en", "nameEn", "english"] : ["yue", "zh", "nameYue", "cantonese", "chinese"]);
  if (flat) return flat;
  const nested = dish.name;
  if (nested && typeof nested === "object") return probe(nested, lang === "en" ? ["en"] : ["yue", "zh"]);
  if (lang === "en" && typeof nested === "string") return nested;
  return undefined;
}

function dishAlt(dish, lang) {
  const flat = dishField(dish, lang === "en" ? ["altEn"] : ["altYue", "altZh"]);
  if (flat) return flat;
  const nested = dish.alt || dish.altText;
  if (typeof nested === "string" && lang === "en") return nested;
  if (nested && typeof nested === "object") return probe(nested, lang === "en" ? ["en"] : ["yue", "zh"]);
  return undefined;
}

suite("app/cx-dimsum.js", (ctx, file) => {
  const root = probe(ctx, ["CX_DIMSUM", "CXDIMSUM", "DIMSUM"]) || probe(ctx.CX || {}, ["dimsum", "dimSum"]);
  const dishes = Array.isArray(root) ? root : probe(root || {}, ["DISHES", "dishes", "list", "items", "all"]);

  unit(file, "ships at least 14 dishes with unique ids", () => {
    require_(root, "the dim sum export", ["window.CX_DIMSUM", "window.DIMSUM", "CX.dimsum"]);
    require_(dishes, "the dish list", ["DISHES", "dishes", "list", "items", "all"]);
    assert.ok(Array.isArray(dishes), "the dish list must be an array");
    assert.ok(dishes.length >= 14, `only ${dishes.length} dishes — the surprise needs at least 14`);
    const ids = dishes.map((d) => d.id);
    assert.ok(ids.every((id) => typeof id === "string" && id.length > 0), "every dish needs a string id");
    assert.equal(new Set(ids).size, ids.length, `duplicate dish ids: ${ids.join(", ")}`);
  });

  unit(file, "every dish is named and described in both languages", () => {
    for (const dish of dishes) {
      for (const lang of ["en", "yue"]) {
        const name = dishName(dish, lang);
        assert.ok(name && name.trim().length > 0, `${dish.id} has no ${lang} name`);
        const alt = dishAlt(dish, lang);
        assert.ok(
          alt && alt.trim().length > 0,
          `${dish.id} has no ${lang} alt text — a screen-reader user would get no dish at all`
        );
      }
      const yue = dishName(dish, "yue");
      assert.match(yue, /[㐀-鿿]/, `${dish.id}'s Cantonese name is not written in Chinese: ${yue}`);
    }
  });

  unit(file, "the art is a bundled local asset that fetches nothing", () => {
    for (const dish of dishes) {
      const art = dishField(dish, ["art", "svg", "image", "icon", "src"]);
      assert.ok(art, `${dish.id} has no art`);
      const trimmed = art.trim();

      if (trimmed.startsWith("<svg")) {
        assert.ok(trimmed.includes("</svg>"), `${dish.id}'s inline art is not closed`);
        // The SVG namespace URL is an identifier, never fetched, so it is stripped
        // before the check; anything else beginning with http would be a network
        // asset, which the bundled-assets rule forbids.
        const bare = trimmed.replace(/xmlns(:\w+)?="http[^"]*"/g, "");
        assert.ok(!/http/i.test(bare), `${dish.id}'s art reaches out to the network`);
        assert.ok(!/data:image/i.test(bare), `${dish.id}'s art embeds a raster image`);
        assert.ok(!/<script/i.test(bare), `${dish.id}'s art carries a script`);
        continue;
      }

      // A file reference instead: it has to resolve inside the app directory and
      // actually be on disk, or the surprise renders as a broken image.
      assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(trimmed), `${dish.id}'s art carries a URL scheme: ${trimmed}`);
      assert.ok(!trimmed.startsWith("//"), `${dish.id}'s art is a protocol-relative URL: ${trimmed}`);
      assert.ok(!trimmed.startsWith("/"), `${dish.id}'s art is an absolute path, not a bundled one: ${trimmed}`);
      assert.ok(!trimmed.includes(".."), `${dish.id}'s art escapes the app directory: ${trimmed}`);
      const onDisk = path.join(ROOT, "app", trimmed);
      assert.ok(
        fs.existsSync(onDisk),
        `${dish.id}'s art is not bundled — ${path.relative(ROOT, onDisk)} is missing from the repository`
      );
    }
  });

  unit(file, "draw(0) never fires and draw(1) always does", () => {
    const draw = requireFn(probe(root, ["draw", "roll", "maybe", "pick"]), "draw()", ["draw", "roll", "maybe", "pick"]);
    for (let i = 0; i < 50; i += 1) {
      assert.ok(!draw.call(root, 0), "draw(0) means a zero percent chance and must never produce a dish");
    }
    for (let i = 0; i < 50; i += 1) {
      const shown = draw.call(root, 1);
      assert.ok(shown, "draw(1) means a certainty and must always produce a dish");
      const id = typeof shown === "object" ? shown.id : shown;
      assert.ok(dishes.some((d) => d.id === id), `draw(1) returned something that is not a listed dish: ${id}`);
    }
  }, { timeout: 5000 });
});

/* ============================================================== cx-changelog */

const CHANGELOG_FIXTURE = [
  "# Changelog",
  "",
  "## 0.3.0 — 2026-07-28",
  "### Added",
  "- Tab groups with per-group appearance editing.",
  "- A regex builder anchored beside every search bar.",
  "### Fixed",
  "- Overflowed tabs are listed in the More menu instead of being clipped.",
  "",
  "## 0.2.0 — 2026-06-14",
  "### Added",
  "- A Cantonese funny-level slider, independent of the English one.",
  "### Security",
  "- Hooks marked untrusted can no longer be enabled from the GUI.",
  "",
  "## 0.1.0 — 2026-05-02",
  "### Added",
  "- First build.",
  ""
].join("\n");

function entriesOf(value) {
  if (Array.isArray(value)) return value;
  const list = probe(value || {}, ["entries", "versions", "releases", "items", "results"]);
  return Array.isArray(list) ? list : null;
}

function versionsOf(value) {
  const entries = entriesOf(value);
  if (!entries) return null;
  return plain(entries.map((e) => String(probe(e, ["version", "id", "tag", "name"]) ?? "")));
}

function warningsOf(out, ctx) {
  const carried = out && Array.isArray(out.warnings) ? [...out.warnings] : [];
  const logged = ctx.__log.filter((l) => l.level === "warn" || l.level === "error").map((l) => l.text);
  return carried.concat(logged);
}

suite("app/cx-changelog.js", (ctx, file) => {
  const root = probe(ctx, ["CX_CHANGELOG", "CHANGELOG"]) || probe(ctx.CX || {}, ["changelog"]);
  const parse = probe(root || {}, ["parse", "parseChangelog", "read", "fromMarkdown", "load"]);
  const filterFn = probe(root || {}, ["filter", "apply", "query", "search", "select", "view"]);
  const exportFn = probe(root || {}, ["exportView", "export", "toMarkdown", "toText", "exportAs"]);

  const parsed = typeof parse === "function" ? parse.call(root, CHANGELOG_FIXTURE) : null;

  // The date range and the search are two separate arguments precisely so that
  // neither can stand in for the other; the fallbacks keep the test readable if
  // the module ever folds them into one options object.
  const runFilter = (range, query) =>
    callAny(
      filterFn.bind(root),
      [[parsed, range, query], [parsed, Object.assign({}, range, query)], [parsed, { range, query }]],
      (out) => entriesOf(out) !== null,
      "filter()"
    );

  unit(file, "parses every released version out of the changelog", () => {
    requireFn(parse, "parse()", ["parse", "parseChangelog", "read", "fromMarkdown"]);
    const versions = versionsOf(parsed);
    require_(versions, "the parsed entry list", ["entries", "versions", "releases", "items"]);
    assert.deepEqual(versions, ["0.3.0", "0.2.0", "0.1.0"], "every version must be listed, not just the newest");

    const first = entriesOf(parsed)[0];
    const date = String(probe(first, ["date", "at", "released", "releasedAt"]) ?? "");
    assert.ok(date.includes("2026-07-28"), `0.3.0's date did not survive parsing: ${date}`);
    const body = JSON.stringify(first);
    assert.ok(body.includes("Added"), "the change categories must survive parsing");
    assert.ok(body.includes("Fixed"), "every category must survive parsing, not only the first");
    assert.ok(body.includes("More menu"), "the change text must survive parsing");
    assert.equal(warningsOf(parsed, ctx).length, 0, "a well-formed changelog must not warn");
  });

  unit(file, "the date filter and the text query compose rather than override", () => {
    requireFn(filterFn, "filter()", ["filter", "apply", "query", "search", "select"]);
    const range = { from: "2026-06-01", to: "2026-12-31" };

    const byDate = runFilter(range, null);
    assert.deepEqual(versionsOf(byDate), ["0.3.0", "0.2.0"], "the date filter alone must drop only 0.1.0");

    const byText = runFilter(null, { text: "regex" });
    assert.deepEqual(versionsOf(byText), ["0.3.0"], "the text query alone must keep only the regex entry");

    const both = runFilter(range, { text: "slider" });
    assert.deepEqual(versionsOf(both), ["0.2.0"], "date and query must intersect, not replace one another");

    const disjoint = runFilter({ from: "2026-07-01", to: "2026-12-31" }, { text: "slider" });
    assert.deepEqual(
      versionsOf(disjoint),
      [],
      "a range that excludes the only text match must return nothing, not fall back to whichever filter still matched"
    );

    const everything = runFilter(null, null);
    assert.deepEqual(versionsOf(everything), ["0.3.0", "0.2.0", "0.1.0"], "an empty filter must not hide anything");

    // The search bar is wired to the regex builder, so a pattern has to compose
    // with the date range on exactly the same terms as plain text.
    const byRegex = runFilter(range, { regex: { pattern: "^Tab groups", flags: "i" } });
    assert.deepEqual(versionsOf(byRegex), ["0.3.0"]);
    const bad = runFilter(null, { regex: { pattern: "(unclosed", flags: "" } });
    assert.ok(entriesOf(bad) !== null, "an invalid pattern must still return a view, not throw");
    assert.ok(bad.error, "an invalid pattern must be reported so the user can fix it");
  });

  unit(file, "malformed input warns instead of throwing", () => {
    for (const bad of ["", "   \n  ", "just a sentence with no version headings", null, undefined, 42]) {
      ctx.__log.length = 0;
      let out;
      assert.doesNotThrow(() => { out = parse.call(root, bad); }, `parse(${JSON.stringify(bad)}) threw`);
      const entries = entriesOf(out);
      assert.ok(entries !== null, `parse(${JSON.stringify(bad)}) returned something with no entry list`);
      assert.equal(entries.length, 0, `parse(${JSON.stringify(bad)}) invented ${entries.length} entries`);
      assert.ok(
        warningsOf(out, ctx).length > 0,
        `parse(${JSON.stringify(bad)}) failed silently — nothing warned and no warnings were returned`
      );
    }

    // A heading that is not a version number is still a heading: it is recorded
    // as the author wrote it and flagged, rather than invented or dropped.
    ctx.__log.length = 0;
    const odd = parse.call(root, "## not-a-version\n- something");
    assert.equal(entriesOf(odd).length, 1);
    assert.ok(warningsOf(odd, ctx).length > 0, "an undated version heading must be flagged");
  });

  unit(file, "exportView writes exactly what the filter left on screen", () => {
    requireFn(exportFn, "exportView()", ["exportView", "export", "toMarkdown", "toText"]);
    const range = { from: "2026-06-01", to: "2026-06-30" };
    const view = runFilter(range, null);
    const text = callAny(
      exportFn.bind(root),
      [[parsed, range, null, "markdown"], [parsed, range, null], [view, "markdown"], [view]],
      (out) => typeof out === "string" && out.length > 0,
      "exportView()"
    );
    assert.ok(text.includes("0.2.0"), "the exported view is missing the version it contains");
    assert.ok(text.includes("slider"), "the exported view is missing the change text");
    assert.ok(!text.includes("0.3.0"), "the export must match the filter, not dump the whole changelog");
    assert.ok(!text.includes("0.1.0"), "the export must match the filter, not dump the whole changelog");
    assert.ok(text.includes("2026-06-01") && text.includes("2026-06-30"), "the export must state the range it covers");
  });
}, ["app/codex-core.js"]);

/* ------------------------------------------------------------ the gallery */
/* The README's screenshot table, the manifest and the PNGs on disk are three
   descriptions of one thing, so any two of them can disagree. They did: a
   `--only` capture rewrote the manifest down to a single shot, and three
   screenshots sat in the repository for a week with no row in the table while
   the README told readers the descriptions came from the manifest. */

test("assets/screenshots — README, manifest and disk agree", () => {
  const dir = path.join(ROOT, "assets", "screenshots");
  const b = bucket("assets/screenshots");
  if (!fs.existsSync(dir)) {
    b.skip += 1;
    b.note = "no screenshots captured yet";
    return;
  }

  const pngs = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8"));
  const described = new Set(manifest.shots.map((s) => s.file));

  const run = (name, fn) => {
    try {
      fn();
      b.pass += 1;
    } catch (e) {
      b.fail += 1;
      process.stdout.write(`  ✗ ${name}\n    ${e.message}\n`);
      throw e;
    }
  };

  run("every screenshot on disk appears in the README", () => {
    const orphans = pngs.filter((f) => !readme.includes(f));
    assert.deepEqual(orphans, [], `captured but never shown to a reader: ${orphans.join(", ")}`);
  });

  run("every screenshot the README links exists on disk", () => {
    const linked = [...readme.matchAll(/assets\/screenshots\/([\w.-]+\.png)/g)].map((m) => m[1]);
    const broken = [...new Set(linked)].filter((f) => !pngs.includes(f));
    assert.deepEqual(broken, [], `README links a screenshot that is not in the repository: ${broken.join(", ")}`);
  });

  run("the manifest describes every harness-captured shot", () => {
    /* 00- is the packaged-build hero shot, taken from the installed app rather
       than by the harness, so it has no manifest entry by design. */
    const missing = pngs.filter((f) => !f.startsWith("00-") && !described.has(f));
    assert.deepEqual(missing, [], `on disk with no description: ${missing.join(", ")}`);
  });

  run("every M3 token the UI references is actually defined", () => {
    /* An undefined custom property does not error — it silently resolves to nothing
       and the element inherits whatever colour was above it. That is how the one
       genuinely destructive button in the app came to render pale text on pale pink:
       `var(--m3-on-error)` was referenced and never declared. */
    const html = fs.readFileSync(path.join(ROOT, "app", "index.html"), "utf8");
    const declared = new Set([...html.matchAll(/(--m3-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const referenced = new Set([...html.matchAll(/var\((--m3-[a-z0-9-]+)\)/g)].map((m) => m[1]));
    const undef = [...referenced].filter((t) => !declared.has(t)).sort();
    assert.deepEqual(undef, [], `referenced but never declared: ${undef.join(", ")}`);
  });

  run("the harness captures against the fixture home, not the operator's", () => {
    /* The structural guard behind the privacy rule. Checking the PNGs themselves
       would need OCR; checking that the harness points the app at an authored
       CODEX_HOME is cheap and catches the only way the leak comes back. */
    const launcher = fs.readFileSync(path.join(ROOT, "tools", "capture.mjs"), "utf8");
    assert.match(launcher, /CODEX_HOME:\s*captureHome/, "capture.mjs must set CODEX_HOME to the fixture");
    assert.match(launcher, /make-capture-home\.mjs/, "capture.mjs must build the fixture before launching");
    const fixture = fs.readFileSync(path.join(ROOT, "tools", "make-capture-home.mjs"), "utf8");
    assert.ok(!/os\.homedir|USERPROFILE|process\.env\.HOME/.test(fixture),
      "the fixture must be authored, never derived from the machine running it");
  });

  run("the manifest holds no path that leaks a local username", () => {
    const raw = fs.readFileSync(path.join(dir, "manifest.json"), "utf8");
    assert.ok(!/[A-Za-z]:\\Users\\/.test(raw), "the committed manifest contains an absolute Windows user path");
    assert.ok(!/\/home\/[a-z]/.test(raw), "the committed manifest contains an absolute home path");
  });
});

/* Every user-visible string in the frontend must reach the interface through
   CX.i18n. A literal that slips back in renders English in Cantonese mode and is
   invisible to the smoke test, which only ever sees what the app happens to draw —
   so it is checked structurally here instead. */

test("app/index.html — no user-visible string bypasses CX.i18n", () => {
  const b = bucket("app/index.html");
  const src = fs.readFileSync(path.join(ROOT, "app", "index.html"), "utf8");

  /* Literals that are correct as literals, with the reason each one is exempt. A
     name is not translated out of its own language, and a command is not a word. */
  const ALLOWED = new Map([
    ["codex login", "the command being run"],
    ["codex logout", "the command being run"],
    ["codex cloud", "the command being run"],
    ["廣東話", "a language's name in its own language"],
    ["Georgia", "the typeface's own name"],
    ["Helvetica Neue", "the typeface's own name"],
    ["", "the sentinel the dropdown clears itself with"],
  ]);

  const run = (name, fn) => {
    try {
      fn();
      b.pass += 1;
    } catch (error) {
      b.fail += 1;
      process.exitCode = 1;
      throw error;
    }
  };

  for (const prop of ["label", "hint", "title", "desc", "subtitle", "placeholder"]) {
    run(`no hard-coded ${prop}`, () => {
      const found = [...src.matchAll(new RegExp(`\b${prop}: "([^"]*)"`, "g"))].map((m) => m[1]);
      const leaked = found.filter((text) => !ALLOWED.has(text));
      assert.deepEqual(
        leaked,
        [],
        `these ${prop} values never reach CX.i18n, so they stay English in every mode: ` +
          leaked.map((t) => JSON.stringify(t)).join(", "),
      );
    });
  }

  run("the slash wizard is rebuilt per render, not frozen at load", () => {
    /* It was a module-level const, so its CX.i18n.t() calls resolved exactly once and
       the dialog kept showing whatever language the app started in. */
    assert.match(src, /function slashWizards\(\) \{ return \{/, "slashWizards must be a function");
    assert.ok(!/const SLASH_WIZARDS =/.test(src), "SLASH_WIZARDS must not be a module-level const again");
  });

  run("every key the frontend asks for is defined in the table", () => {
    const table = fs.readFileSync(path.join(ROOT, "app", "cx-i18n.js"), "utf8");
    const defined = new Set([...table.matchAll(/^    "([\w.]+)": \{$/gm)].map((m) => m[1]));
    const asked = new Set([...src.matchAll(/CX\.i18n\.t\("([\w.]+)"/g)].map((m) => m[1]));
    // A literal ending in a dot is a prefix being concatenated with an id at runtime
    // — t("nav." + n.id) — so there is no whole key here to look up.
    const missing = [...asked].filter((k) => !k.endsWith(".") && !defined.has(k));
    // resolve() returns the key itself when it is missing, so the interface would
    // render "menu.deleteSession" at the user rather than failing anywhere visible.
    assert.deepEqual(missing, [], `asked for but never defined: ${missing.join(", ")}`);
  });
});
