# WSL runtimes

> One long-lived Linux shell per tab, so `cd`, environment variables and background jobs persist
> between commands instead of every run starting from scratch.

**Implementation:** `electron/lib/wsl.js`, exposed as `codex_wsl_list`, `codex_wsl_spawn`,
`codex_wsl_stop`, `codex_wsl_kill`, `codex_wsl_set` and `codex_wsl_exec`; the Runtime panel in
`app/index.html`.

## Why per-tab

A session pins itself to a distribution and Studio keeps **one** shell alive for that session. The
alternative — a fresh `wsl.exe` per command — loses the working directory, the exported
environment and any background process the moment the command returns, which makes a sequence of
related commands behave differently from the same sequence typed into a terminal.

The instance is keyed by the session id, so a run started from one tab is attributed to that tab
and cannot be confused with another's.

## Lifecycle

| Command | Effect |
| --- | --- |
| `codex_wsl_list` | `{ distros, instances }`. Each instance is re-checked with a non-blocking `try_wait`, so an instance whose shell exited on its own reports `status: "stopped"` rather than a stale `"running"`. |
| `codex_wsl_spawn` | Validates the distro against the installed list, **stops any existing instance for that session first**, then starts the keeper shell. |
| `codex_wsl_stop` | Kills the child but keeps the instance record, so the tab remembers its distro and directory. |
| `codex_wsl_kill` | Kills and forgets the instance entirely. |
| `codex_wsl_set` | Patches `cwd`, `distro` or `auto` on the record. |
| `codex_wsl_exec` | Runs one command in the session's distro. |

The keeper process is:

```
wsl.exe -d <distro> --cd <cwd> -- bash -lc "sleep infinity"
```

A login shell under `sleep infinity` keeps the namespace and the mounted Windows drives alive for
the tab without holding a pty open. Its three standard streams are `null`, so it can never block
on input or accumulate output.

## What persists, and what does not

| Persists for the tab | Does **not** persist between `exec` calls |
| --- | --- |
| The WSL distribution instance itself (it stays booted) | The shell's own working directory after a `cd` inside the command |
| Mounted Windows drives (`/mnt/c`, …) | Exported environment variables set inside the command |
| Background processes started detached inside the distro | Shell functions, aliases, history |
| The recorded `distro`, `cwd`, `pid`, `startedAt` and `auto` fields | |

This distinction is the honest version of "state persists". `codex_wsl_exec` starts its own
`wsl.exe -d <distro> --cd <cwd> -- bash -lc <command>` for each call; it does **not** pipe the
command into the keeper shell's stdin. What the keeper buys you is a warm distro and a stable
identity per tab — not a live interactive session.

To carry a directory change across calls, patch the record:
`codex_wsl_set({ args: { session, patch: { cwd: "/mnt/c/src/repo" } } })`.

## Routing a run

1. The tab's session id is the `session` key.
2. If an instance exists for that session, its `distro` and `cwd` are used — the caller's values
   are ignored, so a tab cannot drift onto a different distribution mid-session.
3. If no instance exists, `exec` falls back to the caller's `distro` (or the first installed one)
   and `cwd` (or `~`), so **a run never silently does nothing** because the user forgot to spawn.
4. `command` defaults to `codex --version` — a harmless probe, deliberately chosen so an
   accidental empty run reports the environment rather than doing something surprising.

The result carries the full transcript, tagged for rendering:

```jsonc
{ "code": 0, "session": "s1", "distro": "Ubuntu-24.04", "cwd": "~",
  "lines": [ { "level": "cmd",   "text": "wsl -d Ubuntu-24.04 --cd ~ -- codex --version" },
             { "level": "out",   "text": "codex-cli 0.58.0" },
             { "level": "error", "text": "…stderr, if any…" } ] }
```

The first `cmd` line is the exact invocation, so the user can always see — and reproduce — what
ran.

## Distribution discovery

`distros()` runs `wsl.exe -l -q` and **decodes the output as UTF-16LE**. Reading it as UTF-8 turns
every distro name into NUL-separated garbage, so the decoder sniffs for the interleaved zero bytes
and falls back to UTF-8 only when the sample does not look like UTF-16. Names are trimmed of the
BOM and blank lines are dropped.

