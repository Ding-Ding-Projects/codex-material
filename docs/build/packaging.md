# Packaging

> What `npm run dist` produces, what is inside it, and which decisions in `package.json`
> produce that result.

## Bundle configuration, as it stands

```jsonc
// package.json
"main": "electron/main.js",
"build": {
  "appId": "dev.codexstudio.app",
  "productName": "Codex Studio",
  "copyright": "Codex Studio contributors",
  "directories": { "output": "dist", "buildResources": "assets" },
  "files": ["electron/**/*", "app/**/*", "CHANGELOG.md", "!**/*.map"],
  "extraResources": [
    { "from": "CHANGELOG.md", "to": "CHANGELOG.md" },
    { "from": "vendor/codex-bin", "to": "codex-bin", "filter": ["**/*"] }
  ],
  "win": {
    "target": [ { "target": "nsis", "arch": ["x64"] }, { "target": "msi", "arch": ["x64"] } ],
    "icon": "assets/icon.ico",
    "artifactName": "${productName}-${version}-${arch}.${ext}"
  },
  "nsis": { "oneClick": false, "perMachine": false, "allowToChangeInstallationDirectory": true,
            "createDesktopShortcut": true, "createStartMenuShortcut": true,
            "shortcutName": "Codex Studio" },
  "msi":  { "oneClick": false, "perMachine": false, "createDesktopShortcut": true }
}
```

`appId` (`dev.codexstudio.app`) is the stable identity Windows keys off. Changing it makes an
installed copy look like a different product, so treat it as immutable.

There is no `mac` or `linux` block, no `publish` block, and no `afterSign`/`sign` configuration.
`npm run dist` passes `--publish never`, so a local build never uploads anything.

## NSIS vs MSI

Both targets are built from the same `win-unpacked` output. They install the same bytes; they differ
in how an organisation deploys them.

| | **NSIS** (`Codex Studio-0.1.0-x64.exe`) | **MSI** (`Codex Studio-0.1.0-x64.msi`) |
| --- | --- | --- |
| Configured here | `oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true`, desktop + Start Menu shortcuts named **Codex Studio** | `oneClick: false`, `perMachine: false`, `createDesktopShortcut: true` |
| Scope | Per user. No elevation. | Per user. electron-builder's WiX template sets `MSIINSTALLPERUSER` and defaults the install folder to the per-user one when `perMachine` is false. |
| Install UI | A real wizard, with a directory page | A real wizard, with an install-scope page |
| Best for | The normal download-and-run path | Managed or scripted deployment (`msiexec`, Group Policy, Intune) |
| Uninstall | Add/Remove Programs, for that user | Add/Remove Programs, for that user |

**The NSIS installer is the primary artifact.** Per-user install means a developer can install Codex
Studio without an administrator, which matches where the app's data already lives (`$CODEX_HOME`,
`localStorage`).

The MSI exists because managed environments need a Windows Installer package. It is *also* per-user
here, which is a deliberate change from a stock WiX default: nothing in this app needs to write
outside the user's profile.

### Toolchains the packager downloads

Neither installer format is vendored. On first use electron-builder fetches its own binaries into
its cache: the NSIS toolset and, for the MSI, `wix-4.0.0.5512.2`, whose `candle.exe` and `light.exe`
it then runs. On an offline or proxied machine the MSI target is the one that fails first, and the
failure is about downloading a toolchain, not about anything in this repository.

## What the installer contains

Measured from `dist\win-unpacked` in this checkout:

