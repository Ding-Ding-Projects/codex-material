# Tabs

> Content is **navigated, not scrolled**: every surface is a discrete tab in a persistent strip,
> with pinning, groups, an overflow surface, four independent searches and text-based bulk close.

**Implementation:** the model in `app/cx-tabs.js` (`window.CX_TABS`, wired onto `CX.tabs` by
`app/codex-core.js`); the strip, menus, searches and the bulk-close preview in `app/index.html`
(`tabVals`, `tabChipFor`, `groupMenu`, `tabSearchMenu`, `openBulk`, `dimSumVals`).

The split matters: `cx-tabs.js` owns **order, pinning, groups, the four searches and the
bulk-close predicate**. Presentation lives in the template, so the same rules hold however a strip
is drawn.

## Two invariants

Breaking either is a silent data-loss bug rather than a visual one, so they are stated at the top
of `cx-tabs.js` and repeated here.

1. **Bulk close matches the tab's visible label and nothing else.** It never inspects page
   contents or hidden state. A user closing "everything with `payments` in the name" must be able
   to predict the result from the strip.
2. **"Close tabs containing X" and "close tabs NOT containing X" negate the exact same
   predicate.** `predicate(spec)` is built once and `previewBulkClose` flips its result with
   `invert`. Built separately, casing, Unicode handling or a regex flag could drift between them
   and the two actions would stop being inverses.

## The tab model

A tab:

```jsonc
{ "id": "t-ab12cd3", "title": "payments regression", "kind": "chat", "payload": { … },
  "pinned": false, "groupId": null, "order": 4, "dirty": false, "workspace": "default" }
```

A group:

```jsonc
{ "id": "g-9f8e7d6", "name": "Release", "color": "#D0BCFF", "collapsed": false,
  "pinned": false, "icon": "", "order": 2, "appearance": null }
```

### API — `CX.tabs`

| Reading | Returns |
| --- | --- |
| `all()` | Every tab in strip order (pinned first, then by `order`) |
| `loose()` | Ungrouped tabs, in strip order |
| `inGroup(groupId)` / `groups()` / `pinned()` | Filtered views, same ordering |
| `active()` / `get(id)` / `getGroup(id)` / `count()` | Lookups |
| `overflow(capacity)` | The tabs that do not fit. **Pinned tabs are never returned**: `room = max(pinnedCount, capacity)` |

| Mutating | Effect |
| --- | --- |
| `open(tab)` | Appends and activates; returns the created tab |
| `activate(id)` / `rename(id, title)` / `setDirty(id, dirty)` / `close(id)` | Self-explanatory; closing the active tab activates the first remaining one |
| `pin(id, on?)` | Toggles when `on` is omitted |
| `move(id, index)` | Reorders **within the tab's own region** — a pinned tab cannot be dragged among the ordinary ones without unpinning first |
| `createGroup(name, color)` / `renameGroup` / `setGroup(id, patch)` / `moveGroup(id, index)` / `toggleCollapsed(id)` | Group management |
| `assign(tabId, groupId)` | Moves a tab into a group, or out with `null` |
| `removeGroup(id)` | **Never closes its tabs** — they return to the loose region |
| `snapshot()` / `restore(snap)` | Deep copies, used for undo after a bulk close |

Every mutation persists (`store.set("codexstudio.tabs", …)`) and notifies subscribers, so order,
pinned state, groups, group order, collapsed state and membership all survive a restart.

## Pinning

Pinning is first-class, not a decoration.

- Reachable from the tab context menu, the keyboard path and the searchable tab list.
- Pinned tabs occupy a **stable region ahead of the ordinary ones** (`sorted()` sorts by `pinned`
  first, then `order`) and keep their own relative order within it.
- Pinned tabs **stay visible when ordinary tabs overflow**.
- Pinned tabs are **excluded by default** from close-others, close-to-the-right and every
  text-based bulk close. Including them is an explicit choice, and the preview names each
  protected tab before anything closes.
