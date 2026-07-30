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

/** Each shot names the surface, the state it needs, and what a reader should look at. */
const SHOTS = [
  { id: "chats", file: "01-chats.png", nav: "chat", note: "Chats — session list, transcript, composer" },
  { id: "console", file: "02-console.png", nav: "console", note: "Console — every CLI subcommand and flag" },
  { id: "extend", file: "03-extend.png", nav: "ext", note: "Extend — MCP, plugins, skills, hooks, feature flags" },
  { id: "config", file: "04-config.png", nav: "settings", note: "Config — config.toml settings with live TOML preview" },
  { id: "cost", file: "05-cost.png", nav: "cost", note: "Cost — API-equivalent calculator" },
  { id: "runtime", file: "06-runtime.png", nav: "runtime", note: "Runtime — per-tab WSL instances" },
  { id: "health", file: "07-health.png", nav: "health", note: "Health — doctor, account, usage" },
  { id: "usage", file: "07b-usage.png", nav: "health", note: "Health ▸ Usage — real token counts read from the newest session's last token_count event", state: { healthView: "usage" } },
  { id: "cloud", file: "07c-cloud.png", nav: "health", note: "Health ▸ Cloud tasks — what `codex cloud list` actually reported", state: { healthView: "cloud" } },
  { id: "history", file: "08-history.png", nav: "history", note: "History — local git-backed, append-only" },
  { id: "changelog", file: "09-changelog.png", nav: "changelog", note: "Changelog viewer — date filter + regex search" },
  {
    id: "calendar",
    file: "09b-calendar.png",
    nav: "changelog",
    note: "Changelog date filter — the calendar picker, with month/year jump and range highlighting",
    after: "__setState({ clogFrom: '2026-07-01', clogTo: '2026-07-31', calOpen: 'from', calMonth: Date.now(), calAt: { x: 700, y: 300 } })",
  },
  { id: "studio", file: "10-studio.png", nav: "studio", note: "Studio settings — language, funny sliders, narrator, dim sum, editor" },
  {
    id: "regex",
    file: "11-regex-builder.png",
    nav: "ext",
    note: "Regex builder anchored beside the search bar that opened it",
    state: { regexOpen: true, regexTarget: "ext", regexPattern: "^(mcp|plugin)-", regexFlags: ["g", "i"], regexAt: { x: 360, y: 150 } },
  },
  {
    id: "appearance",
    file: "12-appearance.png",
    nav: "chat",
    note: "Per-element appearance editor with the colour translator",
    state: { appearOpen: true, appearTarget: "Message bubble", appearAt: { x: 420, y: 120 } },
  },
  {
    id: "notifications",
    file: "13-notifications.png",
    nav: "chat",
    note: "Corner notification stack and the reviewable centre",
    after: `
      CX.notify.error("MCP server could not be added", "codex mcp add postgres — exit 1: name already exists");
      CX.notify.warning && CX.notify.warning("YOLO mode is on", "approvals off, sandbox off on Personal");
      CX.notify.warn("YOLO mode is on", "approvals off, sandbox off on Personal — it survives a restart");
      CX.notify.success("Installed secrets-guard", "codex plugin add secrets-guard");
    `,
    state: { centreOpen: true },
  },
  {
    id: "bulkclose",
    file: "14-bulk-close.png",
    nav: "chat",
    note: "Bulk close preview — the one place a blocking dialog is correct",
    state: { bulkOpen: true, bulkQuery: "a", bulkInvert: false, bulkPinned: false, bulkScope: { kind: "strip" } },
  },
  {
    id: "dimsum",
    file: "15-dim-sum.png",
    nav: "chat",
    note: "Dim sum surprise — bundled catalog photo, non-blocking, auto-dismissing",
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
  const RESET = {
    regexOpen: false, appearOpen: false, bulkOpen: false, centreOpen: false,
    dimSum: null, menu: null, dd: null, paletteOpen: false, slashOpen: false,
    theme: "dark", clogQuery: "", clogRegex: "", studioQuery: "", healthView: "doctor",
  };

  for (const shot of list) {
    await win.webContents
      .executeJavaScript(`document.documentElement.setAttribute("data-theme","dark"); window.CX && window.CX.notify && window.CX.notify.dismissAll(); window.__setState ? window.__setState(${JSON.stringify(RESET)}) : false`)
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

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(
      { capturedFrom: "the real app (electron/main.js frontend + preload)", shots: written, consoleErrors: errors },
      null,
      2,
    ),
  );

  if (errors.length) {
    process.stdout.write(`\nRenderer reported ${errors.length} console error(s):\n`);
    errors.slice(0, 12).forEach((e) => process.stdout.write(`  ${e}\n`));
  }
  win.destroy();
  app.quit();
  process.exit(errors.length ? 2 : 0);
}

app.disableHardwareAcceleration();
app.whenReady().then(() =>
  main().catch((e) => {
    process.stderr.write(`capture failed: ${e && e.stack ? e.stack : e}\n`);
    app.quit();
    process.exit(1);
  }),
);
