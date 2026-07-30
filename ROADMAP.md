# Roadmap — Codex Studio

Ordered by what would most improve the project if done next. Every item was checked against
the tree at commit `713b498` before it was listed — nothing here is aspirational filler, and
anything already shipped was struck from the list rather than restated as a goal.

> [!NOTE]
> The tree was being actively worked on while this was written, and **item 1 is already in
> progress.** Check current state before starting anything here; `HANDOFF.md` records what had
> and had not been verified at this commit.

Each item says **why it matters** and **what done looks like**, so "done" is a thing you can
check rather than a feeling. Current state and evidence live in [`HANDOFF.md`](HANDOFF.md).

---

## Tier 1 — Correctness and trust

These three are the difference between a project a newcomer can trust and one they cannot.

### 1. Realign the documentation with the Electron shell — *done*

**State:** complete. `561da4b` replaced the Tauri 2 / Rust backend with Electron and deleted
`src-tauri/`; the documentation has caught up.

**Verified with this item's own completion test:**

```
grep -rn "src-tauri\|Tauri 2" docs/
```

Four files still match, and every match is deliberate history or an explicit negative:

| File | What it says |
| --- | --- |
| `docs/build/building-locally.md` | "`src-tauri/` **was deleted** with the Tauri shell" — explaining why `.gitignore` still lists paths that match nothing |
| `docs/build/packaging.md` | "Any Rust or Tauri artifact. `src-tauri/` **no longer exists**" — a list of things the build must *not* produce |
| `docs/site/app.js` | "Electron, **replacing** the Tauri 2 shell at commit `561da4b`" |
| `docs/site/articles.js` | "The desktop shell is Electron. It **was** Tauri 2 **until** commit `561da4b`" |

`docs/features/README.md` states the negative directly: "There is no Rust, no `window.__TAURI__`
and no generic invoke." The README and the wiki home carry the release warning that builds 2–9
are the Tauri shell and render a blank window, which is a fact about published artifacts and
must stay.

**Do not "finish" this by deleting those sentences.** A reader who finds `src-tauri/` in an old
release, an old issue or the git history needs the tree to explain what happened to it. The
requirement was never zero occurrences of the word; it was that nothing describes Tauri as the
*current* backend, and nothing does.

### 2. Close the last regex-guard gap: `(a?a?)+`

**State:** `5ed6e5c` hardened both engines against nested quantifiers and duplicate alternation
branches, and eighteen probed shapes now refuse in 0–1 ms. One family still escapes — a group
whose body is ambiguous through **optional** elements. Measured on this tree:
`CX.evaluate("(a?a?)+$", "", "a".repeat(26) + "b")` returned `refused = NONE` after
**154,285 ms**. `CX_CHANGELOG.filter` accepts it too (`mode = "regex"`, not `"invalid"`).

**Why it matters:** the regex builder hands `CX.evaluate` the user's own pattern and sample
(`app/index.html:1635`). A single `RegExp.exec` cannot be interrupted from JavaScript, so the
300 ms `LIMITS.ms` budget — only ever checked *between* matches — cannot save the window. The
user types a pattern into a builder that exists to be experimented with, and the app stops
responding. Refusing the shape up front is the only defence, and the guard already does exactly
this for every other catastrophic family.

**Done looks like:** `(a?a?)+`, `(a?){10}a{10}` and the same shape behind `(?:…)` are refused in
under 250 ms by **both** `CX.evaluate` and `cx-changelog`'s `nested()`, naming the offending
fragment as the existing refusals do. The ordinary patterns that must keep working — `(a+)?`,
`(a+){1}`, `(a+)\1+`, `\w+\s?` — still evaluate. Tests are added to `tools/test-frontend.mjs`
beside the five shapes it already asserts on, and the refusal message does not recommend a
rewrite that measures worse (the lesson from the `{1,20}` defect).

### 3. Make history coverage uniform

**State:** `CX.vcs` is well designed — one snapshot covers every tracked key, and restoring
writes a *new* commit so undo is itself undoable. The wiring is not uniform. Twelve call sites
write a tracked key and commit nothing: both funny sliders, the narrator language picker, the
two title-bar language selectors, three appearance-reset paths, `patchAppear`, the price
editor, `setCost`, and the profile switcher. Full table in `HANDOFF.md` gap 3.

