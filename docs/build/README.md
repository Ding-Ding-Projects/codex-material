# Build

Everything needed to turn this repository into a running app and a Windows installer.

| Page | What it covers |
| --- | --- |
| [Building locally](building-locally.md) | Prerequisites, `npm install`, every npm script, the dev loop, where output lands |
| [Packaging](packaging.md) | NSIS vs MSI, per-user install, the icon pipeline, what is inside the installer, the size breakdown |
| [The bundled Codex CLI](bundled-cli.md) | Why a ~410 MB CLI ships, how `tools/fetch-codex.mjs` stages it, the resolution order, how to build without it |
| [Continuous integration](continuous-integration.md) | The real `.github/workflows/ci.yml`: two jobs, the `needs:` gate, tags, tokens, releases |

## The short version

```powershell
git clone https://github.com/Ding-Ding-Projects/codex-material
cd codex-material
npm install
npm start        # run it
npm test         # 34 frontend tests + 33 backend tests + the changelog mirror check
npm run dist     # installers into dist\
```

You need **Node 22 or newer**, **git**, and **Windows 10 or 11 on x64**. You do **not** need Rust, the
MSVC toolchain, or a WebView2 install step — the shell is Electron 40, which carries its own copy of
Chromium.

To do anything useful once it starts you need a `codex` binary. `npm run dist` bundles one, and the
app falls back to it, but the copy already on your `PATH` always wins. See
[the bundled CLI](bundled-cli.md).

## Platform

**Windows only.** This is a deliberate scope, not a portability gap waiting to be filled:

- `package.json` declares one platform block, `build.win`, with the `nsis` and `msi` targets on
  `x64`. There is no `mac` or `linux` target.
- The backend calls `where` to find `codex` (`electron/lib/cli.js`), `wsl.exe` for the per-tab
  runtimes (`electron/lib/wsl.js`), `explorer.exe` to reveal a path (`electron/lib/editors.js`),
  and reads `%WINDIR%\Fonts` plus `%LOCALAPPDATA%\Microsoft\Windows\Fonts` for the appearance
  editor's font list (`electron/commands.js`).
- `electron/lib/cli.js` spawns through a shell on `win32` specifically because `codex` resolves to a
  `.cmd` shim there, and the bundled CLI is a `win32-x64` build.

A couple of modules carry a `process.platform` branch, so parts of the backend would start
elsewhere. Nothing else would: there is no other bundle target and no other CLI artifact staged.

## Where the numbers on these pages came from

Every size, count and file name on these four pages was measured in this checkout, not estimated:
`npm test` for the test counts, `dist\win-unpacked` for the size breakdown,
`vendor\codex-bin-version.json` for the staged CLI version. Where something is not implemented, the
page says so instead of describing an intention as a feature.
