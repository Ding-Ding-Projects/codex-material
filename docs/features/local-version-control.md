# Local version control

> A git-backed, append-only history of everything Studio owns, in `$CODEX_HOME/studio` — never a
> `.git` inside the user's own project, never pushed. Restoring writes a **new** revision, so an
> undo can be undone, and that undo undone in turn.

**Implementation:** `src-tauri/src/history.rs` (the repository) and the `vcs` object in
`app/codex-core.js` (the in-app log and snapshot); the History panel in `app/index.html`.

## Where it lives

```
$CODEX_HOME/studio/
  .git/                  a normal git repository, branch `main`
  .gitignore             "# Codex Studio history — local only, never pushed."
  studio-state.json      the snapshot, pretty-printed
  codex-config.toml      a copy of the live config.toml at that revision
```

The repository is created on first use (`ensure_repo`) with `git init --initial-branch main`, and
a committer identity is set **on that repository alone** (`Codex Studio <studio@codex.local>`) so
the user's global git config is never touched.

It is beside the app's own data, not inside a user project, because a `.git` appearing inside
someone's repository would corrupt their own version control. It has no remote and is never
pushed.

## What is snapshotted

Not just documents. **Every user-managed record Studio owns**, so any creation, edit or deletion
can be undone:

- Profiles and the active profile
- Per-profile Codex configuration overrides
- Feature-flag state
- Appearance overrides
- Cost model and pricing inputs
- The live `$CODEX_HOME/config.toml`, copied alongside the snapshot so a restore can show what the
  CLI itself was configured with at that revision

That last point is the reason settings travel with the records they configure: restoring an
account or a profile without the configuration it ran under is a subtly wrong state, and worse
than offering no undo at all.

## Append-only by construction

There are three operations and none of them rewind:

| Operation | What it writes |
| --- | --- |
| `commit(message, kind)` | A new revision. An unchanged state records nothing. |
| `revert(id)` | Restores the state *before* revision `id` and records that as **a new revision** with kind `revert`. Reverting a revert is labelled *"Undo of undo — …"*. |
| `checkout(id)` | Restores the snapshot at `id` and records that as **a new revision** with kind `restore`. |

History is therefore a list of real events that only ever grows. A destructive "restore" that
discarded the branch it replaced would be the one failure mode that makes a history panel unsafe
to use, because the user could not experiment without risking the state they started from.

`kind` is stored in the commit subject as `[<kind>] <message>` and split back out by
`codex_history_log`. Kinds in use: `init`, `change`, `profile`, `config`, `revert`, `restore`.

## Messages name what changed

*"Deleted the GitHub account"*, not *"Updated"*. Call sites pass a specific message:
`"Rename profile Personal → Work"`, `"Install plugin secrets-guard"`,
`"Write ~/.codex/config.toml"`, `"Spawn WSL for payments regression"`.

An unchanged state records nothing at all: `commit` stages, runs `git diff --cached --quiet` and
returns `{ committed: false, reason: "nothing changed" }` when there is no difference. The panel
stays a list of events, not a list of saves.

## The two layers

| Layer | Where | Holds |
| --- | --- | --- |
| In-app log | `CX.vcs` in `app/codex-core.js`, persisted to `localStorage["codexstudio.vcs.log"]` (300 entries) | The snapshots the History panel browses and restores from, instantly |
| Repository | `$CODEX_HOME/studio` via `codex_history_*` | The durable, diffable record — survives clearing browser storage |

`CX.vcs.commit` and `CX.vcs.revert` write the local log first and then call
`codex_history_commit`. **A history write must never fail the operation the user actually asked
for**: the backend call is fire-and-forget and a rejection is reported through
`notifyBackendFailure`, not propagated into the profile edit that triggered it.

