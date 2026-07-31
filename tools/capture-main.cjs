"use strict";
/* Electron main process for the capture harness.
 *
 * Loads the real frontend with the real preload, drives it by dispatching the same
 * state changes a user's clicks would, and writes a PNG per surface. Nothing is
 * mocked: if a panel throws, the capture of that panel shows the failure rather than
 * quietly producing a pretty picture of something that does not work. */

const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

// The real backend, not a stub. A screenshot of a panel that only works under the
// harness is worse than no screenshot at all.
const commands = require(path.join(__dirname, "..", "electron", "commands.js"));

const ROOT = path.join(__dirname, "..");
const OUT = process.env.CODEX_STUDIO_CAPTURE_DIR || path.join(ROOT, "assets", "screenshots");
const ONLY = process.env.CODEX_STUDIO_CAPTURE_ONLY || "";

/** Each shot names the surface, the state it needs, and what a reader should look at.
 *
 *  These deliberately show each feature IN USE rather than at rest. A screenshot of a
 *  filter with nothing filtered, or a search with nothing searched, documents that the
 *  control exists and nothing else — the reader still cannot tell whether it works.
 *  Where a shot needs data, it is committed through the app's own code paths in
 *  `before`, so what appears is what the app actually produces. */
const SHOTS = [
  {
    id: "chats",
    file: "01-chats.png",
    nav: "chat",
    note: "Chats — the session list read from the rollout files, and the composer's exact codex invocation",
  },
  {
    id: "console",
    file: "02-console.png",
    nav: "console",
    note: "Console — codex exec with its flags as Material controls and the composed argv beneath them",
    state: { consoleSub: "exec" },
  },
  {
    id: "extend",
    file: "03-extend.png",
    nav: "ext",
    note: "Extend — the MCP servers read from config.toml, each with the command it runs",
  },
  {
    id: "features",
    file: "03b-features.png",
    nav: "ext",
    note: "Extend ▸ Feature flags — every key the CLI exposes, filtered live",
    state: { extCat: "features", extQuery: "web" },
  },
  {
    id: "config",
    file: "04-config.png",
    nav: "settings",
    /* The shortest section, deliberately: the TOML preview sits below the fields, and
       a 16-field section pushes it off the bottom — which is how the previous shot
       came to be captioned "with live TOML preview" while showing no preview. */
    note: "Config — a config.toml section with the live preview of the TOML it will write",
    state: { setSection: "shellenv" },
  },
  {
    id: "cost",
    file: "05-cost.png",
    nav: "cost",
    note: "Cost — the same workload priced against every model, with the sidebar marking the ones it has no price for",
  },
  {
    id: "runtime",
    file: "06-runtime.png",
    nav: "runtime",
    note: "Runtime — one WSL instance per tab, each with the wsl.exe command that tab would run",
  },
  {
    id: "health",
    file: "07-health.png",
    nav: "health",
    note: "Health ▸ Doctor — what `codex doctor --json` reported, with ok, warning and failing states distinguished",
  },
  {
    id: "usage",
    file: "07b-usage.png",
    nav: "health",
    note: "Health ▸ Usage — real token counts read from the newest session's last token_count event",
    state: { healthView: "usage" },
  },
  {
    id: "cloud",
    file: "07c-cloud.png",
    nav: "health",
    note: "Health ▸ Cloud tasks — what `codex cloud list` actually reported",
    state: { healthView: "cloud" },
  },
  {
    id: "history",
    file: "08-history.png",
    nav: "history",
    /* Seeded through CX.vcs.commit, so these are revisions the app itself wrote —
       a history panel photographed with one row proves nothing about filtering. */
    before: `
      (function () {
        var v = window.CX.vcs;
        if (v.log.length > 4) return;
        v.commit("Set model gpt-5.1-codex-max on Personal", "profile");
        v.commit("Wrote 6 config keys for Personal", "config");
        v.commit("Enable feature web_search_request", "change");
        v.commit("Restyled the Composer", "appearance");
        v.commit("Set approval policy on-request", "profile");
        v.commit("Wrote 2 config keys for Review", "config");
      })()
    `,
    note: "History — every change the app made, filterable by date, by action and by text at once",
  },
  {
    id: "historyfilter",
    file: "08b-history-filter.png",
    nav: "history",
    note: "History ▸ filtered — the action chips are derived from the log itself, with a count beside each",
    before: `
      (function () {
        var v = window.CX.vcs;
        if (v.log.length > 4) return;
        v.commit("Set model gpt-5.1-codex-max on Personal", "profile");
        v.commit("Wrote 6 config keys for Personal", "config");
        v.commit("Enable feature web_search_request", "change");
        v.commit("Restyled the Composer", "appearance");
        v.commit("Set approval policy on-request", "profile");
      })()
    `,
    state: { histActions: ["profile", "config"] },
  },
  {
    id: "changelog",
    file: "09-changelog.png",
    nav: "changelog",
    note: "Changelog viewer — every released version, with bold and code spans rendered rather than printed",
  },
  {
    id: "calendar",
    file: "09b-calendar.png",
    nav: "changelog",
    note: "Changelog date filter — the anchored calendar, with the range highlighted and presets beside it",
    after: "__setState({ clogFrom: '2026-07-01', clogTo: '2026-07-31', calOpen: 'from', calMonth: Date.now(), calAt: { x: 700, y: 300 } })",
  },
  {
    id: "studio",
    file: "10-studio.png",
    nav: "studio",
    note: "Studio settings — language mode, the two independent funny sliders, narrator, dim sum, editor",
  },
  {
    id: "regex",
    file: "11-regex-builder.png",
    nav: "ext",
    note: "Regex builder anchored beside the search bar that opened it, matching the values that field filters",
    after: `window.__cxRoot.openRegexFor("ext", ""); window.__cxRoot.setState({ regexPattern: "^\\\\w+[-_]\\\\w+" });`,
  },
  {
    id: "appearance",
    file: "12-appearance.png",
    nav: "chat",
    note: "Per-element appearance editor — the typography half: slant, capitalization, five underline styles, single and double strike, super/subscript, direction and alignment",
    after: `
      (() => {
        const host = document.querySelector('[data-appear="Composer"]') || document.querySelector('[data-appear]');
        window.__cxRoot.openAppearFor(host);
      })()
    `,
  },
  {
    /* The editor is 23 properties tall and scrolls internally, so one frame cannot
       show it. This is the same panel scrolled to the colour half: the six colour
       targets, the 2-D field, the hue strip and the translator. Two honest
       screenshots beat one that crops the feature and a caption that describes what
       is off-frame. */
    id: "appearance-colour",
    file: "12b-appearance-colour.png",
    nav: "chat",
    /* The scroll clamps at the bottom, because what follows the colour heading is
       itself taller than the panel. So this frames the end of the editor rather than
       the colour chips, and the note says that instead of promising the chips. */
    note: "The same editor scrolled to its end — the continuous colour field and hue strip, the twelve-space translator, the live contrast readout, and the three properties this build cannot represent, each with its reason",
    after: `
      (() => {
        const host = document.querySelector('[data-appear="Composer"]') || document.querySelector('[data-appear]');
        window.__cxRoot.openAppearFor(host);
        return new Promise((done) => {
          requestAnimationFrame(() => {
            const panel = document.querySelector('[data-appear="Appearance editor"]');
            // Scroll to the colour target chips rather than to a pixel offset: the
            // panel's height changes with the language mode, and a hard-coded scroll
            // would frame something different in 廣東話.
            const anchor = panel && [...panel.querySelectorAll("div")].find(
              (d) => d.textContent.trim() === "COLOUR" || d.textContent.trim() === "顏色"
            );
            // offsetTop is already relative to the panel — it is position:fixed, so it
            // is the offsetParent for everything inside it. Subtracting the panel's own
            // offsetTop as well over-scrolled past the colour chips this shot exists to
            // show.
            if (anchor && panel) panel.scrollTop = Math.max(0, anchor.offsetTop - 12);
            else if (panel) panel.scrollTop = panel.scrollHeight;
            requestAnimationFrame(() => done(true));
          });
        });
      })()
    `,
  },
  {
    id: "notifications",
    file: "13-notifications.png",
    nav: "chat",
    note: "Corner notification stack and the reviewable centre — both visible at once, neither covering the other",
    after: `
      CX.notify.error("MCP server could not be added", "codex mcp add postgres — exit 1: name already exists");
      CX.notify.warn("YOLO mode is on", "approvals off, sandbox off on Personal — it survives a restart");
      CX.notify.success("Installed secrets-guard", "codex plugin add secrets-guard");
    `,
    state: { centreOpen: true },
  },
  {
    id: "bulkclose",
    file: "14-bulk-close.png",
    nav: "chat",
    note: "Bulk close preview — the one place a blocking dialog is correct, with the affected tabs listed first",
    state: { bulkOpen: true, bulkQuery: "a", bulkInvert: false, bulkPinned: false, bulkScope: { kind: "strip" } },
  },
  {
    id: "palette",
    file: "14b-palette.png",
    nav: "chat",
    note: "Command palette — every screen, profile, session, setting and flag, searchable with its own regex builder",
    state: { paletteOpen: true, paletteQuery: "", paletteRegex: null },
  },
  {
    id: "dimsum",
    file: "15-dim-sum.png",
    nav: "chat",
    note: "Dim sum surprise — a bundled catalog photo, non-blocking and auto-dismissing, drawn 1% of launches",
    after: `CX.dimsum.drawn = false; const d = window.CX_DIMSUM.draw(1); __setState({ dimSum: d });`,
  },
  {
    id: "light",
    file: "16-light-theme.png",
    nav: "settings",
    note: "Light theme — the same surface under the M3 light palette",
    before: `document.documentElement.setAttribute("data-theme","light");`,
    state: { theme: "light" },
  },
  {
    id: "cantonese",
    file: "17-cantonese.png",
    nav: "chat",
    note: "Bilingual mode at funny level 5 — the rail, the headings and the empty state all localised",
    before: `CX.i18n.mode = "bi"; CX.i18n.funny = { en: 5, yue: 5 }; CX.i18n.save && CX.i18n.save();`,
    state: { lang: "bi" },
  },
  {
    id: "cantonesestudio",
    file: "17b-cantonese-studio.png",
    nav: "studio",
    note: "The two funny sliders in 廣東話 — one per language, each independently persisted",
    before: `CX.i18n.mode = "yue"; CX.i18n.funny = { en: 1, yue: 5 }; CX.i18n.save && CX.i18n.save();`,
    state: { lang: "yue" },
  },
];

