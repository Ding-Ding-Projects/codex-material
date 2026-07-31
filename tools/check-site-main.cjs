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

const ROOT = path.resolve(__dirname, "..");
const PAGE = path.join(ROOT, "docs", "site", "index.html");

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

  let failedEarly = false;
  const lines = [];
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

  process.stdout.write(lines.join("\n") + "\n\n" + (failed ? "SITE CHECK FAILED\n" : "SITE CHECK PASSED\n"));
  app.exit(failed ? 1 : 0);
});
