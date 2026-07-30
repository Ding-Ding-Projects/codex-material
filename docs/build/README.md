# Build

Everything needed to turn this repository into a running app and a Windows installer.

| Page | What it covers |
| --- | --- |
| [Building locally](building-locally.md) | Prerequisites, the submodule, the dev loop, release builds, where output lands |
| [Packaging](packaging.md) | NSIS vs MSI, per-user install mode, icons, what the installer actually contains |
| [Continuous integration](continuous-integration.md) | The GitHub Actions workflow, its triggers, and how releases are published |

## The short version

```powershell
git clone https://github.com/Ding-Ding-Projects/codex-material
cd codex-material
npx --yes @tauri-apps/cli@2 dev      # run it
npx --yes @tauri-apps/cli@2 build    # installers in src-tauri/target/release/bundle/
```

You need Rust with the MSVC toolchain, Node (for the Tauri CLI only), the WebView2 runtime and —
to do anything useful once it starts — the `codex` CLI on `PATH`.

## Platform

**Windows only.** This is not a portability gap to be fixed later; it is a deliberate scope. The
backend calls `where`, `explorer.exe`, `wsl.exe` and `%WINDIR%\Fonts`, uses the Windows-specific
`CREATE_NO_WINDOW` creation flag, and the bundle targets are NSIS and MSI. Nothing in the tree is
conditionally compiled for another platform.
