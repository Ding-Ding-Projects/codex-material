# External editor integration

> Detect what is actually installed, let the user choose one, open the project folder or a single
> file in it — and say so plainly when nothing is installed.

**Implementation:** `src-tauri/src/editors.rs`, exposed as `codex_editors`, `codex_open_external`
and `codex_reveal`.

## Detection

Detection is **by executable, not by guessing**. An editor that is not on this machine is never
offered.

Each candidate is resolved in two passes:

1. `where <exe>` for each of its executable names, in order — the first that resolves wins.
2. If `PATH` yields nothing, a small list of per-candidate location hints, with `%LOCALAPPDATA%`,
   `%PROGRAMFILES%`, `%APPDATA%` and `%USERPROFILE%` expanded.

| id | Label | Executables tried | Hint locations |
| --- | --- | --- | --- |
| `vscode` | Visual Studio Code | `code.cmd`, `code` | `%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd`, `%PROGRAMFILES%\Microsoft VS Code\bin\code.cmd` |
| `vscode-insiders` | VS Code Insiders | `code-insiders.cmd`, `code-insiders` | `%LOCALAPPDATA%\Programs\Microsoft VS Code Insiders\bin\code-insiders.cmd` |
| `cursor` | Cursor | `cursor.cmd`, `cursor` | `%LOCALAPPDATA%\Programs\cursor\resources\app\bin\cursor.cmd` |
| `windsurf` | Windsurf | `windsurf.cmd`, `windsurf` | `%LOCALAPPDATA%\Programs\Windsurf\bin\windsurf.cmd` |
| `zed` | Zed | `zed.exe`, `zed` | `%LOCALAPPDATA%\Zed\Zed.exe` |
| `sublime` | Sublime Text | `subl.exe`, `subl` | `%PROGRAMFILES%\Sublime Text\subl.exe` |
| `notepadpp` | Notepad++ | `notepad++.exe` | `%PROGRAMFILES%\Notepad++\notepad++.exe` |
| `idea` | IntelliJ IDEA | `idea64.exe`, `idea` | — |
| `notepad` | Notepad | `notepad.exe` | — |

`codex_editors()` returns only what resolved:

```jsonc
{ "editors": [ { "id": "vscode", "label": "Visual Studio Code",
                 "exe": "C:\\Users\\me\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd",
                 "args": ["{path}"] } ] }
```

Every candidate's argument template is `["{path}"]`; `{path}` is replaced with the target. Ordering
in the table is the preference order — Notepad is last precisely because it is the always-present
fallback rather than anyone's choice of editor.

## Opening

```js
CX.bridge.invoke("codex_open_external", { args: { path, editor, exe } });
```

Resolution order:

1. **`exe`** — a user-supplied executable path. Launched with the target as its only argument.
   This is the escape hatch for an editor not in the table.
2. **`editor`** — a candidate id. Rejects with `` unknown editor `<id>` `` when the id is not in
   the table, and with `"<label> is configured but was not found on this machine"` when it is
   known but no longer installed (an editor uninstalled since the choice was saved).
3. **Neither** — the first detected candidate, in table order.

The path is checked first: a missing target rejects with `"<path> does not exist"` rather than
launching an editor onto nothing. Both a file and a directory are valid targets, which is what
lets the same command serve "open this file" and "open this project folder".

On success: `{ opened, editor, label, exe, pid }`.

## Graceful failure when nothing is installed

With no editor found and no `exe` given, `codex_open_external` rejects with

> `no supported editor was found on this machine`

This is a message, not a crash and not a silent no-op. The intended UI response is a persistent
error notification offering two actions:

- **Reveal in File Explorer** → `codex_reveal({ args: { path } })`, which always works on Windows.
- **Choose an editor…** → let the user point at an executable, store it as
  `CX.settings.editorExe`, and retry.

`CX.settings` already carries `editor` (a candidate id) and `editorExe` (a custom path), both
defaulting to `""` and persisted with the rest of the Studio settings.

> **Status:** the backend commands and the settings fields exist. A dedicated editor-picker
> surface in the settings UI is **not yet built**; today the choice is whichever candidate ranks
> first unless a caller passes `editor` or `exe` explicitly. Treat the picker as outstanding work.

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Preferred editor id | `CX.settings.editor` | `""` (auto — first detected) |
| Custom executable | `CX.settings.editorExe` | `""` |
| Candidate table | `CANDIDATES` in `src-tauri/src/editors.rs` | The nine above |

Adding a candidate is four lines: id, label, executable names, hint paths. Prefer adding to the
table over telling users to fill in a custom path.

## Failure modes

| Symptom | Message / behaviour |
| --- | --- |
| Target missing | `"<path> does not exist"` |
| Configured editor uninstalled | `"<label> is configured but was not found on this machine"` |
| Unknown id | `` unknown editor `<id>` `` |
| Nothing installed | `"no supported editor was found on this machine"` |
| Custom `exe` cannot start | `"could not start <exe>: <os error>"` |
| Editor launches but opens nothing | The executable does not take a bare path argument; the `args` template needs a per-candidate flag |
| Editor opens the file but not as a project | Pass the folder rather than the file — both are valid targets |
| A console window flashes | Should not happen: every spawn goes through `cli::command`, which sets `CREATE_NO_WINDOW` |
| Detection is slow the first time | `where` is run per candidate per call; results are not cached |

## Security considerations

- **`exe` launches an arbitrary executable with an arbitrary argument.** It exists so a user can
  point at an editor the table does not know, and it must only ever be filled from a value the
  user chose in a file picker or typed into settings. Never populate it from CLI output, a config
  file, a project file or anything downloaded — that turns it into arbitrary code execution.
- **`path` is not sandboxed.** `codex_open_external` and `codex_reveal` will act on any existing
  path. Keep the caller in charge of what path is passed.
- **Detection reads no file contents** and executes nothing during detection — `where` resolves a
  name, and the hint check is a `is_file()` test.
- **The child is spawned detached**, inheriting Studio's environment. Do not add secrets to the
  process environment expecting them to stay inside Studio.
- **Reveal is the safe fallback**, not a lesser one: `explorer.exe <path>` needs nothing installed
  and cannot execute the target.

## Verification

1. With VS Code installed, `codex_editors()` lists it with a real, existing `exe` path.
2. With an editor uninstalled but still listed in settings, opening reports *"… is configured but
   was not found on this machine"* rather than failing silently.
3. `codex_open_external` with a **folder** opens the project; with a **file** opens that file.
4. A non-existent path reports `"<path> does not exist"` and launches nothing.
5. Rename every detected editor's executable out of `PATH` (or test on a clean VM) and confirm the
   *"no supported editor was found"* message appears as a persistent error notification with a
   **Reveal in File Explorer** action that works.
6. `codex_reveal` opens File Explorer at the target on a machine with no editor at all.
7. No console window flashes during any of the above.
8. The custom `exe` route works with a full path containing spaces.
