/* The project's own screenshot harness.
 *
 * Runs the REAL app — the same main process, preload and frontend the installer
 * ships — and captures each surface through Electron's own `capturePage`. That keeps
 * the whole thing headless: nothing is drawn on a visible desktop, no Win32
 * PrintWindow, and the capture is of the built artifact rather than a mock.
 *
 *   npm run capture                    every shot, into assets/screenshots
 *   npm run capture -- --only chats    just one
 *   npm run capture -- --list          what it can capture
 */
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "screenshots");
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
if (args.includes("--list")) {
  process.stdout.write(
    "chats console extend config cost runtime health history changelog studio regex appearance notifications tabsearch bulkclose dimsum light\n",
  );
  process.exit(0);
}

/* Build (or rebuild) the fixture home before launching. It is cheap, disposable and
   git-ignored, so it is regenerated every run rather than trusted to still be there
   and still be current. */
const captureHome = join(root, ".capture-home");
spawnSync(process.execPath, [join(root, "tools", "make-capture-home.mjs")], { cwd: root, stdio: "inherit" });

const electron = process.platform === "win32" ? "electron.cmd" : "electron";
const bin = join(root, "node_modules", ".bin", electron);

const child = spawn(bin, [join(root, "tools", "capture-main.cjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    /* Capture against an authored CODEX_HOME, never the operator's own. These PNGs
       are committed and published; the previous set had a real Windows username
       legible in seven of them and a private repository name in an eighth. The app,
       the IPC layer and the CLI are all the real ones — only the directory they read
       is authored. See tools/make-capture-home.mjs. */
    CODEX_HOME: captureHome,
    CODEX_STUDIO_CAPTURE_DIR: out,
    CODEX_STUDIO_CAPTURE_ONLY: only || "",
    // Headless: the window is created off-screen and never shown, and Chromium is
    // told not to expect a compositor surface it can present to.
    CODEX_STUDIO_HEADLESS: "1",
  },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
