# Notifications

> Anything that only *informs* is a non-blocking toast. A modal dialog is reserved for a decision
> that genuinely blocks the next step. Everything ever shown stays reviewable in the centre.

**Implementation:** `app/cx-notify.js` (`window.CX_NOTIFY`, instantiated onto `CX.notify` by
`app/codex-core.js`); the toast stack, the centre and their bindings in `app/index.html`
(`notifyVals`).

## The rule

| Situation | Surface |
| --- | --- |
| "Saved to config.toml", "12 tabs closed", "MCP server enabled" | Toast, auto-dismissing |
| "Reading the plugin catalog…" | Progress toast, replaced in place as it advances |
| "`codex mcp add` failed: …" | Error toast, **persists until dismissed** |
| "The marketplace list could not be read" | Warning toast, persists |
| "Delete this profile?" | **Modal** — the answer changes what happens next |
| "You have unsaved changes in 3 tabs. Close them?" | **Modal** |
| "Grant this hook trust?" | **Modal** — a consent step |

A failure that vanishes after four seconds is a failure the user never read. A confirmation that
blocks the app to say "done" is a modal that should have been a toast. The split is not cosmetic:
it decides whether the user can keep working.

## Behaviour

### Kinds and timeouts

`DEFAULT_TIMEOUT` in `app/cx-notify.js`:

| Kind | Icon | Timeout | Rationale |
| --- | --- | --- | --- |
| `info` | ⓘ | 5000 ms | Fades |
| `success` | ✓ | 4000 ms | Fades |
| `progress` | ◴ | **0 — never auto-dismisses** | It ends when the work ends |
| `warning` | ⚠ | **0 — until dismissed** | The user must be able to read it |
| `error` | ✕ | **0 — until dismissed** | Same |

A per-notification `timeout` overrides the default; `0` always means "persist".

### Stacking and placement

At most `MAX_VISIBLE` (4) toasts are on screen at once, corner-anchored, stacked without
overlapping. Older live items stay in the queue and surface as newer ones dismiss. Nothing is
lost: every raised notification is in the centre regardless of whether its toast was seen.

### Category replacement

`category` is a dedupe key. Raising a notification with a category clears any live notification
sharing it, so a progress line that updates three times becomes one toast that changes, not three
toasts that pile up. `update(id, patch)` mutates an in-flight item directly — the same mechanism,
by id rather than by category. Promoting a `progress` item to a kind with a timeout restarts the
timer.

### Actions

`actions: [{ label, run }]` renders buttons on the toast — retry, undo, open, view details.
Running an action dismisses the toast. The bulk-close success notification is the reference
example: it carries an **Undo** bound to a snapshot taken before the close, so a mistaken bulk
close is one click from being reversed.

### The notification centre

- `log()` returns the full reviewable history, newest first, capped at `MAX_HISTORY` (200) and
  persisted to `localStorage["codexstudio.notify.history"]`.
- `unread()` counts entries newer than `readAt`; opening the centre calls `markRead()`, which
  persists the new watermark and clears the badge.
- `clearHistory()` empties the log but **leaves the live stack alone** — clearing history must not
  make an error the user is still reading disappear.
- Live toasts are deliberately **not restored on launch**: a notification from a previous session
  is history, not news.
- Each row in the centre has a context menu with **Copy**, so an error message can be pasted into
  an issue.

### Backend failures

`CX.notifyBackendFailure(what, err)` (in `app/codex-core.js`) is the single funnel for a rejected
`invoke`. It raises an error notification whose title is localised (`err.<what>`) and whose body
and `detail` carry **what the backend literally said**. `CX_NOTIFY.fromError(what, err, actions)`
does the same for arbitrary rejections.

This is also how partial startup failures surface: `codex_state` returns an `errors` object naming
each section that failed, and `CX.live.hydrate` raises one warning per section. A silently empty
list would read as "you have none", which is a different fact.

## Accessibility

- Toast `role` is chosen by severity in `notifyVals`: `alert` for `error` and `warning`
  (assertive — it interrupts), `status` for everything else (polite — a success toast never cuts
  across what a screen reader is reading).
- Every toast has a dismiss control with its own label, sized as a real hit target, not a 12-pixel
  glyph.
- Errors and warnings never auto-dismiss, so a screen-reader user is not racing a timer.
- The centre is keyboard reachable and closes on <kbd>Esc</kbd> along with the other overlays.
- Colour is never the only signal: each kind carries an icon and a title as well as an accent
  colour.

See [../experience/accessibility.md](../experience/accessibility.md) for the app-wide rules and
current gaps.

