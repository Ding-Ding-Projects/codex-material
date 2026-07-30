#!/usr/bin/env node
/* Build the CODEX_HOME the screenshot harness captures against.
 *
 * The screenshots used to be taken against the operator's own `~/.codex`, which is
 * why `C:\Users\<name>\...` was legible in seven of them and a private repository
 * name in an eighth — all committed, and all mirrored to the published site. A
 * screenshot is a publication; whatever is on screen is on the internet.
 *
 * The answer is NOT to blur or crop. It is to give the app a different home to read.
 * Everything here is a real file in the real on-disk format: a real `config.toml`
 * the real TOML parser parses, real rollout files the real session reader opens.
 * The app, the preload, the IPC handlers and the CLI are all genuine — only the
 * contents of the directory they read are authored rather than borrowed. So the
 * screenshots still prove the app works; they just stop proving who ran it.
 *
 *   node tools/make-capture-home.mjs [--out DIR]
 *
 * Writes to `.capture-home/` at the repository root by default. The directory is
 * disposable and git-ignored; delete it and this rebuilds it.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const OUT = args.includes("--out")
  ? path.resolve(args[args.indexOf("--out") + 1])
  : path.join(ROOT, ".capture-home");

/* A neutral operator. Not a real person, and not the person running the capture. */
const HOME = "C:\\Users\\dev";
const PROJECTS = `${HOME}\\Projects`;

const CONFIG = `# Codex Studio capture fixture — authored, not borrowed. See
# tools/make-capture-home.mjs for why this exists.

model = "gpt-5.1-codex-max"
approval_policy = "on-request"
sandbox_mode = "workspace-write"
model_reasoning_effort = "medium"
model_verbosity = "medium"
hide_agent_reasoning = false
show_raw_agent_reasoning = false
file_opener = "vscode"

[sandbox_workspace_write]
network_access = false
exclude_tmpdir_env_var = false

[profiles.personal]
model = "gpt-5.1-codex-max"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[profiles.review]
model = "gpt-5.1-codex"
approval_policy = "untrusted"
sandbox_mode = "read-only"

[profiles.throwaway]
model = "gpt-5.1-codex-mini"
approval_policy = "never"
sandbox_mode = "danger-full-access"

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "${PROJECTS.replace(/\\/g, "\\\\")}"]
enabled = true

[mcp_servers.postgres]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-postgres"]
enabled = true

[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest"]
enabled = false

[hooks.pre_tool_use]
command = "python"
args = ["hooks/secrets_guard.py"]

[features]
web_search_request = true
view_image_tool = true
`;

/* Three sessions in the real rollout layout. The first line of a rollout is always
   the session_meta record — that is what the session list reads, and nothing after
   it is opened unless a transcript is requested. */
const SESSIONS = [
  { id: "0f3c1a92-7b41-4d6e-9c02-51ab8e7d3f10", name: "codex-material", dir: "codex-material", ago: 11 * 60 },
  { id: "b71e4d05-2c88-4a19-8f63-0d94ac215e77", name: "invoice-parser", dir: "invoice-parser", ago: 96 * 60 },
  { id: "5a2f8c6b-91d3-4e07-a4b8-6c13e0f5d982", name: "site-redesign", dir: "site-redesign", ago: 5 * 60 * 60 },
  { id: "c48d7e19-3f60-4b25-9a81-72e5bd04f3c6", name: "codex-material", dir: "codex-material", ago: 26 * 60 * 60 },
  { id: "9e05b3a7-6d24-4c81-b07f-1a83fe692d45", name: "invoice-parser", dir: "invoice-parser", ago: 50 * 60 * 60 },
];

/* One session carries a transcript, so the Chats screen can show a conversation that
   is a genuine rollout rather than a canned string in the frontend. */
const TRANSCRIPT = [
  { role: "user", text: "The session list shows raw UUIDs instead of project names. Find out why." },
  {
    role: "assistant",
    text:
      "The session list reads the first line of each rollout for its `session_meta` record. " +
      "`readSessionMeta` opened the file as a byte-capped read stream and ran readline over it, " +
      "which returned no line at all — so every session fell back to `id.slice(0, 8)`.\n\n" +
      "Replaced it with a positional `fs.readSync` into a 512 KB buffer: it either finds the " +
      "newline or reports honestly that the record is longer than the window. All five sessions " +
      "now show their project name and working directory.",
  },
  { role: "user", text: "Does that cost us anything on a directory with hundreds of rollouts?" },
  {
    role: "assistant",
    text:
      "No — the files are sorted by mtime before any of them is opened, and only the newest " +
      "`limit` are read. A rollout is routinely several megabytes, so the win is in not " +
      "streaming them, not in how the first line is found.",
  },
];

function nowSec() {
  return Math.floor(Date.parse("2026-07-30T14:20:00Z") / 1000);
}

function writeRollout(s) {
  const at = nowSec() - s.ago;
  const d = new Date(at * 1000);
  const dir = path.join(
    OUT,
    "sessions",
    String(d.getUTCFullYear()),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  );
  fs.mkdirSync(dir, { recursive: true });

  const lines = [
    JSON.stringify({
      type: "session_meta",
      payload: {
        id: s.id,
        timestamp: new Date(at * 1000).toISOString(),
        cwd: `${PROJECTS}\\${s.dir}`,
        originator: "codex_cli_rs",
        cli_version: "0.145.0",
        instructions: null,
      },
    }),
  ];

  if (s.transcript) {
    for (const m of s.transcript) {
      lines.push(
        JSON.stringify({
          type: "response_item",
          payload: { type: "message", role: m.role, content: [{ type: "input_text", text: m.text }] },
        }),
      );
    }
    lines.push(
      JSON.stringify({
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: { input_tokens: 184_320, cached_input_tokens: 141_880, output_tokens: 12_744, total_tokens: 197_064 },
            last_token_usage: { input_tokens: 41_002, cached_input_tokens: 33_610, output_tokens: 2_918, total_tokens: 43_920 },
            model_context_window: 272_000,
          },
          rate_limits: { primary: { used_percent: 18.4, window_minutes: 300, resets_in_seconds: 7_620 } },
        },
      }),
    );
  }

  const file = path.join(dir, `rollout-${new Date(at * 1000).toISOString().replace(/[:.]/g, "-")}-${s.id}.jsonl`);
  fs.writeFileSync(file, lines.join("\n") + "\n");
  // The session list sorts by mtime, so the fixture has to set it deliberately —
  // otherwise every session claims to have been touched at generation time and the
  // list order is whatever the filesystem felt like.
  fs.utimesSync(file, at, at);
  return file;
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "config.toml"), CONFIG);

  SESSIONS[0].transcript = TRANSCRIPT;
  const written = SESSIONS.map(writeRollout);

  // A history file the CLI itself writes; the app reads it for the command palette.
  fs.writeFileSync(
    path.join(OUT, "history.jsonl"),
    TRANSCRIPT.filter((m) => m.role === "user")
      .map((m) => JSON.stringify({ session_id: SESSIONS[0].id, ts: nowSec(), text: m.text }))
      .join("\n") + "\n",
  );

  process.stdout.write(`capture home: ${OUT}\n`);
  process.stdout.write(`  config.toml  3 profiles, 3 MCP servers, 1 hook, 2 feature flags\n`);
  process.stdout.write(`  sessions     ${written.length} rollouts, ${TRANSCRIPT.length} messages in the newest\n`);
  process.stdout.write(`  operator     ${HOME} (authored — not the machine running this)\n`);
}

main();
