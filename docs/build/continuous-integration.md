# Continuous integration and releases

> **TL;DR** — Every push to `Ding-Ding-Projects/codex-material` runs the whole test suite on a
> GitHub-hosted Windows runner. If it passes, the same run stages the Codex CLI, builds the NSIS and
> MSI installers, and publishes one non-draft GitHub Release with both attached. If any check fails,
> no release is created at all.
>
> **一句話** — 每次 push 都會喺 GitHub 嘅 Windows runner 上面行晒所有 test。Test 綠晒先會 build，
> build 完會出一個 release，`.exe` 同 `.msi` 兩個安裝檔都會 attach 埋。有一個 test 紅咗，
> 就完全冇 release —— 唔係出一個空嘅 release，係一個都冇。

The workflow lives at [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).

---

## What triggers a build

| Trigger | When it fires |
| --- | --- |
| `push` | Every push, to every branch. No branch filter, no path filter. |
| `workflow_dispatch` | Manual runs from the Actions tab, on any ref. |

There is **no `pull_request` trigger**, deliberately. A `pull_request` run would build code from a
fork inside a workflow that holds a write-scoped token and publishes releases — that combination is
an attack path, not a convenience.

Codex Studio is a Windows-only Electron app, so there is exactly one runner: `windows-latest`
(GitHub-hosted). No self-hosted runner is involved. There are no Linux or macOS jobs, and adding one
would only produce a bundle nobody can install.

The workflow declares `permissions: contents: write` at the top level — enough to create a tag and a
release, and nothing more.

---

## Job 1 — `Test`

Runs on `windows-latest`:

1. **Checkout** with `submodules: false`. `vendor/codex` is the upstream Codex CLI *source* tree.
   The app shells out to a `codex` binary and never builds one, so cloning that submodule would cost
   runner minutes and change nothing.
2. **Node 22** via `actions/setup-node@v4`.
3. **`npm install --ignore-scripts`.** The tests import plain modules and never launch Electron, so
   the ~331 MB Electron download is skipped here and paid for once, in the release job.

Then the four checks that gate the release:

| Check | Command |
| --- | --- |
| Frontend module tests | `node tools/test-frontend.mjs` |
| Backend module tests | `node tools/test-backend.mjs` |
| The bundled changelog matches the root copy | `node tools/sync-changelog.mjs --check` |
| Every file parses | A PowerShell step running `node --check` over every `.js` / `.mjs` / `.cjs` under `app/`, `electron/` and `tools/`, excluding `node_modules` |

At the time of writing the two suites report **23 frontend tests** and **22 backend tests**, all
passing, neither requiring Electron or a `codex` binary.

The parse sweep exists because a syntax error in a module the unit tests never import would sail
straight through them. It collects every failing path and emits a single `::error::Syntax errors
in: …` annotation rather than stopping at the first one, so one run tells you about all of them.

---

## Job 2 — `Build and release`

Declared as `needs: test`. That is the whole enforcement mechanism for "a failed test publishes no
release" — a structural dependency in the workflow graph, not a convention someone has to remember.
If any step of `Test` fails, `Build and release` never starts, so there is no code path in which a
red run can publish anything.

It checks out again with `fetch-depth: 0` (the release notes need the previous tag and the commit
range behind it), installs Node 22, then runs `npm install --foreground-scripts` — this job *does*
need the postinstall scripts: one downloads the Electron binary, the other selects a 7-Zip build for
electron-builder.

The steps, in order:

| Step | What it does |
| --- | --- |
| **Resolve version and tag** | Reads `version` out of `package.json`, computes the tag, and refuses to continue if the version is blank or the tag already exists. |
| **Resolve the dim sum code name** | Derives a dish from the run number, and stages its photo when one is bundled. Never blocks the release, and a missing photo never costs the build its name. |
| **Mirror the changelog into the frontend** | `node tools/sync-changelog.mjs` |
| **Stage the bundled Codex CLI** | `node tools/fetch-codex.mjs`, then sets a `bundled` output from whether `vendor/codex-bin/bin/codex.exe` exists. |
| **Build the Windows installers** | `npx electron-builder --win nsis msi --publish never` |
| **Verify the installers exist** | Fails the job if `dist\` holds no `.exe` or no `.msi`, and prints each artifact's real size in MB. |
| **Write release notes** | Generates `release-notes.md` from the tag, the commit, the run, and the commit range. |
| **Publish the release** | `softprops/action-gh-release@v2`, non-draft, with both installers attached. |
| **Attach the dim sum photo** | A second, separate upload — only when the named dish's photo is bundled. |

### The installers are verified before anything is published

Two independent guards. The *Verify the installers exist* step walks `dist\` and fails with an
`::error::` annotation if either format is missing. The publish step then passes
`fail_on_unmatched_files: true`, so the upload itself also refuses to proceed on a glob that matched
nothing.

Both exist because **a release with no installer attached is a failed build wearing a success
badge**. It is worse than a red run: a red run tells you something broke, while an empty release
tells a user to download nothing.

### The CLI is staged, not required

`fetch-codex.mjs` downloads roughly 410 MiB of Codex CLI into `vendor/codex-bin` so the installer
carries one — see [bundled-cli.md](bundled-cli.md). If it does not produce
`vendor/codex-bin/bin/codex.exe`, the step emits a `::warning::` and sets `bundled=false` instead of
failing. The release still ships, and the generated notes then say plainly that this build does
**not** bundle the CLI, rather than letting a user find out after installing.

---

## How the tag is made unique

The version is read from `package.json` at build time, never hard-coded in the workflow:

```powershell
$pkg = Get-Content -Raw -Path package.json | ConvertFrom-Json
$version = $pkg.version
```

The tag is `v$version+build.$suffix`, where `$suffix` is `github.run_number` — a counter GitHub
increments for every run of this workflow and never reuses. So `0.1.0` shipped four times produces
`v0.1.0+build.12`, `v0.1.0+build.13`, `v0.1.0+build.14`, `v0.1.0+build.15`: monotonic, never
recycled, and no version bump required to ship again.

Two edge cases are handled explicitly:

- **Re-running a run** keeps the same `run_number`, which would collide. When
  `github.run_attempt > 1` the attempt number joins the suffix, giving `v0.1.0+build.13.2`.
- **A tag that somehow already exists** stops the job before anything is published, with the message
  *"Tags are immutable here; nothing was overwritten and no release was published."* The correct fix
  is a new run, never a force-push.

The `+build.N` form is [semver build metadata](https://semver.org/#spec-item-10). `+` is legal in a
Git ref, though it appears percent-encoded as `%2B` in download URLs.

If `package.json` has no `version`, the job fails immediately rather than publishing a release it
cannot name.

---

## The dim sum code name

Every build carries a dish name beside its version — *Classic Har Gow · 蝦餃*, and so on. It is a
label for talking about a build, never a replacement for the version.

```powershell
$json = node tools/release-codename.mjs --derive $env:GITHUB_RUN_NUMBER | ConvertFrom-Json
```

- **Derived, not claimed.** `--derive N` returns `roster.dishes[N - 1]` from
  `app/dimsum/roster.json`. CI deliberately does not use the tool's `--assign` mode, because
  writing the ledger back would mean the release job pushes to the branch that triggered it — that
  is how a release pipeline becomes an infinite loop. Deriving from the monotonic run number gives
  the same one-dish-per-build guarantee and stays auditable, because the tag reproduces the choice.
- **The name list and the photo list are different sizes, on purpose.** `roster.json` names all
  **703** dishes the shared catalog holds; `app/dimsum/manifest.json` describes the **72** whose
  256px photo is bundled in the installer. The catalog's originals are ~2.3 MB each, so bundling
  every photo would add well over a hundred megabytes to an app that draws one dish at 56 CSS
  pixels, once per hundred launches — while 703 *names* cost 356 KB. A build named after a dish
  outside the photo slice publishes the name and no picture, and the release notes say so.
  `roster.json` is excluded from the packaged app in `package.json` ▸ `build.files`: only the
  release tooling reads it, and it runs from the checkout, never from the installed app.
- **Not modulo.** Past the end of the roster the tool reports `assigned: false` with a reason
  rather than wrapping, because a code name that identifies two builds identifies neither. Grow the
  catalog and re-run `tools/sync-dimsum-roster.mjs` to extend the sequence.
- **The photo is validated before it is published.** When there is one, the step loads the PNG
  through `System.Drawing` and prints its dimensions; a truncated image that GitHub would happily
  serve is worse than no photo.
- **It never blocks a release, and a missing photo never costs a build its name.** The `assigned`
  output settles the name; a separate `photo` output settles the picture. No dish at all, a file
  that is not there, or an image that will not decode each produce a `::notice::` or `::warning::`
  and a release published without the picture — with the code name still in the title.
- **The photo upload is a separate step** from the installers, on purpose: the installers must fail
  the job if missing, while a missing photo must not stop shipping.

The release title becomes `Codex Studio 0.1.0 (build 42)` — with ` · <dish>` appended when a code
name was resolved.

---

## Release notes

Generated from the commit range since the previous tag:

```powershell
$prev  = git tag --list 'v*' --sort=-creatordate | Select-Object -First 1
$range = if ($prev) { "$prev..HEAD" } else { 'HEAD' }
git log --no-merges --max-count=200 --pretty=format:'- %s (`%h`)' $range
```

On the very first release there is no previous tag, so the range is the whole history and the
heading reads *"Changes since the start of the repository"*.

Every body states the **exact commit SHA** it was built from (linked), the **workflow run URL**, and
the runner it used, so any claim in the notes can be checked against the run that made it. It then
lists the four checks by name and says they were green in that run — true by construction, because
`needs: test` means the release job cannot run otherwise.

It is equally explicit about what was **not** verified: the installers are not code-signed, and the
workflow never installs or launches them on a clean machine. The notes say SmartScreen will warn and
that you are trusting the commit above. They never describe a check that has not finished.

The body is bilingual — English plus Hong Kong Cantonese — and both languages carry the same facts:
the same tag, the same commit, the same list of what was and was not verified.

---

## The token

Resolved once, at job level, as a fallback chain:

```yaml
GH_TOKEN: ${{ secrets.RELEASE_TOKEN || secrets.ORG_TOKEN || secrets.GITHUB_TOKEN }}
```

| Secret | What it is | When it is used |
| --- | --- | --- |
| `RELEASE_TOKEN` | Optional repository-scoped fine-grained PAT | First choice, if the repository defines it |
| `ORG_TOKEN` | Organization-wide Actions secret | Used when `RELEASE_TOKEN` is unset |
| `GITHUB_TOKEN` | The ephemeral per-run workflow token | Last-resort fallback |

`permissions: contents: write` is what the `GITHUB_TOKEN` fallback needs in order to create a tag
and a release.

The token is passed **only** through the `GH_TOKEN` environment convention and read from
`env.GH_TOKEN` at the two steps that need it. It is never echoed, never interpolated into a log
line, and never written to a file. Secrets reach GitHub only through GitHub's own secret store —
never through a commit, a chat message, an issue, or an agent's hands.

---

## Actions used

All pinned by major tag, all currently maintained:

| Action | Purpose |
| --- | --- |
| `actions/checkout@v4` | Checkout, submodules disabled |
| `actions/setup-node@v4` | Node 22 |
| `softprops/action-gh-release@v2` | Tag, release, asset upload (used twice: installers, then the photo) |

Everything else is a plain `run:` step — `npm`, `node`, `npx electron-builder`, and PowerShell.

---

## How to read a failure

Open the failed run from the Actions tab. The failing step has the red cross; expand it and read
from the **bottom** of the log, where the actual error is.

| Failing step | What it means | What to do |
| --- | --- | --- |
| **Frontend module tests** | `node tools/test-frontend.mjs` exited non-zero. | Run it locally; the runner names the failing case and prints a per-file summary. |
| **Backend module tests** | `node tools/test-backend.mjs` exited non-zero. One case asserts that every command in `electron/preload.js` is registered in `electron/commands.js` — if that is the failure, you added a command to one file only. | Run it locally. |
| **The bundled changelog matches the root copy** | `app/CHANGELOG.md` drifted from the root file. | `node tools/sync-changelog.mjs`, then commit the mirror. |
| **Every file parses** | A `node --check` failed. The annotation lists every offending path. | Fix the syntax error; the file is named in full. |
| **Install dependencies** | npm could not resolve or fetch a package, or an Electron postinstall failed. Usually transient. | Re-run the job. If it repeats, check npm and the Electron download host before suspecting the repo. |
| **Resolve version and tag** | Either `package.json` has no `version`, or the computed tag already exists. | Both are stated verbatim in the annotation. Neither is fixed by re-running the same attempt — a re-run bumps `run_attempt` and changes the tag, which resolves the collision case. |
| **Stage the bundled Codex CLI** | This step does not fail the job; it warns. If you see `::warning::No CLI staged`, the release shipped without a bundled CLI. | Check the log for the `fetch-codex.mjs` error — almost always a registry problem. |
| **Build the Windows installers** | `electron-builder` failed. Scroll past the packaging noise to the first `⨯` or `Error:` line; everything after it is fallout. | Reproduce with `npx electron-builder --win nsis msi --publish never` on Windows. A WiX download failure fails the MSI target specifically. |
| **Verify the installers exist** | The build reported success but produced no `.exe` or no `.msi`. | Read the packaging section of the build log; this is a target problem, not a code problem. |
| **Publish the release** | The build was fine but the release could not be created. | `403` means the token lacks `contents: write` — check `RELEASE_TOKEN` / `ORG_TOKEN`. `422 already_exists` means the tag was taken. `fail_on_unmatched_files` means the globs matched nothing in `dist\`. |
| **Attach the dim sum photo** | Only runs when the named dish's photo is bundled, and only uploads `release-assets/*.png`. | A failure here means the release and its installers are already published; the photo is missing, nothing else. |

Two things are always true when a run is red:

- **No release was published.** The release job is gated on the test job, and the publish step is
  near the end of the release job. A red run leaves the release list untouched.
- **No existing tag or release was modified.** This workflow only ever creates; it never moves,
  overwrites, or deletes a tag or a release.

If `Test` is green but `Build and release` is red, the code is fine and the packaging is not. That
distinction is the reason the two jobs are separate.

---

## Running the same checks locally

Before pushing, on Windows:

```powershell
npm install
npm test                                                # the first three checks, in CI's order
npm run dist                                            # stages the CLI and builds both installers
```

`npm test` is literally the first three CI checks chained together. The fourth — the parse sweep —
has no npm script; run it directly if you want the same coverage:

```powershell
Get-ChildItem -Path app, electron, tools -Recurse -Include *.js, *.mjs, *.cjs |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { node --check $_.FullName }
```

Passing all of it locally is not proof CI will pass — the runner is a clean machine with no cache
and no staged CLI — but failing it locally is proof CI will fail, which is the cheaper thing to find
out.