| Component | Size | What it is |
| --- | --- | --- |
| `resources\codex-bin\` | **410 MiB** | The bundled Codex CLI, staged from `vendor/codex-bin` by the `extraResources` entry. See [bundled-cli.md](bundled-cli.md). |
| The Electron runtime | **~330 MiB** | `Codex Studio.exe`, `*.dll`, `*.pak`, `icudtl.dat`, `locales\`, the V8 snapshots — Chromium and Node, shipped by electron-builder from `node_modules\electron\dist`. |
| `resources\app.asar` | **4.7 MiB** (4 914 164 bytes) | The application itself. |
| `resources\CHANGELOG.md` | **10 441 bytes** | The `extraResources` copy of the root changelog. |
| **Total unpacked** | **745 MiB** | |

Inside `app.asar`, exactly four top-level entries:

```
electron/      main.js, preload.js, commands.js, lib/{catalog,cli,config,editors,history,wsl}.js
app/           index.html, codex-core.js, codex-data.js, cx-*.js, CHANGELOG.md, dimsum/, fonts/, vendor/
node_modules/  smol-toml — the only runtime dependency
package.json
```

The changelog the packaged app actually reads is `resources\CHANGELOG.md`. `loadChangelog()` calls
`codex_read_text` with the relative path `CHANGELOG.md` whenever a bridge is present, and that
command resolves it against `process.resourcesPath` first when `app.isPackaged`, then the repository
root, then `app/` — the error names every path it tried. The mirrored `app/CHANGELOG.md` inside the
asar serves the browser-preview path, which uses `fetch("./CHANGELOG.md")` instead.

**The installer download is smaller than 745 MiB** — both formats compress — but this page does not
quote a compressed figure, because none was measured here. CI's *Verify the installers exist* step
prints the real size of each artifact it built; that number is the one to cite.

### What it does **not** contain

- **A code signature.** No `sign`, `certificateFile` or `certificateSubjectName` is configured, so
  both installers are unsigned. **SmartScreen will warn on first run**, and the warning is
  legitimate: nothing cryptographically proves the file came from this project. Say so in release
  notes — the generated notes already do — rather than telling users to click through it as if it
  were noise.
- **An auto-updater.** There is no `electron-updater` dependency and no `publish` configuration.
  Updates are manual: download the next release and install over the top.
- **Anything from `assets/`.** It is the `buildResources` directory, which electron-builder excludes
  from the app package (`!assets{,/**/*}` appears in `dist\builder-debug.yml`). That matters for one
  line in `electron/main.js`:
  ```js
  icon: path.join(__dirname, "..", "assets", "icon.png"),
  ```
  which resolves only from a checkout. In an installed copy the path does not exist and the window
  simply uses the executable's own icon, compiled in from `assets/icon.ico`.
- **A WebView2 bootstrapper, or any runtime prerequisite.** Electron carries its own Chromium. The
  installation touches the network only if Windows itself decides to.
- **Any Rust or Tauri artifact.** `src-tauri/` no longer exists.

## Icons

Three files in `assets/`, and only one of them is generated by a script in this repository:

| File | How it is made | What consumes it |
| --- | --- | --- |
| `assets/icon-source.png` | `node tools/make-icon.mjs assets/icon-source.png` — 1024×1024 RGBA, rasterised by hand with `node:zlib` alone. No image library, no network. | Nothing at build time. It is the master art. |
| `assets/icon.ico` | **Committed artifact.** Six PNG-compressed entries at 32 bpp: 16×16, 24×24, 32×32, 48×48, 64×64, 256×256 (27 644 bytes). | `build.win.icon` — the executable icon, the shell icon, the installer icon. |
| `assets/icon.png` | **Committed artifact**, 256×256. | `BrowserWindow({ icon })` in `electron/main.js`, which resolves only when running from a checkout (see above). |

`tools/make-icon.mjs` draws the mark itself: an M3 squircle ramped from `#4F378B` to `#D0BCFF`
carrying a white prompt chevron and caret, supersampled 3× for anti-aliasing.

**Nothing in this repository converts the source PNG into the `.ico`.** Regenerating the icon is
therefore a two-part job: run `make-icon.mjs` for the source, then produce the multi-size `.ico` with
an external tool and commit it. The file header above is what a correct result looks like — six
entries, PNG-compressed, 32 bpp, up to 256×256. A single-size `.ico` will look wrong in the taskbar.

## Window and security configuration carried into the build

From `electron/main.js`:

```js
new BrowserWindow({
  width: 1440, height: 940, minWidth: 960, minHeight: 640,
  frame: false, backgroundColor: "#141218", show: false, title: "Codex Studio",
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true, nodeIntegration: false, sandbox: false,
    spellcheck: false, devTools: true,
  },
});
```

- `frame: false` — the app draws its own Material 3 title bar, which is why `window_minimize`,
  `window_toggle_maximize` and `window_close` exist as IPC commands. Electron keeps the invisible
  resize borders, so the window is still resizable.
- `minWidth: 960, minHeight: 640` — the smallest size any layout must survive. Test clipping there,
  not at the 1440 × 940 default.
- `contextIsolation: true`, `nodeIntegration: false` — the renderer cannot reach Node. It gets
  `window.CODEX_BRIDGE` and nothing else, and that object refuses any command outside its 50-name
  allow-list before it ever reaches `ipcRenderer`.
- `show: false` plus `ready-to-show` — no white flash on launch.
- Navigation is pinned: `setWindowOpenHandler` denies every new window and hands `http(s)` URLs to
  the user's real browser; `will-navigate` blocks anything that is not `file://` and does the same.
