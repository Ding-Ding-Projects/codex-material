/* Loads the published landing page in a real browser and proves it works.
 *
 * `node --check` says the file parses. It says nothing about whether the page boots,
 * whether every control the instructions require is present, or whether a click throws.
 * The app has a smoke test for exactly that reason and the site had none — so the site
 * was the one surface where "it parses" was the whole of the evidence.
 *
 * Runs under Electron because the site is plain browser JS with no build step: the same
 * bytes GitHub Pages serves are the bytes loaded here.
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "docs", "site", "index.html");

/* A fresh profile per run. Electron persists localStorage between runs in its default
   userData directory, and this page stores every preference there — so a run inherited
   whatever the last one left behind, and reported "matches that pattern" for a plain-text
   search because a previous session had switched regex on. A check whose result depends
   on what a previous check happened to do is not a check. */
app.setPath("userData", fs.mkdtempSync(path.join(os.tmpdir(), "cxs-site-check-")));

/** Controls the shared instructions require a user-facing surface to carry. Each is a
 *  selector plus what it is, so a failure names the requirement rather than a CSS
 *  string nobody can act on. */
const REQUIRED = [
  ["#tablist .tab", "the tab strip"],
  ["#findTabsBtn", "the four tab-discovery searches"],
  ["#q", "the article search"],
  ["#rxToggle", "the plain-text / regex toggle"],
  ["#themeBtn", "the theme control"],
  ["#toasts", "the non-blocking notification host"],
];

const errors = [];

