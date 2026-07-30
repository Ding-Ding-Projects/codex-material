"use strict";
/* The only bridge between the page and the machine.
 *
 * `contextIsolation` is on, so the renderer cannot reach Node at all — it gets this
 * object and nothing else. Every command is named explicitly rather than exposing a
 * generic `invoke`, so the page can never call an IPC channel that was not designed
 * to be called from it. */

const { contextBridge, ipcRenderer } = require("electron");

/** Every command the main process registers. An unlisted name is refused here rather
 *  than being forwarded and failing deeper in. */
const COMMANDS = [
  "codex_version",
  "codex_state",
  "codex_read_config",
  "codex_read_config_text",
  "codex_write_config",
  "codex_set_config",
  "codex_config_restore",
  "codex_run",
  "codex_cancel",
  "codex_running",
  "codex_capture",
  "codex_doctor",
  "codex_mcp_list",
  "codex_mcp_toggle",
  "codex_mcp_add",
  "codex_mcp_remove",
  "codex_plugin_list",
  "codex_plugin_catalog",
  "codex_plugin_install",
  "codex_plugin_uninstall",
  "codex_marketplace_list",
  "codex_marketplace_add",
  "codex_marketplace_remove",
  "codex_skill_list",
  "codex_skill_toggle",
  "codex_hook_list",
  "codex_hook_toggle",
  "codex_features",
  "codex_set_feature",
  "codex_usage",
  "codex_cloud_tasks",
  "codex_session_list",
  "codex_session_action",
  "codex_login",
  "codex_login_status",
  "codex_logout",
  "codex_wsl_list",
  "codex_wsl_spawn",
  "codex_wsl_stop",
  "codex_wsl_kill",
  "codex_wsl_set",
  "codex_wsl_exec",
  "codex_history_commit",
  "codex_history_log",
  "codex_history_show",
  "codex_history_diff",
  "codex_history_prune",
  "codex_editors",
  "codex_open_external",
  "codex_reveal",
  "codex_fonts",
  "codex_read_text",
  "window_minimize",
  "window_toggle_maximize",
  "window_close",
];

/** Channels the main process is allowed to push on. A run streams its output here. */
const EVENT_PREFIX = "codex://";

contextBridge.exposeInMainWorld("CODEX_BRIDGE", {
  mode: "electron",
  commands: COMMANDS.slice(),

  invoke(command, args) {
    if (!COMMANDS.includes(command)) {
      return Promise.reject(new Error(`unknown backend command \`${command}\``));
    }
    return ipcRenderer.invoke(command, args || {});
  },

  /** Subscribe to a streaming channel. Returns an unsubscribe function, so a panel
   *  that unmounts mid-run does not keep receiving lines forever. */
  listen(channel, handler) {
    if (typeof channel !== "string" || !channel.startsWith(EVENT_PREFIX)) {
      throw new Error(`refusing to listen on \`${channel}\``);
    }
    const wrapped = (_event, payload) => handler({ payload });
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },

  window: {
    minimize: () => ipcRenderer.invoke("window_minimize"),
    toggleMaximize: () => ipcRenderer.invoke("window_toggle_maximize"),
    close: () => ipcRenderer.invoke("window_close"),
  },
});
