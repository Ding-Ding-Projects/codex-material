# Continuous integration and releases

> **TL;DR** — Every push to `Ding-Ding-Projects/codex-material` runs the full test suite on a
> GitHub-hosted Windows runner. If the tests pass, the same run builds the Windows bundle and
> publishes one non-draft GitHub Release with the `.exe` and `.msi` installers attached. If any
> test fails, no release is created at all.
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

There is **no `pull_request` trigger**, deliberately. A `pull_request` run would build code from
a fork on a runner that holds a write-scoped token, and this workflow publishes releases — that
combination is an attack path, not a convenience.

Codex Studio is a Windows-only Tauri app, so there is exactly one runner: `windows-latest`
(GitHub-hosted). There are no Linux or macOS jobs, and adding one would only produce a bundle
nobody can install.

---

## Job 1 — `Test`

Runs on `windows-latest`, in this order:

1. **Checkout** with `submodules: false`. `vendor/codex` is the upstream Codex CLI source tree.
   The app shells out to whatever `codex` binary the user has installed and never compiles it, so
   cloning that submodule would cost minutes of runner time and change nothing about the build.
2. **Rust stable** via `dtolnay/rust-toolchain@stable`, with the `rustfmt` and `clippy` components.
3. **Cargo cache** via `Swatinem/rust-cache@v2`, scoped to `src-tauri -> target` and keyed on
   `Cargo.lock` (the action derives its key from the lockfile plus the toolchain version). The test
   job and the release job use separate cache lanes (`key: test` / `key: release`) because one
   holds debug artifacts and the other holds release artifacts; sharing one lane would make each
   job evict the other's cache on every run.
4. **Node 22** via `actions/setup-node@v4`.

Then the four checks that gate the release:

| Check | Command | Working directory |
| --- | --- | --- |
| Formatting | `cargo fmt --all -- --check` | `src-tauri` |
| Lint | `cargo clippy --all-targets -- -D warnings` | `src-tauri` |
| Rust tests | `cargo test` | `src-tauri` |
| Frontend tests | `node tools/test-frontend.mjs` | repository root |

Every clippy warning is an error (`-D warnings`). That is intentional: a warning nobody is forced
to read is a warning nobody reads.

---

## Job 2 — `Build and release`

Declared as `needs: test`. That is the whole enforcement mechanism for "a failed test creates no
release" — it is a structural dependency in the workflow graph, not a convention someone has to
remember. If any step of `Test` fails, `Build and release` never starts, so there is no code path
in which a red run can publish anything.

The job checks out again (this time with `fetch-depth: 0`, because the release notes need the tag
history), reinstalls Rust and Node, then:

```
npm install --no-save "@tauri-apps/cli@^2"
npx tauri build --bundles nsis,msi
```

The repository has no `package.json` on purpose — the frontend is plain files with no build step —
so the Tauri CLI is installed as a build-time tool with `--no-save` and is never vendored.
`.gitignore` already covers `node_modules/` and `package-lock.json`.

### The installers are verified before anything is published

After the build, a step walks `src-tauri/target/release/bundle/nsis` and
`src-tauri/target/release/bundle/msi` and fails the job with a `::error::` annotation if either is
empty. The release step then passes `fail_on_unmatched_files: true`, so the publish itself also
refuses to proceed on an unmatched glob.

Both guards exist because **a release with no installer attached is a failed build wearing a
success badge**. It is worse than a red run: a red run tells you something broke, while an empty
release tells a user to download nothing.

---

## What a release contains

