# Local version control

> A git-backed, append-only history of everything Studio owns, in `$CODEX_HOME/studio` — never a
> `.git` inside the user's own project, never pushed. Restoring writes a **new** revision, so an
> undo can be undone, and that undo undone in turn.

**Implementation:** `electron/lib/history.js` (the repository), the `vcs` object in
`app/codex-core.js` (the in-app log, the snapshot and the undo semantics), the five
`codex_history_*` IPC commands in `electron/commands.js`, and the History panel in
`app/index.html`.

## Where it lives

```
$CODEX_HOME/studio/
  .git/                  git init --initial-branch main
  .gitignore             "# Codex Studio history — local only, never pushed."  +  *.bak
  studio-state.json      the snapshot, pretty-printed JSON
  codex-config.toml      a copy of the live config.toml at that revision
```

`$CODEX_HOME` is `process.env.CODEX_HOME` when set, otherwise `<homedir>/.codex`
(`codexHome()` in `electron/lib/cli.js`). The repository sits **beside the app's own data**, never
inside a user's project, so no project ever acquires a stray `.git` and no existing repository is
touched.

`ensureRepo()` runs before every operation and is idempotent: create the directory, `git init` if
`.git` is absent, then set `user.name = "Codex Studio"` and `user.email = "studio@codex.local"`
**on this repository only**. The user's global git identity is never read or written.

There is **no remote**, no `git remote add`, and no push anywhere in the module. It is local
storage that happens to be a git repository.

## What is snapshotted

Not just documents. The rule the module states up front is that restoring an account without the
configuration it ran under is a subtly wrong state — worse than offering no undo at all — so
everything Studio owns travels in one snapshot. `vcs.snapshot()` collects:

| Key | What it is |
| --- | --- |
| `profiles`, `activeProfile` | The profile records and which one is live |
| `config` | The Codex config Studio composed |
| `features` | Feature-flag overrides |
| `appearance`, `appearancePresets` | Per-element styling — see [appearance.md](appearance.md) |
| `tabs` | The whole tab model: order, pinning, groups, collapsed state |
| `prices`, `cost` | The cost calculator's inputs |
| `lang`, `funny` | Language mode and both funny levels |
| `settings` | The Studio settings object — narrator, dim sum, editor, history retention, density |
| `yolo` | The bypass toggle |

Alongside it, `commit()` writes `codex-config.toml` — the live `config.toml` as text — so a
revision records what the CLI itself was configured with at that moment, not only what Studio
thought. If that file cannot be read, the failure is swallowed and the snapshot is still
committed: an unreadable config is not a reason to lose the revision.

### What is *not* snapshotted

Chat transcripts, session rollout files, `auth.json`, the Codex CLI's own state, and anything else
under `$CODEX_HOME` that Studio does not own. Studio is a front end; the CLI owns those.

## An unchanged state records nothing

```js
git(["add", "-A"], { tolerant: true });
const staged = git(["diff", "--cached", "--quiet"], { tolerant: true });
if (staged.ok) return { committed: false, reason: "nothing changed" };
```

`git diff --cached --quiet` exits 0 when there is nothing staged. So a save that changed nothing
produces `{ committed: false }` and no commit object, and the History panel stays a list of real
events rather than a list of saves.

## Labels name what changed

Every commit message is `[<kind>] <message>`, and the message says what happened:

```
[settings]   Disabled the dim sum surprise
[change]     Install plugin secrets-guard
[profile]    Set sandbox workspace-write
[appearance] Reset every element appearance
[revert]     Undo — Set model gpt-5.1-codex-mini
[revert]     Undo of undo — Set model gpt-5.1-codex-mini
```

`log()` parses them back with `--pretty=format:%h %at %s` — short hash, epoch seconds, subject —
split on the first two whitespace runs. Space-separated rather than a delimiter character on
purpose: the hash and the epoch never contain a space, so splitting is unambiguous even when the
subject does. The `[kind]` prefix is stripped back into a `kind` field, defaulting to `change`.

`at` comes back in **seconds**; the History panel multiplies by 1000.

## Append-only restore

This is the property that makes a history panel safe to experiment with.

`vcs.revert(id)` restores the snapshot from **before** the commit it names, then writes that
restoration as a **new** commit:

```js
const c = { id: this.id(), at: Date.now(),
  message: (target.kind === "revert" ? "Undo of undo — " : "Undo — ") + target.message,
  kind: "revert", parent: this.head, reverts: target.id, snapshot: snap };
this.log.unshift(c);
```

Nothing is popped, rewound, amended or dropped. Undoing an undo is just another revert whose target
happens to be a revert, which is why the label says *"Undo of undo — …"*. A user can walk backwards
and forwards through their own changes indefinitely without ever risking the state they started
from.

`show(id)` returns the snapshot as it stood at a revision — the caller applies it and commits the
result as a fresh revision. It never mutates history. `diff(id)` returns
`git show --format= --unified=1 <id>`, so the panel can say what actually changed rather than that
something did.

### A gap worth knowing

`vcs.checkout(id)` — restore to a named revision, as opposed to undoing the most recent one —
writes its `Restore — …` entry into the in-app log and applies the snapshot, but **does not call
`codex_history_commit`**, so that particular action is not mirrored into the git repository.
`commit()` and `revert()` both do. The git-side commands `codex_history_show` and
`codex_history_diff` are registered and tested but have no frontend caller yet.

## A failed history write never fails the operation

The single most important behaviour in this module.

Every call from the app is fire-and-forget with an explicit catch:

```js
bridge.invoke("codex_history_commit", { message, kind: c.kind, snapshot: c.snapshot })
  .catch((e) => notifyBackendFailure("history", e));
```

