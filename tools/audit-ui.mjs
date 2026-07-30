/* The project's own UI audit harness — layout and accessibility, measured.
 *
 * Runs the REAL app (the same main-process backend, preload and frontend the
 * installer ships) off-screen under Electron and sweeps a matrix of viewport widths,
 * zoom factors, language modes and nav sections. In each cell it measures horizontal
 * overflow, silently clipped text, pointer-target size, accessible names, tab
 * semantics, WCAG contrast and focus visibility, then writes every finding — with a
 * CSS selector, the element's text and the numbers it measured — to
 * assets/audit/ui-audit.json.
 *
 * It only measures. Nothing here fixes a defect, and nothing here is wired into CI.
 *
 *   node tools/audit-ui.mjs                        the full sweep
 *   node tools/audit-ui.mjs --only chat            one nav section
 *   node tools/audit-ui.mjs --widths 1280          one width
 *   node tools/audit-ui.mjs --zooms 1 --langs en   the fastest useful run
 *
 * Exit codes: 0 nothing severe, 2 at least one severity-"high" finding (overflow,
 * missing accessible name, broken tab semantics), 1 the harness itself failed.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets", "audit");
mkdirSync(out, { recursive: true });

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

if (args.includes("--help") || args.includes("-h")) {
  process.stdout.write(
    [
      "node tools/audit-ui.mjs [options]",
      "",
      "  --only <section>   chat console ext settings cost runtime health history changelog studio",
      "  --widths  <list>   comma-separated CSS widths        default 960,1280,1920",
      "  --zooms   <list>   comma-separated zoom factors      default 1,1.25,1.5,2",
      "  --langs   <list>   comma-separated language modes    default en,bi",
      "  --height  <px>     window content height             default 900",
      "  --funny   <1-5>    funny level for both languages    default 5 (longest copy)",
      "  --settle  <ms>     wait after each state change      default 260",
      "  --codex-home <dir> audit against a real CODEX_HOME instead of the fixture",
      "",
      "Writes assets/audit/ui-audit.json. Exits 2 when a severity-high finding exists.",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

/* A deterministic CODEX_HOME, built fresh on every run.
 *
 * The audit drives the REAL backend, so without this it would measure whatever
 * sessions, MCP servers and profiles happen to be on the operator's machine — and
 * assets/audit/ui-audit.json, which records every finding's element text, is
 * committed to a public repository. Real session names and working directories must
 * not travel with it. A fixture also makes two runs comparable, which a report that
 * changes shape with the operator's Codex state can never be.
 *
 * `--codex-home` opts back into real data for a local look; do not commit that run. */
function buildFixtureHome() {
  const home = join(tmpdir(), "codex-studio-ui-audit-home");
  rmSync(home, { recursive: true, force: true });
  const sessions = join(home, "sessions", "2026", "07", "28");
  mkdirSync(sessions, { recursive: true });

  writeFileSync(
    join(home, "config.toml"),
    [
      "model = \"gpt-5.1-codex-max\"",
      "approval_policy = \"on-request\"",
      "sandbox_mode = \"workspace-write\"",
      "model_reasoning_effort = \"medium\"",
      "model_verbosity = \"medium\"",
      "",
      "[mcp_servers.fixture-filesystem]",
      "command = \"npx\"",
      "args = [\"-y\", \"@modelcontextprotocol/server-filesystem\", \"/srv/fixture/alpha\"]",
      "",
      "[mcp_servers.fixture-postgres-with-a-long-server-name]",
      "command = \"npx\"",
      "args = [\"-y\", \"@modelcontextprotocol/server-postgres\"]",
      "",
      "[hooks.pre_tool_use]",
      "name = \"fixture-secrets-guard\"",
      "command = \"node hooks/secrets-guard.js\"",
      "trusted = true",
      "",
      "[profiles.fixture-work]",
      "model = \"gpt-5.1-codex\"",
      "approval_policy = \"untrusted\"",
      "sandbox_mode = \"read-only\"",
      "cwd = \"/srv/fixture/monorepo\"",
      "",
    ].join("\n"),
  );

  // Deliberately mixed lengths: the tab strip, the session list and the conversation
  // header all clip differently for a short label and a long one.
  const rows = [
    ["alpha", "fixture rollout alpha"],
    ["bravo", "fixture rollout bravo with a deliberately long session name that no strip can fit"],
    ["charlie", "fixture rollout charlie"],
    ["delta", "fixture rollout delta — 固定測試對話，用嚟試最長嘅雙語標籤"],
    ["echo", "fixture rollout echo"],
    ["monorepo", "fixture rollout foxtrot"],
  ];
  rows.forEach(([dir, name], i) => {
    const id = "00000000-0000-4000-8000-00000000000" + (i + 1);
    const meta = {
      type: "session_meta",
      payload: { id, cwd: "/srv/fixture/" + dir, name, originator: "codex_cli_rs", cli_version: "0.58.0" },
    };
    writeFileSync(join(sessions, `rollout-2026-07-28T09-4${i}-00-${id}.jsonl`), JSON.stringify(meta) + "\n");
  });

  return home;
}

const realHome = opt("--codex-home", "");
const codexHome = realHome || buildFixtureHome();

const electron = process.platform === "win32" ? "electron.cmd" : "electron";
const bin = join(root, "node_modules", ".bin", electron);

const child = spawn(bin, [join(root, "tools", "audit-ui-main.cjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    CODEX_HOME: codexHome,
    CODEX_STUDIO_AUDIT_FIXTURE: realHome ? "" : "1",
    CODEX_STUDIO_AUDIT_DIR: out,
    CODEX_STUDIO_AUDIT_ONLY: opt("--only", ""),
    CODEX_STUDIO_AUDIT_WIDTHS: opt("--widths", ""),
    CODEX_STUDIO_AUDIT_ZOOMS: opt("--zooms", ""),
    CODEX_STUDIO_AUDIT_LANGS: opt("--langs", ""),
    CODEX_STUDIO_AUDIT_HEIGHT: opt("--height", ""),
    CODEX_STUDIO_AUDIT_FUNNY: opt("--funny", ""),
    CODEX_STUDIO_AUDIT_SETTLE: opt("--settle", ""),
    // Headless: the window is created far off-screen and shown inactive, so the
    // compositor runs and every measurement comes from a painted frame, without a
    // pixel ever landing on a monitor.
    CODEX_STUDIO_HEADLESS: "1",
  },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
