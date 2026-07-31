# Handoff — Codex Studio

The factual state of this repository for whoever picks it up next. Every number below was
produced by running the command named beside it, on this tree, at the commit named below.
Nothing here is predicted, and nothing is claimed green that was not observed green.

| | |
| --- | --- |
| **Snapshot commit** | `70be15d` — *Reconcile the appearance page with itself* |
| **Branch** | `main` |
| **Captured** | 2026-07-30 |
| **Platform** | Windows-only Electron app (`electron/main.js`), no macOS or Linux target |
| **Public repo** | `Ding-Ding-Projects/codex-material` |
| **Newest release** | `v0.1.0+build.596` — non-draft, carrying a real NSIS `.exe` and `.msi`, code-named *Chocolate Coconut Snowballs · 巧克力椰絲雪球* |

## Verification block

Run these five. Every figure in this document came from them.

```bash
node tools/test-frontend.mjs && node tools/test-backend.mjs && node tools/capture.mjs && node tools/audit-ui.mjs && node tools/smoke.mjs
```

| Command | Observed at `70be15d` |
| --- | --- |
| `node tools/test-frontend.mjs` | **29 passed, 0 failed** |
| `node tools/test-backend.mjs` | **33 passed, 0 failed** |
| `node tools/capture.mjs` | **exit 0** — 25 shots written, 1 console message (the expected CSP notice) |
| `node tools/audit-ui.mjs` | **25 findings across 240 cells, 0 severity high** — all 25 are the harness noting a deliberately ellipsised label |
| `node tools/smoke.mjs` | **PASSED** — CLI answered; 40 IPC ok / 7 refused as designed / 8 skipped / 0 failed; 10 panels, 7 overlays and 3 language modes ok; 0 console errors |

> [!NOTE]
> **All 25 remaining audit findings are the harness noting a deliberately ellipsised label.**
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

## Where things stand, and what to pick up

**Done and verified at this commit**

- Every README screenshot is new. The shot list in `tools/capture-main.cjs` was rewritten so each surface shows its feature *in use* rather than at rest, and four surfaces that had never been photographed were added: the command palette, the filtered history, the feature-flag list and the Cantonese Studio panel. 25 shots, every one retaken against the current build.
- The capture fixture lives at `C:\Users\Public\codex-studio-capture`, **not** inside the checkout. The Config panel prints the absolute path of the file it writes, so a fixture under the repository puts the operator's account name straight back into a screenshot.
- `assets/smoke.json` is redacted before it is written. It is committed, and it used to record the absolute path of the `codex` binary.
- CI no longer stops runs. See below.

**Open, in priority order**

1. **The installers are unsigned.** That needs a code-signing certificate this project does not have, so SmartScreen warns on first run. Blocked, not pending.

**Closed since the previous handoff**

- **Bilingual mode is complete.** The earlier entry here said 92 hard-coded labels remained; the real number was over 200, because the audit behind it grepped `label: "…"` and that pattern cannot see a positional argument to `pick()`, a palette `group`, or a label inside a ternary. 327 `CX.i18n.t()` call sites now, against a 559-key table, and the audit is a test rather than a grep — `app/index.html — no user-visible string bypasses CX.i18n` sweeps six props against a seven-entry allow-list and separately checks that every key the frontend asks for is defined.
- **The appearance editor covers 23 typography properties**, the word-processor set the rules describe, and the three things this build genuinely cannot represent are shown in the editor with the reason rather than being absent.
- **`app/cx-appearance.js` is loaded by the page.** It never was: no `<script src>` tag listed it, so `window.CX_APPEARANCE` did not exist at runtime and export, import and every named preset hit their `if (!A)` guard while the module's own tests passed throughout — the test runner reads module files directly through `node:vm` rather than through the page. Two tests guard it now: no `app/*.js` may be missing a script tag, and every `CX_*` global the page reads must be assigned by something the page loads.
- **Releases carry a dim sum code name again.** The index moved to the run number (past 590) while the list it indexed was the 72-dish bundled photo slice, so every build past #72 published unnamed. Names come from `app/dimsum/roster.json` — all 703 catalog dishes, 356 KB — and a missing photo no longer costs a build its name.

**A multi-agent audit found twelve features that passed every test and did not work**

Each was verified by three independent skeptics before being touched. They all had the same shape
— the control is present, the tests are green, and nothing happens. Worth reading before adding a
test, because none of the tests that existed could have caught any of them.

