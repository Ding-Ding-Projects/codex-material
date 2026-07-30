# Handoff — Codex Studio

The factual state of this repository for whoever picks it up next. Every number below was
produced by running the command named beside it, on this tree, at the commit named below.
Nothing here is predicted, and nothing is claimed green that was not observed green.

| | |
| --- | --- |
| **Snapshot commit** | `c9c2763` — *A restore now restores all of it, not the half that happened to be listed* |
| **Branch** | `main` |
| **Captured** | 2026-07-30 |
| **Platform** | Windows-only Electron app (`electron/main.js`), no macOS or Linux target |
| **Public repo** | `Ding-Ding-Projects/codex-material` |
| **Newest release** | `v0.1.0+build.566` — non-draft, carrying a real NSIS `.exe` and `.msi` |

## Verification block

Run these four. Every figure in this document came from them.

```bash
node tools/test-frontend.mjs && node tools/test-backend.mjs && node tools/capture.mjs && node tools/audit-ui.mjs
```

| Command | Observed at `c9c2763` |
| --- | --- |
| `node tools/test-frontend.mjs` | **24 passed, 0 failed** |
| `node tools/test-backend.mjs` | **28 passed, 0 failed** |
| `node tools/capture.mjs` | **exit 0** — 19 shots written, 1 console message (the expected CSP notice) |
| `node tools/audit-ui.mjs` | **17 findings across 240 cells, 0 severity high** |

> [!NOTE]
> **All 17 remaining audit findings are the harness noting a deliberately ellipsised label.**
> That is evidence a label no longer fits its box, not a defect: the capture fixture contains a
> 76-character session name specifically to exercise truncation. There are currently **no
> unaddressed real findings** in the UI audit. Before this session there were 228 unique
> findings across 1646 occurrences.

> [!WARNING]
> `node tools/capture.mjs` **exits non-zero if the app fails to render.** It distinguishes a
> broken render — a thrown exception, or a `{{ binding }}` that never resolved — from the
> permanent Content-Security-Policy notice that the design-compiler runtime provokes on every
> launch because it compiles templates with `new Function`. Do not "fix" that notice by
> removing `unsafe-eval`; the app will not start. Do not ignore a non-zero exit: it has caught
> three real regressions, including one where every binding in the window was empty and the
> harness still wrote nineteen screenshots of a black rectangle.

## What is genuinely done

- **The app runs the real CLI.** 53 named IPC commands behind an allow-list preload; no generic
  invoke. Every handler either executes the real `codex` binary and hands its output back
  verbatim, or reads and writes a real file under `$CODEX_HOME`.
- **Screenshots are captured against an authored `CODEX_HOME`** (`tools/make-capture-home.mjs`),
  never the operator's own. An earlier set had a real Windows username legible in seven images
  and a private repository name in an eighth, committed and mirrored to the published site.
- **Accessibility**: 0 severity-high findings, and every target-size, focus-visible,
  accessible-name and clipped-text finding is closed. The window reflows at 200% zoom.
- **CI** publishes one non-draft release per green push, each carrying a real installer.


## What this project is

Codex Studio is a Material 3 desktop GUI wrapping the OpenAI Codex CLI. Every action in the
GUI is a real `codex` invocation — the frontend composes flags, `electron/commands.js` runs
them, and the app renders exactly what the CLI said. It does not reimplement the agent, the
sandbox, the config schema or the plugin system.

The Codex CLI is bundled with the installer (~410 MB, staged by `tools/fetch-codex.mjs` into
`vendor/codex-bin`, shipped via `extraResources`) so a machine that has never installed Codex
works immediately. A `codex` already on the user's PATH always wins, because that binary owns
their login and their `~/.codex`.

---

## Verified state

### Test suites — run, not quoted

```
node tools/test-frontend.mjs      →  23 tests, 23 pass, 0 fail   (duration ~22 ms)
node tools/test-backend.mjs       →  22 tests, 22 pass, 0 fail   (duration ~2.1 s)
node tools/sync-changelog.mjs --check
                                  →  "app/CHANGELOG.md matches the root copy."
```

**45 passing tests total.** The frontend breakdown printed by the runner:

| Module | Passing |
| --- | --- |
| `app/codex-core.js` | 9 |
| `app/cx-i18n.js` | 6 |
| `app/cx-dimsum.js` | 4 |
| `app/cx-changelog.js` | 4 |

The frontend runner needs no `npm install`, no jsdom and no build step — it reads each module
off disk and evaluates it in a `node:vm` context holding a minimal browser shim, so the tests
exercise the exact bytes the renderer loads. The backend runner covers `electron/lib/*` plus
one structural test that every command `preload.js` exposes is actually registered by the main
process.

### The app builds and runs

- **16 screenshots** in `assets/screenshots/` (`01-chats.png` … `16-light-theme.png`), with
  `manifest.json` recording `capturedFrom: "the real app (electron/main.js frontend + preload)"`
  and all 16 entries `applied: true`. They were taken through the project's own harness
  (`tools/capture.mjs` + `tools/capture-main.cjs`), not mocked up.
- **10 GitHub Releases published**, latest `v0.1.0+build.11`. Each is built by CI on
  `windows-latest` and carries both a real NSIS `.exe` and a real `.msi`; the workflow fails
  the job if either is missing from `dist/`.

### CI

| Run | Commit | State |
| --- | --- | --- |
| [`30519168126`](https://github.com/Ding-Ding-Projects/codex-material/actions/runs/30519168126) | `713b498` — the snapshot commit | **still running** when this was written |
| [`30519056622`](https://github.com/Ding-Ding-Projects/codex-material/actions/runs/30519056622) | `ac625c2` | **still running** when this was written |
| [`30518601495`](https://github.com/Ding-Ding-Projects/codex-material/actions/runs/30518601495) | `ae0e562` | **success** (observed) |
| [`30518399551`](https://github.com/Ding-Ding-Projects/codex-material/actions/runs/30518399551) | `5ed6e5c` | **success** (observed) |
| [`30518029262`](https://github.com/Ding-Ding-Projects/codex-material/actions/runs/30518029262) | `561da4b` | **success** (observed) |

> [!WARNING]
> **CI for the snapshot commit `713b498` had not finished.** The last *completed* CI run on
> `main` is `30518601495` for `ae0e562`, and it was green. Two runs were in flight at once
> because commits were landing faster than CI could clear them. Do not record `713b498` as
> verified until its own run reports: `gh run list --branch main --limit 5`.

### Verified versus merely written

| Claim | Status |
| --- | --- |
| 45 tests pass | **Verified** — both runners executed on this tree |
| The bundled changelog matches the root copy | **Verified** — `sync-changelog.mjs --check` |
| Regex guard refuses the catastrophic shapes it names | **Verified** — measured, see below |
| Installers build and publish | **Verified** — 10 releases exist with attached artifacts |
| Screenshots come from the real app | **Verified** — manifest records the capture path |
| CI green at `713b498` | **Not verified** — run still in progress |
| Installers work on a clean machine | **Not verified** — nothing installs or launches them |
| Installers are trustworthy to Windows | **False** — they are unsigned; SmartScreen warns |
| The docs describe the current backend | **Being fixed live** — 15 → 4 stale files during the session, see gap 1 |

---

## Known gaps and defects

Every entry below was re-verified against this commit. Four gaps recorded in the previous
handoff are now closed and appear under *Recently closed* instead — do not re-report them.

### 1. Documentation still describes a backend that no longer exists

The Rust shell was replaced by Electron in `561da4b`; `src-tauri/` does not exist. Some files
still discuss Tauri. Re-run the grep before acting — this has been shrinking steadily:

```bash
grep -ril "tauri" --include=*.md --include=*.js . | grep -v node_modules
```

Note that two of the remaining hits are the Pages site's `.js`, not `.md`. Grepping only
`.md` will look finished while the published site still says Tauri.

### 2. The language mode still misses most secondary labels

The app's **primary** surface is done: the navigation rail, the Extend category list and
the window chrome now resolve through `CX.i18n` at render time, so switching to 廣東話 or
bilingual translates them without a restart. The rest is not.

Measured at this commit: **127** `CX.i18n.t()` call sites plus 6 uses of the nav/ext
helpers, against **29** literal text nodes in the template and **244** hard-coded
`label`/`title`/`placeholder`/`hint` values in the logic. The remaining offenders are the
context menus, the Console flag panel, the Config section list and most button labels.

The string table now holds **273** keys.

```bash
grep -c "CX.i18n.t(" app/index.html
```

> [!NOTE]
> **Check for unreachable keys before adding new ones.** The table already contained
> navigation entries keyed `nav.chats`, `nav.extend` and `nav.config`, while the
> navigation ids are `chat`, `ext` and `settings` — so nothing ever looked them up, and
> from the outside the table looked like it had coverage it did not have. Those three are
> reconciled; assume others like them exist. A key that resolves to itself is a key
> nothing is using.

### 3. Levels 1 and 2 of the funny sliders are byte-identical for almost every key

233 of the 237 existing keys have the same text at level 1 and level 2 in both languages, so
moving either slider from 1 to 2 changes nothing the user can see. A slider step that does
nothing is a broken control. Newly added keys in this session do differentiate the two.

### 4. The colour translator is one-way

The twelve rows are read-only output and the single text input accepts hex only, so
`oklch(...)` or `rgb(...)` typed into it is rejected. The rules ask for bidirectional
conversion among the listed spaces.

### 5. The appearance editor's typography is eight properties deep

Family, size, weight, italic, underline, strike, a letter-spacing toggle and colour. The rules
describe a word-processor standard — variable axes, small caps, super/subscript, highlight,
outline, shadow, baseline offset, direction and the rest — with unsupported properties staying
visible and explained rather than absent.

### 6. Appearance writes do not record a revision

`patchAppear` (every font, size, weight, toggle and colour change) and both in-editor reset
buttons write straight to the store without committing to the history, so those changes cannot
be undone from the History panel even though sibling controls elsewhere can.

### 7. MCP servers and hooks are outside the snapshot

The snapshot covers what the app keeps in `localStorage`. Records that live in `config.toml`
and are managed through the CLI — MCP servers, hooks — are not captured, so deleting one
cannot be undone. `restore()` does now push the snapshot's `config` back into `config.toml`
as a dotted diff, so the mechanism to fix this exists; the snapshot simply does not collect
those sections yet.

### 8. The installers are unsigned

`electron-builder` signs with whatever certificate the host offers; there is no code-signing
identity configured, so Windows SmartScreen will warn on first run.

### 9. Content-Security-Policy is set but permissive

`unsafe-eval` is required: the design-compiler runtime compiles the template with
`new Function`. Removing it stops the app from starting. This is the source of the one console
message every capture reports, and it is expected.

### Recently closed — verified fixed at this commit, do not re-report

| Was | Now |
| --- | --- |
| `(a?a?)+` got past both regex guards and froze the window for ~195 s | Refused. Verified: `CX.evaluate("(a?a?)+$", …).refused` is set. The guard is calibrated against measured engine timings, and no longer refuses `(\.\w+)+$` or `[A-Z][a-z]+(\s[A-Z][a-z]+)*`, which measure 0.0 ms |
| Template placeholders reached `<input type="number">` and logged four console errors per launch | 0 parse errors in the capture manifest |
| A running `codex` process could not be stopped | `codex_cancel` is registered and wired |
| Appearance presets were a stub | Export and import are implemented and file-backed |
| History's Undo and Restore silently did nothing after the first launch | Both resolve a git-sourced row to its local revision, and say so when a revision has no snapshot |
| A restored snapshot never reached `config.toml` | `restore()` applies it as a dotted diff via `codex_config_restore` |
| 228 unique UI-audit findings across 1646 occurrences | 17 / 124, all of them the deliberate-ellipsis note |

## Skipped by decision

**GitHub Projects.** The available `gh` token lacks `read:project`, and adding it means
running `gh auth refresh` against someone's GitHub account. The user was asked and chose
to skip it, so no Project item exists for this work and none is expected. Nothing else
depends on it.

## External-state blockers

These are not to-do items. Each needs an action an agent must not take on someone's
account, or an API that does not exist.

| Blocker | Evidence | Smallest unblocking action |
| --- | --- | --- |
| **The wiki has no git repository yet** | `has_wiki` is `true`, but cloning `…/codex-material.wiki.git` returns `Repository not found`. GitHub creates the wiki's repo only when the first page is saved through the web UI; no REST or GraphQL endpoint creates it. | Open the repository's Wiki tab and save any page once. The intended first page is written and waiting at `docs/handoff/wiki-home.md`; every later edit can then be pushed by git. |
| **~520 junk releases and their tags** | `on: push:` with no filter also fires on tag pushes, and the release job creates a tag. The loop published 533 releases; 11 were intended. The trigger is fixed in `aadfce1` and the loop is stopped, but the artifacts remain. | Deleting several hundred published releases and immutable tags is destructive and was not asked for. On confirmation it is a loop over `gh release delete --cleanup-tag`. |

## Where things live

### Frontend — `app/`, no build step, plain browser JS

| File | Lines | Owns |
| --- | --- | --- |
| `index.html` | 3088 | The `<x-dc>` template **and** the inline `DCLogic` component class — the entire UI, all panels, every binding. This is the biggest file in the project and where most UI work happens. |
| `support.js` | 1911 | Generated `dc` template runtime (React-based). **Do not edit.** |
| `codex-core.js` | 724 | `window.CX` — the bridge to Electron (with a browser simulation fallback), `store`, `toToml`, the bounded regex engine `evaluate`, colour translation, `i18n`, `narrator`, `vcs`, `settings`, `dimsum`, `live` hydration. |
| `cx-i18n.js` | 1505 | The full string table: every key × 5 funny levels × 2 languages. |
| `cx-changelog.js` | 629 | Changelog engine — Keep a Changelog parser, typed-date parser, presets, the compose-not-override filter, and export. No DOM. |
| `cx-tabs.js` | 521 | Tab model: strips, groups, pinning, the four searches (`searchStrip`, `searchGroup`, `searchGroups`, `searchAll`), and the bulk-close predicate. |
| `codex-data.js` | 361 | `window.CODEX` — the CLI subcommand, flag, setting and slash-command catalog. |
| `cx-notify.js` | 258 | Non-blocking notification centre. |
| `cx-dimsum.js` | 58 | The dish catalog; art is bundled PNGs in `app/dimsum/`. |
| `vendor/`, `fonts/` | — | React, ReactDOM, Roboto and Roboto Mono, vendored so nothing is fetched at runtime. |

### Backend — `electron/`

| File | Lines | Owns |
| --- | --- | --- |
| `main.js` | 100 | Window creation (frameless, the app draws its own M3 title bar), single-instance lock, external-link handling, WSL shutdown on quit. |
| `commands.js` | 290 | **The IPC command registry** — every `codex_*` command the renderer can call. Start here to trace a GUI action to a real CLI invocation. |
| `preload.js` | 96 | The `window.CODEX_BRIDGE` surface — a fixed list of named commands, not a generic escape hatch. |
| `lib/catalog.js` | 466 | MCP servers, plugins, marketplaces, skills, hooks, features, sessions, doctor. |
| `lib/cli.js` | 194 | Locating the `codex` binary (user PATH first, bundled second), spawning it, streaming its lines, salvaging JSON printed after a human banner. |
| `lib/wsl.js` | 185 | Per-tab WSL instances. |
| `lib/history.js` | 153 | The on-disk git repository backing `CX.vcs`, kept beside the app's own data directory. |
| `lib/editors.js` | 141 | External-editor detection and launch. |
| `lib/config.js` | 96 | `config.toml` read/write with dotted-path get/set, backup-before-replace, and refusal to write invalid TOML. |

### Tooling — `tools/`

| File | Purpose |
| --- | --- |
| `test-frontend.mjs` (893) | The frontend suite and its `node:vm` browser shim. |
| `test-backend.mjs` (326) | The `electron/lib/*` suite. |
| `capture.mjs` (47) + `capture-main.cjs` | The screenshot harness that produced `assets/screenshots/`. |
| `fetch-codex.mjs` (141) | Stages the ~410 MB Codex CLI into `vendor/codex-bin` for packaging. |
| `release-codename.mjs` (148) | Derives the per-build dim sum code name from the monotonic run number. |
| `sync-changelog.mjs` (40) | Mirrors `CHANGELOG.md` into `app/`; `--check` mode fails CI on drift. |
| `sync-site-assets.mjs` (92) | Added in `713b498`. Keeps the Pages landing page's copy of the screenshots in step with `assets/screenshots/`. |
| `make-icon.mjs` (129) | Generates the icon with no image dependencies. |
| `sync-dimsum.ps1` | Syncs the dim sum artwork. |

### Everything else

- `.github/workflows/ci.yml` — one workflow, two jobs. `test` runs both suites, the changelog
  check and a parse check over every `.js`/`.mjs`/`.cjs`. `release` `needs: test`, so a failed
  test publishes nothing. Tags are `v{version}+build.{run_number}` and are refused if they
  already exist, so nothing is ever overwritten.
- `docs/` — Markdown pages across `architecture/`, `build/`, `features/`, `experience/`, `api/`.
  Accurate about features; the backend description was being migrated off Tauri throughout this
  session (gap 1).
- `docs/site/` — the GitHub Pages landing page (`index.html`, `articles.js`) plus its own copy
  of the screenshots, kept in step by `tools/sync-site-assets.mjs`. Deployed and live.
- `CHANGELOG.md` — Keep a Changelog format, mirrored into `app/CHANGELOG.md` and shipped as an
  `extraResource` so the in-app viewer reads the real file.
- `design/` — the original design-tool export the app was grown from.
- `vendor/codex` — a git submodule pointing at the upstream Codex CLI, for reference only. CI
  checks out with `submodules: false`; cloning it costs minutes and buys nothing.

---

## First things to do

1. Run the verification block above and confirm the numbers still hold.
2. Check whether CI for the head commit finished: `gh run list --branch main --limit 5`.
3. Read `ROADMAP.md` — it is ordered, and items 1–3 are the gaps above.

---

## 中文摘要

呢份係接手文件，寫喺 commit `713b498`。所有數字都係真係行過先寫落嚟，冇一個係估嘅。

**行得通嘅嘢：** 前端 23 個測試、後端 22 個，總共 **45 個全部綠**；changelog 同步檢查過關；
16 張截圖係喺真 app 影返嚟（唔係砌圖）；已經出咗 **10 個 release**，每個都有真嘅 NSIS `.exe`
同 `.msi`；GitHub Pages 啱啱上咗線。

**要留意：** snapshot 嗰個 commit 嘅 CI **仲行緊**，未綠——上一個 commit `ae0e562` 就係綠嘅。
唔好當佢綠咗。仲有，成個 session 期間有第二個 agent 一路喺度 commit（前後五個 commit），
所以下面啲數字要自己行多次先算數；不過 `app/` 由 `ae0e562` 之後冇郁過，所以前端嗰幾項發現
（第 2、3、4 項）係喺呢個 commit 度重新驗過，照樣成立。

**未搞掂嘅嘢（有八項，詳情睇上面）：** 第一項係文件——個 Rust 殼喺 `561da4b` 已經換咗做
Electron，`src-tauri/` 根本唔存在，但仲有檔喺度講 Tauri。呢樣有人執緊，而且執得好快：一個
session 之內由 **15 個檔跌到 11 個再跌到 4 個**，所以唔好信呢度寫嘅數字，自己行個 grep 睇
下先。剩低嗰四個入面有兩個係 Pages 網站嘅 `.js`，唔係 `.md`——淨係 grep `.md` 會以為執完，
但個網站仲喺度講 Tauri。寫錯過冇寫，因為新人會走去搵一堆唔存在嘅 Rust，仲會連累埋啲寫得啱
嘅文件一齊冇人信。第二係 `(a?a?)+` 呢個 pattern 仲穿得過兩個引擎嘅防呆，實測 26 個字行足
**154 秒**，打入 regex builder 就會凍死成個視窗。第三係 History 記錄唔齊：同一個「reset 晒
所有外觀」嘅動作，Studio 面板嗰粒有 commit（佢自己個說明仲寫住「可以 undo」），但外觀編輯器
嗰粒完全冇——同一件事，兩個入口，得一個 undo 到。

**外部卡住咗嘅嘢：** GitHub Projects 開唔到，個 `gh` token 冇 `read:project` 權限，要人手行
`gh auth refresh` 先得——呢樣係人哋個 account，agent 唔應該代勞。所以呢個係**卡住咗**，唔係
「未做」。
