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
- **Changelog viewer** (`app/cx-changelog.js`): Keep-a-Changelog parsing that never
  throws, a date filter with named presets and typed ISO/locale dates that reports an
  invalid entry inline without discarding what was typed, a composed text-and-date
  search with opt-in bounded regex, and Markdown or plain-text export of exactly the
  filtered view.
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

### Changed

- The desktop shell moved from Tauri 2 to Electron 40. The Tauri build produced
  installers and launched, but rendered blank: WebView2 composites through
  DirectComposition, which cannot be captured off-screen, so the only available check
  for whether the window contained anything could not answer the question. Electron
  bundles Chromium, renders identically across machines, and can screenshot itself.
  The Rust backend was ported to Node with the same command contract.

[0.1.0]: https://github.com/Ding-Ding-Projects/codex-material/releases