- `app.requestSingleInstanceLock()` — a second launch focuses the running window instead of starting
  a rival copy that would fight it for `$CODEX_HOME/studio`.
- `window-all-closed` and `before-quit` both call `wsl.shutdown()`, because each pinned WSL shell is
  a real `sleep infinity` process that would otherwise outlive the app.

The CSP is a `<meta>` tag in `app/index.html`, not a shell setting:

```
default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';
img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval';
connect-src 'self'; media-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'
```

No external origin is admitted anywhere. `'unsafe-eval'` is present for one specific reason: the
`dc` template runtime compiles the page's own markup with `new Function`, and without it the app
refuses to run its own bundled code. `'unsafe-inline'` covers the template's inline styles and the
inline logic script. React, both Roboto families and every dim sum image are vendored under `app/`
precisely so nothing else has to be allowed.

## Versioning

`version` in `package.json` (`0.1.0`) names the release and appears in both installer file names
through `artifactName`. CI does not bump it; it appends a monotonic build suffix to the tag instead —
`v0.1.0+build.<run_number>`. See [continuous-integration.md](continuous-integration.md).

Give every published release a new, unique tag, and never rebuild a shipped one in place.

## Failure modes

| Symptom | Cause and fix |
| --- | --- |
| `npm run dist` succeeds but the installer carries no CLI | `vendor/codex-bin` was missing. electron-builder logs `file source doesn't exist` for that `extraResources` entry as a **warning** and ships anyway. Run `npm run prepare:cli` first. |
| The MSI target fails while NSIS succeeds | electron-builder could not download the WiX toolset into its cache. Network, not configuration. NSIS is the primary artifact and can ship alone in a pinch. |
| SmartScreen blocks the installer | Expected: the build is unsigned. Do not tell users to bypass it casually — sign the build, or state the risk plainly. |
| The installed app shows no data anywhere | No `codex` is resolvable *and* no CLI was bundled. Check `codex --version`, or set `CODEX_BIN`. |
| A file you expected inside the package is missing | Read `dist\builder-debug.yml`. It lists the resolved include and exclude patterns, including the automatic `!assets{,/**/*}` and `!dist{,/**/*}`. |
| Two entries in Add/Remove Programs | Both the NSIS and the MSI build were installed. They are separate packages with the same `appId`; uninstall the one you do not want. |
| The window has the wrong icon in a packaged install | Expected, and cosmetic: `assets/icon.png` is not packaged, so the window falls back to the executable icon from `assets/icon.ico`. |

## Security considerations

- **Per-user install means no elevation**, which is the correct default for a developer tool that
  only ever acts as the current user. Do not "upgrade" either target to per-machine for convenience.
- **Unsigned installers are a real risk to the user**, not a cosmetic one. State it in the release
  notes until signing exists — the generated notes already do, in both languages.
- **`extraResources` contents land on the user's disk in plain form.** Never list a credential, a
  token or a `.env` there. Today it carries exactly two things: the changelog and the Codex CLI.
- **The bundled CLI is a 410 MiB third-party executable.** It comes from OpenAI's own published npm
  artifact, staged by a script in this repository, and it never overrides a CLI the user already
  has. See [bundled-cli.md](bundled-cli.md#security-considerations).
- **Publish the artifact the build actually produced.** A release carrying an installer that was not
  built by that run is worse than a release with no installer.
- **The renderer's security posture is part of the package**, not a dev-time nicety:
  `contextIsolation`, the preload allow-list and the navigation guards all ship exactly as
  configured above. Loosening one for debugging must never reach a release build.

## Verification

1. `npm run dist` produces both `dist\Codex Studio-0.1.0-x64.exe` and
   `dist\Codex Studio-0.1.0-x64.msi`.
2. `dist\win-unpacked\resources\` contains `app.asar`, `CHANGELOG.md` and `codex-bin\bin\codex.exe`.
3. Install the NSIS `.exe` **as a non-administrator**. It completes with no elevation prompt and
   appears in Add/Remove Programs for that user only.
4. Launch the installed app: the custom title bar draws, minimise / maximise / close work (which
   proves the `window_*` commands survived packaging), and the bridge chip reads **Electron IPC**.
5. The Health panel reports which `codex` is in use. On a machine with no Codex install it must say
   the bundled one; with `codex` on `PATH` it must say the user's.
6. Rename `codex.exe` out of `PATH` on a machine with no bundled copy and relaunch: the app still
   starts and reports the failure in the UI rather than crashing.
7. Uninstall. The application directory is removed and `$CODEX_HOME` — the user's own Codex data,
   including Studio's history repository — is untouched.
