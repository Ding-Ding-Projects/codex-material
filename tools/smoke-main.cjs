"use strict";
/* Codex Studio — full smoke test, Electron main process.
 *
 * The unit tests exercise modules in a node:vm with a browser shim. The capture
 * harness proves the surfaces render. Neither answers the question this asks: does the
 * whole thing work when it is wired together — the real preload, the real command
 * handlers, the real `codex` binary, the real files on disk?
 *
 * Five phases, each reported and each able to fail the run:
 *
 *   CLI       the real binary is located and run. If `codex --version` does not
 *             answer, the app is a shell around nothing and the rest is theatre.
 *   IPC       every command on the preload allow-list, invoked THROUGH the renderer's
 *             own bridge exactly as the page would. That exercises the contextBridge,
 *             the named allow-list and the real ipcRenderer channel. Calling the
 *             handler module directly would prove the handlers work while saying
 *             nothing about whether the page can reach them.
 *   PANELS    all ten navigation panels, checked for unresolved bindings, a thrown
 *             render, and a minimum of real content.
 *   OVERLAYS  the seven dialogs the panel sweep never touches — regex builder,
 *             appearance editor, notification centre, bulk close, calendar, command
 *             palette, slash catalog. A binding that only exists inside a dialog can
 *             otherwise stay broken indefinitely: the command palette listed ten
 *             blank rows for exactly that reason until this phase opened it.
 *   LANGUAGES en, 廣東話 and bilingual at funny level 5, sweeping every panel. A key
 *             that fails to resolve renders as its own name, and a short table read
 *             past its end renders as nothing — both are invisible in English at the
 *             default level.
 *
 * It runs against the authored CODEX_HOME (tools/make-capture-home.mjs), so the
 * destructive commands mutate a fixture rather than the operator's own Codex install.
 * Commands that would reach outside that fixture are in SKIP, each with its reason —
 * an untested command that looks tested is worse than an obvious gap.
 */

const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const commands = require(path.join(__dirname, "..", "electron", "commands.js"));
const cli = require(path.join(__dirname, "..", "electron", "lib", "cli.js"));

const ROOT = path.join(__dirname, "..");
const OUT = process.env.CODEX_STUDIO_SMOKE_OUT || path.join(ROOT, "assets", "smoke.json");

const SKIP = {
  codex_logout: "would delete the fixture's credentials and need a human to restore parity",
  codex_login: "opens a browser and waits for a human",
  codex_open_external: "would open a browser window on the operator's desktop",
  codex_reveal: "would open Explorer on the operator's desktop",
  /* Skills are NOT under CODEX_HOME — skillList() enumerates the machine's real
     ~/.agents/skills, and skillToggle() renames a directory there. Pointing CODEX_HOME
     at a fixture does not isolate it, so exercising this would rename one of the
     operator's actual skill directories. Listing is safe and is exercised; toggling
     is not. */
  codex_skill_toggle: "skillToggle renames a directory under the machine's real ~/.agents/skills, which CODEX_HOME does not isolate",
  window_close: "would end the smoke run mid-flight",
  window_minimize: "drives the harness window, not the app under test",
  window_toggle_maximize: "drives the harness window, not the app under test",
};

/* Failure is the CORRECT outcome for these: a probe that names something which does
   not exist should be refused. Recorded as "refused" rather than counted as a pass, so
   the report never claims more than it proved. */
const MAY_REFUSE = new Set([
  "codex_plugin_install", "codex_plugin_uninstall", "codex_plugin_toggle",
  "codex_marketplace_add", "codex_marketplace_remove",
  "codex_session_action", "codex_wsl_spawn", "codex_wsl_stop", "codex_wsl_kill",
  "codex_wsl_exec", "codex_wsl_set", "codex_history_show", "codex_history_diff",
  "codex_cancel", "codex_capture", "codex_mcp_add", "codex_mcp_remove",
  /* An untrusted hook must refuse to be enabled. That refusal IS the feature, so a
     failure here is the correct outcome and is recorded as refused, not as a pass. */
  "codex_hook_toggle",
]);

