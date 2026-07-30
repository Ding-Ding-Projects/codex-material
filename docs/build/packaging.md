# Packaging

> What `tauri build` produces, what is inside it, and which decisions in
> `src-tauri/tauri.conf.json` produce that result.

## Bundle configuration, as it stands

```jsonc
// src-tauri/tauri.conf.json
"productName": "Codex Studio",
"version": "0.1.0",
"identifier": "dev.codexstudio.app",
"bundle": {
  "active": true,
  "targets": ["msi", "nsis"],
  "publisher": "Ding Ding Projects",
  "copyright": "Codex Studio contributors",
  "category": "DeveloperTool",
  "shortDescription": "Material 3 desktop GUI for the Codex CLI",
  "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico"],
  "windows": {
    "nsis": { "installMode": "currentUser", "languages": ["English"] }
  }
}
```

`identifier` (`dev.codexstudio.app`) is the stable identity Windows and the updater key off.
Changing it makes an installed copy look like a different product; treat it as immutable.

## NSIS vs MSI

Both targets are built. They are not interchangeable.

| | **NSIS** (`bundle\nsis\*-setup.exe`) | **MSI** (`bundle\msi\*.msi`) |
| --- | --- | --- |
| Configured here | `installMode: "currentUser"`, `languages: ["English"]` | No `windows.wix` block — Tauri's default WiX template applies |
| Elevation | Not required: installs under the user's profile | Not configured for a per-user install; expect the WiX default (per-machine, elevation required) |
| Best for | The normal download-and-run path | Managed deployment, Group Policy, `msiexec` automation |
| Uninstall | Add/Remove Programs, per user | Add/Remove Programs, machine-wide |

**Ship the NSIS installer as the primary artifact.** Per-user install means a developer can
install Codex Studio without an administrator, and a per-user install matches where the app's data
already lives (`$CODEX_HOME`, `localStorage`).

The MSI is kept because managed environments need one. Note the mismatch plainly rather than
pretending it away: the MSI is not configured for `perUser` scope, so installing it does require
elevation, and a machine that has both installed will show two entries in Add/Remove Programs.

## What the installer contains

1. **`codex-studio.exe`** — the whole application. The frontend (`app/`) is not shipped as loose
   files; `frontendDist: "../app"` causes `tauri-build` to embed the HTML, JS, fonts and vendored
   React into the binary, served over Tauri's internal asset protocol. That is why the strict CSP
   works and why there is nothing on disk for a user to edit after install.
2. **Icons** — the `.ico` for the executable and shell, plus the PNG sizes listed in
   `bundle.icon`.
3. **Uninstaller registration**, publisher and copyright metadata from the bundle block.
4. **WebView2 handling.** `bundle.windows.webviewInstallMode` is not set, so Tauri's default
   applies: the installer arranges for the Evergreen WebView2 bootstrapper to run when the runtime
   is missing. This is the one part of installation that can touch the network. On Windows 11 and
   current Windows 10 the runtime is already present and nothing is downloaded.

### What it does **not** contain

- **The `codex` CLI.** Studio runs the binary the user already has; it never bundles, updates or
  vendors it. A machine without the CLI installs fine and then reports the failure honestly in
  every panel.
- **Bundled resources.** `bundle.resources` is not declared, so the resource directory ships
  empty. `codex_read_text` resolves a *relative* path against that directory specifically so a
  shipped document (a changelog, for instance) can be read without network access — but until a
  file is listed in `bundle.resources`, every relative `codex_read_text` call fails with a
  not-found error. Adding one is a two-line change:
  ```jsonc
  "bundle": { "resources": ["../CHANGELOG.md"] }
  ```
- **A code signature.** No `signCommand` and no `certificateThumbprint` are configured, so both
  installers are unsigned. SmartScreen will warn on first run, and the warning is legitimate — say
  so in release notes rather than telling users to click through it as if it were noise.
- **An updater.** No `plugins.updater` block and no `tauri-plugin-updater` dependency exist.
  Updates are manual: download the next release and install over the top.