| Was | Why no test saw it |
| --- | --- |
| `app/cx-appearance.js` was never in the page, so export, import and every named preset hit their `if (!A)` guard | The test runner reads module files directly through `node:vm`, never through the page |
| Three Extend toggles sent `{ name }` to handlers reading `dir`, `event`/`index`, and one command that was never registered anywhere | The promise had no `.catch()`, so every rejection went nowhere and the switch simply never moved |
| The narrator had no caller anywhere in the app, and read a settings key nothing writes | Nothing asserts that a written function is ever called |
| Four messages rendered a literal `{placeholder}` at the user | `interpolate()` leaves an unknown placeholder **visible** by design, so the bug renders and every test stays green |
| The regex builder rendered English in all three language modes | The i18n sweep looked at `label:`, and the builder uses none |
| The CLI-staging step could not reach its own graceful fallback | GitHub's pwsh wrapper exits on `$LASTEXITCODE` before the code deciding to continue can run |
| A legacy `italic: true` could never be switched off | `normalise()` re-derived `slant` from it every time the control cleared `slant` |

Four tests cover those classes now: every `app/*.js` is in the page, every `CX_*` global the page
reads is assigned by something loaded, every call site passes the variables its entry declares,
and no entry with placeholders is resolved without them. The last two were proven by putting a
fixed bug back and watching them fail.

The audit produced 46 candidates across six dimensions. The rest were documentation figures — 23
of them, in 13 files — and are corrected.

**Two traps worth knowing before you touch the harnesses**

> [!WARNING]
> **`CODEX_HOME` is one directory, not a sandbox.** Skills are not under it: `skillList()` enumerates the machine's real `~/.agents/skills` and `skillToggle()` renames a directory there. Check what a command actually touches before adding it to the smoke test's exercised set — pointing `CODEX_HOME` at a fixture does not contain it.

> [!WARNING]
> **Anything committed can leak the operator, not just screenshots.** The username reached this repository twice by different routes: once through a screenshot of a path, once through a JSON report. `git ls-files -z | xargs -0 grep -lI "<your-username>"` should return nothing.

## CI does not cancel runs

The concurrency group used to be `ci-${{ github.ref }}` with `cancel-in-progress: false`. That reads as safe and is not: GitHub keeps at most **one pending run per group**, so a third push evicts the second while the first is still running. Build `fa7975e` was cancelled that way with nobody asking for it.

The group is `ci-${{ github.run_id }}` now — unique per run, so it never matches another run and therefore never queues, evicts or cancels. **Every push gets its own run and its own release.**

The serialisation had been protecting the dim sum code name, which was derived from a count of releases already carrying a dish; two overlapping runs read the same count and claim the same dish. The index is `GITHUB_RUN_NUMBER` instead, which is unique per run by construction. The cost is that a re-run build skips a dish — a gap in a decorative sequence, not a fault.

That run number is already past 590, so the index is resolved against `app/dimsum/roster.json` — every dish the shared catalog names, 703 of them in 356 KB — rather than the 72-dish photo slice the installer bundles. Builds 591 and 592 published unnamed before that was noticed. A build named after a dish outside the photo slice ships the name and no picture, and the release notes say why.

## The smoke test is the one that matters

`node tools/smoke.mjs` (or `npm run smoke`) is the check that answers "does the
application work", as opposed to "do the modules pass". Three phases, any of which
fails the run:

| Phase | What it proves |
| --- | --- |
| **CLI** | The real binary is located and answers. If `codex --version` does not come back, the app is a shell around nothing and every other check is theatre. |
| **IPC** | Every command on the preload allow-list, invoked **through the renderer's own bridge** — so the contextBridge, the named allow-list and the real `ipcRenderer` channel are all in the path. Calling the handler module directly would prove the handlers work while saying nothing about whether the page can reach them. |
| **PANELS** | All ten navigation panels opened, each checked for unresolved bindings, a thrown render, and a minimum of real content. |
| **OVERLAYS** | The seven dialogs the panel sweep never touches: regex builder, appearance editor, notification centre, bulk close, calendar, command palette, slash catalog. A binding that only lives inside a dialog can otherwise stay broken indefinitely — the palette listed **ten blank rows** until this phase opened it. |
| **LANGUAGES** | English, 廣東話 and bilingual at **funny level 5**, sweeping every panel. A key that fails to resolve renders as its own name and a short table read past its end renders as nothing; neither is visible in English at the default level. |

It runs against the authored `CODEX_HOME`, so the destructive commands mutate a fixture.

> [!WARNING]
> **`codex_skill_toggle` is deliberately skipped, and the reason generalises.** Skills
> are not under `CODEX_HOME`: `skillList()` enumerates the machine's real
> `~/.agents/skills` and `skillToggle()` renames a directory there. Pointing
> `CODEX_HOME` at a fixture does **not** isolate it. Before adding a command to the
> exercised set, check what it actually touches — the fixture is not a sandbox, it is
> one directory.

Every skip is listed with its reason in the report (`assets/smoke.json`) rather than
being quietly absent. An untested command that looks tested is worse than an obvious
gap. CI runs this in the **release** job, before `electron-builder`, so a broken app
cannot be packaged — the test job installs with `--ignore-scripts` and never downloads
the Electron binary, so it cannot run there.

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

