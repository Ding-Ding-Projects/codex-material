# Building locally

> Windows 10/11 only. Everything below assumes PowerShell in the repository root.

## Prerequisites

| Requirement | Why | How to check |
| --- | --- | --- |
| **Rust** ≥ 1.77 with the `x86_64-pc-windows-msvc` toolchain | `src-tauri/Cargo.toml` sets `rust-version = "1.77"` and `edition = "2021"` | `rustc --version` · `rustup show` |
| **Visual Studio Build Tools** with the "Desktop development with C++" workload | The MSVC linker; Rust on Windows cannot link without it | `link.exe` resolves in a Developer prompt |
| **Node.js** ≥ 18 | Only to run the Tauri CLI (`npx @tauri-apps/cli`) and `tools/make-icon.mjs`. No frontend build step exists. | `node --version` |
| **WebView2 Runtime** | The app's rendering engine | Preinstalled on Windows 11 and current Windows 10; otherwise install the Evergreen Runtime |
| **git** | Cloning, the `vendor/codex` submodule, and the app's own local history feature | `git --version` |
| **The `codex` CLI** | Every backend capability is a real `codex` invocation | `codex --version` |

There is **no `package.json`** in this repository. The Tauri CLI is fetched on demand with `npx`
(or installed with `npm install @tauri-apps/cli --no-save`, per the note in `.gitignore`) and is
never vendored.

### Environment variables the app honours

| Variable | Effect | Default |
| --- | --- | --- |
| `CODEX_HOME` | Where config, sessions, skills, auth and Studio's history repository live | `%USERPROFILE%\.codex` |
| `CODEX_BIN` | The binary Studio runs | `codex` (resolved through `PATH`) |

Both are read in `src-tauri/src/cli.rs`. Setting `CODEX_BIN` to an absolute path is the fix when
the app reports `could not run \`codex …\`` while a terminal can run it.

## Getting the source

```powershell
git clone https://github.com/Ding-Ding-Projects/codex-material
cd codex-material
```

`vendor/codex` is a git submodule pointing at `https://github.com/openai/codex`. It is a
**reference checkout only** — nothing in it is compiled, linked or bundled. It exists so the CLI
surface catalogued in `app/codex-data.js` (subcommands, flags, settings, slash commands) can be
checked against the real source. Building Codex Studio does not need it:

```powershell
git submodule update --init vendor/codex   # optional, and large
```

## Running it

```powershell
npx --yes @tauri-apps/cli@2 dev
```

Run this from the **repository root**, not from `src-tauri`; the CLI locates
`src-tauri/tauri.conf.json` from there. The first run compiles the Rust dependency tree and takes
a while; later runs are incremental.

`src-tauri/tauri.conf.json` declares `frontendDist: "../app"` and **no** `devUrl` or
`beforeDevCommand`, because there is nothing to build — the frontend is plain files. After
editing anything in `app/`, reload the WebView with <kbd>Ctrl</kbd>+<kbd>R</kbd>. If the change
does not appear, stop and re-run `tauri dev`: assets can be embedded at compile time, in which
case a reload alone shows the stale copy.

### Backend-only iteration

```powershell
cd src-tauri
cargo check          # fastest signal
cargo build          # debug binary, no bundling
cargo clippy         # if installed
cargo test           # the crate is a library precisely so this works without a window
```

`src-tauri/src/main.rs` is a seven-line launcher; all behaviour lives in the `codex_studio`
library crate, so tests never need to open a window.

### Frontend-only iteration

Open `app/index.html` directly in a browser. `CX.bridge` detects the missing `window.__TAURI__`,
switches to `mode: "browser"` and serves fixtures from the simulation in `app/codex-core.js`. The
title bar reads **Browser preview**.

This is a genuinely useful loop for layout, language modes and appearance work — and it proves
nothing about the backend. Anything touching a real command must be checked inside the shell,
where the title bar reads **Tauri IPC**.

## Release build

```powershell
npx --yes @tauri-apps/cli@2 build
```

Produces, under `src-tauri/target/release/`:

| Path | What it is |
| --- | --- |
| `codex-studio.exe` | The application binary |
| `bundle\nsis\Codex Studio_<version>_x64-setup.exe` | The NSIS installer |
| `bundle\msi\Codex Studio_<version>_x64_en-US.msi` | The MSI installer |

Exact file names come from `productName` and `version` in `src-tauri/tauri.conf.json`
(`Codex Studio`, `0.1.0` at the time of writing). See [packaging.md](packaging.md).

The release profile in `src-tauri/Cargo.toml` sets `lto = true`, `codegen-units = 1`,
`opt-level = "s"`, `panic = "abort"` and `strip = true`, so a release build is markedly slower
than `cargo build` and produces a much smaller binary. Debug symbols are stripped; a release
crash report will not carry a symbolised backtrace.

## Icons

`src-tauri/icons/` is generated, but committed, so a normal build never needs this step. To
regenerate:

```powershell
node tools/make-icon.mjs assets/icon-source.png
npx --yes @tauri-apps/cli@2 icon assets/icon-source.png
```

`tools/make-icon.mjs` rasterises the mark and writes a PNG by hand (`node:zlib` only — no image
library, no network). `tauri icon` fans that single 1024×1024 source out into every size the
Windows bundler needs.

## Generated and ignored paths

`.gitignore` excludes `src-tauri/target/`, `src-tauri/gen/`, `node_modules/`,
`package-lock.json`, `dist/` and `*.log`. `src-tauri/gen/schemas/` is regenerated by
`tauri-build` on every compile; never edit it and never commit it.

## Failure modes

| Symptom | Cause and fix |
| --- | --- |
| `error: linker \`link.exe\` not found` | MSVC build tools missing. Install the "Desktop development with C++" workload. |
| `error: failed to run custom build command for tauri-build` | Usually a corrupt `src-tauri/gen/`. Delete it and rebuild. |
| The window opens white | A frontend error before the first paint. Right-click → Inspect (WebView2 devtools) and read the console; check that the vendored React files load before `support.js`. |
| Every panel is empty, title bar shows `Tauri IPC` | The CLI is not resolvable from the app's environment. Check `codex --version`, then set `CODEX_BIN`. |
| Panels show data that looks too tidy | You are in `Browser preview`; that data is the simulation, not your machine. |
| `npx @tauri-apps/cli` cannot find a config | You ran it inside `src-tauri`. Run it from the repository root. |
| A frontend edit has no effect | Reload the WebView; if that fails, restart `tauri dev`. |
| The build succeeds but no bundle appears | You ran `cargo build` rather than `tauri build`. Only the Tauri CLI runs the bundlers. |

## Security considerations

- **Install toolchains from canonical upstreams only** — rustup from `rustup.rs`, the Tauri CLI
  from npm as `@tauri-apps/cli`, Node from nodejs.org. Never from a link in an issue or a mirror.
- **Nothing in this repository requires administrator rights to build**, and nothing should. A
  step that asks for elevation is a step to question.
- **The build has no network access at runtime** and should need none beyond dependency
  resolution: React, the fonts and every asset are vendored under `app/`.
- **Do not commit build output.** `target/` alone runs to gigabytes, and `gen/` contains
  machine-specific schema paths.
- **`vendor/codex` is third-party source.** Read it; do not modify it in place. Changes there
  belong upstream.

## Verification

1. `cd src-tauri && cargo check` completes with no errors.
2. `npx --yes @tauri-apps/cli@2 dev` opens a window whose title bar reads **Codex Studio**, shows
   a version chip matching `codex --version`, and a bridge chip reading **Tauri IPC**.
3. In the WebView console, `await window.__TAURI__.core.invoke("codex_version")` returns the same
   version and a `home` matching `$CODEX_HOME`.
4. The Health panel's Doctor view reports the same checks as `codex doctor --all` in a terminal.
5. `npx --yes @tauri-apps/cli@2 build` produces both an `.exe` under `bundle\nsis\` and an `.msi`
   under `bundle\msi\`.
6. Install the NSIS output on a clean machine, launch it, and confirm the version chip and Doctor
   view again — an installer that builds but cannot find the CLI on a fresh machine has not been
   verified by a developer-machine run.
