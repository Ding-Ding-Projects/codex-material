# The bundled Codex CLI

> Codex Studio ships a complete copy of the Codex CLI — about **410 MiB unpacked**, the largest
> thing in the installer by an order of magnitude. This page explains why, how it is staged, how the
> app decides which `codex` to run, and how to build without it.

## Why it ships

Studio is a front end. Every panel either invokes the real `codex` binary or reads a real file; none
of the agent, sandbox, config-schema or plugin behaviour is reimplemented. That makes the CLI a hard
runtime dependency, and a GUI that installs cleanly and then reports "could not run `codex`" on
every surface is not a useful first launch.

So the installer carries one. The important half of the design is the other way round:

> **The user's own `codex` always wins.** It owns their login, their `~/.codex` and their update
> channel. Quietly shadowing it with a second copy is how a machine ends up "logged out" in this app
> and logged in everywhere else.

The bundled copy is a fallback for a machine that has none, not a preferred binary.

## Resolution order

`electron/lib/cli.js`, `resolveCodex()`, in this exact order:

| # | Candidate | `binSource` reported to the UI | `bundled` |
| --- | --- | --- | --- |
| 1 | `process.env.CODEX_BIN` | `CODEX_BIN` | `false` |
| 2 | The first line of `where codex` (`which` off Windows) | `installed on this machine` | `false` |
| 3 | `process.resourcesPath\codex-bin\bin\codex.exe` (packaged), then `vendor\codex-bin\bin\codex.exe` relative to `electron/lib/` (checkout) | `bundled with Codex Studio` | `true` |
| 4 | Nothing found — falls back to the bare name `codex` | `not found` | `false` |

Two consequences worth knowing:

- **The result is cached in module scope.** `resolved` is computed once, on the first call, because
  probing `PATH` would otherwise add a process spawn to every invocation. Changing `CODEX_BIN` or
  `PATH` therefore needs an app restart, not a reload.
- **Step 4 is deliberate.** When nothing resolves, the app runs the bare name so the failure message
  names the real problem — *could not run `codex`* — rather than a path nobody recognises.

The `codex_version` command returns `bin`, `binSource` and `bundled` alongside the version string,
so the UI can state which binary it is actually using instead of implying one.

## How `tools/fetch-codex.mjs` stages it

```powershell
node tools/fetch-codex.mjs           # the latest published version
node tools/fetch-codex.mjs 0.146.0   # a specific one
node tools/fetch-codex.mjs --check   # report what is staged, download nothing
npm run prepare:cli                  # same as the first form
```

`npm run dist` runs it as its second step, so a release build always stages a fresh copy.

What it does, in order:

1. **Resolve the version.** With no argument it runs `npm view @openai/codex version`.
2. **Pack the platform build.** The Windows binary is published as a *version* of `@openai/codex`,
   not as a separate package: the spec is `@openai/codex@<version>-win32-x64`. The bare
   `@openai/codex-win32-x64` name that appears in the upstream manifest is an npm **alias**, and
   `npm pack` will not resolve it — which is the whole reason this script composes the spec by hand.
   The artifact is OpenAI's own published release, not a mirror.
3. **Extract into a temp directory** under `%TEMP%\codex-fetch-<timestamp>`. It prefers
   `%SystemRoot%\System32\tar.exe` — the bsdtar Windows ships — because GNU tar (the copy Git for
   Windows puts on `PATH`) reads `C:\…` as a remote host and tries to open an rsh connection to a
   machine called `C`. If the system tar is absent it falls back to `tar --force-local`.
4. **Copy the whole platform tree.** `package/vendor/x86_64-pc-windows-msvc` is copied wholesale
   into `vendor/codex-bin/`, replacing whatever was there.
5. **Verify and stamp.** If `bin/codex.exe` is missing afterwards it exits 1. Otherwise it runs
   `codex.exe --version` (tolerating a binary that will not answer), measures the tree, and writes
   `vendor/codex-bin-version.json`.
6. **Clean up** the temp directory.

