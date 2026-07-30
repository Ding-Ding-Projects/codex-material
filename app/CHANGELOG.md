# Changelog

All notable changes to Codex Studio are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every entry is written from what is actually in this repository and its git history.
Nothing is invented to make a release look busier than it was, and a version with no
recorded changes says exactly that. Codex Studio has no earlier releases — its history
starts at 0.1.0.

## [0.1.0] - 2026-07-30

The first Windows build. Codex Studio is Windows-only: there is no macOS or Linux
target in the bundle configuration.

Codex Studio is a Material 3 desktop front end for the OpenAI Codex CLI. It composes
flags, runs the real `codex` binary, streams its output and reads the real
`CODEX_HOME`. Nothing about the agent, the sandbox, the config schema or the plugin
system is reimplemented.

### Added

- **Windows desktop shell on Electron 40** (`electron/`), packaged by electron-builder
  into an NSIS installer and an MSI. Both install per user, so setup never asks for
  elevation. Product name `Codex Studio`, application id `dev.codexstudio.app`,
  publisher `Ding Ding Projects`, licensed Apache-2.0.
- **The Codex CLI is bundled** (~410 MB unpacked), staged by `tools/fetch-codex.mjs`
  from OpenAI's own published npm artifact, so a machine that has never installed
  Codex works on first launch. Binary resolution is `CODEX_BIN`, then whatever `codex`
  is on PATH, then the bundled copy — the user's own install always wins, because it
  owns their login and their `~/.codex`. The app reports which one it is using.
- **52 IPC commands** across `electron/lib/`: `cli.js` (find and run the binary,
  stream both pipes concurrently), `config.js` (`config.toml` read/write with a backup
  before every write, dotted-path edits), `catalog.js` (MCP servers, plugins,
  marketplaces, skills, hooks, feature flags, saved sessions, auth, doctor), `wsl.js`
  (per-tab WSL runtimes), `history.js` (git-backed snapshots), `editors.js` (external
  editor detection). The preload exposes an explicit allow-list, not a generic invoke.
- **Chats that actually run Codex.** The composer runs `codex exec` in the active
  profile's working directory with that profile's model, approval policy and sandbox
  applied as `-c` overrides, and streams the agent's output into the transcript as it
  arrives rather than after it exits. A slash command is forwarded as the subcommand
  it names.
- **Real sessions and profiles.** The session list is read from the rollout files under
  `CODEX_HOME`; profiles come from `[profiles.*]` in the real `config.toml`. A machine
  with no saved sessions shows an empty list.
- **Ten-tab navigation**: Chats, Console, Extend, Config, Cost, Runtime, Health,
  History, Changelog and Studio. Extend is itself sectioned into MCP servers, plugin
  marketplace, installed plugins, registries, skills, hooks and feature flags.
- **Browser-style tab strip** (`app/cx-tabs.js`): pinning with its own stable region,
  groups that collapse and persist, an overflow surface, and four tab-discovery
  searches — this strip, inside one group, groups by name, and every tab across every
  workspace. Bulk close by text builds "containing" and "NOT containing" from a single
  predicate, so the two directions cannot drift apart; pinned tabs are excluded unless
  explicitly included, and every close shows a reviewable preview first.
- **Command catalog** in `app/codex-data.js`: the CLI's subcommands and flags, every
  `config.toml` setting with its enum values, the slash commands and the feature-flag
  keys.
- **Anchored regex builder** beside every search surface — the session list, the Extend
  filter, the Config filter, the changelog search, the Studio settings search, the
  slash-command catalog, the command palette and dropdown option filters. Each opens
  next to the field it belongs to, with flag toggles, a sample box, live match rows and
  copy.
- **Bounded regex evaluation**: patterns capped at 2000 characters, samples at 20 000,
  results at 500 matches, evaluation stopped after 300 ms, and zero-width matches
  advance `lastIndex` instead of looping forever.
- **Notification centre** (`app/cx-notify.js`): corner toasts that stack, errors and
  warnings that stay until dismissed, actions such as undo and retry, and a reviewable
  history so a dismissed message is not a lost one. Blocking dialogs are reserved for
  decisions — the bulk-close gate is the only one.