- A pinned chip is narrower (`maxWidth: 150px` versus `210px`) but keeps its full accessible name
  in the `title` and its label text — a compact chip must never become an unlabelled icon.

## Groups

- Create, name, rename, colour, reorder, collapse/expand and remove. Removing a group returns its
  tabs to the loose region.
- Group headers render with the group's colour
  (`color-mix(in srgb, <color> 14%, transparent)` fill and a solid border), a caret reflecting
  collapsed state, and a live tab count.
- Right-click a group header for its management menu, which includes **Edit group appearance…**
  (see [appearance.md](appearance.md)).
- The group's `appearance` field is reserved on the model for per-group decoration, persisted with
  the rest of the group.

## Overflow

`tabCapacity()` in `app/index.html` estimates how many ordinary tabs fit:
`max(2, floor((window.innerWidth - 520) / 150))`. Anything beyond that is handed to
`CX.tabs.overflow(capacity)` and reached through the `⋯` button, which shows the hidden count and
turns primary-coloured while anything is hidden.

Tabs are **never silently clipped**: what does not fit is listed, in order, in the overflow
surface, with pinned markers intact. Picking one activates it.

## The four searches

All four are reachable from the tab-strip search affordance (`tabSearchMenu`), and each opens a
searchable dropdown that carries its own anchored regex builder — the `dd` anchor described in
[regex-builder.md](regex-builder.md). Plain text is the default in every one.

| # | Search | Model call | Result rows identify |
| --- | --- | --- | --- |
| 1 | **This tab strip** | `searchStrip(spec)` | Pinned marker, title, group name when grouped |
| 2 | **Inside one group** | `searchGroup(groupId, spec)` — preceded by a group picker | Pinned marker, title |
| 3 | **Tab groups by name** | `searchGroups(spec)` | Group name, tab count, collapsed state |
| 4 | **Every tab, everywhere** | `searchAll(spec)` plus the other profiles' sessions | Workspace, strip, group, pinned state, visible label |

Search 3 matches a group's visible name and its icon. Search 4 is the master search: it spans
every workspace the app owns — here, every profile — and labels each hit with the workspace it
came from, so a result is never ambiguous.

Selecting a result inside a **collapsed** group expands it for that navigation only; the user's
collapsed preference is not destroyed. Results cap at `LIMITS.matches` (5000).

## Bulk close by text

Two actions, one predicate: **Close tabs containing text…** and **Close tabs not containing
text…**.

The flow is deliberately three steps.

1. **Compose.** A text field (plain text by default) with a `.*` button opening the anchored regex
   builder, a match-inversion toggle, and a pinned-inclusion toggle that turns error-coloured when
   the user opts to include pinned tabs.
2. **Preview.** `previewBulkClose(spec)` returns, without closing anything:
   ```jsonc
   { "ok": true, "error": null, "mode": "text"|"regex", "invert": false, "scope": { "kind": "strip" },
     "matched": [ … ], "protectedPinned": [ … ], "dirty": [ … ], "total": 12 }
   ```
   The dialog lists every tab that will close (marked `✕`, with an *unsaved* note where
   `dirty`) and every pinned tab that will not (marked `📌`, noted as protected), and states the
   match mode and the affected count.
3. **Apply.** `bulkClose(preview)` closes only what the preview showed, and reports what actually
   closed and what did not — it never pretends a protected tab went away. A success notification
   carries an **Undo** action backed by the `snapshot()` taken immediately before the close.

**Nothing runs on an empty query or an invalid pattern.** `predicate()` returns
`ok: false` with *"Enter text to match — an empty query closes nothing."* or the `RegExp`
constructor's own message, the apply button goes inert, and the field border turns error-coloured.

`scope` selects the pool: `{kind:"strip"}` (all tabs), `{kind:"group", id}`,
`{kind:"groups", ids[]}` or `{kind:"all"}`. The preview states its scope, so a bulk close never
silently crosses a group boundary.

