/* Codex Studio — runtime core.
   Desktop-first: every backend call goes through bridge.invoke(), which routes to
   the Electron preload bridge when running inside the shell and to a local
   simulation when the same build is opened in a browser. */
(function (g) {
  "use strict";

  const store = {
    get(k, f) { try { const r = localStorage.getItem("codexstudio." + k); return r == null ? f : JSON.parse(r); } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem("codexstudio." + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ------------------------------------------------ desktop bridge
     Under Electron the preload exposes window.CODEX_BRIDGE — a fixed list of named
     commands, not a generic escape hatch. Opened in a plain browser the same build
     falls through to the simulation below, which is what makes this file openable as
     a design preview without a shell around it. */
  const bridge = {
    get host() { return g.CODEX_BRIDGE || null; },
    get available() { return !!g.CODEX_BRIDGE; },
    get mode() { return this.available ? "electron" : "browser"; },
    async invoke(cmd, args) {
      if (this.available) return await g.CODEX_BRIDGE.invoke(cmd, args || {});
      return await sim(cmd, args || {});
    },
    /** Returns an unsubscribe function in both modes, so a caller never has to ask
        which one it is running under. */
    listen(event, handler) {
      if (this.available) {
        try { return g.CODEX_BRIDGE.listen(event, handler); }
        catch (e) { return () => {}; }
      }
      return () => {};
    },
    window: {
      call(method) {
        try {
          if (g.CODEX_BRIDGE && g.CODEX_BRIDGE.window) g.CODEX_BRIDGE.window[method]();
        } catch (e) {}
      },
      minimize() { this.call("minimize"); },
      toggleMaximize() { this.call("toggleMaximize"); },
      close() { this.call("close"); }
    }
  };

  /* ------------------------------------------------ simulated backend */
  const state = {
    codexHome: "~/.codex",
    version: "codex-cli 0.58.0",
    auth: { method: "chatgpt", account: "ding@outlook.com", plan: "ChatGPT Pro", expires: "2026-09-02", apiKey: false },
    mcp: [
      { name: "lowlevel-computer-use", transport: "streamable-http", url: "http://127.0.0.1:8391/mcp", enabled: true, tools: 14, status: "connected", oauth: false },
      { name: "github", transport: "stdio", command: "gh-mcp", args: ["serve"], enabled: true, tools: 22, status: "connected", oauth: true },
      { name: "postgres", transport: "stdio", command: "npx", args: ["-y", "@mcp/postgres"], enabled: false, tools: 0, status: "disabled", oauth: false }
    ],
    plugins: [
      { name: "rust-analyzer-bridge", version: "0.4.1", marketplace: "official", enabled: true },
      { name: "figma-inspect", version: "1.2.0", marketplace: "community", enabled: false }
    ],
    marketplaces: [
      { name: "official", url: "https://plugins.codex.dev/index.json", plugins: 41 },
      { name: "community", url: "https://raw.githubusercontent.com/codex-community/registry/main/index.json", plugins: 118 }
    ],
    catalog: [
      { name: "rust-analyzer-bridge", marketplace: "official", version: "0.4.1", author: "codex", installs: 41200, tags: ["language", "rust"], desc: "Feeds rust-analyzer diagnostics and hover types back into the agent's context." },
      { name: "jest-runner", marketplace: "official", version: "2.1.0", author: "codex", installs: 38150, tags: ["testing", "node"], desc: "Runs the nearest Jest project and reports only the failing assertions." },
      { name: "pytest-focus", marketplace: "official", version: "1.6.3", author: "codex", installs: 29010, tags: ["testing", "python"], desc: "Selects the smallest failing pytest subset before a fix and re-runs it after." },
      { name: "sql-explain", marketplace: "official", version: "0.9.4", author: "codex", installs: 12840, tags: ["database"], desc: "Explains and costs a query plan before the agent proposes an index." },
      { name: "figma-inspect", marketplace: "community", version: "1.2.0", author: "lam", installs: 9310, tags: ["design"], desc: "Reads frames, tokens and component names from a Figma file into the thread." },
      { name: "k8s-context", marketplace: "community", version: "3.0.2", author: "okwan", installs: 7620, tags: ["devops"], desc: "Read-only cluster context: namespaces, workloads and recent events." },
      { name: "terraform-plan", marketplace: "community", version: "1.4.0", author: "okwan", installs: 6440, tags: ["devops", "iac"], desc: "Runs terraform plan in a scratch workspace and summarises the diff." },
      { name: "changelog-writer", marketplace: "community", version: "0.7.1", author: "mei", installs: 5980, tags: ["docs"], desc: "Drafts release notes from the commit range since the last tag." },
      { name: "screenshot-diff", marketplace: "community", version: "0.5.0", author: "mei", installs: 4110, tags: ["testing", "ui"], desc: "Captures before/after screenshots through the project's own harness and diffs them." },
      { name: "pnpm-workspace", marketplace: "official", version: "1.1.2", author: "codex", installs: 15230, tags: ["node", "monorepo"], desc: "Resolves which workspace packages a change affects before running scripts." },
      { name: "otel-trace-reader", marketplace: "community", version: "0.3.8", author: "sing", installs: 2870, tags: ["observability"], desc: "Pulls a trace by id and highlights the slowest spans for the agent." },
      { name: "secrets-guard", marketplace: "official", version: "2.0.0", author: "codex", installs: 22400, tags: ["security"], desc: "Blocks a patch that would commit a credential, before apply_patch runs." }
    ],
    skills: [
      { name: "agent-global-memory", path: "~/.agents/skills/agent-global-memory/SKILL.md", enabled: true, source: "user" },
      { name: "release-notes", path: "~/.codex/skills/release-notes/SKILL.md", enabled: true, source: "user" },
      { name: "repo-triage", path: "./.codex/skills/repo-triage/SKILL.md", enabled: false, source: "project" }
    ],
    hooks: [
      { event: "pre-tool-use", name: "block-force-push", command: "python3 .codex/hooks/block_force_push.py", trusted: true, enabled: true, scope: "project" },
      { event: "session-start", name: "load-context", command: "bash .codex/hooks/context.sh", trusted: true, enabled: true, scope: "project" },
      { event: "post-tool-use", name: "audit-log", command: "node ~/.codex/hooks/audit.js", trusted: false, enabled: false, scope: "user" }
    ],
    sessions: [
      { id: "0f2c1a54-1b7d-4c2b-9c31-2a6f0d51e7aa", name: "tauri shell wiring", cwd: "~/Documents/GitHub/codex", updated: "2026-07-29 14:12", turns: 38, archived: false, interactive: true },
      { id: "b7318e02-96d1-4c33-8bd4-99ad3a0f4c12", name: "sandbox policy audit", cwd: "~/Documents/GitHub/agent-global-memory", updated: "2026-07-28 09:41", turns: 12, archived: false, interactive: true },
      { id: "3aa61f88-3d0e-4a1e-9f77-6d8b1a2c5e40", name: "nightly exec run", cwd: "~/srv/ci", updated: "2026-07-27 03:02", turns: 4, archived: true, interactive: false }
    ],
    profiles: [
      { name: "default", model: "gpt-5.1-codex-max", approval: "on-request", sandbox: "workspace-write" },
      { name: "review", model: "gpt-5.1", approval: "untrusted", sandbox: "read-only" },
      { name: "ci", model: "gpt-5.1-codex-mini", approval: "never", sandbox: "danger-full-access" }
    ],
    cloudTasks: [
      { id: "task_8812", title: "Flaky windows sandbox test", status: "ready", env: "codex/codex", updated: "12 min ago" },
      { id: "task_8798", title: "Bump rmcp-client", status: "applied", env: "codex/codex", updated: "3 h ago" }
    ],
    usage: { input: 184320, output: 39210, cached: 96410, contextWindow: 400000, used: 128400, limitResets: "in 3 h 12 m" },
    wslDistros: ["Ubuntu-24.04", "Ubuntu-22.04", "Debian", "kali-linux", "Arch"],
    wsl: {}   // sessionId -> instance
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function sim(cmd, a) {
    await wait(90 + Math.random() * 180);
    switch (cmd) {
      case "codex_version": return { version: state.version, home: state.codexHome, bridge: "browser simulation" };
      case "codex_state": return JSON.parse(JSON.stringify(state));
      case "codex_read_config": return store.get("config", {});
      case "codex_write_config": store.set("config", a.config); return { written: true, path: state.codexHome + "/config.toml", bytes: (a.toml || "").length };
      case "codex_mcp_toggle": { const s = state.mcp.find((x) => x.name === a.name); if (s) { s.enabled = !s.enabled; s.status = s.enabled ? "connected" : "disabled"; } return state.mcp; }
      case "codex_mcp_add": state.mcp.push(Object.assign({ tools: 0, status: "connected", enabled: true }, a.server)); return state.mcp;
      case "codex_mcp_remove": state.mcp = state.mcp.filter((x) => x.name !== a.name); return state.mcp;
      case "codex_plugin_toggle": { const p = state.plugins.find((x) => x.name === a.name); if (p) p.enabled = !p.enabled; return state.plugins; }
      case "codex_plugin_install": {
        const c = state.catalog.find((x) => x.name === a.name);
        if (c && !state.plugins.some((p) => p.name === a.name)) state.plugins.push({ name: c.name, version: c.version, marketplace: c.marketplace, enabled: true });
        return state.plugins;
      }
      case "codex_plugin_uninstall": state.plugins = state.plugins.filter((p) => p.name !== a.name); return state.plugins;
      case "codex_marketplace_add": state.marketplaces.push({ name: a.name, url: a.url, plugins: 0 }); return state.marketplaces;
      case "codex_marketplace_remove": state.marketplaces = state.marketplaces.filter((m) => m.name !== a.name); return state.marketplaces;
      case "codex_skill_toggle": { const s = state.skills.find((x) => x.name === a.name); if (s) s.enabled = !s.enabled; return state.skills; }
      case "codex_hook_toggle": { const h = state.hooks.find((x) => x.name === a.name); if (h && h.trusted) h.enabled = !h.enabled; return state.hooks; }
      case "codex_session_action": {
        const s = state.sessions.find((x) => x.id === a.id);
        if (s && a.action === "archive") s.archived = true;
        if (s && a.action === "unarchive") s.archived = false;
        if (a.action === "delete") state.sessions = state.sessions.filter((x) => x.id !== a.id);
        return state.sessions;
      }
      case "codex_login": state.auth = Object.assign({}, state.auth, { method: a.method, account: a.method === "api" ? "API key (sk-…" + Math.random().toString(36).slice(2, 6) + ")" : state.auth.account }); return state.auth;
      case "codex_logout": state.auth = { method: "none", account: null, plan: null, expires: null, apiKey: false }; return state.auth;
      case "codex_doctor": return doctor();
      case "codex_wsl_list": return state.wsl;
      case "codex_wsl_spawn": {
        state.wsl[a.session] = {
          session: a.session, distro: a.distro || state.wslDistros[0], status: "running",
          pid: 1000 + Math.floor(Math.random() * 9000), startedAt: Date.now(),
          cwd: a.cwd || "/mnt/c/Users/ding", memMB: 180 + Math.floor(Math.random() * 400), auto: a.auto !== false
        };
        return state.wsl[a.session];
      }
      case "codex_wsl_stop": { if (state.wsl[a.session]) state.wsl[a.session].status = "stopped"; return state.wsl[a.session] || null; }
      case "codex_wsl_kill": { delete state.wsl[a.session]; return state.wsl; }
      case "codex_wsl_set": { if (state.wsl[a.session]) Object.assign(state.wsl[a.session], a.patch || {}); return state.wsl[a.session] || null; }
      case "codex_wsl_exec": {
        const i = state.wsl[a.session];
        return { code: 0, lines: [
          { level: "cmd", text: "wsl -d " + (i ? i.distro : state.wslDistros[0]) + " --cd " + (i ? i.cwd : "~") + " -- " + a.command },
          { level: "dim", text: "pid " + (i ? i.pid : "—") + " · linux 6.6 · " + (i ? i.distro : "no instance") }
        ] };
      }
      case "codex_run": return run(a);
      case "codex_features": return store.get("features", {});
      case "codex_set_feature": { const f = store.get("features", {}); f[a.key] = a.value; store.set("features", f); return f; }
      default: throw new Error("unknown command " + cmd);
    }
  }

  function doctor() {
    return {
      at: Date.now(),
      groups: [
        { name: "Installation", checks: [
          { name: "codex binary", ok: true, detail: state.version + " · /usr/local/bin/codex" },
          { name: "update channel", ok: true, detail: "latest — no update available" },
          { name: "CODEX_HOME", ok: true, detail: state.codexHome }
        ]},
        { name: "Configuration", checks: [
          { name: "config.toml parses", ok: true, detail: "no unknown keys" },
          { name: "requirements.toml", ok: true, detail: "not present (no managed policy)" },
          { name: "profiles", ok: true, detail: state.profiles.map((p) => p.name).join(", ") }
        ]},
        { name: "Authentication", checks: [
          { name: "credentials", ok: state.auth.method !== "none", detail: state.auth.method === "none" ? "logged out" : state.auth.method + " · " + state.auth.account },
          { name: "credential store", ok: true, detail: "file (~/.codex/auth.json)" }
        ]},
        { name: "Runtime", checks: [
          { name: "sandbox", ok: true, detail: "seatbelt/landlock available" },
          { name: "git", ok: true, detail: "git 2.51.0" },
          { name: "MCP servers", ok: state.mcp.every((m) => m.status !== "error"), detail: state.mcp.filter((m) => m.enabled).length + " enabled" },
          { name: "state DB", ok: true, detail: "sqlite ok · 41 MB" }
        ]}
      ]
    };
  }

  const TRANSCRIPT = [
    { role: "reasoning", text: "Reading the workspace and locating the Tauri entry point." },
    { role: "tool", tool: "shell", text: "rg -n \"tauri::Builder\" src-tauri/src", out: "src-tauri/src/main.rs:42: tauri::Builder::default()" },
    { role: "assistant", text: "The builder registers the invoke handler in `src-tauri/src/main.rs:42`. I'll add the new `codex_run` command next to it and stream stdout through an event channel so the GUI can render output as it arrives." },
    { role: "tool", tool: "apply_patch", text: "apply_patch src-tauri/src/main.rs", out: "M src-tauri/src/main.rs (+34 −2)" },
    { role: "assistant", text: "Done. `codex_run` now spawns the CLI with the flags the GUI composed and emits `codex://stdout` events per line." }
  ];

  function run(a) {
    const lines = [{ level: "cmd", text: a.command }];
    lines.push({ level: "dim", text: `workdir ${a.cwd || "~/Documents/GitHub/codex"}` });
    if (/--yolo|dangerously-bypass/.test(a.command)) lines.push({ level: "error", text: "warning: approvals and sandbox are disabled for this run" });
    if (/doctor/.test(a.command)) return { lines: lines.concat(doctor().groups.flatMap((gr) => [{ level: "head", text: gr.name }].concat(gr.checks.map((c) => ({ level: c.ok ? "ok" : "error", text: `${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}` }))))), code: 0 };
    if (/features/.test(a.command)) return { lines: lines.concat(g.CODEX.FEATURES.slice(0, 12).map((f) => ({ level: "dim", text: `${f.key.padEnd(34)} ${f.stage}` }))), code: 0 };
    lines.push({ level: "ok", text: "session 0f2c1a54 started · model " + (a.model || "gpt-5.1-codex-max") });
    return { lines, code: 0, transcript: TRANSCRIPT };
  }

  /* ------------------------------------------------ TOML writer */
  function tomlValue(v) {
    if (Array.isArray(v)) return "[" + v.map(tomlValue).join(", ") + "]";
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "true" : "false";
    const s = String(v);
    return s.includes("\n") ? '"""\n' + s + '\n"""' : JSON.stringify(s);
  }
  function toToml(flat) {
    const tables = {};
    Object.keys(flat).sort().forEach((k) => {
      const v = flat[k];
      if (v === "" || v == null) return;
      const i = k.lastIndexOf(".");
      const table = i === -1 ? "" : k.slice(0, i);
      const leaf = i === -1 ? k : k.slice(i + 1);
      (tables[table] = tables[table] || []).push(`${leaf} = ${tomlValue(v)}`);
    });
    const out = [];
    if (tables[""]) { out.push(tables[""].join("\n")); delete tables[""]; }
    Object.keys(tables).sort().forEach((t) => out.push(`\n[${t}]\n` + tables[t].join("\n")));
    return (out.join("\n").trim() || "# no overrides — Codex defaults apply") + "\n";
  }

  /* ------------------------------------------------ regex engine (bounded) */
  const LIMITS = { pattern: 2000, sample: 20000, matches: 500, ms: 300 };

  /* A single `RegExp.exec` call cannot be interrupted from JavaScript, so the ms
     budget below only helps BETWEEN matches. A pattern that repeats a group which
     already repeats — `(a+)+`, and just as badly `(a+){1,20}` — spends that time
     inside one call and freezes the window outright. The only real defence is to
     refuse the shape before running it. */
  function repeatsMoreThanOnce(tail) {
    const m = /^(\*|\+|\?|\{(\d+)(,(\d*))?\})/.exec(tail);
    if (!m) return false;
    if (m[1] === "*" || m[1] === "+") return true;
    if (m[1] === "?") return false;
    const min = Number(m[2]);
    if (m[3] !== undefined && (m[4] === "" || m[4] === undefined)) return true;   // {n,}
    const max = m[4] !== undefined && m[4] !== "" ? Number(m[4]) : min;
    return max > 1;
  }
  function skipClass(s, i) {
    let j = i + 1;
    if (s[j] === "^") j++;
    if (s[j] === "]") j++;
    while (j < s.length && s[j] !== "]") { if (s[j] === "\\") j++; j++; }
    return j + 1;
  }
  function groupEnd(s, i) {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (c === "(") depth++;
      else if (c === ")" && !--depth) return j;
    }
    return -1;
  }
  /** Top-level alternation branches of a group body. */
  function branches(s) {
    const out = [];
    let depth = 0, last = 0;
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === "|" && !depth) { out.push(s.slice(last, j)); last = j + 1; }
    }
    out.push(s.slice(last));
    return out;
  }
  /** `(a|a)*` is the other classic blow-up: two branches that can match the same
   *  text give the engine an exponential number of equivalent ways to split it. */
  function overlappingBranches(body) {
    const b = branches(body);
    if (b.length < 2) return false;
    const first = (x) => {
      const t = x.replace(/^\^+/, "");
      if (!t) return null;
      if (t[0] === "\\") return t.slice(0, 2);
      if (t[0] === "[") return t.slice(0, skipClass(t, 0));
      if (t[0] === "(" || t[0] === ".") return t[0];
      return t[0];
    };
    const seen = {};
    for (let i = 0; i < b.length; i++) {
      const f = first(b[i]);
      if (f === null) continue;
      if (f === "." || seen[f]) return true;
      seen[f] = true;
    }
    return false;
  }

  /** Can this fragment match the empty string?
   *
   *  A group whose body is nullable, repeated with an unbounded quantifier, is the
   *  third classic blow-up and the one the other two checks miss: `(a?a?)+` has no
   *  inner `+` for the nested-quantifier scan to find and no repeated branch for the
   *  alternation scan, yet `(a?a?)+$` against 26 a's and a b was measured at 176
   *  SECONDS here. The `?`s make each iteration ambiguous — one `a` can be matched by
   *  either optional — and the outer `+` multiplies that ambiguity across iterations.
   *  The time budget cannot help: it is checked between matches, and this is all one
   *  match attempt.
   *
   *  Approximate but sound in the direction that matters: an alternative is nullable
   *  when every top-level atom in it is optional, and a body is nullable when any of
   *  its alternatives is. `(\s*,\s*)+` keeps its literal comma and stays allowed;
   *  `(a?a?)+`, `([a-z]*)+` and `(a|)+` do not. */
  function nullable(body) {
    const alts = branches(body);
    for (let a = 0; a < alts.length; a++) {
      const alt = alts[a].replace(/^\^+/, "").replace(/\$+$/, "");
      if (!alt) return true;                       // an empty branch matches empty
      let allOptional = true;
      let j = 0;
      while (j < alt.length) {
        let atomEnd;
        let innerNullable = false;
        if (alt[j] === "\\") atomEnd = j + 2;
        else if (alt[j] === "[") atomEnd = skipClass(alt, j);
        else if (alt[j] === "(") {
          const g = groupEnd(alt, j);
          if (g < 0) { allOptional = false; break; }
          if (/^\?(=|!|<=|<!)/.test(alt.slice(j + 1))) innerNullable = true;   // a lookaround consumes nothing
          else innerNullable = nullable(alt.slice(j + 1, g).replace(/^\?(:|<[A-Za-z_$][\w$]*>)/, ""));
          atomEnd = g + 1;
        } else atomEnd = j + 1;

        const q = /^(\?|\*|\{0(,\d*)?\})/.exec(alt.slice(atomEnd));
        const optional = !!q || innerNullable;
        if (!optional) { allOptional = false; break; }
        j = atomEnd + (q ? q[0].length : 0);
        // a lazy or possessive marker after the quantifier
        if (alt[j] === "?" || alt[j] === "+") j++;
      }
      if (allOptional) return true;
    }
    return false;
  }

  /** Does this alternative contain at least one atom that must appear exactly a
   *  bounded number of times?
   *
   *  That atom is what stops the outer repeat from re-splitting the same text: each
   *  iteration has to consume it, so there is only one way to divide the input into
   *  iterations. Measured against the real engine, 26 hostile characters:
   *
   *      (a+)+$              7 886 ms      no anchor
   *      (a?a?)+$          197 238 ms      no anchor
   *      ([a-z]*)+$         34 291 ms      no anchor
   *      (a+|b)+$            8 226 ms      no anchor in the `a+` branch
   *      (a+a)+$                37 ms      trailing `a` anchors it
   *      (\.\w+)+$                0 ms      leading `\.` anchors it
   *      (\s[A-Z][a-z]+)*$         0 ms      leading `\s` anchors it
   *      ([A-Z][a-z]+)+$           0 ms      leading `[A-Z]` anchors it
   *
   *  The previous rule refused any repeated group containing an unbounded quantifier
   *  anywhere after the first position, which caught the top four and also the bottom
   *  four — so "match a run of Title Case Words" and "match a chain of .extensions"
   *  were both rejected as catastrophic while measuring zero milliseconds. */
  function everyBranchAnchored(body) {
    const alts = branches(body);
    for (let a = 0; a < alts.length; a++) {
      const alt = alts[a].replace(/^\^+/, "").replace(/\$+$/, "");
      if (!alt) return false;
      let anchored = false;
      let j = 0;
      while (j < alt.length && !anchored) {
        let atomEnd, groupBody = null;
        if (alt[j] === "\\") atomEnd = j + 2;
        else if (alt[j] === "[") atomEnd = skipClass(alt, j);
        else if (alt[j] === "(") {
          const g = groupEnd(alt, j);
          if (g < 0) return false;
          if (/^\?(=|!|<=|<!)/.test(alt.slice(j + 1))) { j = g + 1; continue; }  // consumes nothing
          groupBody = alt.slice(j + 1, g).replace(/^\?(:|<[A-Za-z_$][\w$]*>)/, "");
          atomEnd = g + 1;
        } else if (alt[j] === "^" || alt[j] === "$") { j++; continue; }
        else atomEnd = j + 1;

        const q = /^(\?|\*|\+|\{(\d*)(,(\d*))?\})/.exec(alt.slice(atomEnd));
        let mandatoryBounded;
        if (!q) mandatoryBounded = true;                       // exactly once
        else if (q[1] === "?" || q[1] === "*" || q[1] === "+") mandatoryBounded = false;
        else {
          const min = Number(q[2] || 0);
          const openEnded = q[3] !== undefined && (q[4] === undefined || q[4] === "");
          mandatoryBounded = min >= 1 && !openEnded;
        }
        // A group only anchors if it is itself anchored all the way down.
        if (mandatoryBounded && groupBody !== null) mandatoryBounded = everyBranchAnchored(groupBody);
        if (mandatoryBounded) anchored = true;
        j = atomEnd + (q ? q[0].length : 0);
        if (alt[j] === "?" || alt[j] === "+") j++;             // lazy / possessive marker
      }
      if (!anchored) return false;
    }
    return true;
  }

  /** The offending fragment, or null. Reported to the user verbatim so the refusal
   *  names the exact part of their pattern that is the problem. */
  function nestedQuantifier(pattern) {
    const s = String(pattern);
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "\\") { i++; continue; }
      if (c === "[") { i = skipClass(s, i) - 1; continue; }
      if (c !== "(") continue;
      const end = groupEnd(s, i);
      if (end < 0) break;
      const tail = /^(\*|\+|\{\d+(,\d*)?\})/.exec(s.slice(end + 1));
      if (!repeatsMoreThanOnce(s.slice(end + 1))) continue;
      const fragment = s.slice(i, end + 1 + (tail ? tail[0].length : 0));
      if (/^\?(=|!|<=|<!)/.test(s.slice(i + 1))) continue;   // a lookaround is a different shape
      const body = s.slice(i + 1, end).replace(/^\?(:|<[A-Za-z_$][\w$]*>)/, "");
      if (overlappingBranches(body)) return { fragment: fragment, why: "branches" };
      if (nullable(body)) return { fragment: fragment, why: "nullable" };
      if (!everyBranchAnchored(body)) return { fragment: fragment, why: "unanchored" };
    }
    return null;
  }

  function evaluate(pattern, flags, sample) {
    const res = { ok: true, error: null, matches: [], truncated: false, ms: 0, groups: [], timedOut: false };
    if (!pattern) { res.ok = false; res.error = "Empty pattern — nothing is matched."; return res; }
    if (pattern.length > LIMITS.pattern) { res.ok = false; res.error = `Pattern exceeds ${LIMITS.pattern} characters.`; return res; }
    const nested = nestedQuantifier(pattern);
    if (nested) {
      const frag = nested.fragment;
      res.ok = false;
      res.refused = frag;
      /* Each shape gets its own true reason. Telling the user that `(a?)+` will hang
         the window would be false — it returns in a fraction of a millisecond; it is
         refused because a group that can match nothing, repeated, is a mistake. Saying
         "catastrophic" for everything trains people to ignore the message. */
      res.error =
        nested.why === "nullable"
          ? `Refused: \`${frag}\` repeats a group that can match nothing at all. Where the group is also ambiguous this is catastrophic — \`(a?a?)+$\` against 26 characters was measured here at over three minutes, inside a single match attempt the ${LIMITS.ms} ms budget cannot interrupt. Where it is not, the repeat still does nothing, because a group matching the empty string cannot advance. Either way, give the group something it must consume.`
          : nested.why === "branches"
            ? `Refused: \`${frag}\` repeats a group whose branches can match the same text. The engine then has an exponential number of equivalent ways to divide the input between them, inside a single match attempt the ${LIMITS.ms} ms budget cannot interrupt — the window would stop responding. Make the branches distinguishable, or drop the outer repeat.`
            : `Refused: \`${frag}\` repeats a group with nothing in it that must appear a fixed number of times. Without such an anchor the outer repeat can re-split the same text an exponential number of ways — \`(a+)+$\` against 26 characters was measured here at about eight seconds, and it grows by roughly a factor of two per character. Add a part the group must consume once, or drop the outer repeat.`;
      return res;
    }
    if (sample.length > LIMITS.sample) { res.ok = false; res.error = `Sample exceeds ${LIMITS.sample} characters.`; return res; }
    let re;
    try { re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g"); }
    catch (e) { res.ok = false; res.error = e.message; return res; }
    const t0 = performance.now();
    let m, guard = 0;
    while ((m = re.exec(sample)) !== null) {
      res.matches.push({ index: m.index, text: m[0], groups: m.slice(1), named: m.groups || null });
      if (m[0] === "") re.lastIndex++;              // zero-width guard
      if (res.matches.length >= LIMITS.matches) { res.truncated = true; break; }
      if (++guard % 200 === 0 && performance.now() - t0 > LIMITS.ms) { res.timedOut = true; break; }
    }
    res.ms = Math.round((performance.now() - t0) * 100) / 100;
    if (res.timedOut) { res.ok = false; res.error = `Evaluation stopped after ${LIMITS.ms} ms (possible catastrophic backtracking).`; }
    return res;
  }

  const CONSTRUCTS = [
    { group: "Characters", items: [[".", "any character"], ["\\d", "digit"], ["\\w", "word char"], ["\\s", "whitespace"], ["\\D", "non-digit"], ["\\S", "non-space"], ["[abc]", "character class"], ["[^abc]", "negated class"], ["[a-z]", "range"], ["\\p{L}", "unicode property (u flag)"]] },
    { group: "Anchors", items: [["^", "start of line/input"], ["$", "end of line/input"], ["\\b", "word boundary"], ["\\B", "non-boundary"]] },
    { group: "Quantifiers", items: [["*", "0 or more"], ["+", "1 or more"], ["?", "0 or 1"], ["{2,4}", "between 2 and 4"], ["*?", "lazy 0+"], ["++", "(not in JS) use atomic-free rewrite"]] },
    { group: "Groups", items: [["(…)", "capture"], ["(?:…)", "non-capturing"], ["(?<name>…)", "named capture"], ["(?=…)", "lookahead"], ["(?!…)", "negative lookahead"], ["(?<=…)", "lookbehind"], ["(?<!…)", "negative lookbehind"], ["a|b", "alternation"]] }
  ];
  const FLAGS = [["g", "global"], ["i", "ignore case"], ["m", "multiline anchors"], ["s", "dot matches newline"], ["u", "unicode"], ["v", "unicode sets"], ["y", "sticky"], ["d", "match indices"]];

  /* ------------------------------------------------ colour translation */
  const color = {
    hexToRgb(hex) {
      let h = String(hex).replace("#", "").trim();
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      if (h.length === 6) h += "ff";
      if (!/^[0-9a-f]{8}$/i.test(h)) return null;
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: parseInt(h.slice(6, 8), 16) / 255 };
    },
    rgbToHex({ r, g, b, a }) {
      const p = (n) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
      return "#" + p(r) + p(g) + p(b) + (a != null && a < 1 ? p(a * 255) : "");
    },
    hsvToRgb({ h, s, v }) {
      s /= 100; v /= 100;
      const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
      const t = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255 };
    },
    rgbToHsv({ r, g, b }) {
      const R = r / 255, G = g / 255, B = b / 255;
      const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
      let h = 0;
      if (d) { if (max === R) h = ((G - B) / d) % 6; else if (max === G) h = (B - R) / d + 2; else h = (R - G) / d + 4; h *= 60; if (h < 0) h += 360; }
      return { h, s: max ? (d / max) * 100 : 0, v: max * 100 };
    },
    rgbToHsl({ r, g, b }) {
      const R = r / 255, G = g / 255, B = b / 255;
      const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min, l = (max + min) / 2;
      let h = 0;
      if (d) { if (max === R) h = ((G - B) / d) % 6; else if (max === G) h = (B - R) / d + 2; else h = (R - G) / d + 4; h *= 60; if (h < 0) h += 360; }
      return { h, s: d ? (d / (1 - Math.abs(2 * l - 1))) * 100 : 0, l: l * 100 };
    },
    lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); },
    lab(rgb) {
      const R = this.lin(rgb.r), G = this.lin(rgb.g), B = this.lin(rgb.b);
      const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
      const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
      return { l: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
    },
    oklab(rgb) {
      const R = this.lin(rgb.r), G = this.lin(rgb.g), B = this.lin(rgb.b);
      const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
      const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
      const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
      return { l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s };
    },
    cmyk({ r, g, b }) {
      const R = r / 255, G = g / 255, B = b / 255, k = 1 - Math.max(R, G, B);
      if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
      return { c: ((1 - R - k) / (1 - k)) * 100, m: ((1 - G - k) / (1 - k)) * 100, y: ((1 - B - k) / (1 - k)) * 100, k: k * 100 };
    },
    luminance(rgb) { return 0.2126 * this.lin(rgb.r) + 0.7152 * this.lin(rgb.g) + 0.0722 * this.lin(rgb.b); },
    contrast(a, b) { const x = this.luminance(a), y = this.luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); },
    /* ------------------------------------------------------------ parsing
     *
     *  The translator emitted twelve representations and could read exactly one of
     *  them back, so the conversion was one-way: the panel would show you
     *  `oklch(0.85 0.06 300)` and then reject it if you typed it into the field
     *  underneath. Every space it writes, it now reads.
     *
     *  Each function below is the inverse of the forward one above it, and
     *  tools/test-frontend.mjs round-trips a set of colours through all twelve to
     *  prove it rather than taking the arithmetic on trust. */
    NAMED: {
      black: "#000000", white: "#ffffff", red: "#ff0000", lime: "#00ff00", blue: "#0000ff",
      yellow: "#ffff00", cyan: "#00ffff", aqua: "#00ffff", magenta: "#ff00ff", fuchsia: "#ff00ff",
      silver: "#c0c0c0", gray: "#808080", grey: "#808080", maroon: "#800000", olive: "#808000",
      green: "#008000", purple: "#800080", teal: "#008080", navy: "#000080", orange: "#ffa500",
      pink: "#ffc0cb", brown: "#a52a2a", gold: "#ffd700", indigo: "#4b0082", violet: "#ee82ee",
      salmon: "#fa8072", coral: "#ff7f50", crimson: "#dc143c", khaki: "#f0e68c", plum: "#dda0dd",
      orchid: "#da70d6", tomato: "#ff6347", turquoise: "#40e0d0", lavender: "#e6e6fa",
      beige: "#f5f5dc", ivory: "#fffff0"
    },

    hslToRgb({ h, s, l }) {
      const S = s / 100, L = l / 100;
      const c = (1 - Math.abs(2 * L - 1)) * S, hp = (((h % 360) + 360) % 360) / 60;
      const x = c * (1 - Math.abs((hp % 2) - 1));
      const t = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x]
        : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
      const m = L - c / 2;
      return { r: Math.round((t[0] + m) * 255), g: Math.round((t[1] + m) * 255), b: Math.round((t[2] + m) * 255) };
    },
    hwbToRgb({ h, w, b }) {
      const W = w / 100, B = b / 100;
      if (W + B >= 1) { const g = Math.round((W / (W + B)) * 255); return { r: g, g: g, b: g }; }
      const base = this.hslToRgb({ h: h, s: 100, l: 50 });
      const mix = (v) => Math.round((v / 255) * (1 - W - B) * 255 + W * 255);
      return { r: mix(base.r), g: mix(base.g), b: mix(base.b) };
    },
    /* sRGB companding, shared by every space that travels through linear light. */
    _unlin(u) { return 255 * (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055); },
    _xyzToRgb(x, y, z) {
      const cl = (v) => Math.round(Math.min(255, Math.max(0, this._unlin(Math.min(1, Math.max(0, v))))));
      return {
        r: cl(x * 3.2406 + y * -1.5372 + z * -0.4986),
        g: cl(x * -0.9689 + y * 1.8758 + z * 0.0415),
        b: cl(x * 0.0557 + y * -0.2040 + z * 1.0570)
      };
    },
    labToRgb({ l, a, b }) {
      const fy = (l + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
      const inv = (t) => (t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787);
      return this._xyzToRgb(inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883);
    },
    lchToRgb({ l, c, h }) {
      const rad = (h * Math.PI) / 180;
      return this.labToRgb({ l: l, a: Math.cos(rad) * c, b: Math.sin(rad) * c });
    },
    oklabToRgb({ l, a, b }) {
      const L = Math.pow(l + 0.3963377774 * a + 0.2158037573 * b, 3);
      const M = Math.pow(l - 0.1055613458 * a - 0.0638541728 * b, 3);
      const S2 = Math.pow(l - 0.0894841775 * a - 1.2914855480 * b, 3);
      const cl = (v) => Math.round(Math.min(255, Math.max(0, this._unlin(Math.min(1, Math.max(0, v))))));
      return {
        r: cl(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S2),
        g: cl(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S2),
        b: cl(-0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S2)
      };
    },
    oklchToRgb({ l, c, h }) {
      const rad = (h * Math.PI) / 180;
      return this.oklabToRgb({ l: l, a: Math.cos(rad) * c, b: Math.sin(rad) * c });
    },
    cmykToRgb({ c, m, y, k }) {
      const f = (ch) => Math.round(255 * (1 - Math.min(1, ch / 100)) * (1 - Math.min(1, k / 100)));
      return { r: f(c), g: f(m), b: f(y) };
    },

    /** Read any representation the translator can write, plus the named colours.
     *  Returns a hex string, or null when the text is not a colour — never a guess. */
    parse(text) {
      if (text == null) return null;
      const raw = String(text).trim().toLowerCase();
      if (!raw) return null;
      if (this.NAMED[raw]) return this.NAMED[raw];
      if (raw[0] === "#" || /^[0-9a-f]{3}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/.test(raw)) {
        const rgb = this.hexToRgb(raw);
        return rgb ? this.rgbToHex(rgb) : null;
      }
      const m = /^([a-z-]+)\s*\(([^)]*)\)$/.exec(raw);
      if (!m) return null;
      const fn = m[1];
      /* Both the legacy comma form and the modern space form, with an optional
         alpha tail: rgb(1,2,3), rgb(1 2 3) and rgb(1 2 3 / 0.5) all parse. */
      const parts = m[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
      const num = (i) => { const v = parseFloat(parts[i]); return isNaN(v) ? null : v; };
      const need = (n) => { for (let i = 0; i < n; i++) if (num(i) === null) return false; return true; };
      const alpha = (i) => {
        const v = num(i);
        if (v === null) return 1;
        return /%/.test(parts[i] || "") ? v / 100 : v;
      };
      let rgb = null, a = 1;
      if (fn === "rgb" || fn === "rgba") {
        if (!need(3)) return null;
        const ch = (i) => (/%/.test(parts[i]) ? (num(i) / 100) * 255 : num(i));
        rgb = { r: ch(0), g: ch(1), b: ch(2) };
        if (parts.length > 3) a = alpha(3);
      } else if (fn === "hsl" || fn === "hsla") {
        if (!need(3)) return null;
        rgb = this.hslToRgb({ h: num(0), s: num(1), l: num(2) });
        if (parts.length > 3) a = alpha(3);
      } else if (fn === "hsv" || fn === "hsb") {
        if (!need(3)) return null;
        rgb = this.hsvToRgb({ h: num(0), s: num(1), v: num(2) });
      } else if (fn === "hwb") {
        if (!need(3)) return null;
        rgb = this.hwbToRgb({ h: num(0), w: num(1), b: num(2) });
        if (parts.length > 3) a = alpha(3);
      } else if (fn === "lab") {
        if (!need(3)) return null;
        rgb = this.labToRgb({ l: num(0), a: num(1), b: num(2) });
      } else if (fn === "lch") {
        if (!need(3)) return null;
        rgb = this.lchToRgb({ l: num(0), c: num(1), h: num(2) });
      } else if (fn === "oklab") {
        if (!need(3)) return null;
        rgb = this.oklabToRgb({ l: num(0), a: num(1), b: num(2) });
      } else if (fn === "oklch") {
        if (!need(3)) return null;
        rgb = this.oklchToRgb({ l: num(0), c: num(1), h: num(2) });
      } else if (fn === "cmyk" || fn === "device-cmyk") {
        if (!need(4)) return null;
        rgb = this.cmykToRgb({ c: num(0), m: num(1), y: num(2), k: num(3) });
      } else return null;
      if (!rgb) return null;
      /* Alpha is preserved rather than dropped: a translator that silently discards it
         is approximating, not round-tripping. */
      return this.rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b, a: a });
    },

    translate(hex) {
      const rgb = this.hexToRgb(hex);
      if (!rgb) return [];
      const n = (v, d) => Number(v.toFixed(d == null ? 1 : d));
      const hsl = this.rgbToHsl(rgb), hsv = this.rgbToHsv(rgb), lab = this.lab(rgb), ok = this.oklab(rgb), cy = this.cmyk(rgb);
      const lch = { l: lab.l, c: Math.hypot(lab.a, lab.b), h: (Math.atan2(lab.b, lab.a) * 180) / Math.PI };
      const okl = { l: ok.l, c: Math.hypot(ok.a, ok.b), h: (Math.atan2(ok.b, ok.a) * 180) / Math.PI };
      const w = Math.min(rgb.r, rgb.g, rgb.b) / 2.55, bk = 100 - Math.max(rgb.r, rgb.g, rgb.b) / 2.55;
      return [
        ["HEX", this.rgbToHex({ r: rgb.r, g: rgb.g, b: rgb.b }).toUpperCase()],
        ["HEX8", this.rgbToHex(rgb).toUpperCase()],
        ["RGB", `rgb(${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)})`],
        ["RGBA", `rgb(${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)} / ${n(rgb.a, 2)})`],
        ["HSL", `hsl(${n(hsl.h)} ${n(hsl.s)}% ${n(hsl.l)}%)`],
        ["HSV", `hsv(${n(hsv.h)} ${n(hsv.s)}% ${n(hsv.v)}%)`],
        ["HWB", `hwb(${n(hsv.h)} ${n(w)}% ${n(bk)}%)`],
        ["LAB", `lab(${n(lab.l)}% ${n(lab.a)} ${n(lab.b)})`],
        ["LCH", `lch(${n(lch.l)}% ${n(lch.c)} ${n((lch.h + 360) % 360)})`],
        ["OKLAB", `oklab(${n(ok.l, 3)} ${n(ok.a, 3)} ${n(ok.b, 3)})`],
        ["OKLCH", `oklch(${n(okl.l, 3)} ${n(okl.c, 3)} ${n((okl.h + 360) % 360)})`],
        ["CMYK", `cmyk(${n(cy.c)}% ${n(cy.m)}% ${n(cy.y)}% ${n(cy.k)}%)`]
      ];
    }
  };

  /* ------------------------------------------------ localisation */
  const T = {
    "app.name": ["Codex Studio", "Codex Studio"],
    "app.tag": ["Every Codex command, setting and flag — with a real GUI on top.", ["Codex 嘅所有指令同設定，全部有介面。", "Codex 全部指令同設定，一個介面搞掂。", "成個 Codex 嘅嘢，一個介面搞掂晒。", "Codex 咩都有，唔使再背 flag。", "唔使再背 flag，撳兩下就得，勁過睇 --help。"]],
    "nav.session": ["Session", "傾偈"],
    "nav.run": ["Run", "執行"],
    "nav.commands": ["Commands", "指令"],
    "nav.settings": ["Settings", "設定"],
    "nav.profiles": ["Profiles", "設定檔"],
    "nav.mcp": ["MCP servers", "MCP 伺服器"],
    "nav.plugins": ["Plugins", "外掛"],
    "nav.skills": ["Skills", "技能"],
    "nav.hooks": ["Hooks", "生命週期掛鈎"],
    "nav.features": ["Feature flags", "功能旗標"],
    "nav.sessions": ["Sessions", "紀錄"],
    "nav.auth": ["Account", "帳戶"],
    "nav.doctor": ["Doctor", "診斷"],
    "nav.cloud": ["Cloud tasks", "雲端任務"],
    "nav.regex": ["Regex builder", "Regex 產生器"],
    "nav.appearance": ["Appearance & language", "外觀同語言"],
    "act.send": ["Send", ["傳送", "傳送", "send 出去", "send 啦", "send 啦，唔好諗咁多"]],
    "act.run": ["Run", ["執行", "執行", "行啦", "行啦", "撳落去行啦"]],
    "act.save": ["Save to config.toml", "寫入 config.toml"],
    "act.copy": ["Copy", "複製"],
    "act.cancel": ["Cancel", "取消"],
    "act.close": ["Close", "閂咗佢"],
    "lbl.dangerous": ["Dangerous", "危險"],
    "lbl.preview": ["Command preview", "指令預覽"]
  };
  const i18n = {
    mode: store.get("lang", "en"),
    /* Two independent sliders, one per language. Level 1 reads fully professional
       and level 5 is maximum playfulness — in BOTH languages, and in every message
       category including errors and destructive warnings. What the level changes is
       voice; the facts (which file, which count, what is irreversible) are identical
       at every level, which is why each entry carries the same placeholders. */
    funny: store.get("funny", { en: 3, yue: 4 }),
    /* Clamp to the table's OWN length, not to 4. Several tables ship three levels
       rather than five — the changelog's date presets, for one — and indexing past
       the end returned undefined, so at funny level 4 or 5 those labels rendered as
       nothing at all. A short table means the highest level it does define; it never
       means an empty string. */
    pick(v, lang) {
      if (!Array.isArray(v)) return v;
      if (!v.length) return "";
      const level = Math.max(0, (this.funny[lang] || 3) - 1);
      return v[Math.min(v.length - 1, level)];
    },
    t(key, vars) {
      /* cx-i18n.js holds the full table; this local one is the fallback that keeps
         the app legible if that file is ever missing from a build. */
      const full = g.CX_I18N;
      if (full && full.STRINGS && full.STRINGS[key]) {
        return vars ? full.format(key, this.mode, this.funny, vars) : full.resolve(key, this.mode, this.funny);
      }
      const e = T[key]; if (!e) return key;
      const en = this.pick(e[0], "en"), yue = this.pick(e[1], "yue");
      const out = this.mode === "yue" ? yue : this.mode === "bi" ? (en === yue ? en : en + "  ·  " + yue) : en;
      return vars ? String(out).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : out;
    },
    /** Every key the table knows, for the settings search to index. */
    keys() {
      const full = g.CX_I18N;
      return Object.keys(full && full.STRINGS ? full.STRINGS : T);
    },
    setMode(mode) { this.mode = mode; this.save(); return this; },
    setFunny(lang, level) {
      this.funny = Object.assign({}, this.funny);
      this.funny[lang] = Math.min(5, Math.max(1, Number(level) || 3));
      this.save();
      return this;
    },
    save() { store.set("lang", this.mode); store.set("funny", this.funny); }
  };

  /* ------------------------------------------------ speech narrator (off by default) */
  const narrator = {
    enabled: store.get("tts", false),
    lang: store.get("ttsLang", "en"),
    queue: [], speaking: false, lastAt: 0,
    say(text, category, force) {
      if (!this.enabled || !g.speechSynthesis) return;
      const now = Date.now();
      if (!force && now - this.lastAt < 6000) return;   // debounce + cooldown
      this.lastAt = now;
      this.queue = this.queue.filter((q) => q.category !== category);
      this.queue.push({ text, category });
      this.pump();
    },
    pump() {
      if (this.speaking || !this.queue.length) return;
      const item = this.queue.shift();
      const utter = new SpeechSynthesisUtterance(item.text);
      utter.lang = this.lang === "yue" ? "zh-HK" : "en-US";
      utter.onend = () => { this.speaking = false; this.pump(); };
      this.speaking = true;
      g.speechSynthesis.speak(utter);
    }
  };

  /* ------------------------------------------------ local git-backed history
     Every profile / config / session change is committed. `undo` does not pop the
     stack — it writes a *revert commit*, so an undo is itself undoable, forever. */
  const vcs = {
    log: store.get("vcs.log", []),
    head: store.get("vcs.head", null),
    id() { return Math.random().toString(16).slice(2, 9); },
    persist() { store.set("vcs.log", this.log.slice(0, 300)); store.set("vcs.head", this.head); },
    current() { return this.log.find((c) => c.id === this.head) || null; },
    /* Everything Studio owns travels together. Restoring an account without the
       configuration it ran under is a subtly wrong state — worse than offering no
       undo at all — so tabs, appearance, language and pricing ride along with the
       profiles rather than being snapshotted separately. */
    snapshot() {
      return {
        profiles: store.get("profiles", null),
        activeProfile: store.get("activeProfile", null),
        config: store.get("config", {}),
        features: store.get("features", {}),
        appearance: store.get("appearance", {}),
        appearancePresets: store.get("appearancePresets", []),
        tabs: store.get("tabs", null),
        prices: store.get("prices", null),
        cost: store.get("cost", null),
        lang: store.get("lang", "en"),
        funny: store.get("funny", null),
        settings: store.get("settings", null),
        yolo: store.get("yolo", false),
        /* These three are written by the app and were missing from the snapshot, so a
           restore reverted some of the user's preferences and left others exactly where
           they were — a half-restored state, which the rules call out as worse than
           offering no undo at all. */
        theme: store.get("theme", null),
        cacheRate: store.get("cacheRate", null),
        lifetime: store.get("lifetime", null)
      };
    },
    /** Put a snapshot back.
     *
     *  The localStorage half is synchronous so the UI is correct immediately. The
     *  config half has to travel to the real config.toml as well: without it a
     *  "restore" returned the interface to a past state while the file the CLI
     *  actually reads kept the present one, and the two silently disagreed. A history
     *  write that fails must never fail the operation the user asked for, so the
     *  backend call reports and carries on. */
    restore(snap) {
      Object.keys(snap).forEach((k) => { if (snap[k] !== null && snap[k] !== undefined) store.set(k, snap[k]); });
      if (snap && snap.config && bridge && bridge.invoke) {
        bridge.invoke("codex_config_restore", { config: snap.config })
          .catch((e) => notifyBackendFailure("history", e));
      }
    },
    commit(message, kind) {
      const c = { id: this.id(), at: Date.now(), message, kind: kind || "change", parent: this.head, snapshot: this.snapshot() };
      this.log.unshift(c);
      this.head = c.id;
      this.persist();
      bridge.invoke("codex_history_commit", { message, kind: c.kind, snapshot: c.snapshot }).catch((e) => notifyBackendFailure("history", e));
      return c;
    },
    /** Find a revision by its own id, or by the git id it was recorded under.
     *
     *  The History panel lists the git log once the backend repository has commits —
     *  which is every launch after the first — and those rows carry git short hashes.
     *  Both revert() and checkout() looked the id up in the localStorage log, found
     *  nothing, and returned null, so Undo and Restore silently did nothing for the
     *  entire life of the feature. Matching on timestamp and message recovers the
     *  local revision, which is the one holding the snapshot. */
    localIndexFor(id, at, message) {
      let idx = this.log.findIndex((c) => c.id === id);
      if (idx !== -1) return idx;
      if (at) {
        idx = this.log.findIndex((c) => Math.abs(c.at - at) < 2000 && (!message || c.message === message));
        if (idx !== -1) return idx;
      }
      if (message) {
        idx = this.log.findIndex((c) => c.message === message);
        if (idx !== -1) return idx;
      }
      return -1;
    },
    /** Revert to the state *before* commit `id`, as a new commit. */
    revert(id, at, message) {
      const idx = this.localIndexFor(id, at, message);
      if (idx === -1) return null;
      const target = this.log[idx];
      const before = this.log[idx + 1];
      const snap = before ? before.snapshot : { profiles: null, activeProfile: null, config: {}, features: {}, appearance: {}, prices: null, cost: null };
      this.restore(snap);
      const c = { id: this.id(), at: Date.now(), message: (target.kind === "revert" ? "Undo of undo — " : "Undo — ") + target.message, kind: "revert", parent: this.head, reverts: target.id, snapshot: snap };
      this.log.unshift(c);
      this.head = c.id;
      this.persist();
      bridge.invoke("codex_history_commit", { message: c.message, kind: "revert", snapshot: snap }).catch((e) => notifyBackendFailure("history", e));
      return c;
    },
    undo() { return this.log.length ? this.revert(this.log[0].id) : null; },
    checkout(id, at, message) {
      const idx = this.localIndexFor(id, at, message);
      if (idx === -1) return null;
      const c = this.log[idx];
      this.restore(c.snapshot);
      const nc = { id: this.id(), at: Date.now(), message: "Restore — " + c.message, kind: "restore", parent: this.head, snapshot: c.snapshot };
      this.log.unshift(nc);
      this.head = nc.id;
      this.persist();
      return nc;
    }
  };

  /* ------------------------------------------------ notifications, tabs, settings */

  const notify = g.CX_NOTIFY ? g.CX_NOTIFY.create().load() : null;
  const tabs = g.CX_TABS ? g.CX_TABS.create(store) : null;

  /** Backend failures are surfaced, never swallowed. The title is styled by the
      funny level; `detail` always carries what the backend literally said. */
  function notifyBackendFailure(what, err) {
    const detail = err && err.message ? err.message : String(err);
    /* The message carries {detail} at every funny level — that is the point of the
       voice-not-facts rule — so it has to be interpolated, not merely resolved. */
    const title = i18n.t("err." + what, { detail: detail });
    if (notify) notify.error(title === "err." + what ? what : title, detail, { detail });
    else console.error("[codex-studio] " + what + ": " + detail);
    return null;
  }

  const settings = {
    all: store.get("settings", {
      density: "comfortable",
      dimSum: true,
      narrator: false,
      narratorLang: "en",
      reducedMotion: false,
      editor: "",
      editorExe: "",
      historyKeep: 200
    }),
    get(key, fallback) { return key in this.all ? this.all[key] : fallback; },
    set(key, value) {
      this.all = Object.assign({}, this.all, { [key]: value });
      store.set("settings", this.all);
      return this.all;
    }
  };

  /* ------------------------------------------------ dim sum surprise
     A 1% draw per launch, from a fresh random number — never more frequent than
     stated, never twice in one launch, and never on a first run or an error path,
     because a delight that interrupts someone mid-problem is not a delight. */
  const dimsum = {
    drawn: false,
    draw() {
      if (this.drawn) return null;
      this.drawn = true;
      if (!settings.get("dimSum", true)) return null;
      if (!store.get("hasLaunchedBefore", false)) { store.set("hasLaunchedBefore", true); return null; }
      const cat = g.CX_DIMSUM;
      return cat ? cat.draw(0.01) : null;
    }
  };

  /* ------------------------------------------------ live backend state
     Under Tauri the simulated `state` object is *replaced in place* with what the
     real CLI reports, so every panel that already reads CX.sim.mcp keeps working
     and starts showing real data. In a browser the simulation stays, which is what
     makes the same build openable as a design preview. */
  const live = {
    ready: false,
    at: 0,
    errors: {},
    async hydrate(cwd) {
      if (!bridge.available) { this.ready = true; return state; }
      let real;
      try {
        real = await bridge.invoke("codex_state", { cwd: cwd || null });
      } catch (e) {
        return notifyBackendFailure("state", e);
      }
      state.codexHome = real.codexHome || state.codexHome;
      state.version = real.version || state.version;
      state.auth = real.auth || state.auth;
      state.mcp = (real.mcp || []).map((m) => Object.assign({ tools: null }, m));
      state.plugins = real.plugins || [];
      /* The marketplace browser was written against a richer catalogue than the
         CLI exposes; fill the display-only fields rather than blanking the panel. */
      state.catalog = (real.catalog || []).map((c) => Object.assign({
        author: c.marketplace || "", installs: null, tags: []
      }, c));
      state.marketplaces = real.marketplaces || [];
      state.skills = real.skills || [];
      state.hooks = real.hooks || [];
      state.features = real.features || [];
      state.sessions = real.sessions || [];
      state.config = real.config || {};
      state.wslDistros = real.wslDistros || [];
      this.errors = real.errors || {};
      this.ready = true;
      this.at = Date.now();
      /* A section that failed is reported once, by name, with what the CLI said —
         a silently empty list reads as "you have none", which is a different fact. */
      Object.keys(this.errors).forEach((k) => {
        if (notify) notify.warn(i18n.t("err.section", { section: k }), String(this.errors[k]), { detail: String(this.errors[k]) });
      });
      return state;
    },
    async wsl() {
      try {
        const r = await bridge.invoke("codex_wsl_list", {});
        state.wslDistros = r.distros || state.wslDistros;
        state.wsl = r.instances || {};
        return r;
      } catch (e) { return notifyBackendFailure("wsl", e); }
    }
  };

  g.CX = {
    bridge, store, toToml, evaluate, CONSTRUCTS, FLAGS, LIMITS, color, i18n, narrator, vcs,
    notify, tabs, settings, dimsum, live, notifyBackendFailure,
    sim: state
  };
})(window);
