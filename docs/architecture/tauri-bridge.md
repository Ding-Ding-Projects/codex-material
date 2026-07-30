# The Tauri bridge

> The complete IPC contract between `app/` and `src-tauri/`. Every command below is registered
> in `tauri::generate_handler!` at the bottom of `src-tauri/src/lib.rs`.

There are **47** commands. There is no HTTP API, no local server and no socket — see
[../api/README.md](../api/README.md).

## Calling convention

```js
// app/codex-core.js
CX.bridge.invoke("codex_version");                       // no arguments
CX.bridge.invoke("codex_state", { cwd: "C:/src/repo" }); // bare parameter
CX.bridge.invoke("codex_set_config", { args: { key: "model", value: "gpt-5.1-codex" } });
```

`CX.bridge.invoke` routes to `window.__TAURI__.core.invoke` when the Tauri shell is present
(`withGlobalTauri: true` in `src-tauri/tauri.conf.json`) and to the local browser simulation
otherwise.

### Argument shape — read this before adding a call site

Tauri matches the keys of the JS payload to the **Rust parameter names**, not to the fields of
the struct.

| Rust signature | Correct JS payload |
| --- | --- |
| `fn codex_version()` | `{}` or omitted |
| `fn codex_state(cwd: Option<String>)` | `{ cwd: "…" }` or `{ cwd: null }` |
| `fn codex_history_log(limit: Option<usize>)` | `{ limit: 200 }` |
| `fn codex_set_config(args: SetConfigArgs)` | `{ args: { key, value } }` |
| `fn codex_skill_toggle(args: DirArgs, cwd: Option<String>)` | `{ args: { dir }, cwd }` |

A command whose parameter is a struct named `args` therefore needs its payload **nested under
`args`**. Passing the fields flat rejects the whole call with
`invalid args \`args\` for command …: command argument missing`, and because most call sites end
in `.catch(…)` the failure can look like "nothing happened" rather than an error.

