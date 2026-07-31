#!/usr/bin/env node
/* Codex Studio — landing-page check.
 *
 *   node tools/check-site.mjs
 *
 * Loads docs/site/index.html in Electron and proves the page boots, renders its tab
 * strip, offers all four tab-discovery searches, opens its settings panel, and logs no
 * console errors. `node --check` proves a file parses; it proves nothing about whether
 * the page works, which is how the site came to be the one surface with no real test.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const electron = process.platform === "win32" ? "electron.cmd" : "electron";

const child = spawn(join(root, "node_modules", ".bin", electron), [join(root, "tools", "check-site-main.cjs")], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
