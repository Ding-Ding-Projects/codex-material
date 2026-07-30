# Building locally

> Windows 10/11 only. Everything below assumes PowerShell in the repository root.

## Prerequisites

| Requirement | Why | How to check |
| --- | --- | --- |
| **Node.js** ≥ 22 | Runs the app (`electron .`), both test suites, the screenshot harness and every tool in `tools/`. CI pins `node-version: 22`. | `node --version` |
| **npm** | Installs the two dev dependencies and the one runtime dependency. | `npm --version` |
| **git** | Cloning, and the app's own local history feature shells out to `git`. | `git --version` |
| **Windows 10/11, x64** | The only bundle target, and the backend calls `where`, `wsl.exe` and `explorer.exe`. | — |
| **The `codex` CLI** *(optional)* | Every backend capability is a real `codex` invocation. `npm run dist` bundles a copy, and `npm start` falls back to it if one is staged. | `codex --version` |

There is **no Rust, no MSVC toolchain and no WebView2 step**. Electron ships its own Chromium, so
rendering does not depend on anything installed on the machine. If a build instruction anywhere
mentions `cargo`, `rustup`, `tauri.conf.json` or the Evergreen WebView2 Runtime, it predates the
Electron shell and is wrong.

### Environment variables the app honours

| Variable | Effect | Default |
| --- | --- | --- |
| `CODEX_HOME` | Where config, sessions, skills, auth and Studio's own history repository live | `%USERPROFILE%\.codex` |
| `CODEX_BIN` | The binary Studio runs. An explicit override beats both `PATH` and the bundled copy. | unset — see [the bundled CLI](bundled-cli.md) |

Both are read in `electron/lib/cli.js` (`codexHome()` and `resolveCodex()`). Setting `CODEX_BIN` to
an absolute path is the fix when the app reports it cannot run `codex` while a terminal can.
Resolution is cached in module scope on first use, so changing either variable needs an app
restart, not just a reload.

## Getting the source

```powershell
git clone https://github.com/Ding-Ding-Projects/codex-material
cd codex-material
```

`vendor/codex` is a git submodule pointing at `https://github.com/openai/codex`. It is a
**reference checkout only** — nothing in it is compiled, linked or bundled. It exists so the CLI
surface catalogued in `app/codex-data.js` (subcommands, flags, settings, slash commands) can be
checked against the real source. CI checks out with `submodules: false` for exactly that reason, and
so can you:

```powershell
git submodule update --init vendor/codex   # optional, and large
```

Do not confuse it with `vendor/codex-bin`, which is the *staged binary* the installer carries. That
directory is generated, git-ignored, and covered in [bundled-cli.md](bundled-cli.md).

## Installing dependencies

```powershell
npm install
```

The dependency tree is deliberately tiny:

| Package | Kind | What it does |
| --- | --- | --- |
| `electron` ^40.5.0 | dev | The shell. Its postinstall downloads the Electron binary (~331 MB into `node_modules/electron/dist`). |
| `electron-builder` ^26.0.24 | dev | Produces the NSIS and MSI installers. |
| `smol-toml` ^1.4.2 | runtime | Parses and serialises `config.toml`. The only module that ships inside the app. |

`package.json` carries an `allowScripts` block naming `electron@40.10.6` and
`electron-winstaller@5.4.0`, pre-approving the install scripts those two packages need so a plain
`npm install` does not stop to ask.

CI's test job runs `npm install --ignore-scripts` on purpose: the tests import plain modules and
never launch Electron, so the 331 MB download is skipped there and paid for once, in the release
job. That is also why a checkout installed with `--ignore-scripts` can run `npm test` but **not**
`npm start` — the Electron binary was never downloaded.

## The npm scripts, exactly as they are