> When this page was written, at least one frontend call site (`codex_history_commit`, in the
> `vcs` section of `app/codex-core.js`) passed `{ message, kind, snapshot }` flat instead of
> `{ args: { … } }`. Do not assume either side is currently right — run the audit under
> [Verification](#verification) and fix whichever end is wrong.

`tauri::State` parameters (`state: tauri::State<Runs>`, `tauri::State<wsl::Runtimes>`) and
`app: tauri::AppHandle` are injected by Tauri and are **not** part of the JS payload.

### Errors

A command returning `Result<Json, String>` rejects the JS promise with the `String` on `Err`.
Commands returning a bare `Json` cannot fail; they return a degraded value instead (an empty
list, `status: "absent"`). Failures are surfaced through `CX.notifyBackendFailure`, which raises
an error notification carrying what the backend literally said —
see [../features/notifications.md](../features/notifications.md).

### Events

`codex_run` is the only command that emits. It streams every stdout and stderr line as it
arrives to the event name the caller supplies:

```js
const un = await CX.bridge.listen("codex://stdout", (e) => {
  // e.payload === { id: "<run id>", level: "out" | "error", text: "<one line>" }
});
await CX.bridge.invoke("codex_run", {
  args: { args: ["exec", "--json", "fix the test"], cwd, stream: "codex://stdout", id: runId }
});
un();
```

`level` is `"out"` for stdout and `"error"` for stderr (`Line::new` in `src-tauri/src/cli.rs`).
stdout and stderr are drained on separate threads — reading them in sequence deadlocks as soon as
the child fills the pipe nobody is draining.

---

## Identity and startup

### `codex_version()`
Runs `codex --version`.
Returns `{ version, home, bin, bridge: "tauri", ok }` — `home` is `$CODEX_HOME`, `bin` is the
resolved binary name (`CODEX_BIN` or `"codex"`), `ok` is the exit status. When the CLI writes its
version to stderr instead of stdout, `version` carries the stderr text.

### `codex_state({ cwd? })`
One round trip that fills the whole shell on launch. Each section degrades on its own — a missing
marketplace must not blank out the MCP list beside it.

Returns:

```jsonc
{
  "codexHome": "C:\\Users\\me\\.codex",
  "version":   "codex-cli 0.58.0",
  "auth":      { "method": "chatgpt|api|none|unknown", "detail", "account", "store": "file|keyring", "authFile", "ok" },
  "mcp":       [ /* see codex_mcp_list */ ],
  "plugins":   [ /* see codex_plugin_list */ ],
  "catalog":   [ /* see codex_plugin_catalog */ ],
  "marketplaces": [ { "name", "url", "plugins" } ],
  "skills":    [ { "name", "dir", "path", "enabled", "source": "user|project", "desc" } ],
  "hooks":     [ /* see codex_hook_list */ ],
  "features":  [ { "key", "stage", "enabled" } ],
  "sessions":  [ /* newest 300, see codex_session_list */ ],
  "config":    { /* config.toml parsed to JSON, or null */ },
  "wslDistros": ["Ubuntu-24.04", "…"],
  "errors":    { "mcp": "…", "plugins": "…" }   // only the sections that failed
}
```

`errors` is the honest half of the contract: a section that failed appears there by name with
what the CLI said, because a silently empty list reads as "you have none", which is a different
fact.

---

## Configuration — `$CODEX_HOME/config.toml`

### `codex_read_config()`
Parses `config.toml` and returns it as JSON. An absent or empty file is an empty table, not an
error. Invalid TOML rejects with `"<path> does not parse: <detail>"`.

### `codex_read_config_text()`
Returns `{ path, text }` — the raw file for the TOML editor. A missing file yields `text: ""`.

### `codex_write_config({ args: { tomlText } })`
Field aliases accepted: `tomlText`, `toml`, `toml_text`.
Validates the TOML **before** touching disk (`"refusing to write invalid TOML: …"`), copies the
existing file to `config.toml.studio-<epoch>.bak`, then writes.
Returns `{ written: true, path, backup: "<path>|null", bytes }`.

### `codex_set_config({ args: { key, value } })`
`key` is a dotted path such as `mcp_servers.github.enabled` or `model_reasoning_effort`.
Intermediate tables are created as needed; a `null` value **removes** the key. Rejects with
`` `<key>` crosses a non-table value `` when the path runs through a scalar.
Returns the same shape as `codex_write_config` — every set is a full validated rewrite plus a
backup.

---

## Running the CLI

### `codex_run({ args: { args, cwd?, stream?, id? } })`
| Field | Type | Meaning |
| --- | --- | --- |
| `args` | `string[]` | Full argv **after** the `codex` binary, already composed by the GUI. |
| `cwd` | `string?` | Working directory for the child process. |
| `stream` | `string?` | Event name to emit each line on, e.g. `"codex://stdout"`. |
| `id` | `string?` | Opaque id so the GUI can attribute the run to the tab that started it. |

Rejects immediately with `"no arguments were composed for this run"` when `args` is empty.
Returns `{ code, id, lines: [{ level, text }] }` once the child exits. `stdin` is `null`, so a
subcommand that prompts will not hang waiting for a keystroke that can never arrive.

### `codex_capture({ args: { args, cwd? } })`
One-shot capture for panels that need the text, not a live stream.
Returns `{ code, stdout, stderr }` verbatim.

---

## Catalogs

### `codex_doctor()`
Runs `codex doctor --json --all` and regroups the flat check map by category.
Returns `{ at, version, overall, groups: [{ name, checks: [{ name, ok, status, detail, details, remediation }] }] }`.

### `codex_mcp_list()`
Runs `codex mcp list --json` and normalises each row:

```jsonc
{ "name", "transport": "stdio|streamable-http|…", "command", "args": [], "url", "cwd",
  "enabled": true, "status": "configured|disabled|error", "disabledReason": null,
  "oauth": false, "authStatus": "", "startupTimeoutSec": null, "toolTimeoutSec": null }
```

### `codex_mcp_toggle({ args: { name } })`
Enable/disable is a **config edit, not a CLI verb**: it flips `mcp_servers.<name>.enabled`, which
Codex reads on the next run. Returns the refreshed list.

### `codex_mcp_add({ args: { name, transport?, command?, args?, url? } })`
`transport` defaults to `"stdio"`. A stdio server requires `command` (rejects with *"a stdio MCP
server needs a command"*) and runs `codex mcp add <name> -- <command> [args…]`. Any other
transport requires `url` (*"an HTTP MCP server needs a URL"*) and runs
`codex mcp add <name> --url <url>`. Returns the refreshed list.

### `codex_mcp_remove({ args: { name } })`
Runs `codex mcp remove <name>`; rejects with the CLI's stderr on failure. Returns the refreshed list.

### `codex_plugin_list()`
Runs `codex plugin list --json`, returns the `installed` array as rows of
`{ id, name, marketplace, version, installed, enabled, path, installPolicy, authPolicy, desc }`.

### `codex_plugin_catalog()`
Runs `codex plugin list --available --json` and merges `installed` + `available`, sorted and
deduplicated by `id`. This is what the plugin marketplace browser renders.

### `codex_plugin_install({ args: { name } })` · `codex_plugin_uninstall({ args: { name } })`
`codex plugin add <name>` / `codex plugin remove <name>`. Both return the refreshed installed
list, or reject with the CLI's stderr.

### `codex_marketplace_list()`
`codex plugin marketplace list --json` → `[{ name, url, plugins }]`.

### `codex_marketplace_add({ args: { name, url? } })` · `codex_marketplace_remove({ args: { name } })`
`codex plugin marketplace add <name> <url>` / `… remove <name>`. Both return the refreshed list.

### `codex_skill_list({ cwd? })`
Infallible. Scans for directories containing a `SKILL.md` in
`$CODEX_HOME/skills`, `~/.agents/skills` (both tagged `source: "user"`) and, when `cwd` is given,
`<cwd>/.codex/skills` (tagged `"project"`). A skill is **disabled when its directory name ends in
`.disabled`** — the same convention the CLI uses when skipping one. `desc` is the first
`description:` line of the manifest.

### `codex_skill_toggle({ args: { dir }, cwd? })`
Renames `<dir>` ⇄ `<dir>.disabled`. Rejects with `"<dir> is not a skill directory"` when there is
no `SKILL.md`. Returns the refreshed list for `cwd`.

### `codex_hook_list()`
Reads `[hooks.<event>]` out of `config.toml` (a table or an array of tables) and returns
`[{ event, index, name, command, scope, trusted, enabled }]`. `enabled` defaults to `trusted`.

### `codex_hook_toggle({ args: { event, index } })`
Flips `enabled`. **Rejects untrusted hooks** with *"untrusted hooks never run and cannot be
enabled here"* — trust is granted by the CLI, never by the GUI. Array-form hooks are rewritten
wholesale because the `toml` crate cannot address an array element by path.

### `codex_features()`
Parses `codex features list`, whose lines read `key  <stage words>  <bool>`. Parsed from both ends
so a multi-word stage such as `under development` survives. Returns `[{ key, stage, enabled }]`.

### `codex_set_feature({ args: { key, value } })`
Runs `codex features enable|disable <key>`, then re-lists. Rejects with
`` `codex features <verb> <key>` failed: <stderr> ``.

### `codex_session_list()`
Infallible. Walks `$CODEX_HOME/sessions` and `archived_sessions` for `*.jsonl` rollouts, reading
**only the first line** of each (the `session_meta` record) so a few hundred multi-megabyte
transcripts stay cheap. Newest first, capped at 300. Rows:
`{ id, name, cwd, path, updatedAt, archived, originator, cliVersion, interactive }`.

### `codex_session_action({ args: { id, action } })`
`action` ∈ `archive` | `unarchive` | `delete`, mapped straight onto `codex <verb> <id>`. Any other
value rejects with `` unknown session action `<other>` ``. Returns the refreshed list.

---

## Authentication

### `codex_login_status()`
Infallible. Runs `codex login status` and classifies the first line into
`method: "api" | "chatgpt" | "none" | "unknown"`, alongside `detail`, `account`,
`store` (`"file"` when `$CODEX_HOME/auth.json` exists, else `"keyring"`), `authFile`, `ok`.

### `codex_login({ method? })`
`codex login` opens a browser and blocks on the callback, so it is **spawned detached** and the
GUI polls `codex_login_status` for the result. Returns `{ started: true, pid }`.

`method === "api"` is **refused by design**: API-key login reads the key from stdin, and the
refusal message tells the user to run `codex login --with-api-key` in a terminal so the key never
passes through the GUI process, its logs or its IPC.

### `codex_logout()`
Runs `codex logout`. Returns `{ ok, detail, auth }` with a freshly read auth status.

---

## WSL runtimes

All six take `{ args: WslArgs }` where

```jsonc
{ "session": "<tab id>", "distro": "Ubuntu-24.04", "cwd": "~", "command": "…", "auto": true, "patch": {} }
```

`session` is the only required field. See [../features/wsl-runtimes.md](../features/wsl-runtimes.md).

| Command | Args used | Returns |
| --- | --- | --- |
| `codex_wsl_list()` | none | `{ distros: string[], instances: { <session>: { session, distro, cwd, pid, startedAt, auto, status } } }` |
| `codex_wsl_spawn` | `session`, `distro?`, `cwd?`, `auto?` | The new instance. Rejects with `"no WSL distribution is installed"` or `` `<distro>` is not an installed WSL distribution ``. |
| `codex_wsl_stop` | `session` | The instance with `status: "stopped"`, or `{ session, status: "absent" }`. Infallible. |
| `codex_wsl_kill` | `session` | The full list after removal. Infallible. |
| `codex_wsl_set` | `session`, `patch` (`cwd`, `distro`, `auto`) | The full list. Infallible. |
| `codex_wsl_exec` | `session`, `command?`, `distro?`, `cwd?` | `{ code, session, distro, cwd, lines: [{ level: "cmd"\|"out"\|"error", text }] }` |

`distros()` decodes `wsl -l -q` as UTF-16LE — reading it as UTF-8 turns every distro name into
NUL-separated garbage.

---

## Local version history

Backed by a git repository at `$CODEX_HOME/studio`. See
[../features/local-version-control.md](../features/local-version-control.md).

| Command | Args | Returns |
| --- | --- | --- |
| `codex_history_commit` | `{ args: { message, kind?, snapshot? } }` — `kind` defaults to `"change"` | `{ committed: true, id, message, kind, repo }`, or `{ committed: false, reason: "nothing changed" }` |
| `codex_history_log` | `{ limit? }` (default 200) | `{ commits: [{ id, at, kind, message }], repo }` |
| `codex_history_show` | `{ args: { id } }` | The snapshot JSON as it stood at that revision |
| `codex_history_diff` | `{ args: { id } }` | `{ id, diff }` — `git show --format= --unified=1 <id>` |
| `codex_history_prune` | `{ keep? }` (default 100) | `{ pruned, kept }` |

The commit subject is stored as `[<kind>] <message>` and split back apart by `codex_history_log`.

---

## External editors

### `codex_editors()`
Infallible. Probes each known candidate through `where <exe>` and then through per-candidate path
hints. Returns `{ editors: [{ id, label, exe, args }] }` containing **only editors that are
actually installed**.

### `codex_open_external({ args: { path, editor?, exe? } })`
Opens `path` (a file or a folder). `exe` wins if given; otherwise `editor` selects a candidate by
id; otherwise the first detected editor is used. Rejects with `"<path> does not exist"`,
`` unknown editor `<id>` ``, `"<label> is configured but was not found on this machine"` or
`"no supported editor was found on this machine"`.
Returns `{ opened, editor, label, exe, pid }`.

### `codex_reveal({ args: { path } })`
Opens the path in File Explorer — the fallback when no editor is installed. Returns
`{ revealed }`.

---

## Miscellaneous

### `codex_fonts()`
Infallible. Enumerates `%WINDIR%\Fonts` and `%LOCALAPPDATA%\Microsoft\Windows\Fonts` for `.ttf`,
`.otf` and `.ttc` files and returns `{ fonts: string[] }` of de-duplicated, case-insensitively
sorted file stems (underscores become spaces). Reading the two directories is far cheaper than
enumerating the registry and covers both machine-wide and per-user installs.

> The names are **file stems, not typographic family names**: `seguisb` rather than
> `Segoe UI Semibold`. The appearance editor should treat them as candidates to validate, not as
> CSS family names to trust blindly.

### `codex_read_text({ args: { path } })`
Reads a UTF-8 text file. An **absolute** path is read as given; a **relative** path resolves
against the bundled resource directory, so shipped documents (a changelog, for example) come out
of the installer instead of the network. Rejects with `"<resolved path>: <io error>"`.

> `src-tauri/tauri.conf.json` currently declares no `bundle.resources`, so the resource directory
> ships empty. A relative `codex_read_text` call will fail until the file is added there — see
> [../build/packaging.md](../build/packaging.md).

---

## Security considerations

- **The frontend composes argv; the backend does not sanitise it.** `codex_run` and
  `codex_capture` pass `args` straight to `Command::args`, which on Windows means no shell is
  involved and no quoting or metacharacter interpretation happens. There is no injection through
  a crafted argument, but there is also nothing stopping the GUI from composing
  `--dangerously-bypass-approvals-and-sandbox`. That flag must stay visible in the command
  preview at every funny level.
- **Secrets never travel over IPC.** API-key login is refused with an explanation
  (`codex_login`). Nothing in the bridge reads `auth.json`; `codex_login_status` reports only
  whether the file exists.
- **Config writes are always recoverable.** Every write validates first and leaves a
  `config.toml.studio-<epoch>.bak` beside the original.
- **Path arguments are trusted, and are the sharpest edge here.** `codex_read_text` will read any
  absolute path, `codex_open_external` will launch any executable passed as `exe`, and
  `codex_reveal` opens any existing path. These are reachable only from the app's own UI, but a
  future feature that lets remote or file-supplied content choose those arguments would turn them
  into an arbitrary-read and arbitrary-execute primitive. Keep the caller in charge.
- **The capability allowlist is minimal.** `src-tauri/capabilities/default.json` grants the
  `main` window `core:default`, the window-control permissions its custom title bar needs,
  `core:event:default`, `core:app:default`, `dialog:default`, `os:default` and `shell:allow-open`
  — no filesystem plugin, no HTTP plugin.
- **The CSP forbids egress.** `default-src 'self'; … connect-src 'self' ipc: http://ipc.localhost`
  in `src-tauri/tauri.conf.json`. A `fetch()` to any host fails.

## Failure modes

| Symptom | Cause | Where to look |
| --- | --- | --- |
| Every command rejects with `could not run \`codex …\`` | The CLI is not on `PATH` | Set `CODEX_BIN` to the full path, or install the CLI. `cli::codex_bin()` |
| `codex_state` returns rows but `errors` is populated | One CLI subcommand failed; the rest succeeded | The `errors` object names the section and carries the CLI's message |
| A `--json` command rejects with `did not return JSON` | The subcommand printed a human banner and no JSON body | `cli::parse_loose_json` already retries from the first `{`/`[`; beyond that the CLI output changed |
| `invoke` resolves with plausible but fake data | The page is running in a browser, not in Tauri | The title bar shows `Browser preview`; `CX.bridge.mode === "browser"` |
| A call silently does nothing | The payload shape does not match the Rust signature and the rejection was swallowed by `.catch()` | See [Argument shape](#argument-shape--read-this-before-adding-a-call-site) |
| A run never finishes | The child is waiting on stdin | `cli::stream` sets `stdin(Stdio::null())`; a subcommand that still blocks needs a non-interactive flag |

## Verification

1. **The registered surface matches this page.**
   ```bash
   sed -n '/generate_handler!\[/,/\]/p' src-tauri/src/lib.rs | grep -c 'codex_'   # → 47
   ```
2. **Every command in the handler list has a `#[tauri::command]` above it.**
   ```bash
   grep -c '#\[tauri::command\]' src-tauri/src/lib.rs                            # → 47
   ```
3. **Audit call-site argument shapes.** List every command the frontend calls and compare each
   against the Rust signature:
   ```bash
   grep -rno 'invoke("[a-z_]*"' app/*.js app/index.html | sort -u
   grep -n 'fn codex_' src-tauri/src/lib.rs
   ```
   Any command whose Rust parameter is `args: <Struct>` must be called with `{ args: { … } }`.
4. **The backend compiles and its shapes are what the tests expect.**
   ```bash
   cd src-tauri && cargo check
   ```
5. **A real round trip.** Launch the app (`npx --yes @tauri-apps/cli@2 dev`), confirm the title
   bar reads `Tauri IPC`, then in the WebView devtools console:
   ```js
   await window.__TAURI__.core.invoke("codex_version");
   await window.__TAURI__.core.invoke("codex_doctor");
   ```
   The first must report the same version as `codex --version` in a terminal; the second must
   report the same failures as `codex doctor --all`.
6. **Streaming works.** Start a `codex_run` with a `stream` name and confirm lines arrive before
   the promise resolves, not all at once after it.
