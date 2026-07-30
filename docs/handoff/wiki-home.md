# Codex Studio

A Material 3 **Windows desktop GUI wrapping the OpenAI Codex CLI**. It composes flags, runs the real `codex` binary, streams what it says, and reads your real `~/.codex`. It never reimplements the agent, the sandbox, the config schema or the plugin system.

- **[Documentation site](https://ding-ding-projects.github.io/codex-material/site/)** — every feature, with its own article
- **[Releases](https://github.com/Ding-Ding-Projects/codex-material/releases)** — NSIS `.exe` and MSI, unsigned
- **[Repository documentation](https://github.com/Ding-Ding-Projects/codex-material/tree/main/docs)**

## Install

Take the newest release. Both files install the same build, per user, without administrator rights.

| File | Use it when |
|:--|:--|
| `Codex.Studio-0.1.0-x64.exe` | Installing yourself |
| `Codex.Studio-0.1.0-x64.msi` | Deploying to managed machines |

The installers are **not code-signed**, so SmartScreen warns on first run.

> Releases `build.2` through `build.9` are the earlier Tauri shell and render a blank window. They carry a warning and are superseded.

## The bundled Codex CLI

Each installer carries the Codex CLI (~410 MB unpacked) so a machine that has never installed Codex works immediately. Resolution order:

    CODEX_BIN  →  codex on PATH  →  the bundled copy

Your own install always wins: it owns your login and your `~/.codex`.

## Build from source

    git clone https://github.com/Ding-Ding-Projects/codex-material
    cd codex-material
    npm install
    npm start          # run it
    npm test           # the test suites
    npm run capture    # 16 screenshots, headless
    npm run dist       # NSIS + MSI into dist/

## Where things live

| Path | What it owns |
|:--|:--|
| `app/` | The renderer: template, runtime, i18n, tabs, notifications, changelog, dim sum |
| `electron/` | Main process, preload allow-list, and six backend modules |
| `tools/` | Tests, the capture harness, CLI staging, generators |
| `docs/` | Repository documentation and the published site under `docs/site/` |

## Honest limitations

- Nothing installs and launches the artifact on a clean machine, so "it installs" is not among the things CI verifies.
- Stopping a chat run releases the composer; it does not kill the process.
- Each chat message is its own `codex exec` invocation — there is no resumed interactive thread yet.
- `docs/architecture/overview.md`, `docs/architecture/frontend-runtime.md` and `docs/api/README.md` still carry Tauri-era descriptions in places. Where a page and the code disagree, the code is right.

---

**中文：** 一個包住 OpenAI Codex CLI 嘅 Material 3 Windows 桌面介面。佢負責砌 flag、行真嘅 `codex`、即時串你睇佢講咩、讀你真嘅 `~/.codex`；個 agent、sandbox、設定格式、plugin 系統，一律唔會自己重寫。安裝檔**未簽名**，SmartScreen 第一次開會嘈。Installer 有齊 Codex CLI（解壓後約 410 MB），未裝過 Codex 嘅機開機即用；但你部機有 `codex` 嘅話一定用你嗰個 —— 你個登入同 `~/.codex` 係佢管。`build.2` 到 `build.9` 係舊嘅 Tauri 版，開出嚟一片白，已經標咗警告，唔好裝。