> Argument-shape caution: `codex_history_commit`'s Rust parameter is `args: CommitArgs`, so the
> payload must be nested — `{ args: { message, kind, snapshot } }`. See
> [../architecture/tauri-bridge.md](../architecture/tauri-bridge.md#argument-shape--read-this-before-adding-a-call-site).

## Retention

`codex_history_prune({ keep })` (default 100) drops revisions older than `keep`, oldest first, by
grafting a new root and running `git filter-branch`. It is **explicit user action, never
automatic** — nothing prunes on a timer or at startup. `total <= keep` is a no-op returning
`{ pruned: 0, kept: total }`.

The in-app log caps itself at 300 entries on persist.

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Repository location | `history::repo()` | `$CODEX_HOME/studio` — follows `CODEX_HOME` |
| Log page size | `codex_history_log({ limit })` | 200 |
| Prune retention | `codex_history_prune({ keep })` | 100 |
| In-app log cap | `vcs.persist()` | 300 |
| `settings.historyKeep` | `CX.settings` | 200 — present in the settings object; **not yet wired to `codex_history_prune`** |

## Failure modes

| Symptom | Cause / behaviour |
| --- | --- |
| `commit` returns `{ committed: false, reason: "nothing changed" }` | Correct: the state is identical to the last revision |
| Every history command rejects with `git …: …` | `git` is not on `PATH`. Studio's history needs the real git binary; nothing else in the app does |
| `revision <id> has no snapshot` | The revision predates `studio-state.json`, or the id is wrong |
| `revision <id> snapshot does not parse` | The stored JSON is corrupt — the raw file is still recoverable with `git show <id>:studio-state.json` |
| `log` returns `{ commits: [] }` | A repository with no commits yet is an empty history, not an error |
| History panel populated, repository empty | The backend call failed or was mis-shaped; check for an error notification |
| Prune appears to do nothing | Fewer revisions than `keep`, or `filter-branch` was refused. `filter-branch` is best-effort here and its failure is not fatal |

## Security considerations

- **Local only.** The repository has no remote, and the shipped `.gitignore` says so in its first
  line. Nothing in Studio pushes it, and nothing should without an explicit user opt-in.
- **The snapshot inherits the sensitivity of what it mirrors.** It contains Codex configuration
  and a copy of `config.toml`. If that file holds a secret, so does the history — which is one
  more reason secrets belong in the credential store rather than in config. Snapshots preserve
  whatever encryption the live data uses: ciphertext stays ciphertext, so the history is never
  *more* sensitive than the store it mirrors.
- **If authenticated encryption is ever added, bind the AAD to a stable identifier**, not to an
  autoincrement row id. A restored row receives a fresh id, the AAD stops matching, and the data
  becomes permanently undecryptable while failing in a way that looks exactly like corruption.
- **The repository is never created inside a user project.** `repo()` derives strictly from
  `$CODEX_HOME`.
- **Config writes are independently recoverable.** `config.rs` copies `config.toml` to
  `config.toml.studio-<epoch>.bak` before every write, so a bad edit survives even if the history
  is lost.
- **`prune` rewrites history and is irreversible.** It is user-initiated, and it is the only
  operation in this feature that destroys anything.

## Verification

1. Change a profile name. The History panel shows a new revision whose message names the old and
   new names, and `git -C $CODEX_HOME/studio log --oneline` shows `[profile] Rename profile …`.
2. Make the same change again with no difference: no new revision is recorded.
3. Undo it from the panel. The state reverts **and** a new `[revert]` revision appears — the
   original revision is still listed.
4. Undo the undo. A revision labelled *"Undo of undo — …"* appears and the state returns.
5. Restore an older revision from its context menu: state changes and a `[restore]` revision is
   appended; nothing is removed from the list.
6. `codex_history_diff` on any revision returns a unified diff naming the changed keys.
7. `codex_history_show` on a revision returns the snapshot; feeding it back through a restore
   reproduces that state.
8. Confirm `$CODEX_HOME/studio/.git` exists and that **no** `.git` was created in any project
   directory Studio opened.
9. `git -C $CODEX_HOME/studio remote -v` is empty.
10. Delete `localStorage["codexstudio.vcs.log"]` and restart: the repository still holds the full
    record, provable with `git log`.