`closeOthers(keepId, includePinned)` and `closeToRight(fromId, includePinned)` route through the
same `bulkClose`, with the same pinned protection.

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Persistence key | `create(store, { key })` | `"tabs"` → `localStorage["codexstudio.tabs"]` |
| Pattern length / match count / evaluation budget | `CX_TABS.LIMITS` | 2000 chars / 5000 matches / 250 ms |
| Strip capacity before overflow | `tabCapacity()` in `app/index.html` | `max(2, floor((innerWidth − 520) / 150))` |
| Seed tabs on first run | `CX.tabs.load(seed)` in `componentDidMount` | The active profile's sessions |

Saved state wins over the seed: `load()` only uses the seed when nothing is persisted.

## Failure modes

| Symptom | Cause / behaviour |
| --- | --- |
| Bulk close button inert | Empty query or an invalid pattern; the reason is shown inline |
| Preview shows fewer tabs than expected | Pinned tabs are protected by default — they are listed separately as protected, not hidden |
| A group vanished but its tabs remain | `removeGroup` never closes tabs; they return to the loose region |
| Tabs missing from the strip | They overflowed; the `⋯` button shows the count and lists them |
| A search finds nothing | Honest empty result — the predicate's `mode` is reported so plain-text-versus-regex confusion is visible |
| Tab layout lost after restart | `store` was unavailable (private-mode `localStorage`), so `persist()` silently no-ops |
| `CX.tabs` is `null` | `cx-tabs.js` did not load; `tabVals()` degrades to an empty strip rather than throwing |
| Reordering a pinned tab does nothing | `move()` reorders within a region; unpin first |

## Security considerations

- **Labels only.** No search and no bulk close reads page contents, transcript bodies, file
  contents or any hidden field. This is a privacy property as much as a predictability one.
- **Regex is bounded** by `LIMITS` and evaluated locally, with `g` and `y` stripped so a stateful
  `lastIndex` cannot make the same pattern match a row on one pass and miss it on the next. See
  [regex-builder.md](regex-builder.md) for the residual regex-DoS caveat.
- **Destructive actions are previewed, never inferred.** The preview is the confirmation, the
  pinned protection is on by default, and unsaved (`dirty`) tabs are called out by name.
- **Undo is real.** The pre-close snapshot is a deep copy, so the Undo action restores the exact
  strip, groups and active tab.
- **Persisted state is local.** Tab titles can carry session names, which can carry project names;
  they live in `localStorage` and are never transmitted.

## Verification

1. **Persistence:** open several tabs, pin two, group three, collapse the group, reorder, restart
   the app. Order, pinned region, group membership, group order and collapsed state all return.
2. **Overflow:** narrow the window until the `⋯` count appears. Pinned tabs must remain visible;
   the overflow list must contain exactly the tabs missing from the strip.
3. **Search 1–4:** run each against a known layout and confirm the result rows identify workspace,
   group, pinned state and label; confirm each has its own `.*` builder and that applying a
   pattern in one does not change another's query.
4. **Collapsed reveal:** search for a tab inside a collapsed group, pick it, then check the group
   is collapsed again afterwards — the preference must survive.
5. **Bulk close, plain text:** type a substring, confirm the preview count and list, apply,
   confirm the notification names what closed, then Undo and confirm everything returns.
6. **Bulk close, inverted:** the same query with inversion on must close exactly the complement.
   Run both against the same layout and confirm the two sets partition the strip.
7. **Pinned protection:** a pinned tab matching the query appears as protected and survives; turn
   the inclusion toggle on and confirm the preview moves it into the closing list before anything
   happens.
8. **Empty and invalid:** an empty query and `(` must both leave the apply button inert with a
   message.
9. **Keyboard and screen reader:** reach the strip by keyboard, move between tabs, activate one,
   open a context menu and close it with <kbd>Esc</kbd>. See
   [../experience/accessibility.md](../experience/accessibility.md).
10. **Language modes:** switch to `yue` and to bilingual at funny level 1 and level 5, and confirm
    the bulk-close dialog still names the count, the mode and the protected tabs at every setting.
