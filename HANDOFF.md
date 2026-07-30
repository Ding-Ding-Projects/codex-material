# Handoff — Codex Studio

The factual state of this repository for whoever picks it up next. Every number below was
produced by running the command named beside it, on this tree, at the commit named below.
Nothing here is predicted, and nothing is claimed green that was not observed green.

| | |
| --- | --- |
| **Snapshot commit** | `713b498` — *Give the landing page its own assets, and check that it keeps them* |
| **Branch** | `main` |
| **Captured** | 2026-07-30 |
| **Platform** | Windows-only Electron app (`electron/main.js`), no macOS or Linux target |
| **Public repo** | `Ding-Ding-Projects/codex-material` |

> [!IMPORTANT]
> **This tree moved continuously while this document was being written** — five commits landed
> during the session: `561da4b` → `5ed6e5c` → `ae0e562` → `ac625c2` → `713b498`. Consequences
> you need to know about:
>
> - Two defects that were live at the start were fixed by `5ed6e5c` mid-session. They are
>   recorded under *Recently closed* rather than as open defects, because they were **re-tested
>   after the fix** and are genuinely closed.
> - **The documentation migration described in gap 1 is in progress right now.** The count
>   dropped from 15 stale files to 11 while this was being written. Re-run the grep before
>   acting on it.
> - `app/` has not changed since `ae0e562`, so every frontend finding below (gaps 2, 3, 4) was
>   re-confirmed at this commit and stands.
> - This file was itself swept into commit `713b498` by a concurrent `git add -A`.
>
> If you are reading this at a later commit, re-run the verification block before trusting any
> number in it.

---

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

### 1. Documentation still describes a backend that no longer exists — migration in progress

`561da4b` replaced the Tauri 2 / Rust shell with Electron and deleted `src-tauri/`. The
documentation was not migrated with it. `docs/README.md` still opens with *"built on Tauri 2"*
and still maps `src-tauri/    Rust backend, Tauri 2 configuration…` in its repository tree.

**Verified:** `ls src-tauri` → no such directory.

**Do not trust a count here — run the check.** This was being fixed faster than it could be
written down. The measured trajectory across this single session:

| Observed at | `grep -rl "src-tauri\|Tauri 2" docs/ \| wc -l` |
| --- | --- |
| session start (`561da4b`) | **15** |
| `713b498` | **11** |
| `85e55d9` | **4** |

The last four at `85e55d9` were `docs/build/building-locally.md`, `docs/build/packaging.md`,
`docs/site/app.js` and `docs/site/articles.js` — note that two of them are the **Pages site
scripts**, not Markdown, so a grep restricted to `*.md` will report done while the published
site still says Tauri.

Already migrated: `docs/architecture/tauri-bridge.md` → `docs/architecture/ipc-bridge.md`, plus
`overview.md`, `packaging.md`, `features/tabs.md` and the three remaining feature pages.

The gap is listed first because of what it costs, not what is left of it: documentation that is
confidently wrong sends a newcomer hunting for Rust that was deleted, and discredits the many
pages that are accurate. Verify the current count before starting — it may already be zero.

### 2. `(a?a?)+` still gets past both regex guards and freezes the window

`5ed6e5c` hardened both engines against nested quantifiers and duplicate alternation branches.
A third shape still escapes: a group whose body is ambiguous through **optional** elements
rather than through a repeat or a repeated branch.

**Reproduction, measured on this tree:**

```
CX.evaluate("(a?a?)+$", "", "a".repeat(26) + "b")   →  refused = NONE, ran 154,285 ms
```

The guard's `hasUnbounded("a?a?")` is false (`?` is correctly not treated as unbounded) and
`overlapping("a?a?")` is false (there is only one branch, so `branches()` returns a single
element) — but `a?a?` can match `"a"` two different ways, which is the classic ambiguity that
makes the outer `+` exponential.

Raw cost curve through a plain `RegExp`, sample = *n* × `"a"` + `"b"`:

| n | wall |
| --- | --- |
| 18 | 236 ms |
| 20 | 1,346 ms |
| 22 | 7,718 ms |
| 24 | 44,011 ms |

