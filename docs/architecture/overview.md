# Architecture overview

> Three layers, one rule: the CLI is the product, Studio is the surface.

## 1. `app/` — the frontend

Plain browser JavaScript. No bundler, no ES modules, no TypeScript, no build step. Files are
loaded in order by `app/index.html` and each attaches exactly one global.

| File | Global | Responsibility |
| --- | --- | --- |
| `app/vendor/react.production.min.js`, `react-dom.production.min.js` | `React`, `ReactDOM` | Vendored React 18.3.1 production build. Loaded first, before `support.js`, which throws if `window.React` is missing. |
| `app/support.js` | `window.DC` runtime internals | Generated `dc-runtime`. Compiles the `<x-dc>` template into React elements and drives the logic class. **Do not hand-edit** — its header says it is generated from `dc-runtime/src/*.ts`. |
| `app/codex-data.js` | `window.CODEX` | Static catalog of the CLI surface: `ENUMS`, `MODELS`, `SUBCOMMANDS`, `GLOBAL_FLAGS`, `SLASH`, `SETTINGS`, `FEATURES`, `HOOK_EVENTS`. This is data, not behaviour — it drives the Console and Config panels. |
| `app/codex-core.js` | `window.CX` | The runtime core: `bridge`, `store`, `toToml`, `evaluate` (regex), `CONSTRUCTS`, `FLAGS`, `LIMITS`, `color`, `i18n`, `narrator`, `vcs`, `notify`, `tabs`, `settings`, `dimsum`, `live`, `sim`. |
| `app/cx-*.js` | `window.CX_TABS`, `window.CX_NOTIFY`, `window.CX_I18N`, `window.CX_DIMSUM`, … | Feature modules. Each exposes a `create(...)` factory or a data table; `codex-core.js` wires them into `CX` when present and degrades to a local fallback when they are not. |
| `app/index.html` | — | The template plus `class Component extends DCLogic`. |

Everything is loaded from disk. The shipped app runs under
`default-src 'self'` (see `src-tauri/tauri.conf.json`), so a CDN reference would simply fail.

### Why the frontend also runs in a plain browser

`CX.bridge` reports `mode === "tauri"` when `window.__TAURI__` exists and `"browser"` otherwise.
In browser mode `invoke()` falls through to a local simulation (`sim()` in `codex-core.js`) that
returns plausible fixtures. That is why `app/index.html` can be opened directly as a design
preview without a Rust toolchain — and why **a screenshot taken in browser mode proves nothing
about the real backend**. Any verification that matters must run inside the Tauri shell, where
the title bar shows `Tauri IPC` rather than `Browser preview`.

Under Tauri, `CX.live.hydrate()` calls `codex_state` once and **replaces the simulated state
object in place**, so every panel that reads `CX.sim.mcp` keeps working and starts showing real
data.

## 2. The `dc` runtime

`app/support.js` is a small template engine on top of React. It reads the `<x-dc>` element's
inner HTML, compiles `{{ … }}` holes, `sc-for`, `sc-if` and `style-*` attributes into React
element builders, and renders them against the flat object returned by
`Component.prototype.renderVals()`.

The important property: **the template is declarative and the logic is one class**. There is no
JSX, no component tree to thread props through, and no reactive graph. `renderVals()` returns
everything the template needs, computed fresh on each render. See
[frontend-runtime.md](frontend-runtime.md).

## 3. `src-tauri/` — the backend

A Rust library crate (`codex_studio`) plus a seven-line launcher binary, so the whole backend is
unit-testable without opening a window (`src-tauri/src/main.rs`).

| Module | Responsibility |
| --- | --- |
| `lib.rs` | Declares the 47 `#[tauri::command]` functions and registers them in `tauri::generate_handler!`. Also owns `Runs`, the map of live child processes keyed by the GUI's run id. |
| `cli.rs` | Locating and running `codex`: `codex_home()`, `codex_bin()`, `command()` (suppresses the console window on Windows via `CREATE_NO_WINDOW`), `run`, `run_in`, `run_json`, `stream`. |
| `catalog.rs` | Everything the GUI lists — MCP servers, plugins, marketplaces, skills, hooks, feature flags, saved sessions, auth status, doctor — read from the real CLI and the real `$CODEX_HOME`, then normalised. |
| `config.rs` | `$CODEX_HOME/config.toml`: parse to JSON, write text (rejecting invalid TOML), set/remove a dotted key path, and back the previous file up before every write. |
| `history.rs` | The local git-backed append-only history in `$CODEX_HOME/studio`. |
| `editors.rs` | External editor detection and launch, plus "reveal in File Explorer". |
| `wsl.rs` | Per-tab WSL runtimes: list distros, spawn a long-lived shell per session, exec in it, stop and kill. |

## Why the CLI is never reimplemented

Three reasons, in order of importance.

1. **Correctness.** Approval policy, sandbox behaviour, config precedence, plugin trust and hook
   trust are safety-relevant semantics that change with the CLI. A GUI that models them locally
   will eventually disagree with the binary the user actually runs, and the disagreement will be
   invisible until it matters. `src-tauri/src/cli.rs` says it in one line: *"this module only
   knows how to find the binary, run it, and hand the output back verbatim."*
2. **Truthfulness.** When `codex doctor` reports a failure, Studio shows that failure. When a run
   exits non-zero, the exit code and both streams come back untouched
   (`codex_capture` returns `{ code, stdout, stderr }`). Nothing is summarised into a friendlier
   lie.
3. **Maintenance.** A new subcommand or flag needs a catalog entry in `app/codex-data.js`, not a
   new code path. The composed argv is handed to `codex_run` and the CLI decides what it means.

The two deliberate exceptions, both of which touch no agent behaviour:

- **`config.toml` writes.** Studio edits the file directly (`config.rs`) rather than shelling
  out, because there is no CLI verb for "set this dotted key". Every write validates the TOML
  first and copies the previous file to `config.toml.studio-<epoch>.bak`.
- **Enable/disable toggles that are file state.** `mcp_servers.<name>.enabled` is a config key;
  a skill is disabled by renaming its directory to `<name>.disabled`, which is the convention the
  CLI itself uses. Both are state on disk, not agent logic.

## Data that lives outside the app

| Location | Written by | Contents |
| --- | --- | --- |
| `$CODEX_HOME/config.toml` | The CLI and Studio | The real Codex configuration. |
| `$CODEX_HOME/config.toml.studio-*.bak` | Studio | Timestamped backups taken before each write. |
| `$CODEX_HOME/studio/` | Studio | The local git history repository — snapshot JSON plus a copy of `config.toml`. Never pushed. |
| `$CODEX_HOME/sessions/`, `archived_sessions/` | The CLI | Rollout transcripts (`*.jsonl`). Studio reads only the first line of each to build the session list. |
| `$CODEX_HOME/skills/`, `~/.agents/skills/`, `<cwd>/.codex/skills/` | The user | Skill directories containing `SKILL.md`. |
| `localStorage`, keys prefixed `codexstudio.` | Studio | Everything that is Studio's own preference: theme, language mode, funny levels, appearance overrides, profiles, tab layout, notification history, cost inputs. |

Studio-only preferences never enter `config.toml`, and Codex configuration never enters
`localStorage`. Mixing the two would mean uninstalling Studio changed how the CLI behaves.