- **Three language modes** (English, playful Hong Kong Cantonese, bilingual) and two
  independent funny-level sliders from 1 to 5, one per language, over a 200-key table
  (`app/cx-i18n.js`). The level changes voice only: every `err.*` and `warn.*` string
  carries the same `{placeholder}` facts at level 1 and level 5, and the test suite
  asserts it.
- **Optional speech narrator**, off by default, speaking `en-US` or `zh-HK` through a
  serialised queue with a 6-second cooldown so utterances never overlap.
- **Local git-backed version history** in `$CODEX_HOME/studio` — never a `.git` inside
  the user's own project, never pushed. Profile, config, feature-flag, appearance and
  settings changes are committed with a label describing what changed; an undo is
  written as a new revision rather than popping the stack, so an undo can itself be
  undone. Unchanged state records nothing.
- **The colour picker is continuous.** It was a swatch and three anonymous range
  inputs — neither a spectrum nor a two-dimensional field, and with no way to tell
  which slider was which. There is a draggable saturation/brightness field now, a hue
  strip drawn in the hues it selects, and every slider carries its name.
- **The appearance editor anchors to the element, not the pointer.** It opened at
  `clientX`/`clientY`, so right-clicking near the middle of a control put the editor
  on top of the thing being edited. It now sits beside the element, flipping side at
  the viewport edge and clamping to the height it can actually occupy.
- **The appearance editor can restyle itself**, which is the one surface a theming
  feature must not exempt — it had no `data-appear` at all. It also announces itself
  as a dialog with a name.
- **There is a keyboard route to it.** <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>
  edits the focused element; the context menu had been the only way in, so anyone not
  using a mouse could not reach the editor at all. Closing it returns focus to
  whatever opened it.

- **The regex builder is reachable from the surfaces that open it.** It rendered at
  `z-index: 85`, below the command palette's scrim at 96 and the bulk-close dialog's at
  98 — so the builder those two offer opened *behind* them and could not be used at all.
- **The tab strip exposes exactly one tab stop again.** Each tab's close affordance
  carried the same `tabindex` as the tab itself, so a selected tab contributed two
  stops and a `role="button"` sat inside a `role="tab"`. It keeps its label and its
  <kbd>Delete</kbd> / <kbd>Ctrl</kbd>+<kbd>W</kbd> path and leaves the tab order.
- **The History panel refreshes.** The git log was read once at mount and never again,
  so a revision committed during the session never appeared and an undo left the list
  showing the state it had just undone. And when a revision genuinely has no snapshot
  this install can restore, it now says so instead of silently doing nothing.

- **The window reflows at 200% zoom.** The navigation rail and the session pane were
  non-shrinking flex items, so at a 480 CSS px viewport they claimed 373 of it and the
  content column collapsed to about 106 px — everything inside spilled sideways into a
  scroller. That single cause produced 96 of the audit's 121 offscreen findings and is
  a WCAG 1.4.10 reflow failure well short of the 320 px the guideline asks for.
- **Pointer targets meet the minimum.** Fifty-five findings turned out to be four
  shared control styles, not fifty-five mistakes: a bare `padding:0` text button, the
  borderless inputs that take only their 17 px line box inside a 38 px pill, range
  inputs at their 16 px default, and `max-width:100%` crushing fixed-size controls once
  the panes stopped shrinking.
- **Nineteen unnamed controls got accessible names**, and every remaining
  focus-visible and clipped-text finding is fixed. The audit went from **228 unique
  findings (1646 occurrences) to 17 (124)** — and all 17 are the harness correctly
  noting a deliberately ellipsised label, which is evidence the text no longer fits
  rather than a defect.
- **Funny levels 4 and 5 stopped blanking the changelog.** `i18n.pick` clamped the
  level to the 0–4 range but not to the table's own length, and 73 of the 92 string
  tables in `cx-changelog.js` ship three levels rather than five — so at the top two
  levels those labels resolved to `undefined` and rendered as nothing.
