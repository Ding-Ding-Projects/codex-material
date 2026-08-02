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
import { tmpdir } from "node:os";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const conversationDir = join(tmpdir(), "codex-studio-conversation-smoke");
const conversationLog = join(conversationDir, "argv.jsonl");
const conversationRuntime = join(conversationDir, process.platform === "win32" ? "node.exe" : "node");
rmSync(conversationDir, { recursive: true, force: true });
mkdirSync(conversationDir, { recursive: true });
copyFileSync(process.execPath, conversationRuntime);

spawnSync(process.execPath, [join(root, "tools", "make-capture-home.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const bin = process.platform === "win32"
  ? join(root, "node_modules", "electron", "dist", "electron.exe")
  : join(root, "node_modules", ".bin", "electron");

const child = spawn(bin, [join(root, "tools", "smoke-main.cjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CODEX_HOME: process.platform === "win32"
      ? "C:\\Users\\Public\\codex-studio-capture"
      : join(tmpdir(), "codex-studio-capture"),
    CODEX_STUDIO_HEADLESS: "1",
    CODEX_STUDIO_CONVERSATION_FIXTURE: join(root, "tools", "conversation-fixture.cjs"),
    CODEX_STUDIO_CONVERSATION_RUNTIME: conversationRuntime,
    CODEX_STUDIO_CONVERSATION_LOG: conversationLog,
  },
  shell: false,
});

child.on("exit", (code) => {
  rmSync(conversationDir, { recursive: true, force: true });
  process.exit(code ?? 1);
});
