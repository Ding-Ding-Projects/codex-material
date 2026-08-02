/* Codex Studio — non-interactive conversation protocol.
   This is deliberately shared by the renderer and Electron's main process. The
   renderer composes exact argv and renders normalized events; the backend parses the
   same JSONL contract before it crosses IPC. Keeping that contract in one pure module
   prevents a successful CLI upgrade from becoming raw JSON in the chat window. */
(function (g, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (g) g.CX_CONVERSATION = api;
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  "use strict";

  function cleanText(value) {
    return typeof value === "string" ? value : value == null ? "" : String(value);
  }

  /** Build a Codex Exec invocation without ever splitting the user's prompt.
   *
   * Exec's options are global within the `exec` command, so they stay before the
   * `resume` subcommand. The final prompt is always one argv item, however many spaces,
   * quotes, shell metacharacters or Unicode characters it contains. */
  function buildArgv(spec) {
    var input = spec || {};
    var prompt = cleanText(input.prompt).trim();
    if (!prompt) throw new Error("a conversation prompt cannot be empty");
    var common = Array.isArray(input.common) ? input.common.map(cleanText) : [];
    var argv = ["exec"].concat(common, ["--json"]);
    if (input.threadId) argv.push("resume", cleanText(input.threadId), prompt);
    else argv.push(prompt);
    return argv;
  }

  function jsonEvent(line) {
    if (!line || line.level !== "out") return null;
    try {
      var parsed = JSON.parse(cleanText(line.text));
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  /** Normalize one complete line from `codex exec --json`.
   *
   * `text` is intentionally displayable payload, never source JSON. Unknown events
   * remain in `event` for future UI work but do not dump protocol objects into chat. */
  function normalizeLine(line) {
    var raw = { level: (line && line.level) || "out", raw: cleanText(line && line.text) };
    if (raw.level === "error") {
      return Object.assign(raw, { kind: "diagnostic", text: raw.raw });
    }

    var event = jsonEvent(line);
    if (!event) return Object.assign(raw, { kind: "diagnostic", text: raw.raw });
    var type = cleanText(event.type);
    var item = event.item || {};

    if (type === "thread.started") {
      return Object.assign(raw, { kind: "thread", text: "", eventType: type, threadId: cleanText(event.thread_id), event: event });
    }
    if (type === "item.completed" && item.type === "agent_message") {
      return Object.assign(raw, { kind: "message", text: cleanText(item.text), eventType: type, itemId: cleanText(item.id), event: event });
    }
    if (type === "item.completed" && item.type === "error") {
      return Object.assign(raw, { kind: "failure", text: cleanText(item.message), eventType: type, itemId: cleanText(item.id), event: event });
    }
    if (type === "turn.failed") {
      return Object.assign(raw, { kind: "failure", text: cleanText(event.error && event.error.message), eventType: type, terminal: true, event: event });
    }
    if (type === "error") {
      return Object.assign(raw, { kind: "failure", text: cleanText(event.message), eventType: type, event: event });
    }
    if (type === "turn.completed") {
      return Object.assign(raw, { kind: "complete", text: "", eventType: type, terminal: true, usage: event.usage || null, event: event });
    }
    return Object.assign(raw, { kind: "event", text: "", eventType: type, event: event });
  }

  function createTranscript() {
    return {
      threadId: "",
      provisionalText: "",
      finalText: "",
      status: "running",
      error: "",
      usage: null,
      diagnostics: [],
      events: []
    };
  }

  function accept(transcript, line) {
    var state = transcript || createTranscript();
    var normalized = normalizeLine(line);
    state.events.push(normalized);
    if (normalized.threadId) state.threadId = normalized.threadId;
    if (normalized.kind === "message") state.provisionalText = normalized.text;
    if (normalized.kind === "diagnostic" && normalized.text) state.diagnostics.push(normalized.text);
    if (normalized.kind === "failure") {
      if (normalized.text) state.error = normalized.text;
      if (normalized.terminal) state.status = "failed";
    }
    if (normalized.kind === "complete") {
      state.status = "completed";
      state.finalText = state.provisionalText;
      state.usage = normalized.usage;
    }
    return normalized;
  }

  function finish(transcript, outcome) {
    var state = transcript || createTranscript();
    var processResult = outcome || {};
    var status = state.status;
    var error = state.error;
    if (status === "running") {
      if (processResult.cancelled || processResult.timedOut || processResult.signal) {
        status = "interrupted";
      } else if (typeof processResult.code === "number" && processResult.code !== 0) {
        status = "failed";
        error = error || state.diagnostics.join("\n") || ("codex exited " + processResult.code);
      } else {
        status = "incomplete";
        error = error || "codex exited before reporting whether the turn completed";
      }
    }
    return {
      threadId: state.threadId || null,
      status: status,
      text: status === "completed" ? state.finalText : "",
      partial: status === "completed" ? "" : state.provisionalText,
      error: error || null,
      usage: state.usage,
      diagnostics: state.diagnostics.slice(),
      events: state.events.slice()
    };
  }

  return {
    buildArgv: buildArgv,
    normalizeLine: normalizeLine,
    createTranscript: createTranscript,
    accept: accept,
    finish: finish
  };
});
