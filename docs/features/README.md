# Features

One page per feature. Each documents behaviour, configuration, failure modes, security
considerations and how to verify it.

| Feature | Owner file(s) | One line |
| --- | --- | --- |
| [Regex builder](regex-builder.md) | `app/codex-core.js` (`evaluate`, `CONSTRUCTS`, `FLAGS`, `LIMITS`), `app/index.html` | Every search bar has a full, anchored, bounded regex builder beside it |
| [Tabs](tabs.md) | `app/cx-tabs.js` (`window.CX_TABS`) | Browser-style strip: pin, group, overflow, four searches, bulk close by text |
| [Appearance](appearance.md) | `app/index.html` (editor), `app/codex-core.js` (`color`), `app/cx-appearance.js` | Per-element editor, Word-depth typography, infinite colour picker and translator |
| [Notifications](notifications.md) | `app/cx-notify.js` (`window.CX_NOTIFY`) | Non-blocking toasts, a reviewable centre, and the narrow case where a modal is correct |
| [Local version control](local-version-control.md) | `src-tauri/src/history.rs`, `app/codex-core.js` (`vcs`) | Append-only git history in `$CODEX_HOME/studio`; restoring is a new revision |
| [External editor](external-editor.md) | `src-tauri/src/editors.rs` | Detect what is installed, open a file or folder, degrade honestly when nothing is |
| [WSL runtimes](wsl-runtimes.md) | `src-tauri/src/wsl.rs` | One long-lived Linux shell per tab, so `cd` and env survive between runs |

## Rules that apply to every feature here

- **Every search bar gets the full anchored regex builder.** Not a reduced toggle, not a link
  elsewhere. Plain text stays the default; regex is an explicit opt-in.
- **Every rendered element is an appearance target.** Give it `data-appear="<name>"` and end its
  context menu with `this.appearItem(e)`.
- **Informational messages are notifications, never modals.** A modal is for a decision that must
  be made before anything else can continue.
- **Anything the user could regret is committed to History**, with a message naming what changed
  rather than that something did.
- **All copy goes through `CX.i18n.t()`**, so all three language modes and both funny sliders
  apply — including to errors and destructive confirmations. See
  [../experience/language-modes.md](../experience/language-modes.md).
- **Keyboard and screen-reader operation is a completion blocker**, not polish. See
  [../experience/accessibility.md](../experience/accessibility.md).