/* Commands that shell out to `codex`. If the binary is absent AND the build has
   declared it optional, these cannot possibly work, so they are reported as "no-cli"
   rather than counted as failures — otherwise the workflow's documented
   no-bundled-CLI path could never go green. When the binary IS present they are
   exercised like everything else, so this never quietly reduces coverage. */
const NEEDS_CLI = new Set([
  "codex_version", "codex_doctor", "codex_run",
  "codex_mcp_list", "codex_mcp_toggle", "codex_mcp_add", "codex_mcp_remove",
  "codex_plugin_list", "codex_plugin_catalog", "codex_plugin_install",
  "codex_plugin_uninstall", "codex_plugin_toggle",
  "codex_marketplace_list", "codex_marketplace_add", "codex_marketplace_remove",
  "codex_features", "codex_set_feature", "codex_session_action", "codex_login_status",
]);

function argsFor(name, ctx) {
  const A = {
    codex_read_text: { path: path.join(ctx.home, "config.toml") },
    codex_set_config: { key: "smoke.probe", value: "yes" },
    codex_config_restore: { config: ctx.config || {} },
    codex_write_config: { tomlText: ctx.configText || "" },
    codex_run: { args: ["--version"] },
    codex_cancel: { id: "smoke-nonexistent" },
    codex_mcp_toggle: { name: "playwright" },
    codex_mcp_add: { name: "smoke_probe", command: "npx", args: ["-y", "x"] },
    codex_mcp_remove: { name: "smoke_probe" },
    codex_plugin_install: { name: "__smoke_probe_absent" },
    codex_plugin_uninstall: { name: "__smoke_probe_absent" },
    codex_plugin_toggle: { name: "__smoke_probe_absent" },
    codex_marketplace_add: { name: "__smoke_probe_absent", url: "https://example.invalid/smoke" },
    codex_marketplace_remove: { name: "__smoke_probe_absent" },

    codex_hook_toggle: { event: ctx.hookEvent || "pre_tool_use", index: ctx.hookIndex || 0 },
    codex_set_feature: { key: "web_search_request", value: true },
    codex_session_action: { id: ctx.sessionId || "none", action: "archive" },
    codex_wsl_spawn: { session: "smoke", distro: ctx.distro || "Ubuntu" },
    codex_wsl_stop: { session: "smoke" },
    codex_wsl_kill: { session: "smoke" },
    codex_wsl_set: { session: "smoke", distro: ctx.distro || "Ubuntu", cwd: "~" },
    codex_wsl_exec: { session: "smoke", command: "true" },
    codex_history_commit: { message: "smoke probe", kind: "change", snapshot: { smoke: true } },
    codex_history_log: { limit: 5 },
    codex_history_show: { id: ctx.revision || "HEAD" },
    codex_history_diff: { id: ctx.revision || "HEAD" },
    codex_history_prune: { keep: 500 },
    codex_capture: { name: "smoke" },
  };
  return A[name] || {};
}

const NAVS = ["chat", "console", "ext", "settings", "cost", "runtime", "health", "history", "changelog", "studio"];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (s) => process.stdout.write(s);
const report = { startedAt: new Date().toISOString(), cli: {}, ipc: [], panels: [], consoleErrors: [] };