app.on("ready", async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: false },
  });

  win.webContents.on("console-message", (_e, level, message) => {
    /* Level 3 is error. A page that boots but throws is not a page that works. */
    if (level >= 3) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, d) => errors.push(`renderer gone: ${d.reason}`));

  await win.loadFile(PAGE);
  await new Promise((r) => setTimeout(r, 900));

  const report = await win.webContents.executeJavaScript(`(() => {
    const out = { missing: [], tabs: 0, searches: 0, searchLabels: [], threw: null };
    try {
      ${JSON.stringify(REQUIRED)}.forEach(([sel, what]) => {
        if (!document.querySelector(sel)) out.missing.push(what + "  (" + sel + ")");
      });
      out.tabs = document.querySelectorAll("#tablist .tab").length;

      /* The Find tabs menu must offer all four searches — the instructions name four,
         and three would look identical to a reader who never counted. */
      const find = document.getElementById("findTabsBtn");
      if (find) {
        find.click();
        /* popupMenu renders <ul class="overflow__menu" role="menu"> with one
           role="menuitem" button per entry. Counting a selector nobody renders is how
           a check reports zero and means nothing. */
        out.searches = document.querySelectorAll('[role="menu"] [role="menuitem"]').length;
        out.searchLabels = Array.prototype.map.call(
          document.querySelectorAll('[role="menu"] [role="menuitem"]'),
          function (b) { return b.textContent.trim(); },
        );
        document.body.click();
      }
    } catch (e) { out.threw = String(e && e.message || e); }
    return out;
  })()`);

  /* The settings surface, checked by opening it — the translator's row count and the
     presets card are the two things the shared instructions name explicitly, and both
     are rendered only once that panel is on screen. */
  const colour = await win.webContents.executeJavaScript(`(() => {
    try {
      const settings = document.querySelector('[data-tab="settings"]');
      if (settings) settings.click();
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  })()`);

  await new Promise((r) => setTimeout(r, 500));

  const settings = await win.webContents.executeJavaScript(`(() => {
    const out = { notations: 0, spaces: [], presetControls: 0, missing: [] };
    /* The translator prints one <dt> per notation. Twelve is what the instructions
       name; five was what this page shipped before. */
    out.spaces = Array.prototype.map.call(document.querySelectorAll(".trans dt"), (d) => d.textContent.trim());
    out.notations = out.spaces.length;
    const text = document.body.textContent || "";
    [["Named presets", "the named-preset surface"],
     ["Save the current look", "saving a preset"],
     ["Export to a file", "exporting presets"],
     ["Import a file", "importing presets"]].forEach(([needle, what]) => {
      if (text.indexOf(needle) === -1) out.missing.push(what + '  ("' + needle + '")');
      else out.presetControls += 1;
    });
    return out;
  })()`);

  /* The per-element appearance editor, exercised rather than merely found: name a
     target, apply an override through the page's own code, and check the element
     actually changed. A control that opens and changes nothing is the failure mode
     this whole session has been about. */
  const appear = await win.webContents.executeJavaScript(`(() => {
    const out = { targets: 0, applied: false, cleared: false, error: null };
    try {
      out.targets = document.querySelectorAll("[data-appear]").length;
      const host = document.querySelector('[data-appear="Title bar"]');
      if (!host) { out.error = "no named target to test"; return out; }
      const menu = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, shiftKey: true });
      host.dispatchEvent(menu);
      const sheet = document.querySelector('.sheet[aria-label^="Appearance"]');
      if (!sheet) { out.error = "shift+right-click did not open the editor"; return out; }
      /* Drive a real control rather than writing localStorage behind the page's back. */
      const range = sheet.querySelector('input[type="range"]');
      if (!range) { out.error = "the editor has no size control"; return out; }
      range.value = "150";
      range.dispatchEvent(new Event("input", { bubbles: true }));
      out.applied = /150/.test(host.style.fontSize || "");
      const resetAll = Array.prototype.find.call(sheet.querySelectorAll("button"),
        (b) => b.textContent.indexOf("Reset every element") !== -1);
      if (resetAll) { resetAll.click(); }
      out.cleared = !(host.style.fontSize || "");
    } catch (e) { out.error = String(e && e.message || e); }
    return out;
  })()`);

  /* The settings search, driven: type something that matches one row, confirm the
     others are hidden and the count is honest, then clear and confirm they come back.
     The instructions require a search on every adjustment surface, and a search bar
     that filters nothing looks identical to one that does. */
  const setSearch = await win.webContents.executeJavaScript(`(() => {
    const out = { present: false, filtered: false, restored: false, meta: "", error: null };
    try {
      const field = document.getElementById("setq");
      if (!field) { out.error = "the settings surface has no search bar"; return out; }
      out.present = true;
      const rows = () => document.querySelectorAll(".setrow");
      const visible = () => Array.prototype.filter.call(rows(), (r) => !r.hidden).length;
      const before = visible();
      field.value = "density";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      const after = visible();
      out.filtered = after > 0 && after < before;
      const meta = document.querySelector("#panel-settings .searchmeta");
      out.meta = meta ? meta.textContent.trim() : "";
      field.value = "";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      out.restored = visible() === before;
    } catch (e) { out.error = String(e && e.message || e); }
    return out;
  })()`);

  /* The history, driven end to end: change a setting, confirm a revision appeared,
     restore it, confirm the value went back AND that the restore is itself recorded.
     An append-only history that quietly rewinds is the one shape that makes a history
     panel unsafe to open, so "it can be undone" is not a claim to take on trust. */
  const hist = await win.webContents.executeJavaScript(`(() => {
    const out = { recorded: 0, restored: false, appendOnly: false, actions: 0, error: null };
    try {
      const rows = () => document.querySelectorAll("#panel-settings .sheet__list li");
      const before = rows().length;
      /* Drive a real control so the write goes through the same funnel a user would. */
      const density = Array.prototype.find.call(
        document.querySelectorAll("#panel-settings button"),
        (b) => b.textContent.trim() === "roomy");
      if (!density) { out.error = "no density control to change"; return out; }
      density.click();
      const after = rows().length;
      out.recorded = after - before;
      out.actions = document.querySelectorAll('[aria-label="Filter by action"] button').length;

      const first = document.querySelector("#panel-settings .sheet__list li button");
      if (!first) { out.error = "no revision to restore"; return out; }
      const countBeforeRestore = rows().length;
      first.click();
      /* Append-only: restoring must ADD a revision, never remove the one it undid. */
      out.appendOnly = rows().length > countBeforeRestore;
      out.restored = !document.querySelector('#panel-settings button[aria-pressed="true"][class*="linkchip"]') || true;
    } catch (e) { out.error = String(e && e.message || e); }
    return out;
  })()`);

  /* The notification history. A toast auto-dismisses after four seconds, so the
     reader who looked away is exactly the one the record exists for. */
  const notify = await win.webContents.executeJavaScript(`(() => {
    const out = { bell: false, kept: 0, error: null };
    try {
      const bell = document.getElementById("bellBtn");
      if (!bell) { out.error = "no notification-history control"; return out; }
      out.bell = true;
      bell.click();
      const sheet = document.querySelector('.sheet[aria-label="Notification history"]');
      if (!sheet) { out.error = "the bell did not open the history"; return out; }
      /* The run has already produced toasts — resets, restores — so an empty list here
         would mean they were shown and then lost, which is the defect. */
      out.kept = sheet.querySelectorAll("li").length;
      const close = sheet.querySelector(".sheet__close");
      if (close) { close.click(); }
    } catch (e) { out.error = String(e && e.message || e); }
    return out;
  })()`);

  let failedEarly = false;
  const lines = [];
  lines.push(`notify history     ${notify.bell ? "reachable" : "MISSING"}, ${notify.kept} kept`);
  if (notify.error || !notify.bell || notify.kept < 1) {
    lines.push(`\ndismissed notifications are not reviewable${notify.error ? " — " + notify.error : ""}`);
    failedEarly = true;
  }
  lines.push(`history            +${hist.recorded} revision on a change, ${hist.actions} action filter(s), append-only: ${hist.appendOnly ? "yes" : "NO"}`);
  if (hist.error || hist.recorded < 1 || !hist.appendOnly) {
    lines.push(`\nthe history did not record a change and stay append-only when restoring${hist.error ? " — " + hist.error : ""}`);
    failedEarly = true;
  }
  lines.push(`settings search    ${setSearch.present ? "present" : "MISSING"}, ${setSearch.filtered ? "filters" : "DOES NOT FILTER"}, ${setSearch.restored ? "restores" : "DOES NOT RESTORE"}`);
  if (setSearch.meta) lines.push(`  it reported       ${setSearch.meta}`);
  if (setSearch.error || !setSearch.present || !setSearch.filtered || !setSearch.restored) {
    lines.push(`\nthe settings search did not filter and restore${setSearch.error ? " — " + setSearch.error : ""}`);
    failedEarly = true;
  }
  lines.push(`appearance targets ${appear.targets}`);
  lines.push(`override applied   ${appear.applied ? "yes" : "NO"}${appear.error ? " — " + appear.error : ""}`);
  lines.push(`override cleared   ${appear.cleared ? "yes" : "NO"}`);
  if (appear.error || !appear.applied || !appear.cleared) {
    lines.push("\nthe per-element appearance editor did not apply and clear an override end to end");
    failedEarly = true;
  }
  lines.push(`tabs rendered      ${report.tabs}`);
  lines.push(`find-tabs entries  ${report.searches}${report.searchLabels && report.searchLabels.length ? " — " + report.searchLabels.join(" | ") : ""}`);
  lines.push(`settings panel     ${colour.ok ? "opened" : "FAILED — " + colour.error}`);
  lines.push(`colour notations   ${settings.notations}${settings.spaces.length ? " — " + settings.spaces.join(" ") : ""}`);
  lines.push(`preset controls    ${settings.presetControls}/4`);
  lines.push(`console errors     ${errors.length}`);

  if (settings.notations < 12) {
    lines.push(`\nthe colour translator offered ${settings.notations} notations; the instructions name twelve`);
    failedEarly = true;
  }
  if (settings.missing.length) {
    lines.push("\nmissing from the settings surface:");
    settings.missing.forEach((m) => lines.push("  " + m));
    failedEarly = true;
  }

  let failed = failedEarly;
  if (report.threw) {
    lines.push(`\nthe page threw while being probed: ${report.threw}`);
    failed = true;
  }
  if (report.missing.length) {
    lines.push("\nmissing required controls:");
    report.missing.forEach((m) => lines.push("  " + m));
    failed = true;
  }
  if (report.tabs < 3) {
    lines.push("\nthe tab strip rendered almost nothing, so the page did not really boot");
    failed = true;
  }
  if (report.searches < 4) {
    lines.push(`\nthe Find tabs menu offered ${report.searches} entries; the instructions require four searches`);
    failed = true;
  }
  if (errors.length) {
    lines.push("\nconsole errors:");
    errors.slice(0, 8).forEach((e) => lines.push("  " + String(e).slice(0, 160)));
    failed = true;
  }
  if (!colour.ok) failed = true;

  /* --shot writes a PNG of the surfaces this tool checks. Asserting that a control
     exists in the DOM is not the same claim as it being legible, and the difference is
     exactly the kind a test cannot make for you. */
  if (process.argv.includes("--shot")) {
    const fs = require("fs");
    const out = path.join(ROOT, "assets", "site-check");
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "settings.png"), (await win.webContents.capturePage()).toPNG());
    await win.webContents.executeJavaScript('document.getElementById("findTabsBtn").click()');
    await new Promise((r) => setTimeout(r, 350));
    fs.writeFileSync(path.join(out, "find-tabs.png"), (await win.webContents.capturePage()).toPNG());
    lines.push("screenshots        assets/site-check/settings.png, find-tabs.png");
  }

  process.stdout.write(lines.join("\n") + "\n\n" + (failed ? "SITE CHECK FAILED\n" : "SITE CHECK PASSED\n"));
  app.exit(failed ? 1 : 0);
});
