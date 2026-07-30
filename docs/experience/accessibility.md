# Accessibility

> Accessibility defects are **completion blockers**, not polish. A feature that cannot be reached
> by keyboard, or whose state a screen reader cannot report, is unfinished.

This page states the rules, records the current state of the tree honestly, and gives the audit
you can re-run to check it yourself.

## The rules

### Keyboard reachability

- Every action reachable by mouse is reachable by keyboard. Right-click menus have a keyboard
  equivalent; the **Edit appearance…** entry in particular must not be mouse-only.
- <kbd>Tab</kbd> order follows visual order. Nothing is reachable only by pointer, and nothing
  focusable is invisible.
- <kbd>Esc</kbd> closes every overlay — context menu, dropdown, regex builder, appearance editor,
  command palette, notification centre, bulk-close dialog. `app/index.html` binds this globally in
  `componentDidMount`.
- <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> opens the command palette, which is the keyboard
  route to actions that otherwise live in menus.
- An overlay returns focus to the element that opened it when it closes.
- Non-native interactive elements (a `div` acting as a button) need `role`, `tabindex="0"` and
  <kbd>Enter</kbd>/<kbd>Space</kbd> handling. Prefer a real `<button>`.

### Visible focus

- Every focusable element shows a focus indicator that meets contrast against its background.
- `outline: none` is only acceptable when a replacement indicator is supplied — a ring, a border
  change, a background change. Removing the outline and supplying nothing is the single most
  common way to make an app keyboard-unusable while it still "works".

### Roles, names and states

- Tab strips: `role="tablist"` / `role="tab"` / `role="tabpanel"`, with roving focus,
  `aria-selected`, and `aria-controls` pointing at the live panel.
- Dialogs: `role="dialog"` with `aria-modal` where genuinely modal, and a label.
- Toggles: `role="switch"` with `aria-checked`, or a real checkbox.
- Sliders: a real `<input type="range">` with an `aria-label` and, where the numeric value is not
  self-explanatory, `aria-valuetext` (the funny sliders say *"level 4 — clearly playful"*, not
  just *"4"*).
- Live regions: `aria-live="polite"` for status, `role="alert"` for errors and warnings. This is
  already how notification severity maps — see [../features/notifications.md](../features/notifications.md).
- Every icon-only control has an `aria-label` or a `title`. A pinned tab compressed to an icon
  keeps its full accessible name.
- Group headers report expanded state with `aria-expanded`.

### Contrast

- Text meets WCAG AA: 4.5:1 for body text, 3:1 for large text and meaningful non-text elements.
- The Material 3 token pairs in `app/index.html` are designed to satisfy this in both themes; the
  risk is user customisation, which is why the appearance editor shows a **live contrast readout
  with a pass/fail verdict** against the current surface. See
  [../features/appearance.md](../features/appearance.md).
- Colour is never the only signal. Every notification kind has an icon and a title as well as an
  accent; error fields change border *and* show text.

### Reduced motion

- Honour `prefers-reduced-motion: reduce`: the message-entry animation (`@keyframes cxin`), the
  thinking-dot animation (`@keyframes cxdot`) and any future transition must reduce to an instant
  state change.
- `CX.settings.reducedMotion` exists as an explicit user override for people whose OS setting does
  not match their preference in this app.

### Screen readers

- Structure is navigable: headings for panel titles, lists for lists, labelled regions.
- Dynamic content announces once, not on every render. A live region that re-announces the whole
  list each keystroke is worse than one that says nothing.
- The spoken narrator must yield to an active screen reader — two voices at once is unusable. It
  is off by default. See [language-modes.md](language-modes.md).

### Targets and layout

- Adequate hit targets, especially for dismiss buttons and tab close affordances. A 12-pixel glyph
  is not a target.
- No clipped, truncated, overlapping or off-screen text at any supported size: 960 × 640 minimum
  window, 100 / 125 / 150 / 200 % display scale, all three language modes, funny level 5 (the
  longest strings), bilingual mode (longer still).
- Controls sized to their spec and consistent with siblings.

## Current state — audit at the time of writing

Recorded honestly, so nobody reads this page as a claim of compliance.

