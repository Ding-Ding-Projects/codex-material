/* Codex Studio — runtime core.
   Tauri-first: every backend call goes through bridge.invoke(), which routes to
   window.__TAURI__.core.invoke when running inside the Tauri shell and to a local
   simulation when the same build is opened in a browser. */
(function (g) {
  "use strict";

  const store = {
    get(k, f) { try { const r = localStorage.getItem("codexstudio." + k); return r == null ? f : JSON.parse(r); } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem("codexstudio." + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ------------------------------------------------ Tauri bridge */
  const bridge = {
    get available() { return !!(g.__TAURI__ && (g.__TAURI__.core || g.__TAURI__.invoke)); },
    get mode() { return this.available ? "tauri" : "browser"; },
    async invoke(cmd, args) {
      if (this.available) {
        const inv = g.__TAURI__.core ? g.__TAURI__.core.invoke : g.__TAURI__.invoke;
        return await inv(cmd, args || {});
      }
      return await sim(cmd, args || {});
    },
    async listen(event, handler) {
      if (this.available && g.__TAURI__.event) return await g.__TAURI__.event.listen(event, handler);
      return () => {};
    },
    window: {
      call(method) {
        try {
          const w = g.__TAURI__ && g.__TAURI__.window && g.__TAURI__.window.getCurrentWindow
            ? g.__TAURI__.window.getCurrentWindow() : null;
          if (w && typeof w[method] === "function") w[method]();
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
    auth: { method: "chatgpt", account: "you@example.com", plan: "ChatGPT Pro", expires: "2026-09-02", apiKey: false },
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
  function evaluate(pattern, flags, sample) {
    const res = { ok: true, error: null, matches: [], truncated: false, ms: 0, groups: [], timedOut: false };
    if (!pattern) { res.ok = false; res.error = "Empty pattern — nothing is matched."; return res; }
    if (pattern.length > LIMITS.pattern) { res.ok = false; res.error = `Pattern exceeds ${LIMITS.pattern} characters.`; return res; }
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
    funny: store.get("funny", { en: 3, yue: 4 }),
    pick(v, lang) { return Array.isArray(v) ? v[Math.min(4, Math.max(0, (this.funny[lang] || 3) - 1))] : v; },
    t(key) {
      const e = T[key]; if (!e) return key;
      const en = this.pick(e[0], "en"), yue = this.pick(e[1], "yue");
      if (this.mode === "yue") return yue;
      if (this.mode === "bi") return en === yue ? en : en + "  ·  " + yue;
      return en;
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
    snapshot() {
      return {
        profiles: store.get("profiles", null),
        activeProfile: store.get("activeProfile", null),
        config: store.get("config", {}),
        features: store.get("features", {}),
        appearance: store.get("appearance", {}),
        prices: store.get("prices", null),
        cost: store.get("cost", null)
      };
    },
    restore(snap) {
      Object.keys(snap).forEach((k) => { if (snap[k] !== null && snap[k] !== undefined) store.set(k, snap[k]); });
    },
    commit(message, kind) {
      const c = { id: this.id(), at: Date.now(), message, kind: kind || "change", parent: this.head, snapshot: this.snapshot() };
      this.log.unshift(c);
      this.head = c.id;
      this.persist();
      bridge.invoke("codex_git_commit", { message, kind: c.kind }).catch(() => {});
      return c;
    },
    /** Revert to the state *before* commit `id`, as a new commit. */
    revert(id) {
      const idx = this.log.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      const target = this.log[idx];
      const before = this.log[idx + 1];
      const snap = before ? before.snapshot : { profiles: null, activeProfile: null, config: {}, features: {}, appearance: {}, prices: null, cost: null };
      this.restore(snap);
      const c = { id: this.id(), at: Date.now(), message: (target.kind === "revert" ? "Undo of undo — " : "Undo — ") + target.message, kind: "revert", parent: this.head, reverts: target.id, snapshot: snap };
      this.log.unshift(c);
      this.head = c.id;
      this.persist();
      bridge.invoke("codex_git_commit", { message: c.message, kind: "revert" }).catch(() => {});
      return c;
    },
    undo() { return this.log.length ? this.revert(this.log[0].id) : null; },
    checkout(id) {
      const c = this.log.find((x) => x.id === id);
      if (!c) return null;
      this.restore(c.snapshot);
      const nc = { id: this.id(), at: Date.now(), message: "Restore — " + c.message, kind: "restore", parent: this.head, snapshot: c.snapshot };
      this.log.unshift(nc);
      this.head = nc.id;
      this.persist();
      return nc;
    }
  };

  g.CX = { bridge, store, toToml, evaluate, CONSTRUCTS, FLAGS, LIMITS, color, i18n, narrator, vcs, sim: state };
})(window);
