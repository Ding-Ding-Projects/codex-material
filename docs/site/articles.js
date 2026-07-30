/* Codex Studio — GitHub Pages site content.
 *
 * Everything the site *says* lives here; everything it *does* lives in app.js. No
 * build step, no bundler, no import — this file attaches one object to `window` and
 * app.js reads it.
 *
 * The rule that shapes this file:
 *
 *   FACTS are written once and interpolated. VOICE is written five times per
 *   language and chosen by the funny slider.
 *
 * A voiced string (a lead paragraph, a button label, a toast) is an array of five
 * variants with `{placeholders}` for every number, version, path and command. The
 * placeholder is filled AFTER the level is chosen, so level 1 and level 5 of the same
 * key are guaranteed to name the same file and the same count. Article bodies —
 * behaviour, configuration, failure modes, security, verification — are single-sourced
 * prose with no level variants at all, because they are facts and facts do not have a
 * funny setting.
 *
 * Every claim below was read out of this repository. If one disagrees with the code,
 * the code is right and this file is a bug.
 */
(function (g) {
  "use strict";

  /* ------------------------------------------------------------------ facts
     One value, one place. Interpolated into voiced copy so no variant can drift. */
  var FACTS = {
    product: "Codex Studio",
    version: "0.1.0",
    repo: "Ding-Ding-Projects/codex-material",
    repoUrl: "https://github.com/Ding-Ding-Projects/codex-material",
    shell: "Electron",
    electron: "^40.5.0",
    ipcTotal: "50",
    ipcCodex: "47",
    ipcWindow: "3",
    cliSpec: "@openai/codex@0.146.0-win32-x64",
    cliVersion: "codex-cli 0.146.0",
    cliBytes: "429,285,783",
    cliSize: "409 MiB",
    tests: "45",
    testsFrontend: "23",
    testsBackend: "22",
    shots: "16",
    dishes: "20",
    dishCatalog: "72",
    subcommands: "26",
    globalFlags: "11",
    slashCommands: "52",
    settingGroups: "11",
    settingFields: "108",
    featureFlags: "88",
    hookEvents: "6",
    models: "6",
    patternCap: "2000",
    sampleCap: "20000",
    matchCap: "500",
    msBudget: "300",
    dimsumRate: "1%",
    windowSize: "1440×940",
    windowMin: "960×640",
    articles: "20",
    tabCount: "10",
    navTabs: "Chats, Console, Extend, Config, Cost, Runtime, Health, History, Changelog, Studio"
  };

  /* -------------------------------------------------------------- UI voices
     Five English variants and five Cantonese variants per key, indexed 0..4 by the
     funny slider. Level 1 reads fully professional; level 5 is maximum playfulness.
     Nothing is exempt — errors and warnings are styled too — but every variant of a
     key carries the same `{placeholders}`, so the facts survive the joke. */
  var STRINGS = {
    "site.title": {
      en: ["{product} — documentation", "{product} — documentation", "{product} — documentation",
        "{product} — the documentation", "{product} — the whole story, written down"],
      yue: ["{product} — 說明文件", "{product} — 說明文件", "{product} — 說明書",
        "{product} — 全套說明書", "{product} — 由頭到尾寫晒俾你睇"]
    },
    "site.tagline": {
      en: [
        "A Material 3 Windows desktop GUI for the OpenAI Codex CLI. Every action is a real `codex` invocation.",
        "A Material 3 Windows desktop GUI for the OpenAI Codex CLI — every action is a real `codex` invocation.",
        "A Material 3 Windows desktop GUI for the Codex CLI. Nothing is simulated: every action runs the real `codex`.",
        "A Material 3 desktop GUI for the Codex CLI on Windows. Every button is a real `codex` invocation, not a mock-up of one.",
        "A Material 3 desktop GUI for the Codex CLI on Windows. Every button really does run `codex` — no pretending, no papier-mâché terminal."],
      yue: [
        "俾 OpenAI Codex CLI 用嘅 Material 3 Windows 桌面介面，每個動作都係真正執行 `codex`。",
        "俾 OpenAI Codex CLI 用嘅 Material 3 Windows 桌面介面 — 每個動作都係真係行 `codex`。",
        "Codex CLI 嘅 Material 3 Windows 介面。冇嘢係假嘅：撳落去係真係行 `codex`。",
        "Windows 上面 Codex CLI 嘅 Material 3 介面。每粒掣都係真係行 `codex`，唔係扮嘅。",
        "Windows 上面 Codex CLI 嘅 Material 3 介面。每粒掣真係行 `codex`，唔係做戲，唔係紙紮 terminal。"]
    },
    "site.status": {
      en: [
        "Version {version}. No tag has been pushed and no installer has been published, so this describes the current state of `main`.",
        "Version {version}. No tag has been pushed and no installer published yet — this describes the current state of `main`.",
        "Version {version}. Installers are published on every green build — the newest is `v0.1.0+build.19`, carrying an NSIS `.exe` and an MSI, both unsigned.",
        "Version {version}, and not released yet — no tag, no installer. What you are reading is the current state of `main`.",
        "Version {version}, still in the kitchen. No tag, no installer, nothing to download: this is `main` as it stands right now."],
      yue: [
        "版本 {version}。未 push 過 tag，亦未出過安裝檔，所以呢度講嘅係 `main` 目前嘅狀態。",
        "版本 {version}。未有 tag、未有安裝檔 — 呢度講嘅係 `main` 目前嘅狀態。",
        "版本 {version}，未出街。無 tag 無安裝檔：呢個係 `main` 而家嘅樣。",
        "版本 {version}，仲未出到街 — 無 tag 無安裝檔。你而家睇緊嘅係 `main` 目前嘅狀態。",
        "版本 {version}，仲喺廚房未上枱。無 tag、無安裝檔、冇嘢好載：呢個就係 `main` 而家嘅樣。"]
    },
    "nav.overview": {
      en: ["Overview", "Overview", "Overview", "Overview", "Overview"],
      yue: ["概覽", "概覽", "概覽", "概覽", "概覽"]
    },
    "nav.features": {
      en: ["Features", "Features", "Features", "Features", "Features"],
      yue: ["功能", "功能", "功能", "功能", "功能一覽"]
    },
    "nav.docs": {
      en: ["Documentation", "Documentation", "Documentation", "Documentation", "Documentation"],
      yue: ["說明文件", "說明文件", "說明文件", "說明書", "說明書"]
    },
    "nav.shots": {
      en: ["Screenshots", "Screenshots", "Screenshots", "Screenshots", "Screenshots"],
      yue: ["截圖", "截圖", "截圖", "截圖", "睇圖"]
    },
    "nav.changelog": {
      en: ["Changelog", "Changelog", "Changelog", "Changelog", "Changelog"],
      yue: ["更新紀錄", "更新紀錄", "更新紀錄", "更新紀錄", "更新紀錄"]
    },
    "nav.settings": {
      en: ["Settings", "Settings", "Settings", "Settings", "Settings"],
      yue: ["設定", "設定", "設定", "設定", "設定房"]
    },
    "search.placeholder": {
      en: ["Search {articles} articles", "Search {articles} articles", "Search all {articles} articles",
        "Search all {articles} articles", "Search all {articles} articles — go on, be specific"],
      yue: ["搜尋 {articles} 篇文章", "搜尋 {articles} 篇文章", "搜尋全部 {articles} 篇文章",
        "搜尋全部 {articles} 篇文章", "搜尋全部 {articles} 篇文章 — 打得幾細緻得幾細緻"]
    },
    "search.hits": {
      en: ["{n} of {total} articles match.", "{n} of {total} articles match.", "{n} of {total} articles match.",
        "{n} of {total} articles matched that.", "{n} of {total} articles put their hand up."],
      yue: ["{total} 篇入面有 {n} 篇啱。", "{total} 篇入面有 {n} 篇啱。", "{total} 篇入面 {n} 篇夾到。",
        "{total} 篇入面有 {n} 篇夾到你打嗰個。", "{total} 篇入面有 {n} 篇舉手話啱。"]
    },
    "search.none": {
      en: ["No article matches `{q}`. Nothing was hidden — there is simply no match.",
        "No article matches `{q}`. Nothing is hidden; there is simply no match.",
        "No article matches `{q}` — nothing is hidden, there is just no match.",
        "Nothing matches `{q}`. Nothing is being hidden from you; there is genuinely no match.",
        "Not one article matches `{q}`. Nothing is hidden up a sleeve — there is honestly nothing there."],
      yue: ["無文章夾到 `{q}`。唔係收埋咗，係真係無。",
        "無文章夾到 `{q}`。唔係收埋咗，純粹係無。",
        "無文章夾到 `{q}` — 唔係匿埋，係真係無。",
        "無嘢夾到 `{q}`。唔係收埋唔俾你睇，係真係一篇都無。",
        "一篇都夾唔到 `{q}`。冇收埋喺袖入面，係真係一篇都冇。"]
    },
    "regex.open": {
      en: ["Regex builder", "Regex builder", "Regex builder", "Regex builder", "Regex builder"],
      yue: ["Regex 產生器", "Regex 產生器", "Regex 產生器", "Regex 產生器", "Regex 產生器"]
    },
    "regex.plain": {
      en: ["Plain text is the default. Turn regex on deliberately.",
        "Plain text is the default; regex is an explicit opt-in.",
        "Plain text by default — flip regex on when you actually want it.",
        "Plain text unless you say otherwise. Regex is opt-in, on purpose.",
        "Plain text until you say otherwise. Regex is opt-in, because nobody types `.*` by accident and means it."],
      yue: ["預設係純文字，要用 regex 就自己撳開。",
        "預設純文字；regex 要自己開先用到。",
        "預設純文字 — 真係想用 regex 就自己撳開佢。",
        "預設純文字，唔講就唔會當 regex。要用就自己開，係特登咁設計。",
        "預設純文字，唔開口就唔當 regex。要用自己開 — 冇人會唔覺意打咗個 `.*` 出嚟仲要當真。"]
    },
    "regex.matches": {
      en: ["{n} matches in the sample.", "{n} matches in the sample.", "{n} matches in the sample.",
        "{n} matches found in the sample.", "{n} matches turned up in the sample."],
      yue: ["樣本入面有 {n} 個 match。", "樣本入面有 {n} 個 match。", "樣本入面搵到 {n} 個 match。",
        "喺樣本度搵到 {n} 個 match。", "喺樣本度撈到 {n} 個 match。"]
    },
    "regex.bad": {
      en: ["That pattern is not valid: {detail}",
        "That pattern is not valid: {detail}",
        "That pattern will not compile: {detail}",
        "That pattern will not compile. The engine said: {detail}",
        "That pattern flatly refuses to compile. The engine's exact words: {detail}"],
      yue: ["呢個 pattern 唔合法：{detail}",
        "呢個 pattern 唔合法：{detail}",
        "呢個 pattern 編譯唔到：{detail}",
        "呢個 pattern 編譯唔到，引擎話：{detail}",
        "呢個 pattern 死都唔肯編譯，引擎原話係：{detail}"]
    },
    "regex.refused": {
      en: [
        "Refused: `{frag}` repeats a group that already repeats. Evaluating it can take exponential time inside a single match attempt, which the {ms} ms budget cannot interrupt.",
        "Refused: `{frag}` repeats a group that already repeats. That can take exponential time inside one match attempt, where the {ms} ms budget cannot reach it.",
        "Refused: `{frag}` repeats a group that already repeats — exponential time inside a single match attempt, which the {ms} ms budget cannot interrupt.",
        "Refused before running: `{frag}` repeats a group that already repeats. That is exponential time inside one match attempt, and the {ms} ms budget cannot interrupt it.",
        "Refused before it ever ran: `{frag}` repeats a group that already repeats. That is exponential time inside a single match attempt, and the {ms} ms budget is powerless there — this tab would simply stop answering."],
      yue: [
        "拒絕執行：`{frag}` 重複一個本身已經重複緊嘅 group。喺單一次 match 入面會用指數時間，{ms} 毫秒嘅上限打斷唔到佢。",
        "拒絕執行：`{frag}` 重複咗一個已經重複緊嘅 group，單次 match 就會用指數時間，{ms} 毫秒上限攔唔到。",
        "拒絕執行：`{frag}` 重複一個已經重複緊嘅 group — 單次 match 用指數時間，{ms} 毫秒上限伸唔到入去。",
        "未行就拒絕咗：`{frag}` 重複一個已經重複緊嘅 group。單次 match 就係指數時間，{ms} 毫秒上限根本攔佢唔住。",
        "未行就已經拒絕：`{frag}` 重複一個已經重複緊嘅 group。單次 match 就指數時間，{ms} 毫秒上限喺嗰度完全冇力 — 呢個 tab 會就咁唔應機。"]
    },
    "toast.copied": {
      en: ["Copied {what} to the clipboard.", "Copied {what} to the clipboard.", "Copied {what} to the clipboard.",
        "{what} is on your clipboard.", "{what} is on your clipboard — go paste it somewhere useful."],
      yue: ["已複製 {what} 到剪貼簿。", "已複製 {what} 到剪貼簿。", "{what} copy 咗喇。",
        "{what} 已經喺你嘅剪貼簿。", "{what} 已經喺剪貼簿，快啲搵個位 paste 佢。"]
    },
    "toast.copyFailed": {
      en: ["Could not copy {what}: {detail}", "Could not copy {what}: {detail}", "Could not copy {what} — {detail}",
        "{what} did not make it to the clipboard. The browser said: {detail}",
        "{what} never reached the clipboard. The browser's excuse, verbatim: {detail}"],
      yue: ["copy 唔到 {what}：{detail}", "copy 唔到 {what}：{detail}", "copy 唔到 {what} — {detail}",
        "{what} 去唔到剪貼簿，瀏覽器話：{detail}", "{what} 完全去唔到剪貼簿，瀏覽器嘅藉口原文：{detail}"]
    },
    "toast.cleared": {
      en: ["Filter cleared. All {total} articles are listed again.",
        "Filter cleared — all {total} articles are listed again.",
        "Filter cleared. All {total} articles are back.",
        "Filter cleared, and all {total} articles are back on the shelf.",
        "Filter cleared. All {total} articles have wandered back onto the shelf."],
      yue: ["篩選已清除，{total} 篇文章全部返晒嚟。",
        "篩選已清除 — {total} 篇文章全部返晒嚟。",
        "篩選清咗，{total} 篇文章全部返晒嚟。",
        "篩選清咗，{total} 篇文章全部返晒上架。",
        "篩選清晒，{total} 篇文章一篇唔少咁行返上架。"]
    },
    "toast.saved": {
      en: ["Saved {what}. It is stored in this browser only and persists across reloads.",
        "Saved {what} — stored in this browser only, and it persists across reloads.",
        "Saved {what}. Stored in this browser only; it survives a reload.",
        "Saved {what}. It lives in this browser alone and will survive a reload.",
        "Saved {what}. It lives in this browser and nowhere else, and it will still be here after a reload."],
      yue: ["已儲存 {what}。只係存喺呢個瀏覽器，重新載入都仲喺度。",
        "已儲存 {what} — 只存喺呢個瀏覽器，重新載入都仲喺。",
        "儲咗 {what}。淨係喺呢個瀏覽器，reload 都唔會冇。",
        "儲咗 {what}。淨係住喺呢個瀏覽器，reload 之後都仲喺度。",
        "儲咗 {what}。淨係住喺呢個瀏覽器，第二部機唔會知，reload 之後佢仲喺度等你。"]
    },
    "toast.reset": {
      en: ["Every site preference is back to its default.",
        "Every site preference is back to its default.",
        "Every site preference is back to default.",
        "Every site preference has gone back to default.",
        "Every site preference has scurried back to its default."],
      yue: ["全部網站偏好設定已回復預設。", "全部網站偏好設定已回復預設。", "全部設定返晒去預設。",
        "全部網站設定已經打回原形。", "全部網站設定乖乖咁彈返去預設值。"]
    },
    "toast.pinned": {
      en: ["Pinned {what}. Pinned tabs stay visible when the strip overflows.",
        "Pinned {what} — pinned tabs stay visible when the strip overflows.",
        "Pinned {what}. It stays visible even when the strip overflows.",
        "Pinned {what}. It will stay visible even when the strip runs out of room.",
        "Pinned {what}. It keeps its seat even when the strip runs out of room."],
      yue: ["已釘住 {what}。tab 條擠爆嗰陣，釘住嘅照樣睇得見。",
        "已釘住 {what} — tab 條擠爆都仲見到佢。",
        "釘咗 {what}。條 tab 擠爆都仲見到佢。",
        "釘咗 {what}。就算條 tab 條位唔夠，佢都仲喺度。",
        "釘咗 {what}。就算條 tab 逼到爆，佢個位都冇人搶得走。"]
    },
    "toast.unpinned": {
      en: ["Unpinned {what}.", "Unpinned {what}.", "Unpinned {what}.",
        "Unpinned {what} — it rejoins the ordinary tabs.",
        "Unpinned {what} — back to the general population it goes."],
      yue: ["已取消釘住 {what}。", "已取消釘住 {what}。", "唔釘 {what} 喇。",
        "唔釘 {what} 喇 — 佢返去普通 tab 嗰邊。", "唔釘 {what} 喇 — 佢返去同大隊排隊。"]
    },
    "toast.dimsum": {
      en: ["The dim sum surprise is {state}.", "The dim sum surprise is {state}.", "The dim sum surprise is {state}.",
        "The dim sum surprise is now {state}.", "The dim sum surprise is now {state}. The dishes have been informed."],
      yue: ["點心驚喜而家係{state}。", "點心驚喜而家係{state}。", "點心驚喜而家{state}。",
        "點心驚喜而家{state}。", "點心驚喜而家{state}，啲點心已經收到通知。"]
    },
    "dimsum.hello": {
      en: ["A {dish} appeared. There was a {rate} chance of this.",
        "A {dish} has appeared — there was a {rate} chance of this.",
        "A {dish} turned up. {rate} chance, and it landed.",
        "A {dish} has turned up. There was a {rate} chance, and here we are.",
        "A {dish} has wandered in. {rate} chance, and today it came for you specifically."],
      yue: ["有碟{dish}出現咗，機會率係 {rate}。",
        "有碟{dish}出現咗 — 機會率 {rate}。",
        "有碟{dish}行咗出嚟，{rate} 機會，畀你抽中。",
        "有碟{dish}行咗出嚟。得 {rate} 機會，今次就係你。",
        "有碟{dish}靜靜雞行咗埋嚟。得 {rate} 機會咋，今日佢專登搵你。"]
    },
    "shots.caption": {
      en: ["Captured from the real app through `npm run capture`.",
        "Captured from the real app through `npm run capture`.",
        "Captured from the real app by `npm run capture` — no mock-ups.",
        "Captured from the real app by `npm run capture`. Not one of these is a mock-up.",
        "Captured from the real app by `npm run capture`. Not a single mock-up in the pile — these are real pixels."],
      yue: ["用 `npm run capture` 由真正嘅 app 影出嚟。",
        "用 `npm run capture` 由真正嘅 app 影出嚟。",
        "用 `npm run capture` 喺真 app 影嘅 — 唔係樣板圖。",
        "用 `npm run capture` 喺真 app 影嘅，一張都唔係樣板圖。",
        "用 `npm run capture` 喺真 app 影嘅，一張樣板圖都冇，全部係真 pixel。"]
    },
    "article.suggested": {
      en: ["Where to go next", "Where to go next", "Where to go next", "Where to go next", "Where to go next"],
      yue: ["跟住睇邊篇", "跟住睇邊篇", "跟住睇邊篇", "跟住睇邊篇好", "跟住睇邊篇好"]
    },
    "article.back": {
      en: ["All articles", "All articles", "All articles", "Back to all articles", "Back to all articles"],
      yue: ["全部文章", "全部文章", "全部文章", "返去全部文章", "返去全部文章"]
    },
    "voice.demo": {
      en: [
        "This sentence is level {level} in English. The version is {version} and the CLI is {cliVersion}.",
        "This sentence is level {level} in English. The version is {version} and the CLI is {cliVersion}.",
        "This sentence is level {level} in English — the version is {version}, the CLI is {cliVersion}.",
        "This sentence is written at level {level} in English. The version is still {version} and the CLI is still {cliVersion}.",
        "This sentence is level {level} in English and is having a marvellous time. The version is still {version}, the CLI is still {cliVersion}, and no amount of enthusiasm changes either."],
      yue: [
        "呢句係廣東話第 {level} 級。版本係 {version}，CLI 係 {cliVersion}。",
        "呢句係廣東話第 {level} 級。版本係 {version}，CLI 係 {cliVersion}。",
        "呢句係廣東話第 {level} 級 — 版本 {version}，CLI {cliVersion}。",
        "呢句用廣東話第 {level} 級寫。版本一樣係 {version}，CLI 一樣係 {cliVersion}。",
        "呢句用廣東話第 {level} 級寫，寫到好興奮。版本照舊 {version}，CLI 照舊 {cliVersion}，幾興奮都唔會變。"]
    }
  };

  /* --------------------------------------------------------------- articles
     Article bodies carry no level variants. They are the facts, and a fact does not
     have a funny setting. Only `lead` is voiced. */

  function a(id, title, tag, summary, lead, sections, suggested) {
    return { id: id, title: title, tag: tag, summary: summary, lead: lead, sections: sections, suggested: suggested };
  }
  function p(v) { return { t: "p", v: v }; }
  function ul(v) { return { t: "ul", v: v }; }
  function code(v) { return { t: "code", v: v }; }
  function kv(rows) { return { t: "kv", v: rows }; }

  var ARTICLES = [

    /* ------------------------------------------------------------ 1. shell */
    a("shell", "The Electron shell and the IPC surface", "Architecture",
      "A Tauri 2 backend was replaced by an Electron main process. The renderer reaches the machine through exactly " + FACTS.ipcTotal + " named IPC commands and nothing else.",
      {
        en: [
          "The desktop shell is Electron. It was Tauri 2 until commit `561da4b`, and the documentation under `docs/architecture/` still describes the Rust backend that Electron replaced.",
          "The desktop shell is Electron. It was Tauri 2 until commit `561da4b` — the pages under `docs/architecture/` still describe the Rust backend Electron replaced.",
          "The desktop shell is Electron now. It was Tauri 2 until commit `561da4b`, and `docs/architecture/` has not caught up: those pages still describe the Rust backend.",
          "The desktop shell is Electron. It was Tauri 2 right up until commit `561da4b`, and `docs/architecture/` has not caught up yet — those pages still describe the Rust backend that is no longer there.",
          "The desktop shell is Electron. It was Tauri 2 until commit `561da4b` came along and swapped the engine out. The pages under `docs/architecture/` are still cheerfully describing a Rust backend that has left the building."],
        yue: [
          "桌面外殼係 Electron。喺 commit `561da4b` 之前係 Tauri 2，而 `docs/architecture/` 嗰幾頁仲係講緊被 Electron 換走咗嘅 Rust backend。",
          "桌面外殼係 Electron。commit `561da4b` 之前係 Tauri 2 — `docs/architecture/` 嗰幾頁仲係講緊已經換走咗嘅 Rust backend。",
          "桌面外殼而家係 Electron。commit `561da4b` 之前係 Tauri 2，`docs/architecture/` 未跟得上，嗰幾頁仲講緊 Rust backend。",
          "桌面外殼係 Electron。一直到 commit `561da4b` 之前都係 Tauri 2，而 `docs/architecture/` 仲未跟到手 — 嗰幾頁仲喺度講一個已經唔存在嘅 Rust backend。",
          "桌面外殼係 Electron。commit `561da4b` 一到就換咗個引擎。`docs/architecture/` 嗰幾頁仲好開心咁介紹緊一個早就走咗嘅 Rust backend。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`electron/main.js` creates one `BrowserWindow` at " + FACTS.windowSize + " with a minimum of " + FACTS.windowMin + ", `frame: false` because the app draws its own Material 3 title bar, and `backgroundColor: \"#141218\"` so the first paint is the dark surface rather than white."),
          p("The renderer runs with `contextIsolation: true` and `nodeIntegration: false`. It cannot reach Node at all. The only bridge is `electron/preload.js`, which exposes `window.CODEX_BRIDGE` with three members: `invoke(command, args)`, `listen(channel, handler)` and a `window` object holding minimise, maximise and close."),
          p("`invoke` checks the requested name against a hard-coded array of " + FACTS.ipcTotal + " commands and rejects anything else before it reaches IPC. `listen` refuses any channel that does not start with `codex://`, and returns an unsubscribe function so a panel that unmounts mid-run stops receiving lines."),
          p("A second launch does not start a rival copy: `app.requestSingleInstanceLock()` focuses the running window instead. Two copies would fight over the same `$CODEX_HOME/studio` git repository."),
          p("Navigation is pinned to the bundled page. `setWindowOpenHandler` denies every new window, and `will-navigate` cancels anything that is not `file://`. An `http(s)` URL in either case is handed to `shell.openExternal`, so a link opens in the user's real browser."),
          kv([
            ["Commands total", FACTS.ipcTotal],
            ["`codex_*` commands", FACTS.ipcCodex],
            ["`window_*` commands", FACTS.ipcWindow],
            ["Streaming channel", "`codex://stdout`"],
            ["Electron dependency", FACTS.electron]
          ])
        ]},
        { h: "Configuration", blocks: [
          p("There is nothing to configure in the shell. The window geometry, the frame setting and the web preferences are literals in `electron/main.js`; the command list is a literal in `electron/preload.js`."),
          p("Adding a command means editing two files: register it with `command(name, handler)` in `electron/commands.js`, and add its name to the `COMMANDS` array in `electron/preload.js`. A command in one and not the other fails a test.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Unregistered name.** `invoke` rejects with ``unknown backend command `x` `` before any IPC traffic. The renderer sees a rejected promise, and the app surfaces the message verbatim in a notification.",
            "**Handler throws.** `command()` wraps every handler in try/catch and rethrows `new Error(e.message)`, so the renderer receives the real message rather than Electron's serialisation of an arbitrary object.",
            "**Window destroyed mid-run.** `codex_run` checks `target && !target.isDestroyed()` before every streamed line, so closing the window during a run does not throw on a dead WebContents.",
            "**A section of `codex_state` fails.** Each of the eight parallel reads is wrapped by a `soft()` helper that records the message under `errors[key]` and returns a fallback, so one failing marketplace does not blank the MCP list beside it."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("`contextIsolation` is on and `nodeIntegration` is off, so a bug in the page cannot reach the filesystem except through the enumerated command list. `sandbox: false` is set because the preload needs `require`; the renderer itself still has no Node access."),
          p("The command list is an allow-list, not a generic `invoke` passthrough. The page can never call an IPC channel that was not designed to be called from it."),
          p("The page ships a Content-Security-Policy of `default-src 'self'` with `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. `unsafe-eval` is required because `app/support.js` compiles the page's own template with `new Function`. That is code already inside the bundle; nothing is ever fetched.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-backend.mjs\n# → \"every command the preload exposes is registered by the main process\""),
          p("That test reads the `COMMANDS` array out of `electron/preload.js` and the `command(\"…\")` registrations out of `electron/commands.js` and compares them. It is the only thing standing between a renamed command and a button that silently does nothing."),
          code("npm start   # runs `electron .`")
        ]}
      ],
      { related: ["cli", "chats"], prereq: [], next: "cli" }),

    /* -------------------------------------------------------------- 2. cli */
    a("cli", "The bundled CLI and binary resolution", "Architecture",
      "Three candidates in a fixed order: `CODEX_BIN`, the user's own `codex` on PATH, then the " + FACTS.cliSize + " copy bundled with the installer.",
      {
        en: [
          "Studio never reimplements the agent. It finds a `codex` binary, runs it and shows what it said. Which binary it finds, and why, is the whole of this article.",
          "Studio never reimplements the agent — it finds a `codex` binary, runs it and shows what it said. Which binary it finds, and why, is the whole of this article.",
          "Studio does not reimplement the agent. It finds a `codex`, runs it, and shows you what came back. Which `codex` it finds is the whole of this article.",
          "Studio reimplements nothing about the agent. It finds a `codex`, runs it, and shows you exactly what came back. Which `codex` it picks, and why, is the whole of this article.",
          "Studio reimplements precisely nothing about the agent. It finds a `codex`, runs it, and repeats what it said without editorialising. Which `codex` gets picked is the entire plot of this article."],
        yue: [
          "Studio 唔會重寫個 agent。佢搵到個 `codex` binary，行佢，再照原文顯示。佢搵邊個 binary、點解，就係呢篇文全部內容。",
          "Studio 唔會重寫個 agent — 佢搵個 `codex` binary 出嚟行，再照原文顯示。搵邊個、點解，就係呢篇文嘅全部。",
          "Studio 唔會重寫 agent。佢搵個 `codex` 行，再照樣顯示返俾你。佢揀邊個 `codex` 就係呢篇文全部內容。",
          "Studio 完全冇重寫過 agent。佢搵個 `codex` 行，然後一字不改咁顯示返。佢點揀邊個 `codex`，就係呢篇文嘅全部劇情。",
          "Studio 一啲都冇重寫過個 agent。佢搵個 `codex` 行完，照原文覆述，唔加鹽加醋。佢揀邊個 `codex`，就係呢篇文成套劇情。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`electron/lib/cli.js` resolves the binary once per process and caches the result. Probing PATH on every invocation would add a process spawn to every call."),
          ul([
            "**`CODEX_BIN`** — an explicit environment override always wins. Reported as source `CODEX_BIN`.",
            "**The user's own install** — `where codex` on Windows. Reported as source `installed on this machine`. This wins over the bundled copy on purpose: the user's install owns their login, their `~/.codex` and their update channel, and shadowing it is how a machine ends up \"logged out\" in this app and logged in everywhere else.",
            "**The bundled copy** — `resources/codex-bin/bin/codex.exe` when packaged, `vendor/codex-bin/bin/codex.exe` from a checkout. Reported as source `bundled with Codex Studio`.",
            "**Nothing found** — the bare name `codex` is returned with source `not found`, so the failure message names the real problem instead of a path nobody recognises."
          ]),
          p("`CODEX_HOME` is the `CODEX_HOME` environment variable when set, and `os.homedir()/.codex` otherwise."),
          p("Every spawn uses `shell: true` on win32, because Windows resolves `codex` to a `.cmd` shim that `spawn` will not execute without a shell. Arguments therefore stay an argv array and are never interpolated into a command string."),
          p("`run()` uses `execFile` with a 120 000 ms default timeout and a 32 MiB buffer. `stream()` uses `spawn` and drains stdout and stderr concurrently — draining one to completion first deadlocks the moment a chatty process fills the pipe nobody is reading. `runJson()` retries a failed `JSON.parse` from the first `{` or `[`, because some Codex subcommands print a human banner before the JSON body.")
        ]},
        { h: "Configuration", blocks: [
          p("`tools/fetch-codex.mjs` stages the bundled copy. It downloads OpenAI's own published release artifact from npm — not a mirror."),
          code("node tools/fetch-codex.mjs            # latest published version\nnode tools/fetch-codex.mjs 0.146.0    # a specific one\nnode tools/fetch-codex.mjs --check    # report what is staged, download nothing"),
          p("The platform builds are published as *versions* of `@openai/codex`, not as separate packages, so the spec is `" + FACTS.cliSpec + "`. The whole platform tree is copied, not just the executable: the CLI resolves `codex-path/rg.exe`, `codex-resources/…` and the code-mode host relative to itself."),
          kv([
            ["Currently staged", FACTS.cliVersion],
            ["Package spec", "`" + FACTS.cliSpec + "`"],
            ["Unpacked size", FACTS.cliBytes + " bytes (" + FACTS.cliSize + ")"],
            ["Stage record", "`vendor/codex-bin-version.json`"],
            ["Installer mapping", "`vendor/codex-bin` → `resources/codex-bin`"]
          ]),
          p("`vendor/codex-bin/` is in `.gitignore`. It is staged at build time, never committed.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**No `codex` anywhere.** Every command fails with the real spawn error. The app reports it; it does not pretend a listing is empty when the binary is missing.",
            "**`npm pack` fails during staging.** `fetch-codex.mjs` exits 1 and prints that the app still runs from a PATH install but the installer will carry no CLI. The CI job turns that into a warning and records `bundled=false`, and the release notes say so instead of claiming a bundle that is not there.",
            "**The npm package layout changes.** If `package/vendor/x86_64-pc-windows-msvc` is missing, staging exits 1 rather than shipping a broken tree.",
            "**Tar on Windows.** GNU tar reads `C:\\…` as a remote host and tries an rsh connection to a machine called \"C\". The tool prefers `%SystemRoot%\\System32\\tar.exe` and falls back to `--force-local`.",
            "**A subcommand that does not return JSON.** `runJson` throws with the exit code and stderr when the process failed, or with the first 200 characters of stdout when it succeeded but printed something unparseable."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("The binary comes from `@openai/codex` on npm, which is OpenAI's own release artifact. No mirror, no fork, no link from an issue or a documentation page."),
          p("Because `shell: true` is required on Windows, argument arrays are never joined into a string anywhere in `cli.js`. Interpolating a user-supplied path into a shell string would be a command-injection hole; passing argv keeps the shell out of the argument parsing."),
          p("API-key login is refused from the GUI on purpose. `codex_login` throws with a message telling the user to run `codex login --with-api-key` in a terminal, so the key never passes through the renderer, an IPC payload or a log.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/fetch-codex.mjs --check\n# → staged: …\\vendor\\codex-bin\\bin\\codex.exe (nnn.n MB)"),
          p("In the app, the title bar shows the CLI version chip, and Health reports `bin`, `binSource` and `bundled` from `codex_version` — so which binary is running is on screen, not a guess.")
        ]},
      ],
      { related: ["shell", "health", "ci"], prereq: ["shell"], next: "chats" }),

    /* ------------------------------------------------------------ 3. chats */
    a("chats", "Chats and streaming runs", "Product",
      "Sessions are read from the real rollout files in `$CODEX_HOME/sessions`. A run streams its output line by line over the `codex://stdout` channel.",
      {
        en: [
          "The Chats tab lists real sessions from disk and runs the real binary. Nothing in it is generated for display.",
          "The Chats tab lists real sessions from disk and runs the real binary — nothing in it is generated for display.",
          "Chats lists real sessions off the disk and runs the real binary. Nothing here is invented for the screenshot.",
          "Chats lists real sessions straight off the disk and runs the real binary. Nothing here was invented to make the screenshot look busy.",
          "Chats lists real sessions straight off the disk and runs the real binary. Not one row was invented to make the screenshot look busier than the machine actually is."],
        yue: [
          "Chats 分頁列出磁碟上真實嘅 session，行嘅係真 binary。入面冇一樣嘢係為咗顯示而砌出嚟。",
          "Chats 分頁列出磁碟上嘅真 session，行真 binary — 冇一樣嘢係為咗顯示砌出嚟。",
          "Chats 由磁碟度攞真 session 出嚟列，行真 binary。冇嘢係為咗影相砌出嚟。",
          "Chats 直接由磁碟攞真 session 出嚟，行真 binary。冇一行係為咗令張截圖好睇啲而砌出嚟。",
          "Chats 直接由磁碟攞真 session 出嚟，行真 binary。冇一行係為咗令張截圖睇落忙啲而作出嚟。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`codex_session_list` walks `$CODEX_HOME/sessions` and `$CODEX_HOME/archived_sessions` for `.jsonl` rollout files. It sorts by mtime **before** reading any metadata and keeps only the newest 300, because rollouts routinely run to several megabytes and there are often hundreds on disk."),
          p("For each surviving file it reads exactly the first line — the `session_meta` record is always first — through a read stream capped at 65 535 bytes. A file that vanished mid-scan simply sorts last instead of throwing."),
          p("A run is composed as an argv array by the frontend and handed to `codex_run`. The main process spawns it, sends each line to the window as `{ id, level, text }` on the channel named in the request, and resolves with `{ code, id, lines }` when the process closes. `level` is `out` for stdout and `error` for stderr."),
          p("The per-chat argv is built from the active profile: `-C <cwd> --skip-git-repo-check`, `-m <model>` when a model is set, then either `--dangerously-bypass-approvals-and-sandbox` when YOLO is on, or `-s <sandbox>` and `-c approval_policy=<json>` when it is not."),
          p("`codex_session_action` maps `archive`, `unarchive` and `delete` to the corresponding `codex` subcommands. Studio does not delete a rollout file itself.")
        ]},
        { h: "Configuration", blocks: [
          p("Nothing about a run is configured in Studio. Model, sandbox, approval policy and working directory come from the active profile and are turned into the same flags a user would type."),
          p("YOLO mode is a title-bar toggle. It adds `--dangerously-bypass-approvals-and-sandbox` to every composed run and survives a restart, which is exactly why the toggle names what it does rather than showing an abbreviation.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**No arguments composed.** `codex_run` throws `no arguments were composed for this run` rather than spawning a bare `codex`.",
            "**The binary will not start.** `stream()` rejects with ``could not start `…`: <message>``, and the frontend raises it as an error notification carrying the message verbatim.",
            "**Non-zero exit.** The transcript keeps every line and the app reports `codex exited <code>`. The output above it is the whole explanation; Studio adds nothing.",
            "**An unreadable rollout.** `readSessionMeta` resolves `null` on a parse failure, an open failure or a stream error, and the row still lists using the filename stem as its identity.",
            "**A run already in flight.** The frontend refuses a second concurrent run on the same thread and says so."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Rollout transcripts contain whatever the user discussed with the agent. Studio reads only the first line of each file for the listing; it never uploads, copies or transmits a transcript."),
          p("Streaming is one-way and channel-scoped. `listen` refuses any channel outside the `codex://` prefix, so a page bug cannot subscribe to arbitrary IPC traffic."),
          p("The 32 MiB `maxBuffer` on one-shot captures bounds what a runaway process can force into memory before the call fails.")
        ]},
        { h: "How to verify it", blocks: [
          code("npm start\n# Chats → the session list is whatever is in %USERPROFILE%\\.codex\\sessions"),
          p("Compare the list against `codex` itself. If Studio shows a session the CLI does not, that is a bug in Studio, not a feature.")
        ]}
      ],
      { related: ["console", "cli", "wsl"], prereq: ["cli"], next: "console" }),

    /* ---------------------------------------------------------- 4. console */
    a("console", "The console flag builder", "Product",
      FACTS.subcommands + " subcommands and " + FACTS.globalFlags + " global flags, transcribed from codex-rs, composed into an argv array you can read before you run it.",
      {
        en: [
          "The Console composes a command from a catalog of real subcommands and flags, shows the exact argv, and then runs it.",
          "The Console composes a command from a catalog of real subcommands and flags, shows you the exact argv, then runs it.",
          "The Console builds a command from real subcommands and flags, shows the exact argv, and only then runs it.",
          "The Console builds the command from real subcommands and flags, shows you the exact argv it is about to run, and only then runs it.",
          "The Console builds the command out of real subcommands and flags, shows you the exact argv it is about to fire, and only then pulls the trigger. No surprises, no hidden extras."],
        yue: [
          "Console 由真實嘅子指令同 flag 目錄砌出一條指令，顯示完整 argv，然後先執行。",
          "Console 由真實子指令同 flag 砌條指令出嚟，畀你睇晒成串 argv，然後先行。",
          "Console 用真嘅子指令同 flag 砌條指令，畀你睇實 argv，先至行。",
          "Console 用真嘅子指令同 flag 砌條指令，將成串 argv 攤晒出嚟畀你睇，然後先至行。",
          "Console 用真嘅子指令同 flag 砌條指令，將成串 argv 攤開晒畀你睇，然後先至撳落去。冇驚喜，冇偷偷加料。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`app/codex-data.js` holds the catalog, transcribed from codex-rs source files that are named in its header comment: `cli/src/main.rs`, `tui/src/cli.rs`, `tui/src/slash_command.rs`, `utils/cli/src/shared_options.rs`, `config/src/config_toml.rs`, `config/src/types.rs` and `features/src/lib.rs`."),
          kv([
            ["Subcommands", FACTS.subcommands],
            ["Global flags", FACTS.globalFlags],
            ["Slash commands", FACTS.slashCommands],
            ["Config setting groups", FACTS.settingGroups],
            ["Config fields", FACTS.settingFields],
            ["Feature flag keys", FACTS.featureFlags],
            ["Hook events", FACTS.hookEvents],
            ["Models", FACTS.models]
          ]),
          p("`buildArgv` turns the selected subcommand and its filled fields into an array. A boolean field contributes its flag alone; a field whose flag starts with a capital letter is a positional and contributes its value alone; everything else contributes flag then value. YOLO adds `--dangerously-bypass-approvals-and-sandbox`, and a non-default profile adds `--profile <id>`."),
          p("The preview line is built by joining that array, and the transcript records it as `$ codex …` before the first output line arrives. What you read is what is executed — the display string is derived from the argv, not typed separately.")
        ]},
        { h: "Configuration", blocks: [
          p("The catalog is data. Adding a flag means adding an entry to `SUBCOMMANDS` or `GLOBAL_FLAGS` in `app/codex-data.js`; nothing in the run path needs to change."),
          p("Because the catalog is a transcription rather than a probe of the installed binary, it can drift from a newer CLI. It describes what the transcribed source exposed, and the run itself is still whatever the installed binary does with those arguments.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**A flag the installed CLI does not have.** The composed run fails with the CLI's own usage error, shown verbatim. Studio does not validate flags against the binary.",
            "**An empty composition.** `codex_run` refuses an empty argv rather than spawning a bare `codex`.",
            "**A value with spaces.** Arguments travel as an argv array all the way to `spawn`, so quoting is never hand-rolled and a path with spaces is not split."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("The preview is the argument list, not a shell string, so a value containing `&&` or `|` is passed as one argument rather than becoming a second command."),
          p("`--dangerously-bypass-approvals-and-sandbox` is a deliberate, named, persistent toggle rather than a hidden default. The label says what it removes.")
        ]},
        { h: "How to verify it", blocks: [
          code("node -e \"global.window={};require('./app/codex-data.js');const C=window.CODEX;console.log(C.SUBCOMMANDS.length,C.GLOBAL_FLAGS.length,C.SLASH.length,C.FEATURES.length)\"\n# → " + FACTS.subcommands + " " + FACTS.globalFlags + " " + FACTS.slashCommands + " " + FACTS.featureFlags),
          p("In the app, the composed line is visible above the output. Copy it into a terminal and it runs identically.")
        ]}
      ],
      { related: ["chats", "config", "extend"], prereq: ["chats"], next: "extend" }),

    /* ----------------------------------------------------------- 5. extend */
    a("extend", "Extend — MCP, plugins, skills, hooks and feature flags", "Product",
      "Seven sections over the real `codex mcp`, `codex plugin` and `codex features` output, plus skills read straight off disk and hooks read out of `config.toml`.",
      {
        en: [
          "Extend is where everything bolted on to Codex is listed. Each section reads from the CLI or from disk; none of it is stored by Studio.",
          "Extend lists everything bolted on to Codex. Each section reads from the CLI or from disk — Studio stores none of it.",
          "Extend is the bolt-on drawer. Every section reads from the CLI or from disk; Studio itself stores none of it.",
          "Extend is the bolt-on drawer: MCP servers, plugins, marketplaces, skills, hooks and feature flags. Every section reads from the CLI or from disk, and Studio stores none of it itself.",
          "Extend is the bolt-on drawer, and it is a busy one. Every section reads from the CLI or straight off the disk — Studio keeps no shadow copy, because a shadow copy is just a lie with a timestamp."],
        yue: [
          "Extend 列出所有加落 Codex 度嘅嘢。每一區都係由 CLI 或者磁碟讀返嚟，Studio 唔會自己儲。",
          "Extend 列晒所有加落 Codex 嘅嘢。每區都係由 CLI 或磁碟讀返嚟 — Studio 一樣都唔會自己儲。",
          "Extend 就係加料抽屜。每區都由 CLI 或磁碟讀，Studio 自己乜都唔儲。",
          "Extend 就係加料抽屜：MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。每區都由 CLI 或磁碟讀，Studio 自己一樣都唔儲。",
          "Extend 就係加料抽屜，仲要好逼。每區都由 CLI 或者直接由磁碟讀 — Studio 唔會留副本，因為副本只不過係一個有時間戳嘅大話。"]
      },
      [
        { h: "Behaviour", blocks: [
          ul([
            "**MCP servers** — `codex mcp list --json`, normalised into transport, command, args, url, cwd, enabled state, OAuth status and the two timeout fields. Adding uses `codex mcp add`; removing uses `codex mcp remove`.",
            "**Enable / disable an MCP server** is a config edit, not a CLI verb: Studio writes `mcp_servers.<name>.enabled`, and Codex reads it on its next run.",
            "**Plugin marketplace** — `codex plugin list --available --json`, merging the `installed` and `available` arrays and de-duplicating by plugin id.",
            "**Installed plugins** — `codex plugin list --json`. Install and uninstall are `codex plugin add` and `codex plugin remove`.",
            "**Registries** — `codex plugin marketplace list --json`, plus add and remove.",
            "**Skills** — scanned from `$CODEX_HOME/skills`, `~/.agents/skills` and, when a project cwd is known, `<cwd>/.codex/skills`. A directory counts as a skill when it contains `SKILL.md`. The description is read from the first `description:` line in the first 20 lines of that file.",
            "**Hooks** — read from the `[hooks.<event>]` tables in `config.toml`. " + FACTS.hookEvents + " events are catalogued: session-start, user-prompt-submit, pre-tool-use, post-tool-use, notification and session-end.",
            "**Feature flags** — `codex features list`, parsed from both ends of each line so a multi-word stage such as \"under development\" stays intact. Toggling runs `codex features enable|disable <key>`."
          ]),
          p("A skill is switched off by renaming its directory with a `.disabled` suffix — the same convention the CLI itself uses when skipping one. The state lives on disk, so it survives regardless of which client wrote it.")
        ]},
        { h: "Configuration", blocks: [
          p("MCP enablement lives at `mcp_servers.<name>.enabled` in `config.toml`. Hooks live under `[hooks.<event>]` with `name`, `command`, `scope`, `trusted` and `enabled` fields."),
          p("A hook's default enabled state is its `trusted` value: an untrusted hook is listed as disabled unless it explicitly says otherwise.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**A CLI subcommand fails.** The error carries the exit code and stderr, and the section shows it. `codex_state` isolates each section, so a failing marketplace does not blank the MCP list.",
            "**A skill directory with no `SKILL.md`.** It is not listed. `skillToggle` refuses a directory without one rather than renaming something arbitrary.",
            "**An unreadable `SKILL.md`.** The skill still lists, without its description.",
            "**A malformed `config.toml`.** `readToml` throws naming the file and the parser message, and the hooks section reports it instead of showing an empty list."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("An untrusted hook can never be enabled from the GUI. `hookToggle` throws `untrusted hooks never run and cannot be enabled here` before touching the config. A hook is an arbitrary command that runs around every tool call, so the trust decision stays outside the GUI."),
          p("MCP servers and plugins are third-party code. Studio lists what is configured and what a marketplace offers; it makes no claim about what any of it does."),
          p("Skill toggling renames a directory inside `$CODEX_HOME` or `~/.agents`. It never writes into a user's project except at `<cwd>/.codex/skills`, which it only reads.")
        ]},
        { h: "How to verify it", blocks: [
          code("codex mcp list --json\ncodex plugin list --json\ncodex features list"),
          p("The three commands above produce exactly what the three sections render. A row in Studio that the CLI does not report is a bug.")
        ]}
      ],
      { related: ["config", "console"], prereq: ["console"], next: "config" }),

    /* ----------------------------------------------------------- 6. config */
    a("config", "config.toml editing, with a backup before every write", "Product",
      FACTS.settingFields + " fields in " + FACTS.settingGroups + " groups. Every write copies the previous file to `config.toml.studio-<epoch>.bak` first, and invalid TOML is refused rather than saved.",
      {
        en: [
          "Studio edits `$CODEX_HOME/config.toml` through a dotted key path and a JSON value. It backs the file up before every write.",
          "Studio edits `$CODEX_HOME/config.toml` through a dotted key path and a JSON value, and backs the file up before every write.",
          "Studio edits `$CODEX_HOME/config.toml` by dotted key path — and backs the file up before every single write.",
          "Studio edits `$CODEX_HOME/config.toml` by dotted key path and JSON value, and copies the old file aside before every single write.",
          "Studio edits `$CODEX_HOME/config.toml` by dotted key path and JSON value, and copies the old file aside before every single write — because a config editor without an undo is just a shredder with a nice font."],
        yue: [
          "Studio 用點分隔嘅 key 同 JSON 值改 `$CODEX_HOME/config.toml`，每次寫入前都會先備份。",
          "Studio 用點分隔 key 同 JSON 值改 `$CODEX_HOME/config.toml`，每次寫入前都備份。",
          "Studio 用點分隔嘅 key path 改 `$CODEX_HOME/config.toml` — 每一次寫入前都備份。",
          "Studio 用點分隔 key path 同 JSON 值改 `$CODEX_HOME/config.toml`，每一次寫入之前都會將舊檔 copy 開一邊。",
          "Studio 用點分隔 key path 同 JSON 值改 `$CODEX_HOME/config.toml`，每次寫入前都 copy 開舊檔 — 因為冇 undo 嘅設定編輯器，其實同碎紙機冇分別，只係字型靚啲。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`codex_set_config` takes `{ key, value }` where key is a dotted path such as `mcp_servers.github.enabled`. `electron/lib/config.js` parses the current document with `smol-toml`, creates intermediate tables as needed, sets or — with `null` — deletes the leaf, then stringifies and writes the whole document."),
          p("`codex_write_config` takes raw TOML text. It parses the text first and throws `refusing to write invalid TOML: <message>` if it does not parse, so a bad edit never reaches disk."),
          p("Every write calls `backup()` first, which copies the existing file to `config.toml.studio-<unix-seconds>.bak` beside it. The write result reports `{ written, path, backup, bytes }`, so the panel can name the backup it just made."),
          p("The frontend renders " + FACTS.settingFields + " fields across " + FACTS.settingGroups + " groups — Model, Approvals & sandbox, Instructions & context, Tools, Agents & memories, Terminal UI, History & storage, Accounts & auth, Telemetry & notices, Realtime & audio and Shell environment — with each enum's real values from `codex-data.js`, and a live TOML preview of the resulting document.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["File", "`$CODEX_HOME/config.toml`"],
            ["`CODEX_HOME`", "the `CODEX_HOME` variable, else `%USERPROFILE%\\.codex`"],
            ["Backup name", "`config.toml.studio-<unix-seconds>.bak`"],
            ["Parser / writer", "`smol-toml`"],
            ["Backup retention", "none — backups accumulate until deleted by hand"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**The existing file does not parse.** `readToml` throws `<path> does not parse: <message>`, naming the file so the user knows which one to fix.",
            "**Invalid TOML submitted.** The write is refused before the backup is even attempted, and the message is the parser's own.",
            "**The backup cannot be written.** `backup()` returns `null` and the write proceeds. Losing the ability to back up is reported through the result rather than blocking a save the user asked for.",
            "**An empty key.** `setPath` throws `empty config key`.",
            "**No file yet.** `readText` returns an empty string and `readToml` returns `{}`; the first write creates `$CODEX_HOME` with `recursive: true`."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Studio does not validate config semantics. It writes what the user asked for and lets Codex reject anything it does not accept — modelling the config schema in two places is how the two get to disagree."),
          p("The backup sits beside the original inside `$CODEX_HOME`, at the same permissions. Nothing is copied out of that directory."),
          p("`config.toml` can contain provider endpoints and header names. Studio renders it in a preview pane; it never transmits it.")
        ]},
        { h: "How to verify it", blocks: [
          code("dir %USERPROFILE%\\.codex\\config.toml.studio-*.bak"),
          p("Change one setting in the Config tab and a new `.bak` appears with the previous contents. The History tab records the same change as a revision, and `codex-config.toml` inside the history repository holds the config as it stood at that revision.")
        ]}
      ],
      { related: ["history", "extend"], prereq: ["extend"], next: "cost" }),

    /* ------------------------------------------------------------- 7. cost */
    a("cost", "The API-equivalent cost calculator", "Product",
      "Local arithmetic over token counts and a published price table. It touches no agent behaviour and calls no billing API.",
      {
        en: [
          "The Cost tab answers one question: what would this usage have cost at API prices, against what the plan costs.",
          "The Cost tab answers one question — what this usage would have cost at API prices, against what the plan costs.",
          "The Cost tab answers exactly one question: what would this have cost at API prices, versus what the plan costs.",
          "The Cost tab answers exactly one question: what this usage would have cost at API rates, set against what the plan actually costs.",
          "The Cost tab answers exactly one question, and it is the question everyone is quietly thinking: what would this have cost at API rates, versus what the plan bills."],
        yue: [
          "Cost 分頁只答一條問題：呢啲用量如果照 API 價錢計要幾錢，同你個 plan 比較。",
          "Cost 分頁只答一條問題 — 呢啲用量照 API 價計要幾錢，同個 plan 嘅價錢比。",
          "Cost 分頁淨係答一條問題：呢啲用量照 API 價要幾錢，對比個 plan 幾錢。",
          "Cost 分頁淨係答一條問題：呢啲用量照 API 價計要幾多錢，對住個 plan 實際收幾多。",
          "Cost 分頁淨係答一條問題，亦係大家心照嗰條：照 API 價計要幾錢，同個 plan 收幾錢，邊個抵。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("A price table in `app/index.html` holds input, cached-input and output rates per million tokens for the " + FACTS.models + " catalogued models. The calculator multiplies the token counts by those rates and shows the total beside the plan cost for the same window."),
          p("The title bar carries a lifetime chip: API-equivalent total, plan cost for the window, and the difference labelled `saved` when the equivalent exceeds the plan or `over by` when it does not. The window length is selectable and persisted, with a custom value accepted in days."),
          p("The rates are editable in the panel. They are a starting point, not an authority.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Default lifetime window", "90 days"],
            ["Stored under", "`lifetime` in the site-local preference store"],
            ["Price basis", "US dollars per million tokens"],
            ["Rate source", "the `PRICES` literal in `app/index.html`, editable in the panel"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**A model with no entry.** The rate falls back to zero for input, cached and output, so the total reads as zero rather than as an invented number.",
            "**A plan cost of zero.** The delta reads `no plan` instead of claiming an infinite saving.",
            "**Stale rates.** Published prices change. The panel does not fetch them, so a rate is correct only until it is not — which is why they are editable and why the label says API-*equivalent*."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("No billing API is called and no account is queried. Everything here is arithmetic over numbers the user can see and change, computed in the renderer."),
          p("The result is an estimate of an alternative, not an invoice. It must never be read as what was actually charged.")
        ]},
        { h: "How to verify it", blocks: [
          p("Set the token counts to a round number, set a rate to 1.0, and the arithmetic is checkable by hand. Every input is on screen; nothing is hidden in a service.")
        ]}
      ],
      { related: ["health", "chats"], prereq: [], next: "wsl" }),

    /* -------------------------------------------------------------- 8. wsl */
    a("wsl", "WSL runtimes, one long-lived shell per tab", "Product",
      "A session can pin itself to a distro. Studio keeps one `sleep infinity` shell alive for it so `cd`, environment variables and background jobs survive between commands.",
      {
        en: [
          "A per-tab Linux runtime, so a command does not start from scratch every time.",
          "A per-tab Linux runtime, so each command does not start from scratch.",
          "A Linux runtime per tab, so your `cd` still means something on the next command.",
          "A Linux runtime per tab, so the `cd` you did last command still means something on this one.",
          "A Linux runtime per tab, so the `cd` you typed last command has not quietly forgotten itself by the next one."],
        yue: [
          "每個 tab 一個 Linux 執行環境，唔使每次由零開始。",
          "每個 tab 一個 Linux 執行環境，唔使每個指令都由零開始。",
          "每個 tab 一個 Linux 環境，你上次 `cd` 咗去邊，下個指令都仲算數。",
          "每個 tab 一個 Linux 環境，上一個指令 `cd` 咗去邊，今個指令都仲算數。",
          "每個 tab 一個 Linux 環境，上個指令 `cd` 咗去邊，下個指令唔會扮失憶。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`codex_wsl_list` runs `wsl.exe -l -q` and returns both the installed distros and every instance Studio is currently tracking. That output is UTF-16LE; decoding it as UTF-8 turns every name into NUL-separated garbage, so `decodeWsl` counts NUL bytes at odd offsets and picks the encoding accordingly."),
          p("`codex_wsl_spawn` starts `wsl.exe -d <distro> --cd <cwd> -- bash -lc \"sleep infinity\"` and records the pid, distro, cwd and start time against the session id. A login shell holding `sleep infinity` keeps the namespace and the mounted drives alive without holding a pty open."),
          p("`codex_wsl_exec` runs one command inside the session's distro with a 120 000 ms timeout and a 16 MiB buffer. When no instance is pinned it falls back to a one-shot invocation against the first installed distro, so a run never silently does nothing. The returned line list always begins with the exact `wsl -d … -- …` command that was executed."),
          p("Spawning for a session that already has an instance stops the old one first. `codex_wsl_stop` kills the shell but keeps the record; `codex_wsl_kill` removes it entirely.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Default cwd", "`~`"],
            ["Default distro", "the first entry from `wsl -l -q`"],
            ["Exec timeout", "120 000 ms"],
            ["Exec buffer", "16 MiB"],
            ["Distro list timeout", "15 000 ms"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**No WSL installed.** `distros()` resolves an empty array rather than throwing, and `spawn` reports `no WSL distribution is installed`. `list()` still answers, so the panel renders an honest empty state.",
            "**An unknown distro name.** ``\\`<name>\\` is not an installed WSL distribution``, listing what is actually there.",
            "**Stopping a session that has none.** `stop` reports status `absent`. It does not throw.",
            "**A command that exceeds the timeout.** The exec result carries the error on the `error` lines with the real message, and the exit code is reported as the child's code or `-1`."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Every pinned shell is a real `sleep infinity` process. Quitting without killing them leaves one per tab running until the machine reboots, so `wsl.shutdown()` runs on both `window-all-closed` and `before-quit`."),
          p("Commands are passed to `bash -lc` as a single string, which is a shell context by design — that is what a runtime tab is for. Distro and cwd are passed as separate argv entries, so those two cannot be used to inject a second command."),
          p("A WSL shell has the user's own access to the Windows filesystem through `/mnt`. The runtime tab is not a sandbox and is not presented as one.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-backend.mjs\n# → \"wsl.list always answers, even with no WSL installed\"\n# → \"wsl.stop on an unknown session reports absent rather than throwing\""),
          code("wsl -l -q     # the same list the Runtime tab shows")
        ]}
      ],
      { related: ["chats", "health"], prereq: ["chats"], next: "health" }),

    /* ----------------------------------------------------------- 9. health */
    a("health", "Health — doctor, account and the binary in use", "Product",
      "`codex doctor --json --all` regrouped by category, plus `codex login status` and the resolved binary path with its source.",
      {
        en: [
          "Health shows what the CLI itself reports about this machine, grouped so it can be read.",
          "Health shows what the CLI reports about this machine, grouped so it can be read.",
          "Health shows what the CLI itself says about this machine, grouped so a human can read it.",
          "Health shows what the CLI itself says about this machine, regrouped so a human can actually read it.",
          "Health shows what the CLI itself says about this machine, regrouped so a human can read it without scrolling past their own patience."],
        yue: [
          "Health 顯示 CLI 自己對呢部機嘅報告，分組排好方便睇。",
          "Health 顯示 CLI 對呢部機嘅報告，分好組方便睇。",
          "Health 顯示 CLI 自己講嘅嘢，分組排好，人睇得明。",
          "Health 顯示 CLI 自己講嘅嘢，重新分組排好，等人真係睇得明。",
          "Health 顯示 CLI 自己講嘅嘢，重新分組排好，唔使你碌到冇晒耐性都仲未搵到重點。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`codex_doctor` runs `codex doctor --json --all` with a 180 000 ms timeout — the default 120 000 ms is not always enough for the full set. The response is a flat map of checks; Studio regroups them by each check's `category` field and sorts the keys, because grouping in the view layer would mean doing it again in every panel that renders them."),
          p("Each check becomes `{ name, ok, status, detail, details, remediation }`. `ok` is strictly `status === \"ok\"`, and the remediation text is passed through exactly as the CLI wrote it."),
          p("`codex_login_status` runs `codex login status` and classifies the first line into `api`, `chatgpt`, `none` or `unknown`. It also reports whether `$CODEX_HOME/auth.json` exists, which distinguishes a file-backed store from a keyring one."),
          p("`codex_version` reports the version string together with `bin`, `binSource` and `bundled`, so the binary actually in use is on screen rather than assumed.")
        ]},
        { h: "Configuration", blocks: [
          p("Nothing. Health is a read of the CLI's own diagnostics. The only tunable is the 180 000 ms timeout, which is a literal in `electron/lib/catalog.js`.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Doctor is slow or hangs.** The call times out at 180 000 ms and the error carries the exit code and stderr.",
            "**Doctor prints a banner before its JSON.** `runJson` salvages the parse from the first `{` or `[`.",
            "**Not logged in.** `authStatus` classifies the method as `none` and shows the CLI's own line, rather than a generic \"error\".",
            "**`codex login status` fails outright.** `ok: false` is reported alongside whatever text came back on either stream."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Studio never reads `auth.json`. It reports only whether the file exists, which is what distinguishes the file store from the keyring store. No token, key or account secret passes through IPC."),
          p("`codex login` is spawned detached with `stdio: \"ignore\"` because it opens a browser and blocks on the callback; the GUI then polls `codex_login_status`. API-key login is refused with a message pointing at `codex login --with-api-key` in a terminal, so a key never traverses the renderer."),
          p("Doctor output can name paths, proxies and provider endpoints. It is rendered locally and never sent anywhere.")
        ]},
        { h: "How to verify it", blocks: [
          code("codex doctor --json --all\ncodex login status"),
          p("The Health tab is those two outputs, regrouped. Any difference is a Studio bug.")
        ]}
      ],
      { related: ["cli", "wsl"], prereq: ["cli"], next: "history" }),

    /* --------------------------------------------------------- 10. history */
    a("history", "Local git-backed history, and why restoring is a new commit", "Feature",
      "An isolated repository at `$CODEX_HOME/studio`, never inside a user's project, never pushed. Restoring writes a new revision instead of rewinding, so an undo can itself be undone.",
      {
        en: [
          "Everything Studio owns is snapshotted into a local git repository. History is append-only.",
          "Everything Studio owns is snapshotted into a local git repository, and history is append-only.",
          "Everything Studio owns gets snapshotted into a local git repo, and the history only ever grows.",
          "Everything Studio owns is snapshotted into a local git repository, and that history only ever grows — an undo is a new commit, never a deletion.",
          "Everything Studio owns is snapshotted into a local git repository, and that history only ever grows. An undo is a new commit, never a deletion — you can undo the undo, and then undo that, forever."],
        yue: [
          "Studio 擁有嘅嘢全部影低入一個本地 git 倉，歷史係只加唔改。",
          "Studio 擁有嘅嘢全部影低入本地 git 倉，歷史只加唔改。",
          "Studio 手上嘅嘢全部影低入本地 git 倉，歷史淨係會長，唔會縮。",
          "Studio 手上嘅嘢全部影低入本地 git 倉，段歷史淨係會長 — undo 係加一個新 commit，唔係刪嘢。",
          "Studio 手上嘅嘢全部影低入本地 git 倉，段歷史淨係會長。undo 係加多個 commit，唔係刪嘢 — 你可以 undo 個 undo，再 undo 返，永遠都得。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("The repository lives at `$CODEX_HOME/studio`, beside the app's own data. It is never a `.git` inside a user's project and it is never pushed. `ensureRepo()` initialises it with `--initial-branch main` and sets `user.name` and `user.email` **on that repository only**, so the user's global git config is untouched."),
          p("Each revision writes two files: `studio-state.json` — the snapshot of every user-managed record, not only documents — and `codex-config.toml`, a copy of the live config so a restore can show what the CLI was configured with at that revision. An unreadable config is not a reason to lose the snapshot: that copy is wrapped in its own try/catch."),
          p("`commit` stages everything, then runs `git diff --cached --quiet`. If nothing changed it returns `{ committed: false, reason: \"nothing changed\" }`, so the panel stays a list of real events rather than a list of saves."),
          p("Messages are stored as `[kind] message` and parsed back into `{ id, at, kind, message }` by `log`. A repository with no commits yet is an empty history, not an error."),
          p("`show` returns the snapshot as it stood at a revision. The caller applies it and commits the result as a **fresh** revision — this never mutates history. `diff` returns `git show --format= --unified=1 <id>` so the panel can say what changed rather than that something did."),
          p("`prune` is explicit user action, never automatic. Nothing here runs on a timer.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Repository", "`$CODEX_HOME/studio`"],
            ["Snapshot file", "`studio-state.json`"],
            ["Config copy", "`codex-config.toml`"],
            ["Log limit", "200 revisions by default"],
            ["Prune retention", "the newest 200, adjustable in Studio settings"],
            ["Pushed", "never"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Git is not installed.** Every helper returns `{ ok: false }` with the spawn error. `log` treats a failure as an empty history so the panel renders rather than breaks.",
            "**`git commit` fails.** `commit` throws with git's own stderr.",
            "**A revision with no snapshot.** `show` throws ``revision <id> has no snapshot: …`` rather than returning an empty object that would silently restore nothing.",
            "**A snapshot that does not parse.** `show` throws naming the revision and the parse error.",
            "**Prune with fewer revisions than the retention.** Returns `{ pruned: 0, kept: total }` and does nothing."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("The repository is local and never pushed. Nothing in it leaves the machine unless the user copies it out."),
          p("It sits beside the app's data rather than inside a user project, so it can never be swept into a `git add -A` in the user's own repository, and a user's `.gitignore` cannot accidentally exclude it."),
          p("`.gitignore` inside the history repository excludes `*.bak`, so config backups are not duplicated into revisions."),
          p("The snapshot mirrors whatever the live store holds. It is never more sensitive than the store it mirrors, and never less protected.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-backend.mjs\n# → \"history records real changes and never rewrites them\"\n# → \"history.log is empty, not an error, before anything is committed\""),
          code("git -C %USERPROFILE%\\.codex\\studio log --oneline")
        ]}
      ],
      { related: ["config", "changelog"], prereq: ["config"], next: "changelog" }),

    /* ------------------------------------------------------- 11. changelog */
    a("changelog", "The in-app changelog viewer", "Feature",
      "Keep a Changelog parsing that never throws, a date filter with typed and picked dates, a search composed with it, and export that states the range it covers.",
      {
        en: [
          "Every released version, filtered by date and searched by text or regex, with export that matches what is on screen.",
          "Every released version, filtered by date and searched by text or regex, exporting exactly what is on screen.",
          "Every released version — filtered by date, searched by text or regex, exported exactly as shown.",
          "Every released version, filtered by date and searched by text or regex, and exported exactly as it appears on screen.",
          "Every released version, filtered by date and searched by text or regex, and exported exactly as shown — the export is the view, not a hopeful approximation of it."],
        yue: [
          "每個已發佈版本，可以用日期篩、用文字或 regex 搵，匯出同畫面一致。",
          "每個已發佈版本，用日期篩、文字或 regex 搵，匯出同畫面一致。",
          "每個已發佈版本 — 用日期篩、文字或 regex 搵，匯出同見到嘅一模一樣。",
          "每個已發佈版本，用日期篩、用文字或 regex 搵，匯出同畫面上見到嘅一模一樣。",
          "每個已發佈版本，用日期篩、文字或 regex 搵，匯出同畫面一模一樣 — 匯出係嗰個 view 本身，唔係大概估返出嚟嗰個。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`app/cx-changelog.js` is pure logic: no DOM, no fetch, no storage. It parses `CHANGELOG.md` in Keep a Changelog format, composes a date filter with a text-or-regex search, and exports exactly what the filter left on screen."),
          p("Parsing never throws. Every problem becomes a diagnostic that names the line: a `##` heading with no version, a date that is not `yyyy-mm-dd`, a version declared twice, entries sitting outside any `###` section, or an unexpected error partway through — in which case the versions read before it are still shown."),
          p("Dates are compared at local midnight, so a release dated 2026-07-30 lands inside a range whose bounds came off the same calendar the user was looking at. Typed input accepts ISO `yyyy-mm-dd` and `d/m/yyyy` or `m/d/yyyy` split forms; invalid or partial input is reported inline without discarding what was typed."),
          p("The changelog is mirrored into the frontend by `tools/sync-changelog.mjs`, because the viewer loads `./CHANGELOG.md` relative to the app origin and the root file is outside it. A frontend test asserts the two copies match, so the mirror cannot silently drift.")
        ]},
        { h: "Configuration", blocks: [
          code("node tools/sync-changelog.mjs          # write the mirror\nnode tools/sync-changelog.mjs --check  # fail if the mirror is stale"),
          p("`--check` runs in CI and in `npm test`. A stale mirror fails the build, which is the only reliable way to keep two copies of a file identical.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**The file is empty.** Reported as \"the changelog file is empty\" — not as a parse error.",
            "**No `## [version]` heading anywhere.** Reported as \"not in Keep a Changelog format\", which is a different problem from an empty file and gets a different message.",
            "**A version with no date.** Listed and shown, but excluded from date filtering, and the diagnostic says exactly that.",
            "**A malformed date.** Shown as written, excluded from date filtering, diagnostic names the line and the offending text.",
            "**A duplicate version.** Both are shown. Deciding which is right is a human job, and the diagnostic names both line numbers.",
            "**A search with no results.** An honest no-match message, composed with the date filter rather than overriding it."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("The viewer reads a bundled file. It makes no network request; the packaged app ships `CHANGELOG.md` as an extra resource and falls back to the `codex_read_text` IPC command when the relative fetch fails."),
          p("Regex search runs through the same bounded engine as everywhere else — see the regex builder article for the exact limits."),
          p("Changelog content is factual. Entries, dates and fixes are never invented to fill a gap; a version with no recorded changes says so.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-frontend.mjs\n# → app/cx-changelog.js  4 passed, including\n#   \"exportView writes exactly what the filter left on screen\""),
          code("node tools/sync-changelog.mjs --check\n# → app/CHANGELOG.md matches the root copy.")
        ]}
      ],
      { related: ["regex", "ci"], prereq: [], next: "regex" }),

    /* ----------------------------------------------------------- 12. regex */
    a("regex", "The regex builder, and the patterns it refuses", "Feature",
      "Anchored beside every search bar. Bounded at " + FACTS.patternCap + " characters of pattern, " + FACTS.sampleCap + " of sample, " + FACTS.matchCap + " matches and " + FACTS.msBudget + " ms — and it refuses a nested unbounded quantifier outright.",
      {
        en: [
          "A full regex builder sits next to the search bar it belongs to, and it refuses patterns that would freeze the window.",
          "A full regex builder sits beside the search bar it belongs to, and refuses patterns that would freeze the window.",
          "A full regex builder sits right beside the search bar it belongs to — and it refuses patterns that would freeze the window.",
          "A full regex builder sits right beside the search bar it belongs to, and it refuses outright the patterns that would freeze the window.",
          "A full regex builder sits right beside the search bar it belongs to, and it flatly refuses the patterns that would freeze the window. Better a blunt \"no\" than a spinning cursor."],
        yue: [
          "完整嘅 regex 產生器就喺佢所屬嘅搜尋框旁邊，會拒絕啲會令視窗卡死嘅 pattern。",
          "完整 regex 產生器就喺所屬搜尋框旁邊，會拒絕會令視窗卡死嘅 pattern。",
          "完整 regex 產生器就喺佢所屬嘅搜尋框隔籬 — 會拒絕啲會令視窗卡死嘅 pattern。",
          "完整 regex 產生器就喺佢所屬嘅搜尋框隔籬，會直接拒絕啲會令視窗卡死嘅 pattern。",
          "完整 regex 產生器就喺佢所屬嘅搜尋框隔籬，會硬淨咁拒絕啲會令視窗卡死嘅 pattern。寧願直接話你唔得，好過個滑鼠轉到你懷疑人生。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("The builder opens anchored to the field that opened it — the session list, the Extend filter, the Config filter, the slash-command catalog, the command palette and dropdown option filters each get their own, bound to that field's query, pattern, flags and mode. Plain text is the default everywhere; regex is an explicit opt-in."),
          p("It offers guided construction across four groups — Characters, Anchors, Quantifiers and Groups — a raw pattern editor, the eight JavaScript flags (`g i m s u v y d`), a sample box, live matches with capture groups, and copy."),
          p("The engine is the browser's own `RegExp`. That is stated plainly rather than implied, because escaping rules and lookbehind support differ between engines and a builder that lies about its dialect is worse than none."),
          kv([
            ["Pattern length", "≤ " + FACTS.patternCap + " characters"],
            ["Sample length", "≤ " + FACTS.sampleCap + " characters"],
            ["Matches returned", "≤ " + FACTS.matchCap + ", then `truncated: true`"],
            ["Wall-clock budget", FACTS.msBudget + " ms, checked every 200 matches"],
            ["Zero-width matches", "`lastIndex` is advanced by one instead of looping forever"],
            ["Engine", "the host JavaScript `RegExp`"]
          ]),
          p("The most important behaviour is a refusal. A single `RegExp.exec` call cannot be interrupted from JavaScript, so the " + FACTS.msBudget + " ms budget only helps *between* matches. A pattern that repeats a group which already repeats — `(a+)+`, and just as badly `(a+){1,20}` — spends that time inside one call and freezes the window outright. `nestedQuantifier()` walks the pattern, skipping escapes, character classes and lookarounds, and returns the offending fragment. The builder reports that fragment verbatim and does not run the pattern."),
          p("The same predicate powers tab bulk-close, where `close tabs containing X` and `close tabs NOT containing X` negate the identical predicate — built separately, casing or a flag could drift and the two would stop being inverses of each other.")
        ]},
        { h: "Configuration", blocks: [
          p("`LIMITS` is a literal in `app/codex-core.js`. `CONSTRUCTS` and `FLAGS` beside it drive the guided panel, so adding a construct is a data edit.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**An empty pattern.** \"Empty pattern — nothing is matched.\" No silent match-everything.",
            "**A syntax error.** The engine's own message, verbatim. Studio does not paraphrase it.",
            "**Over the pattern or sample cap.** A message naming the exact limit that was exceeded.",
            "**A nested unbounded quantifier.** Refused before running, quoting the fragment, and explaining that bounding the outer repeat does not help.",
            "**The time budget expires.** Evaluation stops and reports possible catastrophic backtracking rather than pretending the result set is complete.",
            "**More than " + FACTS.matchCap + " matches.** `truncated` is set and the UI says the list is cut short."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Evaluation is entirely local. Patterns and sample text are never transmitted or persisted beyond the field they belong to."),
          p("The bounds exist to protect the host from regular-expression denial of service. A pattern pasted from anywhere cannot hang the UI thread, because the shape that would is rejected before it runs and the shapes that merely take a long time are cut off by the budget and the match cap."),
          p("`g` and `y` are stripped from bulk-close predicates, because a stateful `lastIndex` makes the same predicate answer differently on its second call — which would break the guarantee that the two bulk-close directions are exact inverses.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-frontend.mjs\n# → app/codex-core.js  8 passed"),
          p("In this site's own search bar: enable Regex, type `(a+)+b`, and read the refusal. The same shape is refused in the app, by the same rule.")
        ]}
      ],
      { related: ["tabs", "changelog"], prereq: [], next: "tabs" }),

    /* ------------------------------------------------------------ 13. tabs */
    a("tabs", "Tabs: pinning, groups, overflow, four searches and bulk close", "Feature",
      "`app/cx-tabs.js` owns the model — order, pinning, groups, the four searches and the one bulk-close predicate. Presentation lives in the template.",
      {
        en: [
          "Content is navigated, not scrolled. The tab model is a module, so the same rules apply however a strip is drawn.",
          "Content is navigated, not scrolled. The tab model is its own module, so the same rules apply however a strip is drawn.",
          "Content is navigated, not scrolled. The model is a module of its own, so the rules hold however a strip is drawn.",
          "Content is navigated rather than scrolled, and the model lives in its own module — so the same rules hold however a strip is drawn.",
          "Content is navigated, not scrolled. The model lives in its own module, so the rules hold no matter how a strip is drawn — one place to be right, one place to be wrong."],
        yue: [
          "內容係用 tab 行，唔係一路碌。tab 模型獨立成個 module，所以無論條 strip 點畫，規則都一樣。",
          "內容係用 tab 行，唔係一路碌。tab 模型獨立一個 module，無論條 strip 點畫規則都一樣。",
          "內容用 tab 行，唔係一路碌。模型自己一個 module，條 strip 點畫規則都一樣。",
          "內容用 tab 行，唔係一路碌落去，而模型自己獨立一個 module — 條 strip 點畫，規則都一樣。",
          "內容用 tab 行，唔係一路碌。模型自己一個 module，條 strip 點畫規則都一樣 — 一個地方啱，一個地方錯，唔使周圍搵。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("Pinned tabs occupy a stable region ahead of the ordinary ones and keep their own relative order within it. `overflow(capacity)` decides which tabs do not fit — the caller measures — and pinned tabs stay visible when the others overflow."),
          p("Groups can be created, renamed, coloured, reordered, collapsed and removed. Removing a group never closes its tabs: they return to the loose region."),
          p("**Four searches**, each with its own anchored builder and no shared state: `searchStrip` over the current strip, `searchGroup` inside one group, `searchGroups` over group names and icons, and `searchAll` across every workspace, strip and group — reporting workspace, strip, group, pinned state and visible label for each hit."),
          p("**Bulk close** matches the tab's visible label and nothing else. It never inspects page contents or hidden state, so a user closing \"everything with `payments` in the name\" can predict the result from the strip. `previewBulkClose` closes nothing: it returns `matched`, `protectedPinned`, `dirty` and `total` for the user to review, and only `bulkClose(preview)` acts."),
          p("`closeOthers` and `closeToRight` route through the same `bulkClose`, so pinned protection cannot differ between the text-based and positional closes.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Pattern cap", FACTS.patternCap + " characters"],
            ["Match cap", "5000"],
            ["Time budget", "250 ms"],
            ["Pinned by default in bulk close", "excluded"],
            ["Persistence", "tabs, groups and the active id, through the caller's store"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**An empty query.** \"Enter text to match — an empty query closes nothing.\" Bulk close never runs on an empty query.",
            "**An invalid pattern.** The predicate reports `ok: false` with the engine's message and matches nothing, so an invalid regex closes zero tabs rather than all of them.",
            "**A pattern over the cap.** Refused by length, naming the limit.",
            "**Pinned tabs in range.** Listed under `protectedPinned` and skipped unless `includePinned` is set, and the preview names them before anything closes.",
            "**A broken subscriber.** `emit()` wraps each subscriber in try/catch, so one throwing listener does not stop the rest repainting."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Bulk close reads labels only. It cannot be used to search hidden state, and nothing about a tab's contents influences whether it closes."),
          p("`g` and `y` are stripped from the predicate flags so the same predicate answers identically on every call. Without that, the \"containing\" and \"not containing\" actions would stop being exact inverses.")
        ]},
        { h: "How to verify it", blocks: [
          p("This site implements the same model in miniature. Right-click a tab here to pin it, reload, and the pin survives. Shrink the window until tabs no longer fit and the overflow menu appears — pinned tabs stay."),
          code("node tools/test-frontend.mjs   # the app's own module tests")
        ]}
      ],
      { related: ["regex", "notifications", "appearance"], prereq: ["regex"], next: "notifications" }),

    /* --------------------------------------------------- 14. notifications */
    a("notifications", "Non-blocking notifications and the reviewable centre", "Feature",
      "Anything that only informs is a corner toast. A modal is reserved for a decision that genuinely blocks the next step.",
      {
        en: [
          "Informational messages never stop the app. Errors and warnings stay until dismissed, and everything stays reviewable.",
          "Informational messages never stop the app. Errors and warnings stay until dismissed, and everything remains reviewable.",
          "Informational messages never stop the app. Errors and warnings stay put until dismissed, and nothing is lost.",
          "Informational messages never halt the app. Errors and warnings stay put until dismissed, and nothing you dismissed is actually lost.",
          "Informational messages never halt the app. Errors and warnings stay put until dismissed — a failure that vanishes after four seconds is a failure nobody read."],
        yue: [
          "資訊類訊息唔會截停個 app。錯誤同警告會留到你自己閂，而且全部都翻查得返。",
          "資訊類訊息唔會截停個 app。錯誤同警告留到你自己閂，全部翻查得返。",
          "資訊訊息唔會截停個 app。錯誤同警告會賴死唔走，直到你自己閂，冇嘢會唔見。",
          "資訊訊息唔會截停個 app。錯誤同警告會留住唔走，直到你自己閂，你閂咗嘅一樣搵得返。",
          "資訊訊息唔會截停個 app。錯誤同警告賴死唔走 — 四秒就自己消失嘅錯誤，等於冇人睇過。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`app/cx-notify.js` raises five kinds: `info`, `success`, `progress`, `warning` and `error`. Info fades after 5000 ms, success after 4000 ms, and progress, warning and error have a timeout of 0 — they stay until dismissed, because a failure that vanishes after four seconds is a failure the user never read."),
          p("At most 4 toasts are visible at once; the full log keeps 200 entries and persists, so a dismissed toast is not a lost one. Live toasts are deliberately **not** restored on launch — a notification from a previous session is history, not news."),
          p("A `category` deduplicates: a newer item with the same category replaces the one it supersedes rather than stacking a second copy, which is what keeps a progress line that ticks three times from becoming three toasts. `update(id, patch)` edits an in-flight notification in place."),
          p("`fromError(what, err, actions)` turns a rejected backend call into an actionable error whose body is the CLI's own message. The funny level styles the title; the detail is never styled, because the detail is the fact."),
          p("The one place a blocking dialog is correct is a decision that must be made first — the bulk-close preview, an unsaved-changes prompt, a destructive gate. That is a deliberate short list, not an oversight.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Visible at once", "4"],
            ["History kept", "200"],
            ["`info` timeout", "5000 ms"],
            ["`success` timeout", "4000 ms"],
            ["`progress` / `warning` / `error`", "0 — until dismissed"],
            ["Storage key", "`notify.history`, plus `notify.readAt`"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**No store available.** `persist()` returns early; toasts still work, the history simply does not survive a restart.",
            "**A subscriber throws.** `emit()` catches per subscriber so one broken listener does not stop the others repainting.",
            "**`update` on a dismissed id.** Returns `false` rather than resurrecting it.",
            "**`clearHistory` while an error is on screen.** The live stack is untouched. Clearing the log must not make an error the user is still reading disappear."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Error bodies carry whatever the backend said, which can include paths. They are rendered locally and stored locally; nothing is transmitted."),
          p("The history is capped at 200 entries so an error loop cannot grow the persisted store without bound.")
        ]},
        { h: "How to verify it", blocks: [
          p("In this site, copy any code block or save a preference — a corner toast appears and auto-dismisses, and nothing blocks. In the app, screenshot 13 shows the stack and the centre together."),
          code("npm run capture -- --only notifications")
        ]}
      ],
      { related: ["tabs", "language"], prereq: [], next: "appearance" }),

    /* ------------------------------------------------------ 15. appearance */
    a("appearance", "Per-element appearance customization", "Feature",
      "37 named appearance targets, an anchored non-modal editor, and a colour translator across HEX, RGB, HSL, HSV, HWB, LAB, LCH, OKLab, OKLCH and CMYK with a WCAG contrast ratio.",
      {
        en: [
          "Any element carrying a `data-appear` name can be restyled from its own context menu, in an editor anchored beside it.",
          "Any element carrying a `data-appear` name can be restyled from its own context menu, in an editor anchored beside it.",
          "Any element with a `data-appear` name can be restyled from its own right-click menu, in an editor that sits beside it.",
          "Any element with a `data-appear` name can be restyled from its own right-click menu, in an editor that opens right beside it rather than in some distant dialog.",
          "Any element with a `data-appear` name can be restyled from its own right-click menu, in an editor that opens right beside it — not in a dialog three rooms away that forgot which button sent it."],
        yue: [
          "任何帶住 `data-appear` 名嘅元素都可以喺自己嘅右鍵選單改樣，編輯器就開喺佢隔籬。",
          "任何帶 `data-appear` 名嘅元素都可以喺自己右鍵選單改樣，編輯器開喺佢隔籬。",
          "任何有 `data-appear` 名嘅元素都可以喺自己右鍵選單改樣，編輯器就喺佢隔籬開。",
          "任何有 `data-appear` 名嘅元素都可以喺自己右鍵選單改樣，編輯器就喺佢隔籬彈出嚟，唔使去到十萬八千里外個對話框。",
          "任何有 `data-appear` 名嘅元素都可以喺自己右鍵選單改樣，編輯器就喺佢隔籬彈出 — 唔係去到隔離房個對話框，仲要唔記得係邊粒掣叫佢出嚟。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("An element opts in by carrying `data-appear=\"<name>\"` and ending its context menu with `this.appearItem(e)`. The menu entry reads `Edit appearance — <name>`, and the editor opens non-modally at the click position with the element's current overrides loaded."),
          p("The app currently names 37 targets, including Title bar, Tab strip, Tab, Tab group header, Navigation rail, Message bubble, Composer, Command palette, Command preview, Flag panel, Settings panel, TOML preview, Cost headline, Runtime card, Health card, Commit row, Release entry, Notification, Notification centre, Regex builder, Bulk close dialog, Dropdown, Sidebar search, Studio search and Yolo card."),
          p("Colour work goes through `CX.color`, which converts between HEX/HEX8, RGB, HSL, HSV, HWB, LAB, LCH, OKLab, OKLCH and CMYK, and computes a WCAG contrast ratio from relative luminance. Every representation is copyable, so a colour chosen here can be pasted into a stylesheet or a design tool without a round trip through a converter."),
          p("Overrides persist under the `appearance` key and can be exported to the clipboard so a customised appearance survives a reinstall.")
        ]},
        { h: "Configuration", blocks: [
          p("Theme is a document attribute: `data-theme=\"light\"` on `<html>` switches the whole token set. The dark palette is the `:root` block in `app/index.html`; the light palette is the `[data-theme=\"light\"]` block directly beneath it. This site reuses those exact values."),
          p("Fonts offered by the editor come from `codex_fonts`, which reads `%WINDIR%\\Fonts` and `%LOCALAPPDATA%\\Microsoft\\Windows\\Fonts` for `.ttf`, `.otf` and `.ttc` files. Reading two directories is far cheaper than enumerating the registry and covers both machine-wide and per-user installs.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Neither font directory is readable.** The scan skips it and returns whatever the other yielded; an empty list is a list, not an error.",
            "**A colour string that does not parse.** `hexToRgb` returns `null` and `translate` returns an empty list rather than rendering `NaN` in ten formats.",
            "**A property the platform cannot render.** It stays visible with an explanation instead of disappearing or silently dropping the saved value.",
            "**An element with no `data-appear`.** Its context menu shows `Edit appearance…` without a target and the editor does not open — the app does not guess which element was meant."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Appearance overrides are style values in local storage. They are applied as CSS custom properties, not injected as markup."),
          p("Font enumeration reads file *names* from two directories. No font file is read, parsed or uploaded.")
        ]},
        { h: "How to verify it", blocks: [
          code("npm run capture -- --only appearance   # screenshot 12, the editor with the colour translator"),
          p("On this site, the Settings tab carries the same colour translator over its accent colour, with the same contrast readout.")
        ]}
      ],
      { related: ["tabs", "language"], prereq: [], next: "language" }),

    /* -------------------------------------------------------- 16. language */
    a("language", "Three language modes and two funny sliders", "Experience",
      "English, playful Hong Kong Cantonese, or both. Two independent 1–5 sliders, one per language. The level changes voice and never facts.",
      {
        en: [
          "The funny level styles every category of message, including errors. What it never changes is what the message says happened.",
          "The funny level styles every category of message, including errors. What it never changes is what the message says happened.",
          "The funny level styles every kind of message, errors included. What it never changes is what actually happened.",
          "The funny level styles every kind of message, errors and warnings included. What it never changes is the account of what actually happened.",
          "The funny level styles every kind of message, errors and warnings included — and changes precisely nothing about what actually happened. A joke is allowed; a lie is not."],
        yue: [
          "好笑程度會影響每一類訊息，包括錯誤。佢唯一唔會改嘅，就係件事實際上發生咗乜。",
          "好笑程度會影響每一類訊息，包括錯誤。佢唯一唔會改嘅係件事實際發生咗乜。",
          "好笑程度影響每一類訊息，錯誤都唔例外。唯一唔會變嘅，係件事實際發生咗乜。",
          "好笑程度影響每一類訊息，錯誤同警告都唔例外。唯一唔會變嘅，係件事實際發生咗乜。",
          "好笑程度影響每一類訊息，錯誤同警告都唔例外 — 但件事實際發生咗乜，一個字都唔會變。講笑得，講大話唔得。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`app/cx-i18n.js` holds every user-visible string in five voices per language. The slider picks the index; the placeholders are substituted afterwards. That ordering is the whole guarantee: level 1 and level 5 of the same key name the same file, the same count and the same irreversibility, because the fact is interpolated after the voice is chosen."),
          p("Three modes: `en`, `yue`, and `bi`. Bilingual joins the two with a middle-dot separator, and collapses to one when both languages resolved to the same string — repeating `Codex Studio · Codex Studio` helps nobody."),
          p("A missing key returns the key itself rather than an empty string, so a gap is visible instead of silent. An unknown placeholder is left visible in the output for the same reason: a fact that cannot be filled is not a fact that may be hidden."),
          p("The app enumerates 12 message categories in its disclosure — labels, hints, progress, success, warnings, errors, destructive confirmations, security, history labels, changelog entries, narration and the dim sum surprise — so the user is told what the setting affects before opting in. No category is exempt."),
          p("An optional speech narrator is off by default. It speaks `en-US` or `zh-HK` through a serialized queue with a 6000 ms cooldown, and a superseded queued line is replaced rather than stacked, so utterances never overlap.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Modes", "`en`, `yue`, `bi`"],
            ["Levels", "1–5, independently per language"],
            ["Default level", "3 — a fresh install is neither stiff nor unhinged"],
            ["Narrator", "off by default; `en`, `yue` or both"],
            ["Narrator cooldown", "6000 ms"],
            ["Bilingual separator", "two spaces, a middle dot, two spaces"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**A missing key.** The key string is returned. Visible, greppable, fixable.",
            "**A level outside 1–5.** Clamped to the range and rounded, so a corrupted preference cannot index off the end of the array.",
            "**An unknown placeholder.** Left in the output as `{name}` rather than dropped.",
            "**No `speechSynthesis`.** The narrator silently does nothing rather than throwing; it is an enhancement, not a dependency."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Security and credential copy is styled by the slider like everything else, and like everything else it keeps its facts. A playful message about a login still names the account, the store and what is about to happen."),
          p("Narration is off unless the user turns it on. Spoken error narration still names the actual failure and is never suppressed by the rate limits — the cooldown governs frequency, not whether a failure is announced.")
        ]},
        { h: "How to verify it", blocks: [
          p("On this site's Settings tab, drag either slider and watch the same sentence change voice while the version number and CLI version stay byte-identical. That demonstration is rendered from the same table as the rest of the copy."),
          code("node tools/test-frontend.mjs\n# → app/cx-i18n.js  6 passed")
        ]}
      ],
      { related: ["dimsum", "notifications"], prereq: [], next: "dimsum" }),

    /* ---------------------------------------------------------- 17. dimsum */
    a("dimsum", "The dim sum surprise", "Experience",
      "A " + FACTS.dimsumRate + " chance per launch of one dish from a bundled catalog of " + FACTS.dishes + ", named in both languages, non-blocking, and never on a first run.",
      {
        en: [
          "A small delight, not a feature to manage. One fresh draw per launch, at most " + FACTS.dimsumRate + ", from bundled artwork.",
          "A small delight rather than a feature to manage: one fresh draw per launch, at most " + FACTS.dimsumRate + ", from bundled artwork.",
          "A small delight, not a feature you have to manage. One draw per launch, at most " + FACTS.dimsumRate + ", from bundled artwork.",
          "A small delight rather than something you have to manage. One fresh draw per launch, at most " + FACTS.dimsumRate + ", from artwork that ships with the app.",
          "A small delight rather than a chore. One fresh draw per launch, at most " + FACTS.dimsumRate + ", from artwork that ships inside the app — nobody is being tracked for a dumpling."],
        yue: [
          "係一份小驚喜，唔係要你管理嘅功能。每次開機抽一次，最多 " + FACTS.dimsumRate + "，用嘅係內置圖片。",
          "係小驚喜，唔係要你管理嘅功能：每次開機抽一次，最多 " + FACTS.dimsumRate + "，用內置圖片。",
          "係小驚喜，唔使你管。每次開機抽一次，最多 " + FACTS.dimsumRate + "，用內置圖片。",
          "係小驚喜，唔使你打理。每次開機抽一次，最多 " + FACTS.dimsumRate + "，張相係 app 自己帶住嘅。",
          "係小驚喜，唔係苦差。每次開機抽一次，最多 " + FACTS.dimsumRate + "，張相 app 自己帶住 — 冇人為咗一籠蝦餃去追蹤你。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`CX.dimsum.draw()` runs once per launch and sets `drawn` immediately, so it can never fire twice in one session. It returns `null` when the setting is off, and `null` on the very first run — `hasLaunchedBefore` is set and nothing is shown, because a delight that greets someone during setup is not a delight."),
          p("The rate is a parameter, not a constant baked into the module: the app passes `0.01` at launch and `1` for the settings preview. `CX_DIMSUM.draw(rate, rng)` takes a fresh random number every call and never becomes more frequent than the rate it was given."),
          p("The card is non-blocking, corner-anchored, `role=\"status\"` with `aria-live=\"polite\"`, and auto-dismisses after 9000 ms with a close button available throughout. It never gates startup and never steals focus."),
          p("Each dish is named in both languages — for example `Classic Har Gow · 蝦餃` — with Jyutping in the catalog and alt text in both languages, so a screen-reader user gets the same delight. The dish's actual name stays correct at every funny level; only the copy around it is styled."),
          kv([
            ["Bundled dishes", FACTS.dishes],
            ["Shared catalog total", FACTS.dishCatalog + " (this is a curated slice)"],
            ["Catalog status", "`in-progress`"],
            ["Draw rate at launch", FACTS.dimsumRate],
            ["Auto-dismiss", "9000 ms"],
            ["Generated by", "`tools/sync-dimsum.ps1` — `app/cx-dimsum.js` is not hand-edited"]
          ])
        ]},
        { h: "Configuration", blocks: [
          p("Studio ▸ the dim sum toggle switches it off, persisted like every other preference and honoured absolutely. A Preview button shows the surface on demand without waiting for the draw."),
          p("The same catalog names builds. `tools/release-codename.mjs` assigns one dish per build as a code name beside the version — never instead of it — and only dishes with a real bundled image are eligible, because naming a build after a record whose photo does not exist yet produces a release whose code name renders as a broken image.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**An empty catalog.** `draw` returns `null`. No card, no error.",
            "**A missing image file.** The card renders with its alt text. In CI, the release step validates that the PNG actually decodes before attaching it, and publishes without the photo rather than shipping a broken image.",
            "**The setting is off.** `draw` returns `null` before touching the catalog.",
            "**A first run.** Suppressed, and the flag is set so the next launch is eligible."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Images are bundled local assets. There is no network fetch, no third-party CDN and no tracking — the draw is a local `Math.random()` call and nothing is reported anywhere."),
          p("Reduced-motion and quiet settings are respected, and the card is dismissible from the keyboard.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-frontend.mjs\n# → app/cx-dimsum.js  4 passed"),
          p("This site draws at the same " + FACTS.dimsumRate + " rate, from the same bundled photographs at `app/dimsum/`, and suppresses the draw on a first visit for the same reason. The Settings tab has the same off switch.")
        ]}
      ],
      { related: ["language", "ci"], prereq: ["language"], next: "editors" }),

    /* --------------------------------------------------------- 18. editors */
    a("editors", "External editor integration", "Feature",
      "Nine candidates detected by executable, never guessed. Nothing installed produces a clear message and a reveal-in-Explorer fallback.",
      {
        en: [
          "Detection is by executable, not by assumption. An editor that is not on this machine is never offered.",
          "Detection is by executable, not by assumption — an editor that is not on this machine is never offered.",
          "Detection is by executable, not by hopeful guessing. An editor that is not on this machine is never offered.",
          "Detection is by executable rather than hopeful guessing, so an editor that is not actually on this machine is never offered.",
          "Detection is by executable rather than hopeful guessing. An editor that is not actually on this machine is never offered — no menu entry that opens nothing."],
        yue: [
          "偵測係睇實際執行檔，唔係靠估。呢部機無裝嘅編輯器唔會出現喺選單。",
          "偵測係睇實際執行檔，唔係靠估 — 呢部機無裝嘅編輯器唔會出現。",
          "偵測係睇真執行檔，唔係靠估。呢部機無裝嘅編輯器唔會出現。",
          "偵測係睇真執行檔，唔係靠估，所以呢部機真係無裝嘅編輯器唔會出現喺選單度。",
          "偵測係睇真執行檔，唔係靠估。呢部機無裝嘅編輯器唔會出現 — 唔會有粒掣撳落去乜都唔開。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`electron/lib/editors.js` carries nine candidates: Visual Studio Code, VS Code Insiders, Cursor, Windsurf, Zed, Sublime Text, Notepad++, IntelliJ IDEA and Notepad. Each is resolved through `where <exe>` first, then through a short list of known install paths with `%LOCALAPPDATA%` and `%PROGRAMFILES%` expanded."),
          p("`codex_open_external` opens a file or folder. With no editor id it uses the first detected one; with a `customExe` it spawns that path directly. The child is detached and unref'd so closing Studio does not close the editor."),
          p("`.cmd` and `.bat` shims need a shell and are quoted; a bare `.exe` is spawned without one, because passing `shell: true` for an absolute path containing spaces would need quoting that is not worth hand-rolling."),
          p("`codex_reveal` spawns `explorer.exe <path>` as the fallback when no editor is installed.")
        ]},
        { h: "Configuration", blocks: [
          p("The chosen editor persists in Studio settings. A custom executable path can be supplied and is used verbatim.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Nothing installed.** `open` throws `no supported editor was found on this machine` — a clear message, not a silent no-op — and Reveal in Explorer remains available.",
            "**A path that does not exist.** `<path> does not exist`, before anything is spawned.",
            "**An unknown editor id.** ``unknown editor `<id>` ``.",
            "**A configured editor that has since been uninstalled.** `<Label> is configured but was not found on this machine`, which is a different sentence from \"nothing is installed\" on purpose."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("Only a path the user selected is passed, and it is `path.resolve`d first. Detection runs `where` with an argv array; no user input reaches a shell string."),
          p("A custom executable is the user's own choice and is launched as given. Studio does not scan for or auto-run anything that was not either detected from the fixed candidate list or explicitly configured.")
        ]},
        { h: "How to verify it", blocks: [
          code("node tools/test-backend.mjs\n# → \"editors.detect returns a well-formed list\"\n# → \"editors.open refuses a path that does not exist\"")
        ]}
      ],
      { related: ["config", "history"], prereq: [], next: "capture" }),

    /* --------------------------------------------------------- 19. capture */
    a("capture", "The screenshot harness", "Build",
      FACTS.shots + " PNGs captured headlessly from the real app — the same main process, preload and frontend the installer ships — through Electron's own `capturePage`.",
      {
        en: [
          "Screenshots are captured from the built artifact, not drawn. A picture of something that does not work is worse than no picture.",
          "Screenshots are captured from the built artifact, not drawn. A picture of something that does not work is worse than no picture.",
          "Screenshots come from the built artifact, not from a drawing tool. A picture of something that does not work is worse than none.",
          "Screenshots come out of the built artifact rather than a drawing tool. A pretty picture of a panel that does not work is worse than no picture at all.",
          "Screenshots come out of the built artifact rather than a drawing tool. A pretty picture of a panel that throws on load is worse than no picture at all — and considerably more embarrassing."],
        yue: [
          "截圖係由真正 build 出嚟嘅 app 影，唔係畫。影一張唔 work 嘅嘢，仲衰過冇圖。",
          "截圖係由真正 build 出嚟嘅 app 影，唔係畫嘅。影一張唔 work 嘅嘢仲衰過冇圖。",
          "截圖由真正 build 出嚟嘅 app 影，唔係用畫圖工具。影一張唔 work 嘅嘢仲衰過冇圖。",
          "截圖由真正 build 出嚟嘅 app 影，唔係畫出嚟。影一張靚但係唔 work 嘅畫面，仲衰過乜圖都冇。",
          "截圖由真正 build 出嚟嘅 app 影，唔係畫出嚟。影一張靚但一 load 就炸嘅畫面，仲衰過乜圖都冇，仲要更加瘀。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`tools/capture.mjs` spawns `tools/capture-main.cjs` under the project's own Electron with `CODEX_STUDIO_HEADLESS=1`. That harness requires the **real** `electron/commands.js`, so a capture exercises the real backend rather than a stub."),
          p("The window is created 1600×1000 at x = −32000, y = −32000 with `show: false`, `skipTaskbar`, `focusable: false` and `paintWhenInitiallyHidden: true`, then `showInactive()`. A window that is never painted makes `capturePage` return whatever frame happened to exist, which shows up as every screenshot lagging one state behind. Showing it far off-screen keeps the compositor running without putting a pixel on a monitor anyone can see."),
          p("Each shot names the surface, the state it needs and what a reader should look at. Some carry a `before` or `after` script — the notifications shot raises real notifications, the dim sum shot forces a draw at rate 1 — so the captured state is produced by the app's own code paths."),
          p("Console errors at level 2 and above are collected and written into `manifest.json` beside the images, so a capture that produced a warning says so."),
          code("npm run capture                    # every shot\nnpm run capture -- --only chats    # just one\nnpm run capture -- --list          # what it can capture")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Output", "`assets/screenshots/`"],
            ["Manifest", "`assets/screenshots/manifest.json`"],
            ["Shots", FACTS.shots],
            ["Window", "1600×1000, off-screen"],
            ["Settle delay", "3500 ms after load"],
            ["Env", "`CODEX_STUDIO_CAPTURE_DIR`, `CODEX_STUDIO_CAPTURE_ONLY`, `CODEX_STUDIO_HEADLESS`"]
          ])
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**A panel throws.** The capture shows the failure rather than quietly producing a pretty picture of something that does not work.",
            "**A renderer crash.** `render-process-gone` is recorded into the manifest's `consoleErrors`.",
            "**A shot id that does not exist.** `--only` filters to an empty list and nothing is written."
          ]),
          p("The current manifest records five console messages from the capture run, including template-binding warnings on number inputs and Electron's development-mode CSP warning — which is stated here rather than hidden, because the manifest is evidence and evidence includes the untidy parts.")
        ]},
        { h: "Security considerations", blocks: [
          p("The harness runs the real backend against the real `CODEX_HOME`. Captures can therefore contain real session names and real paths, and are reviewed before being committed."),
          p("Nothing is drawn on a visible desktop and no Win32 `PrintWindow` is used, so the capture cannot pick up an unrelated window that happened to be in front.")
        ]},
        { h: "How to verify it", blocks: [
          code("npm run capture -- --list\n# → chats console extend config cost runtime health history changelog studio\n#   regex appearance notifications tabsearch bulkclose dimsum light"),
          p("The Screenshots tab of this site embeds those exact files with the captions from the same manifest.")
        ]}
      ],
      { related: ["ci", "shell"], prereq: ["shell"], next: "ci" }),

    /* -------------------------------------------------------------- 20. ci */
    a("ci", "Continuous integration and releases", "Build",
      "One workflow, one runner. Tests gate the release job through `needs:`, so a failed test cannot publish. Every successful run publishes one uniquely tagged release carrying both installers.",
      {
        en: [
          "Tests live in their own job so that \"a failed test publishes no release\" is enforced by `needs:` rather than by everyone remembering the rule.",
          "Tests live in their own job so that \"a failed test publishes no release\" is enforced by `needs:` rather than by everyone remembering.",
          "Tests live in their own job, so \"a failed test publishes no release\" is enforced by `needs:` rather than by everyone remembering the rule.",
          "Tests live in their own job, so \"a failed test publishes no release\" is enforced by `needs:` — not by everyone remembering the rule at the right moment.",
          "Tests live in their own job, so \"a failed test publishes no release\" is enforced by `needs:` rather than by everyone remembering the rule at exactly the wrong moment."],
        yue: [
          "測試自己一個 job，所以「測試唔過就唔會出 release」係由 `needs:` 迫出嚟，唔係靠大家記得。",
          "測試自己一個 job，「測試唔過就唔出 release」係 `needs:` 迫出嚟，唔係靠大家記得。",
          "測試自己一個 job，「測試唔過唔出 release」係 `needs:` 逼住做，唔係靠大家記得。",
          "測試自己一個 job，「測試唔過唔出 release」係 `needs:` 逼住做，唔係靠大家喺啱嘅時候記得。",
          "測試自己一個 job，「測試唔過唔出 release」係 `needs:` 逼住做 — 唔係靠大家喺最唔應該唔記得嘅時候記得。"]
      },
      [
        { h: "Behaviour", blocks: [
          p("`.github/workflows/ci.yml` triggers on every `push` and on `workflow_dispatch`. Both jobs run on `windows-latest`, because Codex Studio is a Windows-only Electron app — there is exactly one runner and one platform here."),
          p("**Test job.** Node 22, `npm install --ignore-scripts` (the tests need only the plain modules, so the Electron download is paid for once, in the release job), then `node tools/test-frontend.mjs`, `node tools/test-backend.mjs`, `node tools/sync-changelog.mjs --check`, and a PowerShell step that runs `node --check` over every `.js`, `.mjs` and `.cjs` under `app/`, `electron/` and `tools/` — because a syntax error in a module the unit tests never load never reaches them."),
          p("**Release job.** `needs: test`. It resolves the version from `package.json` and builds a tag as `v<version>+build.<run_number>`, with `.<run_attempt>` appended on a re-run so a re-run cannot collide. If the tag already exists the job fails with \"Tags are immutable here; nothing was overwritten and no release was published.\""),
          p("It then derives a dim sum code name from the monotonic run number, validates the PNG actually decodes with `System.Drawing` before attaching it, mirrors the changelog, stages the bundled CLI, builds NSIS and MSI with `electron-builder`, and **verifies both installers exist in `dist/`** — a release with no installer is a failed build, not a shipped one."),
          p("Release notes are generated from the commit range since the previous `v*` tag, state the runner and the exact commit, list the four checks that were green, and say plainly that the installers are not code-signed and were never installed on a clean machine by this workflow. The last paragraph repeats that in Cantonese."),
          p("The code name is *derived*, never claimed by writing a ledger file back to the branch — a release job that pushes to its own trigger is an infinite loop. The tag reproduces the choice, so it stays auditable.")
        ]},
        { h: "Configuration", blocks: [
          kv([
            ["Triggers", "`push`, `workflow_dispatch`"],
            ["Runner", "`windows-latest`, GitHub-hosted"],
            ["Node", "22"],
            ["Permissions", "`contents: write`"],
            ["Token chain", "`RELEASE_TOKEN` → `ORG_TOKEN` → `GITHUB_TOKEN`"],
            ["Tag format", "`v<version>+build.<run_number>[.<run_attempt>]`"],
            ["Artifacts", "`dist/*.exe` (NSIS), `dist/*.msi`"],
            ["Draft / prerelease", "neither — `make_latest: true`"]
          ]),
          p("`fail_on_unmatched_files: true` on the installer upload: the whole point of the release is the installers, so no file means no release. The dim sum photo is uploaded in a **separate** step, because a missing photo is reported and does not block shipping.")
        ]},
        { h: "Failure modes", blocks: [
          ul([
            "**Any test fails.** The release job never starts. No tag, no release.",
            "**A missing `version` in `package.json`.** The job errors with \"refusing to publish a release we cannot name\".",
            "**A tag that already exists.** The job fails rather than overwriting. Tags and artifacts are immutable here.",
            "**No installer in `dist/`.** The verify step fails the job before anything is published.",
            "**No CLI staged.** A warning, `bundled=false`, and the release notes say the installer does not carry a CLI instead of claiming one.",
            "**No code name resolvable.** A notice, and the release ships with the version alone. A code name is decoration with a purpose, not a gate."
          ])
        ]},
        { h: "Security considerations", blocks: [
          p("The token is resolved as `secrets.RELEASE_TOKEN || secrets.ORG_TOKEN || secrets.GITHUB_TOKEN` and passed only through the `GH_TOKEN` environment convention. It is never echoed, printed or written to a log."),
          p("A GitHub-hosted runner is used rather than a self-hosted one. A self-hosted runner on a public repository is an accepted attack path, and nothing here needs hardware the cloud fleet does not have."),
          p("The release notes state honestly that the installers are **not code-signed**, that SmartScreen will warn on first run, and that the workflow does not install or launch them on a clean machine. Nothing beyond the four listed checks has been verified, and the notes say so.")
        ]},
        { h: "How to verify it", blocks: [
          code("npm test\n# node tools/test-frontend.mjs && node tools/test-backend.mjs && node tools/sync-changelog.mjs --check"),
          p("That is the same command set the test job runs, minus the parse sweep. Locally: " + FACTS.testsFrontend + " frontend tests and " + FACTS.testsBackend + " backend tests, " + FACTS.tests + " in total, all passing at the time this page was written.")
        ]}
      ],
      { related: ["capture", "cli", "changelog"], prereq: ["capture"], next: "shell" })
  ];

  /* ------------------------------------------------------------ screenshots
     Transcribed from assets/screenshots/manifest.json. The manifest stores absolute
     capture-machine paths; only the basename is portable, so that is what is used.
     `note` is the manifest's own caption. `alt` is written for this site, because a
     caption and an alt text have different jobs. */
  var SHOTS = [
    { file: "01-chats.png", id: "chats",
      note: "Chats — session list, transcript, composer",
      alt: "The Chats tab: a left column of Codex sessions, a transcript of an exchange in the centre, and the message composer along the bottom." },
    { file: "02-console.png", id: "console",
      note: "Console — every CLI subcommand and flag",
      alt: "The Console tab: a searchable list of codex subcommands on the left, the selected subcommand's flags as form fields, and the composed command line above the output pane." },
    { file: "03-extend.png", id: "extend",
      note: "Extend — MCP, plugins, skills, hooks, feature flags",
      alt: "The Extend tab: section list on the left, and cards for each configured MCP server showing transport, command and enabled state." },
    { file: "04-config.png", id: "config",
      note: "Config — config.toml settings with live TOML preview",
      alt: "The Config tab: grouped config.toml fields with enum dropdowns on the left and a live preview of the resulting TOML document on the right." },
    { file: "05-cost.png", id: "cost",
      note: "Cost — API-equivalent calculator",
      alt: "The Cost tab: token count inputs, editable per-million rates, and the API-equivalent total set against the plan cost for the same window." },
    { file: "06-runtime.png", id: "runtime",
      note: "Runtime — per-tab WSL instances",
      alt: "The Runtime tab: cards for each WSL instance showing its distro, working directory and process id, with spawn, stop and kill controls." },
    { file: "07-health.png", id: "health",
      note: "Health — doctor, account, usage",
      alt: "The Health tab: codex doctor checks grouped by category with pass and fail states, alongside the account panel and the resolved binary path." },
    { file: "08-history.png", id: "history",
      note: "History — local git-backed, append-only",
      alt: "The History tab: a list of revisions from the local git repository, each labelled with what changed, and a diff of the selected revision." },
    { file: "09-changelog.png", id: "changelog",
      note: "Changelog viewer — date filter + regex search",
      alt: "The in-app changelog viewer: a date filter and a search field with its regex toggle above the parsed release entries." },
    { file: "10-studio.png", id: "studio",
      note: "Studio settings — language, funny sliders, narrator, dim sum, editor",
      alt: "The Studio settings tab: language mode selector, the two per-language funny sliders, the narrator controls, the dim sum toggle and the external editor picker." },
    { file: "11-regex-builder.png", id: "regex",
      note: "Regex builder anchored beside the search bar that opened it",
      alt: "The regex builder open as a panel anchored directly beside the Extend search field, showing construct buttons, flag toggles, a sample box and live matches." },
    { file: "12-appearance.png", id: "appearance",
      note: "Per-element appearance editor with the colour translator",
      alt: "The appearance editor anchored beside a message bubble, showing typography controls and the colour translator listing the same colour in several formats." },
    { file: "13-notifications.png", id: "notifications",
      note: "Corner notification stack and the reviewable centre",
      alt: "Several corner toasts stacked in the lower corner — an error, a warning and a success — with the notification centre open beside them." },
    { file: "14-bulk-close.png", id: "bulkclose",
      note: "Bulk close preview — the one place a blocking dialog is correct",
      alt: "The bulk close dialog: the match mode, the query, the count of affected tabs and a reviewable preview list before anything closes." },
    { file: "15-dim-sum.png", id: "dimsum",
      note: "Dim sum surprise — bundled catalog photo, non-blocking, auto-dismissing",
      alt: "The dim sum card in the lower corner: a photograph of the drawn dish, its name in English and Cantonese, and a close button." },
    { file: "16-light-theme.png", id: "light",
      note: "Light theme — the same surface under the M3 light palette",
      alt: "The Config tab rendered in the Material 3 light palette, showing the same layout on pale surfaces with dark text." }
  ];

  /* ---------------------------------------------------------------- dishes
     The same catalog as app/cx-dimsum.js, which is generated by
     tools/sync-dimsum.ps1. Images are referenced from app/dimsum/ — no copy is made,
     so there is exactly one set of photographs in the repository. */
  var DISHES = [
    { slug: "classic-har-gow", en: "Classic Har Gow", yue: "蝦餃", jyutping: "haa1 gaau2", altEn: "Warm tea-house photograph of Classic Har Gow", altYue: "港式茶樓木枱上嘅蝦餃" },
    { slug: "crab-roe-har-gow", en: "Crab Roe Har Gow", yue: "蟹籽蝦餃", jyutping: "haai5 zi2 haa1 gaau2", altEn: "Warm tea-house photograph of Crab Roe Har Gow", altYue: "港式茶樓木枱上嘅蟹籽蝦餃" },
    { slug: "pea-shoot-shrimp-dumpling", en: "Pea Shoot Shrimp Dumpling", yue: "豆苗蝦餃", jyutping: "dau6 miu4 haa1 gaau2", altEn: "Warm tea-house photograph of Pea Shoot Shrimp Dumpling", altYue: "港式茶樓木枱上嘅豆苗蝦餃" },
    { slug: "cuttlefish-shrimp-dumpling", en: "Cuttlefish Shrimp Dumpling", yue: "墨魚蝦餃", jyutping: "mak6 jyu4 haa1 gaau2", altEn: "Warm tea-house photograph of Cuttlefish Shrimp Dumpling", altYue: "港式茶樓木枱上嘅墨魚蝦餃" },
    { slug: "quail-egg-siu-mai", en: "Quail Egg Siu Mai", yue: "鵪鶉蛋燒賣", jyutping: "am1 seon4 daan6 siu1 maai6", altEn: "Warm tea-house photograph of Quail Egg Siu Mai", altYue: "港式茶樓木枱上嘅鵪鶉蛋燒賣" },
    { slug: "chicken-siu-mai", en: "Chicken Siu Mai", yue: "雞肉燒賣", jyutping: "gai1 juk6 siu1 maai6", altEn: "Warm tea-house photograph of Chicken Siu Mai", altYue: "港式茶樓木枱上嘅雞肉燒賣" },
    { slug: "roast-goose", en: "Roast Goose", yue: "燒鵝", jyutping: "siu1 ngo4", altEn: "Close catalog photograph of Roast Goose served on Hong Kong restaurant tableware.", altYue: "港式「燒鵝」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "lean-char-siu", en: "Lean Char Siu", yue: "瘦叉燒", jyutping: "sau3 caa1 siu1", altEn: "Close catalog photograph of Lean Char Siu served on Hong Kong restaurant tableware.", altYue: "港式「瘦叉燒」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "suckling-pig-platter", en: "Suckling Pig Platter", yue: "乳豬拼盤", jyutping: "jyu5 zyu1 ping3 pun4", altEn: "Close catalog photograph of Suckling Pig Platter served on Hong Kong restaurant tableware.", altYue: "港式「乳豬拼盤」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "red-fermented-bean-curd-roast-duck", en: "Red Fermented Bean Curd Roast Duck", yue: "南乳燒鴨", jyutping: "naam4 jyu5 siu1 aap3", altEn: "Close catalog photograph of Red Fermented Bean Curd Roast Duck served on Hong Kong restaurant tableware.", altYue: "港式「南乳燒鴨」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "five-spice-beef-shin", en: "Five-Spice Beef Shin", yue: "五香牛𦟌", jyutping: "ng5 hoeng1 ngau4 zin2", altEn: "Close catalog photograph of Five-Spice Beef Shin served on Hong Kong restaurant tableware.", altYue: "港式「五香牛𦟌」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "soy-braised-goose-wing", en: "Soy-Braised Goose Wing", yue: "滷水鵝翼", jyutping: "lou5 seoi2 ngo4 jik6", altEn: "Close catalog photograph of Soy-Braised Goose Wing served on Hong Kong restaurant tableware.", altYue: "港式「滷水鵝翼」用餐廳器皿上枱嘅近鏡菜式相。" },
    { slug: "soy-braised-cuttlefish", en: "Soy-Braised Cuttlefish", yue: "豉油滷水墨魚", jyutping: "si6 jau4 lou5 seoi2 mak6 jyu4", altEn: "A single serving of Soy-Braised Cuttlefish, glossy sliced cuttlefish tentacles in dark aromatic master stock.", altYue: "一份豉油滷水墨魚，切件墨魚喺深色滷水入面。" },
    { slug: "curry-squid", en: "Curry Squid", yue: "咖喱魷魚", jyutping: "gaa3 lei1 jau4 jyu2", altEn: "A single serving of Curry Squid, scored squid pieces and radish bathed in fragrant yellow curry.", altYue: "一份咖喱魷魚，魷魚同蘿蔔浸喺香濃黃咖喱入面。" },
    { slug: "classic-egg-waffles", en: "Classic Egg Waffles", yue: "原味雞蛋仔", jyutping: "jyun4 mei6 gai1 daan6 zai2", altEn: "A single serving of Classic Egg Waffles, a freshly baked bubble waffle with crisp round shells and a tender centre.", altYue: "一份新鮮出爐嘅原味雞蛋仔，外脆內軟。" },
    { slug: "matcha-egg-waffles", en: "Matcha Egg Waffles", yue: "抹茶雞蛋仔", jyutping: "mut3 caa4 gai1 daan6 zai2", altEn: "A single serving of Matcha Egg Waffles, a pale green matcha bubble waffle with crisp rounded cells.", altYue: "一份淺綠色嘅抹茶雞蛋仔，圓格外脆。" },
    { slug: "black-truffle-crystal-chive-and-water-chestnut-dumpling", en: "Black Truffle Crystal Chive and Water Chestnut Dumpling", yue: "黑松露水晶韭菜馬蹄餃", jyutping: "hak1 sung1 lou6 seoi2 zing1 gau2 coi3 maa5 tai4 gaau2", altEn: "Black Truffle Crystal Chive and Water Chestnut Dumpling presented as one freshly prepared Hong Kong dish on a ceramic plate.", altYue: "一碟新鮮整好嘅黑松露水晶韭菜馬蹄餃，用陶瓷碟上枱。" },
    { slug: "white-pepper-crystal-chive-and-water-chestnut-dumpling", en: "White Pepper Crystal Chive and Water Chestnut Dumpling", yue: "白胡椒水晶韭菜馬蹄餃", jyutping: "baak6 wu4 ziu1 seoi2 zing1 gau2 coi3 maa5 tai4 gaau2", altEn: "White Pepper Crystal Chive and Water Chestnut Dumpling presented as one freshly prepared Hong Kong dish on a ceramic plate.", altYue: "一碟新鮮整好嘅白胡椒水晶韭菜馬蹄餃，用陶瓷碟上枱。" },
    { slug: "ginger-sesame-crystal-spinach-and-bamboo-shoot-dumpling", en: "Ginger Sesame Crystal Spinach and Bamboo Shoot Dumpling", yue: "薑香芝麻水晶菠菜竹筍餃", jyutping: "goeng1 hoeng1 zi1 maa4 seoi2 zing1 bo1 coi3 zuk1 seon2 gaau2", altEn: "Ginger Sesame Crystal Spinach and Bamboo Shoot Dumpling presented as one freshly prepared Hong Kong dish on a ceramic plate.", altYue: "一碟新鮮整好嘅薑香芝麻水晶菠菜竹筍餃，用陶瓷碟上枱。" },
    { slug: "classic-crystal-pumpkin-and-pine-nut-dumpling", en: "Classic Crystal Pumpkin and Pine Nut Dumpling", yue: "水晶南瓜松子餃", jyutping: "seoi2 zing1 naam4 gwaa1 cung4 zi2 gaau2", altEn: "Classic Crystal Pumpkin and Pine Nut Dumpling presented as one freshly prepared Hong Kong dish on a ceramic plate.", altYue: "一碟新鮮整好嘅水晶南瓜松子餃，用陶瓷碟上枱。" }
  ];

  /* ------------------------------------------------------------- changelog
     Transcribed from CHANGELOG.md at the repository root. That file is the source of
     truth; this is a copy so the page opens from the filesystem with no fetch. When
     CHANGELOG.md changes, update this array — docs/site/README.md says so too. */
  var CHANGELOG = [
    {
      version: "0.1.0",
      date: "2026-07-30",
      status: "Not released yet: no tag has been pushed and no installer has been published, so this section describes the current state of `main` rather than a downloadable build. Codex Studio is Windows-only — there is no macOS or Linux target in the bundle configuration.",
      note: "The `Fixed` entries below correct the design prototype committed earlier in this same unreleased version (`design/`), not a shipped release. The `Added` entries describe the Tauri 2 shell as it stood when they were written; commit `561da4b` later replaced that shell with Electron, and the numbers in those entries refer to the Rust backend rather than to the current `electron/` tree.",
      sections: [
        { kind: "Added", items: [
          "Windows desktop shell bundling MSI and NSIS installers, installing per user so setup never asks for elevation. Product name `Codex Studio`, identifier `dev.codexstudio.app`, publisher `Ding Ding Projects`, licensed Apache-2.0.",
          "Custom Material 3 title bar: the window ships undecorated at 1440x940 (minimum 960x640), with an explicit, minimal capability set rather than a blanket default.",
          "47 backend commands covering version and state probes, `config.toml` read/write/set, run and capture, doctor, MCP list/add/remove/toggle, plugin catalog/install/uninstall, marketplace sources, skills, hooks, feature flags, session listing and actions, login/logout, WSL spawn/stop/kill/set/exec, git history commit/log/show/diff/prune, external editors, reveal-in-explorer, installed fonts and bounded text reads.",
          "Eight-tab navigation: Chats, Console, Extend, Config, Cost, Runtime, Health, History. Extend is itself sectioned into MCP servers, plugin marketplace, installed plugins, registries, skills, hooks and feature flags.",
          "Command catalog in `app/codex-data.js`: the CLI's subcommands and flags, every `config.toml` setting with its enum values, the slash commands and the feature-flag keys, transcribed from codex-rs.",
          "Runtime core in `app/codex-core.js` exporting `window.CX`: the desktop bridge with a browser-only fallback for development, a TOML writer, the bounded regex engine, colour translation across HEX/HEX8, RGB, HSL, HSV, HWB, LAB, LCH, OKLab, OKLCH and CMYK with a WCAG contrast ratio, the i18n table, the speech narrator and the local version history.",
          "Anchored regex builder beside every search surface — the session list, the Extend filter, the Config filter, the slash-command catalog, the command palette and dropdown option filters — each opening next to the field it belongs to, with flag toggles, a sample box, live match rows and copy.",
          "Bounded regex evaluation: patterns capped at 2000 characters, samples at 20 000, results at 500 matches, evaluation stopping after 300 ms and reporting catastrophic backtracking rather than freezing the window. Zero-width matches advance `lastIndex` instead of looping forever.",
          "Three language modes (English, playful Hong Kong Cantonese, bilingual) and two independent funny-level sliders from 1 to 5, one per language, persisted alongside the other preferences.",
          "Optional speech narrator, off by default, speaking `en-US` or `zh-HK` through a serialized queue with a 6-second cooldown so utterances never overlap.",
          "Local git-backed version history: profile, config, feature-flag and appearance changes are committed, and an undo is written as a new revert commit rather than popping the stack — so an undo can itself be undone, indefinitely.",
          "Per-session WSL runtimes: spawn a distro per chat tab, set its working directory, execute inside it, and stop or kill it independently of the other tabs.",
          "Cost tab with an API-equivalent cost calculator over the session's token counts.",
          "Bundled Roboto and Roboto Mono (`app/fonts/`, 10 woff2 faces plus the Apache-2.0 licence) and a vendored React 18.3.1 UMD build (`app/vendor/`, MIT). The app makes no network request at runtime.",
          "App icon generated by `tools/make-icon.mjs`, a dependency-free PNG writer, producing the full Windows icon set from `assets/icon-source.png`.",
          "This changelog and the in-app changelog viewer engine (`app/cx-changelog.js`): Keep a Changelog parsing that never throws, a date filter with named presets and typed ISO/`d/m/yyyy`/`m/d/yyyy` input, a composed text-and-date search with opt-in bounded regex, and Markdown or plain-text export that states the exported range."
        ]},
        { kind: "Fixed", items: [
          "React and Roboto were loaded from a CDN while the shell enforces `default-src 'self'`, so the window would have rendered blank on every machine. Both are now bundled locally and load before `support.js`.",
          "Sixteen of the thirty-one frontend calls had no matching backend command and were silently answered by the in-page browser simulator, so the GUI displayed invented MCP servers and a fictional plan expiry date. Every listing now comes from the real `codex` binary and the real `CODEX_HOME`; the simulator remains only as the browser-mode development fallback.",
          "`codex_run` drained stdout to completion before reading stderr, so a process that wrote enough to stderr filled the unread pipe and deadlocked both sides. The two streams are now drained concurrently."
        ]},
        { kind: "Security", items: [
          "Runtime CSP is `default-src 'self'` with `style-src 'self' 'unsafe-inline'`, `font-src 'self'` and `img-src 'self' data: blob:`. Scripts, styles, fonts and images are local only.",
          "Regex evaluation is bounded in pattern length, sample length, match count and wall time, so a pattern pasted from anywhere cannot hang the UI thread.",
          "The backend capability set is explicit rather than a blanket default — the frontend is granted window control, events, dialogs, OS info and external-open, and nothing else."
        ]}
      ]
    }
  ];

  /* ------------------------------------------------------------- doc pages
     The repository's own documentation tree, as it stands on disk. */
  var DOCS = [
    { cat: "Root", pages: [
      { path: "docs/README.md", title: "Documentation index", note: "Category map, repository map, and the one rule the product rests on: the GUI is a front end, never a reimplementation." }
    ]},
    { cat: "Architecture", pages: [
      { path: "docs/architecture/README.md", title: "Architecture index", note: "Layer diagram and the contracts each layer owes the others." },
      { path: "docs/architecture/overview.md", title: "Overview", note: "The three layers and why the CLI is never reimplemented." },
      { path: "docs/architecture/tauri-bridge.md", title: "Backend bridge", note: "The invoke contract and every registered command, with argument and return shapes." },
      { path: "docs/architecture/frontend-runtime.md", title: "Frontend runtime", note: "How the <x-dc> template and the DCLogic class render through React, and how to add a panel." }
    ]},
    { cat: "Build", pages: [
      { path: "docs/build/README.md", title: "Build index", note: "Prerequisites and the short version of every build path." },
      { path: "docs/build/building-locally.md", title: "Building locally", note: "The dev loop, the submodule, release builds, where output lands." },
      { path: "docs/build/packaging.md", title: "Packaging", note: "NSIS vs MSI, per-user install mode, icons, what the installer actually contains." },
      { path: "docs/build/continuous-integration.md", title: "Continuous integration", note: "The workflow, its triggers, and how releases are published." }
    ]},
    { cat: "Features", pages: [
      { path: "docs/features/README.md", title: "Features index", note: "One page per feature, plus the rules every feature obeys." },
      { path: "docs/features/regex-builder.md", title: "Regex builder", note: "Every search bar has a full, anchored, bounded regex builder beside it." },
      { path: "docs/features/tabs.md", title: "Tabs", note: "Pin, group, overflow, four searches, bulk close by text." },
      { path: "docs/features/appearance.md", title: "Appearance", note: "Per-element editor, Word-depth typography, infinite colour picker and translator." },
      { path: "docs/features/notifications.md", title: "Notifications", note: "Non-blocking toasts, a reviewable centre, and the narrow case where a modal is correct." },
      { path: "docs/features/local-version-control.md", title: "Local version control", note: "Append-only git history in $CODEX_HOME/studio; restoring is a new revision." },
      { path: "docs/features/external-editor.md", title: "External editor", note: "Detect what is installed, open a file or folder, degrade honestly when nothing is." },
      { path: "docs/features/wsl-runtimes.md", title: "WSL runtimes", note: "One long-lived Linux shell per tab, so cd and env survive between runs." }
    ]},
    { cat: "Experience", pages: [
      { path: "docs/experience/README.md", title: "Experience index", note: "Style is negotiable; facts are not." },
      { path: "docs/experience/language-modes.md", title: "Language modes", note: "English / 廣東話 / bilingual, the two sliders, voice-not-facts, the narrator, the disclosure." },
      { path: "docs/experience/accessibility.md", title: "Accessibility", note: "Keyboard, focus, roles, contrast, reduced motion — with an honest audit of current gaps." },
      { path: "docs/experience/changelog-viewer.md", title: "Changelog viewer", note: "Every released version, date filtering, search wired to the regex builder, export." },
      { path: "docs/experience/dim-sum-surprise.md", title: "Dim sum surprise", note: "The 1% launch delight, named in both languages, non-blocking and switchable off." }
    ]},
    { cat: "API", pages: [
      { path: "docs/api/README.md", title: "API", note: "Why there is no HTTP API and no Postman collection, and where the IPC surface is documented instead." }
    ]}
  ];

  g.CXS_DATA = {
    VERSION: 1,
    FACTS: FACTS,
    STRINGS: STRINGS,
    ARTICLES: ARTICLES,
    SHOTS: SHOTS,
    DISHES: DISHES,
    CHANGELOG: CHANGELOG,
    DOCS: DOCS
  };
})(window);