### The whole tree ships, or none of it does

The CLI is not a lone executable. It resolves its helpers *relative to itself*, and
`codex-package.json` inside the staged tree spells the layout out:

```json
{ "layoutVersion": 1, "version": "0.146.0", "target": "x86_64-pc-windows-msvc",
  "variant": "codex", "entrypoint": "bin/codex.exe",
  "resourcesDir": "codex-resources", "pathDir": "codex-path" }
```

| Path in `vendor/codex-bin/` | Size | What it is |
| --- | --- | --- |
| `bin\codex.exe` | 358 650 672 bytes (342 MiB) | The CLI itself |
| `bin\codex-code-mode-host.exe` | 56 309 040 bytes (53.7 MiB) | The code-mode host |
| `codex-path\rg.exe` | 4.1 MiB | ripgrep, put on the CLI's own search path |
| `codex-resources\` | 9.7 MiB | `codex-command-runner.exe`, `codex-windows-sandbox-setup.exe` |
| `codex-package.json` | 215 bytes | The layout manifest above |
| **Total** | **429 285 783 bytes (409.4 MiB)** | |

Copying `codex.exe` alone produces a binary that starts and then fails the moment it needs ripgrep
or the sandbox setup helper. That is why `extraResources` copies the directory with a `**/*` filter
rather than picking files out of it.

### The staging stamp

```json
{
  "spec": "@openai/codex@0.146.0-win32-x64",
  "version": "codex-cli 0.146.0",
  "bytes": 429285783,
  "stagedAt": "2026-07-30T05:51:35.180Z"
}
```

`vendor/codex-bin-version.json` is committed, so the repository records which upstream artifact the
last staging run pulled even though the binaries themselves are git-ignored. `--check` reports the
staged `codex.exe` and its size, and exits 1 when nothing is staged — useful as a cheap guard in a
script.

## Where it ends up

`package.json` copies the staged tree into the package as a resource:

```jsonc
"extraResources": [
  { "from": "vendor/codex-bin", "to": "codex-bin", "filter": ["**/*"] }
]
```

| Build | Path |
| --- | --- |
| Checkout | `vendor\codex-bin\bin\codex.exe` |
| Installed | `resources\codex-bin\bin\codex.exe` (measured: 410 MiB in `dist\win-unpacked\resources\codex-bin`) |

Both are exactly what `resolveCodex()` looks for at step 3.

## Building without it

Skip `fetch-codex.mjs` and call the packager directly:

```powershell
node tools/sync-changelog.mjs
npx electron-builder --win nsis msi --publish never
```

A missing `vendor/codex-bin` is **not** a build failure. electron-builder logs
`file source doesn't exist` for that `extraResources` entry as a warning and carries on, so you get
an installer roughly 410 MiB lighter that requires the user to already have Codex on `PATH`.

CI treats this the same way. The *Stage the bundled Codex CLI* step checks for
`vendor/codex-bin/bin/codex.exe` afterwards and sets a `bundled` output; when it is `false` the step
emits a `::warning::` and the generated release notes say plainly that this build does **not** bundle
the CLI, instead of leaving a user to discover it after installing.

To drop the bundle permanently, remove the `vendor/codex-bin` entry from `extraResources` and the
`fetch-codex.mjs` step from the `dist` script. Nothing else depends on it: step 3 of the resolution
order simply never matches, and the app reports `not found` honestly.

## Pointing Studio at a different binary

Set `CODEX_BIN` to the binary you want. It beats both `PATH` and the bundled copy.

```powershell
# for one run, from a checkout
$env:CODEX_BIN = "D:\codex\target\release\codex.exe"
npm start

# persistently, for the installed app
setx CODEX_BIN "D:\codex\target\release\codex.exe"
```

`setx` affects processes started *after* it, so relaunch Studio. Because resolution is cached on
first use, changing the variable inside a running app has no effect.

This is the supported way to test a locally built CLI, a nightly, or a wrapper script — and it is
the first thing to try when the app cannot run `codex` while a terminal can. `codex_version` will
report `binSource: "CODEX_BIN"`, which is how you confirm the override took.

