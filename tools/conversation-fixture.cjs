"use strict";
/* Authored Codex JSONL fixture for the Electron conversation smoke test.
 *
 * This process never reads CODEX_HOME, credentials, rollouts, or network state. The
 * headless main process launches it with the renderer-composed argv, and it writes that
 * argv to a disposable log so the harness can prove every prompt crossed the native
 * process boundary as one item. */

const fs = require("node:fs");
const { spawn } = require("node:child_process");

const THREAD_ID = "smoke-thread-蝦餃";
const logFile = process.env.CODEX_STUDIO_CONVERSATION_LOG || "";

function record(value) {
  if (!logFile) return;
  fs.appendFileSync(logFile, JSON.stringify(value) + "\n", "utf8");
}

function emit(value) {
  process.stdout.write(JSON.stringify(value) + "\n");
}

function fail(message, code) {
  emit({ type: "turn.failed", error: { message } });
  process.exitCode = code || 1;
}

if (process.argv[2] === "--descendant") {
  record({ kind: "descendant", pid: process.pid, parentPid: process.ppid });
  setInterval(() => {}, 60_000);
} else {
  const argv = process.argv.slice(2);
  record({ kind: "invocation", pid: process.pid, argv });

  const jsonAt = argv.indexOf("--json");
  const resumeAt = argv.indexOf("resume", jsonAt + 1);
  const prompt = argv[argv.length - 1];
  const grammarOk =
    argv[0] === "exec" &&
    jsonAt > 0 &&
    typeof prompt === "string" &&
    (resumeAt < 0
      ? jsonAt === argv.length - 2
      : resumeAt === argv.length - 3 && argv[resumeAt + 1] === THREAD_ID);

  if (!grammarOk) {
    fail("the authored fixture received invalid conversation argv", 64);
  } else {
    emit({ type: "thread.started", thread_id: THREAD_ID });

    if (prompt.includes("[smoke:fail]")) {
      emit({
        type: "item.completed",
        item: { id: "partial-1", type: "agent_message", text: "Partial dumpling answer — not completed." },
      });
      process.stderr.write("authored diagnostic: turn failed after provisional output\n");
      fail("authored failure after provisional output", 7);
    } else if (prompt.includes("[smoke:cancel]")) {
      emit({
        type: "item.completed",
        item: { id: "partial-2", type: "agent_message", text: "Partial answer before cancellation." },
      });
      const child = spawn(process.execPath, [__filename, "--descendant"], {
        stdio: "ignore",
        windowsHide: true,
      });
      record({ kind: "tree", pid: process.pid, childPid: child.pid });
      setInterval(() => {}, 60_000);
    } else {
      const text = resumeAt < 0
        ? "Initial answer from the authored conversation fixture."
        : "Follow-up answer resumed on the authored thread.";
      emit({
        type: "item.completed",
        item: { id: resumeAt < 0 ? "answer-1" : "answer-2", type: "agent_message", text },
      });
      emit({
        type: "turn.completed",
        usage: { input_tokens: 11, cached_input_tokens: 0, output_tokens: 7 },
      });
    }
  }
}