| Script | Command it runs | What you get |
| --- | --- | --- |
| `npm start` | `electron .` | The real app, loading `app/index.html` through `electron/main.js`. |
| `npm test` | `node tools/test-frontend.mjs && node tools/test-backend.mjs && node tools/sync-changelog.mjs --check` | 23 frontend module tests, 22 backend tests, and a check that `app/CHANGELOG.md` still matches the root copy. |
| `npm run capture` | `node tools/capture.mjs` | Sixteen PNGs of the real app in `assets/screenshots/`. |
| `npm run prepare:cli` | `node tools/fetch-codex.mjs` | Stages the Codex CLI into `vendor/codex-bin/` (~410 MB). |
| `npm run dist` | `node tools/sync-changelog.mjs && node tools/fetch-codex.mjs && electron-builder --win nsis msi --publish never` | `dist\Codex Studio-0.1.0-x64.exe` and `.msi`, plus `dist\win-unpacked\`. |

`main` is `electron/main.js`, so `electron .` and `electron-builder` both find the entry point
without any extra flag.

## Running it

```powershell
npm start
```

The window is frameless (`frame: false` in `electron/main.js`) — the app draws its own Material 3
title bar, and the minimise / maximise / close buttons go through the `window_*` IPC commands. It is
created with `show: false` and revealed on `ready-to-show`, so there is no white flash.

The chip in the title bar reads **Electron IPC** when `window.CODEX_BRIDGE` is present and
**Browser preview** when it is not (`bridgeLabel` in `app/index.html`, `CX.bridge.mode` in
`app/codex-core.js`). If it ever reads *Browser preview* inside the shell, the preload failed to
load and every panel is showing simulated data.

A second `npm start` while one is running focuses the existing window instead of opening a rival
copy — `app.requestSingleInstanceLock()` guards `$CODEX_HOME/studio`, the history git repository,
from two writers.

### The dev loop

There is **no watcher, no dev server and no build step**. `app/` is plain browser JavaScript loaded
with `loadFile`. After editing anything under `app/` or `electron/`, stop and re-run `npm start`.

DevTools are enabled (`devTools: true` in `webPreferences`), but nothing in this repository binds a
menu item or accelerator to open them, and a frameless window shows no menu bar. If
<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> does not open them on your machine, add
`mainWindow.webContents.openDevTools()` after `createWindow()` while you debug, and take it out
again.

### Frontend-only iteration

`CX.bridge` falls through to the simulation in `app/codex-core.js` whenever `window.CODEX_BRIDGE` is
absent, which is what makes `app/` viewable without a shell around it. Serve the directory rather
than double-clicking the file: the page enforces its own `default-src 'self'` CSP from a `<meta>`
tag, and a `file://` origin trips it — the changelog viewer's `fetch("./CHANGELOG.md")` is refused
before it reaches the disk, which is exactly why the in-shell path goes through `codex_read_text`
instead.

```powershell
npx --yes serve app
```

This is a genuinely useful loop for layout, language modes and appearance work — and it proves
nothing about the backend. The title chip reads **Browser preview**, and every panel is showing
fixtures. Anything touching a real command must be checked inside the shell.

## Release build

```powershell
npm run dist
```

Three steps, in order:

1. `node tools/sync-changelog.mjs` mirrors the root `CHANGELOG.md` into `app/CHANGELOG.md`, because
   the in-app viewer loads `./CHANGELOG.md` relative to the frontend.
2. `node tools/fetch-codex.mjs` downloads and stages the Codex CLI into `vendor/codex-bin/`. This is
   the slow step — roughly 410 MB unpacked.
3. `electron-builder --win nsis msi --publish never` packages both installers. `--publish never`
   means the build never uploads anything; publishing is CI's job.

Output lands in `dist\` (git-ignored):

| Path | What it is |
| --- | --- |
| `dist\Codex Studio-0.1.0-x64.exe` | The NSIS installer, per-user |
| `dist\Codex Studio-0.1.0-x64.msi` | The MSI package, per-user |
| `dist\win-unpacked\` | The unpacked app — `Codex Studio.exe`, the Electron runtime, `resources\app.asar`, `resources\codex-bin\` |
| `dist\builder-debug.yml` | electron-builder's resolved file patterns, useful when something you expected inside the package is not there |

File names come from `artifactName: "${productName}-${version}-${arch}.${ext}"` and the
`productName` / `version` fields in `package.json`. See [packaging.md](packaging.md).

### Building without the bundled CLI

Skip step 2 by invoking the packager directly:

```powershell
node tools/sync-changelog.mjs
npx electron-builder --win nsis msi --publish never
```

A missing `vendor/codex-bin` is a **warning**, not an error — electron-builder logs
`file source doesn't exist` for that `extraResources` entry and carries on. You get an installer
that is roughly 410 MB lighter and requires the user to already have Codex.

## Icons

`assets/icon.ico` is committed, so a normal build never needs an icon step. `tools/make-icon.mjs`
regenerates only the **source PNG**:

```powershell
node tools/make-icon.mjs assets/icon-source.png
```