`CODEX_HOME` is independent of all this: it selects the data directory
(`%USERPROFILE%\.codex` by default), and every binary above reads whichever one is set.

## Failure modes

| Symptom | Cause and fix |
| --- | --- |
| `Could not fetch @openai/codex@<v>-win32-x64` | `npm view` or `npm pack` could not reach the registry, or that version has no Windows build. The script exits 1 and says the app still falls back to `PATH`. |
| `no vendor/x86_64-pc-windows-msvc inside <spec>` | The upstream package layout changed. The script refuses to guess; fix the path in `fetch-codex.mjs` against the real tarball. |
| `staged tree has no bin/codex.exe` | The copy landed but the entry point is absent — a partial extract. Delete `vendor/codex-bin` and re-run. |
| A `tar` error mentioning a host called `C` | GNU tar treated the drive letter as a remote host. The script normally avoids this by using `%SystemRoot%\System32\tar.exe`; that file is missing or not executable on this machine. |
| The app reports `not found` after a successful `npm run prepare:cli` | The app resolved *before* the staging finished, or it is packaged and looking in `resources\codex-bin`. Restart it. |
| Studio uses a different `codex` than your terminal | Expected if `CODEX_BIN` is set, or if the terminal's `PATH` differs from the one the app inherited. `codex_version` reports `bin` and `binSource`; trust that over assumption. |
| Version staged is not the version installed | `fetch-codex.mjs` stages `latest` unless you pass a version. Check `vendor/codex-bin-version.json`. |
| The installer is unexpectedly ~410 MiB smaller | `vendor/codex-bin` was missing when electron-builder ran. It warned rather than failing. |

## Security considerations

- **The binary comes from OpenAI's own published npm artifact**, resolved by exact version and
  packed with `npm pack`. Not a mirror, not a fork, not a link from an issue. If that spec ever
  needs to change, change it in `fetch-codex.mjs` where it is reviewable, never by dropping a file
  into `vendor/codex-bin` by hand.
- **This project does not sign the bundled CLI**, and the installers carrying it are unsigned too.
  A user is trusting the release and the commit behind it. Say so; do not imply a provenance check
  that does not exist.
- **The bundled copy never overrides the user's install.** That ordering is a safety property, not
  a preference: a shadowing CLI would use a different credential store than every other tool on the
  machine while looking identical in the UI.
- **`CODEX_BIN` is an arbitrary-executable override**, so it is exactly as trustworthy as whoever
  set it. Studio runs it with the user's own privileges and never elevates.
- **`extraResources` content is extracted to disk in plain form.** The CLI tree is fine there; a
  credential or token never would be.
- **Do not commit `vendor/codex-bin/`.** `.gitignore` covers it. What is committed is the stamp
  file, which records provenance without the 410 MiB.

## Verification

1. `node tools/fetch-codex.mjs --check` prints the staged path and size, and exits 0.
2. `vendor\codex-bin\` contains `bin\codex.exe`, `bin\codex-code-mode-host.exe`, `codex-path\rg.exe`,
   `codex-resources\` and `codex-package.json`.
3. `vendor\codex-bin\bin\codex.exe --version` prints a `codex-cli <version>` line matching the
   `version` field in `vendor\codex-bin-version.json`.
4. With `codex` on `PATH`: launch Studio and confirm `codex_version` reports
   `binSource: "installed on this machine"` and `bundled: false`.
5. With `CODEX_BIN` set: relaunch and confirm `binSource: "CODEX_BIN"` and the `bin` you set.
6. On a machine with no Codex install: install the packaged app and confirm
   `binSource: "bundled with Codex Studio"`, `bundled: true`, and that `resources\codex-bin` exists
   beside `app.asar`.
7. Delete `vendor\codex-bin`, run `npx electron-builder --win nsis msi --publish never`, and confirm
   the build warns rather than failing, and that the resulting `win-unpacked\resources\` has no
   `codex-bin` directory.