`codex_state` includes `wslDistros` at startup, so the Runtime panel is populated before any WSL
command is issued.

## Configuration

| Field | Meaning | Default |
| --- | --- | --- |
| `session` | The tab this instance belongs to | required |
| `distro` | Distribution name, validated against `wsl -l -q` | first installed |
| `cwd` | Working directory the keeper and each `exec` start in | `~` |
| `auto` | Whether the tab should get an instance automatically | `true` |
| `command` | The command for `exec` | `codex --version` |

`auto` is recorded and reported but nothing in the backend acts on it — auto-spawn, if wanted, is
a frontend decision.

Instances live in process memory (`wsl::Runtimes`, a `Mutex<HashMap<String, Instance>>`) and are
**not persisted**: closing Studio ends every keeper shell it started.

## Failure modes

| Symptom | Message / behaviour |
| --- | --- |
| WSL not installed | `"WSL is not available: <os error>"` from `distros()` |
| No distributions installed | `"no WSL distribution is installed"` |
| Unknown distribution requested | `` `<name>` is not an installed WSL distribution `` |
| Keeper cannot start | ``"could not start `<distro>`: <os error>"`` |
| `exec` cannot start | ``"could not run in `<distro>`: <os error>"`` |
| Instance shows `stopped` without being stopped | The keeper exited on its own — WSL was shut down (`wsl --shutdown`), the distro was terminated, or the machine slept |
| `status: "unknown"` | `try_wait` itself failed; the child handle is in an indeterminate state — kill and respawn |
| Instances gone after restarting Studio | Expected: instances are in-memory only |
| `exec` runs in the wrong directory | The instance's recorded `cwd` wins over the caller's; patch it with `codex_wsl_set` |
| A `cd` inside a command has no effect on the next one | Expected — see [What persists](#what-persists-and-what-does-not) |
| Distro names render as garbage | The UTF-16 decode heuristic failed; check `wsl -l -q` output encoding |

## Security considerations

- **`command` is passed to `bash -lc`, which is a shell.** Unlike `codex_run`, this *is* string
  interpretation: metacharacters, pipes, redirection and command substitution all work as typed.
  That is the intended behaviour of a runtime console, and it means the command text must only
  ever come from the user's own input. Never compose it from CLI output, a config file or any
  remote source.
- **WSL is not a sandbox.** A command run here has the user's full access to the Linux filesystem
  *and*, through `/mnt/*`, to the Windows filesystem. Codex's own sandbox policy applies to what
  the agent does inside a run; it does not constrain what the Runtime panel executes directly.
- **`--cd <cwd>` is not validated.** A path outside the workspace is accepted; the boundary is the
  user's intent, not an enforced policy.
- **Output is captured, not logged.** `exec` returns stdout and stderr to the caller; nothing is
  written to disk by this module.
- **Instances are per-process and die with the app**, so a forgotten keeper cannot outlive Studio.
  `kill` exists for the explicit case.
- **Nothing here is Codex-specific.** These commands run any Linux command; keep the panel visibly
  a terminal-equivalent so the user is never surprised about what they just executed.

## Verification

1. `codex_wsl_list` returns the same distributions as `wsl -l -q` in a terminal, correctly decoded
   (no NUL characters, no mangled names).
2. Spawn for a tab: `status: "running"` with a real `pid`, and `wsl -l --running` shows the distro
   as running.
3. `exec` with `pwd` returns the configured `cwd`; patch `cwd` with `codex_wsl_set` and confirm
   the next `exec` starts there.
4. `exec` with a failing command (`false`) returns a non-zero `code` and the stderr lines tagged
   `error`.
5. Spawn twice for the same session: the first keeper is stopped, and only one process remains.
6. `stop` sets `status: "stopped"` while keeping the record; `kill` removes it from the list.
7. Run `wsl --shutdown` externally, then `codex_wsl_list`: the instance reports `stopped` rather
   than a stale `running`.
8. `exec` **without** spawning first still runs, on the first installed distro, and the `cmd` line
   in the transcript names it.
9. On a machine with no WSL at all, the Runtime panel reports *"WSL is not available"* and the
   rest of the app keeps working.
10. Close Studio while a keeper is running and confirm no orphaned `wsl.exe` keeper remains.