async function main() {
  const home = process.env.CODEX_HOME || path.join(ROOT, ".capture-home");
  out("CODEX_HOME  " + home + "\n\n");

  const win = new BrowserWindow({
    width: 1600, height: 1000, x: -32000, y: -32000,
    show: false, frame: false, skipTaskbar: true, focusable: false,
    paintWhenInitiallyHidden: true, backgroundColor: "#141218",
    webPreferences: {
      preload: path.join(ROOT, "electron", "preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
      backgroundThrottling: false,
    },
  });
  win.showInactive();
  commands.setWindow(win);

  win.webContents.on("console-message", (_e, level, message) => {
    if (level >= 2) report.consoleErrors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, d) =>
    report.consoleErrors.push("renderer gone: " + d.reason));

  await win.loadFile(path.join(ROOT, "app", "index.html"));
  await wait(3500);

  const mounted = await win.webContents.executeJavaScript("!!window.__cxRoot").catch(() => false);
  if (!mounted) report.consoleErrors.push("the app never published window.__cxRoot — it did not mount");

  const hasBridge = await win.webContents.executeJavaScript("!!(window.CODEX_BRIDGE && window.CODEX_BRIDGE.invoke)").catch(() => false);
  if (!hasBridge) report.consoleErrors.push("window.CODEX_BRIDGE is absent — the preload did not run");

  /* ------------------------------------------------------------------- CLI */
  /* A missing binary normally fails the run: the app is a front end for `codex`, and
     one that cannot find it is a shell around nothing. The workflow does have a
     legitimate no-CLI path though — tools/fetch-codex.mjs may decline to stage a copy,
     and an installer without one is still usable by someone who already has Codex.
     That case sets CODEX_STUDIO_SMOKE_CLI_OPTIONAL, which downgrades this one phase to
     a reported warning rather than quietly weakening the check for everyone. */
  const cliOptional = process.env.CODEX_STUDIO_SMOKE_CLI_OPTIONAL === "1";
  out("CLI\n");
  try {
    const bin = cli.codexBin();
    const src = cli.codexSource ? cli.codexSource() : null;
    const v = await cli.run(["--version"], { timeout: 30000 });
    /* The committed report records WHERE THE BINARY CAME FROM, never where it is on
       this disk. An absolute path publishes the operator's account name, which is the
       same leak the authored CODEX_HOME exists to prevent — arriving through a JSON
       artifact instead of a screenshot. The full path is still printed to the console
       for whoever is running it. */
    report.cli = {
      resolvedFrom: (src && src.source) || "unknown",
      bundled: !!(src && src.bundled),
      name: path.basename(bin),
      ok: !!(v && v.ok),
      optional: cliOptional,
      stdout: ((v && v.stdout) || "").trim().slice(0, 80),
    };
    out("  " + (report.cli.ok ? "ok  " : "FAIL") + " " + bin + "\n       " + report.cli.stdout + "\n\n");
  } catch (e) {
    /* Redacted the same way: a resolution error routinely quotes the path it tried. */
    const msg = String((e && e.message) || e).replace(/[A-Za-z]:\\[^\s"']+|\/(?:home|Users)\/[^\s"']+/g, "<path>");
    report.cli = { ok: false, optional: cliOptional, error: msg };
    out("  " + (cliOptional ? "warn" : "FAIL") + " " + report.cli.error + "\n" +
        (cliOptional ? "       no CLI was staged, and this build does not require one\n" : "") + "\n");
  }

  /* ------------------------------------------------------------------- IPC */
  out("IPC\n");
  const preloadSrc = fs.readFileSync(path.join(ROOT, "electron", "preload.js"), "utf8");
  const block = /const COMMANDS = \[([\s\S]*?)\];/.exec(preloadSrc);
  const list = block ? [...block[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]) : [];
  if (!list.length) report.consoleErrors.push("could not read the preload allow-list — nothing was exercised");

  const raw = (name, a) =>
    win.webContents
      .executeJavaScript("window.CODEX_BRIDGE.invoke(" + JSON.stringify(name) + "," + JSON.stringify(a || {}) + ").then(r=>r).catch(()=>null)")
      .catch(() => null);

  const invoke = (name, a) =>
    win.webContents.executeJavaScript(
      "window.CODEX_BRIDGE.invoke(" + JSON.stringify(name) + "," + JSON.stringify(a || {}) + ")" +
      ".then(function(r){return {ok:true,shape:r===undefined?'undefined':Array.isArray(r)?'array('+r.length+')':typeof r};})" +
      ".catch(function(e){return {ok:false,error:String((e&&e.message)||e)};})",
    );

  const ctx = { home };
  ctx.config = await raw("codex_read_config");
  const txt = await raw("codex_read_config_text");
  ctx.configText = txt && (txt.text || txt.toml || "");
  const sess = await raw("codex_session_list");
  if (sess && sess[0]) ctx.sessionId = sess[0].id;
  const hist = await raw("codex_history_log", { limit: 1 });
  if (hist && hist.commits && hist.commits[0]) ctx.revision = hist.commits[0].id;
  const distros = await raw("codex_wsl_list");
  if (distros && distros[0]) ctx.distro = distros[0].name || distros[0];
  const hooks = await raw("codex_hook_list");
  if (hooks && hooks[0]) { ctx.hookEvent = hooks[0].event; ctx.hookIndex = hooks[0].index; }

  const noCli = cliOptional && !report.cli.ok;
  for (const name of list) {
    if (noCli && NEEDS_CLI.has(name)) {
      report.ipc.push({ name, status: "no-cli", why: "needs the codex binary, which this build does not bundle" });
      out("  --   " + name.padEnd(26) + "needs the codex binary, which this build does not bundle\n");
      continue;
    }
    if (SKIP[name]) {
      report.ipc.push({ name, status: "skipped", why: SKIP[name] });
      out("  skip " + name.padEnd(26) + SKIP[name] + "\n");
      continue;
    }
    const t0 = Date.now();
    let res;
    try {
      res = await Promise.race([
        invoke(name, argsFor(name, ctx)),
        new Promise((r) => setTimeout(() => r({ ok: false, error: "timed out after 45s" }), 45000)),
      ]);
    } catch (e) {
      res = { ok: false, error: String((e && e.message) || e) };
    }
    const ms = Date.now() - t0;
    if (res && res.ok) {
      report.ipc.push({ name, status: "ok", ms, shape: res.shape });
      out("  ok   " + name.padEnd(26) + String(ms).padStart(6) + "ms  " + res.shape + "\n");
    } else {
      const msg = String((res && res.error) || "no result");
      const expected = MAY_REFUSE.has(name);
      report.ipc.push({ name, status: expected ? "refused" : "FAIL", ms, error: msg.slice(0, 200) });
      out("  " + (expected ? "ref " : "FAIL") + " " + name.padEnd(26) + String(ms).padStart(6) + "ms  " + msg.slice(0, 86) + "\n");
    }
  }

  /* ---------------------------------------------------------------- PANELS */
  out("\nPANELS\n");
  for (const nav of NAVS) {
    const before = report.consoleErrors.length;
    const drove = await win.webContents
      .executeJavaScript("(function(){try{window.__cxRoot.setState({nav:" + JSON.stringify(nav) + "});return null;}catch(e){return String((e&&e.message)||e);}})()")
      .catch((e) => String(e));
    await wait(500);
    const seen = await win.webContents
      .executeJavaScript(
        "(function(){var r=document.getElementById('tabpanel-main');var t=r?r.innerText:'';" +
        "return {chars:t.length,unresolved:(t.match(/\\{\\{\\s*[\\w.$]+\\s*\\}\\}/g)||[]).length," +
        "controls:r?r.querySelectorAll('button,input,textarea,select').length:0};})()",
      )
      .catch((e) => ({ error: String(e) }));

    /* Grepping the rendered text for {{ … }} is a heuristic, and on the changelog it
       is simply wrong: that panel renders CHANGELOG.md, whose prose quotes template
       syntax when it describes a template bug — this project's own changelog contains
       "{{ c.value }}" for exactly that reason. The authoritative signal for a binding
       that failed to resolve is the dc runtime's own "never resolved" console warning,
       which is collected below. Text matches on that panel are recorded, not failed. */
    if (nav === "changelog" && seen && seen.unresolved) {
      seen.unresolvedInProse = seen.unresolved;
      seen.unresolved = 0;
    }
    const newErrors = report.consoleErrors.slice(before).filter((e) => !/Electron Security Warning/.test(e));
    const bad = drove || (seen && seen.error) || seen.unresolved > 0 || (seen.chars || 0) < 40 || newErrors.length > 0;
    report.panels.push({ nav, ...seen, drove: drove || null, newErrors, status: bad ? "FAIL" : "ok" });
    out("  " + (bad ? "FAIL" : "ok  ") + " " + nav.padEnd(11) +
        String(seen.chars || 0).padStart(6) + " chars  " +
        String(seen.controls || 0).padStart(4) + " controls  " +
        (seen.unresolved || 0) + " unresolved" +
        (drove ? "  threw: " + String(drove).slice(0, 50) : "") +
        (newErrors.length ? "  " + newErrors[0].slice(0, 55) : "") + "\n");
  }

  /* -------------------------------------------------------------- OVERLAYS
   *
   * The panel loop never opens these, so a binding that only exists inside a dialog
   * could be broken indefinitely without any of the checks noticing. Each is opened
   * the way the app opens it wherever there is a real opener, so the anchoring and
   * seeding code runs too rather than being bypassed by hand-set state. */
  out("\nOVERLAYS\n");
  const OVERLAYS = [
    { id: "regex builder", nav: "ext", open: 'window.__cxRoot.openRegexFor("ext", "")' },
    { id: "appearance", nav: "chat", open: '(function(){var h=document.querySelector("[data-appear]");return window.__cxRoot.openAppearFor(h);})()' },
    { id: "notif centre", nav: "chat", open: 'window.CX.notify.error("smoke","probe"),window.__cxRoot.setState({centreOpen:true})' },
    { id: "bulk close", nav: "chat", open: 'window.__cxRoot.setState({bulkOpen:true,bulkQuery:"a",bulkInvert:false,bulkPinned:false,bulkScope:{kind:"strip"}})' },
    { id: "calendar", nav: "changelog", open: 'window.__cxRoot.openCalendar("from",{clientX:600,clientY:300})' },
    { id: "palette", nav: "chat", open: 'window.__cxRoot.setState({paletteOpen:true,paletteQuery:"",paletteRegex:null})' },
    { id: "slash catalog", nav: "chat", open: 'window.__cxRoot.setState({slashOpen:true,slashQuery:""})' },
  ];
  const RESET_OVERLAYS = '{regexOpen:false,appearOpen:false,centreOpen:false,bulkOpen:false,calOpen:null,paletteOpen:false,slashOpen:false,dd:null,menu:null}';
  for (const o of OVERLAYS) {
    const before = report.consoleErrors.length;
    const threw = await win.webContents
      .executeJavaScript(
        "(function(){try{window.__cxRoot.setState(Object.assign(" + RESET_OVERLAYS + ",{nav:" + JSON.stringify(o.nav) + "}));}catch(e){return String(e);}" +
        "try{" + o.open + ";return null;}catch(e){return String((e&&e.message)||e);}})()",
      )
      .catch((e) => String(e));
    await wait(450);
    const seen = await win.webContents
      .executeJavaScript(
        "(function(){var t=document.body.innerText||'';" +
        "return {unresolved:(t.match(/\\{\\{\\s*[\\w.$]+\\s*\\}\\}/g)||[]).length};})()",
      )
      .catch((e) => ({ error: String(e) }));
    const newErrors = report.consoleErrors.slice(before).filter((e) => !/Electron Security Warning/.test(e));
    const bad = threw || (seen && seen.error) || newErrors.length > 0;
    report.overlays = report.overlays || [];
    report.overlays.push({ id: o.id, threw: threw || null, newErrors, status: bad ? "FAIL" : "ok" });
    out("  " + (bad ? "FAIL" : "ok  ") + " " + o.id.padEnd(14) +
        (threw ? "threw: " + String(threw).slice(0, 60) : newErrors.length ? newErrors[0].slice(0, 70) : "opened cleanly") + "\n");
  }
  await win.webContents.executeJavaScript("window.__cxRoot.setState(" + RESET_OVERLAYS + ")").catch(() => {});

  /* ------------------------------------------------------------- LANGUAGES
   *
   * A missing i18n key resolves to the key name, and at funny level 5 a short table
   * resolves past its end — both render as something a user should never see. Sweeping
   * the panels in each language mode at the highest level is where those surface. */
  out("\nLANGUAGES\n");
  report.languages = [];
  for (const mode of ["en", "yue", "bi"]) {
    const before = report.consoleErrors.length;
    await win.webContents
      .executeJavaScript(
        "(function(){window.CX.i18n.mode=" + JSON.stringify(mode) + ";window.CX.i18n.funny={en:5,yue:5};" +
        "if(window.CX.i18n.save)window.CX.i18n.save();window.__cxRoot.setState({lang:" + JSON.stringify(mode) + "});})()",
      )
      .catch(() => {});
    let unresolvedKeys = 0;
    let emptyLabels = 0;
    for (const nav of NAVS) {
      await win.webContents.executeJavaScript("window.__cxRoot.setState({nav:" + JSON.stringify(nav) + "})").catch(() => {});
      await wait(220);
      const r = await win.webContents
        .executeJavaScript(
          "(function(){var root=document.getElementById('tabpanel-main');var t=root?root.innerText:'';" +
          // a key that did not resolve renders as its own dotted name
          /* A key that fails to resolve renders as its own dotted name, but matching
             that shape in rendered TEXT is unreliable: the changelog panel is prose
             that legitimately contains config.toml and wsl.js, and — because this
             project documented its own i18n bugs — literal key names like nav.chats.
             That produced 34 identical false positives in all three languages.
             Ask the string table instead. A key that resolves to itself is missing,
             and documentation cannot be mistaken for one. */
          "var keys=[];try{var S=(window.CX_I18N&&window.CX_I18N.STRINGS)||{};" +
          "for(var k in S){var v=window.CX.i18n.t(k);if(!v||v===k)keys.push(k);}}catch(e){}" +
          "var btns=root?[].slice.call(root.querySelectorAll('button')).filter(function(b){return !b.textContent.trim() && !b.getAttribute('aria-label') && !b.title;}).length:0;" +
          "return {keys:keys.length,keyList:keys.slice(0,3),empty:btns};})()",
        )
        .catch(() => ({ keys: 0, empty: 0, keyList: [] }));
      unresolvedKeys += r.keys || 0;
      emptyLabels += r.empty || 0;
      if (r.keys && report.languages.length === 0) report.firstUnresolvedSample = r.keyList;
    }
    const newErrors = report.consoleErrors.slice(before).filter((e) => !/Electron Security Warning/.test(e));
    const bad = unresolvedKeys > 0 || newErrors.length > 0;
    report.languages.push({ mode, unresolvedKeys, emptyLabels, newErrors, status: bad ? "FAIL" : "ok" });
    out("  " + (bad ? "FAIL" : "ok  ") + " " + mode.padEnd(4) + " funny 5 across all ten panels — " +
        unresolvedKeys + " unresolved key(s), " + emptyLabels + " unlabelled button(s)" +
        (newErrors.length ? "  " + newErrors[0].slice(0, 50) : "") + "\n");
  }
  await win.webContents
    .executeJavaScript('(function(){window.CX.i18n.mode="en";window.CX.i18n.funny={en:3,yue:3};window.__cxRoot.setState({lang:"en",nav:"chat"});})()')
    .catch(() => {});

  /* --------------------------------------------------------------- verdict */
  const fatalConsole = report.consoleErrors.filter((e) => !/Electron Security Warning/.test(e));
  const s = {
    ipcOk: report.ipc.filter((r) => r.status === "ok").length,
    ipcRefused: report.ipc.filter((r) => r.status === "refused").length,
    ipcSkipped: report.ipc.filter((r) => r.status === "skipped").length,
    ipcNoCli: report.ipc.filter((r) => r.status === "no-cli").length,
    ipcFailed: report.ipc.filter((r) => r.status === "FAIL").length,
    panelsOk: report.panels.filter((r) => r.status === "ok").length,
    panelsFailed: report.panels.filter((r) => r.status === "FAIL").length,
    cliOk: !!report.cli.ok,
    overlaysOk: (report.overlays || []).filter((r) => r.status === "ok").length,
    overlaysFailed: (report.overlays || []).filter((r) => r.status === "FAIL").length,
    languagesOk: (report.languages || []).filter((r) => r.status === "ok").length,
    languagesFailed: (report.languages || []).filter((r) => r.status === "FAIL").length,
    consoleErrors: fatalConsole.length,
  };
  report.summary = s;
  /* Redact before writing, not at each site that might produce a path. This file is
     committed and mirrored, and error strings from the CLI, the filesystem and the
     WSL layer all quote absolute paths freely — any one of which publishes the
     operator's account name. Doing it once here means a new phase cannot forget.
     The console output above is unredacted, because that is for the person running
     it and never leaves the machine. */
  /* Written as a literal, not built from a string: the double-escaping needed to
     express a Windows path inside a string passed to `new RegExp` is exactly the kind
     of thing that silently produces a pattern matching nothing.
     `Public` and `dev` are allowed through — the first is where the fixture lives and
     the second is the fixture's authored operator name, both of which are meant to be
     visible. Everything else under a home directory is replaced. */
  const HOMEISH = /[A-Za-z]:\\+Users\\+(?!Public|dev)[^"',\s]*|\/(?:home|Users)\/(?!dev)[^"',\s]*/g;
  const redacted = JSON.stringify(report, null, 2).replace(HOMEISH, "<redacted-home-path>");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, redacted);

  out("\nSUMMARY\n");
  out("  CLI      " + (s.cliOk ? "the real binary answered" : cliOptional ? "absent, and this build does not require one" : "DID NOT ANSWER") + "\n");
  out("  IPC      " + s.ipcOk + " ok, " + s.ipcRefused + " refused as designed, " + s.ipcSkipped + " skipped" +
      (s.ipcNoCli ? ", " + s.ipcNoCli + " need a CLI this build does not bundle" : "") +
      ", " + s.ipcFailed + " failed\n");
  out("  Panels   " + s.panelsOk + " ok, " + s.panelsFailed + " failed\n");
  out("  Overlays " + s.overlaysOk + " ok, " + s.overlaysFailed + " failed\n");
  out("  Language " + s.languagesOk + " ok, " + s.languagesFailed + " failed (en/yue/bi at funny level 5)\n");
  out("  Console  " + s.consoleErrors + " unexpected error(s)\n");
  out("  report   " + path.relative(ROOT, OUT).replace(/\\/g, "/") + "\n");

  const bad = s.ipcFailed + s.panelsFailed + s.overlaysFailed + s.languagesFailed + s.consoleErrors + (s.cliOk || cliOptional ? 0 : 1);
  out(bad === 0 ? "\nSMOKE TEST PASSED\n" : "\nSMOKE TEST FAILED — " + bad + " problem(s)\n");
  win.destroy();
  app.exit(bad === 0 ? 0 : 1);
}

app.disableHardwareAcceleration();
app.whenReady().then(() =>
  main().catch((e) => {
    process.stderr.write("smoke failed to run: " + (e && e.stack ? e.stack : e) + "\n");
    app.exit(2);
  }),
);