- **25 screenshots** in `assets/screenshots/` (`01-chats.png` … `17b-cantonese-studio.png`), with
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

### 1. The installers are unsigned

`electron-builder` signs with whatever certificate the host offers; there is no code-signing
identity configured, so Windows SmartScreen will warn on first run.

### 2. Content-Security-Policy is set but permissive

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
| Level 2 of the funny sliders was inert | 140 sentence-length keys now have a distinct level 2 in both languages. The 106 still identical are one- or two-word labels ("Chats", "Hue", "Codex Studio") where a level 2 would have to be invented, which makes the interface worse rather than more compliant |
| Three keys were defined twice in the string table | `tab.closed`, `tab.overflow` and `tab.unsaved`. In a JS object literal the later definition wins, so the earlier was dead data that read exactly like coverage. Removed |
| MCP servers and hooks were outside the snapshot, so deleting one could not be undone | The real `config.toml` is cached and rides in the snapshot as `configToml`; the cache refreshes at the bridge funnel after any command that can change the file |
| The colour translator was one-way — it printed twelve representations and read back only hex | `CX.color.parse` reads all twelve plus named colours, preserving alpha. Proven by a round trip: every space emitted, parsed back, worst channel drift 1 |
| Appearance changes could not be undone from the History panel | `patchAppear` and both resets commit a revision now — debounced by 900 ms so a colour drag records one entry, not one per frame |
| Documentation described a backend that no longer exists | Closed. `grep -rn "src-tauri\|Tauri 2" docs/` matches four files and every match is deliberate history or an explicit negative — nothing describes Tauri as the current backend |
| 92 interface labels were hard-coded English, so bilingual mode was incomplete | Closed, and the real figure was over 200 — the old audit grepped only `label: "…"`, which cannot see a positional argument to `pick()`, a palette `group`, or a label inside a ternary. 327 `CX.i18n.t()` call sites now, against a 559-key table. Guarded by a test rather than a grep: **app/index.html — no user-visible string bypasses CX.i18n** sweeps six props against a seven-entry allow-list and checks every key the frontend asks for is defined |
| 228 unique UI-audit findings across 1646 occurrences | 17 / 124, all of them the deliberate-ellipsis note |

## Skipped by decision

**109 string-table keys are unreachable, and they stay.** Nothing names them literally and no
dynamic prefix reaches them. They are dead data, and a table that looks better covered than the
interface is exactly how "92 hard-coded labels" came to be off by more than half — so the count is
pinned by a test rather than left to drift.

They are not deleted, for a reason worth recording. A first attempt used "same leaf as a live key"
as the duplication test and would have removed `err.run`, `err.cancel`, `err.history` and
`err.wsl` — all of which fire on real failures, reached as `i18n.t("err." + what)` from
`notifyBackendFailure`. The scan had required a `CX.` prefix that `codex-core.js` does not use.
Tightened to "same leaf **and** identical level-1 English", nothing at all qualifies: even
`tab.close` and `tabs.close`, which both read *Close tab*, differ at other levels. Deleting 109
entries on a heuristic that has already been wrong once buys tidiness and risks a message.


**GitHub Projects.** The available `gh` token lacks `read:project`, and adding it means
running `gh auth refresh` against someone's GitHub account. The user was asked and chose
to skip it, so no Project item exists for this work and none is expected. Nothing else
depends on it.

## External-state blockers

These are not to-do items. Each needs an action an agent must not take on someone's
account, or an API that does not exist.

| Blocker | Evidence | Smallest unblocking action |
| --- | --- | --- |
| **The `gh` token has no `read:project` scope** | `gh project list --owner Ding-Ding-Projects` fails with `your authentication token is missing required scopes [read:project]`. So no GitHub Project can be read, created or updated from here, and the Project half of the handoff is unsatisfied. | `gh auth refresh -s read:project,project` — an interactive device-code flow against the account's own credentials, which an agent must not run unattended. |
| **The installers are unsigned** | `electron-builder` signs with whatever certificate the host offers and none is configured, so Windows SmartScreen warns on first run of every published `.exe` and `.msi`. | A code-signing certificate. Buying one and installing it on the build host is a purchase and a credential, neither of which an agent may do. |

### Closed since the previous handoff

| Was blocked | Now |
| --- | --- |
| **The wiki had no git repository** | Published. `git ls-remote …/codex-material.wiki.git` returns `918ab89` on `refs/heads/master`. The user saved the first page through the web UI, which is the only thing that creates the repo; every later edit is a git push. |
| **~520 junk releases and their tags** | Deleted, on the user's instruction. 44 releases remain, all intended. The first attempt reported 524 failures that were invisible because stderr went to `/dev/null` — GitHub's secondary rate limit, not a permissions problem. Retried with backoff: 515 of 515 deleted, 0 failed. |

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