Both engines are affected. `CX.evaluate` (`app/codex-core.js`) returns `refused = NONE`, and
`CX_CHANGELOG.filter` (`app/cx-changelog.js`) returns `mode = "regex"` rather than `"invalid"`.

**Why it matters:** the regex builder panel calls `CX.evaluate` directly on the user's own
sample text (`app/index.html:1635`), so a user typing this pattern into the builder hangs the
renderer. A single `RegExp.exec` cannot be interrupted from JavaScript, so the 300 ms
`LIMITS.ms` budget — which is only checked *between* matches — cannot reach it. Refusing the
shape before it runs is the only defence, exactly as the existing guard already does for the
other shapes.

The eighteen shapes probed and their verdicts: `(a*)*`, `((a+))+`, `(?:a+)+`, `([a-z]+)+`,
`(\d+|\d+)+`, `(x|xx)+y`, `(a|b|ab)+c`, `(a+|a+)+`, `((a|a)+)+`, `(.*a){20}`, `(a{1,3})+`,
`([ab]+)+`, `(\w|\w)+`, `(a+b?)+`, `^(a+)+`, `(\s|\s)+` — **all refused in 0–1 ms**.
`(a+)\1+` ran cheaply and is not a problem. `(a?a?)+` is the sole escape.

### 3. History coverage is inconsistent across sibling controls

`CX.vcs` (`app/codex-core.js`) is the local git-backed undo system. `vcs.commit()` snapshots
every tracked key at once — `profiles`, `config`, `features`, `appearance`, `tabs`, `prices`,
`cost`, `lang`, `funny`, `settings`, `yolo` — and `revert`/`checkout` write *new* commits
rather than rewriting the log, so undo is itself undoable. That design is sound.

The wiring is not uniform. These controls write a tracked key and never commit, so they
produce **no labelled revision of their own**:

| Location | Control | Writes |
| --- | --- | --- |
| `app/index.html:2984`, `:2986` | Both funny-level sliders | `funny` |
| `app/index.html:3007` | Narrator language picker | `settings` |
| `app/index.html:1652`, `:1661` | Title-bar language selectors | `lang` |
| `app/index.html:2321`, `:2418` | Reset one element's appearance | `appearance` |
| `app/index.html:2419` | `resetAllAppear` — reset **every** element | `appearance` |
| `app/index.html:3082` | `patchAppear` — every typography/colour edit | `appearance` |
| `app/index.html:2216` | Per-model price editor | `prices` |
| `app/index.html:1211` | `setCost` | `cost` |
| `app/index.html:1747` | Switch active profile | `activeProfile` |

The sharpest case is a **matched pair with opposite behaviour**:

- `app/index.html:3072–3073` — *"Reset every element"* in the Studio panel writes `appearance`
  **and** commits. Its own on-screen description reads *"Clears all per-element appearance
  overrides. Recorded in History, so it is undoable."*
- `app/index.html:2419` — `resetAllAppear`, the identical destructive operation reached from
  the appearance editor, writes `appearance` and commits **nothing**.

Same effect, two entry points, only one undoable — and the app's own copy promises the
undoability. The narrator pair has the same shape: the on/off toggle at `:2999` commits, the
language picker beside it at `:3007` does not.

**Nuance worth knowing before you fix it:** because `commit()` snapshots *all* tracked keys, a
value written without a commit still rides into whichever commit happens next. So the failure
mode is "no undo point of its own", not "data lost" — but that is still the difference between
being able to undo a mistake and not.

### 4. Template placeholders reach `<input type="number">` and log console errors

`assets/screenshots/manifest.json` records four real console errors captured from the running
app:

```
The specified value "{{ c.value }}" cannot be parsed, or is out of range.
The specified value "{{ c.priceIn }}" cannot be parsed, or is out of range.
The specified value "{{ c.priceCached }}" cannot be parsed, or is out of range.
The specified value "{{ c.priceOut }}" cannot be parsed, or is out of range.
```

Sources: `app/index.html:352` (`value="{{ c.value }}"`) and `:386`, `:387`, `:388`. The raw
template markup is live in the DOM long enough for the browser to parse the placeholder as a
number before the `dc` runtime substitutes it. The value renders correctly afterwards, so this
is console noise rather than a visible defect — but it is noise that hides real errors.