- **Undo and Restore in the History panel actually work now.** The rows are built from
  the git log once the backend repository has commits, which is every launch after the
  first, and those rows carry git short hashes — while `revert()` and `checkout()`
  looked the id up in the localStorage log, found nothing and returned `null`. Both
  buttons had been silently doing nothing for the life of the feature.
- **A restored snapshot reaches `config.toml`.** `restore()` wrote only localStorage,
  so a restore returned the interface to a past state while the file the CLI actually
  reads kept the present one. It is applied as a dotted diff rather than a whole-file
  write, because the file also holds keys this app does not manage.

- **The regex builder no longer hangs the window on `(a?a?)+`.** The guard caught
  `(a+)+` and `(a|a)*` but not a repeated group that can match nothing, which measured
  **195 seconds** on 26 characters — inside one match attempt, where the 300 ms budget
  cannot reach. It also refused far too much: the old rule rejected any repeated group
  containing an unbounded quantifier anywhere, so `(\.\w+)+$` and
  `[A-Z][a-z]+(\s[A-Z][a-z]+)*` were both rejected as catastrophic while measuring
  0.0 ms. The rule is now calibrated against the stopwatch — a repeated group is
  refused when it can match nothing, when its branches overlap, or when it has no part
  that must appear a fixed number of times — and each shape gets its own honest reason
  rather than all three claiming the window is about to freeze.

- **`--m3-on-error` existed only in the places that used it.** The palette declared
  `error`, `error-container` and `on-error-container` but never `on-error`, so the
  destructive confirm button's `var(--m3-on-error)` resolved to nothing and the label
  inherited a pale surface colour — pale text on pale pink, on the one control in the
  app that closes things irreversibly. An undefined custom property does not error; it
  silently disappears. A test now checks that every `--m3-*` the UI references is
  declared, in both themes.

- **Screenshots are captured against an authored `CODEX_HOME`, not the operator's.**
  A screenshot is a publication. The previous set had a real Windows username legible
  in seven of them and a private repository name in an eighth, all committed and all
  mirrored to the published site. `tools/make-capture-home.mjs` writes a real
  `config.toml` and real rollout files that the real parsers read, so the app, the IPC
  layer and the CLI are all still genuine — only the directory they read is authored.
  The screenshots still prove the app works; they no longer prove who ran it.

- **The transcript has an empty state.** A freshly opened session left roughly sixty
  percent of the app's flagship screen as an unexplained black rectangle. It now says
  what the pane is, which profile and model will run, and shows the exact command the
  composer will execute.
- **`codex doctor` warnings are no longer painted as errors.** Every status that was
  not `ok` collapsed to red, so two warnings read as failures; and the colour was the
  only signal, which is useless to anyone who cannot separate the two hues. There are
  three states now, each with its own glyph and the status word beside it.
- **The bulk-close confirm button is legible.** It paired `on-error-container` — the
  foreground colour for the *container* role — with the `error` background, giving
  pale pink text on light pink for the one genuinely destructive control in the app.

- **Notifications were invisible, and the cause was the app building itself twice.**
  The module scripts sat inside the template block, so the browser ran them once when
  it parsed the document and the dc runtime ran them again when it re-appended the
  template helmet to `<head>`. That produced two of everything — two stores, two
  notification instances, two sets of IPC listeners — with the mounted UI holding the
  first and `window.CX` pointing at the second. Anything raised through the global
  never reached the UI. They now load from the document head, exactly once.
- **The toast stack clears the notification centre.** Both were fixed to the same
  corner, the centre at the higher z-index, so an error raised while the centre was
  open was painted behind it — at the one moment the user is watching for news.
- **The changelog viewer renders its Markdown.** Every entry arrived on screen wearing
  its own asterisks and backticks; bold and code spans are now bold and code spans.
  An unmatched marker stays literal rather than swallowing the rest of the line.
- **The regex builder and appearance screenshots drive the app's own openers.** They
  used to assemble the popover state by hand, which put the builder on top of the
  field it claims to be anchored beside and left its sample box empty — a screenshot
  of neither thing it exists to demonstrate.