**Why it matters:** the app promises undoability in its own copy and does not always deliver.
`app/index.html:3072` reads *"Clears all per-element appearance overrides. Recorded in History,
so it is undoable."* — and commits. `app/index.html:2419` performs the identical destructive
reset from the appearance editor and commits nothing. Same effect, two entry points, one
undoable. An undo system with holes is worse than none, because the hole is found at the moment
it was needed.

**Done looks like:** every control that writes a `vcs`-tracked key produces a labelled revision
naming *what* changed ("Reset every element appearance", not "Updated"). All twelve call sites
fixed. A test walks the settings surface and asserts that each mutating control appends exactly
one commit. An unchanged value still records nothing, so the History panel stays a list of real
events.

---

## Tier 2 — Shipping quality

### 4. Code-sign the installers

**State:** `package.json` `build.win` sets no `certificateFile`, `certificateSubjectName` or
signing hook, and `.github/workflows/ci.yml` has no signing step. The generated release notes
say so honestly.

**Why it matters:** every one of the 10 published installers trips SmartScreen on first run.
For an app whose whole proposition is "run this and it works", a scary blue warning at the
first launch is the worst possible first impression — and it trains users to click through
exactly the warning that protects them.

**Done looks like:** a certificate lives in GitHub's secret store (never in chat, a commit or a
log), the release job signs both the NSIS `.exe` and the `.msi`, and a published installer
shows a verified publisher instead of "Unknown publisher". The release notes stop carrying the
"not code-signed" caveat because it is no longer true. **Blocked on the user obtaining a
certificate** — an agent cannot buy one.

### 5. A stop button that actually kills the run

**State:** `electron/commands.js:126` awaits `cli.stream(...)` and keeps no child-process
handle. There is no `codex_stop`, no `codex_cancel` and no abort path anywhere in `app/` or
`electron/`.

**Why it matters:** a Codex run can be long, expensive and wrong from the first line. Right now
the only way to stop one is to close the application — which also kills every pinned WSL shell
and loses the session. A GUI whose entire premise is "you can see what the CLI is doing"
should let you stop what it is doing.

**Done looks like:** `codex_run` retains the child handle keyed by run id; a `codex_stop`
command terminates that process tree (on Windows the `.cmd` shim means killing the direct child
is not enough); the console panel shows a Stop control while a run is live; stopping reports
the partial output and a truthful non-zero result rather than pretending the run finished. A
backend test asserts a spawned process is actually gone after stop.

### 6. Disclose the funny-level behaviour at first run

**State:** half done, and the harder half is the one that shipped. The Language settings section
already states it plainly (`app/index.html:2974`): *"This includes errors, warnings and
destructive confirmations; no category is exempt."* What does not exist is any first-run
surface — `hasLaunchedBefore` is stored, but it is used only to suppress the dim sum draw.

**Why it matters:** the funny level styles destructive and security copy. That is a defensible
design *provided the user is told before they meet it*, and a user who never opens Settings is
never told. The disclosure has to reach them where they start, not only where they configure.

**Done looks like:** first launch shows a brief, dismissible, non-blocking disclosure naming
what the funny level affects (including errors and warnings), offering the level choice, and
stating it can be changed any time. It respects the existing `hasLaunchedBefore` flag, never
blocks startup, never collides with the dim sum surprise, and appears in all three language
modes.

---

## Tier 3 — Feature completeness

### 7. Named appearance presets, exported and imported as files

**State:** `CX.vcs.snapshot()` reads an `appearancePresets` key (`app/codex-core.js:564`) that
**nothing writes** — there is no named-preset surface. "Export appearance presets"
(`app/index.html:3070`) writes JSON to the **clipboard**, and there is no import path at all:
no file input, no `readAsText`, no handler.

**Why it matters:** the point of a preset is surviving a reinstall and being shared. A clipboard
blob with nowhere to paste it back satisfies neither. The mechanism already exists in this
codebase — the changelog viewer downloads a real file at `app/index.html:2578` — so this is
wiring, not invention.

