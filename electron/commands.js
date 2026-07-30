"use strict";
/* Every IPC command the renderer can call, in one place.
 *
 * Both the app (electron/main.js) and the screenshot harness (tools/capture-main.cjs)
 * register these, so a capture exercises the real backend rather than a stub — a
 * screenshot of a panel that only works under the harness is worse than no
 * screenshot at all. */

const { ipcMain, app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const cli = require("./lib/cli");
const config = require("./lib/config");
const catalog = require("./lib/catalog");
const wsl = require("./lib/wsl");
const history = require("./lib/history");
const editors = require("./lib/editors");

const APP_DIR = path.join(__dirname, "..", "app");

/** The window commands act on — set once by whoever creates it. */
let target = null;
function setWindow(win) {
  target = win;
}

/* --------------------------------------------------------------- IPC glue */

/** Register a command. Errors are returned as a rejected promise carrying the real
 *  message — the GUI surfaces it verbatim in a notification, never a generic one. */
function command(name, handler) {
  ipcMain.handle(name, async (_event, args) => {
    try {
      return await handler(args || {});
    } catch (e) {
      throw new Error(e && e.message ? e.message : String(e));
    }
  });
}

/* ------------------------------------------------------------- identity */

command("codex_version", async () => {
  const out = await cli.run(["--version"]);
  const text = out.stdout.trim();
  const where = cli.codexSource();
  return {
    version: text || out.stderr.trim(),
    home: cli.codexHome(),
    bin: where.bin,
    binSource: where.source,
    bundled: where.bundled,
    bridge: "electron",
    ok: out.ok,
  };
});

/** One round trip that fills the whole shell on launch. Each section degrades on its
 *  own: a missing marketplace must not blank out the MCP list beside it. */
command("codex_state", async ({ cwd }) => {
  const errors = {};
  const soft = async (key, fn, fallback) => {
    try {
      return await fn();
    } catch (e) {
      errors[key] = e.message;
      return fallback;
    }
  };
  const [mcp, plugins, catalogRows, marketplaces, features, sessions, auth, version] =
    await Promise.all([
      soft("mcp", catalog.mcpList, []),
      soft("plugins", catalog.pluginList, []),
      soft("catalog", catalog.pluginCatalog, []),
      soft("marketplaces", catalog.marketplaceList, []),
      soft("features", catalog.featureList, []),
      soft("sessions", () => catalog.sessionList(300), []),
      soft("auth", catalog.authStatus, { method: "unknown" }),
      cli.run(["--version"]).then((o) => o.stdout.trim()),
    ]);
  let hooks = [];
  let cfg = null;
  try {
    hooks = catalog.hookList();
    cfg = config.readToml();
  } catch (e) {
    errors.config = e.message;
  }
  const where = cli.codexSource();
  return {
    codexHome: cli.codexHome(),
    version,
    bin: where.bin,
    binSource: where.source,
    bundled: where.bundled,
    auth,
    mcp,
    plugins,
    catalog: catalogRows,
    marketplaces,
    skills: catalog.skillList(cwd || null),
    hooks,
    features,
    sessions,
    config: cfg,
    wslDistros: await wsl.distros(),
    errors,
  };
});

/* --------------------------------------------------------------- config */

command("codex_read_config", async () => config.readToml());
command("codex_read_config_text", async () => ({
  path: config.configPath(),
  text: config.readText(),
}));
command("codex_write_config", async (a) => config.writeText(a.tomlText ?? a.toml ?? ""));
command("codex_set_config", async (a) => config.setPath(a.key, a.value));

/* ------------------------------------------------------------------ run */

/** Spawn the CLI, stream every line to the window as it arrives, and return the exit
 *  code with the full transcript. */
command("codex_run", async (a) => {
  const args = Array.isArray(a.args) ? a.args : [];
  if (!args.length) throw new Error("no arguments were composed for this run");
  const id = a.id || "";
  const channel = a.stream || null;
  const { code, lines } = await cli.stream(cli.codexBin(), args, { cwd: a.cwd }, (line) => {
    if (channel && target && !target.isDestroyed()) {
      target.webContents.send(channel, { id, level: line.level, text: line.text });
    }
  });
  return { code, id, lines };
});

/** A one-shot capture used by panels that only need the text, not a live stream. */
command("codex_capture", async (a) => cli.run(a.args || [], { cwd: a.cwd }));

/* ------------------------------------------------------------- catalogs */

command("codex_doctor", () => catalog.doctor());
command("codex_mcp_list", () => catalog.mcpList());
command("codex_mcp_toggle", (a) => catalog.mcpToggle(a.name));
command("codex_mcp_remove", (a) => catalog.mcpRemove(a.name));
command("codex_mcp_add", (a) => catalog.mcpAdd(a));
command("codex_plugin_list", () => catalog.pluginList());
command("codex_plugin_catalog", () => catalog.pluginCatalog());
command("codex_plugin_install", (a) => catalog.pluginInstall(a.name));
command("codex_plugin_uninstall", (a) => catalog.pluginUninstall(a.name));
command("codex_marketplace_list", () => catalog.marketplaceList());
command("codex_marketplace_add", (a) => catalog.marketplaceAdd(a.name, a.url));
command("codex_marketplace_remove", (a) => catalog.marketplaceRemove(a.name));
command("codex_skill_list", async (a) => catalog.skillList(a.cwd || null));
command("codex_skill_toggle", async (a) => {
  catalog.skillToggle(a.dir);
  return catalog.skillList(a.cwd || null);
});
command("codex_hook_list", async () => catalog.hookList());
command("codex_hook_toggle", async (a) => catalog.hookToggle(a.event, a.index || 0));
command("codex_features", () => catalog.featureList());
command("codex_set_feature", (a) => catalog.featureSet(a.key, !!a.value));
command("codex_usage", () => catalog.usage());
command("codex_cloud_tasks", (a) => catalog.cloudTasks(a.limit || 20));
command("codex_session_list", () => catalog.sessionList(300));
command("codex_session_action", (a) => catalog.sessionAction(a.id, a.action));

/* ------------------------------------------------------------------ auth */

command("codex_login_status", () => catalog.authStatus());

/** `codex login` opens a browser and blocks on the callback, so it is spawned
 *  detached and the GUI polls `codex_login_status` for the result. */
command("codex_login", async (a) => {
  if (a.method === "api") {
    throw new Error(
      "API-key login reads the key from stdin. Run `codex login --with-api-key` in a terminal so the key never passes through the GUI.",
    );
  }
  const { spawn } = require("node:child_process");
  const child = spawn(cli.codexBin(), ["login"], {
    detached: true,
    stdio: "ignore",
    shell: cli.WIN,
    windowsHide: true,
  });
  child.unref();
  return { started: true, pid: child.pid };
});

command("codex_logout", async () => {
  const out = await cli.run(["logout"]);
  return { ok: out.ok, detail: out.stdout.trim(), auth: await catalog.authStatus() };
});

/* ------------------------------------------------------------------- wsl */

command("codex_wsl_list", () => wsl.list());
command("codex_wsl_spawn", (a) => wsl.spawn(a));
command("codex_wsl_stop", async (a) => wsl.stop(a.session));
command("codex_wsl_kill", (a) => wsl.kill(a.session));
command("codex_wsl_set", (a) => wsl.set(a.session, a.patch));
command("codex_wsl_exec", (a) => wsl.exec(a));

/* --------------------------------------------------------------- history */

command("codex_history_commit", async (a) => history.commit(a.message, a.kind, a.snapshot));
command("codex_history_log", async (a) => history.log(a.limit || 200));
command("codex_history_show", async (a) => history.show(a.id));
command("codex_history_diff", async (a) => history.diff(a.id));
command("codex_history_prune", async (a) => history.prune(a.keep || 100));

/* --------------------------------------------------------------- editors */

command("codex_editors", async () => editors.detect());
command("codex_open_external", async (a) => editors.open(a.path, a.editor, a.exe));
command("codex_reveal", async (a) => editors.reveal(a.path));

/* ------------------------------------------------------------------ misc */

/** Fonts the appearance editor can actually offer. Reading the two Windows font
 *  directories is far cheaper than enumerating the registry and covers both
 *  machine-wide and per-user installs. */
command("codex_fonts", async () => {
  const dirs = [];
  if (process.env.WINDIR) dirs.push(path.join(process.env.WINDIR, "Fonts"));
  if (process.env.LOCALAPPDATA) {
    dirs.push(path.join(process.env.LOCALAPPDATA, "Microsoft", "Windows", "Fonts"));
  }
  const names = new Set();
  for (const dir of dirs) {
    let entries = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of entries) {
      const ext = path.extname(file).toLowerCase();
      if (![".ttf", ".otf", ".ttc"].includes(ext)) continue;
      names.add(path.basename(file, ext).replace(/_/g, " "));
    }
  }
  return { fonts: [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())) };
});