- **An unpriced model no longer reports as free.** The Cost panel priced the active
  model by lookup and treated a miss as zero, so a model the price table has never
  heard of produced a confident `$0.000` headline, the verdict "API would be cheaper",
  and a title-bar chip claiming the user had overspent by $600 — while the table
  directly below priced the identical workload at $2.29–$3.21. It now says the price
  is missing and names the model.
- **The Cost panel has its own sidebar.** It had no branch in the sidebar router, so
  it fell through to the last one and rendered the *History* filter beside the pricing
  table. It lists the models it prices, each with its cost, and marks the ones it has
  no price for.
- **The capture harness fails when the app does not render.** It exited non-zero on
  any console error including the expected CSP notice, so the signal was always red
  and therefore worthless: a `p is not defined` that emptied every binding in the
  window still wrote nineteen PNGs of a blank shell and exited the same as a clean
  run. It now distinguishes a broken render from the expected notice, and a partial
  `--only` capture merges into the manifest instead of deleting the other eighteen
  descriptions.
- **The number fields stopped logging parse errors on every launch.** The `<x-dc>`
  template is parsed as live DOM before the runtime compiles it, so the browser
  validated the literal `{{ c.value }}` against `type="number"` four times at startup.

- **The History panel filters**: a date range on the same anchored calendar the
  changelog uses, multi-select filtering by action, and a text search wired to the
  regex builder — all three composing rather than overriding one another. The actions
  are derived from the log itself with a count beside each, so they cannot drift from
  what the app records; the previous hard-coded list offered four of the eight kinds
  the log actually holds. The sidebar and the chips drive the same selection.

- **Changelog viewer** (`app/cx-changelog.js`): Keep-a-Changelog parsing that never
  throws, a date filter with named presets, typed ISO/locale dates that report an
  invalid entry inline without discarding what was typed, and an anchored calendar
  picker with month and year jump, range highlighting and a today marker. Typing and
  the calendar stay in step and neither clears the other; picking a start after the
  current end swaps them rather than producing an empty range. Search composes with
  the date filter rather than overriding it, regex is an opt-in, and the export is
  exactly the filtered view in Markdown or plain text.
- **Per-tab WSL runtimes**: spawn a distro per chat tab, set its working directory,
  execute inside it, and stop or kill it independently of the other tabs. `wsl -l -q`
  output is decoded as UTF-16LE.
- **Cost tab** with an API-equivalent cost calculator over the session's token counts.
- **Health ▸ Usage** reads the newest session's last `token_count` event: total and
  last-turn input, cached, output and reasoning tokens, the model's context window and
  the account's plan and rate-limit state. Nothing is estimated; a machine with no
  recorded turn says so.
- **Health ▸ Cloud tasks** runs `codex cloud list --json`. That subcommand is
  experimental and refuses outright without cloud access, so its refusal is shown
  verbatim rather than rendered as an empty list.
- **Appearance ▸ font family** lists every family installed on the machine via
  `codex_fonts`, filtered through the dropdown's own regex builder, with the bundled
  faces first.
- **External editor integration**: VS Code, VS Code Insiders, Cursor, Windsurf, Zed,
  Sublime Text, Notepad++, IntelliJ IDEA and Notepad, detected by executable rather
  than assumed, with Reveal in File Explorer as the always-available fallback.
- **Per-element appearance editor** reachable from any element's context menu, with
  font, size, weight, style, colour, and a colour translator across HEX, HEX8, RGB,
  RGBA, HSL, HSV, HWB, LAB, LCH, OKLab, OKLCH and CMYK with a WCAG contrast ratio.
- **Dim sum surprise**: a 1-in-100 draw per launch showing a randomly chosen dish named
  in both languages with its photograph, from the shared Hong Kong catalog — all 72 dishes it
  currently holds, bundled locally in `app/dimsum/`. Non-blocking, auto-dismissing, never on a
  first run, and switchable off.
- **Dim sum release code names**: every build carries a dish name beside its version,
  derived from how many releases exist so no two builds share one, with the dish's
  photograph attached to the GitHub release.
- **Bundled assets only**: Roboto and Roboto Mono (`app/fonts/`, 10 woff2 faces,
  Apache-2.0) and React 18.3.1 UMD (`app/vendor/`, MIT). The app makes no network
  request at runtime.