**Done looks like:** users can save the current appearance as a named preset, switch between
presets, export one or all to a `.json` file, and import that file back on a fresh install with
a preview of what will be overwritten. `appearancePresets` is actually written. An import that
carries a property this build cannot represent says so and keeps the user's input rather than
silently dropping it.

### 8. Drag-to-reorder tabs

**State:** not implemented. `grep` for `draggable`, `onDragStart`, `dragover` across
`app/index.html` and `app/cx-tabs.js` returns nothing. Order is persisted and reorder exists in
the model, but there is no pointer path to it.

**Why it matters:** the tab strip is modelled on a browser's, and dragging is how everyone
expects to reorder one. Its absence is the kind of gap that reads as "unfinished" faster than
any missing feature, because the user tries it in the first minute.

**Done looks like:** tabs drag within the strip and into, out of and between groups; pinned tabs
reorder within their own region and cannot be dragged out of it accidentally; a keyboard
equivalent moves the focused tab; order, pinning and group membership survive a restart;
reduced-motion is respected and the drop target is announced to assistive technology.

### 9. A dedicated surface for the four tab searches

**State:** better than it sounds. All four searches exist in the model (`cx-tabs.js`:
`searchStrip`, `searchGroup`, `searchGroups`, `searchAll`), all four are reachable, and the
shared dropdown they render in **does** carry a regex-builder button (`openDdRegex`). The
master search labels the workspace and pinned state.

What the dropdown cannot do: it is reached two menus deep (strip → "Find tabs" → choose);
results are a single label string, so strip, group and pinned state cannot be shown as columns;
no tab-management action can be taken on a result without losing the query; and
`openGroupsSearch`'s `onPick` calls `CX.tabs.toggleCollapsed(g.id)`, **permanently expanding a
collapsed group** to reveal a result rather than revealing it without destroying that
preference.

**Why it matters:** the collapse bug is a real data-losing-a-preference defect, not cosmetic.
The rest is the difference between four searches that technically exist and four searches
someone would use.

**Done looks like:** one search surface, opened by a single shortcut, with a mode selector for
the four scopes and its own anchored regex builder per field. Results identify workspace,
strip, group, pinned state and label in distinct columns. Revealing a result inside a collapsed
group does not persist an expansion the user did not ask for. Permitted tab-management actions
are offered inline without clearing the active query.

### 10. A calendar picker for the changelog date filter

**State:** the typed-date half is genuinely good — `cx-changelog.js`'s `parseDate` handles ISO
and locale order, reports partial input without consuming what was typed, and distinguishes
"needs a day" from "month 13 does not exist" from "that year is ambiguous". Seven presets exist.
What is missing is the calendar: `clogFrom` and `clogTo` are plain text inputs
(`app/index.html:482`) with a preset dropdown beside them. There is no month grid.

**Why it matters:** typing a date is precise and slow; picking one is fast and imprecise. A date
filter wants both, and the parsing groundwork — the expensive part — is already done and tested.

**Done looks like:** an anchored calendar popover with month/year jump and range selection,
sharing state bidirectionally with the typed fields so editing either updates the other. The
presets remain. Invalid typed input still reports inline without discarding what the user typed.
Keyboard-operable with a visible focus ring and screen-reader-announced dates.

### 11. Auto-update

**State:** not implemented. No `electron-updater` dependency, no `publish` block in
`package.json` `build`, no update check anywhere.

**Why it matters:** ten releases have shipped in a single day. Without an update path every user
stays on whichever installer they happened to download, and every fix above reaches nobody who
already installed.

**Done looks like:** the app checks for a newer release, tells the user through the existing
non-blocking notification centre (never a modal), downloads in the background and applies on
next launch. It never updates without consent and never restarts under the user mid-run.
Sequencing note: this should land **after** code signing — shipping an auto-updater that
installs unsigned binaries is a worse security posture than having no updater.

### 12. arm64 builds

**State:** `package.json` `build.win.target` lists `arch: ["x64"]` for both NSIS and MSI.