| Area | State |
| --- | --- |
| <kbd>Esc</kbd> closes overlays | **Implemented** — a single global handler clears menu, regex builder, appearance editor, dropdown, palette |
| Command palette on <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> | **Implemented** |
| Notification live regions | **Implemented** — `role="alert"` for error/warning, `role="status"` otherwise |
| Tab semantics | **Partial** — `role="tablist"`, `role="tab"` and `aria-selected` are present on the strip; `role="tabpanel"` and `aria-controls` linkage are not |
| `aria-label` on icon-only controls | **Partial** — present on the search inputs and several buttons; not yet on every window control and chip |
| Sliders | **Partial** — `aria-valuetext` is used on at least one slider; not consistently across all of them |
| Visible focus | **Missing.** Multiple inputs set `outline: none` with no replacement indicator. This is the most serious open defect on this page |
| Roving focus in the tab strip | **Not implemented** — every chip is individually tabbable |
| Reduced motion | **Not implemented** — there is no `prefers-reduced-motion` media query in `app/index.html`, and `CX.settings.reducedMotion` is not yet consumed |
| Keyboard route to **Edit appearance…** | **Not implemented** — the entry is reached through the right-click menu |
| Contrast readout in the appearance editor | **Implemented** |
| Colour never the only signal | **Implemented** in notifications and search-error states |

Re-run the audit before trusting the table:

```bash
grep -o 'aria-[a-z]*=' app/index.html | sort | uniq -c
grep -o 'role="[a-z]*"' app/index.html | sort | uniq -c
grep -c 'outline:none' app/index.html
grep -c 'prefers-reduced-motion' app/index.html
```

## Failure modes

| Symptom | Cause |
| --- | --- |
| <kbd>Tab</kbd> moves focus but nothing appears to change | `outline: none` with no replacement |
| A screen reader reads a button as "button" with no name | Icon-only control with no `aria-label` or `title` |
| A toast is missed entirely | It was raised as `status` (polite) while the screen reader was mid-sentence, and it auto-dismissed. Errors and warnings persist and are assertive precisely to avoid this |
| The tab strip cannot be traversed with arrow keys | Roving focus is not implemented; each chip is a separate tab stop |
| Motion persists with reduced motion enabled | No media query yet |
| A localised label overflows its control | Bilingual mode at funny level 5 — the longest strings the app can produce |
| Focus lands somewhere unexpected after closing an overlay | Focus return is not implemented for that overlay |

## Security considerations

Accessibility and security intersect in one specific way, and it matters:

- **A user who cannot perceive a warning cannot consent to what it warns about.** A destructive
  confirmation that is unreachable by keyboard, unreadable at the user's contrast needs, or
  unannounced to a screen reader is a consent failure, not a usability nit. Destructive dialogs
  are the highest-priority surface on this page.
- **The appearance system can create accessibility failures**, because a user can set a colour
  that makes error text invisible. The live contrast readout exists to make that visible at the
  moment of choice; do not remove it or hide it behind a disclosure.
- **The narrator speaks error text aloud**, which can disclose file paths and project names in a
  shared space. Off by default, and the setting says what it does.

## Verification

1. **Keyboard-only pass.** Unplug the mouse. Reach and operate: the nav rail, the tab strip, every
   search field and its regex builder, the composer, a context menu, the appearance editor, the
   notification centre, the bulk-close dialog. Anything unreachable is a defect.
2. **Focus visibility.** Tab through the entire app and confirm the focused element is always
   obvious in both light and dark themes.
3. **Focus return.** Open and close each overlay with <kbd>Esc</kbd>; focus returns to the opener.
4. **Screen reader pass.** With Narrator or NVDA: every control announces a name, a role and a
   state; a raised error is announced assertively; a success is announced politely and does not
   interrupt.
5. **Contrast.** Sample text and background pairs in both themes against WCAG AA. Then set a
   deliberately poor colour in the appearance editor and confirm the readout reports *fails AA*.
6. **Reduced motion.** Enable it at OS level and confirm animations stop. (Expected to fail today
   — see the audit table.)
7. **Scaling and clipping.** At 100 / 125 / 150 / 200 % display scale, at 960 × 640, in `en`, `yue`
   and `bi`, with both funny sliders at 5: no clipped, truncated or overlapping text, and no
   horizontal page scroll.
8. **Targets.** Every dismiss and close control is comfortably clickable, not a hairline glyph.
9. **No colour-only signalling.** Switch to greyscale and confirm every state is still
   distinguishable.
