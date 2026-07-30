"use strict";
/* External editor integration: find what is installed, let the user pick one, and
 * open a project folder or a single file in it.
 *
 * Detection is by executable, not by guessing — an editor that is not actually on
 * this machine is never offered. */

const fs = require("node:fs");
const path = require("node:path");
const { spawn, execFileSync } = require("node:child_process");

const CANDIDATES = [
  {
    id: "vscode",
    label: "Visual Studio Code",
    exes: ["code.cmd", "code"],
    hints: [
      "%LOCALAPPDATA%\\Programs\\Microsoft VS Code\\bin\\code.cmd",
      "%PROGRAMFILES%\\Microsoft VS Code\\bin\\code.cmd",
    ],
  },
  {
    id: "vscode-insiders",
    label: "VS Code Insiders",
    exes: ["code-insiders.cmd", "code-insiders"],
    hints: ["%LOCALAPPDATA%\\Programs\\Microsoft VS Code Insiders\\bin\\code-insiders.cmd"],
  },
  {
    id: "cursor",
    label: "Cursor",
    exes: ["cursor.cmd", "cursor"],
    hints: ["%LOCALAPPDATA%\\Programs\\cursor\\resources\\app\\bin\\cursor.cmd"],
  },
  {
    id: "windsurf",
    label: "Windsurf",
    exes: ["windsurf.cmd", "windsurf"],
    hints: ["%LOCALAPPDATA%\\Programs\\Windsurf\\bin\\windsurf.cmd"],
  },
  { id: "zed", label: "Zed", exes: ["zed.exe"], hints: ["%LOCALAPPDATA%\\Zed\\Zed.exe"] },
  {
    id: "sublime",
    label: "Sublime Text",
    exes: ["subl.exe"],
    hints: ["%PROGRAMFILES%\\Sublime Text\\subl.exe"],
  },
  {
    id: "notepadpp",
    label: "Notepad++",
    exes: ["notepad++.exe"],
    hints: ["%PROGRAMFILES%\\Notepad++\\notepad++.exe"],
  },
  { id: "idea", label: "IntelliJ IDEA", exes: ["idea64.exe"], hints: [] },
  { id: "notepad", label: "Notepad", exes: ["notepad.exe"], hints: [] },
];

function expand(raw) {
  return raw.replace(/%([A-Z_]+)%/g, (m, name) => process.env[name] || m);
}

/** Resolve an executable through PATH, then through the candidate's hints. */
function resolve(cand) {
  for (const exe of cand.exes) {
    try {
      const out = execFileSync("where", [exe], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      });
      const first = out.split(/\r?\n/).find((l) => l.trim());
      if (first) return first.trim();
    } catch {
      /* `where` exits non-zero when nothing matches — try the next name */
    }
  }
  for (const hint of cand.hints) {
    const p = expand(hint);
    try {
      if (fs.statSync(p).isFile()) return p;
    } catch {
      /* not installed at that location */
    }
  }
  return null;
}

function detect() {
  const editors = [];
  for (const c of CANDIDATES) {
    const exe = resolve(c);
    if (exe) editors.push({ id: c.id, label: c.label, exe });
  }
  return { editors };
}

/** Open `path` in the chosen editor. With no editor id the first detected one is
 *  used; when nothing is installed the caller gets a clear message rather than a
 *  silent no-op. */
function open(target, editorId, customExe) {
  if (!target || !fs.existsSync(target)) throw new Error(`${target} does not exist`);
  const resolved = path.resolve(target);

  if (customExe) {
    const child = spawn(customExe, [resolved], { detached: true, stdio: "ignore", windowsHide: false });
    child.unref();
    return { opened: resolved, editor: customExe, pid: child.pid };
  }

  const chosen = editorId
    ? CANDIDATES.find((c) => c.id === editorId)
    : CANDIDATES.find((c) => resolve(c));
  if (!chosen) {
    throw new Error(
      editorId ? `unknown editor \`${editorId}\`` : "no supported editor was found on this machine",
    );
  }
  const exe = resolve(chosen);
  if (!exe) throw new Error(`${chosen.label} is configured but was not found on this machine`);
  // `.cmd` shims need a shell; a bare `.exe` does not, and passing shell:true for an
  // absolute path containing spaces would need quoting we do not want to hand-roll.
  const useShell = exe.toLowerCase().endsWith(".cmd") || exe.toLowerCase().endsWith(".bat");
  const child = spawn(useShell ? `"${exe}"` : exe, [useShell ? `"${resolved}"` : resolved], {
    detached: true,
    stdio: "ignore",
    shell: useShell,
    windowsHide: false,
  });
  child.unref();
  return { opened: resolved, editor: chosen.id, label: chosen.label, exe, pid: child.pid };
}

/** Reveal a path in File Explorer — the fallback when no editor is installed. */
function reveal(target) {
  if (!target || !fs.existsSync(target)) throw new Error(`${target} does not exist`);
  const resolved = path.resolve(target);
  const child = spawn("explorer.exe", [resolved], { detached: true, stdio: "ignore" });
  child.unref();
  return { revealed: resolved };
}

module.exports = { detect, open, reveal, CANDIDATES };
