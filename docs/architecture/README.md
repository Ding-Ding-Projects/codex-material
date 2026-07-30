# Architecture

How Codex Studio is put together, and the contracts each layer owes the others.

| Page | What it covers |
| --- | --- |
| [Overview](overview.md) | The three layers — `app/` frontend, the `dc` template runtime, `src-tauri/` backend — and why the CLI is never reimplemented |
| [Tauri bridge](tauri-bridge.md) | The `invoke` contract and every command registered in `src-tauri/src/lib.rs`, with its argument shape and return shape |
| [Frontend runtime](frontend-runtime.md) | How the `<x-dc>` template and the `DCLogic` class render through React, and how to add a panel |

## The layers in one picture

```
┌ WebView2 ─────────────────────────────────────────────────────────────┐
│  app/index.html                                                       │
│    <x-dc> …template… </x-dc>      declarative markup, {{ bindings }}   │
│    <script data-dc-script>        class Component extends DCLogic     │
│                                                                       │
│  app/support.js   generated dc-runtime: compiles the template to      │
│                   React elements, drives the logic class              │
│  app/codex-core.js  window.CX — bridge, store, i18n, vcs, colour, …   │
│  app/cx-*.js        window.CX_TABS / CX_NOTIFY / CX_I18N / …          │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  window.__TAURI__.core.invoke(cmd, args)
                                │  window.__TAURI__.event.listen(name, cb)
┌───────────────────────────────┴───────────────────────────────────────┐
│  src-tauri/src/lib.rs   47 #[tauri::command] functions                │
│    cli.rs      find / run / stream the `codex` binary                 │
│    catalog.rs  MCP, plugins, marketplaces, skills, hooks, sessions    │
│    config.rs   $CODEX_HOME/config.toml read + safe write              │
│    history.rs  git-backed append-only local history                   │
│    editors.rs  external editor detection and launch                   │
│    wsl.rs      per-tab WSL runtimes                                   │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  std::process::Command
                       ┌────────┴────────┐
                       │  codex.exe      │  the real CLI — the only thing
                       │  wsl.exe, git   │  that knows agent semantics
                       └─────────────────┘
```

## Contracts between layers

- **Frontend → backend** is one function: `CX.bridge.invoke(name, args)`. No `fetch`, no
  WebSocket, no HTTP server. The CSP in `src-tauri/tauri.conf.json` blocks everything else.
- **Backend → frontend** is one function plus one event stream: a command's return value, and
  `app.emit(<stream name>, …)` for long-running runs.
- **Backend → the world** is `std::process::Command`. Every capability is a real invocation of
  `codex`, `git`, `wsl.exe`, `explorer.exe` or an editor executable.
- Nothing in the app opens a network socket. React, the fonts and every asset are vendored.