It rasterises the mark and writes a 1024×1024 RGBA PNG by hand using `node:zlib` alone — no image
library, no network. Nothing in this repository converts that PNG into `assets/icon.ico`; the `.ico`
and the 256×256 `assets/icon.png` are committed derivatives. See
[packaging.md](packaging.md#icons) for what each one is actually used for.

## Generated and ignored paths

`.gitignore` excludes `node_modules/`, `package-lock.json`, `dist/`, `*.log` and
`vendor/codex-bin/` — the last one being why a 410 MB binary tree can sit in the checkout without
ever reaching a commit. It also still lists `src-tauri/target/` and `src-tauri/gen/`, which no longer
match anything: `src-tauri/` was deleted with the Tauri shell.

`app/CHANGELOG.md` **is** committed, and is a generated mirror. Never edit it; edit the root
`CHANGELOG.md` and re-run `node tools/sync-changelog.mjs`.

## Failure modes

| Symptom | Cause and fix |
| --- | --- |
| `npm start` fails with `electron: not found` or an ENOENT on the binary | `npm install` ran with `--ignore-scripts`, so the Electron download never happened. Re-run `npm install` without it. |
| `npm test` fails on `app/CHANGELOG.md is out of date` | The mirror drifted. Run `node tools/sync-changelog.mjs` and commit the result. |
| The window opens but every panel is empty and the version chip shows an error | No `codex` is resolvable. Check `codex --version`, then set `CODEX_BIN`, or run `npm run prepare:cli`. |
| Panels show data that looks too tidy | The title chip reads **Browser preview** — that is the simulation, not your machine. |
| A frontend edit has no effect | There is no watcher. Restart `npm start`. |
| `npm run dist` stops inside `fetch-codex.mjs` | `npm view` or `npm pack` could not reach the registry. The message says so and exits 1. Build without the CLI, or retry. |
| The MSI step fails while NSIS succeeds | electron-builder downloads the WiX toolset (`wix-4.0.0.5512.2`) into its own cache on first use. An offline machine or a blocking proxy stops that, not your configuration. |
| The installer builds but carries no CLI | `vendor/codex-bin` was missing; electron-builder warned `file source doesn't exist` and continued. Run `npm run prepare:cli` first. |
| `codex_read_text` cannot find `CHANGELOG.md` from a checkout | It looks in `resources/` (packaged), the repository root, then `app/`. From a checkout the root copy answers; the error lists every path it tried. |

## Security considerations

- **Install toolchains from canonical upstreams only** — Node from nodejs.org, packages from the
  npm registry, the Codex CLI from OpenAI's own published `@openai/codex` artifact. Never from a
  link in an issue, a mirror, or a fork.
- **Nothing here needs administrator rights**, to build or to install. A step that asks for
  elevation is a step to question.
- **The app makes no network request at runtime.** React, Roboto and Roboto Mono, and the dim sum
  images are all bundled under `app/`. The *build* does reach the network: npm, the Electron
  binary, the NSIS and WiX toolsets, and the CLI tarball.
- **Do not commit `dist/` or `vendor/codex-bin/`.** Together they run past a gigabyte, and the CLI
  tree is redownloadable at any time.
- **`vendor/codex` is third-party source.** Read it; do not modify it in place. Changes there belong
  upstream.
- **The renderer is sandboxed by contract, not by trust**: `contextIsolation: true`,
  `nodeIntegration: false`, and a preload that exposes exactly 50 named commands. Adding a command
  means adding it to `electron/preload.js` *and* `electron/commands.js` — a backend test asserts the
  two lists agree.

## Verification

1. `node --version` reports 22 or newer.
2. `npm install` completes and `node_modules\electron\dist\electron.exe` exists.
3. `npm test` passes: **23 frontend tests**, **22 backend tests**, and
   `app/CHANGELOG.md matches the root copy.` The frontend runner also prints its per-file
   breakdown — `codex-core.js` 9, `cx-i18n.js` 6, `cx-dimsum.js` 4, `cx-changelog.js` 4.
4. `npm start` opens a window titled **Codex Studio** whose title-bar chip reads **Electron IPC**
   and whose version chip matches `codex --version` in a terminal.
5. In DevTools, `await window.CODEX_BRIDGE.invoke("codex_version")` returns `version`, `home`,
   `bin`, `binSource` and `bundled` — `binSource` naming which of the three resolution paths won.
6. `npm run capture` writes sixteen numbered PNGs plus `manifest.json` into `assets\screenshots\`.
7. `npm run dist` produces both `dist\*.exe` and `dist\*.msi`, and
   `dist\win-unpacked\resources\codex-bin\bin\codex.exe` exists.
8. Install the NSIS output as a non-administrator: it must complete with no elevation prompt. See
   [packaging.md](packaging.md#verification) for the rest of that check.