- **Screenshot harness** (`tools/capture.mjs`): drives the real app through eighteen
  surfaces in a composited off-screen window and writes real PNGs, so documentation
  images come from the built artifact rather than a mock.
- **CI** (`.github/workflows/ci.yml`) on every push and `workflow_dispatch`: the test
  job must pass before the release job runs, and the release publishes one uniquely
  tagged, non-draft GitHub Release carrying both installers and the build's dim sum
  photograph.
- **Test suites**: 23 frontend module tests (`tools/test-frontend.mjs`) and 22 backend
  tests (`tools/test-backend.mjs`), both dependency-free, neither requiring Electron or
  a `codex` binary.

### Fixed

These correct defects in the design prototype and the first shell, both committed
earlier within this same unreleased version — not in any shipped release.

- The frontend loaded React from a CDN while the shell enforced a `default-src 'self'`
  content-security policy, so the window rendered blank on every machine. React is now
  vendored locally, as are the fonts.
- The design's `sim` object served fictional MCP servers, plugins and account details
  to the Extend, Config and Health panels even when a real backend was present. Those
  panels now read what the CLI reports.
- The run command drained stdout to completion before reading stderr, which deadlocks
  as soon as a process fills the pipe nobody is reading. Both streams are now drained
  concurrently.
- The content-security policy omitted `unsafe-eval` while the template runtime compiles
  the page's own markup with `new Function`, so the app refused to run its own bundled
  code.
- The error strings contained `{detail}` with nothing interpolating it, so a failed
  command told the user "Could not run `codex` — {detail}".
- The regex guard treated `{n,m}` as a safe outer repeat, and the error message
  recommended `{1,20}` as the remedy. Measured on a 37-character sample, `(a+)+$` was
  refused in under a millisecond while `(a+){1,20}$` ran past twenty seconds — the
  advice was the defect. `(a|a)*` and `(x|xx)+y` were not detected at all. Both
  engines now refuse a repeat applied to a group that already repeats, and a group
  whose alternation branches overlap, before running it.
- The dim sum and narrator toggles wrote their preference without recording a
  revision, leaving the History panel with nothing to undo for those two settings.
- The screenshot harness captured a window created with `show: false`, which Chromium
  never paints, so every image was one state behind the surface it documented.
- Config ▸ Write file sent only the active profile's overrides to a backend command
  that replaces the whole of `config.toml`. Pressing it with three settings changed
  would have deleted every MCP server, hook and marketplace in the file — the
  automatic backup was the only thing between that button and a wiped configuration.
  Each override is now applied as a dotted-path merge, and a non-default profile's
  values are written under `profiles.<name>.<key>` where the CLI reads them. The
  panel's path label said `~/.codex/<profile>.config.toml`, which the backend never
  wrote; it now names the real file.

- **Stop actually stops.** The composer's send button becomes a stop button while a
  run is in flight, and `codex_cancel` kills the process tree with `taskkill /T` —
  `codex` spawns its own children, and killing only the parent left those running.
  Pressing Stop after a run has already finished says so rather than erroring.
- **Appearance presets are files**, not clipboard JSON: export, import through a file
  picker, and named presets that can be saved, applied and deleted. Anything an
  imported file asks for that this build cannot represent is listed by name with a
  reason and offered as an undo — never dropped in silence.
- **An accessibility and layout audit harness** (`tools/audit-ui.mjs`) that renders the
  real app across three widths, four zoom levels, two language modes and every nav
  section, then measures overflow, clipping, pointer-target size, accessible names, tab
  semantics, contrast and focus visibility. It exits non-zero on any high-severity
  finding. Its results live in `assets/audit/ui-audit.json`.

### Changed

- The desktop shell moved from Tauri 2 to Electron 40. The Tauri build produced
  installers and launched, but rendered blank: WebView2 composites through
  DirectComposition, which cannot be captured off-screen, so the only available check
  for whether the window contained anything could not answer the question. Electron
  bundles Chromium, renders identically across machines, and can screenshot itself.
  The Rust backend was ported to Node with the same command contract.

[0.1.0]: https://github.com/Ding-Ding-Projects/codex-material/releases
