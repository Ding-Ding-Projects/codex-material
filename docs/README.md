# Codex Studio — documentation

Codex Studio is a **Windows-only** Material 3 desktop GUI for the OpenAI Codex CLI, built on
Tauri 2. It composes flags, runs the real `codex` binary and streams back exactly what the CLI
said. It never reimplements the agent, the sandbox, the config schema or the plugin system.

Everything here describes the repository as it actually stands. Where a capability is designed
but not yet shipped, the page says so in a **Status** line rather than describing it as if it
were finished.

## Categories

| Category | What lives there |
| --- | --- |
| [Architecture](architecture/README.md) | How the frontend, the `dc` template runtime and the Rust backend fit together, and the full IPC command surface |
| [Build](build/README.md) | Prerequisites, local builds, installer packaging, continuous integration |
| [Features](features/README.md) | Regex builder, tabs, appearance, notifications, local version control, external editors, WSL runtimes |
| [Experience](experience/README.md) | Language modes and funny levels, accessibility, changelog viewer, dim sum surprise |
| [API](api/README.md) | Why there is no HTTP API and no Postman collection, and where the IPC surface is documented instead |

## Repository map

```
app/                 frontend — no build step, plain browser JS
  index.html         the <x-dc> template plus the DCLogic component script
  support.js         generated dc-runtime (React-based template engine) — do not edit
  codex-core.js      window.CX — bridge, store, i18n, narrator, vcs, colour, regex engine
  codex-data.js      window.CODEX — CLI subcommand / flag / setting / slash-command catalog
  cx-*.js            feature modules (tabs, notifications, i18n, …) attached to window.CX_*
  vendor/            React and ReactDOM, vendored so nothing is fetched at runtime
  fonts/             Roboto and Roboto Mono woff2, bundled for the same reason
src-tauri/           Rust backend, Tauri 2 configuration, icons and capabilities
tools/make-icon.mjs  generates assets/icon-source.png with no image dependencies
vendor/codex         git submodule pointing at https://github.com/openai/codex (reference only)
design/              the original design-tool export the app was grown from
docs/                this tree
```

## Conventions used by these pages

- Every feature has its own file under a categorised subfolder; every category has a
  `README.md` index.
- Every feature page documents **behaviour, configuration, failure modes, security
  considerations and how to verify it**.
- Paths are repository-relative. Runtime paths use `$CODEX_HOME`, which is the `CODEX_HOME`
  environment variable when set and `%USERPROFILE%\.codex` otherwise
  (`src-tauri/src/cli.rs`, `codex_home()`).
- Command names, config keys and flags in these pages were read out of the source. If one
  disagrees with the code, the code is right and the page is a bug.

## The one rule the whole product rests on

The GUI is a **front end**, not a reimplementation. Every panel either

1. invokes the real `codex` binary and renders its output, or
2. reads and writes a real file (`$CODEX_HOME/config.toml`, a skill directory, a rollout
   transcript), or
3. is a local convenience (cost arithmetic, the regex builder, appearance) that touches no
   agent behaviour at all.

If a change would require Studio to model something the CLI already models — approval policy
semantics, sandbox rules, config validation — the change is wrong. Run the CLI and show what it
said.