If git is not installed, if `$CODEX_HOME` is read-only, if the repository is locked by another
process — the user's change has **already been applied** to the store and to the UI. The history
write is a side effect, and its failure surfaces as a notification, not as a rolled-back action.

The copy says exactly that, at every funny level (`err.historyWrite` in `app/cx-i18n.js`):

> The version history could not be written: {message}. Your change was still applied — only the
> snapshot is missing.

Inside `history.js` the same principle holds at a smaller scale: `git()` never throws, returning
`{ ok, stdout, stderr }` instead; `log()` on a repository with no commits returns
`{ commits: [], repo }` because an empty history is an empty history, not an error; and the
`config.toml` copy is wrapped in its own `try/catch`.

The only place that does throw is a failed `git commit` on staged changes, and a failed
`git show` of a missing snapshot — both of which name the real git stderr.

## Pruning

```js
command("codex_history_prune", async (a) => history.prune(a.keep || 100));
```

Retention is **explicit user action, never automatic**. Nothing in this repository runs on a timer,
and no launch path calls `prune`. The only trigger is *Prune old revisions* in Studio → Local
version history, which passes `settings.historyKeep` (default **200**; the IPC handler's own
fallback is 100 if no value is sent).

Mechanically: count with `rev-list --count HEAD`; return `{ pruned: 0, kept: total }` unchanged if
the total is already at or below `keep`; otherwise graft `HEAD~<keep>` into a new root with
`git replace --graft`, rewrite with `git filter-branch --force -- HEAD`, and drop the replacement
ref.

Pruning is the one operation here that is **not undoable** — it discards commit objects. The
Cantonese copy for `history.pruned` at level 5 says so out loud: 「呢單係 undo 唔到㗎」.

## The IPC surface

| Command | Handler | Notes |
| --- | --- | --- |
| `codex_history_commit` | `history.commit(message, kind, snapshot)` | Returns `{ committed: false, reason }` when nothing changed |
| `codex_history_log` | `history.log(limit)` | Default 200; `at` in epoch seconds |
| `codex_history_show` | `history.show(id)` | Registered and tested; no frontend caller yet |
| `codex_history_diff` | `history.diff(id)` | Same |
| `codex_history_prune` | `history.prune(keep)` | Handler default 100; the UI sends 200 |

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Repository location | `repo()` in `electron/lib/history.js` | `$CODEX_HOME/studio` |
| Retention | `settings.historyKeep` (Studio) | 200 |
| Prune handler fallback | `electron/commands.js` | 100 |
| Log limit | `codex_history_log` | 200 |
| In-app log cap | `vcs.persist()` | 300 entries in `localStorage["codexstudio.vcs.log"]` |
| Committer identity | `ensureRepo()` | `Codex Studio <studio@codex.local>`, repo-local |

## Failure modes

| Symptom | What the user sees | What still works |
| --- | --- | --- |
| `git` not on PATH | An error notification naming the failure | The change itself was applied; the in-app log still records it |
| `$CODEX_HOME` not writable | Same | Same |
| Nothing actually changed | No commit, no error | The panel stays a list of real events |
| `config.toml` unreadable | Nothing; the copy is skipped | The snapshot is committed |
| Repository with no commits yet | An empty history list | Not an error |
| `show(id)` on a revision with no snapshot | *"revision `<id>` has no snapshot: …"* | Nothing is mutated |
| Snapshot JSON corrupt | *"revision `<id>` snapshot does not parse: …"* | Nothing is mutated |
| Two Studio windows at once | Cannot happen — `requestSingleInstanceLock()` in `electron/main.js` focuses the running window | Prevents two processes fighting over one repository |

## Security considerations

- **Never inside a user's project.** The repository is derived from `$CODEX_HOME`, so it cannot
  land in a working directory and cannot be committed to a user's own history by accident.
- **Never pushed.** No remote is configured and no push exists in the code. The `.gitignore`
  carries the intent in a comment so a human who opens the directory reads it too.
- **No credentials are snapshotted.** The snapshot is Studio's own preferences and profile records.
  `auth.json` and the CLI's token store are outside it entirely, and the app never reads them.
- **The `config.toml` copy is as sensitive as `config.toml` itself.** It can contain MCP server
  URLs and command lines. It stays inside `$CODEX_HOME`, which is where the original already is —
  the history is never more sensitive than the store it mirrors.
- **The user's global git identity is untouched.** Both `user.name` and `user.email` are set with
  `git -C <repo> config`, which writes `.git/config` and nothing else.
- **Pruning is destructive and irreversible**, is user-triggered only, and says so.

## Verification

`node tools/test-backend.mjs` covers two of these directly:

- *history records real changes and never rewrites them* — commit, verify the log, commit an
  identical state and assert nothing new is recorded.
- *history.log is empty, not an error, before anything is committed*.

By hand:

1. **Location:** change a setting, then open `$CODEX_HOME/studio` and run `git log --oneline`. The
   commit must be there with its `[kind]` prefix.
2. **No stray repo:** confirm the active profile's working directory has no new `.git` and no new
   files.
3. **No remote:** `git -C $CODEX_HOME/studio remote -v` must print nothing.
4. **Undo an undo:** change the model, undo it from History, then undo the undo. Three commits, and
   the third label reads *"Undo of undo — …"*. The model must end where it started.
5. **Settings are covered:** toggle the dim sum surprise and the narrator; each must produce its own
   labelled revision.
6. **Unchanged state:** save with nothing changed; no new commit.
7. **Failure isolation:** rename `git.exe` out of the way, change a setting. The change must apply,
   and an error notification must name the failure.
8. **Prune:** with more revisions than the retention setting, prune and confirm the reported counts
   match `git rev-list --count HEAD` afterwards.
