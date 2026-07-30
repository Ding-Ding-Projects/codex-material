/* Codex Studio — catalog of everything the Codex CLI exposes.
   Sourced from codex-rs (cli/src/main.rs, tui/src/cli.rs, tui/src/slash_command.rs,
   utils/cli/src/shared_options.rs, config/src/config_toml.rs, config/src/types.rs,
   features/src/lib.rs). */
(function (g) {
  "use strict";

  const ENUMS = {
    approval: ["untrusted", "on-failure", "on-request", "never"],
    sandbox: ["read-only", "workspace-write", "danger-full-access"],
    reasoningEffort: ["minimal", "low", "medium", "high"],
    reasoningSummary: ["auto", "concise", "detailed", "none"],
    verbosity: ["low", "medium", "high"],
    webSearch: ["disabled", "cached", "indexed", "live"],
    personality: ["none", "friendly", "pragmatic"],
    altScreen: ["auto", "always", "never"],
    trust: ["trusted", "untrusted"],
    forcedLogin: ["chatgpt", "api"],
    authStore: ["file", "keyring", "auto"],
    oauthStore: ["keyring", "file", "auto"],
    fileOpener: ["vscode", "vscode-insiders", "windsurf", "cursor", "none"],
    compactScope: ["total", "body-after-prefix"],
    windowsSandbox: ["disabled", "restricted-token", "elevated"],
    serviceTier: ["default", "priority", "flex"],
    realtimeTransport: ["webrtc", "websocket"],
    realtimeType: ["conversational", "transcription"],
    ossProvider: ["ollama", "lmstudio"],
    threadStore: ["local"]
  };

  const MODELS = [
    { id: "gpt-5.1-codex-max", label: "gpt-5.1-codex-max", note: "default agentic coding model" },
    { id: "gpt-5.1-codex", label: "gpt-5.1-codex", note: "balanced" },
    { id: "gpt-5.1-codex-mini", label: "gpt-5.1-codex-mini", note: "fast, cheaper" },
    { id: "gpt-5.1", label: "gpt-5.1", note: "general purpose" },
    { id: "o3", label: "o3", note: "reasoning" },
    { id: "oss:gpt-oss-120b", label: "gpt-oss-120b (--oss)", note: "local via ollama / lmstudio" }
  ];

  /* ---- top level subcommands (cli/src/main.rs Subcommand) ---- */
  const SUBCOMMANDS = [
    { name: "(interactive)", alias: "", group: "Session", desc: "Start the interactive TUI session. Options are forwarded when no subcommand is given.", args: [
      { flag: "PROMPT", type: "text", desc: "Optional user prompt to start the session." },
      { flag: "--ask-for-approval", short: "-a", type: "enum", enum: "approval", desc: "When the model must ask before running a command." },
      { flag: "--search", type: "bool", desc: "Enable the live web_search tool with no per-call approval." },
      { flag: "--no-alt-screen", type: "bool", desc: "Inline mode; preserves terminal scrollback." },
      { flag: "--strict-config", type: "bool", desc: "Fail when config.toml has unrecognised fields." }
    ]},
    { name: "exec", alias: "e", group: "Session", desc: "Run Codex non-interactively.", args: [
      { flag: "PROMPT", type: "text", desc: "Prompt, or '-' to read stdin." },
      { flag: "--json", type: "bool", desc: "Emit JSONL events instead of human output." },
      { flag: "--output-last-message", type: "text", desc: "Write the final assistant message to a file." },
      { flag: "--skip-git-repo-check", type: "bool", desc: "Allow running outside a git repository." },
      { flag: "--color", type: "enum", enum: null, options: ["auto", "always", "never"], desc: "Colour policy." }
    ]},
    { name: "review", alias: "", group: "Session", desc: "Run a code review non-interactively.", args: [
      { flag: "--strict-config", type: "bool", desc: "Fail on unknown config keys." }
    ]},
    { name: "resume", alias: "", group: "Session", desc: "Resume a previous interactive session (picker by default).", args: [
      { flag: "SESSION_ID", type: "text", desc: "Session UUID or name." },
      { flag: "--last", type: "bool", desc: "Continue the most recent session without the picker." },
      { flag: "--all", type: "bool", desc: "Show all sessions; disables cwd filtering." },
      { flag: "--include-non-interactive", type: "bool", desc: "Include non-interactive sessions." }
    ]},
    { name: "fork", alias: "", group: "Session", desc: "Fork a previous interactive session.", args: [
      { flag: "SESSION_ID", type: "text", desc: "Session UUID or name." },
      { flag: "--last", type: "bool", desc: "Fork the most recent session." },
      { flag: "--all", type: "bool", desc: "Show all sessions." }
    ]},
    { name: "archive", alias: "", group: "Session", desc: "Archive a saved session by id or name.", args: [{ flag: "SESSION_ID", type: "text", desc: "Session UUID or name." }] },
    { name: "unarchive", alias: "", group: "Session", desc: "Unarchive a saved session by id or name.", args: [{ flag: "SESSION_ID", type: "text", desc: "Session UUID or name." }] },
    { name: "delete", alias: "", group: "Session", desc: "Permanently delete a saved session.", args: [{ flag: "SESSION_ID", type: "text", desc: "Session UUID or name." }] },
    { name: "apply", alias: "a", group: "Session", desc: "Apply the latest agent diff to the working tree with git apply.", args: [] },
    { name: "login", alias: "", group: "Auth", desc: "Manage login (ChatGPT, API key, access token, device code, status).", args: [
      { flag: "--api-key", type: "bool", desc: "Read an API key from stdin." },
      { flag: "--with-access-token", type: "bool", desc: "Read an access token from stdin." },
      { flag: "--device-code", type: "bool", desc: "Log in with the device-code flow." },
      { flag: "status", type: "bool", desc: "Print current auth status." }
    ]},
    { name: "logout", alias: "", group: "Auth", desc: "Remove stored authentication credentials.", args: [] },
    { name: "mcp", alias: "", group: "Extensions", desc: "Manage external MCP servers: list, get, add, remove, login, logout.", args: [
      { flag: "list", type: "bool", desc: "List configured servers." },
      { flag: "add <NAME> -- <CMD>", type: "text", desc: "Add a stdio or streamable-HTTP server." },
      { flag: "--json", type: "bool", desc: "Machine-readable output." }
    ]},
    { name: "plugin", alias: "", group: "Extensions", desc: "Manage Codex plugins: add, list, remove, marketplace.", args: [
      { flag: "list", type: "bool", desc: "List installed plugins." },
      { flag: "marketplace", type: "bool", desc: "Manage marketplaces (add / remove / upgrade)." }
    ]},
    { name: "mcp-server", alias: "", group: "Extensions", desc: "Start Codex itself as an MCP server over stdio.", args: [{ flag: "--strict-config", type: "bool", desc: "Fail on unknown config keys." }] },
    { name: "app-server", alias: "", group: "Extensions", desc: "[experimental] Run the app server or related tooling.", args: [] },
    { name: "remote-control", alias: "", group: "Extensions", desc: "[experimental] Manage the app-server daemon with remote control enabled.", args: [] },
    { name: "app", alias: "", group: "Extensions", desc: "Launch the Desktop app (opens the installer if missing). macOS and Windows only.", args: [] },
    { name: "cloud", alias: "cloud-tasks", group: "Cloud", desc: "[experimental] Browse Codex Cloud tasks and apply changes locally.", args: [] },
    { name: "sandbox", alias: "", group: "Runtime", desc: "Run a command inside a Codex-provided sandbox.", args: [
      { flag: "-- <COMMAND>", type: "text", desc: "Command to run under the sandbox policy." }
    ]},
    { name: "exec-server", alias: "", group: "Runtime", desc: "[experimental] Run the standalone exec-server service.", args: [] },
    { name: "doctor", alias: "", group: "Runtime", desc: "Diagnose local install, config, auth and runtime health.", args: [] },
    { name: "update", alias: "", group: "Runtime", desc: "Update Codex to the latest version.", args: [] },
    { name: "completion", alias: "", group: "Runtime", desc: "Generate shell completion scripts.", args: [{ flag: "SHELL", type: "enum", options: ["bash", "zsh", "fish", "powershell", "elvish"], desc: "Target shell." }] },
    { name: "features", alias: "", group: "Runtime", desc: "Inspect feature flags.", args: [] },
    { name: "execpolicy", alias: "", group: "Runtime", desc: "Execpolicy tooling (hidden).", args: [] },
    { name: "debug", alias: "", group: "Runtime", desc: "Debugging tools: models, app-server, prompt-input, trace-reduce, clear-memories.", args: [
      { flag: "models", type: "bool", desc: "Render the raw model catalog as JSON." },
      { flag: "--bundled", type: "bool", desc: "Dump only the bundled catalog." }
    ]}
  ];

  /* ---- global / shared flags (SharedCliOptions + CliConfigOverrides) ---- */
  const GLOBAL_FLAGS = [
    { flag: "--model", short: "-m", type: "enum", options: MODELS.map((m) => m.id), desc: "Model the agent should use." },
    { flag: "--sandbox", short: "-s", type: "enum", enum: "sandbox", desc: "Sandbox policy for model-generated shell commands." },
    { flag: "--profile", short: "-p", type: "text", desc: "Layer $CODEX_HOME/<name>.config.toml over the base user config." },
    { flag: "--cd", short: "-C", type: "text", desc: "Working root for the agent." },
    { flag: "--add-dir", type: "list", desc: "Additional writable directories alongside the workspace." },
    { flag: "--image", short: "-i", type: "list", desc: "Image(s) attached to the initial prompt." },
    { flag: "--oss", type: "bool", desc: "Use an open-source local provider." },
    { flag: "--local-provider", type: "enum", enum: "ossProvider", desc: "Which local provider to use with --oss." },
    { flag: "--dangerously-bypass-approvals-and-sandbox", short: "--yolo", type: "bool", danger: true, desc: "Skip every confirmation and run without sandboxing. EXTREMELY DANGEROUS." },
    { flag: "--dangerously-bypass-hook-trust", type: "bool", danger: true, desc: "Run enabled hooks without persisted hook trust." },
    { flag: "-c key=value", type: "list", desc: "Ad-hoc config override applied on top of config.toml." }
  ];

  /* ---- slash commands (tui/src/slash_command.rs, presentation order) ---- */
  const SLASH = [
    ["model", "choose what model and reasoning effort to use", 1],
    ["ide", "include current selection, open files, and other context from your IDE", 1],
    ["permissions", "choose what Codex is allowed to do", 1],
    ["keymap", "remap TUI shortcuts", 0],
    ["vim", "toggle Vim mode for the composer", 0],
    ["setup-default-sandbox", "set up elevated agent sandbox", 0],
    ["sandbox-add-read-dir", "let sandbox read a directory (Windows)", 0],
    ["experimental", "toggle experimental features", 0],
    ["approve", "approve one retry of a recent auto-review denial", 1],
    ["memories", "configure memory use and generation", 0],
    ["skills", "use skills to improve how Codex performs specific tasks", 1],
    ["import", "import setup, this project, and recent chats from Claude Code", 0],
    ["hooks", "view and manage lifecycle hooks", 1],
    ["review", "review my current changes and find issues", 0],
    ["rename", "rename the current thread", 1],
    ["new", "start a new chat during a conversation", 0],
    ["archive", "archive this session and exit", 0],
    ["delete", "permanently delete this session and exit", 0],
    ["resume", "resume a saved chat", 1],
    ["fork", "fork the current chat", 0],
    ["app", "continue this session in the Desktop app", 1],
    ["init", "create an AGENTS.md file with instructions for Codex", 0],
    ["compact", "summarize conversation to prevent hitting the context limit", 0],
    ["plan", "switch to Plan mode", 0],
    ["goal", "set or view the goal for a long-running task", 1],
    ["agent", "switch the active agent thread", 1],
    ["side", "start a side conversation in an ephemeral fork", 1],
    ["btw", "start a side conversation in an ephemeral fork", 1],
    ["copy", "copy last response as markdown", 1],
    ["raw", "toggle raw scrollback mode for copy-friendly selection", 1],
    ["diff", "show git diff (including untracked files)", 1],
    ["mention", "mention a file", 1],
    ["status", "show current session configuration and token usage", 1],
    ["usage", "view account usage or use a usage limit reset", 1],
    ["debug-config", "show config layers and requirement sources", 1],
    ["title", "configure which items appear in the terminal title", 1],
    ["statusline", "configure which items appear in the status line", 1],
    ["theme", "choose a syntax highlighting theme", 0],
    ["pets", "choose or hide the terminal pet", 0],
    ["mcp", "list configured MCP tools; /mcp verbose for details", 1],
    ["apps", "manage apps", 1],
    ["plugins", "browse plugins", 1],
    ["logout", "log out of Codex", 0],
    ["quit", "exit Codex", 1],
    ["exit", "exit Codex", 1],
    ["feedback", "send logs to maintainers", 1],
    ["rollout", "print the rollout file path", 1],
    ["ps", "list background terminals", 1],
    ["stop", "stop all background terminals", 1],
    ["clear", "clear the terminal and start a new chat", 0],
    ["personality", "choose a communication style for Codex", 1],
    ["subagents", "switch the active agent thread", 1]
  ].map(([name, desc, duringTask]) => ({ name, desc, duringTask: !!duringTask }));

  /* ---- config.toml settings ---- */
  const S = (key, label, type, extra) => Object.assign({ key, label, type }, extra || {});
  const SETTINGS = [
    { id: "model", title: "Model", icon: "M", desc: "Which model answers, how hard it thinks, and how much it says.", fields: [
      S("model", "Model", "enum", { options: MODELS.map((m) => m.id), def: "gpt-5.1-codex-max", desc: "Optional override of model selection." }),
      S("review_model", "Review model", "text", { desc: "Model override used by /review." }),
      S("model_provider", "Model provider", "text", { def: "openai", desc: "Provider id from the model_providers map." }),
      S("model_context_window", "Context window (tokens)", "int", { desc: "Size of the context window for the model." }),
      S("model_auto_compact_token_limit", "Auto-compact token limit", "int", { desc: "Token usage that triggers auto-compaction of history." }),
      S("model_auto_compact_token_limit_scope", "Auto-compact scope", "enum", { options: ENUMS.compactScope, desc: "Apply the limit to the full context or only post-prefix tokens." }),
      S("model_reasoning_effort", "Reasoning effort", "enum", { options: ENUMS.reasoningEffort, def: "medium" }),
      S("plan_mode_reasoning_effort", "Plan-mode reasoning effort", "enum", { options: ENUMS.reasoningEffort }),
      S("model_reasoning_summary", "Reasoning summary", "enum", { options: ENUMS.reasoningSummary, def: "auto" }),
      S("model_verbosity", "Verbosity", "enum", { options: ENUMS.verbosity, desc: "Responses API text.verbosity for GPT-5 models." }),
      S("personality", "Personality", "enum", { options: ENUMS.personality, desc: "Communication style for Codex." }),
      S("service_tier", "Service tier", "enum", { options: ENUMS.serviceTier, desc: "Explicit service tier requested for new turns." }),
      S("hide_agent_reasoning", "Hide agent reasoning", "bool", { def: false }),
      S("show_raw_agent_reasoning", "Show raw reasoning content", "bool", { def: false }),
      S("model_catalog_json", "Model catalog JSON", "path", { desc: "Path to a JSON model catalog, applied at startup only." }),
      S("oss_provider", "Preferred OSS provider", "enum", { options: ENUMS.ossProvider })
    ]},
    { id: "approvals", title: "Approvals & sandbox", icon: "A", desc: "What Codex may do on this machine without asking.", fields: [
      S("approval_policy", "Approval policy", "enum", { options: ENUMS.approval, def: "on-request", desc: "Default approval policy for executing commands." }),
      S("approvals_reviewer", "Approvals reviewer", "enum", { options: ["user", "auto-review"], desc: "Who reviews escalated approval requests." }),
      S("auto_review.policy", "Auto-review policy instructions", "textarea", { desc: "Extra policy inserted into the guardian prompt." }),
      S("sandbox_mode", "Sandbox mode", "enum", { options: ENUMS.sandbox, def: "workspace-write" }),
      S("sandbox_workspace_write.writable_roots", "Writable roots", "list", { desc: "Extra directories writable in workspace-write." }),
      S("sandbox_workspace_write.network_access", "Allow network access", "bool", { def: false }),
      S("sandbox_workspace_write.exclude_tmpdir_env_var", "Exclude $TMPDIR", "bool", { def: false }),
      S("sandbox_workspace_write.exclude_slash_tmp", "Exclude /tmp", "bool", { def: false }),
      S("default_permissions", "Default permissions profile", "text", { desc: "Built-in (:name) or a profile from [permissions]." }),
      S("allow_login_shell", "Allow login shell", "bool", { def: true, desc: "May the model request a login shell for shell tools." }),
      S("include_permissions_instructions", "Inject <permissions instructions>", "bool", { def: true }),
      S("windows.sandbox_level", "Windows sandbox level", "enum", { options: ENUMS.windowsSandbox, desc: "Windows-only sandbox strength." })
    ]},
    { id: "instructions", title: "Instructions & context", icon: "I", desc: "What Codex is told before your first message.", fields: [
      S("instructions", "System instructions", "textarea"),
      S("developer_instructions", "Developer instructions", "textarea", { desc: "Inserted as a developer-role message." }),
      S("model_instructions_file", "Model instructions file", "path", { danger: true, desc: "Overrides built-in model instructions. Strongly discouraged." }),
      S("compact_prompt", "Compact prompt", "textarea", { desc: "Prompt used for history compaction." }),
      S("include_apps_instructions", "Inject <apps_instructions>", "bool", { def: true }),
      S("include_collaboration_mode_instructions", "Inject <collaboration_mode>", "bool", { def: true }),
      S("include_environment_context", "Inject <environment_context>", "bool", { def: true }),
      S("project_doc_max_bytes", "AGENTS.md max bytes", "int", { def: 32768 }),
      S("project_doc_fallback_filenames", "AGENTS.md fallbacks", "list", { desc: "Files to read when AGENTS.md is missing." }),
      S("project_root_markers", "Project root markers", "list", { def: [".git"] })
    ]},
    { id: "tools", title: "Tools", icon: "T", desc: "Which tools the model can reach for.", fields: [
      S("web_search", "Web search mode", "enum", { options: ENUMS.webSearch, def: "disabled" }),
      S("tools.experimental_request_user_input.enabled", "request_user_input tool", "bool", { def: true }),
      S("tools.update_plan.enabled", "update_plan tool", "bool", { def: true }),
      S("tool_output_token_limit", "Tool output token limit", "int"),
      S("background_terminal_max_timeout", "Background terminal timeout (ms)", "int", { def: 300000 }),
      S("tool_suggest.enabled", "Suggest installable tools", "bool", { def: true }),
      S("experimental_use_unified_exec_tool", "Unified exec tool", "bool", { def: false })
    ]},
    { id: "agents", title: "Agents & memories", icon: "G", desc: "Subagents, thread limits and durable memory.", fields: [
      S("agents.enabled", "Multi-agent tools", "bool", { def: true }),
      S("agents.max_concurrent_threads_per_session", "Max concurrent agent threads", "int", { min: 1 }),
      S("agents.max_depth", "Max nesting depth (V1)", "int"),
      S("agents.default_subagent_model", "Default subagent model", "enum", { options: MODELS.map((m) => m.id) }),
      S("agents.default_subagent_reasoning_effort", "Default subagent effort", "enum", { options: ENUMS.reasoningEffort }),
      S("agents.interrupt_message", "Record interrupt message", "bool", { def: true }),
      S("memories.enabled", "Memories", "bool", { def: true }),
      S("skills.enabled", "Skills", "bool", { def: true }),
      S("orchestrator.skills.enabled", "Orchestrator: skills", "bool"),
      S("orchestrator.mcp.enabled", "Orchestrator: MCP", "bool")
    ]},
    { id: "tui", title: "Terminal UI", icon: "U", desc: "How the TUI looks and behaves — mirrored here so the GUI matches.", fields: [
      S("tui.animations", "Animations", "bool", { def: true }),
      S("tui.show_tooltips", "Startup tooltips", "bool", { def: true }),
      S("tui.vim_mode_default", "Vim mode by default", "bool", { def: false }),
      S("tui.raw_output_mode", "Raw scrollback mode", "bool", { def: false }),
      S("tui.alternate_screen", "Alternate screen", "enum", { options: ENUMS.altScreen, def: "auto" }),
      S("tui.theme", "Syntax theme", "text", { desc: "Kebab-case theme name; see $CODEX_HOME/themes." }),
      S("tui.status_line", "Status line items", "list", { def: ["model-with-reasoning", "current-dir"] }),
      S("tui.status_line_use_colors", "Colour status line", "bool", { def: true }),
      S("tui.terminal_title", "Terminal title items", "list", { def: ["activity", "project"] }),
      S("tui.pet", "Terminal pet", "text"),
      S("tui.pet_anchor", "Pet anchor", "enum", { options: ["composer", "viewport"], def: "composer" }),
      S("tui.session_picker_view", "Session picker layout", "text" ),
      S("tui.resume_cwd", "Resume working directory", "text"),
      S("tui.terminal_resize_reflow_max_rows", "Resize-reflow max rows", "int"),
      S("disable_paste_burst", "Disable paste-burst detection", "bool", { def: false }),
      S("file_opener", "File opener", "enum", { options: ENUMS.fileOpener, def: "vscode" })
    ]},
    { id: "storage", title: "History & storage", icon: "H", desc: "What is written to disk and where.", fields: [
      S("history.persistence", "History persistence", "enum", { options: ["save-all", "none"], def: "save-all" }),
      S("history.max_bytes", "History max bytes", "int"),
      S("sqlite_home", "SQLite home", "path", { desc: "Defaults to $CODEX_SQLITE_HOME then $CODEX_HOME." }),
      S("log_dir", "Log directory", "path", { desc: "Setting this also enables the TUI text log." }),
      S("debug.config_lockfile.export_dir", "Config lockfile export dir", "path"),
      S("debug.config_lockfile.load_path", "Config lockfile to replay", "path"),
      S("debug.config_lockfile.allow_codex_version_mismatch", "Allow version mismatch", "bool", { def: false }),
      S("experimental_thread_store", "Thread store", "enum", { options: ENUMS.threadStore })
    ]},
    { id: "auth", title: "Accounts & auth", icon: "K", desc: "Login method, credential storage and workspace restrictions.", fields: [
      S("forced_login_method", "Forced login method", "enum", { options: ENUMS.forcedLogin }),
      S("forced_chatgpt_workspace_id", "Allowed ChatGPT workspace ids", "list" ),
      S("cli_auth_credentials_store", "CLI credential store", "enum", { options: ENUMS.authStore, def: "file" }),
      S("mcp_oauth_credentials_store", "MCP OAuth credential store", "enum", { options: ENUMS.oauthStore, def: "auto" }),
      S("mcp_oauth_callback_port", "MCP OAuth callback port", "int"),
      S("mcp_oauth_callback_url", "MCP OAuth redirect URI", "text"),
      S("chatgpt_base_url", "ChatGPT base URL", "text"),
      S("openai_base_url", "OpenAI provider base URL", "text")
    ]},
    { id: "telemetry", title: "Telemetry & notices", icon: "O", desc: "Analytics, feedback, OTEL and update checks.", fields: [
      S("analytics.enabled", "Analytics", "bool", { def: true }),
      S("feedback.enabled", "Feedback collection", "bool", { def: true }),
      S("otel.enabled", "OpenTelemetry export", "bool", { def: false }),
      S("otel.endpoint", "OTEL endpoint", "text"),
      S("check_for_update_on_startup", "Check for updates on startup", "bool", { def: true }),
      S("suppress_unstable_features_warning", "Suppress unstable-feature warning", "bool", { def: false }),
      S("notify", "External notify command", "list", { desc: "Command spawned for end-user notifications." })
    ]},
    { id: "realtime", title: "Realtime & audio", icon: "R", desc: "Experimental realtime voice transport.", fields: [
      S("realtime.transport", "Transport", "enum", { options: ENUMS.realtimeTransport, def: "webrtc" }),
      S("realtime.type", "Session type", "enum", { options: ENUMS.realtimeType, def: "conversational" }),
      S("realtime.version", "Session version", "text"),
      S("realtime.voice", "Voice", "text"),
      S("audio.microphone", "Microphone", "text"),
      S("audio.speaker", "Speaker", "text"),
      S("experimental_realtime_ws_base_url", "Realtime WS base URL", "text", { danger: true }),
      S("experimental_realtime_webrtc_call_base_url", "WebRTC call base URL", "text", { danger: true }),
      S("experimental_realtime_ws_model", "Realtime WS model", "text", { danger: true })
    ]},
    { id: "shellenv", title: "Shell environment", icon: "E", desc: "Which environment variables reach spawned commands.", fields: [
      S("shell_environment_policy.inherit", "Inherit", "enum", { options: ["all", "core", "none"], def: "core" }),
      S("shell_environment_policy.ignore_default_excludes", "Ignore default excludes", "bool", { def: false }),
      S("shell_environment_policy.exclude", "Exclude patterns", "list", { def: ["AWS_*", "AZURE_*"] }),
      S("shell_environment_policy.include_only", "Include only", "list" ),
      S("shell_environment_policy.experimental_use_profile", "Use shell profile", "bool", { def: false })
    ]}
  ];

  /* ---- feature flags (features/src/lib.rs) ---- */
  const FEATURES = [
    ["shell_tool", "stable"], ["secret_auth_storage", "stable"], ["unified_exec", "stable"], ["shell_snapshot", "stable"],
    ["code_mode_host", "stable"], ["memories", "stable"], ["hooks", "stable"], ["enable_request_compression", "stable"],
    ["multi_agent", "stable"], ["multi_agent_v2", "stable"], ["apps", "stable"], ["tool_suggest", "stable"],
    ["recommended_plugins", "stable"], ["plugins", "stable"], ["in_app_browser", "stable"], ["in_app_updates", "stable"],
    ["browser_use", "stable"], ["browser_use_full_cdp_access", "stable"], ["browser_use_external", "stable"],
    ["computer_use", "stable"], ["remote_plugin", "stable"], ["plugin_sharing", "stable"], ["image_generation", "stable"],
    ["skill_mcp_dependency_install", "stable"], ["skill_search", "stable"], ["mentions_v2", "stable"],
    ["guardian_approval", "stable"], ["goals", "stable"], ["tool_call_mcp_elicitation", "stable"],
    ["auth_elicitation", "stable"], ["personality", "stable"],
    ["network_proxy", "experimental"],
    ["shell_zsh_fork", "under-development"], ["unified_exec_zsh_fork", "under-development"], ["deferred_executor", "under-development"],
    ["code_mode", "under-development"], ["code_mode_buffered_exec", "under-development"], ["code_mode_only", "under-development"],
    ["standalone_web_search", "under-development"], ["runtime_metrics", "under-development"],
    ["external_agent_memory_import", "under-development"], ["local_thread_store_compression", "under-development"],
    ["chronicle", "under-development"], ["apply_patch_streaming_events", "under-development"],
    ["exec_permission_approvals", "under-development"], ["request_permissions_tool", "under-development"],
    ["respect_system_proxy", "under-development"], ["enable_mcp_apps", "under-development"], ["mcp_2026_07_28", "under-development"],
    ["deferred_tool_world_state", "under-development"], ["non_prefixed_mcp_tool_names", "under-development"],
    ["executor_capability_discovery", "under-development"], ["concurrent_reasoning_summaries", "under-development"],
    ["default_mode_request_user_input", "under-development"], ["terminal_visualization_instructions", "under-development"],
    ["guardianv2", "under-development"], ["token_budget", "under-development"], ["rollout_budget", "under-development"],
    ["current_time_reminder", "under-development"],
    ["web_search_request", "deprecated"], ["web_search_cached", "deprecated"], ["use_legacy_landlock", "deprecated"],
    ["undo", "removed"], ["js_repl", "removed"], ["js_repl_tools_only", "removed"], ["terminal_resize_reflow", "removed"],
    ["search_tool", "removed"], ["codex_git_commit", "removed"], ["sqlite", "removed"], ["apply_patch_freeform", "removed"],
    ["use_linux_sandbox_bwrap", "removed"], ["request_rule", "removed"], ["experimental_windows_sandbox", "removed"],
    ["elevated_windows_sandbox", "removed"], ["remote_models", "removed"], ["multi_agent_mode", "removed"],
    ["enable_fanout", "removed"], ["apps_mcp_path_override", "removed"], ["tool_search", "removed"],
    ["tool_search_always_defer_mcp_tools", "removed"], ["unavailable_dummy_tools", "removed"], ["plugin_hooks", "removed"],
    ["external_migration", "removed"], ["resize_all_images", "removed"], ["item_ids", "removed"], ["steer", "removed"],
    ["collaboration_modes", "removed"], ["skill_env_var_dependency_prompt", "removed"]
  ].map(([key, stage]) => ({ key, stage }));

  const HOOK_EVENTS = [
    ["session-start", "Fires when a thread starts."],
    ["user-prompt-submit", "Fires before a user message reaches the model."],
    ["pre-tool-use", "Fires before a tool call executes; may block."],
    ["post-tool-use", "Fires after a tool call returns."],
    ["notification", "Fires when Codex raises a notification."],
    ["session-end", "Fires when the thread ends."]
  ];

  g.CODEX = { ENUMS, MODELS, SUBCOMMANDS, GLOBAL_FLAGS, SLASH, SETTINGS, FEATURES, HOOK_EVENTS };
})(window);