/** Read a text file the GUI needs. A relative path resolves against the packaged
 *  resources, so the changelog ships inside the installer rather than being fetched
 *  from the network at runtime. */
command("codex_read_text", async (a) => {
  if (path.isAbsolute(a.path)) {
    return { path: a.path, text: fs.readFileSync(a.path, "utf8") };
  }
  // Packaged, the file sits in resources/. Run from a checkout, it sits at the repo
  // root or beside the frontend. Try all three rather than assuming which build this
  // is — getting it wrong shows the user an empty changelog and no reason why.
  const roots = [
    app.isPackaged ? process.resourcesPath : null,
    path.join(__dirname, ".."),
    APP_DIR,
  ].filter(Boolean);
  const tried = [];
  for (const root of roots) {
    const candidate = path.join(root, a.path);
    tried.push(candidate);
    if (fs.existsSync(candidate)) {
      return { path: candidate, text: fs.readFileSync(candidate, "utf8") };
    }
  }
  throw new Error(`${a.path} was not found. Looked in: ${tried.join(", ")}`);
});

/* ---- window controls, since the app draws its own title bar ---- */
command("window_minimize", async () => {
  if (target) target.minimize();
  return { ok: true };
});
command("window_toggle_maximize", async () => {
  if (!target) return { ok: false };
  if (target.isMaximized()) target.unmaximize();
  else target.maximize();
  return { ok: true, maximized: target.isMaximized() };
});
command("window_close", async () => {
  if (target) target.close();
  return { ok: true };
});


module.exports = { register: () => {}, setWindow, APP_DIR };
