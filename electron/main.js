"use strict";
// Codex Studio — Electron main process.
//
// Every GUI action is a real `codex` invocation or a real file on disk. Nothing about
// the agent, the sandbox, the config schema or the plugin system is reimplemented
// here: the frontend composes flags, this layer runs them and hands back what the CLI
// actually said.

const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const wsl = require("./lib/wsl");
const commands = require("./commands");

const APP_DIR = path.join(__dirname, "..", "app");

let mainWindow = null;

/* ------------------------------------------------------------------ window */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 960,
    minHeight: 640,
    // The app draws its own Material 3 title bar, so the native frame is off. The
    // window is still resizable: Electron keeps the invisible resize borders.
    frame: false,
    backgroundColor: "#141218",
    show: false,
    title: "Codex Studio",
    icon: path.join(__dirname, "..", "assets", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // The renderer is our own bundled code and nothing else — no remote origin is
      // ever loaded — but it stays sandboxed with node integration off so a bug in
      // the page cannot reach the filesystem except through the IPC surface below.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      devTools: true,
    },
  });

  commands.setWindow(mainWindow);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Nothing in this app should ever open a new window or navigate away from the
  // bundled page. A link that tries goes to the user's real browser instead.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.loadFile(path.join(APP_DIR, "index.html"));
}

/* ------------------------------------------------------------- lifecycle */

// A second launch focuses the running window instead of starting a rival copy that
// would fight it for the same $CODEX_HOME/studio git repository.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    // Every pinned WSL shell is a real `sleep infinity` process; quitting without
    // killing them leaves one per tab running until the machine reboots.
    wsl.shutdown();
    app.quit();
  });

  app.on("before-quit", () => wsl.shutdown());
}

module.exports = { APP_DIR };
