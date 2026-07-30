#!/usr/bin/env node
/* Codex Studio — full smoke test launcher.
 *
 *   node tools/smoke.mjs
 *
 * Builds the authored CODEX_HOME, then runs tools/smoke-main.cjs under Electron. That
 * process drives the real preload, the real command handlers and the real `codex`
 * binary, and exits non-zero if any of the three phases fails.
 *
 * The fixture is rebuilt every run rather than trusted to still be there and still be
 * current, and the smoke test writes to it — several of the commands it exercises are
 * destructive by nature, and pointing them at the operator's own ~/.codex to see
 * whether they work would be an unusually rude way to find out.
 */

import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

spawnSync(process.execPath, [join(root, "tools", "make-capture-home.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const electron = process.platform === "win32" ? "electron.cmd" : "electron";
const bin = join(root, "node_modules", ".bin", electron);

const child = spawn(bin, [join(root, "tools", "smoke-main.cjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CODEX_HOME: join(root, ".capture-home"),
    CODEX_STUDIO_HEADLESS: "1",
  },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