**Why it matters:** Windows on ARM is a small but growing slice, and x64 emulation is a poor
experience for an app that spawns a 410 MB native CLI. Listed last honestly: there is no
evidence of demand for this project yet, and the bundled Codex CLI would need an arm64 build
staged by `tools/fetch-codex.mjs` before the installer could be anything but x64 under
emulation. Do not start this before confirming an arm64 `codex` binary exists to bundle.

**Done looks like:** `tools/fetch-codex.mjs` stages the arm64 CLI, the win target builds both
architectures, CI publishes both to the same release with distinguishable artifact names, and
the arm64 installer is confirmed to run natively rather than under emulation.

---

## Smaller items worth doing while nearby

- **Template placeholders in number inputs.** `app/index.html:352`, `:386`, `:387`, `:388`
  render `value="{{ c.value }}"` into `<input type="number">`, producing four real console
  errors captured in `assets/screenshots/manifest.json`. The rendered value is correct, so this
  is noise — but noise is where real errors hide. Done: the capture harness records zero
  console errors from the app's own markup.
- **Re-check the Pages site after item 1.** Publishing shipped during this session (`713b498`
  added `docs/site/index.html` and `tools/sync-site-assets.mjs`; `has_pages` is now `true` and
  two deployments succeeded). It went live *before* the doc migration finished, so the site is
  currently serving the stale Tauri description. Not a new build task — just verify the
  published pages once item 1 lands.

## Considered and deliberately not scheduled

- **Tightening the Content-Security-Policy.** A CSP *is* set (`app/index.html:10`); it permits
  `script-src 'unsafe-inline' 'unsafe-eval'`, which is what triggers Electron's insecure-CSP
  warning. The `unsafe-eval` is required by the vendored `dc` template runtime
  (`app/support.js`), so removing it means replacing how that runtime compiles templates. That
  is a large, risky change for a renderer that loads no remote origin and is sandboxed with
  `nodeIntegration: false`. Recorded, not scheduled, and explicitly not "no CSP".

---

## 中文摘要

呢份 roadmap 每一項都對住 commit `713b498` 嘅真實 code 查過先寫，做咗嘅嘢直接剷走，唔會當
目標再吹一次。**第一項而家有人做緊**，開工前記得睇返最新狀態。

**第一級（信唔信得過呢個 project）：** 一，文件仲有得執——`src-tauri/` 喺 `561da4b` 已經冇咗，
但仲有檔喺度講 Tauri。呢樣有人執緊，執得好快（一個 session 由 15 個跌到 11 個再跌到 4 個），
所以唔好信呢度個數字，自己行 `grep -rl "src-tauri\|Tauri 2" docs/` 睇下仲剩幾多。**要留意**
剩低嗰啲有兩個係 Pages 個網站嘅 `.js`，唔係 `.md`，淨係 grep `*.md` 會以為做完咗，但個網站
仲喺度講 Tauri——而家 Pages 上咗線，即係錯嘢直接見人。二，`(a?a?)+` 呢個
pattern 仲穿得過兩個引擎，實測 **154 秒**，喺 regex builder 度打得出就凍死成個 app。三，
History 記錄唔齊：同一個「reset 晒外觀」，Studio 面板嗰粒有得 undo（佢自己個說明仲寫住
「可以 undo」），外觀編輯器嗰粒冇——有窿嘅 undo 系統仲衰過冇。

**第二級（出得街未）：** 簽名（而家 10 個 release 嘅 installer 開親都畀 SmartScreen 嚇一嚇）、
**停得郁**嘅 stop 掣（而家要熄咗成個 app 先停到一個 run）、第一次開 app 要講清楚幽默程度
連 error 都會變（設定入面已經寫咗，但唔開設定嘅人永遠唔知）。

**第三級（功能齊唔齊）：** 外觀 preset 要存到檔（而家淨係抄去剪貼簿，仲要冇得 import）、
tab 拖得郁、四個 tab 搜尋要有自己嘅畫面（順手修好「搵一搵就永久展開咗個收埋咗嘅 group」
呢個 bug）、changelog 加個月曆（打字嗰半已經做得好好）、自動更新（**要簽咗名先做**，唔係
等於幫人自動裝未簽名嘅嘢）、同 arm64（老實排最後，未見有人要，而且要先有 arm64 嘅 codex
binary 先包得到）。