## Language and funny level

Titles and bodies go through `CX.i18n.t()`, so all three language modes and both funny sliders
apply — **including to errors**. What the level changes is voice; `detail` always carries the
backend's literal message, unstyled, so no amount of playfulness can obscure what actually failed.
See [../experience/language-modes.md](../experience/language-modes.md).

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| `MAX_VISIBLE` | `app/cx-notify.js` | 4 |
| `MAX_HISTORY` | `app/cx-notify.js` | 200 |
| `DEFAULT_TIMEOUT` | `app/cx-notify.js` | info 5000, success 4000, progress/warning/error 0 |
| History storage | `localStorage` | `codexstudio.notify.history`, `codexstudio.notify.readAt` |

None are user-facing settings today. A user-visible "quiet hours" or "reduce notifications"
control is **not implemented**.

## API

```js
CX.notify.info(title, body, extra);
CX.notify.success(title, body, extra);
CX.notify.warn(title, body, extra);
CX.notify.error(title, body, extra);
const id = CX.notify.progress("Installing plugin", "resolving…", { category: "plugin-install" });
CX.notify.update(id, { body: "downloading…" });
CX.notify.update(id, { kind: "success", title: "Installed", body: "rust-analyzer-bridge 0.4.1" });

CX.notify.push({ kind, title, body, detail, category, actions, timeout });
CX.notify.dismiss(id); CX.notify.dismissAll();
CX.notify.log(); CX.notify.unread(); CX.notify.markRead(); CX.notify.clearHistory();
const off = CX.notify.subscribe(() => rerender());
```

`subscribe` returns an unsubscribe function; `app/index.html` calls it in `componentDidMount` and
releases it in `componentWillUnmount`. A throwing subscriber is caught so one broken listener
cannot stop the others from repainting.

## Failure modes

| Symptom | Cause / behaviour |
| --- | --- |
| An error toast disappears on its own | Someone passed an explicit `timeout` — errors default to persisting |
| Three identical toasts stack up | No `category` was set on a repeating message |
| History empty after restart | `localStorage` unavailable; `CX.store` swallows the failure by design |
| `CX.notify` is `null` | `cx-notify.js` did not load. `notifyVals()` degrades to an empty stack, and `notifyBackendFailure` falls back to `console.error` — failures are logged, never silently dropped |
| A notification appears with no body | The caller passed only a title; acceptable for short confirmations, wrong for errors |
| The unread badge never clears | `markRead()` runs when the centre is opened; opening it another way must call it too |
| More than four toasts expected but not seen | `MAX_VISIBLE` is 4; the rest are queued and all are in the centre |

## Security considerations

- **Notification bodies can carry raw CLI output**, which may include file paths, project names or
  hostnames. That is the point — the user needs the real message — but it means the history is
  as sensitive as the machine's own console. It is stored in `localStorage`, never transmitted.
- **Never route a credential, token or API key into a notification.** `codex_login` refuses
  API-key login precisely so a key never reaches the GUI process; do not undo that by echoing a
  secret into a toast or the centre.
- **Text is rendered through template interpolation**, so CLI output cannot inject markup. Never
  render a notification body with `dangerouslySetInnerHTML`.
- **Actions run arbitrary callbacks.** Only construct them at the call site that raised the
  notification; never build one from stored or backend-supplied data.
- **A destructive action is never confirmed by a toast.** Confirmation is a modal; the toast comes
  after, reporting what happened and offering undo.

## Verification

1. Raise one of each kind: `info` and `success` fade, `warning`, `error` and `progress` persist
   until dismissed.
2. Raise five at once: four are visible, none overlap, the fifth appears as one dismisses, and all
   five are in the centre.
3. Raise three notifications sharing a `category`: exactly one toast is on screen at a time.
4. Run a bulk tab close, then use the toast's **Undo** action — the strip returns to its previous
   state and the toast dismisses.
5. Force a backend failure (rename `codex.exe` out of `PATH`, then trigger a command): an error
   toast appears carrying the backend's literal message, and it does not auto-dismiss.
6. Open the centre: the unread badge clears, rows show relative times, **Copy** puts the title and
   body on the clipboard, **Clear** empties the log while a live error toast stays on screen.
7. Restart: history persists, no toast is restored.
8. With a screen reader running, confirm an error is announced assertively and a success politely,
   and that neither steals focus.
9. Switch to `yue` and bilingual at funny levels 1 and 5: the error still names what failed and
   what to do, at every setting.
10. Confirm no informational message in the app opens a modal, and that every modal that remains
    is a genuine decision point.