### 5. A running `codex` process cannot be stopped

`electron/commands.js:126` registers `codex_run`, which awaits `cli.stream(...)` and streams
lines to the window. **No child-process handle is retained and no cancel command exists** —
`grep` for `codex_stop` / `codex_cancel` / `abort` across `app/` and `electron/` returns
nothing. Once a run starts, the only way to stop it is to close the app.

### 6. The installers are unsigned

`package.json` `build.win` sets no `certificateFile`, `certificateSubjectName` or signing hook,
and no signing step exists in `.github/workflows/ci.yml`. The generated release notes state
this honestly. Consequence: SmartScreen warns on first run of every published installer.

### 7. Appearance presets are a stub

`CX.vcs.snapshot()` reads `appearancePresets` (`app/codex-core.js:564`), but **nothing anywhere
writes that key** — there is no named-preset surface. "Export appearance presets"
(`app/index.html:3070–3071`) writes JSON to the **clipboard** via `navigator.clipboard.writeText`,
not to a file, and there is **no import path at all** (no file input, no `readAsText`, no
handler). The changelog viewer, by contrast, does export a real file
(`app/index.html:2578–2583`, a blob download named `codex-studio-changelog.md`), so the
mechanism exists and is simply not used here.

### 8. Content-Security-Policy is set but permissive

A CSP **is** present at `app/index.html:10`. It allows `script-src 'self' 'unsafe-inline'
'unsafe-eval'`, which is why Electron's insecure-CSP warning appears in the captured console
log. The `unsafe-eval` is required by the vendored `dc` template runtime (`app/support.js`);
tightening it means changing how that runtime compiles templates, which is not a small change.
Recorded so nobody reports it as "no CSP" — the warning is about permissiveness, not absence.

### Recently closed — verified fixed, do not re-report

Both were live earlier in this session and were re-tested after `5ed6e5c`:

- **The bounded-repeat guard treated `{n,m}` as safe.** `(a+){1,20}$` used to pass while
  `(a+)+$` was refused — and the refusal message actively recommended the bounded rewrite as
  the safe alternative, so the advice was the defect. Now refused in 0 ms by both engines, and
  the message no longer suggests it. Re-verified: `(a+)+`, `(a+){1,20}`, `(a+){2,}`, `(a|a)+`,
  `(a+)*` and `(\w+\s?)*` all refuse in 0–1 ms.
- **The dim sum toggle wrote its setting without committing.** Now commits at
  `app/index.html:3016` (`"Enabled"/"Disabled" the dim sum surprise`), as does the narrator
  on/off toggle. The narrator *language* picker still does not — see gap 3.

---

## External-state blockers

### GitHub Projects is unreachable — blocker, not a to-do

```
$ gh project list --owner Ding-Ding-Projects
error: your authentication token is missing required scopes [read:project]
To request it, run:  gh auth refresh -s read:project

$ gh auth status
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'
```

The available `gh` token has no `read:project` or `project` scope. Granting it requires an
interactive `gh auth refresh -s read:project`, which re-authorizes a human being's GitHub
account — **an agent must not perform that on someone's account.** Project item creation,
status moves and field updates therefore cannot be done from here.

This is an external-state blocker on the user's credentials, not an unfinished task. The
smallest action that unblocks it: the account owner runs `gh auth refresh -s read:project`
themselves, once.

### Not blockers, for the record

- **Discussions** and the **wiki** are enabled on the repository (`has_discussions: true`,
  `has_wiki: true`).
- **GitHub Pages is now published** (`has_pages: true`). This flipped during the session:
  `713b498` added `docs/site/index.html`, its own copy of the 16 screenshots under
  `docs/site/assets/screenshots/`, and `tools/sync-site-assets.mjs` to keep them in step.
  Two `pages-build-deployment` runs completed successfully. Note that the landing page is
  deployed from the same `docs/` tree that still carries the stale Tauri text in gap 1.
- **No open GitHub issues** on this repository (`gh issue list --state open` → empty).

---

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