| | |
| --- | --- |
| **Tag** | `v<version>+build.<run_number>` — see below |
| **Draft** | No. Every published release is real and visible. |
| **Prerelease** | No. |
| **Assets** | `*-setup.exe` (NSIS, per-user install, no admin rights) and `*.msi` (Windows Installer, for managed deployment). Both install the same build. |
| **Body** | Generated at build time — see [Release notes](#release-notes). |

The installers are **not code-signed**. SmartScreen will warn on first run. The workflow does not
install or launch them on a clean machine, and the release notes say so rather than implying a
smoke test that never happened.

---

## How the tag is made unique

The version is read out of `src-tauri/tauri.conf.json` at build time, never hard-coded in the
workflow:

```powershell
$conf = Get-Content -Raw -Path src-tauri/tauri.conf.json | ConvertFrom-Json
$version = $conf.version
```

The tag is then `v$version+build.$suffix`, where `$suffix` is `github.run_number` — a counter that
GitHub increments for every run of this workflow and never reuses. So `0.1.0` shipped four times
produces `v0.1.0+build.12`, `v0.1.0+build.13`, `v0.1.0+build.14`, `v0.1.0+build.15`: monotonic,
never recycled, and no `tauri.conf.json` bump required to ship again.

Two edge cases are handled explicitly:

- **Re-running a run** keeps the same `run_number`, which would collide. When
  `github.run_attempt > 1` the attempt number joins the suffix, giving `v0.1.0+build.13.2`.
- **A tag that somehow already exists** stops the job with an error before the build is published.
  Tags here are immutable; the workflow will never move, delete, or overwrite one. If you see that
  error, the correct fix is a new run, not a force-push.

The `+build.N` form is [semver build metadata](https://semver.org/#spec-item-10). `+` is a legal
character in a Git ref, though it appears percent-encoded as `%2B` in download URLs.

If `tauri.conf.json` has no `version` field, the job fails immediately rather than publishing a
release it cannot name.

---

## Release notes

Generated from the commit range since the previous tag:

```powershell
$prev  = git tag --list 'v*' --sort=-creatordate | Select-Object -First 1
$range = if ($prev) { "$prev..HEAD" } else { 'HEAD' }
git log --no-merges --max-count=200 --pretty=format:'- %s (`%h`)' $range
```

On the very first release there is no previous tag, so the range is the whole history and the
heading reads "Changes since the start of the repository".

Every release body states the **exact commit SHA** it was built from (linked to the commit) and
the **workflow run URL**, so any claim in the notes can be checked against the run that made it.

The notes list the four checks by name and say plainly that they were green in that run — which is
true by construction, because `needs: test` means the release job cannot run otherwise. They also
state what was *not* verified: no signing, no install test on a clean machine. The notes never
describe a check that has not finished.

The body is bilingual (English plus Hong Kong Cantonese), and both languages carry the same facts —
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

The workflow declares `permissions: contents: write`, which is what the `GITHUB_TOKEN` fallback
needs in order to create a tag and a release.

The token is passed **only** through the `GH_TOKEN` environment convention and read from
`env.GH_TOKEN` at the single point that needs it. It is never echoed, never interpolated into a log
line, and never written to a file. Secrets reach GitHub only through GitHub's own secret store —
never through a commit, a chat message, an issue, or an agent's hands.

---

## Actions used

All pinned by major tag, all currently maintained:

| Action | Purpose |
| --- | --- |
| `actions/checkout@v4` | Checkout, submodules disabled |
| `dtolnay/rust-toolchain@stable` | Rust stable toolchain, `rustfmt` + `clippy` |
| `Swatinem/rust-cache@v2` | Cargo registry and target cache |
| `actions/setup-node@v4` | Node 22 |
| `softprops/action-gh-release@v2` | Tag, release, asset upload |

---

## How to read a failure

Open the failed run from the Actions tab. The failing step is the one with the red cross; expand it
and read from the **bottom** of the log, where the actual error is.

| Failing step | What it means | What to do |
| --- | --- | --- |
| **Check formatting** | Some Rust file is not `rustfmt`-clean. The log shows a diff of what `rustfmt` wants. | Run `cargo fmt --all` in `src-tauri`, commit the result. |
| **Lint** | Clippy found something, and `-D warnings` promoted it to an error. Each finding names its file, line, and lint. | Fix it, or add a justified `#[allow(...)]` at the narrowest scope with a comment saying why. |
| **Rust tests** | A `#[test]` failed. The log names the test and prints its assertion. | Reproduce locally with `cargo test <name> -- --nocapture` in `src-tauri`. |
| **Frontend tests** | `node tools/test-frontend.mjs` exited non-zero. | Run the same command locally; the runner prints which case failed. A `MODULE_NOT_FOUND` here means the test runner file itself is missing, not that a test failed. |
| **Install the Tauri CLI** | npm could not fetch `@tauri-apps/cli`. Almost always a transient registry problem. | Re-run the job. If it repeats, check npm status before suspecting the repo. |
| **Build the Windows bundle** | `tauri build` failed. Scroll up past the bundler noise to the first `error[E….]` or `error:` line — that is the real cause; everything after it is fallout. | Reproduce with `npx tauri build` locally on Windows. |
| **Verify the installers exist** | The build reported success but produced no `.exe` or `.msi`. Usually a `bundle.targets` or WiX/NSIS problem, not a compile problem. | Check `bundle.targets` in `tauri.conf.json` and read the bundler section of the build log. |
| **Publish the release** | The build was fine but the release could not be created. | `403` means the token lacks `contents: write` — check `ORG_TOKEN`/`RELEASE_TOKEN`. `422 already_exists` means the tag was taken. `fail_on_unmatched_files` means the globs matched nothing. |
| **Resolve version and tag** | Either `tauri.conf.json` has no `version`, or the computed tag already exists. | Both are stated verbatim in the error annotation. Neither is fixed by re-running the same attempt. |

Two things are always true when a run is red:

- **No release was published.** The release job is gated on the test job, and the publish step is
  the last step of the release job. A red run leaves the release list untouched.
- **No existing tag or release was modified.** This workflow only ever creates; it never moves,
  overwrites, or deletes a tag or a release.

If the `Test` job is green but `Build and release` is red, the code is fine and the packaging is
not. That distinction is the reason the two jobs are separate.

---

## Running the same checks locally

Before pushing, on Windows:

```powershell
cd src-tauri
cargo fmt --all -- --check
cargo clippy --all-targets -- -D warnings
cargo test
cd ..
node tools/test-frontend.mjs
npx tauri build --bundles nsis,msi
```

That is the same sequence CI runs, in the same order. Passing it locally is not proof CI will pass
— the runner is a clean machine with a different cache — but failing it locally is proof CI will
fail, which is the cheaper thing to find out.