## Window and security configuration carried into the build

```jsonc
"app": {
  "withGlobalTauri": true,
  "windows": [{ "label": "main", "title": "Codex Studio",
                "width": 1440, "height": 940, "minWidth": 960, "minHeight": 640,
                "decorations": false, "transparent": false, "dragDropEnabled": true }],
  "security": { "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; connect-src 'self' ipc: http://ipc.localhost; media-src 'self' data:" }
}
```

- `decorations: false` — the app draws its own Material 3 title bar. That is why
  `src-tauri/capabilities/default.json` grants `core:window:allow-minimize`,
  `allow-toggle-maximize`, `allow-close` and `allow-start-dragging`: without them the custom
  window buttons are dead.
- `withGlobalTauri: true` — `window.__TAURI__` exists, which is what `CX.bridge` feature-detects.
- `minWidth: 960, minHeight: 640` — the smallest size any layout must survive. Test clipping
  there, not at the 1440 × 940 default.
- The CSP admits **no external origin at all**. `'unsafe-inline'` for styles and scripts is what
  lets the `dc` template inline its styles and evaluate the logic script; there is no
  `unsafe-eval` and no CDN host.

## Versioning

`version` in `src-tauri/tauri.conf.json` names the release and appears in the installer file
names. `src-tauri/Cargo.toml` carries its own `version` for the crate. Keep them in step, and give
every published release a new, unique, monotonic version — never rebuild a shipped one in place.

## Failure modes

| Symptom | Cause and fix |
| --- | --- |
| `tauri build` succeeds, no `bundle/` directory | `bundle.active` was set false, or `cargo build` was run instead of `tauri build`. |
| MSI build fails while NSIS succeeds | WiX toolchain download or a `productName` containing a character WiX rejects. Read the bundler log; NSIS is the primary artifact and can ship alone in a pinch. |
| SmartScreen blocks the installer | Expected: the build is unsigned. Do not tell users to bypass it casually — sign the build or state the risk. |
| App installs but shows no data | The `codex` CLI is not on `PATH` for that user. Deliberate: Studio does not bundle the CLI. |
| A relative `codex_read_text` path fails after install | Nothing is declared in `bundle.resources`; see above. |
| Installing the MSI prompts for administrator | Expected — the MSI has no per-user WiX configuration. Use the NSIS installer for a per-user install. |

## Security considerations

- **Per-user NSIS install means no elevation**, which is the correct default for a developer tool
  that only ever acts as the current user. Do not "upgrade" it to per-machine for convenience.
- **Unsigned installers are a real risk to the user**, not a cosmetic one: nothing proves the file
  came from this project. State it in the release notes until signing exists.
- **The WebView2 bootstrapper is the only network-touching part of installation.** In an
  air-gapped environment, use a machine that already has the Evergreen Runtime, or switch
  `webviewInstallMode` to an offline mode and document the change.
- **Never bundle credentials, tokens or a `.env` through `bundle.resources`.** Everything listed
  there is extracted onto the user's disk in plain form.
- **Publish the artifact the build actually produced.** A release carrying an installer that was
  not built by that run is worse than a release with no installer.

## Verification

1. `npx --yes @tauri-apps/cli@2 build` produces both bundles under
   `src-tauri/target/release/bundle/`.
2. The file names match `productName` and `version` in `src-tauri/tauri.conf.json`.
3. Install the NSIS `.exe` **as a non-administrator**. It must complete without an elevation
   prompt and appear in Add/Remove Programs for that user only.
4. Launch the installed app: the custom title bar draws, minimise / maximise / close work (which
   proves the window capabilities survived bundling), and the bridge chip reads **Tauri IPC**.
5. Rename `codex.exe` out of `PATH` and relaunch: the app must still start and report the failure
   in the UI, not crash or hang.
6. Uninstall. The application directory is removed and `$CODEX_HOME` — the user's own Codex data —
   is untouched.
