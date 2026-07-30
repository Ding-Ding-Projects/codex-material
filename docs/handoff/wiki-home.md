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
    npm run capture    # 20 screenshots, headless — exits non-zero if the app fails to render
    npm run dist       # NSIS + MSI into dist/

## Where things live

| Path | What it owns |
|:--|:--|
| `app/` | The renderer: template, runtime, i18n, tabs, notifications, changelog, dim sum |
| `electron/` | Main process, preload allow-list, and six backend modules |
| `tools/` | Tests, the capture harness, CLI staging, generators |
| `docs/` | Repository documentation and the published site under `docs/site/` |

## Language

Three modes — English, playful Hong Kong Cantonese, and bilingual — with **two independent
funny-level sliders**, 1 to 5, one per language. Humour styles the voice, never the facts: a
destructive label still reads as destructive at level 5, and every placeholder survives. The
navigation rail, the tab and appearance menus, the destructive actions and every message go
through the string table; **92 secondary labels do not yet** (mostly the Console flag panel and
the Config section list).

## Honest limitations

- Nothing installs and launches the artifact on a clean machine, so "it installs" is not among the things CI verifies.
- The installers are **not code-signed**; that needs a certificate this project does not have.
- Each chat message is its own `codex exec` invocation — there is no resumed interactive thread yet.
- 92 interface labels are still hard-coded English, so bilingual mode is not yet complete.
- Levels 1 and 2 of the funny sliders are identical for most pre-existing keys, so that step of the slider does nothing visible.
- The appearance editor covers eight typography properties, not the full word-processor set.

## Verified state

Run these four; every figure the repository quotes comes from them.

    node tools/test-frontend.mjs    # 25 passed
    node tools/test-backend.mjs     # 28 passed
    node tools/capture.mjs          # 20 shots, exit 0
    node tools/audit-ui.mjs         # 23 findings, 0 severity high

All 23 remaining audit findings are the harness noting a **deliberately** ellipsised label —
evidence a label no longer fits its box, not a defect. There are no unaddressed real findings.
Before this was worked through there were 228 unique findings across 1646 occurrences.

Screenshots are captured against an **authored `CODEX_HOME`**, never the operator's own: an
earlier set had a real Windows username legible in seven images and a private repository name in
an eighth. A screenshot is a publication.

---

**中文：** 一個包住 OpenAI Codex CLI 嘅 Material 3 Windows 桌面介面。佢負責砌 flag、行真嘅 `codex`、即時串你睇佢講咩、讀你真嘅 `~/.codex`；個 agent、sandbox、設定格式、plugin 系統，一律唔會自己重寫。安裝檔**未簽名**，SmartScreen 第一次開會嘈。Installer 有齊 Codex CLI（解壓後約 410 MB），未裝過 Codex 嘅機開機即用；但你部機有 `codex` 嘅話一定用你嗰個 —— 你個登入同 `~/.codex` 係佢管。`build.2` 到 `build.9` 係舊嘅 Tauri 版，開出嚟一片白，已經標咗警告，唔好裝。介面有三種語言模式（English、廣東話、雙語），仲有兩條各自獨立嘅搞笑程度掣（1 至 5，每種語言一條）—— 搞笑只係改語氣，唔會改事實：第五級嗰句「刪咗佢」一樣睇得出係會刪嘢。仲有 92 個標籤未入字串表，所以雙語模式未算做完，呢樣照實講。