function shots() {
  if (!ONLY) return SHOTS;
  return SHOTS.filter((s) => s.id === ONLY);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // Headless, but composited. A window created with `show: false` is never painted,
  // so `capturePage` returns whatever frame happened to exist — which shows up as
  // every screenshot lagging one state behind the one it was supposed to document.
  // Showing it far off-screen keeps the compositor running without ever putting a
  // pixel on a monitor the user can see.
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    x: -32000,
    y: -32000,
    show: false,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    paintWhenInitiallyHidden: true,
    backgroundColor: "#141218",
    webPreferences: {
      preload: path.join(ROOT, "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  win.showInactive();

  commands.setWindow(win);

  const errors = [];
  win.webContents.on("console-message", (_e, level, message) => {
    if (level >= 2) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, details) =>
    errors.push(`renderer gone: ${details.reason}`),
  );

  await win.loadFile(path.join(ROOT, "app", "index.html"));

  // Give the design-compiler runtime time to compile the template, mount React and
  // finish the first backend round trip.
  await wait(3500);

  // Expose a setState hook the harness can drive. The dc runtime keeps the mounted
  // logic instance in its registry; this reaches it the same way the app's own event
  // handlers do, so nothing here is a special code path.
  // The app publishes its mounted logic instance on window.__cxRoot for exactly this.
  const hooked = await win.webContents.executeJavaScript(`
    (() => {
      window.__setState = (patch) => {
        if (!window.__cxRoot) return false;
        window.__cxRoot.setState(patch);
        return true;
      };
      return !!window.__cxRoot;
    })()
  `);
  if (!hooked) errors.push("the app did not publish window.__cxRoot — surfaces cannot be driven");

  const list = shots();
  const written = [];
  // Every shot starts from a clean slate: overlays left open by the previous one
  // would otherwise stack up and the later screenshots would show four dialogs at
  // once instead of the single surface they are supposed to document.
  // Every piece of overlay state the app can hold. A key missing from this list is an
  // overlay from the previous shot photobombing the next one — the light-theme capture
  // shipped with the calendar popover floating over the Config panel because `calOpen`
  // was added to the app after this list was written.
  const RESET = {
    regexOpen: false, appearOpen: false, bulkOpen: false, centreOpen: false,
    calOpen: null, dimSum: null, menu: null, dd: null, paletteOpen: false, slashOpen: false,
    theme: "dark", clogQuery: "", clogRegex: "", clogFrom: "", clogTo: "", clogPreset: "all",
    studioQuery: "", studioRegex: null, listQuery: "", listRegex: null,
    extQuery: "", extRegex: null, setQuery: "", setRegex: null,
    healthView: "doctor", thinking: false,
    histActions: [], histFrom: "", histTo: "", histQuery: "", histRegex: null,
    consoleSub: "exec", extCat: "mcp", lang: "en",
  };

  for (const shot of list) {
    await win.webContents
      /* The language shots mutate CX.i18n directly, which is outside React state, so
         resetting the component alone would leave the next shot in 廣東話. */
      .executeJavaScript(`document.documentElement.setAttribute("data-theme","dark"); if (window.CX) { if (window.CX.notify) window.CX.notify.dismissAll(); if (window.CX.i18n) { window.CX.i18n.mode = "en"; window.CX.i18n.funny = { en: 3, yue: 3 }; } } window.__setState ? window.__setState(${JSON.stringify(RESET)}) : false`)
      .catch(() => {});
    await wait(150);
    if (shot.before) await win.webContents.executeJavaScript(shot.before).catch(() => {});
    const patch = JSON.stringify({ nav: shot.nav, ...(shot.state || {}) });
    const applied = await win.webContents
      .executeJavaScript(`window.__setState ? window.__setState(${patch}) : false`)
      .catch(() => false);
    if (shot.after) await win.webContents.executeJavaScript(shot.after).catch((e) => errors.push(String(e)));
    await wait(900);
    // Two round trips through the renderer's own frame callback: the first returns
    // once a frame is scheduled, the second once it has been produced.
    await win.webContents
      .executeJavaScript("new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))")
      .catch(() => {});
    const image = await win.webContents.capturePage();
    const file = path.join(OUT, shot.file);
    fs.writeFileSync(file, image.toPNG());
    // Repo-relative, never absolute: this manifest is committed and mirrored into
    // the published site, so an absolute path here publishes the operator's OS
    // username to anyone who opens it.
    written.push({ id: shot.id, file: shot.file, applied, note: shot.note });
    process.stdout.write(`${applied ? "✓" : "!"} ${shot.file}  ${shot.note}\n`);
  }

  // A partial run (--only) describes only what it captured, but the manifest is the
  // gallery's description of every shot on disk and is mirrored into the published
  // site. Overwriting it after re-taking one screenshot leaves nineteen PNGs with no
  // description and a README that claims otherwise, so merge rather than replace.
  const manifestPath = path.join(OUT, "manifest.json");
  let prior = [];
  let priorErrors = [];
  if (ONLY && fs.existsSync(manifestPath)) {
    try {
      const old = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      prior = Array.isArray(old.shots) ? old.shots : [];
      priorErrors = Array.isArray(old.consoleErrors) ? old.consoleErrors : [];
    } catch {
      /* an unreadable manifest is replaced, not preserved */
    }
  }
  const byFile = new Map(prior.map((s) => [s.file, s]));
  written.forEach((s) => byFile.set(s.file, s));
  const allShots = [...byFile.values()].sort((a, b) => a.file.localeCompare(b.file));
  // Console errors from panels this run never opened are still true of those panels.
  const merged = ONLY ? [...new Set([...priorErrors, ...errors])] : errors;

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      { capturedFrom: "the real app (electron/main.js frontend + preload)", shots: allShots, consoleErrors: merged },
      null,
      2,
    ),
  );

  if (errors.length) {
    process.stdout.write(`\nRenderer reported ${errors.length} console error(s):\n`);
    errors.slice(0, 12).forEach((e) => process.stdout.write(`  ${e}\n`));
  }

  // A renderer exception or an unresolved binding means the screenshots document an
  // app that did not render. This ran once: a `p is not defined` in one sidebar
  // branch emptied every binding in the window, the harness printed the error and
  // exited 0, and the suite stayed green while nineteen PNGs of a blank shell were
  // written. Only the CSP notice is expected — the dc runtime needs unsafe-eval.
  const fatal = errors.filter(
    (e) => !/Electron Security Warning/.test(e) && /(Error:|never resolved|renderer gone)/.test(e),
  );
  if (fatal.length) {
    process.stdout.write(
      `\n✗ ${fatal.length} of those break the render — the captures above are not trustworthy.\n`,
    );
  }
  win.destroy();
  // Exit on `fatal`, not on `errors`. The CSP notice is expected and permanent — the
  // dc runtime compiles templates with `new Function`, so unsafe-eval is required —
  // and exiting non-zero on it meant every clean run failed too. A signal that is
  // always red is the same as no signal, which is how a blank-shell capture passed.
  app.exit(fatal.length ? 1 : 0);
}

app.disableHardwareAcceleration();
app.whenReady().then(() =>
  main().catch((e) => {
    process.stderr.write(`capture failed: ${e && e.stack ? e.stack : e}\n`);
    app.quit();
    process.exit(1);
  }),
);
