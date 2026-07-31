/* Codex Studio — the localisation table.
   Every user-visible string lives here in five voices per language. The funny
   level chooses the voice and never the facts: level 1 and level 5 of a key name
   the same file, the same count and the same irreversibility. A warning nobody
   can act on is a broken warning, not a funny one. */
(function (g) {
  "use strict";

  const JOIN = "  ·  ";

  /* The user picks 1..5; the table is indexed 0..4. An unset level reads as 3 so
     a fresh install is neither stiff nor unhinged. */
  function level(funny, lang) {
    const n = funny && typeof funny[lang] === "number" ? funny[lang] : 3;
    return Math.min(4, Math.max(0, Math.round(n) - 1));
  }

  /* A function replacer keeps $-sequences inside user data (paths, regex
     patterns) literal. An unknown placeholder is left visible rather than
     silently dropped — a fact we cannot fill is not a fact we may hide. */
  function interpolate(text, vars) {
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, function (whole, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole;
    });
  }

  /* The order the funny-level disclosure reads these out in. Nothing is exempt
     from the slider, so nothing is missing from this list. */
  const CATEGORIES = [
    { id: "labels", en: "Buttons, labels and tab names", yue: "按鈕、標籤同 tab 名" },
    { id: "hints", en: "Hints and descriptions", yue: "提示同說明" },
    { id: "progress", en: "Progress and status messages", yue: "進度同狀態訊息" },
    { id: "success", en: "Success notifications", yue: "成功通知" },
    { id: "warnings", en: "Warnings", yue: "警告" },
    { id: "errors", en: "Errors and failures", yue: "錯誤同失敗訊息" },
    { id: "destructive", en: "Destructive confirmations", yue: "刪除同不可逆操作嘅確認" },
    { id: "security", en: "Security and credential messages", yue: "保安同帳戶憑證訊息" },
    { id: "history", en: "Version history labels", yue: "版本歷史標籤" },
    { id: "changelog", en: "Changelog entries", yue: "更新紀錄內容" },
    { id: "narrator", en: "Spoken narration", yue: "語音旁白" },
    { id: "dimsum", en: "The dim sum surprise", yue: "點心驚喜" }
  ];

  const STRINGS = {

    /* ---- app */
    "app.name": {
      en: ["Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio"],
      yue: ["Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio"]
    },
    "app.tagline": {
      en: ["Every Codex CLI command, setting and flag, in a Material 3 desktop app.",
        "Every Codex CLI command, setting and flag — with a real GUI on top.",
        "Every Codex CLI command, setting and flag, minus the man page.",
        "Every Codex CLI command, setting and flag — no more squinting at --help.",
        "Every Codex CLI command, setting and flag, dressed up so you never open --help again."],
      yue: ["Codex CLI 嘅每個指令、設定同 flag，全部有 Material 3 介面。",
        "Codex CLI 全部指令、設定同 flag，一個介面搞掂。",
        "Codex CLI 咩指令、設定、flag 都有，唔使再翻文件。",
        "Codex CLI 全部指令設定 flag 都喺度，唔使再眯埋眼睇 --help。",
        "Codex CLI 咩 flag 都執靚晒俾你撳，由今日起 --help 可以退休。"]
    },
    "app.windowTitle": {
      en: ["Codex Studio — {profile}", "Codex Studio — profile {profile}", "Codex Studio — {profile}", "Codex Studio — {profile}", "Codex Studio — {profile}, hard at it"],
      yue: ["Codex Studio — {profile}", "Codex Studio — 設定檔 {profile}", "Codex Studio — {profile}", "Codex Studio — {profile}", "Codex Studio — {profile} 開緊工"]
    },
    "app.ready": {
      en: ["Ready. Profile {profile}, model {model}.", "Ready. Profile {profile}, using model {model}.", "Ready — profile {profile}, on {model}.", "All set: profile {profile}, running {model}.", "Warmed up and waiting — profile {profile}, model {model}. Go on then."],
      yue: ["已就緒。設定檔 {profile}，模型 {model}。", "已就緒。設定檔 {profile}，使用模型 {model}。", "搞掂喇 — 設定檔 {profile}，用緊 {model}。", "一切就緒：設定檔 {profile}，行緊 {model}。", "熱定身等你 — 設定檔 {profile}，模型 {model}，快啲落單啦。"]
    },
    "app.about": {
      en: ["Codex Studio {version}, a Windows desktop shell for Codex CLI {cli}.",
        "Codex Studio {version} — a Windows desktop shell for Codex CLI {cli}.",
        "Codex Studio {version}, wrapped around Codex CLI {cli}.",
        "Codex Studio {version}, politely bossing Codex CLI {cli} around.",
        "Codex Studio {version} — the nice window Codex CLI {cli} lives behind."],
      yue: ["Codex Studio {version}，係 Codex CLI {cli} 嘅 Windows 桌面介面。",
        "Codex Studio {version} — Codex CLI {cli} 嘅 Windows 桌面介面。",
        "Codex Studio {version}，包住 Codex CLI {cli} 嚟用。",
        "Codex Studio {version}，好聲好氣咁指揮緊 Codex CLI {cli}。",
        "Codex Studio {version} — Codex CLI {cli} 住緊嘅靚屋。"]
    },

    /* ---- nav */
    "nav.chat": {
      en: ["Chats", "Chats", "Chats", "Chats", "Chats"],
      yue: ["對話", "對話", "傾偈", "傾偈", "吹水位"]
    },
    "nav.chat.hint": {
      en: ["Interactive Codex sessions in the active profile.", "Interactive Codex sessions running in the active profile.", "Your interactive Codex sessions in the active profile.", "Where you actually talk to Codex — interactive sessions in the active profile.", "Where the talking happens: interactive Codex sessions in the active profile."],
      yue: ["現用設定檔入面嘅互動 Codex 對話。", "喺現用設定檔入面進行嘅互動 Codex 對話。", "喺現用設定檔度同 Codex 傾嘅對話。", "真係同 Codex 對話嗰度 — 現用設定檔嘅互動對話。", "傾偈就喺呢度：現用設定檔嘅互動 Codex 對話。"]
    },
    "nav.console": {
      en: ["Console", "Console", "Console", "Console", "Console"],
      yue: ["主控台", "主控台", "主控台", "打指令嗰度", "打指令位"]
    },
    "nav.console.hint": {
      en: ["Every CLI subcommand and flag, composed and run from here.", "Compose and run every CLI subcommand and flag from here.", "Every CLI subcommand and flag — build the line, then run it.", "Every CLI subcommand and flag: point, click, and it runs.", "Every CLI subcommand and flag, so you can stop guessing at the shell."],
      yue: ["喺呢度砌好同執行每一個 CLI 子指令同 flag。", "每一個 CLI 子指令同 flag，都可以喺呢度砌好再執行。", "全部 CLI 子指令同 flag — 砌好條線再行。", "全部 CLI 子指令同 flag：撳兩下就行得。", "全部 CLI 子指令同 flag 都喺度，唔使再靠估打 shell。"]
    },
    "nav.ext": {
      en: ["Extend", "Extend", "Extend", "Extend", "Extend"],
      yue: ["擴充", "擴充", "擴充", "加料", "加料區"]
    },
    "nav.ext.hint": {
      en: ["MCP servers, plugins, marketplaces, skills, hooks and feature flags.", "Manage MCP servers, plugins, marketplaces, skills, hooks and feature flags.", "MCP servers, plugins, marketplaces, skills, hooks and feature flags — all the bolt-ons.", "Everything you bolt on: MCP servers, plugins, marketplaces, skills, hooks and feature flags.", "The bolt-on drawer: MCP servers, plugins, marketplaces, skills, hooks and feature flags."],
      yue: ["MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。", "管理 MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。", "MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標 — 全部加料嘢。", "所有加料嘢：MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。", "加料抽屜：MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。"]
    },
    "nav.settings": {
      en: ["Config", "Config", "Config", "Config", "Config"],
      yue: ["設定", "設定", "設定", "設定", "設定房"]
    },
    "nav.settings.hint": {
      en: ["Every config.toml setting for this profile.", "Every config.toml setting that applies to this profile.", "Every config.toml setting for this profile, with what each one does.", "Every config.toml setting for this profile — no TOML editing required.", "Every config.toml setting for this profile, so you never hand-edit TOML again."],
      yue: ["呢個設定檔嘅所有 config.toml 設定。", "適用於呢個設定檔嘅所有 config.toml 設定。", "呢個設定檔嘅所有 config.toml 設定，仲有每項嘅解釋。", "呢個設定檔嘅所有 config.toml 設定 — 唔使自己開 TOML。", "呢個設定檔嘅所有 config.toml 設定，由今日起唔使再手改 TOML。"]
    },
    "nav.cost": {
      en: ["Cost", "Cost", "Cost", "Cost", "Cost"],
      yue: ["費用", "費用", "洗費", "洗咗幾多", "銀両"]
    },
    "nav.cost.hint": {
      en: ["API-equivalent cost for the tokens you have used.", "API-equivalent cost of the tokens you have used so far.", "What those tokens would have cost on the API.", "What those tokens would have cost you on the API, to the cent.", "The bill you did not get: what those tokens would cost on the API."],
      yue: ["你用咗嘅 token 換算成 API 價錢。", "你目前用咗嘅 token 換算成 API 價錢。", "呢啲 token 用 API 計要幾錢。", "呢啲 token 用 API 計要幾錢，計到落個 cent。", "你唔使畀嗰張單：呢啲 token 用 API 計要幾錢。"]
    },
    "nav.runtime": {
      en: ["Runtime", "Runtime", "Runtime", "Runtime", "Runtime"],
      yue: ["執行環境", "執行環境", "執行環境", "Runtime", "隻企鵝嗰度"]
    },
    "nav.runtime.hint": {
      en: ["Per-tab WSL instances — spawn one per session and route work through it.", "Per-tab WSL instances — spawn one for each session and route work through it.", "One WSL instance per tab — spawn one per session and run work inside it.", "A WSL box per tab: spawn one per session and let it take the work.", "A little Linux per tab — spawn one per session and let it do the dirty work."],
      yue: ["每個 tab 一個 WSL 實例 — 每節開一個，工作經佢行。", "每個 tab 一個 WSL 實例 — 每節開一個，所有工作經佢執行。", "一個 tab 一個 WSL — 每節開一個，啲嘢入面行。", "每個 tab 一個 WSL 盒：每節開一個，交嘢俾佢做。", "每個 tab 養隻細細嘅 Linux — 每節開一個，污糟嘢交晒俾佢。"]
    },
    "nav.health": {
      en: ["Health", "Health", "Health", "Health", "Health"],
      yue: ["狀態", "狀態", "健康", "身體檢查", "體檢報告"]
    },
    "nav.health.hint": {
      en: ["Doctor checks, account, usage and cloud tasks.", "Doctor checks, account status, usage and cloud tasks.", "Doctor checks, your account, usage and cloud tasks.", "The check-up: doctor checks, account, usage and cloud tasks.", "The full check-up — doctor checks, account, usage and cloud tasks."],
      yue: ["Doctor 檢查、帳戶、用量同雲端任務。", "Doctor 檢查、帳戶狀態、用量同雲端任務。", "Doctor 檢查、你個帳戶、用量同雲端任務。", "體檢時間：Doctor 檢查、帳戶、用量同雲端任務。", "全套體檢 — Doctor 檢查、帳戶、用量同雲端任務。"]
    },
    "nav.history": {
      en: ["History", "History", "History", "History", "History"],
      yue: ["歷史", "歷史", "歷史", "時光機", "後悔藥"]
    },
    "nav.history.hint": {
      en: ["Local git history — undo anything, including an undo.", "Local git history — you can undo anything, including an undo.", "Local git history: undo anything here, including an undo.", "Local git history — undo anything, even an undo, as often as you like.", "Local git history: undo anything, undo the undo, undo that too. It is turtles."],
      yue: ["本機 git 歷史 — 咩都可以復原，連復原本身都復原得。", "本機 git 歷史 — 你可以復原任何嘢，連復原本身都復原得。", "本機 git 歷史：咩都撤銷得，連撤銷都撤銷得。", "本機 git 歷史 — 咩都收得返，連收返嗰下都收得返，幾多次都得。", "本機 git 歷史：後悔一次，後悔返嗰次，再後悔多次都得，一路後悔落去。"]
    },
    "nav.changelog": {
      en: ["Changelog", "Changelog", "Changelog", "Changelog", "Changelog"],
      yue: ["更新紀錄", "更新紀錄", "更新紀錄", "更新紀錄", "改咗啲乜"]
    },
    "nav.changelog.hint": {
      en: ["Every released version, with a date filter and search.", "Every released version, with a date filter and text search.", "Every released version — filter by date, search the text.", "Every released version, filterable by date and searchable to the word.", "Every released version ever — filter by date, hunt by regex, brag in the group chat."],
      yue: ["每一個已發佈版本，可以按日期篩選同搜尋。", "每一個已發佈版本，可以按日期篩選，亦可以搜尋內文。", "每一個已發佈版本 — 揀日期，搵字。", "每一個已發佈版本，可以揀日期範圍，逐個字搵。", "有史以來每個版本 — 揀日期、regex 亂咁搵、然後入 group 曬命。"]
    },
    "nav.appearance": {
      en: ["Appearance", "Appearance", "Appearance", "Appearance", "Appearance"],
      yue: ["外觀", "外觀", "外觀", "打扮", "扮靚位"]
    },
    "nav.appearance.hint": {
      en: ["Theme, density, accent, fonts, language and the funny level.", "Set the theme, density, accent, fonts, language and funny level.", "Theme, density, accent, fonts, language and how funny this app is allowed to be.", "Theme, density, accent, fonts, language, and exactly how funny this app may get.", "Theme, density, accent, fonts, language, and the dial that decides how cheeky I am."],
      yue: ["主題、密度、主色、字型、語言同搞笑程度。", "設定主題、密度、主色、字型、語言同搞笑程度。", "主題、密度、主色、字型、語言，仲有呢個 app 可以幾好笑。", "主題、密度、主色、字型、語言，同埋呢個 app 准許幾串。", "主題、密度、主色、字型、語言，同埋控制我幾串嗰個掣。"]
    },

    /* ---- actions */
    "act.send": {
      en: ["Send", "Send", "Send", "Send it", "Send it off"],
      yue: ["傳送", "傳送", "send 出去", "send 咗佢", "send 啦，唔好諗咁多"]
    },
    "act.run": {
      en: ["Run", "Run", "Run", "Run it", "Run it, go on"],
      yue: ["執行", "執行", "行", "行啦", "撳落去行啦"]
    },
    "act.cancel": {
      en: ["Cancel", "Cancel", "Cancel", "Cancel", "Cancel — never mind"],
      yue: ["取消", "取消", "取消", "唔要住", "算數，唔搞住"]
    },
    "act.save": {
      en: ["Save", "Save", "Save", "Save it", "Save it before you forget"],
      yue: ["儲存", "儲存", "儲存", "save 咗佢", "save 咗佢先，唔好等陣唔記得"]
    },
    "act.copy": {
      en: ["Copy", "Copy", "Copy", "Copy it", "Copy it, it is yours"],
      yue: ["複製", "複製", "copy", "copy 咗佢", "copy 走佢，唔使客氣"]
    },
    "act.close": {
      en: ["Close", "Close", "Close", "Close it", "Close it up"],
      yue: ["關閉", "關閉", "閂咗佢", "閂咗佢", "閂咗佢啦"]
    },
    "act.retry": {
      en: ["Retry", "Retry", "Retry", "Try again", "Give it another go"],
      yue: ["重試", "重試", "再試", "再試多次", "再試過啦，唔好認輸"]
    },
    "act.undo": {
      en: ["Undo", "Undo", "Undo", "Undo that", "Undo that, I saw nothing"],
      yue: ["復原", "復原", "撤銷", "收返啱先嗰下", "收返啱先嗰下，當我冇睇過"]
    },
    "act.redo": {
      en: ["Redo", "Redo", "Redo", "Redo it", "Redo it — you were right the first time"],
      yue: ["重做", "重做", "重做", "做返先啱", "做返啦，原來第一次啱嘅"]
    },
    "act.restore": {
      en: ["Restore", "Restore", "Restore", "Bring it back", "Bring it back from the dead"],
      yue: ["還原", "還原", "還原", "攞返佢", "喺歷史度撈返佢上嚟"]
    },
    "act.install": {
      en: ["Install", "Install", "Install", "Install it", "Install it, live a little"],
      yue: ["安裝", "安裝", "裝", "裝咗佢", "裝咗佢啦，試下先知"]
    },
    "act.uninstall": {
      en: ["Uninstall", "Uninstall", "Uninstall", "Remove it", "Uninstall it, no hard feelings"],
      yue: ["解除安裝", "解除安裝", "移除", "拆咗佢", "拆咗佢，唔怪得你"]
    },
    "act.enable": {
      en: ["Enable", "Enable", "Enable", "Turn it on", "Switch it on"],
      yue: ["啟用", "啟用", "開", "開咗佢", "開咗佢啦"]
    },
    "act.disable": {
      en: ["Disable", "Disable", "Disable", "Turn it off", "Switch it off"],
      yue: ["停用", "停用", "閂", "閂咗佢", "閂咗佢先"]
    },
    "act.pin": {
      en: ["Pin", "Pin", "Pin", "Pin it", "Pin it down"],
      yue: ["釘住", "釘住", "釘住", "釘實佢", "釘實佢，唔好走"]
    },
    "act.unpin": {
      en: ["Unpin", "Unpin", "Unpin", "Unpin it", "Unpin it, set it free"],
      yue: ["取消釘住", "取消釘住", "唔釘住佢", "唔釘住佢喇", "唔釘喇，放佢走"]
    },
    "act.delete": {
      en: ["Delete", "Delete", "Delete", "Delete it", "Delete it"],
      yue: ["刪除", "刪除", "刪咗佢", "刪咗佢", "刪咗佢啦"]
    },
    "act.export": {
      en: ["Export", "Export", "Export", "Export it", "Export it out"],
      yue: ["匯出", "匯出", "匯出", "export 出去", "export 出去傍身"]
    },
    "act.import": {
      en: ["Import", "Import", "Import", "Import one", "Bring one in"],
      yue: ["匯入", "匯入", "匯入", "import 入嚟", "揀個 import 入嚟"]
    },
    "act.reset": {
      en: ["Reset", "Reset", "Reset", "Reset it", "Reset it to the defaults"],
      yue: ["重設", "重設", "重設", "打返原形", "打返原形，當冇改過"]
    },
    "act.refresh": {
      en: ["Refresh", "Refresh", "Refresh", "Refresh it", "Refresh it, humour me"],
      yue: ["重新整理", "重新整理", "refresh", "refresh 下", "refresh 下啦，畀個面"]
    },
    "act.apply": {
      en: ["Apply", "Apply", "Apply", "Apply it", "Apply it"],
      yue: ["套用", "套用", "套用", "套落去", "套落去啦"]
    },
    "act.dismiss": {
      en: ["Dismiss", "Dismiss", "Dismiss", "Dismiss it", "Shoo it away"],
      yue: ["關閉", "關閉", "收咗佢", "收咗佢", "揈走佢"]
    },
    "act.openEditor": {
      en: ["Open in editor", "Open in editor", "Open in your editor",
        "Open it in your editor", "Fling it into your editor"],
      yue: ["用編輯器開啟", "用編輯器開啟", "用編輯器開", "攞去編輯器度開", "掟去編輯器度開"]
    },
    "act.openFolder": {
      en: ["Show in Explorer", "Show in Explorer", "Show in Explorer",
        "Show me in Explorer", "Pop it open in Explorer"],
      yue: ["喺檔案總管顯示", "喺檔案總管顯示", "喺檔案總管開", "去檔案總管睇", "彈個檔案總管出嚟睇"]
    },

    /* ---- tabs */
    "tab.new": {
      en: ["New tab", "New tab", "New tab", "New tab", "One more tab, why not"],
      yue: ["新增分頁", "新增分頁", "開個新 tab", "開多個 tab", "再開多個 tab 囉"]
    },
    "tab.close": {
      en: ["Close tab", "Close tab", "Close this tab", "Close this tab", "Close this tab"],
      yue: ["關閉分頁", "關閉分頁", "閂咗個 tab", "閂咗個 tab", "閂咗個 tab 啦"]
    },
    "tab.closeOthers": {
      en: ["Close other tabs", "Close other tabs", "Close every other tab",
        "Close every other tab", "Close every other tab and enjoy the quiet"],
      yue: ["關閉其他分頁", "關閉其他分頁", "閂晒其他 tab",
        "除咗呢個，其他 tab 閂晒", "除咗呢個，其他 tab 閂晒，清靜下"]
    },
    "tab.closeRight": {
      en: ["Close tabs to the right", "Close all tabs to the right", "Close everything to the right", "Close everything to the right", "Close everything to the right of here"],
      yue: ["關閉右邊嘅分頁", "關閉右邊所有分頁", "閂晒右邊啲 tab", "右邊啲 tab 一次過閂晒", "右邊啲 tab 一次過閂晒佢"]
    },
    "tab.closeLeft": {
      en: ["Close tabs to the left", "Close all tabs to the left", "Close everything to the left", "Close everything to the left", "Close everything to the left of here"],
      yue: ["關閉左邊嘅分頁", "關閉左邊所有分頁", "閂晒左邊啲 tab", "左邊啲 tab 一次過閂晒", "左邊啲 tab 一次過閂晒佢"]
    },
    "tab.pin": {
      en: ["Pin tab", "Pin tab", "Pin this tab", "Pin this tab", "Pin this tab down"],
      yue: ["釘住分頁", "釘住分頁", "釘住呢個 tab", "釘實呢個 tab", "釘實呢個 tab，唔准走"]
    },
    "tab.unpin": {
      en: ["Unpin tab", "Unpin tab", "Unpin this tab", "Unpin this tab", "Unpin this tab, set it free"],
      yue: ["取消釘住分頁", "取消釘住分頁", "唔釘住呢個 tab", "唔釘住呢個 tab 喇", "唔釘喇，放個 tab 走"]
    },
    "tab.pinnedRegion": {
      en: ["Pinned", "Pinned", "Pinned", "Pinned", "Pinned and proud"],
      yue: ["已釘住", "已釘住", "釘咗嗰啲", "釘實咗嗰啲", "釘實咗嗰啲，郁佢唔到"]
    },
    "tab.groupNew": {
      en: ["New group", "New group", "New tab group", "New tab group", "Round them into a group"],
      yue: ["新增群組", "新增群組", "開個新 tab 群組", "開個新 tab 群組", "圍晒佢哋埋一組"]
    },
    "tab.groupRename": {
      en: ["Rename group", "Rename group", "Rename this group",
        "Rename this group", "Give the group a better name"],
      yue: ["重新命名群組", "重新命名群組", "改個群組名", "改個群組名", "幫個群組改個好啲嘅名"]
    },
    "tab.groupColour": {
      en: ["Group colour", "Group colour", "Group colour", "Group colour", "Pick the group a colour"],
      yue: ["群組顏色", "群組顏色", "群組顏色", "群組顏色", "揀個顏色畀個群組"]
    },
    "tab.groupCollapse": {
      en: ["Collapse group", "Collapse group", "Collapse this group",
        "Fold this group up", "Fold this group up out of the way"],
      yue: ["收合群組", "收合群組", "收埋呢個群組", "摺埋呢個群組", "摺埋呢個群組，唔阻住"]
    },
    "tab.groupExpand": {
      en: ["Expand group", "Expand group", "Expand this group",
        "Open this group back up", "Open this group back up"],
      yue: ["展開群組", "展開群組", "打開呢個群組", "打返開呢個群組", "打返開呢個群組睇下"]
    },
    "tab.groupRemove": {
      en: ["Remove group — its {count} tabs stay open", "Remove group — the {count} tabs in it stay open", "Remove this group; its {count} tabs stay open", "Drop the group, keep the tabs — all {count} of them stay open", "Drop the group, keep the tabs — all {count} of them stay open"],
      yue: ["移除群組 — 入面 {count} 個 tab 唔會閂", "移除群組 — 入面 {count} 個 tab 會繼續開住", "拆咗呢個群組；入面 {count} 個 tab 照開", "拆組唔拆 tab — {count} 個 tab 全部照開", "拆組唔拆 tab — {count} 個 tab 全部照開，唔使驚"]
    },
    "tab.groupMoveIn": {
      en: ["Move to {group}", "Move to {group}", "Move this tab into {group}",
        "Shift this tab into {group}", "Shift this tab into {group}"],
      yue: ["移去 {group}", "移去 {group}", "將呢個 tab 移入 {group}",
        "搬呢個 tab 入 {group}", "搬呢個 tab 入 {group} 度"]
    },
    "tab.overflowMenu": {
      en: ["Show the hidden tabs", "Show the tabs hidden from the strip", "Show the tabs that do not fit", "Show me the tabs that do not fit", "Show me the tabs that could not fit"],
      yue: ["顯示匿埋咗嘅 tab", "顯示 tab 列度收埋咗嘅 tab", "睇下擺唔落嗰啲 tab", "睇下擺唔落嗰啲 tab", "睇下擠唔落嗰啲 tab"]
    },
    "tab.bulkContaining": {
      en: ["Close tabs containing text…", "Close tabs containing text in the title…", "Close tabs whose title contains…", "Close tabs whose title contains…", "Close tabs whose title contains…"],
      yue: ["關閉標題包含某段文字嘅分頁…", "關閉標題包含指定文字嘅分頁…", "閂晒標題有呢段字嘅 tab…", "閂晒標題有呢段字嘅 tab…", "閂晒標題有呢段字嘅 tab…"]
    },
    "tab.bulkNotContaining": {
      en: ["Close tabs not containing text…", "Close tabs not containing text in the title…", "Close tabs whose title does not contain…", "Close tabs whose title does not contain…", "Close tabs whose title does not contain…"],
      yue: ["關閉標題唔包含某段文字嘅分頁…", "關閉標題唔包含指定文字嘅分頁…", "閂晒標題冇呢段字嘅 tab…", "閂晒標題冇呢段字嘅 tab…", "閂晒標題冇呢段字嘅 tab…"]
    },
    "tab.bulkPreview": {
      en: ["{count} of {total} tabs match {query}. Review the list before closing.", "{count} of {total} tabs match {query}. Review the list before you close them.", "{count} of {total} tabs match {query} — have a look before they close.", "{count} of {total} tabs match {query}. Eyeball the list first; there is no undo for a closed tab.", "{count} of {total} tabs match {query}. Eyeball the list first — a closed tab does not come back."],
      yue: ["{total} 個 tab 入面有 {count} 個符合 {query}。閂之前請先睇清楚張清單。", "{total} 個 tab 入面有 {count} 個符合 {query}。閂之前請先睇清楚要閂邊啲。", "{total} 個 tab 入面 {count} 個中咗 {query} — 閂之前望多眼。", "{total} 個 tab 入面 {count} 個中咗 {query}。望清楚先，閂咗嘅 tab 冇得返轉頭。", "{total} 個 tab 入面 {count} 個中咗 {query}。望清楚先啦，閂咗就冇得叫返佢返嚟。"]
    },
    "tab.bulkPinnedExcluded": {
      en: ["{count} pinned tabs are excluded. Tick include pinned to close them too.", "{count} pinned tabs are excluded. Tick include pinned if you want to close them too.", "{count} pinned tabs are being spared. Tick include pinned if you want them gone too.", "{count} pinned tabs are being spared. Tick include pinned if you really want them gone too.", "{count} pinned tabs are hiding behind the pin. Tick include pinned if you really want them gone too."],
      yue: ["有 {count} 個釘住嘅 tab 唔會閂。想連佢哋一齊閂，請剔「包括釘住嘅」。", "有 {count} 個釘住嘅 tab 唔會閂。如果想連呢啲一齊閂，請剔「包括釘住嘅」。", "{count} 個釘住嘅 tab 放過咗佢。真係想閂埋就剔「包括釘住嘅」。", "{count} 個釘住嘅 tab 暫時逃過一劫。真係想閂埋就剔「包括釘住嘅」。", "{count} 個釘住嘅 tab 匿喺個釘後面逃過一劫。真係想閂埋就剔「包括釘住嘅」。"]
    },
    "tab.bulkEmptyQuery": {
      en: ["Type something first — an empty query would match all {total} tabs, so nothing was closed.", "Enter some text first — an empty query would match all {total} tabs, so nothing was closed.", "Type something first: an empty query matches all {total} tabs, so nothing was closed.", "Nice try — an empty query matches all {total} tabs, so nothing was closed. Type something first.", "Nice try. An empty query matches all {total} tabs, so nothing was closed. Type something first."],
      yue: ["請先輸入文字 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。", "請先輸入搜尋文字 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。", "打返啲字先：空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。", "咪玩喇 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。打返啲字先。", "咪玩喇。空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。打返啲字先啦。"]
    },
    "tab.bulkDone": {
      en: ["Closed {count} tabs. {kept} stayed open.", "Closed {count} tabs. The other {kept} stayed open.", "Closed {count} tabs; {kept} stayed open.", "{count} tabs gone, {kept} still standing.", "{count} tabs gone, {kept} still standing. Tidy."],
      yue: ["閂咗 {count} 個 tab，仲有 {kept} 個照開。", "閂咗 {count} 個 tab，其餘 {kept} 個照開。", "閂咗 {count} 個 tab；仲有 {kept} 個照開。", "{count} 個 tab 走咗，{kept} 個仲企喺度。", "{count} 個 tab 走咗，{kept} 個仲企喺度。幾整齊喎。"]
    },
    "tab.restoreClosed": {
      en: ["Reopen {name}", "Reopen {name}", "Reopen {name}",
        "Bring {name} back", "Bring {name} back from the dead"],
      yue: ["重開 {name}", "重開 {name}", "開返 {name}",
        "攞返 {name}", "叫返 {name} 返嚟"]
    },
    "tab.reorder": {
      en: ["Move a tab with Ctrl+Shift+Left or Ctrl+Shift+Right.", "Move a tab with Ctrl+Shift+Left or Ctrl+Shift+Right, or from its menu.", "Move a tab with Ctrl+Shift+Left or Ctrl+Shift+Right \u2014 or Move left and Move right in its menu.", "Shove a tab along with Ctrl+Shift+Left or Ctrl+Shift+Right, or use Move left and Move right in its menu.", "Shove a tab along with Ctrl+Shift+Left or Ctrl+Shift+Right \u2014 hold it down and walk the tab across the strip."],
      yue: ["\u7528 Ctrl+Shift+\u5DE6 \u6216\u8005 Ctrl+Shift+\u53F3 \u79FB\u52D5\u4E00\u500B tab\u3002", "\u7528 Ctrl+Shift+\u5DE6 \u6216\u8005 Ctrl+Shift+\u53F3 \u79FB\u52D5\u4E00\u500B tab\uFF0C\u4EA6\u53EF\u4EE5\u7528\u4F62\u500B\u9078\u55AE\u3002", "\u7528 Ctrl+Shift+\u5DE6 \u6216\u8005 Ctrl+Shift+\u53F3 \u90C1\u500B tab \u2014\u2014 \u6216\u8005\u63C0\u4F62\u9078\u55AE\u5165\u9762\u5605\u300C\u5411\u5DE6\u79FB\u300D\u540C\u300C\u5411\u53F3\u79FB\u300D\u3002", "\u63B3 Ctrl+Shift+\u5DE6 \u6216\u8005 Ctrl+Shift+\u53F3 \u63A8\u500B tab \u904E\u53BB\uFF0C\u7528\u9078\u55AE\u5605\u300C\u5411\u5DE6\u79FB\u300D\u300C\u5411\u53F3\u79FB\u300D\u90FD\u5F97\u3002", "\u63B3\u5BE6 Ctrl+Shift+\u5DE6 \u6216\u8005 Ctrl+Shift+\u53F3\uFF0C\u5E36\u4F4F\u500B tab \u4E00\u8DEF\u884C\u904E\u53BB\u3002"]
    },
    "tab.searchStrip": {
      en: ["Search the tabs in this strip", "Search the tabs in the current strip", "Search the tabs in this strip", "Find a tab in this strip", "Find a tab in this strip"],
      yue: ["搜尋呢條 tab 列嘅分頁", "搜尋呢條 tab 列入面嘅分頁", "搵呢條 tab 列嘅 tab", "喺呢條 tab 列度搵 tab", "喺呢條 tab 列度搵返個 tab"]
    },
    "tab.searchGroup": {
      en: ["Search the tabs in {group}", "Search the tabs in the {group} group", "Search the tabs in {group}", "Find a tab in {group}", "Find a tab in {group}"],
      yue: ["搜尋 {group} 入面嘅分頁", "搜尋 {group} 群組入面嘅分頁", "搵 {group} 入面嘅 tab", "喺 {group} 度搵 tab", "喺 {group} 度搵返個 tab"]
    },
    "tab.searchGroups": {
      en: ["Search tab groups by name", "Search all tab groups by name", "Search tab groups by name", "Find a tab group by name", "Find a tab group by name"],
      yue: ["按名搜尋 tab 群組", "按名搜尋所有 tab 群組", "按個名搵 tab 群組", "用個名搵返個 tab 群組", "用個名搵返個 tab 群組"]
    },
    "tab.searchAll": {
      en: ["Search every open tab in every window", "Search every open tab across all windows", "Search every open tab in every window", "Find any tab, in any window", "Find any tab, in any window, anywhere"],
      yue: ["搜尋所有視窗嘅所有已開分頁", "搜尋所有視窗入面已開嘅分頁", "搵晒所有視窗嘅 tab", "邊個視窗嘅 tab 都搵得返", "邊個視窗嘅 tab 都搵得返，一個都跑唔甩"]
    },
    "tab.searchResultAt": {
      en: ["{name} — {window} · {strip} · {group}", "{name} in {window} · {strip} · {group}", "{name} — {window} · {strip} · {group}", "{name}, over in {window} · {strip} · {group}", "{name}, hiding over in {window} · {strip} · {group}"],
      yue: ["{name} — {window} · {strip} · {group}", "{name} 喺 {window} · {strip} · {group}", "{name} — {window} · {strip} · {group}", "{name}，喺 {window} · {strip} · {group} 嗰邊", "{name}，匿咗喺 {window} · {strip} · {group} 嗰邊"]
    },
    "tab.editAppearance": {
      en: ["Edit tab appearance…", "Edit the tab's appearance…", "Edit this tab's appearance…", "Dress this tab up…", "Dress this tab up…"],
      yue: ["編輯分頁外觀…", "編輯呢個分頁嘅外觀…", "改呢個 tab 嘅外觀…", "幫呢個 tab 扮靚…", "幫呢個 tab 扮靚…"]
    },
    "tab.editGroupAppearance": {
      en: ["Edit group appearance…", "Edit the group's appearance…", "Edit this group's appearance…", "Dress this group up…", "Dress this group up…"],
      yue: ["編輯群組外觀…", "編輯呢個群組嘅外觀…", "改呢個群組嘅外觀…", "幫呢個群組扮靚…", "幫呢個群組扮靚…"]
    },

    /* ---- search and the regex builder */
    "search.placeholder": {
      en: ["Search", "Search", "Search", "Search for anything", "Search — type and I will hunt it down"],
      yue: ["搜尋", "搜尋", "搵嘢", "搵咩都得", "打幾隻字，我幫你搵"]
    },
    "search.regexOn": {
      en: ["Regular expressions on", "Regular expressions are on", "Regex on", "Regex is on", "Regex mode on — full firepower"],
      yue: ["已開啟正規表達式", "正規表達式已開啟", "regex 開咗", "regex 開咗喇", "regex 全開，火力全放"]
    },
    "search.regexOff": {
      en: ["Regular expressions off — plain text search", "Regular expressions are off — plain text search", "Regex off — plain text search", "Regex off, plain text search", "Regex off — plain, sensible, boring text search"],
      yue: ["已關閉正規表達式 — 純文字搜尋", "正規表達式已關閉 — 純文字搜尋", "regex 閂咗 — 純文字搜尋", "regex 閂咗，行純文字搜尋", "regex 閂咗 — 老老實實純文字搵，唔玩花臣"]
    },
    "search.noMatches": {
      en: ["No matches for {query}.", "No matches found for {query}.", "Nothing matches {query}.", "Nothing matches {query} — not one thing.", "Nothing matches {query}. Not a sausage."],
      yue: ["{query} 冇任何符合結果。", "冇搵到符合 {query} 嘅結果。", "{query} 乜都搵唔到。", "{query} 乜都搵唔到 — 一個都冇。", "{query} 乜都搵唔到，白鴿眼咁清。"]
    },
    "search.matchCount": {
      en: ["{count} matches", "{count} matches", "{count} matches",
        "{count} hits", "{count} hits, not bad"],
      yue: ["{count} 個符合", "{count} 個符合", "搵到 {count} 個",
        "搵到 {count} 個", "搵到 {count} 個，唔錯喎"]
    },
    "search.matchOne": {
      en: ["1 match", "1 match", "1 match", "Exactly 1 hit", "Exactly 1 hit — lucky you"],
      yue: ["1 個符合", "1 個符合", "搵到 1 個", "啱啱好 1 個", "啱啱好 1 個，好彩喎"]
    },
    "search.invalid": {
      en: ["Invalid pattern: {message}", "This pattern is invalid: {message}", "That pattern will not compile: {message}", "That pattern will not compile: {message}", "That pattern will not compile: {message}"],
      yue: ["樣式無效：{message}", "呢個樣式無效：{message}", "呢個樣式 compile 唔到：{message}", "呢個樣式 compile 唔到：{message}", "呢個樣式 compile 唔到，佢投訴：{message}"]
    },
    "search.truncated": {
      en: ["Showing the first {count} matches.", "These are the first {count} matches.", "Showing the first {count} matches only.", "Only the first {count} matches are shown — there were more.", "Only the first {count} matches are shown; there were more, but we stopped counting."],
      yue: ["只顯示頭 {count} 個結果。", "呢度只顯示頭 {count} 個結果。", "淨係顯示頭 {count} 個結果。", "淨係顯示頭 {count} 個結果 — 其實仲有更多。", "淨係顯示頭 {count} 個結果；其實仲有更多，數到攰。"]
    },
    "search.otherTab": {
      en: ["{count} matches are on the {tab} tab.", "{count} of the matches are on the {tab} tab.", "{count} matches are over on the {tab} tab.", "{count} matches are hiding on the {tab} tab.", "{count} matches are hiding on the {tab} tab. Go on, have a look."],
      yue: ["有 {count} 個結果喺 {tab} 分頁度。", "當中有 {count} 個結果喺 {tab} 分頁度。", "有 {count} 個結果喺 {tab} 嗰個 tab 度。", "有 {count} 個結果匿咗喺 {tab} 嗰個 tab 度。", "有 {count} 個結果匿咗喺 {tab} 嗰個 tab 度，過去睇下啦。"]
    },
    "search.builderOpen": {
      en: ["Open the regex builder", "Build a pattern in the regex builder", "Open the regex builder", "Let the builder write the pattern", "Let the builder write the pattern for you"],
      yue: ["開啟 regex 產生器", "用 regex 產生器建立樣式", "開個 regex 產生器", "等產生器幫你砌個樣式", "等產生器幫你砌個樣式，唔使自己諗"]
    },
    "search.builderClose": {
      en: ["Close the builder", "Close the builder", "Close the builder",
        "Close the builder", "Close the builder, we are done here"],
      yue: ["關閉產生器", "關閉產生器", "閂咗個產生器", "閂咗個產生器", "閂咗個產生器，收工"]
    },
    "search.flags": {
      en: ["Flags", "Flags", "Flags", "Flags", "Flags — the little letters that change everything"],
      yue: ["旗標", "旗標", "Flags", "Flags", "Flags —幾隻細細嘅字母，威力好大"]
    },
    "search.sample": {
      en: ["Sample text", "Sample text", "Sample text",
        "Sample text to try it on", "Sample text to try it on"],
      yue: ["樣本文字", "樣本文字", "試下用嘅文字", "攞嚟試手嘅文字", "攞嚟試手嘅文字"]
    },
    "search.copyPattern": {
      en: ["Copy the pattern", "Copy the pattern", "Copy the pattern",
        "Copy the pattern", "Copy the pattern before you lose it"],
      yue: ["複製樣式", "複製樣式", "copy 個樣式", "copy 個樣式", "快啲 copy 個樣式，唔好等陣搵唔返"]
    },
    "search.clear": {
      en: ["Clear the search", "Clear the search", "Clear the search",
        "Clear it and start again", "Clear it and start again"],
      yue: ["清除搜尋", "清除搜尋", "清咗個搜尋", "清咗佢重新嚟過", "清咗佢重新嚟過啦"]
    },
    "search.caseSensitive": {
      en: ["Match case", "Match case", "Match case",
        "Match upper and lower case exactly", "Match upper and lower case exactly"],
      yue: ["區分大小寫", "區分大小寫", "分大細楷", "大細楷要一模一樣", "大細楷要一模一樣先算數"]
    },
    "search.dialect": {
      en: ["Engine: {engine}", "Engine: {engine}", "Engine: {engine}",
        "Running on {engine} — escaping follows its rules",
        "Running on {engine} — escaping follows its rules, not the other guy's"],
      yue: ["引擎：{engine}", "引擎：{engine}", "引擎：{engine}",
        "行緊 {engine} — escape 規則跟佢嗰套",
        "行緊 {engine} — escape 規則跟佢嗰套，唔好用第個引擎嘅招"]
    },

    /* ---- notifications */
    "notify.info": {
      en: ["Information", "Information", "Heads up", "Heads up", "Just so you know"],
      yue: ["提示", "提示", "提你一句", "提你一句", "話你知一聲"]
    },
    "notify.success": {
      en: ["Done", "Done", "Done", "Done and dusted", "Done and dusted"],
      yue: ["完成", "完成", "搞掂", "搞掂晒", "搞掂晒，靚仔"]
    },
    "notify.progress": {
      en: ["Working…", "Working…", "Working on it…", "Working on it…", "On it — give me a second…"],
      yue: ["處理緊…", "處理緊…", "做緊…", "做緊喇…", "做緊喇，等我一陣…"]
    },
    "notify.warning": {
      en: ["Warning", "Warning", "Warning", "Careful", "Careful now"],
      yue: ["警告", "警告", "警告", "小心啲", "咪住，小心啲"]
    },
    "notify.error": {
      en: ["Error", "Error", "Error", "That went wrong", "That went wrong"],
      yue: ["錯誤", "錯誤", "錯誤", "出咗事", "呢鑊出咗事"]
    },
    "notify.centre": {
      en: ["Notifications", "Notifications", "Notifications", "Notifications", "Notifications"],
      yue: ["通知", "通知", "通知", "通知", "通知箱"]
    },
    "notify.centreEmpty": {
      en: ["No notifications yet.", "There are no notifications yet.", "No notifications yet.", "No notifications yet — quiet in here.", "No notifications yet. Beautifully quiet in here."],
      yue: ["暫時未有通知。", "暫時仲未有通知。", "暫時未有通知。", "暫時未有通知 — 幾清靜。", "暫時未有通知，清靜到有啲得意。"]
    },
    "notify.dismissed": {
      en: ["Dismissed. It is still in the notification centre.", "Dismissed. It is still available in the notification centre.", "Dismissed — it is still in the notification centre if you want it back.", "Dismissed. It is still in the notification centre, so nothing is lost.", "Dismissed. It is still in the notification centre, so nothing is lost."],
      yue: ["已收起。佢仲喺通知中心度。", "已收起。呢個通知仲留喺通知中心度。", "收起咗 — 想睇返就去通知中心搵佢。", "收起咗。佢仲喺通知中心度，冇嘢會唔見。", "收起咗。佢仲喺通知中心度，冇嘢會唔見，放心。"]
    },
    "notify.dismissAll": {
      en: ["Dismiss all", "Dismiss all", "Dismiss all", "Clear them all", "Clear the lot"],
      yue: ["全部收起", "全部收起", "全部收起", "全部清咗佢", "一次過清晒佢"]
    },
    "notify.unread": {
      en: ["{count} unread", "{count} unread", "{count} unread",
        "{count} still unread", "{count} still unread, waiting patiently"],
      yue: ["{count} 個未讀", "{count} 個未讀", "{count} 個未讀",
        "仲有 {count} 個未讀", "仲有 {count} 個未讀，等緊你"]
    },
    "notify.unreadNone": {
      en: ["Nothing unread", "Nothing unread", "Nothing unread",
        "Nothing unread — all caught up", "Nothing unread. All caught up."],
      yue: ["冇未讀", "冇未讀", "冇未讀", "冇未讀 — 追晒喇", "冇未讀，全部追晒，勁。"]
    },
    "notify.viewDetails": {
      en: ["View details", "View details", "View details", "Show me the details", "Show me the gory details"],
      yue: ["查看詳情", "查看詳情", "睇詳情", "睇下詳情", "睇晒啲血淋淋嘅詳情"]
    },
    "notify.copied": {
      en: ["Copied to the clipboard.", "Copied to the clipboard for you.", "Copied to the clipboard.", "Copied — it is on your clipboard.", "Copied — it is on your clipboard, go paste it."],
      yue: ["已複製到剪貼簿。", "內容已複製到剪貼簿。", "copy 咗去剪貼簿。", "copy 咗 — 已經喺你個剪貼簿度。", "copy 咗 — 已經喺你個剪貼簿度，快啲 paste 啦。"]
    },
    "notify.savedTo": {
      en: ["Saved to {path}.", "Saved to {path}.", "Saved to {path}.",
        "Saved — it is at {path}.", "Saved — it is sitting at {path}."],
      yue: ["已儲存至 {path}。", "已儲存至 {path}。", "save 咗去 {path}。",
        "save 咗 — 喺 {path} 度。", "save 咗 — 好地地坐喺 {path} 度。"]
    },

    /* ---- errors. Every level carries every placeholder and the same remedy;
       only the sentence around them moves. */
    "err.binaryMissing": {
      en: ["The Codex CLI was not found at {path}. Set the path in Config, or install the CLI and reopen Codex Studio.",
        "No Codex CLI at {path}. Point Config at the right path, or install the CLI and reopen Codex Studio.",
        "Nothing lives at {path} — the Codex CLI is not there. Fix the path in Config, or install the CLI and reopen Codex Studio.",
        "Knocked on {path}, nobody home — no Codex CLI there. Set the real path in Config, or install the CLI and reopen Codex Studio.",
        "{path} is an empty room with a Codex-shaped hole in it. Tell Config where the binary actually lives, or install the CLI and reopen Codex Studio."],
      yue: ["喺 {path} 搵唔到 Codex CLI。請喺 Config 設定正確路徑，或者安裝好 CLI 再開返 Codex Studio。",
        "{path} 度冇 Codex CLI。去 Config 改返個路徑，或者裝好 CLI 再開返 Codex Studio。",
        "{path} 撲咗個空，冇 Codex CLI 喺度。去 Config 改路徑，或者裝好 CLI 再開返 Codex Studio。",
        "去到 {path} 撳門鐘冇人應 — 冇 Codex CLI。去 Config 話返俾佢知條路，或者裝好 CLI 再開返 Codex Studio。",
        "{path} 空空如也，得個 Codex 形狀嘅窿。快啲去 Config 指返條正路，或者裝好 CLI 再開返 Codex Studio。"]
    },
    "err.configParse": {
      en: ["{path} could not be parsed: {message} at line {line}. Fix that line, or restore an earlier copy from History.",
        "{path} will not parse: {message} at line {line}. Fix that line, or restore an earlier copy from History.",
        "{path} is not valid TOML — {message} at line {line}. Fix that line, or pull an earlier copy from History.",
        "{path} has TOML that refuses to parse: {message}, at line {line}. Fix that line, or pull an earlier copy from History.",
        "{path} tripped over its own TOML: {message}, right at line {line}. Patch that line, or yank a working copy back from History."],
      yue: ["{path} 解析唔到：第 {line} 行 {message}。請修正嗰行，或者喺 History 還原返舊版。",
        "{path} 解析唔到：第 {line} 行 {message}。整返好嗰行，或者喺 History 還原返舊版。",
        "{path} 唔係有效嘅 TOML — 第 {line} 行 {message}。整返好嗰行，或者去 History 攞返舊版。",
        "{path} 有段 TOML 死都唔肯解析：第 {line} 行 {message}。整返好嗰行，或者去 History 攞返舊版。",
        "{path} 畀自己嘅 TOML 絆親：第 {line} 行 {message}。整返好嗰行，或者去 History 撈返個好版本上嚟。"]
    },
    "err.mcpAdd": {
      en: ["The MCP server {name} could not be added: {message}. Nothing was written to config.toml.", "The MCP server {name} was not added: {message}. Nothing was written to config.toml.", "Adding the MCP server {name} failed: {message}. Nothing was written to config.toml.", "The MCP server {name} would not go in: {message}. Nothing was written to config.toml, so nothing is broken.", "The MCP server {name} refused to move in: {message}. Nothing was written to config.toml, so nothing is broken."],
      yue: ["加唔到 MCP 伺服器 {name}：{message}。config.toml 冇寫入任何嘢。", "MCP 伺服器 {name} 加唔到：{message}。config.toml 冇寫入任何嘢。", "加 MCP 伺服器 {name} 失敗：{message}。config.toml 乜都冇寫。", "MCP 伺服器 {name} 點都入唔到：{message}。config.toml 乜都冇寫，所以冇搞爛嘢。", "MCP 伺服器 {name} 死都唔肯搬入嚟：{message}。config.toml 乜都冇寫，所以冇搞爛嘢。"]
    },
    "err.mcpUnreachable": {
      en: ["The MCP server {name} did not answer at {url}. Check it is running, then enable it again here.", "The MCP server {name} gave no answer at {url}. Check that it is running, then enable it again here.", "No answer from the MCP server {name} at {url}. Check it is running, then enable it again here.", "The MCP server {name} is not answering at {url}. Check it is running, then enable it again here.", "Called {url} for the MCP server {name} and got dead air. Check it is running, then enable it again here."],
      yue: ["MCP 伺服器 {name} 喺 {url} 冇回應。請確認佢行緊，然後喺呢度再啟用佢。", "MCP 伺服器 {name} 喺 {url} 度冇回應。請先確認佢行緊，然後喺呢度再啟用佢。", "喺 {url} 度撳唔到 MCP 伺服器 {name}。睇下佢行緊未，然後喺呢度再啟用佢。", "MCP 伺服器 {name} 喺 {url} 度唔應機。睇下佢行緊未，然後喺呢度再啟用佢。", "打 {url} 搵 MCP 伺服器 {name}，得把聲都冇。睇下佢行緊未，然後喺呢度再啟用佢。"]
    },
    "err.pluginInstall": {
      en: ["The plugin {name} did not install: {message}. Nothing was changed.", "The plugin {name} was not installed: {message}. Nothing was changed.", "Installing the plugin {name} failed: {message}. Nothing was changed.", "The plugin {name} would not install: {message}. Nothing was changed, so you are exactly where you were.", "The plugin {name} took one look and left: {message}. Nothing was changed, so you are exactly where you were."],
      yue: ["外掛 {name} 裝唔到：{message}。冇改動過任何嘢。", "外掛 {name} 安裝唔成功：{message}。冇改動過任何嘢。", "裝外掛 {name} 失敗：{message}。乜都冇改到。", "外掛 {name} 死都唔肯裝：{message}。乜都冇改到，你仲喺原地。", "外掛 {name} 望一望就走咗：{message}。乜都冇改到，你仲喺原地。"]
    },
    "err.pluginUninstall": {
      en: ["The plugin {name} could not be removed: {message}. It is still installed.", "The plugin {name} was not removed: {message}. It is still installed.", "Removing the plugin {name} failed: {message}. It is still installed.", "The plugin {name} would not budge: {message}. It is still installed.", "The plugin {name} is clinging on: {message}. It is still installed."],
      yue: ["移除唔到外掛 {name}：{message}。佢仲裝住喺度。", "外掛 {name} 移除唔到：{message}。佢仲裝住喺度。", "拆外掛 {name} 失敗：{message}。佢仲喺度。", "外掛 {name} 郁都唔郁：{message}。佢仲裝住喺度。", "外掛 {name} 揸到實一實：{message}。佢仲裝住喺度。"]
    },
    "err.wslMissing": {
      en: ["WSL is not installed, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.", "WSL is not installed on this machine, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.", "There is no WSL here, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.", "No WSL on this machine, so the distro {distro} has nowhere to start. Run wsl --install in an elevated terminal, then reopen Runtime.", "No WSL on this machine at all, so the distro {distro} has nowhere to live. Run wsl --install in an elevated terminal, then reopen Runtime."],
      yue: ["未安裝 WSL，所以 {distro} 開唔到。請喺管理員終端機行 wsl --install，然後再開返 Runtime。", "呢部機未安裝 WSL，所以 {distro} 開唔到。請喺管理員終端機行 wsl --install，然後再開返 Runtime。", "部機冇 WSL，所以 {distro} 開唔到。喺管理員終端機行 wsl --install，然後再開返 Runtime。", "部機根本冇 WSL，{distro} 冇地方開。喺管理員終端機行 wsl --install，然後再開返 Runtime。", "部機根本冇 WSL，{distro} 連間屋都冇。喺管理員終端機行 wsl --install，然後再開返 Runtime。"]
    },
    "err.wslExec": {
      en: ["The command in {distro} exited with code {code}. Its output is in the Runtime log.", "The command in {distro} exited with code {code}. You will find its output in the Runtime log.", "The command in {distro} came back with code {code}. Its output is in the Runtime log.", "The command in {distro} bailed out with code {code}. Its output is in the Runtime log.", "The command in {distro} stormed off with code {code}. Its output is in the Runtime log."],
      yue: ["{distro} 入面嘅指令以代碼 {code} 結束。輸出喺 Runtime 記錄度。", "{distro} 入面嘅指令以代碼 {code} 結束。佢嘅輸出可以喺 Runtime 記錄度搵到。", "{distro} 入面嗰條指令回咗代碼 {code}。輸出喺 Runtime 記錄度。", "{distro} 入面嗰條指令劈炮，代碼 {code}。輸出喺 Runtime 記錄度。", "{distro} 入面嗰條指令發脾氣走咗，代碼 {code}。輸出喺 Runtime 記錄度。"]
    },
    "err.editorMissing": {
      en: ["{editor} was not found, so {path} was not opened. Pick another editor in Config.", "{editor} could not be found, so {path} was not opened. Pick another editor in Config.", "{editor} is not on this machine, so {path} was not opened. Pick another editor in Config.", "{editor} is nowhere on this machine, so {path} stayed shut. Pick another editor in Config.", "{editor} is nowhere on this machine, so {path} stayed firmly shut. Pick another editor in Config."],
      yue: ["搵唔到 {editor}，所以冇開到 {path}。請喺 Config 揀第個編輯器。", "搵唔到 {editor}，所以 {path} 冇開到。請喺 Config 揀另一個編輯器。", "部機冇 {editor}，所以 {path} 開唔到。喺 Config 揀第個編輯器。", "成部機都搵唔到 {editor}，{path} 冇開到。喺 Config 揀第個編輯器。", "成部機都搵唔到 {editor}，{path} 咪繼續閂實囉。喺 Config 揀第個編輯器。"]
    },
    "err.historyWrite": {
      en: ["The version history could not be written: {message}. Your change was still applied — only the snapshot is missing.", "The version history could not be saved: {message}. Your change was still applied — only the snapshot is missing.", "The version history did not save: {message}. Your change was still applied; only the snapshot is missing.", "The version history did not save: {message}. Your change went through anyway — only the snapshot is missing.", "The version history dropped the pen: {message}. Your change went through anyway — only the snapshot is missing."],
      yue: ["版本歷史寫唔到：{message}。你嘅改動照樣生效 — 淨係少咗個快照。", "版本歷史儲存唔到：{message}。你嘅改動照樣生效 — 淨係少咗個快照。", "版本歷史 save 唔到：{message}。你嘅改動照樣生效；淨係少咗個快照。", "版本歷史 save 唔到：{message}。你嘅改動照過 — 淨係少咗個快照。", "版本歷史寫寫下甩咗支筆：{message}。你嘅改動照過 — 淨係少咗個快照。"]
    },
    "err.regexTimeout": {
      en: ["Evaluating {pattern} was stopped after {ms} ms — it may backtrack catastrophically. Simplify the pattern, or shorten the sample.", "Evaluating {pattern} was stopped after {ms} ms — it may backtrack catastrophically. Simplify the pattern, or use a shorter sample.", "{pattern} was cut off after {ms} ms — it looks like catastrophic backtracking. Simplify the pattern, or shorten the sample.", "{pattern} was still chewing after {ms} ms, so it was stopped — that smells like catastrophic backtracking. Simplify the pattern, or shorten the sample.", "{pattern} was still chewing after {ms} ms and got sent home — classic catastrophic backtracking. Simplify the pattern, or shorten the sample."],
      yue: ["{pattern} 行咗 {ms} 毫秒之後被中止 — 可能出現災難性回溯。請簡化樣式，或者縮短樣本。", "{pattern} 行咗 {ms} 毫秒之後已中止 — 可能出現災難性回溯。請簡化樣式，或者改用短啲嘅樣本。", "{pattern} 行到 {ms} 毫秒就 cut 咗 — 睇落係災難性回溯。簡化個樣式，或者縮短樣本。", "{pattern} 嚼咗 {ms} 毫秒都未完，唯有截停佢 — 好似災難性回溯。簡化個樣式，或者縮短樣本。", "{pattern} 嚼咗 {ms} 毫秒都未肯收工，勸咗佢返屋企 — 典型災難性回溯。簡化個樣式，或者縮短樣本。"]
    },
    "err.tomlWriteRefused": {
      en: ["{path} was not written: {reason}. The file on disk is unchanged.", "Nothing was written to {path}: {reason}. The file on disk is unchanged.", "{path} was left alone: {reason}. The file on disk is unchanged.", "{path} was left well alone: {reason}. The file on disk is unchanged.", "{path} was left well alone: {reason}. The file on disk has not moved a byte."],
      yue: ["冇寫入 {path}：{reason}。硬碟上嗰個檔案原封不動。", "{path} 冇寫入過任何嘢：{reason}。硬碟上嗰個檔案原封不動。", "{path} 冇郁過：{reason}。硬碟上嗰個檔案原封不動。", "{path} 一隻手指都冇掂過：{reason}。硬碟上嗰個檔案原封不動。", "{path} 一隻手指都冇掂過：{reason}。硬碟上嗰個檔案一個 byte 都冇郁。"]
    },
    "err.sessionMissing": {
      en: ["The session {id} is no longer on disk. Start a new chat, or resume another session.", "The session {id} can no longer be found on disk. Start a new chat, or resume another session.", "The session {id} is gone from disk. Start a new chat, or resume another session.", "The session {id} has vanished from disk — probably pruned. Start a new chat, or resume another session.", "The session {id} has vanished from disk, probably pruned by a tidy hand. Start a new chat, or resume another session."],
      yue: ["對話 {id} 已經唔喺硬碟度。開個新對話，或者續返另一個對話。", "喺硬碟度已經搵唔到對話 {id}。開個新對話，或者續返另一個對話。", "對話 {id} 喺硬碟度冇咗。開個新對話，或者續返另一個對話。", "對話 {id} 喺硬碟度消失咗 — 好可能俾人清咗。開個新對話，或者續返另一個對話。", "對話 {id} 喺硬碟度人間蒸發，多數俾人手快清咗。開個新對話，或者續返另一個對話。"]
    },
    "err.permissionDenied": {
      en: ["Windows refused access to {path}. Grant access, or choose a folder Codex Studio can write to.", "Windows would not grant access to {path}. Grant access, or choose a folder Codex Studio can write to.", "Windows said no to {path}. Grant access, or choose a folder Codex Studio can write to.", "Windows slammed the door on {path}. Grant access, or choose a folder Codex Studio can write to.", "Windows slammed the door on {path} and locked it. Grant access, or choose a folder Codex Studio can write to."],
      yue: ["Windows 拒絕存取 {path}。請開放權限，或者揀個 Codex Studio 寫得入嘅資料夾。", "Windows 拒絕咗存取 {path}。請開放權限，或者揀個 Codex Studio 寫得入嘅資料夾。", "Windows 唔畀掂 {path}。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。", "Windows 喺 {path} 度大力閂埋度門。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。", "Windows 喺 {path} 度閂埋度門仲落埋鎖。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。"]
    },
    "err.commandFailed": {
      en: ["{command} exited with code {code}. The full output is in the console.", "{command} exited with code {code}. You will find the full output in the console.", "{command} came back with code {code}. The full output is in the console.", "{command} bailed out with code {code}. The full output is in the console.", "{command} threw its hands up with code {code}. The full output is in the console."],
      yue: ["{command} 以代碼 {code} 結束。完整輸出喺主控台度。", "{command} 以代碼 {code} 結束。完整輸出可以喺主控台度睇到。", "{command} 回咗代碼 {code}。完整輸出喺主控台度。", "{command} 劈炮走咗，代碼 {code}。完整輸出喺主控台度。", "{command} 攤大手掌唔做，代碼 {code}。完整輸出喺主控台度。"]
    },
    "err.profileMissing": {
      en: ["The profile {name} no longer exists. Pick another profile, or create {name} again in Config.", "The profile {name} does not exist any more. Pick another profile, or create {name} again in Config.", "The profile {name} is gone. Pick another profile, or create {name} again in Config.", "The profile {name} has left the building. Pick another profile, or create {name} again in Config.", "The profile {name} has left the building without a note. Pick another profile, or create {name} again in Config."],
      yue: ["設定檔 {name} 已經唔存在。揀第個設定檔，或者喺 Config 度重新建立 {name}。", "設定檔 {name} 已經唔再存在。請揀另一個設定檔，或者喺 Config 度重新建立 {name}。", "設定檔 {name} 冇咗。揀第個設定檔，或者喺 Config 度起返個 {name}。", "設定檔 {name} 走咗佬。揀第個設定檔，或者喺 Config 度起返個 {name}。", "設定檔 {name} 走咗佬，仲要連張字條都冇。揀第個設定檔，或者喺 Config 度起返個 {name}。"]
    },
    "err.importInvalid": {
      en: ["{file} is not a Codex Studio theme: {message}. Nothing was imported and your current appearance is untouched.", "{file} is not a Codex Studio theme file: {message}. Nothing was imported and your current appearance is untouched.", "{file} is not a Codex Studio theme — {message}. Nothing was imported; your current appearance is untouched.", "{file} is not a Codex Studio theme, whatever it thinks it is: {message}. Nothing was imported; your current appearance is untouched.", "{file} is not a Codex Studio theme, whatever it thinks it is: {message}. Nothing was imported, and your current look is exactly as you left it."],
      yue: ["{file} 唔係 Codex Studio 主題檔：{message}。冇匯入任何嘢，你而家嘅外觀原封不動。", "{file} 並唔係 Codex Studio 主題檔：{message}。冇匯入任何嘢，你而家嘅外觀維持原樣。", "{file} 唔係 Codex Studio 主題檔 — {message}。乜都冇 import 到；你而家嘅外觀原封不動。", "{file} 唔理佢自認係乜，總之唔係 Codex Studio 主題檔：{message}。乜都冇 import 到；你而家嘅外觀原封不動。", "{file} 唔理佢自認係乜，總之唔係 Codex Studio 主題檔：{message}。乜都冇 import 到，你個樣同你走嗰陣一模一樣。"]
    },
    "err.fontMissing": {
      en: ["The font {font} is not installed, so a fallback face is being drawn. Install {font}, or pick another family in Appearance.", "The font {font} is not installed, so a fallback face is being drawn in its place. Install {font}, or pick another family in Appearance.", "The font {font} is not on this machine, so a fallback face is being drawn. Install {font}, or pick another family in Appearance.", "The font {font} is nowhere on this machine, so a fallback face is standing in. Install {font}, or pick another family in Appearance.", "The font {font} is nowhere on this machine, so a stunt double is standing in. Install {font}, or pick another family in Appearance."],
      yue: ["字型 {font} 未安裝，所以而家用緊後備字型。請安裝 {font}，或者喺 Appearance 揀第隻字型。", "字型 {font} 未安裝，所以而家用後備字型頂住。請安裝 {font}，或者喺 Appearance 揀另一隻字型。", "部機冇 {font} 呢隻字型，而家用緊後備嗰隻。裝返 {font}，或者喺 Appearance 揀第隻。", "成部機都搵唔到 {font}，而家搵咗個替工頂住。裝返 {font}，或者喺 Appearance 揀第隻。", "成部機都搵唔到 {font}，而家搵咗個替身頂住檔。裝返 {font}，或者喺 Appearance 揀第隻。"]
    },
    "err.exportFailed": {
      en: ["The export to {path} failed: {message}. Nothing was written.", "The export to {path} failed: {message}. Nothing was saved.", "Exporting to {path} failed: {message}. Nothing was written.", "The export to {path} fell over: {message}. Nothing was written.", "The export to {path} fell over on the doorstep: {message}. Nothing was written."],
      yue: ["匯出去 {path} 失敗：{message}。乜都冇寫到。", "匯出去 {path} 失敗：{message}。乜都冇儲存到。", "export 去 {path} 失敗：{message}。乜都冇寫到。", "export 去 {path} 仆咗街：{message}。乜都冇寫到。", "export 去 {path} 喺門口位仆咗街：{message}。乜都冇寫到。"]
    },
    "err.authExpired": {
      en: ["The credentials for {account} expired on {date}. Sign in again from Health.", "The credentials for {account} expired on {date}. Please sign in again from Health.", "The credentials for {account} ran out on {date}. Sign in again from Health.", "The credentials for {account} ran out on {date} and Codex noticed. Sign in again from Health.", "The credentials for {account} ran out on {date}, and Codex noticed immediately. Sign in again from Health."],
      yue: ["{account} 嘅憑證喺 {date} 過期。請喺 Health 度重新登入。", "{account} 嘅憑證已經喺 {date} 過期。請去 Health 度重新登入。", "{account} 嘅憑證喺 {date} 到期咗。喺 Health 度重新登入。", "{account} 嘅憑證喺 {date} 到期，Codex 一眼就睇穿。喺 Health 度重新登入。", "{account} 嘅憑證喺 {date} 到期，Codex 即刻就發現咗。喺 Health 度重新登入。"]
    },
    "err.diskFull": {
      en: ["There is not enough free space to write {path}. Free some space on that drive, then try again.", "There is not enough free space on that drive to write {path}. Free some space, then try again.", "There is no room left to write {path}. Free some space on that drive, then try again.", "There is no room left to write {path} — the drive is full. Free some space, then try again.", "There is no room left to write {path}; that drive is stuffed. Free some space, then try again."],
      yue: ["空間唔夠，寫唔到 {path}。請喺嗰隻碟清返啲空間，然後再試。", "嗰隻碟嘅剩餘空間唔夠，寫唔到 {path}。請清返啲空間，然後再試。", "冇位寫 {path}。喺嗰隻碟清返啲空間，然後再試。", "冇位寫 {path} — 隻碟爆咗。清返啲空間，然後再試。", "冇位寫 {path}；隻碟塞到滿瀉。清返啲空間，然後再試。"]
    },
    "err.unknown": {
      en: ["Something failed and only said: {message}. The details are in the notification centre.", "Something failed and said only: {message}. The details are in the notification centre.", "Something failed with nothing but: {message}. The details are in the notification centre.", "Something failed and would only mutter: {message}. The details are in the notification centre.", "Something failed and would only mutter {message} before wandering off. The details are in the notification centre."],
      yue: ["有嘢出錯，佢淨係講咗一句：{message}。詳情喺通知中心度。", "有嘢出錯，佢淨係話咗一句：{message}。詳情喺通知中心度。", "有嘢出錯，得返一句：{message}。詳情喺通知中心度。", "有嘢出錯，佢細細聲咕嚕咗句：{message}。詳情喺通知中心度。", "有嘢出錯，咕嚕咗句 {message} 就行開咗。詳情喺通知中心度。"]
    },
    /* ---- errors: the voice moves, the fact never does. Every level below names
       the same path, the same count and the same failure text, because a warning
       nobody can act on is a broken warning rather than a funny one. ---- */
    "err.state": {
      en: ["Could not read the Codex state: {detail}", "Could not read the current Codex state: {detail}", "Could not read the Codex state — {detail}", "Could not read the Codex state. It said: {detail}", "Could not read the Codex state. Its exact words: {detail}"],
      yue: ["讀唔到 Codex 嘅狀態：{detail}", "讀唔到 Codex 目前嘅狀態：{detail}", "讀唔到 Codex 狀態 — {detail}", "讀唔到 Codex 狀態，佢話：{detail}", "讀唔到 Codex 狀態，佢原句咁講：{detail}"]
    },
    "err.version": {
      en: ["Could not run the codex binary: {detail}", "Could not start the codex binary: {detail}", "Could not run `codex` — {detail}", "Could not run `codex`. It said: {detail}", "Could not run `codex`. Is it installed? It said: {detail}"],
      yue: ["行唔到 codex：{detail}", "啟動唔到 codex：{detail}", "行唔到 `codex` — {detail}", "行唔到 `codex`，佢話：{detail}", "行唔到 `codex`，裝咗未呀？佢話：{detail}"]
    },
    "err.section": {
      en: ["The {section} list could not be read.", "The {section} list could not be read just now.", "Could not read the {section} list.", "Could not read the {section} list — so it is empty here, not on your machine.", "Could not read the {section} list. It looks empty here, but that is this panel failing, not your machine being tidy."],
      yue: ["讀唔到 {section} 個清單。", "而家讀唔到 {section} 個清單。", "讀唔到 {section} 清單。", "讀唔到 {section} 清單 — 所以呢度空咗，唔係你部機真係冇。", "讀唔到 {section} 清單。呢度睇落空空如也，但係呢版壞咗嗻，唔係你部機咁乾淨。"]
    },
    "err.history": {
      en: ["The history could not be written: {detail}", "The history entry could not be written: {detail}", "Could not write the history — {detail}", "Could not write the history. Your change stands; the undo entry does not: {detail}", "Could not write the history. Your change went through fine — it just will not have an undo entry: {detail}"],
      yue: ["寫唔到歷史紀錄：{detail}", "寫唔到呢筆歷史紀錄：{detail}", "寫唔到歷史紀錄 — {detail}", "寫唔到歷史紀錄。你改嘅嘢照生效，但係冇得 undo：{detail}", "寫唔到歷史紀錄。你改嗰下係成功咗嘅，只係冇留低個 undo 位：{detail}"]
    },
    "err.wsl": {
      en: ["WSL could not be reached: {detail}", "WSL could not be reached on this machine: {detail}", "Could not reach WSL — {detail}", "Could not reach WSL. Installed? It said: {detail}", "Could not reach WSL. Either it is not installed or it is sulking: {detail}"],
      yue: ["搵唔到 WSL：{detail}", "呢部機連唔到 WSL：{detail}", "搵唔到 WSL — {detail}", "搵唔到 WSL，裝咗未？佢話：{detail}", "搵唔到 WSL。可能未裝，可能佢扭計：{detail}"]
    },
    "err.fonts": {
      en: ["The installed fonts could not be listed: {detail}", "The fonts installed on this machine could not be listed: {detail}", "Could not list the installed fonts — {detail}", "Could not list your installed fonts. It said: {detail}", "Could not list your installed fonts, so you get the bundled five. It said: {detail}"],
      yue: ["讀唔到你部機裝咗嘅字體：{detail}", "讀唔到你部機裝咗嘅字體清單：{detail}", "列唔到啲字體 — {detail}", "讀唔到你部機啲字體，佢話：{detail}", "讀唔到你部機啲字體，所以淨係得打包嗰五隻。佢話：{detail}"]
    },
    "config.written": {
      en: ["Wrote {count} settings to {path}.", "Saved {count} settings to {path}.", "Wrote {count} settings into {path}.", "Wrote {count} settings into {path} — everything else in it is untouched.", "Wrote {count} settings into {path}. Everything else in that file is exactly where you left it."],
      yue: ["寫咗 {count} 個設定入 {path}。", "已經儲存咗 {count} 個設定入 {path}。", "{count} 個設定寫咗入 {path}。", "{count} 個設定寫咗入 {path} —— 入面其他嘢一律冇郁過。", "{count} 個設定寫咗入 {path}。份檔入面其他嘢，你點擺佢就仲喺度。"]
    },
    "config.nothingToWrite": {
      en: ["This profile has no overrides to write.", "This profile has no overrides, so there is nothing to write.", "Nothing to write — this profile overrides nothing.", "Nothing to write: this profile overrides nothing yet.", "Nothing to write. This profile overrides nothing, so the file stays as it is."],
      yue: ["呢個 profile 冇嘢要寫。", "呢個 profile 冇任何 override，所以冇嘢要寫。", "冇嘢寫 —— 呢個 profile 咩都冇改。", "冇嘢寫，呢個 profile 暫時乜都冇 override。", "冇嘢寫。呢個 profile 咩都冇改，份檔照舊。"]
    },
    "err.configWrite": {
      en: ["The settings could not be written: {detail}", "The settings could not be saved: {detail}", "Could not write the settings — {detail}", "Could not write the settings. It said: {detail}", "Could not write the settings. Nothing after the failure was applied. It said: {detail}"],
      yue: ["寫唔到啲設定：{detail}", "儲存唔到啲設定：{detail}", "寫唔到設定 — {detail}", "寫唔到設定，佢話：{detail}", "寫唔到設定，出事之後嗰啲一個都冇寫入。佢話：{detail}"]
    },
    "warn.configPartial": {
      en: ["{count} settings were written before it stopped: {keys}", "{count} settings were already written before it stopped: {keys}", "{count} settings landed before it stopped — {keys}", "{count} settings landed before it stopped. These are in the file: {keys}", "{count} settings landed before it gave up. These are in the file, the rest are not: {keys}"],
      yue: ["停之前寫咗 {count} 個設定：{keys}", "停低之前已經寫咗 {count} 個設定：{keys}", "停之前有 {count} 個寫咗入去 — {keys}", "停之前有 {count} 個入咗檔：{keys}", "佢放棄之前有 {count} 個入咗檔，其餘冇：{keys}"]
    },
    "err.editor": {
      en: ["The editor could not be opened: {detail}", "The external editor could not be opened: {detail}", "Could not open the editor — {detail}", "Could not open the editor. It said: {detail}", "Could not open the editor. It said, and I quote: {detail}"],
      yue: ["開唔到編輯器：{detail}", "開唔到外部編輯器：{detail}", "開唔到編輯器 — {detail}", "開唔到編輯器，佢話：{detail}", "開唔到編輯器，佢原句係咁：{detail}"]
    },
    "err.bulkclose": {
      en: ["No tabs were closed: {detail}", "None of the tabs were closed: {detail}", "Nothing was closed — {detail}", "Nothing was closed. Reason: {detail}", "Nothing was closed, which is the safe outcome. Reason: {detail}"],
      yue: ["冇閂到任何 tab：{detail}", "所有 tab 都冇閂到：{detail}", "咩都冇閂到 — {detail}", "咩都冇閂到，原因：{detail}", "咩都冇閂到 — 咁樣至安全。原因：{detail}"]
    },
    "err.config": {
      en: ["{path} does not parse: {detail}", "{path} could not be parsed: {detail}", "{path} does not parse — {detail}", "{path} will not parse. Nothing was written. It said: {detail}", "{path} will not parse, so nothing was written and your old file is untouched. It said: {detail}"],
      yue: ["{path} 解析唔到：{detail}", "份 {path} 解析唔到：{detail}", "{path} 解析唔到 — {detail}", "{path} 解析唔到，所以乜都冇寫入。佢話：{detail}", "{path} 解析唔到，所以乜都冇寫入，你原本份檔一條毛都冇郁。佢話：{detail}"]
    },
    "err.notFound": {
      en: ["{path} does not exist.", "{path} could not be found.", "{path} does not exist.", "{path} is not there.", "{path} is not there — nothing at that path at all."],
      yue: ["{path} 唔存在。", "搵唔到 {path} 呢個路徑。", "{path} 唔存在。", "{path} 搵唔到。", "{path} 搵唔到 — 嗰個位置乜都冇。"]
    },

    /* ---- warnings ---- */
    "warn.yolo": {
      en: ["YOLO mode is on: approvals and the sandbox are disabled for {profile}, and it survives a restart.", "YOLO mode is on: approvals and the sandbox are disabled for {profile}, and it stays on after a restart.", "YOLO is on — approvals off, sandbox off on {profile}. It survives a restart.", "YOLO is on. Approvals off, sandbox off on {profile}, and it survives a restart.", "YOLO is on. No approvals, no sandbox, on {profile} — and it survives a restart, so it is on until you say otherwise."],
      yue: ["YOLO 開咗：{profile} 冇審批、冇沙盒，重開都仲係咁。", "YOLO 模式開咗：{profile} 冇審批、冇沙盒，重開之後都仲係開住。", "YOLO 開咗 — {profile} 冇審批冇沙盒，重開都仲係咁。", "YOLO 開咗。{profile} 冇審批冇沙盒，重開機都照舊。", "YOLO 開咗。{profile} 冇審批、冇沙盒，重開機都仲係咁 — 你唔閂佢就一路開住。"]
    },
    "warn.untrustedHook": {
      en: ["{name} is untrusted and never runs. Trust it in config.toml first.", "{name} is untrusted and will never run. Trust it in config.toml first.", "{name} is untrusted, so it never runs. Trust it in config.toml first.", "{name} is untrusted, so it never runs — trust it in config.toml first.", "{name} is untrusted, so it never runs no matter what this switch says. Trust it in config.toml first."],
      yue: ["{name} 未信任，永遠唔會行。要先喺 config.toml 信任佢。", "{name} 未經信任，永遠唔會執行。要先喺 config.toml 信任佢。", "{name} 未信任，所以點都唔會行。要先喺 config.toml 信任佢。", "{name} 未信任，所以點都唔會行 — 去 config.toml 信任咗佢先。", "{name} 未信任，你撳幾多下呢個掣都唔會行。去 config.toml 信任咗佢先啦。"]
    },
    "warn.bulkClose": {
      en: ["This will close {count} tabs.", "This will close {count} open tabs.", "This closes {count} tabs.", "This closes {count} tabs — check the list below first.", "This closes {count} tabs. Have a look at the list below before you commit."],
      yue: ["咁樣會閂 {count} 個 tab。", "咁樣會閂 {count} 個開緊嘅 tab。", "咁樣會閂 {count} 個 tab。", "咁樣會閂 {count} 個 tab — 撳之前睇下下面個清單。", "咁樣會閂 {count} 個 tab。撳落去之前，望多眼下面個清單啦。"]
    },
    "warn.restore": {
      en: ["Restoring {label} replaces the current state. It is recorded as a new revision, so it is undoable.", "Restoring {label} replaces the current state. It is recorded as a new revision, so you can undo it.", "Restoring {label} replaces what you have now — recorded as a new revision, so it is undoable.", "Restoring {label} replaces what you have now. It becomes a new revision, so you can undo the undo.", "Restoring {label} replaces what you have now — but it lands as a new revision, so you can undo the undo, and the undo of that."],
      yue: ["還原 {label} 會蓋咗而家嘅狀態。佢會記做新一版，所以仲 undo 得返。", "還原 {label} 會蓋過而家嘅狀態。佢會記錄做新一版，所以你可以 undo 返。", "還原 {label} 會蓋咗你而家嘅嘢 — 記做新一版，所以 undo 得返。", "還原 {label} 會蓋咗你而家嘅嘢，但會記做新一版，所以 undo 完仲可以 undo 返。", "還原 {label} 會蓋咗你而家嘅嘢，不過佢會記做新一版 — undo 完可以再 undo，再 undo 都得。"]
    },

    /* ---- confirmations: the only copy that gets a blocking dialog ---- */
    "confirm.deleteSession": {
      en: ["Delete the session {name}?", "Delete session {name}?", "Delete the session {name}?", "Delete {name}? It goes from disk, not just from this list.", "Delete {name}? It leaves the disk, not just this list — though History keeps an undo."],
      yue: ["刪除 {name} 呢個 session？", "刪除 session {name}？", "刪咗 {name} 呢個 session？", "刪咗 {name}？佢會由硬碟度消失，唔淨止喺呢個清單度。", "刪咗 {name}？佢係真係走出硬碟，唔淨止喺呢個清單度 — 不過 History 度仲有得 undo。"]
    },
    "confirm.removeMcp": {
      en: ["Remove the MCP server {name} from config.toml?", "Remove the MCP server {name} from your config.toml?", "Remove the MCP server {name} from config.toml?", "Remove {name} from config.toml? The file is backed up first.", "Remove {name} from config.toml? Your old file is copied beside it first, so this is recoverable."],
      yue: ["由 config.toml 移除 MCP server {name}？", "喺你嘅 config.toml 度移除 MCP server {name}？", "由 config.toml 剷走 MCP server {name}？", "剷走 {name}？寫入前會先備份份 config.toml。", "剷走 {name}？寫入前會喺隔籬 copy 一份舊 config.toml，救得返嘅。"]
    },
    "confirm.uninstall": {
      en: ["Uninstall the plugin {name}?", "Uninstall the plugin {name} now?", "Uninstall the plugin {name}?", "Uninstall {name}? You can reinstall it from the marketplace.", "Uninstall {name}? The marketplace will still have it if you change your mind."],
      yue: ["解除安裝外掛 {name}？", "而家解除安裝外掛 {name}？", "移除外掛 {name}？", "移除 {name}？想要返可以去 marketplace 再裝。", "移除 {name}？後悔嘅話 marketplace 度仲有得再裝返。"]
    },
    "confirm.prune": {
      en: ["Prune the history to the newest {keep} revisions?", "Prune the history to keep only the newest {keep} revisions?", "Prune the history down to the newest {keep} revisions?", "Prune down to the newest {keep} revisions? Older ones are gone for good.", "Prune down to the newest {keep} revisions? Everything older is gone for good — this one really is not undoable."],
      yue: ["淨係保留最新 {keep} 版歷史？", "歷史紀錄淨係保留最新 {keep} 版？", "剪到淨返最新 {keep} 版歷史？", "剪到淨返最新 {keep} 版？舊過嗰啲永久消失。", "剪到淨返最新 {keep} 版？舊過嗰啲永久消失 — 呢單真係 undo 唔到。"]
    },

    /* ---- tab strip ---- */
    "tab.strip": {
      en: ["Open tabs", "Open tabs", "Open tabs", "Your open tabs", "Every tab you have going"],
      yue: ["開咗嘅 tab", "開咗嘅 tab", "你開緊嘅 tab", "你開緊嘅 tab", "你而家開晒嘅 tab"]
    },
    "tab.untitled": {
      en: ["New tab", "New tab", "New tab", "A fresh tab", "A brand new empty tab"],
      yue: ["新 tab", "新 tab", "新 tab", "開個新 tab", "全新一個吉 tab"]
    },
    "tab.overflow": {
      en: ["{count} tabs do not fit on the strip", "{count} tabs will not fit on the strip", "{count} tabs do not fit — they are in here", "{count} tabs did not fit — they are hiding in here", "{count} tabs did not fit on the strip and are hiding in here"],
      yue: ["有 {count} 個 tab 塞唔落條 strip", "有 {count} 個 tab 喺 tab 列度容納唔落", "有 {count} 個 tab 塞唔落 — 收埋咗喺呢度", "有 {count} 個 tab 塞唔落，匿埋咗喺呢度", "有 {count} 個 tab 塞唔落條 strip，匿晒喺呢度等你"]
    },
    "tab.noOverflow": {
      en: ["Every tab fits on the strip.", "All tabs fit on the strip.", "Every tab fits.", "Everything fits — nothing hidden.", "Everything fits. Nothing hiding anywhere."],
      yue: ["全部 tab 都放得落。", "全部 tab 都放得落條 strip。", "全部都放得落。", "全部放得落 — 冇嘢匿埋。", "全部放得落，冇一個匿埋。"]
    },
    "tab.searchHint": {
      en: ["Find a tab, a group, or every tab everywhere", "Find a tab, a group, or every tab in every workspace", "Find a tab, a group, or every tab everywhere", "Find a tab, a group, or sweep every workspace", "Find a tab, find a group, or sweep every workspace at once"],
      yue: ["搵 tab、搵 group，或者搵勻所有地方", "搵 tab、搵 group，或者搵勻所有 workspace", "搵 tab、搵 group，或者全部一次過搵", "搵 tab、搵 group，或者掃勻晒所有 workspace", "搵 tab、搵 group，定係一次過掃勻晒所有 workspace"]
    },
    "tab.noGroups": {
      en: ["There are no tab groups yet.", "No tab groups have been created yet.", "No tab groups yet.", "No groups yet — right-click a tab to make one.", "No groups yet. Right-click any tab and make one."],
      yue: ["仲未有任何 tab group。", "仲未建立過任何 tab group。", "未有 group。", "未有 group — 右 click 個 tab 就可以開。", "未有 group。右 click 個 tab 就開到㗎喇。"]
    },
    "tab.closed": {
      en: ["Closed {name}", "Closed {name}", "Closed {name}", "Closed {name}", "Closed {name} — undo below if that was a mistake"],
      yue: ["閂咗 {name}", "閂咗 {name}", "閂咗 {name}", "閂咗 {name}", "閂咗 {name} — 撳錯咗就撳下面 undo"]
    },
    "tab.closeContaining": {
      en: ["Close tabs containing text", "Close tabs whose name contains text", "Close tabs containing text", "Close every tab containing text", "Close every tab whose name contains your text"],
      yue: ["閂晒名有呢啲字嘅 tab", "閂晒名入面有呢啲字嘅 tab", "閂晒名有呢啲字嘅 tab", "閂晒所有名入面有呢啲字嘅 tab", "見到名有呢啲字嘅 tab，一次過閂晒"]
    },
    "tab.closeNotContaining": {
      en: ["Close tabs NOT containing text", "Close tabs whose name does NOT contain text", "Close tabs NOT containing text", "Close every tab that does not contain your text", "Keep the matches, close everything else"],
      yue: ["閂晒名冇呢啲字嘅 tab", "閂晒名入面冇呢啲字嘅 tab", "閂晒名冇呢啲字嘅 tab", "閂晒所有名入面冇呢啲字嘅 tab", "夾到嘅留低，其餘全部閂晒"]
    },
    "tab.bulkSummary": {
      en: ["{count} of {total} tabs match, using {mode} matching.", "Matched {count} of {total} tabs, using {mode} matching.", "{count} of {total} tabs match ({mode}).", "{count} of {total} tabs match — {mode} matching, names only.", "{count} of {total} tabs match with {mode} matching. Names only — nothing reads inside a tab."],
      yue: ["{total} 個 tab 之中夾到 {count} 個，用緊 {mode} 比對。", "{total} 個 tab 入面夾到 {count} 個，用緊 {mode} 比對。", "{total} 個入面夾到 {count} 個（{mode}）。", "{total} 個入面夾到 {count} 個 — {mode} 比對，淨係睇個名。", "{total} 個入面夾到 {count} 個，用 {mode} 比對。淨係睇個名 — 唔會偷睇 tab 入面啲嘢。"]
    },
    "tab.bulkNeedsQuery": {
      en: ["Enter text to match. An empty query closes nothing.", "Enter some text to match. An empty query closes nothing.", "Type something to match — an empty query closes nothing.", "Type something first. An empty query closes nothing, on purpose.", "Type something first. An empty query closes nothing, and that is deliberate."],
      yue: ["打啲字先。空白嘅話咩都唔會閂。", "請先打啲字。空白嘅話咩都唔會閂。", "打啲字先 — 空白嘅話咩都唔會閂。", "打啲字先啦。空白就咩都唔閂，特登咁設計。", "打啲字先啦。空白就咩都唔閂 — 特登咁設計，唔係壞咗。"]
    },
    "tab.bulkPlaceholder": {
      en: ["Text to match against tab names", "Text to look for in tab names", "Text to match against tab names", "What should the tab name contain?", "What should the tab name contain?"],
      yue: ["用嚟夾 tab 名嘅字", "喺 tab 名入面要搵嘅字", "用嚟夾 tab 名嘅字", "個 tab 名要有咩字？", "個 tab 名要有咩字？"]
    },
    "tab.matchNormal": {
      en: ["Matching: contains", "Matching: contains", "Matching: contains",
        "Matching: names that contain it", "Matching: names that contain it"],
      yue: ["比對：包含", "比對：包含", "比對：包含", "比對：個名有呢啲字", "比對：個名有呢啲字"]
    },
    "tab.matchInverted": {
      en: ["Matching: does NOT contain", "Matching: name does NOT contain", "Matching: does NOT contain", "Matching: names that do NOT contain it", "Matching: names that do NOT contain it"],
      yue: ["比對：唔包含", "比對：個名唔包含", "比對：唔包含", "比對：個名冇呢啲字", "比對：個名冇呢啲字"]
    },
    "tab.pinnedProtected": {
      en: ["Pinned tabs are protected", "Pinned tabs stay protected", "Pinned tabs are protected", "Pinned tabs are protected from this", "Pinned tabs sit this one out"],
      yue: ["釘住嘅 tab 受保護", "釘住嘅 tab 一律受保護", "釘住嘅 tab 受保護", "釘住嘅 tab 唔會受影響", "釘住嘅 tab 今次唔關佢事"]
    },
    "tab.pinnedIncluded": {
      en: ["Pinned tabs WILL be closed", "Pinned tabs WILL be closed as well", "Pinned tabs WILL be closed", "Pinned tabs will be closed too", "Pinned tabs are going too — you asked for it"],
      yue: ["連釘住嘅 tab 都會閂", "連釘住嘅 tab 都一樣會閂", "連釘住嘅 tab 都會閂", "釘住嗰啲都會一齊閂", "釘住嗰啲都照閂 — 你話要嘅"]
    },
    "tab.protected": {
      en: ["pinned — kept", "pinned — kept", "pinned — kept", "pinned, so it stays", "pinned, so it stays put"],
      yue: ["釘住 — 留低", "釘住 — 留低", "釘住 — 留低", "釘住咗，唔郁佢", "釘住咗，穩陣留低"]
    },
    "tab.unsaved": {
      en: ["unsaved work", "unsaved work", "unsaved work", "has unsaved work", "has unsaved work in it"],
      yue: ["有嘢未存", "有嘢未存", "有嘢未存", "入面有嘢未 save", "入面有嘢未 save 㗎"]
    },
    "tab.bulkApply": {
      en: ["Close {count} tabs", "Close {count} tabs", "Close {count} tabs", "Close {count} tabs", "Close all {count} of them"],
      yue: ["閂 {count} 個 tab", "閂 {count} 個 tab", "閂 {count} 個 tab", "閂 {count} 個 tab", "全部 {count} 個閂晒佢"]
    },
    "tab.bulkNothing": {
      en: ["Nothing to close", "Nothing to close", "Nothing to close", "Nothing to close", "Nothing to close"],
      yue: ["冇嘢可以閂", "冇嘢可以閂", "冇嘢可以閂", "冇嘢可以閂", "冇嘢可以閂"]
    },
    "tab.bulkClosed": {
      en: ["Closed {count} tabs", "{count} tabs closed", "Closed {count} tabs", "Closed {count} tabs", "Closed {count} tabs — undo below if that was a mistake"],
      yue: ["閂咗 {count} 個 tab", "已閂咗 {count} 個 tab", "閂咗 {count} 個 tab", "閂咗 {count} 個 tab", "閂咗 {count} 個 tab — 手快撳錯就撳下面 undo"]
    },
    "tab.bulkSkipped": {
      en: ["{count} pinned tabs were kept: {names}", "{count} pinned tabs were left open: {names}", "{count} pinned tabs were kept: {names}", "{count} pinned tabs stayed put: {names}", "{count} pinned tabs stayed exactly where they were: {names}"],
      yue: ["有 {count} 個釘住嘅 tab 留低咗：{names}", "有 {count} 個釘住嘅 tab 冇閂：{names}", "有 {count} 個釘住嘅 tab 留低咗：{names}", "有 {count} 個釘住嘅 tab 冇郁過：{names}", "有 {count} 個釘住嘅 tab 原封不動咁留喺度：{names}"]
    },

    /* ---- notification centre ---- */
    "notify.dismiss": {
      en: ["Dismiss", "Dismiss", "Dismiss", "Dismiss this", "Shoo it away"],
      yue: ["關閉", "關閉", "收皮", "收咗佢", "揈走佢"]
    },
    "notify.clear": {
      en: ["Clear", "Clear", "Clear", "Clear the list", "Wipe the list"],
      yue: ["清除", "清除", "清走", "清走個清單", "全部清走佢"]
    },
    "notify.empty": {
      en: ["Nothing has been notified yet.", "No notifications have arrived yet.", "Nothing here yet.", "Nothing here yet — a quiet session.", "Nothing here yet. Suspiciously quiet, honestly."],
      yue: ["未有任何通知。", "暫時未有任何通知。", "呢度未有嘢。", "呢度未有嘢 — 今次好靜。", "呢度未有嘢，靜到有啲可疑。"]
    },

    /* ---- search ---- */
    "search.builder": {
      en: ["Open the regex builder for this search", "Open the regex builder for this search field", "Open the regex builder for this search", "Build a pattern for this search", "Build a proper pattern for this search"],
      yue: ["開呢個搜尋嘅 regex 產生器", "開呢個搜尋格嘅 regex 產生器", "開呢個搜尋嘅 regex 產生器", "幫呢個搜尋砌個 pattern", "幫呢個搜尋砌條靚 pattern"]
    },

    /* ---- settings ---- */
    "settings.search": {
      en: ["Search every setting on this page", "Search all the settings on this page", "Search every setting here", "Search every setting here", "Type a setting name — it is in here somewhere"],
      yue: ["搵呢版所有設定", "搵呢一版嘅所有設定", "搵呢度所有設定", "搵呢度所有設定", "打個設定名 — 一定喺度嘅"]
    },
    "settings.noMatch": {
      en: ["No setting matches {query}.", "No setting here matches {query}.", "No setting matches {query}.", "Nothing matches {query} on this page.", "Nothing on this page matches {query}."],
      yue: ["冇設定夾到 {query}。", "呢版冇設定夾到 {query}。", "冇設定夾到 {query}。", "呢版度冇嘢夾到 {query}。", "呢版度搵唔到夾 {query} 嘅嘢。"]
    },

    /* ---- changelog viewer ---- */
    "changelog.search": {
      en: ["Search the changelog", "Search the changelog entries", "Search the changelog", "Search every release note", "Search every release note ever written"],
      yue: ["搵 changelog", "搵 changelog 入面嘅紀錄", "搵 changelog", "搵勻所有版本紀錄", "搵勻由頭到尾所有版本紀錄"]
    },
    "changelog.from": {
      en: ["From (yyyy-mm-dd)", "From (yyyy-mm-dd)", "From (yyyy-mm-dd)", "From — yyyy-mm-dd", "From — yyyy-mm-dd"],
      yue: ["由 (yyyy-mm-dd)", "由 (yyyy-mm-dd)", "由 (yyyy-mm-dd)", "由邊日 — yyyy-mm-dd", "由邊日開始 — yyyy-mm-dd"]
    },
    "changelog.to": {
      en: ["To (yyyy-mm-dd)", "To (yyyy-mm-dd)", "To (yyyy-mm-dd)", "To — yyyy-mm-dd", "To — yyyy-mm-dd"],
      yue: ["到 (yyyy-mm-dd)", "到 (yyyy-mm-dd)", "到 (yyyy-mm-dd)", "到邊日 — yyyy-mm-dd", "去到邊日 — yyyy-mm-dd"]
    },
    "changelog.badDate": {
      en: ["{value} is not a date yet. Your text is kept.", "{value} is not a date yet. What you typed is kept.", "{value} is not a date yet — your text is kept.", "{value} is not a date yet. Nothing was thrown away.", "{value} is not a date yet. Keep typing — nothing was thrown away."],
      yue: ["{value} 仲未係一個日期。你打嘅字冇被刪。", "{value} 仲未係一個日期。你打嘅字仍然保留。", "{value} 仲未係日期 — 你打嘅字冇被刪。", "{value} 仲未係日期，你打嗰啲一個字都冇冇咗。", "{value} 仲未係日期，慢慢打 — 你打嗰啲一個字都冇冇咗。"]
    },
    "changelog.status": {
      en: ["{versions} versions, {matches} matching entries.", "{versions} versions, with {matches} matching entries.", "{versions} versions · {matches} matching entries.", "{versions} versions, {matches} entries matched.", "{versions} versions and {matches} entries made the cut."],
      yue: ["{versions} 個版本，{matches} 條夾到。", "{versions} 個版本，其中 {matches} 條夾到。", "{versions} 個版本 · {matches} 條夾到。", "{versions} 個版本，夾到 {matches} 條。", "{versions} 個版本，夾到 {matches} 條入圍。"]
    },
    "changelog.entries": {
      en: ["{count} entries", "{count} entries", "{count} entries", "{count} entries", "{count} entries"],
      yue: ["{count} 條", "{count} 條", "{count} 條", "{count} 條", "{count} 條"]
    },
    "changelog.noDate": {
      en: ["no date recorded", "no date recorded", "no date recorded", "no date recorded", "no date recorded"],
      yue: ["冇記低日期", "冇記低日期", "冇記低日期", "冇記低日期", "冇記低日期"]
    },
    "changelog.calendar": {
      en: ["Pick a date from a calendar", "Choose a date from a calendar", "Pick a date from a calendar", "Pick it from a calendar instead", "Pick it from a calendar if counting days is not your idea of fun"],
      yue: ["用月曆揀日期", "喺月曆度揀日期", "用月曆揀", "唔想打字就用月曆揀", "唔想自己數日就用月曆揀啦"]
    },
    "changelog.calFrom": {
      en: ["Start date", "Start date", "Start date", "Which day does the range start?", "Which day does the range start?"],
      yue: ["開始日期", "開始日期", "由邊日開始", "個範圍由邊日開始？", "個範圍由邊日開始？"]
    },
    "changelog.calTo": {
      en: ["End date", "End date", "End date", "Which day does the range end?", "Which day does the range end?"],
      yue: ["結束日期", "結束日期", "去到邊日", "個範圍去到邊日？", "個範圍去到邊日？"]
    },
    "changelog.calHint": {
      en: ["Typing in the field works too; the two stay in step.", "Typing in the field works too, and the two stay in step.", "You can type in the field instead — the two stay in step.", "Typing in the field works just as well. Neither one clears the other.", "Type it if you prefer. Neither one clears the other, so pick whichever you like."],
      yue: ["直接喺格仔打都得，兩邊會同步。", "直接喺格仔打都得，兩邊一樣會同步。", "你想打字都得 —— 兩邊會同步。", "喺格仔度打都一樣得，兩邊唔會互相清走對方。", "鍾意打字就打字，兩邊唔會互相清走對方，用邊個都得。"]
    },
    "changelog.calJump": {
      en: ["Jump to a month", "Jump to a month", "Jump to a month", "Jump straight to a month", "Jump straight to a month"],
      yue: ["跳去某個月", "跳去某個月", "跳去邊個月", "直接跳去某個月", "直接跳去某個月"]
    },
    "changelog.calPrevMonth": {
      en: ["Previous month", "Previous month", "Previous month", "Previous month", "Previous month"],
      yue: ["上個月", "上個月", "上個月", "上個月", "上個月"]
    },
    "changelog.calNextMonth": {
      en: ["Next month", "Next month", "Next month", "Next month", "Next month"],
      yue: ["下個月", "下個月", "下個月", "下個月", "下個月"]
    },
    "changelog.calPrevYear": {
      en: ["Previous year", "Previous year", "Previous year", "Previous year", "Previous year"],
      yue: ["上一年", "上一年", "上一年", "上一年", "上一年"]
    },
    "changelog.calNextYear": {
      en: ["Next year", "Next year", "Next year", "Next year", "Next year"],
      yue: ["下一年", "下一年", "下一年", "下一年", "下一年"]
    },
    "changelog.calToday": {
      en: ["Today", "Today", "Today", "Back to today", "Back to today"],
      yue: ["今日", "今日", "今日", "返去今日", "返去今日"]
    },
    "changelog.calClear": {
      en: ["Clear this date", "Clear this date", "Clear this date", "Clear just this date", "Clear just this one"],
      yue: ["清走呢個日期", "清走呢個日期", "清走呢個", "淨係清走呢個日期", "淨係清走呢個"]
    },
    "changelog.export": {
      en: ["Export", "Export", "Export", "Export what I see", "Export exactly what I see"],
      yue: ["匯出", "匯出", "匯出", "匯出我睇緊嗰啲", "睇到咩就匯出咩"]
    },
    "changelog.exported": {
      en: ["Exported the filtered view.", "Exported the filtered view to a file.", "Exported the filtered view.", "Exported — the file matches what is on screen.", "Exported. The file says exactly what the screen says."],
      yue: ["已匯出篩選後嘅內容。", "已將篩選後嘅內容匯出成檔案。", "匯出咗篩選後嘅內容。", "匯出咗 — 份檔同你螢幕見到嘅一模一樣。", "匯出咗。份檔同你螢幕見到嘅一個字都唔差。"]
    },
    "changelog.copied": {
      en: ["Copied the filtered view.", "Copied the filtered view to the clipboard.", "Copied the filtered view.", "Copied — it matches what is on screen.", "Copied. It matches the screen exactly."],
      yue: ["已複製篩選後嘅內容。", "已將篩選後嘅內容複製到剪貼簿。", "copy 咗篩選後嘅內容。", "copy 咗 — 同螢幕見到嘅一樣。", "copy 咗，同螢幕見到嘅一個字都唔差。"]
    },
    "changelog.empty": {
      en: ["No release matches this filter.", "No release matches the current filter.", "No release matches this filter.", "No release matches — try widening the dates.", "No release matches. Try widening the dates or clearing the search."],
      yue: ["冇版本夾到呢個篩選。", "冇版本夾到目前嘅篩選。", "冇版本夾到呢個篩選。", "冇版本夾到 — 試下放寬個日期。", "冇版本夾到。試下放寬個日期，或者清走個搜尋。"]
    },
    "changelog.loading": {
      en: ["Reading CHANGELOG.md…", "Reading CHANGELOG.md, one moment…", "Reading CHANGELOG.md…", "Reading CHANGELOG.md…", "Reading CHANGELOG.md…"],
      yue: ["讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md，請稍候…", "讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md…"]
    },
    "changelog.unavailable": {
      en: ["The changelog engine is not loaded.", "The changelog engine has not loaded.", "The changelog engine is not loaded.", "The changelog engine did not load.", "The changelog engine did not load — cx-changelog.js is missing from this build."],
      yue: ["Changelog 引擎未載入。", "Changelog 引擎仲未載入。", "Changelog 引擎未載入。", "Changelog 引擎載入唔到。", "Changelog 引擎載入唔到 — 呢個 build 冇咗 cx-changelog.js。"]
    },

    /* ---- dim sum surprise: the dish's own name is a fact and never changes ---- */
    "dimsum.greeting": {
      en: ["Today's dim sum: {dish}.", "Today's dim sum is {dish}.", "A little dim sum for you: {dish}.", "Have some {dish} while the agent thinks.", "Yum cha break — {dish}, on the house."],
      yue: ["今日嘅點心：{dish}。", "今日嘅點心係 {dish}。", "請你食件點心：{dish}。", "agent 諗嘢，你食住件 {dish} 先。", "飲啖茶食件 {dish}，唔使畀錢嗰隻。"]
    },

    /* ---- local history ---- */
    /* The transcript's empty state. Level 1 is a plain statement of fact; level 5
       gets to be funny about the silence but still names the profile, the model and
       the command, because a user who cannot tell what will run learns nothing from
       a joke. */
    "chat.emptyTitle": {
      en: ["No messages in this session", "No messages in this session yet", "Nothing here yet", "This session has not said anything yet", "Beautifully, completely empty"],
      yue: ["呢個 session 未有訊息", "呢個 session 暫時未有訊息", "仲未有嘢", "呢個 session 一句都未講過", "空空如也，靚到有啲淒涼"]
    },
    "chat.emptyBody": {
      en: ["Type below to start. Runs as {profile} on {model}.", "Type below to start. It runs as {profile} on {model}.", "Type a message below to start. It runs as {profile} on {model}.", "Say something below and it runs for real — profile {profile}, model {model}.", "Go on, say something. It runs for real as {profile} on {model} — no rehearsal, no undo button hiding in the corner."],
      yue: ["喺下面打字開始。用 {profile}、{model} 執行。", "喺下面打字開始。會用 {profile}、{model} 執行。", "喺下面打段字就開始。會用 {profile}、{model} 幫你行。", "下面講句嘢，佢就真係會行 —— profile 係 {profile}，model 係 {model}。", "講啦，唔使驚。佢係真係會行㗎 —— {profile} 配 {model}，冇綵排，角落頭都冇個 undo 掣等你。"]
    },
    /* Shown when a revision has no snapshot this install can restore — a row from a
       git repository written by a previous install, for instance. The old code
       returned null and did nothing, which on a data-recovery feature is the worst
       possible response. */
    /* The navigation rail, the Extend category list and the window chrome. These were
       hard-coded English literals, so switching to 廣東話 or bilingual left the app's
       primary surface untranslated — the language mode reached the messages and missed
       the furniture. Nav labels stay one or two words at every level because the rail
       is 76px wide and a wrapped label is a layout defect, not a joke. */
                    "nav.studio": {
      en: ["Preferences", "Studio", "Studio", "Your Studio", "Studio Vibes"],
      yue: ["偏好設定", "Studio", "Studio", "你嘅 Studio", "Studio 氣氛"]
    },
    "nav.studio.hint": {
      en: ["Language, funny level, narrator, dim sum surprise, external editor and history retention.", "Language mode, funny level, narrator, dim sum surprise, external editor and history retention.", "Language, funny level, narrator, dim sum, external editor and how long history is kept.", "Language, funny level, narrator, dim sum surprise, external editor and how long history sticks around.", "Language, funny level, narrator, dim sum surprise, external editor and how long history hangs about — the app's whole personality lives here."],
      yue: ["語言、幽默程度、旁白、點心驚喜、外部編輯器同歷史保留期。", "語言模式、幽默程度、旁白、點心驚喜、外部編輯器同歷史保留期。", "語言、幽默程度、旁白、點心、外部編輯器，同歷史留幾耐。", "語言、幽默程度、旁白、點心驚喜、外部編輯器，仲有歷史留幾耐。", "語言、幽默程度、旁白、點心驚喜、外部編輯器同歷史留幾耐 — 成個 app 嘅性格都喺呢度調。"]
    },
    "ext.mcp": {
      en: ["MCP servers", "Your MCP servers", "MCP servers you run", "Your MCP server crew", "The MCP server gang"],
      yue: ["MCP 伺服器", "你嘅 MCP 伺服器", "你行緊嘅 MCP 伺服器", "你嘅 MCP 伺服器班底", "MCP 伺服器天團"]
    },
    "ext.mcp.sub": {
      en: ["External tool servers", "Servers that supply external tools", "Servers that lend Codex extra tools", "Outside servers, lending Codex extra tools", "Outside servers handing Codex extra tools on a plate"],
      yue: ["外部工具伺服器", "提供外部工具嘅伺服器", "借額外工具畀 Codex 用嘅伺服器", "外面嘅伺服器，借啲工具畀 Codex 傍身", "外面嘅伺服器孝敬 Codex，工具任攞"]
    },
    "ext.browse": {
      en: ["Plugin marketplace", "The plugin marketplace", "Plugin shop", "Plugin bazaar", "Plugin shopping spree"],
      yue: ["外掛市集", "外掛市集一覽", "外掛商店", "外掛街市", "外掛掃貨天堂"]
    },
    "ext.browse.sub": {
      en: ["Browse and install plugins", "Browse the marketplace and install plugins", "Browse plugins and install the ones you like", "Window-shop the plugins, install the keepers", "Browse plugins, install the ones you can't live without"],
      yue: ["瀏覽同安裝外掛", "喺市集瀏覽同安裝外掛", "慢慢睇外掛，鍾意邊個就裝邊個", "任你睇外掛，啱心水就㩒個掣裝", "外掛任你睇到眼花，啱心水就裝"]
    },
    "ext.plugins": {
      en: ["Installed plugins", "Your installed plugins", "Plugins you've installed", "Plugins already on board", "Plugins you've let in"],
      yue: ["已安裝外掛", "你已安裝嘅外掛", "你裝咗嘅外掛", "已經上咗船嘅外掛", "畀你請咗入嚟嘅外掛"]
    },
    "ext.plugins.sub": {
      en: ["Enable, disable, remove", "Enable, disable or remove them", "Turn them on, turn them off, or remove them", "Switch one on, switch one off, or remove it for good", "On, off, or removed for good — every plugin, your call"],
      yue: ["啟用、停用、移除", "啟用、停用或者移除佢哋", "開佢、閂佢，唔要就刪咗佢", "開得閂得，唔啱就一鍵刪走", "開、閂、刪走佢，每個外掛都你話事"]
    },
    "ext.marketplaces": {
      en: ["Registries", "Registry list", "Plugin registries", "Plugin supply lines", "Plugin wholesalers"],
      yue: ["註冊庫", "註冊庫清單", "外掛註冊庫", "外掛供應線", "外掛批發商"]
    },
    "ext.marketplaces.sub": {
      en: ["Marketplace sources", "Sources for the plugin marketplace", "The lists Codex pulls plugins from", "The shops Codex fetches its plugins from", "Codex's little black book of plugin shops"],
      yue: ["市集來源", "外掛市集嘅來源", "Codex 攞外掛嘅來源清單", "Codex 幫襯緊邊幾間外掛舖", "Codex 嘅外掛入貨秘笈"]
    },
    "ext.skills": {
      en: ["Skills", "Your skills", "Skills Codex can use", "Codex's skill set", "Codex's bag of skills"],
      yue: ["技能", "你嘅技能", "Codex 用得嘅技能", "Codex 嘅技能組合", "Codex 嘅技能百寶袋"]
    },
    "ext.skills.sub": {
      en: ["SKILL.md entries", "Entries from your SKILL.md files", "Everything your SKILL.md files define", "Whatever your SKILL.md files taught Codex", "SKILL.md files — Codex's cheat sheets"],
      yue: ["SKILL.md 項目", "你 SKILL.md 檔案入面嘅項目", "你 SKILL.md 入面寫低嘅嘢", "你喺 SKILL.md 教過 Codex 嘅嘢", "SKILL.md 就係 Codex 嘅貓紙"]
    },
    "ext.hooks": {
      en: ["Hooks", "Your hooks", "Hooks you've set up", "Your trigger-happy hooks", "Hooks lying in wait"],
      yue: ["掛鈎", "你嘅掛鈎", "你設定咗嘅掛鈎", "一觸即發嘅掛鈎", "埋伏緊嘅掛鈎"]
    },
    "ext.hooks.sub": {
      en: ["Lifecycle hooks", "Hooks that fire on lifecycle events", "Commands that run at set moments", "Your commands, fired at exactly the right moment", "Commands that pounce the moment their cue lands"],
      yue: ["生命週期掛鈎", "喺生命週期事件觸發嘅掛鈎", "喺指定時刻自動行嘅指令", "夠鐘就自動彈出嚟行嘅指令", "時辰一到就撲出嚟嘅指令"]
    },
    "ext.features": {
      en: ["Feature flags", "Codex feature flags", "Feature switches", "Feature toggles, flip away", "Switches begging to be flipped"],
      yue: ["功能旗標", "Codex 功能旗標", "功能開關", "功能開關，任你㩒", "啲開關喺度等你㩒"]
    },
    "chrome.appName": {
      en: ["Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio"],
      yue: ["Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio", "Codex Studio"]
    },
    "chrome.apiEquiv": {
      en: ["API equivalent", "API-equivalent cost", "API-equiv", "API-equiv if you were metered", "API-equiv (the meter you dodged)"],
      yue: ["API 等值", "API 等值成本", "當 API 計", "當 API 收費咁計", "當 API 計（慳返嗰筆）"]
    },
    "chrome.paid": {
      en: ["Paid", "Amount paid", "You paid", "Actually paid", "Paid — out of your pocket"],
      yue: ["已付", "實付金額", "你付咗", "真係俾咗", "已付 — 荷包出嗰啲"]
    },
    "chrome.undo": {
      en: ["Undo", "Undo change", "Undo that", "Take that back", "Undo — never happened"],
      yue: ["復原", "還原改動", "撤返佢", "收返佢", "撤返，當冇發生過"]
    },
    "chrome.yoloHint": {
      en: ["YOLO mode: one click disables approvals and the sandbox", "YOLO mode — one click turns off approvals and the sandbox", "One-click YOLO mode — no approvals, no sandbox", "One-click YOLO: approvals off, sandbox off, seatbelt off", "One-click YOLO — approvals off, sandbox off, nothing left between Codex and your disk"],
      yue: ["YOLO 模式：一㩒關閉批准同沙盒", "YOLO 模式 — 一㩒批准同沙盒一齊熄", "一鍵 YOLO — 唔使批准、冇沙盒", "一鍵 YOLO：批准冇咗、沙盒冇咗、安全帶都甩埋", "一鍵 YOLO — 批准同沙盒全關，Codex 同你部機之間乜都冇"]
    },
    "console.preview": {
      en: ["Composed command", "Composed command preview", "Command preview", "What we're about to run", "The exact line hitting your shell"],
      yue: ["組成嘅指令", "組成指令預覽", "指令預覽", "即刻要行嘅指令", "就係呢行字入你 shell"]
    },
    "console.run": {
      en: ["Run", "Run command", "Run it", "Send it", "Run — let it rip"],
      yue: ["執行", "執行指令", "行佢", "㩒落去行", "行喇，唔使諗"]
    },
    "cost.loadUsage": {
      en: ["Load session usage", "Load usage from the latest session", "Load the latest session's real token counts", "Grab the real token counts off your newest session", "Yank the real token counts out of your newest session"],
      yue: ["載入 session 用量", "由最新 session 載入用量", "攞最新 session 嘅真實 token 數", "攞返最新 session 嗰啲真數字入嚟", "直接搶最新 session 嗰堆 token 數入嚟"]
    },
    /* Context-menu items and buttons. These were hard-coded English literals, so a
       Cantonese user got a translated toast and an English menu. The destructive ones
       keep their warning at every level — a label that stops reading as destructive
       because the slider moved has failed the user, not amused them. */
    "tabs.closeOthers": {
      en: ["Close other tabs", "Close all other tabs", "Close the other tabs", "Shut every other tab", "Shut every other tab, bye bye"],
      yue: ["關閉其他分頁", "關閉所有其他分頁", "閂晒其他 tab", "其他 tab 一次過閂晒", "其他 tab 一次過閂晒，拜拜"]
    },
    "tabs.close": {
      en: ["Close tab", "Close the tab", "Close this tab", "Shut this tab", "Shut this tab, bye tab"],
      yue: ["關閉分頁", "關閉呢個分頁", "閂咗呢個 tab", "呢個 tab，閂咗佢", "呢個 tab 閂咗佢，拜拜"]
    },
    "tabs.bulkContaining": {
      en: ["Close tabs containing text…", "Close tabs containing chosen text…", "Close tabs whose title contains…", "Close tabs with this in the title…", "Close tabs caught saying this text…"],
      yue: ["關閉包含指定文字嘅分頁…", "關閉標題包含指定文字嘅分頁…", "閂晒標題有呢段字嘅 tab…", "標題有呢段字嘅 tab，閂晒…", "邊個 tab 標題講呢句就閂咗佢…"]
    },
    "tabs.bulkGroupContaining": {
      en: ["Close tabs in this group containing text…", "Close this group's tabs containing text…", "In this group, close tabs with this text…", "In this group, close tabs that say this…", "In this group, close tabs caught saying this…"],
      yue: ["關閉呢個群組入面包含指定文字嘅分頁…", "關閉呢個群組入面標題有指定文字嘅分頁…", "喺呢組入面，閂晒標題有呢段字嘅 tab…", "淨係喺呢組，標題有呢段字嘅 tab 閂晒…", "淨係呢組，邊個 tab 講呢句就閂咗佢…"]
    },
    "tabs.bulkNotContaining": {
      en: ["Close tabs not containing text…", "Close tabs without the chosen text…", "Close tabs whose title lacks this…", "Close every tab that does not say this…", "Close every tab that never mentions this…"],
      yue: ["關閉唔包含指定文字嘅分頁…", "關閉標題冇指定文字嘅分頁…", "閂晒標題冇呢段字嘅 tab…", "標題冇呢段字嘅 tab，全部閂晒…", "邊個 tab 唔提呢句就閂咗佢…"]
    },
    "tabs.closeRight": {
      en: ["Close tabs to the right", "Close all tabs to the right", "Close every tab to the right", "Shut every tab to the right", "Shut every tab to the right, gone"],
      yue: ["關閉右邊嘅分頁", "關閉右邊所有分頁", "閂晒右邊啲 tab", "右邊啲 tab 一次過閂晒", "右邊啲 tab 閂晒，一個都唔留"]
    },
    "tabs.pin": {
      en: ["Pin tab", "Pin this tab", "Pin this tab in place", "Pin this tab down", "Pin this tab down for good"],
      yue: ["釘住分頁", "釘住呢個分頁", "釘住呢個 tab", "釘實呢個 tab", "釘實呢個 tab，郁都唔准郁"]
    },
    "tabs.rename": {
      en: ["Rename tab…", "Rename this tab…", "Give this tab a new name…", "Give this tab a better name…", "Give this tab a name it deserves…"],
      yue: ["重新命名分頁…", "重新命名呢個分頁…", "幫呢個 tab 改個名…", "幫呢個 tab 改個好啲嘅名…", "幫呢個 tab 改個似樣啲嘅名…"]
    },
    "tabs.unpin": {
      en: ["Unpin tab", "Unpin this tab", "Take the pin off this tab", "Pull the pin out of this tab", "Unpin this tab, let it roam"],
      yue: ["取消釘住分頁", "取消釘住呢個分頁", "唔再釘住呢個 tab", "拔咗呢個 tab 嘅釘", "拔咗枝釘，放呢個 tab 走"]
    },
    "destructive.clearFilter": {
      en: ["Clear this filter", "Clear the active filter", "Clear the filter", "Clear the filter, show everything", "Bin the filter, show everything"],
      yue: ["清除呢個篩選", "清除目前嘅篩選", "清走個篩選", "清走個篩選，全部顯示返", "篩選唔要喇，全部畀我睇晒"]
    },
    "destructive.resetAll": {
      en: ["Reset all", "Reset all elements", "Reset every element", "Reset every last element", "Reset the lot — every element"],
      yue: ["全部重設", "重設所有元素", "每個元素都重設", "所有元素一次過打返原形", "全部元素打返原形，一個唔留"]
    },
    "destructive.resetElement": {
      en: ["Reset element", "Reset this element", "Reset just this element", "Reset this one element only", "Reset this element, styling gone"],
      yue: ["重設元素", "重設呢個元素", "淨係重設呢個元素", "淨係呢個元素打返原形", "呢個元素打返原形，樣式冇晒"]
    },
    "destructive.resetPrices": {
      en: ["Reset prices", "Reset the prices", "Reset prices to defaults", "Reset prices back to defaults", "Reset prices — your numbers go"],
      yue: ["重設價格", "重設啲價格", "價格重設返做預設", "啲價打返原形，用返預設", "啲價打返原形，你改嗰啲冇晒"]
    },
    "destructive.resetSection": {
      en: ["Reset this section", "Reset this entire section", "Reset every key in this section", "Reset the whole section, all keys", "Reset this section — all keys go"],
      yue: ["重設呢個區段", "重設成個區段", "呢個區段每個 key 都重設", "成個區段所有 key 打返原形", "成個區段打返原形，key 清晒"]
    },
    "destructive.stopAll": {
      en: ["Stop all", "Stop all instances", "Stop every instance", "Stop every instance now", "Stop the lot — every instance"],
      yue: ["全部停止", "停止所有 instance", "所有 instance 停晒", "即刻停晒所有 instance", "所有 instance 停晒，一個唔剩"]
    },
    "copy.copy": {
      en: ["Copy", "Copy to clipboard", "Copy it", "Grab a copy", "Yoink it to the clipboard"],
      yue: ["複製", "複製去剪貼簿", "複製佢", "抄咗佢去剪貼簿", "一嘢抄佢入剪貼簿"]
    },
    "copy.cliEquivalent": {
      en: ["Copy CLI equivalent", "Copy the CLI equivalent", "Copy this as a CLI command", "Grab the CLI line for this", "Yoink the CLI line for this"],
      yue: ["複製 CLI 等效指令", "複製對應嘅 CLI 指令", "複製返做 CLI 指令", "抄低呢個嘅 CLI 指令", "一嘢抄走佢句 CLI 指令"]
    },
    "copy.cOverride": {
      en: ["Copy as -c override", "Copy as a -c override", "Copy this as a -c override", "Grab it as a -c override", "Snag it as a -c override"],
      yue: ["複製做 -c override", "複製成一個 -c override", "複製呢個做 -c override", "抄低佢做 -c override", "一嘢抄走佢做 -c override"]
    },
    "copy.exportAppearance": {
      en: ["Export appearance…", "Export appearance to a file…", "Export your appearance to a file…", "Bottle this appearance into a file…", "Cram the whole appearance into a file…"],
      yue: ["匯出外觀…", "匯出外觀做檔案…", "將你個外觀匯出成檔案…", "將成個外觀打包入檔案…", "成套外觀一次過打包入檔案…"]
    },
    "copy.filterByThis": {
      en: ["Filter by this", "Filter the list by this", "Filter the list down to this", "Filter down to just this", "Filter down to this, hide the rest"],
      yue: ["用呢個篩選", "用呢個篩選個列表", "將個列表篩到淨返呢個", "篩到淨低呢個", "篩到淨低呢個，其他收埋"]
    },
    "copy.importAppearance": {
      en: ["Import appearance…", "Import appearance from a file…", "Load an appearance file…", "Load a saved appearance from a file…", "Yank a saved appearance out of a file…"],
      yue: ["匯入外觀…", "由檔案匯入外觀…", "載入一個外觀檔案…", "由檔案攞返個儲低咗嘅外觀…", "由檔案度掹返成套外觀入嚟…"]
    },
    "copy.open": {
      en: ["Open", "Open it", "Open it up", "Pop it open", "Fling it open"],
      yue: ["開啟", "開啟佢", "打開佢", "撳開佢", "一嘢撳開佢"]
    },
    "copy.openInEditor": {
      en: ["Open in editor", "Open in your editor", "Open it in your editor", "Pop it open in your editor", "Fling it open in your editor"],
      yue: ["喺編輯器開啟", "喺你嘅編輯器開啟", "用你個編輯器開佢", "攞去你個編輯器度開", "掟入你個編輯器度開佢"]
    },
    "copy.showOnlyThis": {
      en: ["Show only this", "Show only this one", "Show just this one", "Show this one and nothing else", "Show this one, hide everybody else"],
      yue: ["只顯示呢個", "只顯示呢一個", "淨係顯示呢個", "淨係顯示呢個，其他唔理", "淨係留低呢個，其餘全部收埋"]
    },
    "opt.absolutePath": {
      en: ["Absolute path", "Full absolute path", "Full path to the folder", "Full path — no shortcuts", "Full path, drive letter and all"],
      yue: ["絕對路徑", "完整絕對路徑", "資料夾嘅完整路徑", "完整路徑，唔准偷懶", "完整路徑，連碟符都要"]
    },
    "opt.actionToRebind": {
      en: ["Action to rebind", "Action id to rebind", "Which action to rebind", "Which action needs a new key", "Which action is swapping keys?"],
      yue: ["要重新綁定嘅動作", "要重新綁定嘅動作 id", "邊個動作要重新綁定", "邊個動作要換掣", "邊個動作要換過個掣呀？"]
    },
    "opt.approvalPolicy": {
      en: ["Approval policy", "Command approval policy", "When Codex asks before acting", "When Codex has to ask you first", "How much Codex asks before it acts"],
      yue: ["批准政策", "指令批准政策", "Codex 幾時要問過你先", "Codex 幾時要問准你先郁手", "Codex 郁手之前要問你幾多次"]
    },
    "opt.langBilingual": {
      en: ["Bilingual · EN + 粵", "Bilingual, both shown · EN + 粵", "Both at once · EN + 粵", "Both languages together · EN + 粵", "Two languages, one screen · EN + 粵"],
      yue: ["雙語 · EN + 粵", "雙語並列 · EN + 粵", "兩種一齊出 · EN + 粵", "兩種語言一齊嚟 · EN + 粵", "英文粵文孖住出 · EN + 粵"]
    },
    "opt.narratorBoth": {
      en: ["Both — English then 廣東話", "Both, in order — English then 廣東話", "Both — English first, then 廣東話", "Both — English first, 廣東話 after", "Both — English talks, then 廣東話"],
      yue: ["兩種都要 — 先英文，後廣東話", "兩種都讀 — 先英文，再廣東話", "兩樣都講 — 先英文，跟住廣東話", "兩樣都講 — 英文行先，廣東話跟尾", "兩樣都講 — 英文講先，廣東話再嚟多次"]
    },
    "opt.contextToInclude": {
      en: ["Context to include", "IDE context to include", "What context to pull in", "What to drag in from the IDE", "What to haul in from the IDE"],
      yue: ["要包含嘅上下文", "要包含嘅 IDE 上下文", "要攞入嚟嘅內容", "要由 IDE 攞入嚟嘅嘢", "由 IDE 攞乜入嚟，講低佢"]
    },
    "opt.custom": {
      en: ["Custom…", "Custom value…", "Something else…", "Pick your own…", "Pick your own number…"],
      yue: ["自訂…", "自訂數值…", "自己揀…", "自己填個數…", "自己填個數，你話事…"]
    },
    "opt.themeDark": {
      en: ["Dark", "Dark theme", "Dark", "Dark, lights off", "Dark — kill the lights"],
      yue: ["深色", "深色主題", "深色", "深色，閂燈模式", "深色 — 閂晒燈嗰隻"]
    },
    "opt.fontDefault": {
      en: ["Default (Roboto, bundled)", "Default font (Roboto, bundled)", "Default — Roboto, bundled", "Default — Roboto, comes with the app", "Default — plain old bundled Roboto"],
      yue: ["預設（Roboto，內置）", "預設字型（Roboto，內置）", "預設 — 內置 Roboto", "預設 — 內置 Roboto，出廠就有", "預設 — 老老實實嘅內置 Roboto"]
    },
    "opt.langEnglish": {
      en: ["English", "English only", "English", "English all the way", "English only, plain and simple"],
      yue: ["英文", "淨係英文", "英文", "淨係英文，一於咁話", "淨係講英文，唔撈粵語"]
    },
    "opt.exactMatch": {
      en: ["Exact match", "Exact match only", "Matches exactly", "Exactly this, nothing else", "Exactly this — character for character"],
      yue: ["完全相符", "只限完全相符", "要一模一樣", "一模一樣先算數", "一模一樣，差一個字都唔算"]
    },
    "opt.excerpt": {
      en: ["Excerpt", "Text excerpt", "Just the excerpt", "Just a snippet", "Just a snippet, not the whole thing"],
      yue: ["節錄", "文字節錄", "淨係節錄", "淨係一小段", "淨係一小段，唔係成篇"]
    },
    "opt.languageMode": {
      en: ["Language mode", "Interface language mode", "Which language it uses", "Which language it talks in", "What language this app yaps in"],
      yue: ["語言模式", "介面語言模式", "用邊種語言", "用邊種語言同你講嘢", "用邊種語言同你吹水"]
    },
    "opt.themeLight": {
      en: ["Light", "Light theme", "Light", "Light, lights on", "Light — full brightness"],
      yue: ["淺色", "淺色主題", "淺色", "淺色，開晒燈", "淺色 — 光到眯埋眼嗰隻"]
    },
    "opt.moveLeft": {
      en: ["Move left", "Move one place left", "Move left", "Shove it left", "Shove it one to the left"],
      yue: ["向左移", "向左移一格", "向左移", "推佢去左邊", "推佢向左行一格"]
    },
    "opt.moveRight": {
      en: ["Move right", "Move one place right", "Move right", "Shove it right", "Shove it one to the right"],
      yue: ["向右移", "向右移一格", "向右移", "推佢去右邊", "推佢向右行一格"]
    },
    "opt.off": {
      en: ["Off", "Switched off", "Off", "Off, not running", "Off — doing absolutely nothing"],
      yue: ["關閉", "已關閉", "閂咗", "閂咗，唔會郁", "閂咗 — 乜都唔做"]
    },
    "opt.on": {
      en: ["On", "Switched on", "On", "On, running", "On — up and running"],
      yue: ["開啟", "已開啟", "開咗", "開咗，行緊", "開咗 — 行緊喇"]
    },
    "opt.resumeSession": {
      en: ["Resume session", "Resume this session", "Carry on with this session", "Pick this session back up", "Pick up where you left this session"],
      yue: ["繼續工作階段", "繼續呢個工作階段", "繼續做返呢個 session", "接返呢個 session 落去", "由停低嗰度接返呢個 session"]
    },
    "opt.run": {
      en: ["Run", "Run command", "Run", "Run it", "Run it — go on"],
      yue: ["執行", "執行指令", "行", "行啦", "撳落去，行啦"]
    },
    "opt.sandboxMode": {
      en: ["Sandbox mode", "Sandbox enforcement mode", "Sandbox mode — how locked down", "How boxed in Codex is", "How tight Codex's sandbox is"],
      yue: ["沙盒模式", "沙盒執行模式", "沙盒模式 — 收得幾緊", "Codex 畀困得幾實", "Codex 個沙盒夾得幾實"]
    },
    "opt.spawnAll": {
      en: ["Spawn all", "Spawn all instances", "Spawn all of them", "Spawn the whole lot", "Spawn the whole lot at once"],
      yue: ["全部啟動", "啟動全部實例", "全部都開晒", "一次過開晒全部", "一次過開晒全部，一個都唔漏"]
    },
    "opt.startsWith": {
      en: ["Starts with", "Starts with the text", "Begins with this", "Starts with this, ends anywhere", "Starts with this — rest is free"],
      yue: ["開頭相符", "以呢段文字開頭", "開頭係咁", "開頭啱就得，後面隨便", "開頭啱就算，後面點都得"]
    },
    "opt.langCantonese": {
      en: ["廣東話 (playful HK Cantonese)", "廣東話 — playful HK Cantonese", "廣東話 (playful HK style)", "廣東話 (cheeky HK Cantonese)", "廣東話 (full-on cheeky HK)"],
      yue: ["廣東話（香港口語）", "廣東話（香港地道口語）", "廣東話（港式生鬼中文）", "廣東話（港式抵死中文）", "廣東話（港式抵死，玩到盡）"]
    },
    /* Shown where a WSL distribution name would go, on a machine that has none. The
       binding used to resolve to undefined and render as a blank button. */
    "wsl.none": {
      en: ["No WSL installed", "No WSL installed", "No WSL installed", "No WSL here", "No WSL on this machine"],
      yue: ["未安裝 WSL", "未安裝 WSL", "冇裝 WSL", "呢部機冇 WSL", "呢部機冇 WSL"]
    },
    "wsl.noneHint": {
      en: ["Install a distribution with wsl --install",
        "Install a distribution with wsl --install",
        "Install one first — run wsl --install",
        "Install one first — run wsl --install in an elevated terminal",
        "Install one first — run wsl --install in an elevated terminal"],
      yue: ["用 wsl --install 裝一個發行版",
        "用 wsl --install 裝一個發行版",
        "先裝一個 —— 行 wsl --install",
        "先裝一個 —— 喺管理員終端機行 wsl --install",
        "先裝一個 —— 喺管理員終端機行 wsl --install"]
    },
    "act.open": {
      en: ["Open", "Open", "Open", "Open", "Open"],
      yue: ["開啟", "開啟", "打開", "打開", "打開"]
    },
    "appear.tabNamed": {
      en: ["Tab · {title}", "Tab · {title}", "Tab · {title}", "the {title} tab", "the {title} tab"],
      yue: ["分頁 · {title}", "分頁 · {title}", "分頁 · {title}", "{title} 嗰個分頁", "{title} 嗰個分頁"]
    },
    "appear.tabGone": {
      en: ["a closed tab", "a closed tab", "a tab that is no longer open",
        "a tab that is no longer open", "a tab that has since wandered off"],
      yue: ["一個已經閂咗嘅分頁", "一個已經閂咗嘅分頁", "一個唔再開住嘅分頁",
        "一個唔再開住嘅分頁", "一個已經走咗人嘅分頁"]
    },
    "appear.colorInput": {
      en: ["Colour value — hex, rgb, hsl, lab, oklch, cmyk or a name", "Colour value — hex, rgb, hsl, lab, oklch, cmyk or a colour name", "Type a colour — hex, rgb, hsl, lab, oklch, cmyk or a name", "Type a colour in any of these — hex, rgb, hsl, lab, oklch, cmyk, or just say tomato", "Type a colour however you like — hex, rgb, hsl, lab, oklch, cmyk, or just say tomato"],
      yue: ["顏色值 —— hex、rgb、hsl、lab、oklch、cmyk 或者名", "顏色值 —— hex、rgb、hsl、lab、oklch、cmyk 或者顏色名", "打隻色入嚟 —— hex、rgb、hsl、lab、oklch、cmyk 或者個名都得", "隨你用邊種寫法 —— hex、rgb、hsl、lab、oklch、cmyk，或者直接打 tomato", "鍾意點寫都得 —— hex、rgb、hsl、lab、oklch、cmyk，唔想諗就打 tomato"]
    },
    "appear.picker": {
      en: ["Saturation and brightness field", "Saturation and brightness picker", "Saturation and brightness field", "Pick saturation and brightness — drag anywhere in the field", "Drag anywhere in here: across for saturation, up for brightness"],
      yue: ["飽和度同光暗選色區", "飽和度同光暗嘅選色區", "飽和度同光暗選色區", "揀飽和度同光暗 —— 喺格入面任你拖", "喺呢格入面任拖：橫向係飽和度，向上係光"]
    },
    "appear.hue": {
      en: ["Hue", "Hue", "Hue", "Hue", "Hue"],
      yue: ["色相", "色相", "色相", "色相", "色相"]
    },
    "appear.sat": {
      en: ["Saturation", "Saturation", "Saturation", "Saturation", "Saturation"],
      yue: ["飽和度", "飽和度", "飽和度", "飽和度", "飽和度"]
    },
    "appear.val": {
      en: ["Brightness", "Brightness", "Brightness", "Brightness", "Brightness"],
      yue: ["光暗", "光暗", "光暗", "光暗", "光暗"]
    },
    "appear.dialog": {
      en: ["Appearance — {target}", "{target} appearance", "Appearance of {target}", "Appearance settings for {target}", "Appearance settings for {target}"],
      yue: ["外觀 —— {target}", "{target} 外觀", "{target} 嘅外觀", "{target} 嘅外觀設定", "{target} 嘅外觀設定"]
    },
    "appear.noTarget": {
      en: ["Nothing selected to restyle", "No element selected to restyle", "Nothing selected to restyle", "There is no element focused to restyle", "Nothing is focused, so there is nothing to restyle"],
      yue: ["冇揀中任何嘢改外觀", "冇揀中任何元素改外觀", "冇揀中任何嘢改外觀", "而家冇 focus 住任何元素，改唔到外觀", "冇嘢 focus 住，即係冇嘢改得"]
    },
    "appear.noTargetBody": {
      en: ["Tab to a control first, then press Ctrl+Shift+E.", "Select a control with Tab first, then press Ctrl+Shift+E.", "Tab to a control first, then press Ctrl+Shift+E to edit its appearance.", "Move focus onto a control with Tab, then press Ctrl+Shift+E to edit how it looks.", "Tab onto something first — then Ctrl+Shift+E, and it is yours to redecorate."],
      yue: ["先撳 Tab 去到一個控制項，再撳 Ctrl+Shift+E。", "先用 Tab 揀一個控制項，再撳 Ctrl+Shift+E。", "先撳 Tab 去到一個控制項，再撳 Ctrl+Shift+E 改佢個外觀。", "用 Tab 將 focus 移去一個控制項，再撳 Ctrl+Shift+E 改佢個樣。", "先 Tab 落去揀個嘢先 —— 然後 Ctrl+Shift+E，佢就任你裝修。"]
    },
    "history.noSnapshot": {
      en: ["No snapshot stored for this revision", "No snapshot was stored for this revision", "This revision has no snapshot to restore", "This revision has no snapshot, so there is nothing to put back", "This revision kept no snapshot, so there is nothing to put back — it is a signpost, not a save point"],
      yue: ["呢個版本冇存低快照", "呢個版本冇存低任何快照", "呢個版本冇快照可以還原", "呢個版本冇快照，即係冇嘢可以放返去", "呢個版本冇留低快照，冇嘢還原得返 —— 佢係個路標，唔係個存檔點"]
    },
    "history.search": {
      en: ["Search revisions", "Search revisions", "Search revisions",
        "Search every revision", "Search every revision — message, action or hash"],
      yue: ["搵版本", "搵版本", "搵版本", "搵勻所有版本", "搵勻所有版本 —— 訊息、動作、hash 都得"]
    },
    "history.actions": {
      en: ["Filter by action", "Filter by action", "Filter by action",
        "Filter by what happened", "Filter by what actually happened"],
      yue: ["按動作篩選", "按動作篩選", "按動作篩選", "按發生咗咩嚟篩", "按真係發生咗咩嚟篩"]
    },
    "history.actionHint": {
      en: ["{count} {action} revisions", "{count} {action} revisions recorded", "{count} {action} revisions", "{count} revisions recorded as {action}", "{count} revisions recorded as {action}"],
      yue: ["{count} 個 {action} 版本", "記錄咗 {count} 個 {action} 版本", "{count} 個 {action} 版本", "有 {count} 個版本記做 {action}", "有 {count} 個版本記做 {action}"]
    },
    "history.status": {
      en: ["Showing {shown} of {total} revisions.", "Showing {shown} of the {total} revisions.", "Showing {shown} of {total} revisions.", "{shown} of {total} revisions match.", "{shown} of {total} revisions match. The rest are still there, just filtered out."],
      yue: ["顯示緊 {total} 個版本入面嘅 {shown} 個。", "顯示緊 {total} 個版本入面嘅其中 {shown} 個。", "{total} 個版本，顯示緊 {shown} 個。", "{total} 個入面有 {shown} 個夾到。", "{total} 個入面有 {shown} 個夾到。其餘嗰啲仲喺度，只係畀篩走咗。"]
    },
    "history.noMatch": {
      en: ["No revision matches this filter.", "No revision matches the current filter.", "No revision matches this filter.", "No revision matches — try widening the dates or clearing an action.", "No revision matches. Widen the dates, drop an action, or clear the search."],
      yue: ["冇版本夾到呢個篩選。", "冇版本夾到而家呢個篩選。", "冇版本夾到。", "冇版本夾到 —— 試下放寬日期或者取消一個動作。", "冇版本夾到。放寬日期、取消一個動作，或者清走個搜尋。"]
    },
    "history.empty": {
      en: ["Nothing has been recorded yet.", "No revisions have been recorded yet.", "Nothing recorded yet.", "Nothing recorded yet — change something and it appears here.", "Nothing recorded yet. Change something and it turns up here."],
      yue: ["仲未記低過任何嘢。", "仲未記低過任何版本。", "未有紀錄。", "未有紀錄 —— 改樣嘢就會出現喺度。", "未有紀錄。改樣嘢，佢就會喺度出現。"]
    },
    "history.clearFilters": {
      en: ["Clear filters", "Clear filters", "Clear filters", "Clear every filter", "Clear the lot"],
      yue: ["清除篩選", "清除篩選", "清走啲篩選", "清晒所有篩選", "全部清走佢"]
    },
    "history.pruned": {
      en: ["Pruned {count} revisions, kept {kept}.", "Pruned {count} revisions and kept {kept}.", "Pruned {count} revisions, kept {kept}.", "Pruned {count} revisions and kept the newest {kept}.", "Pruned {count} revisions and kept the newest {kept}. That one is not undoable."],
      yue: ["剪走咗 {count} 版，保留 {kept} 版。", "剪走咗 {count} 版，保留咗 {kept} 版。", "剪走咗 {count} 版，留返 {kept} 版。", "剪走咗 {count} 版，留返最新嘅 {kept} 版。", "剪走咗 {count} 版，留返最新嘅 {kept} 版。呢單係 undo 唔到㗎。"]
    },

    /* ---- external editor & appearance ---- */
    "editor.opened": {
      en: ["Opened {path}", "Opened {path}", "Opened {path}", "Opened {path} in your editor", "Opened {path} — go look at your editor"],
      yue: ["開咗 {path}", "開咗 {path}", "開咗 {path}", "喺你個編輯器開咗 {path}", "開咗 {path} — 望下你個編輯器啦"]
    },
    "act.stop": {
      en: ["Stop", "Stop", "Stop", "Stop it", "Stop it right there"],
      yue: ["停止", "停止", "停佢", "叫停佢", "即刻停佢"]
    },
    "chat.stopped": {
      en: ["Stopped the run (pid {pid}) and everything it started.", "Stopped the run (pid {pid}) and everything it had started.", "Stopped the run (pid {pid}) and everything under it.", "Stopped the run (pid {pid}) and every process it started.", "Stopped the run (pid {pid}) and every process it started — nothing is left running."],
      yue: ["已停止呢個 run（pid {pid}）同佢開嘅所有嘢。", "已停止呢個 run（pid {pid}）同佢開過嘅所有嘢。", "停咗呢個 run（pid {pid}）同佢底下嗰啲。", "停咗呢個 run（pid {pid}）同埋佢開過嘅每一個 process。", "停咗呢個 run（pid {pid}）同佢開過嘅每一個 process —— 冇嘢仲喺度行。"]
    },
    "chat.alreadyDone": {
      en: ["That run had already finished.", "That run had finished already.", "That run had already finished on its own.", "That run finished on its own a moment ago.", "That run finished on its own a moment ago — nothing to stop."],
      yue: ["嗰個 run 已經行完咗。", "嗰個 run 之前已經行完咗。", "嗰個 run 自己行完咗。", "嗰個 run 頭先自己行完咗。", "嗰個 run 頭先自己行完咗，冇嘢好停。"]
    },
    "err.cancel": {
      en: ["The run could not be stopped: {detail}", "Could not stop the run: {detail}", "Could not stop the run — {detail}", "Could not stop the run. It said: {detail}", "Could not stop the run, so it may still be going. It said: {detail}"],
      yue: ["停唔到呢個 run：{detail}", "呢個 run 停唔到：{detail}", "停唔到 — {detail}", "停唔到呢個 run，佢話：{detail}", "停唔到呢個 run，可能仲行緊。佢話：{detail}"]
    },
    "chat.busy": {
      en: ["A run is already in flight.", "A run is already in progress.", "A run is already in flight.", "One run at a time — this thread is still working.", "One at a time. This thread is still busy."],
      yue: ["已經有一個 run 喺度行緊。", "已經有一個 run 行緊。", "已經有嘢行緊。", "一次行一個 — 呢條 thread 仲做緊嘢。", "一次行一個啦，佢仲喺度做緊嘢。"]
    },
    "chat.failed": {
      en: ["codex exited {code}", "codex exited with code {code}", "codex exited {code}", "codex exited {code} — the output above is what it said", "codex exited {code}. Whatever it printed above is the whole story."],
      yue: ["codex 收咗工，exit {code}", "codex 收咗工，exit code 係 {code}", "codex 行完，exit {code}", "codex exit {code} — 上面嗰啲就係佢講嘅嘢", "codex exit {code}，佢上面打咗乜就係乜，冇再多。"]
    },
    "err.run": {
      en: ["The run could not start: {detail}", "The run did not start: {detail}", "The run could not start — {detail}", "The run never started. It said: {detail}", "The run never even started. It said: {detail}"],
      yue: ["個 run 起唔到步：{detail}", "個 run 開唔到：{detail}", "行唔到 — {detail}", "個 run 根本冇開始過，佢話：{detail}", "個 run 連起步都冇，佢話：{detail}"]
    },
    "appearance.exported": {
      en: ["Appearance presets copied to the clipboard.", "Appearance presets copied to your clipboard.", "Appearance presets copied.", "Appearance presets copied — paste them somewhere safe.", "Appearance presets copied. Paste them somewhere safe and they survive a reinstall."],
      yue: ["外觀設定已複製到剪貼簿。", "外觀設定已經複製咗去剪貼簿。", "外觀設定 copy 咗。", "外觀設定 copy 咗 — 搵個安全位 paste 低佢。", "外觀設定 copy 咗。搵個安全位 paste 低，重灌都唔怕冇咗。"]
    },

    /* ---- appearance files and named presets. A clipboard blob dies with the
       session; a file survives a reinstall, so every message below names the file
       it wrote or read, and the partial import names both halves of the count —
       what came in AND what did not. A theme that quietly loses half its colours
       is worse than one that refuses outright. ---- */
    "appearance.exportedFile": {
      en: ["Appearance exported to {path}.", "Appearance exported to the file {path}.", "Appearance exported to {path} — keep that file somewhere safe.", "Appearance exported to {path}. Keep that file and your look survives a reinstall.", "Appearance exported to {path}. Guard that file with your life and your theme will outlive the next reinstall."],
      yue: ["外觀已匯出至 {path}。", "外觀已經匯出到檔案 {path}。", "外觀 export 咗去 {path} — 搵個安全位擺好佢。", "外觀 export 咗去 {path}。留住份檔，重灌完都仲係呢個樣。", "外觀 export 咗去 {path}。份檔睇實佢，下次重灌你個 theme 都照樣返生。"]
    },
    "appearance.imported": {
      en: ["Imported {count} element styles from {file}.", "{count} element styles imported from {file}.", "Imported {count} element styles from {file}.", "{count} element styles came in from {file} — the app is wearing them now.", "{count} element styles came in from {file}, and the app has already put them on."],
      yue: ["已由 {file} 匯入 {count} 個元素樣式。", "已經由 {file} 匯入咗 {count} 個元素樣式。", "由 {file} import 咗 {count} 個元素樣式。", "由 {file} import 咗 {count} 個元素樣式 — 個 app 已經著咗上身。", "由 {file} import 咗 {count} 個元素樣式，個 app 即刻換咗新衫。"]
    },
    "appearance.importedPartial": {
      en: ["Imported {count} element styles. {dropped} values could not be represented and were left out; each one is listed with its reason.", "Imported {count} element styles and left out {dropped} values that could not be represented; each one is listed with its reason.", "Imported {count} element styles. {dropped} values could not be represented, so they were left out — each one is listed with its reason.", "Imported {count} element styles and left {dropped} behind, because this build cannot represent them. Every one is listed with its reason.", "Imported {count} element styles and left {dropped} at the door, because this build cannot represent them. Every one is listed with its reason, so nothing vanished quietly."],
      yue: ["已匯入 {count} 個元素樣式。有 {dropped} 個數值表達唔到，冇匯入；每一個都列咗原因。", "已匯入 {count} 個元素樣式，另有 {dropped} 個數值表達唔到，所以冇匯入；每一個都列咗原因。", "import 咗 {count} 個元素樣式。有 {dropped} 個數值表達唔到，唯有唔要 — 每個都寫低咗原因。", "import 咗 {count} 個元素樣式，掉低咗 {dropped} 個，因為呢個 build 表達唔到佢哋。每個都寫低咗原因。", "import 咗 {count} 個元素樣式，有 {dropped} 個喺門口停低咗，因為呢個 build 表達唔到佢哋。每個都寫低咗原因，冇一個係靜雞雞唔見咗。"]
    },
    "appearance.presetSaved": {
      en: ["Saved the appearance preset {name}.", "Saved {name} as an appearance preset.", "Saved the appearance preset {name}.", "Saved {name} — pick it from the preset list whenever you want this look back.", "Saved {name}. Pick it from the preset list whenever you want this look back."],
      yue: ["已儲存外觀預設 {name}。", "外觀預設 {name} 已經儲存。", "外觀預設 {name} save 咗。", "{name} save 咗 — 想要返呢個樣，喺預設清單度撳返佢就得。", "{name} save 咗。想扮返今日呢個樣，喺預設清單度撳返佢就得。"]
    },
    "appearance.presetDeleted": {
      en: ["Deleted the appearance preset {name}.", "Deleted {name} from the appearance presets.", "Deleted the appearance preset {name}. History still has it, so this is undoable.", "Deleted {name}. History still has it, so this is undoable.", "Deleted {name}. History still has it, so you can pull it back out of the bin."],
      yue: ["已刪除外觀預設 {name}。", "外觀預設 {name} 已經刪除。", "外觀預設 {name} 刪咗。History 度仲有，所以 undo 得返。", "{name} 刪咗。History 度仲有，所以 undo 得返。", "{name} 刪咗。History 度仲有，想撈返上嚟隨時得。"]
    },
    "appearance.presetApplied": {
      en: ["Applied the appearance preset {name}.", "Appearance preset {name} applied.", "Applied the appearance preset {name}.", "{name} is on. Everything it names has changed shape.", "{name} is on, and everything it names has changed shape."],
      yue: ["已套用外觀預設 {name}。", "外觀預設 {name} 已經套用。", "外觀預設 {name} 套咗落去。", "{name} 上咗身，佢寫住嘅嘢全部換晒樣。", "{name} 上咗身，佢寫住嘅嘢全部換晒樣，即刻精神晒。"]
    },

    "err.appearanceParse": {
      en: ["{file} could not be read as an appearance file: {message} Nothing was imported and your current appearance is untouched.", "{file} could not be read as an appearance file: {message} Nothing was imported, so your current appearance is untouched.", "{file} would not read as an appearance file — {message} Nothing was imported; your current appearance is untouched.", "{file} refused to read as an appearance file: {message} Nothing was imported, so your current appearance is exactly as you left it.", "{file} refused to read as an appearance file: {message} Nothing was imported, so your current look is exactly as you left it."],
      yue: ["{file} 讀唔到做外觀檔：{message} 冇匯入任何嘢，你而家嘅外觀原封不動。", "{file} 讀唔到做外觀檔：{message} 冇匯入任何嘢，所以你而家嘅外觀原封不動。", "{file} 讀唔到做外觀檔 — {message} 乜都冇 import 到；你而家嘅外觀原封不動。", "{file} 死都唔肯讀做外觀檔：{message} 乜都冇 import 到，你而家個樣同之前一模一樣。", "{file} 死都唔肯讀做外觀檔：{message} 乜都冇 import 到，你個樣同你走嗰陣一模一樣。"]
    },
    "err.appearanceImport": {
      en: ["Nothing in {file} could be applied: {message} Your current appearance is untouched.", "No value in {file} could be applied: {message} Your current appearance is untouched.", "Nothing in {file} could be applied — {message} Your current appearance is untouched.", "Not one value in {file} could be applied: {message} Your current appearance is untouched.", "Not one value in {file} survived the check: {message} Your current appearance is untouched, which is the safe outcome."],
      yue: ["{file} 入面冇一樣嘢用得：{message} 你而家嘅外觀原封不動。", "{file} 入面冇一個數值用得：{message} 你而家嘅外觀原封不動。", "{file} 入面冇一樣嘢用得 — {message} 你而家嘅外觀原封不動。", "{file} 入面一個數值都用唔到：{message} 你而家嘅外觀原封不動。", "{file} 入面一個數值都過唔到關：{message} 你而家嘅外觀原封不動 — 咁樣至安全。"]
    },
    "warn.appearanceOverwrite": {
      en: ["A preset named {name} already exists. Saving again replaces it, and the copy you have now is gone.", "A preset named {name} already exists. Saving again will replace it.", "A preset named {name} already exists — saving again replaces it, and the copy you have now is gone.", "There is already a preset named {name}. Saving again replaces it, and the copy you have now is gone.", "There is already a preset called {name}. Saving again writes right over it, and the copy you have now is gone."],
      yue: ["已經有個叫 {name} 嘅預設。再 save 就會蓋咗佢，而家嗰份會冇咗。", "已經有一個叫 {name} 嘅預設。再儲存會覆蓋佢。", "已經有個叫 {name} 嘅預設 — 再 save 就會蓋咗佢，而家嗰份會冇咗。", "已經有個預設叫 {name} 㗎喇。再 save 就會蓋咗佢，而家嗰份會冇咗。", "已經有個預設叫 {name} 㗎喇。再 save 就直接寫過佢，而家嗰份會冇咗。"]
    },
/* Batch 1 — the slash-command wizard: field labels, hints and instructional
   placeholders. Five levels per language, repeats where a two-word field label has
   nowhere playful to go. The facts never move: a hint that names a cost, a scope or
   an irreversibility says the same thing at level 1 and level 5. */

    "opt.model": {
      en: ["Model", "Model", "Model", "Which model", "Which brain"],
      yue: ["模型", "模型", "用邊個模型", "用邊個模型", "揀邊個腦"]
    },
    "opt.effort": {
      en: ["Reasoning effort", "Reasoning effort", "How hard it thinks", "How hard it thinks", "How hard it thinks"],
      yue: ["推理程度", "推理程度", "諗得幾深", "諗得幾深", "要佢諗到幾盡"]
    },
    "opt.personality": {
      en: ["Personality", "Personality", "Personality", "Tone of voice", "What mood it's in"],
      yue: ["個性", "個性", "講嘢語氣", "講嘢語氣", "今日咩心情"]
    },
    "opt.reviewScope": {
      en: ["What to review", "What to review", "What to review", "What to look over", "What to put under the lamp"],
      yue: ["審查範圍", "審查範圍", "睇邊部分", "睇邊部分", "邊忽要攞去照吓"]
    },
    "opt.threadName": {
      en: ["New thread name", "New thread name", "New thread name", "Call this thread what", "New name for this thread"],
      yue: ["新對話名", "新對話名", "改咩名好", "改咩名好", "呢條 thread 叫咩名好"]
    },
    "opt.goal": {
      en: ["Goal", "Goal", "Goal", "What you're after", "What you're actually after"],
      yue: ["目標", "目標", "想做啲乜", "想做啲乜", "你到底想搞啲乜"]
    },
    "opt.sessionIdOrName": {
      en: ["Session id or name", "Session id or name", "Session id or name", "Session id, or its name", "Session id, or just its name"],
      yue: ["工作階段 id 或名稱", "工作階段 id 或名稱", "session 嘅 id 或者名", "session 嘅 id 或者名", "打 session 個 id，唔記得就打個名"]
    },
    "opt.sessionId": {
      en: ["Session id", "Session id", "Session id", "Session id", "Which session's id"],
      yue: ["工作階段 id", "工作階段 id", "session 嘅 id", "session 嘅 id", "邊個 session 嘅 id"]
    },
    "opt.detail": {
      en: ["Detail", "Detail", "Detail", "How much detail", "How much detail you can take"],
      yue: ["詳細程度", "詳細程度", "要幾詳細", "要幾詳細", "想睇到幾細"]
    },
    "opt.syntaxTheme": {
      en: ["Syntax theme", "Syntax theme", "Syntax theme", "Syntax colours", "What colour the code goes"],
      yue: ["語法主題", "語法主題", "程式碼配色", "程式碼配色", "啲 code 要咩色"]
    },
    "opt.pet": {
      en: ["Pet", "Pet", "Pet", "Pet", "Which pet keeps you company"],
      yue: ["寵物", "寵物", "寵物", "養邊隻", "養邊隻陪你"]
    },
    "opt.sideTopic": {
      en: ["Side topic", "Side topic", "Side topic", "Side question", "The thing you got distracted by"],
      yue: ["旁支話題", "旁支話題", "順便問嘅嘢", "順便問嘅嘢", "諗起就想問嗰樣嘢"]
    },
    "opt.scope": {
      en: ["Scope", "Scope", "Scope", "How much to cover", "How much to cover"],
      yue: ["範圍", "範圍", "包幾多", "包幾多", "要睇到幾闊"]
    },
    "opt.openingPrompt": {
      en: ["Opening prompt", "Opening prompt", "Opening prompt", "First thing to say", "First thing to say"],
      yue: ["開場提示", "開場提示", "第一句講咩", "第一句講咩", "開波第一句講咩"]
    },
    "opt.rawMode": {
      en: ["Raw mode", "Raw mode", "Raw mode", "Raw mode", "Raw mode"],
      yue: ["原始模式", "原始模式", "raw mode", "raw mode", "raw mode"]
    },

    "hint.model": {
      en: ["Sets the model for this thread only.", "Sets the model for this thread only.", "Changes the model for this thread only.", "Only this thread changes model — everything else stays put.", "Only this thread changes model. The rest of your threads never find out."],
      yue: ["淨係改呢條對話嘅模型。", "淨係改呢條對話嘅模型。", "淨係換呢條 thread 個模型。", "淨係呢條 thread 換模型，其他嘢一律唔郁。", "淨係呢條 thread 換模型，其他 thread 完全唔知發生咩事。"]
    },
    "hint.effort": {
      en: ["Higher effort costs more output tokens.", "Higher effort costs more output tokens.", "More effort means more output tokens, and a bigger bill.", "Think harder, pay more: effort is billed in output tokens.", "Think harder, pay more — effort comes out of your output-token budget, every time."],
      yue: ["推理程度愈高，輸出 token 用得愈多。", "推理程度愈高，輸出 token 用得愈多。", "諗得愈深，output token 用得愈多，帳單都大啲。", "要佢諗多啲就要畀多啲：呢啲 effort 係按 output token 收費。", "要佢諗多啲就要畀多啲 — 啲 effort 全部喺你 output token 度扣，一次都唔會漏。"]
    },
    "hint.approval": {
      en: ["untrusted asks for everything; never asks for nothing.", "untrusted asks for everything; never asks for nothing.", "untrusted asks before everything; never asks before nothing.", "untrusted checks with you before everything. never checks with you at all.", "untrusted checks with you before everything; never checks with you about nothing, ever."],
      yue: ["untrusted 咩都要問你；never 咩都唔問。", "untrusted 咩都要問你；never 咩都唔問。", "untrusted 做乜都要問過你；never 一句都唔問。", "untrusted 做乜都要問過你先；never 就乜都唔問你。", "untrusted 做乜都要問過你先；never 就由頭到尾一句都唔會問。"]
    },
    "hint.personality": {
      en: ["Communication style only — never changes safety behaviour.", "Communication style only — never changes safety behaviour.", "Style of speech only. Safety behaviour does not move.", "Only how it talks. What it refuses to do does not move an inch.", "Only how it talks. What it will and will not do does not move an inch."],
      yue: ["淨係改講嘢風格 — 唔會改安全行為。", "淨係改講嘢風格 — 唔會改安全行為。", "淨係改語氣，安全行為一啲都唔會變。", "淨係改佢點講嘢。佢唔肯做嘅嘢一樣唔肯做。", "淨係改佢點講嘢。邊啲肯做邊啲唔肯做，一毫米都唔會郁。"]
    },
    "hint.review": {
      en: ["Left empty, Codex reviews the current diff.", "Left empty, Codex reviews the current diff.", "Leave it empty and Codex reviews the current diff.", "Leave it empty and Codex just reads the current diff.", "Leave it empty and Codex reads whatever your current diff happens to be."],
      yue: ["留空嘅話，Codex 會審查現時嘅 diff。", "留空嘅話，Codex 會審查現時嘅 diff。", "唔填就自動睇而家個 diff。", "唔填就自動睇返而家個 diff。", "唔填就自動睇返你而家個 diff，你手上有咩就睇咩。"]
    },
    "hint.rename": {
      en: ["Renames the saved session.", "Renames the saved session.", "Renames the saved session.", "Renames the saved session — the conversation itself is untouched.", "Renames the saved session. Not a word of the conversation moves."],
      yue: ["重新命名已儲存嘅工作階段。", "重新命名已儲存嘅工作階段。", "改個已儲存 session 嘅名。", "改個 session 名 — 入面啲對話一個字都唔郁。", "改個 session 名啫，入面啲對話一個字都唔會郁。"]
    },
    "hint.goal": {
      en: ["Empty shows the current goal instead of setting one.", "Empty shows the current goal instead of setting one.", "Leave it empty to read the current goal instead of setting one.", "Leave it empty and it reads the goal back to you instead of setting one.", "Leave it empty and it just reads the current goal back at you instead of setting a new one."],
      yue: ["留空即係睇返而家個目標，唔會設定新嘅。", "留空即係睇返而家個目標，唔會設定新嘅。", "唔填就淨係睇返而家個目標，唔會改。", "唔填就淨係讀返而家個目標畀你聽，唔會設定新嘅。", "唔填就淨係讀返而家個目標畀你聽，唔會偷偷幫你設定個新嘅。"]
    },
    "hint.resume": {
      en: ["UUIDs take precedence over names.", "UUIDs take precedence over names.", "A UUID wins over a name.", "A UUID always wins over a name.", "A UUID always wins over a name, so a name that looks like one is asking for trouble."],
      yue: ["UUID 優先於名稱。", "UUID 優先於名稱。", "打 UUID 嘅話會蓋過個名。", "有 UUID 就一定用 UUID，唔會理個名。", "有 UUID 就梗係用 UUID，所以改個似 UUID 嘅名係自找麻煩。"]
    },
    "hint.fork": {
      en: ["Forks into a new thread; the original is untouched.", "Forks into a new thread; the original is untouched.", "Forks into a new thread. The original is untouched.", "Splits off a new thread. The original does not change at all.", "Splits off a new thread and leaves the original exactly where it was."],
      yue: ["分支去一條新對話；原本嗰條唔會變。", "分支去一條新對話；原本嗰條唔會變。", "開條新 thread 出嚟，原本嗰條唔郁。", "劈條新 thread 出嚟，原本嗰條完全唔會變。", "劈條新 thread 出嚟，原本嗰條原封不動擺喺度。"]
    },
    "hint.mcp": {
      en: ["verbose lists every tool each server exposes.", "verbose lists every tool each server exposes.", "verbose lists every tool each server exposes.", "verbose prints every single tool each server hands out.", "verbose prints every single tool each server hands out — all of them."],
      yue: ["verbose 會列出每個 server 提供嘅所有工具。", "verbose 會列出每個 server 提供嘅所有工具。", "verbose 會逐個 server 列晒佢啲工具。", "verbose 會逐個 server 打晒佢畀出嚟嘅工具。", "verbose 會逐個 server 打晒佢畀出嚟嘅工具，一個都唔會少。"]
    },
    "hint.theme": {
      en: ["Custom themes live in $CODEX_HOME/themes.", "Custom themes live in $CODEX_HOME/themes.", "Custom themes live in $CODEX_HOME/themes.", "Your own themes go in $CODEX_HOME/themes.", "Your own themes go in $CODEX_HOME/themes — that is the only place it looks."],
      yue: ["自訂主題放喺 $CODEX_HOME/themes。", "自訂主題放喺 $CODEX_HOME/themes。", "自訂主題擺喺 $CODEX_HOME/themes。", "你自己整嘅主題擺喺 $CODEX_HOME/themes。", "你自己整嘅主題擺喺 $CODEX_HOME/themes — 佢淨係去嗰度搵。"]
    },
    "hint.pets": {
      en: ["Custom pets resolve from CODEX_HOME/pets/<id>/pet.json.", "Custom pets resolve from CODEX_HOME/pets/<id>/pet.json.", "Custom pets are read from CODEX_HOME/pets/<id>/pet.json.", "Your own pets are read from CODEX_HOME/pets/<id>/pet.json.", "Your own pets are read from CODEX_HOME/pets/<id>/pet.json, and nowhere else."],
      yue: ["自訂寵物由 CODEX_HOME/pets/<id>/pet.json 讀取。", "自訂寵物由 CODEX_HOME/pets/<id>/pet.json 讀取。", "自訂寵物喺 CODEX_HOME/pets/<id>/pet.json 度讀。", "你自己養嗰隻喺 CODEX_HOME/pets/<id>/pet.json 度讀。", "你自己養嗰隻喺 CODEX_HOME/pets/<id>/pet.json 度讀，第二度佢唔會搵。"]
    },
    "hint.sandboxAddReadDir": {
      en: ["Windows only. Grants the sandbox read access.", "Windows only. Grants the sandbox read access.", "Windows only. Gives the sandbox read access to that path.", "Windows only. The sandbox gets to read that path — read, not write.", "Windows only. The sandbox gets to read that path. Read only; it still cannot write there."],
      yue: ["淨係 Windows。畀 sandbox 讀取權限。", "淨係 Windows。畀 sandbox 讀取權限。", "淨係 Windows 先用到。畀 sandbox 讀嗰個路徑。", "淨係 Windows 用到。畀 sandbox 讀嗰個路徑 — 得讀，唔寫得。", "淨係 Windows 用到。畀 sandbox 讀嗰個路徑之嘛，寫係一樣寫唔到。"]
    },
    "hint.side": {
      en: ["Runs in an ephemeral fork; the main thread is untouched.", "Runs in an ephemeral fork; the main thread is untouched.", "Runs in a throwaway fork. The main thread is untouched.", "Runs in a throwaway fork, so the main thread never notices.", "Runs in a throwaway fork, so your main thread never even notices it happened."],
      yue: ["喺一條臨時分支度行；主對話唔會受影響。", "喺一條臨時分支度行；主對話唔會受影響。", "喺條用完即棄嘅分支度行，主 thread 唔郁。", "喺條用完即棄嘅分支度行，主 thread 完全唔知情。", "喺條用完即棄嘅分支度行，主 thread 由頭到尾都唔知發生過。"]
    },
    "hint.btw": {
      en: ["Same as /side.", "Same as /side.", "Same as /side.", "Same as /side, just shorter to type.", "Same as /side, just shorter to type."],
      yue: ["同 /side 一樣。", "同 /side 一樣。", "同 /side 一模一樣。", "同 /side 一樣，不過打少幾個字。", "同 /side 一模一樣，純粹打少幾個字。"]
    },
    "hint.usage": {
      en: ["reset uses a usage-limit reset if one is available.", "reset uses a usage-limit reset if one is available.", "reset spends a usage-limit reset, if you have one.", "reset spends a usage-limit reset — if there is one to spend.", "reset spends a usage-limit reset, if there is actually one sitting there to spend."],
      yue: ["如果有可用嘅用量上限重設，reset 會用咗佢。", "如果有可用嘅用量上限重設，reset 會用咗佢。", "有得 reset 用量上限嘅話，reset 就會用咗佢。", "reset 會用咗個用量上限重設 — 前提係有得用。", "reset 會用咗個用量上限重設，前提係真係有一個喺度畀你用。"]
    },
    "hint.keymap": {
      en: ["Context bindings win over global ones.", "Context bindings win over global ones.", "A context binding beats a global one.", "A context binding always beats a global one.", "A context binding always beats a global one, no matter which you set last."],
      yue: ["情境按鍵優先於全域按鍵。", "情境按鍵優先於全域按鍵。", "情境嗰個會蓋過全域嗰個。", "情境嗰個一定蓋過全域嗰個。", "情境嗰個一定蓋過全域嗰個，唔理你邊個設得遲。"]
    },
    "hint.new": {
      en: ["Starts a fresh chat in the same profile.", "Starts a fresh chat in the same profile.", "Starts a fresh chat in the same profile.", "Opens a clean chat, same profile, nothing carried over.", "Opens a clean chat in the same profile. Nothing at all carries over."],
      yue: ["喺同一個 profile 開一段新對話。", "喺同一個 profile 開一段新對話。", "喺同一個 profile 度開段新對話。", "開段乾淨對話，同一個 profile，乜都唔會帶過去。", "開段乾淨對話，同一個 profile，之前啲嘢一樣都唔會帶過去。"]
    },
    "hint.clear": {
      en: ["Clears the terminal and starts a new chat.", "Clears the terminal and starts a new chat.", "Clears the terminal and starts a new chat.", "Wipes the terminal and starts a new chat.", "Wipes the terminal clean and starts a new chat on top of it."],
      yue: ["清空終端機，然後開新對話。", "清空終端機，然後開新對話。", "清晒個 terminal，再開段新對話。", "抹晒個 terminal，再開段新對話。", "抹到個 terminal 白鴿眼咁乾淨，再喺上面開段新對話。"]
    },
    "hint.raw": {
      en: ["Copy-friendly scrollback for terminal selection.", "Copy-friendly scrollback for terminal selection.", "Scrollback you can actually select and copy.", "Scrollback you can actually select and copy out.", "Scrollback you can actually select and copy out without fighting the terminal."],
      yue: ["方便複製嘅捲動紀錄，可以喺終端機度選取。", "方便複製嘅捲動紀錄，可以喺終端機度選取。", "啲 scrollback 變到真係揀得、copy 得。", "啲 scrollback 變到真係揀得、copy 得走。", "啲 scrollback 終於揀得又 copy 得，唔使再同個 terminal 摶命。"]
    },
    "hint.ide": {
      en: ["Pulls current IDE context into the thread.", "Pulls current IDE context into the thread.", "Pulls what your IDE is showing into the thread.", "Pulls whatever your IDE is showing into the thread.", "Pulls whatever your IDE happens to be showing straight into the thread."],
      yue: ["將而家 IDE 嘅內容拉入對話。", "將而家 IDE 嘅內容拉入對話。", "將你個 IDE 而家開緊嘅嘢拉入條 thread。", "將你個 IDE 而家顯示緊嘅嘢拉入條 thread。", "將你個 IDE 而家啱啱顯示緊嗰啲嘢，原封不動拉入條 thread。"]
    },

    "ph.reviewScope": {
      en: ["uncommitted changes / a branch / a path", "uncommitted changes / a branch / a path", "uncommitted changes / a branch / a path", "uncommitted changes, a branch, or a path", "uncommitted changes, a branch, or a path"],
      yue: ["未 commit 嘅改動 / 一條 branch / 一個路徑", "未 commit 嘅改動 / 一條 branch / 一個路徑", "未 commit 嘅改動 / branch / 路徑", "未 commit 嘅改動、一條 branch、或者一個路徑", "未 commit 嘅改動、一條 branch、或者一個路徑"]
    },
    "ph.renameExample": {
      en: ["payments regression", "payments regression", "payments regression", "the payments thing that broke", "the payments thing that broke"],
      yue: ["付款 regression", "付款 regression", "付款嗰單嘢", "付款壞咗嗰單嘢", "付款壞咗嗰單嘢"]
    },
    "ph.goalExample": {
      en: ["ship the Tauri bridge", "ship the Tauri bridge", "ship the Tauri bridge", "get the Tauri bridge out the door", "get the Tauri bridge out the door"],
      yue: ["出咗個 Tauri bridge", "出咗個 Tauri bridge", "搞掂個 Tauri bridge", "推咗個 Tauri bridge 出街", "推咗個 Tauri bridge 出街"]
    },
    "ph.pickerEmpty": {
      en: ["leave empty for the picker", "leave empty for the picker", "leave empty for the picker", "leave it empty and pick from a list", "leave it empty and pick from a list instead"],
      yue: ["留空就用選擇器", "留空就用選擇器", "唔填就有個 list 畀你揀", "唔填就有個 list 畀你揀", "唔填就彈個 list 出嚟畀你揀"]
    },
    "ph.optional": {
      en: ["optional", "optional", "optional", "optional", "skip it if you like"],
      yue: ["可留空", "可留空", "可以唔填", "可以唔填", "唔想填就唔填"]
    },
    "ph.kebabTheme": {
      en: ["kebab-case name", "kebab-case name", "kebab-case name", "a kebab-case name", "a kebab-case name"],
      yue: ["kebab-case 名稱", "kebab-case 名稱", "kebab-case 個名", "kebab-case 個名", "kebab-case 嗰種名"]
    },
    "ph.petId": {
      en: ["id, or 'hide'", "id, or 'hide'", "id, or 'hide'", "an id, or 'hide'", "an id, or 'hide' to send it away"],
      yue: ["id，或者 'hide'", "id，或者 'hide'", "個 id，或者打 'hide'", "個 id，或者打 'hide'", "個 id，唔想見佢就打 'hide'"]
    },
    "ph.quickQuestion": {
      en: ["quick question", "quick question", "quick question", "a quick question", "just a quick one"],
      yue: ["問條快嘅", "問條快嘅", "問條快嘅", "諗起想問嗰樣", "問條快嘅啫"]
    },
    "ph.ideContext": {
      en: ["selection / open files", "selection / open files", "selection / open files", "the selection, or the open files", "the selection, or the open files"],
      yue: ["選取範圍 / 開咗嘅檔案", "選取範圍 / 開咗嘅檔案", "選取範圍 / 開住嘅檔案", "你 highlight 嗰橛，或者開住嘅檔案", "你 highlight 嗰橛，或者開住嘅檔案"]
    },
/* Batch 2 — context-menu actions. Each names the object it acts on and says plainly
   when it destroys something; the level changes the verb, never the noun or the
   warning. Placeholders carry user data (a search term, a profile name, a group), so
   they stay outside the translated text and appear identically at every level. */

    "menu.filterTo": {
      en: ["Filter to “{text}”", "Filter to “{text}”", "Filter to “{text}”", "Show only “{text}”", "Show me only “{text}”"],
      yue: ["篩選出「{text}」", "篩選出「{text}」", "淨係顯示「{text}」", "淨係睇「{text}」", "淨係畀我睇「{text}」"]
    },
    "menu.exclude": {
      en: ["Exclude “{text}”", "Exclude “{text}”", "Exclude “{text}”", "Hide “{text}”", "Anything but “{text}”"],
      yue: ["排除「{text}」", "排除「{text}」", "唔要「{text}」", "收埋「{text}」", "除咗「{text}」乜都得"]
    },
    "menu.startsWith": {
      en: ["Filter: starts with this", "Filter: starts with this", "Filter: starts with this", "Only things starting with this", "Only things that start with this"],
      yue: ["篩選：以此開頭", "篩選：以此開頭", "淨係要以呢個開頭嘅", "淨係要以呢個開頭嘅", "淨係要以呢個字開頭嗰啲"]
    },
    "menu.exactMatch": {
      en: ["Filter: exact match", "Filter: exact match", "Filter: exact match", "Only an exact match", "Only an exact match, nothing near it"],
      yue: ["篩選：完全相符", "篩選：完全相符", "淨係要一模一樣嘅", "淨係要一模一樣嘅", "要一模一樣，差少少都唔計"]
    },
    "menu.openRegexWith": {
      en: ["Open regex builder with this", "Open regex builder with this", "Open the regex builder with this", "Open the regex builder on this", "Take this into the regex builder"],
      yue: ["用呢個開 regex 產生器", "用呢個開 regex 產生器", "攞呢個開 regex builder", "攞呢個入去 regex builder", "拎呢個入 regex builder 度砌"]
    },
    "menu.loginApiKey": {
      en: ["Login with API key", "Login with API key", "Log in with an API key", "Log in with an API key", "Log in with an API key instead"],
      yue: ["用 API key 登入", "用 API key 登入", "用 API key 登入", "改用 API key 登入", "唔用 ChatGPT，改用 API key 登入"]
    },
    "menu.lookAgain": {
      en: ["Look again", "Look again", "Look again", "Have another look", "Go and look again"],
      yue: ["再睇一次", "再睇一次", "再睇多次", "再睇多次", "再去睇多次啦"]
    },
    "menu.priceInCost": {
      en: ["Price this in Cost", "Price this in Cost", "Price this in Cost", "Work out what this cost", "Go work out what this cost"],
      yue: ["喺成本頁計價", "喺成本頁計價", "去 Cost 度計價", "計吓呢筆使咗幾多", "去計吓呢筆到底使咗幾多"]
    },
    "menu.reread": {
      en: ["Re-read", "Re-read", "Re-read", "Read it again", "Read it again"],
      yue: ["重新讀取", "重新讀取", "重新讀過", "再讀多次", "再讀多次啦"]
    },
    "menu.rerunDoctor": {
      en: ["Re-run doctor", "Re-run doctor", "Re-run doctor", "Run doctor again", "Send the doctor back in"],
      yue: ["再行一次 doctor", "再行一次 doctor", "再行多次 doctor", "再叫 doctor 行多次", "再叫 doctor 入去睇多次"]
    },
    "menu.forkSession": {
      en: ["Fork session", "Fork session", "Fork this session", "Fork this session", "Split this session in two"],
      yue: ["分支工作階段", "分支工作階段", "分支呢個 session", "劈條分支出嚟", "將呢個 session 劈開兩份"]
    },
    "menu.moveToProfile": {
      en: ["Move to another profile", "Move to another profile", "Move to another profile", "Move it to another profile", "Move it over to another profile"],
      yue: ["移去另一個設定檔", "移去另一個設定檔", "搬去第二個 profile", "搬佢去第二個 profile", "搬佢過去第二個 profile"]
    },
    "menu.deleteSession": {
      en: ["Delete session", "Delete session", "Delete this session", "Delete this session", "Delete this session"],
      yue: ["刪除工作階段", "刪除工作階段", "刪咗呢個 session", "刪咗呢個 session", "刪咗呢個 session"]
    },
    "menu.openFlags": {
      en: ["Open flags", "Open flags", "Open its flags", "Open its flags", "Open its flags"],
      yue: ["開啟旗標", "開啟旗標", "開佢啲 flag", "開佢啲 flag", "開佢啲 flag 睇吓"]
    },
    "menu.filterToGroup": {
      en: ["Filter to group “{group}”", "Filter to group “{group}”", "Filter to the “{group}” group", "Only the “{group}” group", "Only the “{group}” group, thanks"],
      yue: ["篩選出「{group}」群組", "篩選出「{group}」群組", "淨係顯示「{group}」呢組", "淨係睇「{group}」呢組", "淨係畀我睇「{group}」嗰組"]
    },
    "menu.openSection": {
      en: ["Open section", "Open section", "Open this section", "Open this section", "Open this section"],
      yue: ["開啟區段", "開啟區段", "開呢個區段", "開呢個區段", "開呢個區段睇吓"]
    },
    "menu.resetSection": {
      en: ["Reset every key in section", "Reset every key in section", "Reset every key in this section", "Reset every key in this section", "Reset every key in this section"],
      yue: ["重設呢個區段所有設定", "重設呢個區段所有設定", "重設呢個區段入面每個 key", "呢個區段入面每個 key 打返原形", "呢個區段入面每個 key 打返原形"]
    },
    "menu.stopInstance": {
      en: ["Stop instance", "Stop instance", "Stop this instance", "Stop this instance", "Stop this instance"],
      yue: ["停止執行個體", "停止執行個體", "停咗呢個 instance", "叫停呢個 instance", "即刻停咗呢個 instance"]
    },
    "menu.useOnProfile": {
      en: ["Use on {profile}", "Use on {profile}", "Use it on {profile}", "Use it on {profile}", "Put this on {profile}"],
      yue: ["用喺 {profile}", "用喺 {profile}", "喺 {profile} 度用佢", "喺 {profile} 度用佢", "擺呢個落 {profile} 度"]
    },
    "menu.useModelOn": {
      en: ["Use this model on {profile}", "Use this model on {profile}", "Use this model on {profile}", "Put this model on {profile}", "Put this model on {profile}"],
      yue: ["喺 {profile} 用呢個模型", "喺 {profile} 用呢個模型", "喺 {profile} 度用呢個模型", "擺呢個模型落 {profile}", "擺呢個模型落 {profile} 度"]
    },
    "menu.showOnly": {
      en: ["Show only {what}", "Show only {what}", "Show only {what}", "Only {what}", "Only {what}, hide the rest"],
      yue: ["淨係顯示 {what}", "淨係顯示 {what}", "淨係睇 {what}", "淨係要 {what}", "淨係要 {what}，其他收埋"]
    },
    "menu.showOnlyThatDay": {
      en: ["Show only that day", "Show only that day", "Show only that day", "Only that day", "Only that one day"],
      yue: ["淨係顯示嗰日", "淨係顯示嗰日", "淨係睇嗰日", "淨係要嗰日", "淨係要嗰一日"]
    },
    "menu.setInputPerDay": {
      en: ["Set input tokens per day", "Set input tokens per day", "Set input tokens per day", "Set the input tokens per day", "Set how many input tokens a day"],
      yue: ["設定每日輸入 token", "設定每日輸入 token", "設定每日 input token", "設定每日用幾多 input token", "設定每日用幾多 input token"]
    },
    "menu.setOutputPerDay": {
      en: ["Set output tokens per day", "Set output tokens per day", "Set output tokens per day", "Set the output tokens per day", "Set how many output tokens a day"],
      yue: ["設定每日輸出 token", "設定每日輸出 token", "設定每日 output token", "設定每日用幾多 output token", "設定每日用幾多 output token"]
    },
    "menu.sessionAsDay": {
      en: ["Use the current session as one day", "Use the current session as one day", "Use the current session as one day", "Treat this session as a typical day", "Treat this session as one typical day"],
      yue: ["用而家嘅工作階段當一日", "用而家嘅工作階段當一日", "用而家個 session 當一日", "當呢個 session 就係平時一日", "當呢個 session 就係平時一日咁"]
    },
    "menu.openCostCalc": {
      en: ["Open the cost calculator", "Open the cost calculator", "Open the cost calculator", "Open the cost calculator", "Open the cost calculator"],
      yue: ["開啟成本計算機", "開啟成本計算機", "開個成本計數機", "開個成本計數機", "開個成本計數機出嚟"]
    },
    "menu.renameProfile": {
      en: ["Rename profile", "Rename profile", "Rename this profile", "Rename this profile", "Give this profile a new name"],
      yue: ["重新命名設定檔", "重新命名設定檔", "改呢個 profile 個名", "改呢個 profile 個名", "同呢個 profile 改個新名"]
    },
    "menu.duplicateProfile": {
      en: ["Duplicate profile", "Duplicate profile", "Duplicate this profile", "Duplicate this profile", "Make a copy of this profile"],
      yue: ["複製設定檔", "複製設定檔", "複製呢個 profile", "複製呢個 profile", "抄多份呢個 profile"]
    },
    "menu.resetProfileConfig": {
      en: ["Reset profile config", "Reset profile config", "Reset this profile's config", "Reset this profile's config", "Reset this profile's config"],
      yue: ["重設設定檔的設定", "重設設定檔的設定", "重設呢個 profile 嘅設定", "呢個 profile 嘅設定打返原形", "呢個 profile 嘅設定打返原形"]
    },
    "menu.deleteProfile": {
      en: ["Delete profile", "Delete profile", "Delete this profile", "Delete this profile", "Delete this profile"],
      yue: ["刪除設定檔", "刪除設定檔", "刪咗呢個 profile", "刪咗呢個 profile", "刪咗呢個 profile"]
    },
    "menu.removeInstance": {
      en: ["Remove instance", "Remove instance", "Remove this instance", "Remove this instance", "Remove this instance"],
      yue: ["移除執行個體", "移除執行個體", "移除呢個 instance", "剷咗呢個 instance", "剷咗呢個 instance"]
    },
    "menu.openTabManager": {
      en: ["Open the per-tab manager", "Open the per-tab manager", "Open the per-tab manager", "Open the per-tab manager", "Open the per-tab manager"],
      yue: ["開啟分頁管理員", "開啟分頁管理員", "開個 per-tab 管理員", "開個 per-tab 管理員", "開個 per-tab 管理員出嚟"]
    },
    "menu.spawnForTab": {
      en: ["Spawn for this tab", "Spawn for this tab", "Spawn one for this tab", "Spawn one for this tab", "Spawn one just for this tab"],
      yue: ["為呢個分頁開啟", "為呢個分頁開啟", "為呢個 tab 開一個", "為呢個 tab 開一個", "淨係為呢個 tab 開一個"]
    },
    "menu.backToComposer": {
      en: ["Put back in composer", "Put back in composer", "Put it back in the composer", "Put it back in the composer", "Drop it back in the composer"],
      yue: ["放返入輸入框", "放返入輸入框", "放返入 composer 度", "擺返落 composer 度", "掉返落 composer 度"]
    },
    "menu.filterSessionsByText": {
      en: ["Filter sessions by this text", "Filter sessions by this text", "Filter sessions by this text", "Find sessions with this text", "Find the sessions with this text in them"],
      yue: ["用呢段文字篩選工作階段", "用呢段文字篩選工作階段", "用呢段字篩 session", "搵有呢段字嘅 session", "搵晒啲入面有呢段字嘅 session"]
    },
    "menu.openWizard": {
      en: ["Open wizard", "Open wizard", "Open the wizard", "Open the wizard", "Open the wizard"],
      yue: ["開啟精靈", "開啟精靈", "開個 wizard", "開個 wizard", "開個 wizard 出嚟"]
    },
    "menu.insertIntoComposer": {
      en: ["Insert into composer", "Insert into composer", "Insert it into the composer", "Drop it into the composer", "Drop it into the composer"],
      yue: ["插入輸入框", "插入輸入框", "插入 composer 度", "掉落 composer 度", "掉落 composer 度"]
    },
    "menu.unsetFlag": {
      en: ["Unset this flag", "Unset this flag", "Unset this flag", "Unset this flag", "Unset this flag"],
      yue: ["取消設定呢個旗標", "取消設定呢個旗標", "取消呢個 flag", "唔要呢個 flag", "唔要呢個 flag"]
    },
    "menu.findCommandsWithFlag": {
      en: ["Find commands with this flag", "Find commands with this flag", "Find commands with this flag", "Find every command with this flag", "Find every command that takes this flag"],
      yue: ["搵有呢個旗標嘅指令", "搵有呢個旗標嘅指令", "搵有呢個 flag 嘅指令", "搵晒有呢個 flag 嘅指令", "搵晒邊啲指令收呢個 flag"]
    },
    "menu.resetToDefault": {
      en: ["Reset to default", "Reset to default", "Reset to the default", "Put it back to the default", "Put it back to the default"],
      yue: ["重設為預設值", "重設為預設值", "還原做預設值", "打返做預設值", "打返做預設值"]
    },
    "menu.restoreSnapshot": {
      en: ["Restore this snapshot", "Restore this snapshot", "Restore this snapshot", "Go back to this snapshot", "Go back to this snapshot"],
      yue: ["還原呢個快照", "還原呢個快照", "還原去呢個快照", "返去呢個快照", "返去呢個快照嗰陣"]
    },
    "menu.editAppearanceFor": {
      en: ["Edit appearance — {name}", "Edit appearance — {name}", "Edit appearance — {name}", "Restyle {name}", "Restyle {name}"],
      yue: ["編輯外觀 — {name}", "編輯外觀 — {name}", "改吓 {name} 個樣", "改吓 {name} 個樣", "同 {name} 換個樣"]
    },
    "menu.resetElementAppearance": {
      en: ["Reset this element's appearance", "Reset this element's appearance", "Reset this element's appearance", "Put this element back to normal", "Put this element back the way it was"],
      yue: ["重設呢個元素嘅外觀", "重設呢個元素嘅外觀", "呢個元素個樣打返原形", "呢個元素打返原形", "呢個元素打返原形，當冇改過"]
    },
    "prompt.avgInputPerDay": {
      en: ["Average input tokens per day", "Average input tokens per day", "Average input tokens per day", "How many input tokens on an average day", "How many input tokens on an average day"],
      yue: ["每日平均輸入 token", "每日平均輸入 token", "每日平均用幾多 input token", "平時一日用幾多 input token", "平時一日用幾多 input token"]
    },
    "prompt.avgOutputPerDay": {
      en: ["Average output tokens per day", "Average output tokens per day", "Average output tokens per day", "How many output tokens on an average day", "How many output tokens on an average day"],
      yue: ["每日平均輸出 token", "每日平均輸出 token", "每日平均用幾多 output token", "平時一日用幾多 output token", "平時一日用幾多 output token"]
    },
/* Batch 3 — option rows, cost fields, style toggles and preset actions. The date
   presets and the two placeholder rows carry no facts to protect beyond their own
   meaning, so they move least between levels; the cost descriptions name real numbers
   (Plus is 20, Pro is 200) and those numbers are identical at level 1 and level 5. */

    "opt.days7": {
      en: ["7 d", "7 d", "7 days", "7 days", "last 7 days"],
      yue: ["7 日", "7 日", "7 日", "近 7 日", "近 7 日"]
    },
    "opt.days30": {
      en: ["30 d", "30 d", "30 days", "30 days", "last 30 days"],
      yue: ["30 日", "30 日", "30 日", "近 30 日", "近 30 日"]
    },
    "opt.days90": {
      en: ["90 d", "90 d", "90 days", "90 days", "last 90 days"],
      yue: ["90 日", "90 日", "90 日", "近 90 日", "近 90 日"]
    },
    "opt.months6": {
      en: ["6 mo", "6 mo", "6 months", "6 months", "last 6 months"],
      yue: ["6 個月", "6 個月", "6 個月", "近半年", "近半年"]
    },
    "opt.year1": {
      en: ["1 y", "1 y", "1 year", "1 year", "last year"],
      yue: ["1 年", "1 年", "1 年", "近一年", "近一年"]
    },
    "opt.years2": {
      en: ["2 y", "2 y", "2 years", "2 years", "last two years"],
      yue: ["2 年", "2 年", "2 年", "近兩年", "近兩年"]
    },
    "opt.unset": {
      en: ["— unset —", "— unset —", "— unset —", "— leave it unset —", "— leave it unset —"],
      yue: ["—— 未設定 ——", "—— 未設定 ——", "—— 未設定 ——", "—— 唔設定佢 ——", "—— 唔設定佢 ——"]
    },
    "opt.default": {
      en: ["— default —", "— default —", "— default —", "— whatever the default is —", "— whatever the default is —"],
      yue: ["—— 預設 ——", "—— 預設 ——", "—— 預設 ——", "—— 預設嗰個 ——", "—— 預設嗰個 ——"]
    },
    "opt.inputTokens": {
      en: ["Input tokens", "Input tokens", "Input tokens", "Input tokens", "Input tokens"],
      yue: ["輸入 token", "輸入 token", "input token", "input token", "input token"]
    },
    "desc.inputTokens": {
      en: ["Prompt, files and tool output sent to the model.", "Prompt, files and tool output sent to the model.", "Prompt, files and tool output sent to the model.", "Everything you send it: prompt, files, tool output.", "Everything you send it — prompt, files, tool output, the lot."],
      yue: ["送去畀模型嘅提示、檔案同工具輸出。", "送去畀模型嘅提示、檔案同工具輸出。", "你送畀佢嘅 prompt、檔案同工具輸出。", "你送畀佢嘅全部嘢：prompt、檔案、工具輸出。", "你送畀佢嘅全部嘢 — prompt、檔案、工具輸出，一樣都唔少。"]
    },
    "opt.outputTokens": {
      en: ["Output tokens", "Output tokens", "Output tokens", "Output tokens", "Output tokens"],
      yue: ["輸出 token", "輸出 token", "output token", "output token", "output token"]
    },
    "desc.outputTokens": {
      en: ["Reasoning plus visible answer and patches.", "Reasoning plus visible answer and patches.", "Reasoning plus the visible answer and any patches.", "The thinking you never see, plus the answer and patches you do.", "The thinking you never see, plus the answer and the patches you do."],
      yue: ["推理，加埋你見到嘅答案同 patch。", "推理，加埋你見到嘅答案同 patch。", "推理加埋見到嘅答案同啲 patch。", "你見唔到嗰啲諗嘢，加埋你見到嘅答案同 patch。", "你見唔到嗰啲諗嘢，加埋你見到嘅答案同 patch，全部計。"]
    },
    "opt.turns": {
      en: ["Turns", "Turns", "Turns", "Turns", "How many back-and-forths"],
      yue: ["回合", "回合", "幾多回合", "傾咗幾多轉", "你哋一嚟一往幾多轉"]
    },
    "desc.turns": {
      en: ["Used for the per-turn average.", "Used for the per-turn average.", "Used for the per-turn average.", "Only used to work out the per-turn average.", "Only used to work out the per-turn average."],
      yue: ["用嚟計每回合平均。", "用嚟計每回合平均。", "用嚟計每回合平均。", "淨係用嚟計每回合平均。", "淨係用嚟計每回合平均，冇第二樣。"]
    },
    "opt.planPerMonth": {
      en: ["Your plan ($/month)", "Your plan ($/month)", "Your plan ($/month)", "What your plan costs ($/month)", "What your plan costs ($/month)"],
      yue: ["你嘅方案（美元/月）", "你嘅方案（美元/月）", "你個 plan（美元/月）", "你個 plan 幾錢（美元/月）", "你個 plan 幾錢一個月（美元）"]
    },
    "desc.planPerMonth": {
      en: ["Plus is 20, Pro is 200. Set 0 if you use an API key.", "Plus is 20, Pro is 200. Set 0 if you use an API key.", "Plus is 20, Pro is 200. Put 0 if you pay by API key.", "Plus is 20, Pro is 200 — put 0 if you pay by API key instead.", "Plus is 20, Pro is 200. Put 0 if you pay by API key instead."],
      yue: ["Plus 係 20，Pro 係 200。用 API key 就填 0。", "Plus 係 20，Pro 係 200。用 API key 就填 0。", "Plus 20，Pro 200。用 API key 嘅填 0。", "Plus 20，Pro 200 — 用 API key 畀錢嘅就填 0。", "Plus 20，Pro 200。用 API key 畀錢嘅就填 0。"]
    },
    "menu.showOnlyKind": {
      en: ["Show only {kind} revisions", "Show only {kind} revisions", "Show only {kind} revisions", "Only the {kind} revisions", "Only the {kind} revisions, hide the rest"],
      yue: ["淨係顯示 {kind} 修訂", "淨係顯示 {kind} 修訂", "淨係睇 {kind} 嗰啲修訂", "淨係要 {kind} 嗰啲修訂", "淨係要 {kind} 嗰啲修訂，其他收埋"]
    },
    "opt.italic": {
      en: ["Italic", "Italic", "Italic", "Italic", "Italic"],
      yue: ["斜體", "斜體", "斜體", "打斜", "打斜"]
    },
    "opt.underline": {
      en: ["Underline", "Underline", "Underline", "Underline", "Underline"],
      yue: ["底線", "底線", "底線", "加底線", "加底線"]
    },
    "opt.strike": {
      en: ["Strike", "Strike", "Strike", "Strike through", "Strike through"],
      yue: ["刪除線", "刪除線", "刪除線", "劃走佢", "劃走佢"]
    },
    "opt.wide": {
      en: ["Wide", "Wide", "Wide", "Wide spacing", "Wide spacing"],
      yue: ["寬鬆", "寬鬆", "疏啲", "字距疏啲", "字距疏啲"]
    },
    "opt.fontMonoBundled": {
      en: ["Roboto Mono (bundled)", "Roboto Mono (bundled)", "Roboto Mono — bundled", "Roboto Mono — comes with the app", "Roboto Mono — comes with the app"],
      yue: ["Roboto Mono（內置）", "Roboto Mono（內置）", "Roboto Mono — 內置", "Roboto Mono — 出廠就有", "Roboto Mono — 出廠就有"]
    },
    "opt.fontSystemUi": {
      en: ["System UI", "System UI", "System UI", "Whatever Windows uses", "Whatever Windows uses"],
      yue: ["系統介面字型", "系統介面字型", "系統介面字型", "Windows 用嗰隻", "Windows 用嗰隻"]
    },
    "opt.thisWorkspace": {
      en: ["this workspace", "this workspace", "this workspace", "this workspace", "right here"],
      yue: ["呢個工作區", "呢個工作區", "呢個工作區", "呢度", "就喺呢度"]
    },
    "appear.savePreset": {
      en: ["Save the current appearance as a preset…", "Save the current appearance as a preset…", "Save this appearance as a preset…", "Keep this look as a preset…", "Keep this look as a preset…"],
      yue: ["將而家嘅外觀存做預設…", "將而家嘅外觀存做預設…", "將呢個外觀存做預設…", "留低呢個樣做預設…", "留低呢個樣做預設…"]
    },
    "appear.deletePreset": {
      en: ["Delete “{name}”", "Delete “{name}”", "Delete “{name}”", "Delete “{name}”", "Delete “{name}”"],
      yue: ["刪除「{name}」", "刪除「{name}」", "刪咗「{name}」", "刪咗「{name}」", "刪咗「{name}」"]
    },
/* Batch 4 — the two tab-menu actions the existing tab.* keys do not already cover.
   tab.groupNew is "New group" (make one); this is "move THIS tab into a new one", and
   tab.groupRemove dissolves a whole group while this one only lifts a single tab out.
   Two menu entries that read alike and do very different things need two keys. */

    "tab.moveToNewGroup": {
      en: ["Move to a new group…", "Move to a new group…", "Move this tab into a new group…", "Start a new group with this tab…", "Start a new group with this tab…"],
      yue: ["移去新群組…", "移去新群組…", "將呢個 tab 移入一個新群組…", "用呢個 tab 開個新群組…", "用呢個 tab 開個新群組…"]
    },
    "tab.removeFromGroup": {
      en: ["Remove from group", "Remove from group", "Take this tab out of its group", "Take this tab out of its group", "Lift this tab out of its group"],
      yue: ["移出群組", "移出群組", "將呢個 tab 抽返出個群組", "將呢個 tab 抽返出嚟", "將呢個 tab 抽返出個組"]
    },
/* Batch 5 — the command palette. Group headings, the one-word hint on the right of
   each row, and the four action rows. The YOLO row's subtitle names the two settings
   it actually writes, at every level: a row that says what it turns on but not that it
   is approval_policy = never is a row that gets somebody in trouble. */

    "palette.groupGoTo": {
      en: ["Go to", "Go to", "Go to", "Go to", "Take me to"],
      yue: ["前往", "前往", "去邊度", "去邊度", "帶我去"]
    },
    "palette.groupProfile": {
      en: ["Profile", "Profile", "Profile", "Profiles", "Profiles"],
      yue: ["設定檔", "設定檔", "Profile", "Profile", "Profile"]
    },
    "palette.groupSession": {
      en: ["Session", "Session", "Session", "Sessions", "Sessions"],
      yue: ["工作階段", "工作階段", "Session", "Session", "Session"]
    },
    "palette.groupCommand": {
      en: ["Command", "Command", "Command", "Commands", "Commands"],
      yue: ["指令", "指令", "指令", "指令", "指令"]
    },
    "palette.groupSlash": {
      en: ["Slash", "Slash", "Slash", "Slash commands", "Slash commands"],
      yue: ["斜線指令", "斜線指令", "Slash 指令", "Slash 指令", "Slash 指令"]
    },
    "palette.groupSetting": {
      en: ["Setting", "Setting", "Setting", "Settings", "Settings"],
      yue: ["設定", "設定", "設定", "設定", "設定"]
    },
    "palette.groupPlugin": {
      en: ["Plugin", "Plugin", "Plugin", "Plugins", "Plugins"],
      yue: ["外掛", "外掛", "外掛", "外掛", "外掛"]
    },
    "palette.groupFeature": {
      en: ["Feature", "Feature", "Feature", "Feature flags", "Feature flags"],
      yue: ["功能旗標", "功能旗標", "功能 flag", "功能 flag", "功能 flag"]
    },
    "palette.groupAction": {
      en: ["Action", "Action", "Action", "Actions", "Things to do"],
      yue: ["動作", "動作", "動作", "可以做嘅嘢", "可以做嘅嘢"]
    },
    "palette.hintGo": {
      en: ["go", "go", "go", "go", "go"],
      yue: ["去", "去", "去", "去", "去"]
    },
    "palette.hintSwitch": {
      en: ["switch", "switch", "switch", "switch", "switch"],
      yue: ["切換", "切換", "轉", "轉", "轉"]
    },
    "palette.hintOpen": {
      en: ["open", "open", "open", "open", "open"],
      yue: ["開啟", "開啟", "開", "開", "開"]
    },
    "palette.hintConsole": {
      en: ["console", "console", "console", "console", "console"],
      yue: ["主控台", "主控台", "console", "console", "console"]
    },
    "palette.hintWizard": {
      en: ["wizard", "wizard", "wizard", "wizard", "wizard"],
      yue: ["精靈", "精靈", "wizard", "wizard", "wizard"]
    },
    "palette.hintToggle": {
      en: ["toggle", "toggle", "toggle", "toggle", "toggle"],
      yue: ["切換", "切換", "扳", "扳", "扳"]
    },
    "palette.hintGit": {
      en: ["git", "git", "git", "git", "git"],
      yue: ["git", "git", "git", "git", "git"]
    },
    "palette.hintWsl": {
      en: ["wsl", "wsl", "wsl", "wsl", "wsl"],
      yue: ["wsl", "wsl", "wsl", "wsl", "wsl"]
    },
    "palette.hintTheme": {
      en: ["theme", "theme", "theme", "theme", "theme"],
      yue: ["主題", "主題", "主題", "主題", "主題"]
    },
    "palette.yoloOn": {
      en: ["Enable YOLO mode", "Enable YOLO mode", "Turn YOLO mode on", "Turn YOLO mode on", "Turn YOLO mode on"],
      yue: ["開啟 YOLO 模式", "開啟 YOLO 模式", "開 YOLO 模式", "開 YOLO 模式", "開 YOLO 模式"]
    },
    "palette.yoloOff": {
      en: ["Turn YOLO off", "Turn YOLO off", "Turn YOLO mode off", "Turn YOLO mode off", "Turn YOLO mode off"],
      yue: ["關閉 YOLO", "關閉 YOLO", "熄 YOLO 模式", "熄 YOLO 模式", "熄 YOLO 模式"]
    },
    "palette.undoLast": {
      en: ["Undo last change", "Undo last change", "Undo the last change", "Undo the last change", "Undo the last change"],
      yue: ["復原上一個改動", "復原上一個改動", "復原上一個改動", "撤返上一個改動", "撤返上一個改動"]
    },
    "palette.undoNothing": {
      en: ["nothing yet", "nothing yet", "nothing yet", "nothing yet", "nothing to undo yet"],
      yue: ["未有嘢", "未有嘢", "仲未有嘢", "仲未有嘢", "仲未有嘢好撤"]
    },
    "palette.spawnEveryTab": {
      en: ["Spawn a WSL instance for every tab", "Spawn a WSL instance for every tab", "Spawn a WSL instance for every tab", "Give every tab its own WSL instance", "Give every tab its own WSL instance"],
      yue: ["為每個分頁開一個 WSL 執行個體", "為每個分頁開一個 WSL 執行個體", "為每個 tab 開一個 WSL instance", "每個 tab 都畀佢自己一個 WSL", "每個 tab 都畀佢自己一個 WSL"]
    },
    "palette.perTabRuntimes": {
      en: ["per-tab runtimes", "per-tab runtimes", "per-tab runtimes", "one runtime per tab", "one runtime per tab"],
      yue: ["每個分頁一個執行環境", "每個分頁一個執行環境", "每個 tab 一個 runtime", "每個 tab 一個 runtime", "每個 tab 一個 runtime"]
    },
    "palette.toLight": {
      en: ["Switch to light theme", "Switch to light theme", "Switch to the light theme", "Switch to the light theme", "Switch to the light theme"],
      yue: ["轉做淺色主題", "轉做淺色主題", "轉淺色主題", "轉淺色主題", "轉返淺色主題"]
    },
    "palette.toDark": {
      en: ["Switch to dark theme", "Switch to dark theme", "Switch to the dark theme", "Switch to the dark theme", "Switch to the dark theme"],
      yue: ["轉做深色主題", "轉做深色主題", "轉深色主題", "轉深色主題", "轉返深色主題"]
    },
    "palette.m3Palette": {
      en: ["Material 3 palette", "Material 3 palette", "Material 3 palette", "Material 3 palette", "Material 3 palette"],
      yue: ["Material 3 色盤", "Material 3 色盤", "Material 3 色盤", "Material 3 色盤", "Material 3 色盤"]
    },
/* Batch 6 — header chips, their context-menu titles, and the dialog titles. The
   sandbox and YOLO chips describe settings that remove protections, so their hint
   text names what is actually bypassed at every level; only the wording moves. */

    "chip.model": {
      en: ["Model (/model)", "Model (/model)", "Model — also /model", "Model — also /model", "Model — also /model"],
      yue: ["模型（/model）", "模型（/model）", "模型 — 都可以用 /model", "模型 — 都可以用 /model", "模型 — 打 /model 都得"]
    },
    "chip.approval": {
      en: ["Approval policy", "Approval policy", "Approval policy", "How much it asks before acting", "How much it asks you before it acts"],
      yue: ["批准政策", "批准政策", "批准政策", "做嘢之前問你幾多", "做嘢之前要問你幾多先"]
    },
    "chip.sandbox": {
      en: ["Sandbox policy", "Sandbox policy", "Sandbox policy — what it may touch on disk", "Sandbox policy — what it may touch on disk", "Sandbox policy — what it may touch on disk"],
      yue: ["沙盒政策", "沙盒政策", "沙盒政策 — 佢喺你部機掂得咩", "沙盒政策 — 佢喺你部機掂得咩", "沙盒政策 — 佢喺你部機掂得邊啲嘢"]
    },
    "chip.wsl": {
      en: ["Per-tab WSL runtime — click to spawn or stop, right-click for the manager", "Per-tab WSL runtime — click to spawn or stop, right-click for the manager", "Per-tab WSL runtime. Click to spawn or stop it; right-click for the manager.", "This tab's own WSL runtime. Click to spawn or stop it; right-click for the manager.", "This tab's own WSL runtime. Click to spawn or stop it; right-click for the manager."],
      yue: ["每個分頁專屬嘅 WSL 執行環境 — 撳一下開或者停，右鍵開管理員", "每個分頁專屬嘅 WSL 執行環境 — 撳一下開或者停，右鍵開管理員", "呢個 tab 自己嘅 WSL runtime。撳一下開或者停，右鍵開管理員。", "呢個 tab 自己嘅 WSL runtime。撳一下開或者停，右鍵開管理員。", "呢個 tab 自己嘅 WSL runtime。撳一下開或者停，右 click 就開管理員。"]
    },
    "chip.yolo": {
      en: ["One-click bypass, remembered", "One-click bypass, remembered", "One click sets approval_policy = never and sandbox_mode = danger-full-access, and it is remembered", "One click sets approval_policy = never and sandbox_mode = danger-full-access, and it is remembered", "One click sets approval_policy = never and sandbox_mode = danger-full-access — and it stays that way until you change it back"],
      yue: ["一撳就繞過，仲會記住", "一撳就繞過，仲會記住", "撳一下即刻設定 approval_policy = never 同 sandbox_mode = danger-full-access，而且會記住", "撳一下即刻設定 approval_policy = never 同 sandbox_mode = danger-full-access，而且會記住", "撳一下就 approval_policy = never 加 sandbox_mode = danger-full-access — 唔改返就一直咁"]
    },
    "chip.modelPriced": {
      en: ["Model priced in the headline", "Model priced in the headline", "The model the headline figure is priced against", "The model the headline figure is priced against", "The model the headline figure is priced against"],
      yue: ["標題價格所用嘅模型", "標題價格所用嘅模型", "上面個價係照呢個模型計", "上面個價係照呢個模型計", "上面個價就係照呢個模型計出嚟"]
    },
    "chip.yoloOn": {
      en: ["YOLO on", "YOLO on", "YOLO on", "YOLO on", "YOLO on"],
      yue: ["YOLO 開咗", "YOLO 開咗", "YOLO 開咗", "YOLO 開咗", "YOLO 開咗"]
    },
    "menu.titleModel": {
      en: ["Model", "Model", "Model", "Model", "Model"],
      yue: ["模型", "模型", "模型", "模型", "模型"]
    },
    "menu.titleApproval": {
      en: ["Approval policy", "Approval policy", "Approval policy", "Approval policy", "Approval policy"],
      yue: ["批准政策", "批准政策", "批准政策", "批准政策", "批准政策"]
    },
    "menu.titleSandbox": {
      en: ["Sandbox", "Sandbox", "Sandbox", "Sandbox", "Sandbox"],
      yue: ["沙盒", "沙盒", "沙盒", "沙盒", "沙盒"]
    },
    "menu.titleWslRuntime": {
      en: ["WSL runtime", "WSL runtime", "WSL runtime", "WSL runtime", "WSL runtime"],
      yue: ["WSL 執行環境", "WSL 執行環境", "WSL runtime", "WSL runtime", "WSL runtime"]
    },
    "dlg.languageMode": {
      en: ["Language mode", "Language mode", "Language mode", "Language mode", "Language mode"],
      yue: ["語言模式", "語言模式", "語言模式", "語言模式", "語言模式"]
    },
    "dlg.narratedLanguage": {
      en: ["Narrated language", "Narrated language", "Narrated language", "Which language it speaks", "Which language it speaks"],
      yue: ["旁白語言", "旁白語言", "旁白用邊種語言", "佢講邊種話", "佢用邊種話講"]
    },
    "dlg.externalEditor": {
      en: ["External editor", "External editor", "External editor", "External editor", "External editor"],
      yue: ["外部編輯器", "外部編輯器", "外部編輯器", "用邊個編輯器", "用邊個編輯器"]
    },
    "dlg.theme": {
      en: ["Theme", "Theme", "Theme", "Theme", "Theme"],
      yue: ["主題", "主題", "主題", "主題", "主題"]
    },
    "dlg.namedPresets": {
      en: ["Named presets", "Named presets", "Named presets", "Saved looks", "Saved looks"],
      yue: ["已命名預設", "已命名預設", "已命名預設", "儲低咗嘅樣", "儲低咗嘅樣"]
    },
    "dlg.namePreset": {
      en: ["Name this preset", "Name this preset", "Name this preset", "Give this preset a name", "Give this preset a name"],
      yue: ["為呢個預設命名", "為呢個預設命名", "同呢個預設改個名", "同呢個預設改個名", "同呢個預設改個名"]
    },
    "dlg.dateRange": {
      en: ["Date range", "Date range", "Date range", "Which dates", "Which dates"],
      yue: ["日期範圍", "日期範圍", "日期範圍", "邊段日子", "邊段日子"]
    },
    "dlg.renameTab": {
      en: ["Rename “{name}”", "Rename “{name}”", "Rename “{name}”", "Rename “{name}”", "Rename “{name}”"],
      yue: ["重新命名「{name}」", "重新命名「{name}」", "同「{name}」改名", "同「{name}」改名", "同「{name}」改個名"]
    },
    "dlg.renameGroup": {
      en: ["Rename group", "Rename group", "Rename group", "Rename this group", "Rename this group"],
      yue: ["重新命名群組", "重新命名群組", "同個群組改名", "同呢個群組改名", "同呢個群組改個名"]
    },
    "dlg.groupColour": {
      en: ["Group colour", "Group colour", "Group colour", "Group colour", "Pick the group a colour"],
      yue: ["群組顏色", "群組顏色", "群組顏色", "群組顏色", "揀個顏色畀個群組"]
    },
    "dlg.searchStrip": {
      en: ["Search this tab strip", "Search this tab strip", "Search this tab strip", "Find a tab in this strip", "Find a tab in this strip"],
      yue: ["搜尋呢條分頁列", "搜尋呢條分頁列", "搵呢條 tab 列", "喺呢條 tab 列度搵", "喺呢條 tab 列度搵返個 tab"]
    },
    "dlg.whichGroup": {
      en: ["Which group?", "Which group?", "Which group?", "Which group?", "Which group are we looking in?"],
      yue: ["邊個群組？", "邊個群組？", "邊個群組？", "搵邊個群組？", "我哋要搵邊個群組？"]
    },
    "dlg.searchInGroup": {
      en: ["Search “{group}”", "Search “{group}”", "Search “{group}”", "Find a tab in “{group}”", "Find a tab in “{group}”"],
      yue: ["搜尋「{group}」", "搜尋「{group}」", "搵「{group}」", "喺「{group}」度搵 tab", "喺「{group}」度搵返個 tab"]
    },
    "dlg.searchGroups": {
      en: ["Search tab groups", "Search tab groups", "Search tab groups", "Find a tab group", "Find a tab group"],
      yue: ["搜尋分頁群組", "搜尋分頁群組", "搵 tab 群組", "搵返個 tab 群組", "搵返個 tab 群組"]
    },
    "dlg.searchEverywhere": {
      en: ["Every tab, every workspace", "Every tab, every workspace", "Every tab, every workspace", "Every tab, in every workspace", "Every tab, in every workspace"],
      yue: ["所有工作區嘅所有分頁", "所有工作區嘅所有分頁", "所有工作區嘅所有 tab", "每個工作區、每個 tab", "每個工作區、每個 tab，一個都唔走雞"]
    },
    "dlg.overflowTabs": {
      en: ["Tabs that do not fit", "Tabs that do not fit", "Tabs that do not fit", "The tabs that ran out of room", "The tabs that ran out of room"],
      yue: ["擺唔落嘅分頁", "擺唔落嘅分頁", "擺唔落嘅 tab", "冇位擺嗰啲 tab", "冇位擺、擠咗出去嗰啲 tab"]
    },
    "dlg.fontFamily": {
      en: ["Font family — {target}", "Font family — {target}", "Font family — {target}", "Typeface for {target}", "Typeface for {target}"],
      yue: ["字型 — {target}", "字型 — {target}", "字型 — {target}", "{target} 用邊隻字", "{target} 用邊隻字"]
    },
    "dlg.wslDistribution": {
      en: ["WSL distribution", "WSL distribution", "WSL distribution", "Which WSL distribution", "Which WSL distribution"],
      yue: ["WSL 發行版", "WSL 發行版", "WSL 發行版", "用邊個 WSL 發行版", "用邊個 WSL 發行版"]
    },
    "dlg.lifetimeWindow": {
      en: ["Lifetime window", "Lifetime window", "Lifetime window", "How far ahead to project", "How far ahead to project"],
      yue: ["累計期間", "累計期間", "累計期間", "推算幾耐", "推算去到幾耐"]
    },
    "dlg.everyAction": {
      en: ["Every action", "Every action", "Every action", "Every action", "Every action"],
      yue: ["所有動作", "所有動作", "所有動作", "所有動作", "所有動作"]
    },
    "console.doctor": {
      en: ["Doctor", "Doctor", "Doctor", "Doctor", "Doctor"],
      yue: ["診斷", "診斷", "Doctor", "Doctor", "Doctor"]
    },
    "console.account": {
      en: ["Account", "Account", "Account", "Account", "Account"],
      yue: ["帳戶", "帳戶", "帳戶", "帳戶", "帳戶"]
    },
    "console.usage": {
      en: ["Usage", "Usage", "Usage", "Usage", "Usage"],
      yue: ["用量", "用量", "用量", "用量", "用量"]
    },
    "console.cloudTasks": {
      en: ["Cloud tasks", "Cloud tasks", "Cloud tasks", "Cloud tasks", "Cloud tasks"],
      yue: ["雲端工作", "雲端工作", "雲端工作", "雲端工作", "雲端工作"]
    },
/* Batch 7 — the titles on the search-filter menus that hang off each search bar, and
   the two remaining menu headings. Each names the surface it filters, because the same
   menu opens from a dozen different search fields and the heading is the only thing
   telling you which one you are about to narrow. */

    "menu.titleSearch": {
      en: ["Search", "Search", "Search", "Search", "Search"],
      yue: ["搜尋", "搜尋", "搜尋", "搵嘢", "搵嘢"]
    },
    "menu.titleFilter": {
      en: ["Filter", "Filter", "Filter", "Filter", "Filter"],
      yue: ["篩選", "篩選", "篩選", "篩走啲嘢", "篩走啲嘢"]
    },
    "menu.titleCommandSearch": {
      en: ["Command search", "Command search", "Command search", "Search the commands", "Search the commands"],
      yue: ["指令搜尋", "指令搜尋", "指令搜尋", "搵指令", "搵指令"]
    },
    "menu.titleOptionFilter": {
      en: ["Option filter", "Option filter", "Option filter", "Filter these options", "Filter these options"],
      yue: ["選項篩選", "選項篩選", "選項篩選", "篩呢啲選項", "篩呢啲選項"]
    },
    "menu.titlePaletteSearch": {
      en: ["Palette search", "Palette search", "Palette search", "Search the palette", "Search the palette"],
      yue: ["指令面板搜尋", "指令面板搜尋", "指令面板搜尋", "搵指令面板", "搵指令面板"]
    },
    "menu.titleChangelogSearch": {
      en: ["Changelog search", "Changelog search", "Changelog search", "Search the changelog", "Search the changelog"],
      yue: ["更新紀錄搜尋", "更新紀錄搜尋", "更新紀錄搜尋", "搵更新紀錄", "搵更新紀錄"]
    },
    "menu.titleStudioSearch": {
      en: ["Studio search", "Studio search", "Studio search", "Search the settings", "Search the settings"],
      yue: ["Studio 搜尋", "Studio 搜尋", "Studio 搜尋", "搵設定", "搵設定"]
    },
    "menu.titleHistorySearch": {
      en: ["History search", "History search", "History search", "Search the history", "Search the history"],
      yue: ["歷史搜尋", "歷史搜尋", "歷史搜尋", "搵歷史紀錄", "搵歷史紀錄"]
    },
    "menu.titleLifetimeCost": {
      en: ["Lifetime cost", "Lifetime cost", "Lifetime cost", "Cost over time", "Cost over time"],
      yue: ["累計成本", "累計成本", "累計成本", "長遠使幾多", "長遠使幾多"]
    },
    "menu.titleFindTabs": {
      en: ["Find tabs", "Find tabs", "Find tabs", "Find tabs", "Find tabs"],
      yue: ["搵分頁", "搵分頁", "搵 tab", "搵 tab", "搵返啲 tab"]
    },
/* Batch 8 — the Studio settings panel: six section headings, their descriptions, and
   every row's title, description and button word. These reached the interface as
   positional arguments to pick()/toggle()/slider()/action(), which is why no sweep for
   `label:` ever saw them.

   The disclosure text is the one place the funny slider explains itself, so it holds
   its facts hardest: at every level it still says the level changes voice only, that
   errors and destructive confirmations are included, and that no category is exempt.
   A disclosure that got funnier by disclosing less would be the one joke this app must
   not make. */

    "act.reveal": {
      en: ["Reveal", "Reveal", "Reveal", "Show me", "Show me where"],
      yue: ["顯示位置", "顯示位置", "顯示位置", "帶我去睇", "帶我去睇吓喺邊"]
    },
    "act.prune": {
      en: ["Prune", "Prune", "Prune", "Trim it", "Trim it down"],
      yue: ["修剪", "修剪", "剪走舊嘅", "剪走舊嘅", "剪走啲舊嘢"]
    },
    "act.preview": {
      en: ["Preview", "Preview", "Preview", "Show me", "Show me one"],
      yue: ["預覽", "預覽", "預覽", "畀我睇吓", "畀我睇吓一個"]
    },
    "act.resetAll": {
      en: ["Reset all", "Reset all", "Reset all", "Reset the lot", "Reset the lot"],
      yue: ["全部重設", "全部重設", "全部打返原形", "全部打返原形", "成批打返原形"]
    },

    "studio.langTitle": {
      en: ["Language", "Language", "Language", "Language", "Language"],
      yue: ["語言", "語言", "語言", "語言", "語言"]
    },
    "studio.langDesc": {
      en: ["Three modes and two independent funny sliders. The level changes the voice only — every message still names the file, the count and what is irreversible, at level 1 and at level 5 alike. This includes errors, warnings and destructive confirmations; no category is exempt.",
        "Three modes and two independent funny sliders. The level changes the voice only — every message still names the file, the count and what is irreversible, at level 1 and at level 5 alike. This includes errors, warnings and destructive confirmations; no category is exempt.",
        "Three modes and two independent funny sliders. The level changes the voice only: every message still names the file, the count and what is irreversible, at level 1 and at level 5 alike. Errors, warnings and destructive confirmations are included; no category is exempt.",
        "Three modes and two funny sliders that move independently. The level changes the voice and nothing else — every message still names the file, the count and what cannot be undone, at level 1 and at level 5 alike. Errors, warnings and destructive confirmations included; nothing is exempt.",
        "Three modes and two funny sliders that move independently. The level changes the voice and nothing else — every message still names the file, the count and what cannot be undone, at level 1 and at level 5 alike. Errors, warnings and destructive confirmations included; nothing is exempt, however much it might like to be."],
      yue: ["三種模式，兩個獨立嘅玩味滑桿。等級淨係改語氣 —— 每段訊息一樣會講明係邊個檔案、幾多個、邊啲唔可以回頭，level 1 同 level 5 一模一樣。錯誤、警告同刪除確認全部包括在內，冇一類豁免。",
        "三種模式，兩個獨立嘅玩味滑桿。等級淨係改語氣 —— 每段訊息一樣會講明係邊個檔案、幾多個、邊啲唔可以回頭，level 1 同 level 5 一模一樣。錯誤、警告同刪除確認全部包括在內，冇一類豁免。",
        "三種模式，兩個獨立玩味滑桿。等級淨係改語氣：每段訊息一樣講明邊個檔案、幾多個、邊啲返唔到轉頭，level 1 同 level 5 一樣。錯誤、警告、刪除確認全部計埋，冇一類豁免。",
        "三種模式，兩個滑桿各行各路。等級淨係改語氣，其他乜都唔改 —— 每段訊息一樣講明邊個檔案、幾多個、邊啲返唔到轉頭，level 1 同 level 5 一樣。錯誤、警告、刪除確認全部計埋，一個都走唔甩。",
        "三種模式，兩個滑桿各行各路。等級淨係改語氣，其他乜都唔改 —— 每段訊息一樣講明邊個檔案、幾多個、邊啲返唔到轉頭，level 1 同 level 5 一樣。錯誤、警告、刪除確認全部計埋，一個都走唔甩，想扮唔關事都唔得。"]
    },
    "studio.langModeRow": {
      en: ["Language mode", "Language mode", "Language mode", "Language mode", "Language mode"],
      yue: ["語言模式", "語言模式", "語言模式", "語言模式", "語言模式"]
    },
    "studio.langModeRowDesc": {
      en: ["English · playful Hong Kong Cantonese · bilingual", "English · playful Hong Kong Cantonese · bilingual", "English · playful Hong Kong Cantonese · both at once", "English, playful Hong Kong Cantonese, or both at once", "English, playful Hong Kong Cantonese, or both at once"],
      yue: ["英文 · 港式廣東話 · 雙語", "英文 · 港式廣東話 · 雙語", "英文 · 港式廣東話 · 兩種一齊", "英文、港式廣東話，或者兩種一齊上", "英文、港式廣東話，或者兩種一齊上"]
    },
    "studio.funnyEn": {
      en: ["Funny level — English", "Funny level — English", "Funny level — English", "Funny level — English", "Funny level — English"],
      yue: ["玩味程度 —— 英文", "玩味程度 —— 英文", "英文玩味程度", "英文嗰邊玩幾大", "英文嗰邊玩幾大"]
    },
    "studio.funnyEnDesc": {
      en: ["How playfully the English copy is written. Level 1 reads fully professional.", "How playfully the English copy is written. Level 1 reads fully professional.", "How playful the English copy is. Level 1 reads fully professional.", "How playful the English gets. Level 1 is completely straight-faced.", "How playful the English gets. Level 1 is completely straight-faced."],
      yue: ["英文文案寫得幾玩味。Level 1 完全專業。", "英文文案寫得幾玩味。Level 1 完全專業。", "英文寫得幾玩。Level 1 好正經。", "英文可以玩到幾盡。Level 1 一啲都唔笑。", "英文可以玩到幾盡。Level 1 一啲都唔笑。"]
    },
    "studio.funnyYue": {
      en: ["Funny level — 廣東話", "Funny level — 廣東話", "Funny level — 廣東話", "Funny level — 廣東話", "Funny level — 廣東話"],
      yue: ["玩味程度 —— 廣東話", "玩味程度 —— 廣東話", "廣東話玩味程度", "廣東話嗰邊玩幾大", "廣東話嗰邊玩幾大"]
    },
    "studio.funnyYueDesc": {
      en: ["How playfully the Cantonese copy is written. Level 1 reads fully professional.", "How playfully the Cantonese copy is written. Level 1 reads fully professional.", "How playful the Cantonese copy is. Level 1 reads fully professional.", "How playful the Cantonese gets. Level 1 is completely straight-faced.", "How playful the Cantonese gets. Level 1 is completely straight-faced."],
      yue: ["廣東話嗰邊嘅玩味程度。1 係好正經，5 係玩到盡。", "廣東話嗰邊嘅玩味程度。1 係好正經，5 係玩到盡。", "廣東話寫得幾玩。1 好正經，5 玩到盡。", "廣東話可以玩到幾盡。1 一本正經，5 就冇嘢救。", "廣東話可以玩到幾盡。1 一本正經，5 就冇嘢救。"]
    },

    "studio.narratorTitle": {
      en: ["Spoken narrator", "Spoken narrator", "Spoken narrator", "The voice", "The voice"],
      yue: ["語音旁白", "語音旁白", "語音旁白", "把聲", "把聲"]
    },
    "studio.narratorDesc": {
      en: ["Off by default. When on it speaks one line at a time through a serialised queue, never overlapping, and yields to an active screen reader. Spoken errors still name the actual failure and are never suppressed by the rate limit.",
        "Off by default. When on it speaks one line at a time through a serialised queue, never overlapping, and yields to an active screen reader. Spoken errors still name the actual failure and are never suppressed by the rate limit.",
        "Off by default. When on it speaks one line at a time, never overlapping, and gets out of the way of an active screen reader. Spoken errors still name the actual failure and are never held back by the rate limit.",
        "Off unless you turn it on. One line at a time, never talking over itself, and it shuts up for an active screen reader. Spoken errors still name the actual failure and the rate limit never swallows one.",
        "Off unless you turn it on. One line at a time, never talking over itself, and it shuts up the moment a screen reader speaks. Spoken errors still name the actual failure, and the rate limit never swallows one."],
      yue: ["預設關閉。開咗之後會逐句講，經一條序列化隊列，唔會重疊，遇著螢幕閱讀器會讓路。講錯誤嗰陣一樣會講明真正出咗咩事，唔會俾頻率限制食咗。",
        "預設關閉。開咗之後會逐句講，經一條序列化隊列，唔會重疊，遇著螢幕閱讀器會讓路。講錯誤嗰陣一樣會講明真正出咗咩事，唔會俾頻率限制食咗。",
        "預設熄咗。開咗就逐句講，唔會撞聲，螢幕閱讀器一出聲佢就讓路。講錯誤一樣會講明真正出咗咩事，唔會俾頻率限制食咗。",
        "你唔開佢就唔會出聲。一次一句，唔會自己嘈自己，螢幕閱讀器一出聲佢即刻收聲。講錯誤一樣會講明真正出咗咩事，一句都唔會俾頻率限制食咗。",
        "你唔開佢就唔會出聲。一次一句，唔會自己嘈自己，螢幕閱讀器一出聲佢即刻收聲。講錯誤一樣會講明真正出咗咩事，一句都唔會俾頻率限制食咗。"]
    },
    "studio.narrateEvents": {
      en: ["Narrate app events", "Narrate app events", "Narrate app events", "Say things out loud", "Say things out loud"],
      yue: ["讀出應用程式事件", "讀出應用程式事件", "講返 app 度發生咩事", "有嘢發生就講出嚟", "有嘢發生就講出嚟"]
    },
    "studio.narrateEventsDesc": {
      en: ["Uses the platform voice. Off unless you turn it on.", "Uses the platform voice. Off unless you turn it on.", "Uses the platform voice. Off unless you turn it on.", "Uses whatever voice Windows has. Off unless you turn it on.", "Uses whatever voice Windows has. Off unless you turn it on."],
      yue: ["用系統嘅語音。你唔開就唔會出聲。", "用系統嘅語音。你唔開就唔會出聲。", "用系統把聲。你唔開就唔出聲。", "Windows 有咩聲就用咩聲。你唔開就唔出聲。", "Windows 有咩聲就用咩聲。你唔開就唔出聲。"]
    },
    "studio.narratedLang": {
      en: ["Narrated language", "Narrated language", "Narrated language", "Which language it speaks", "Which language it speaks"],
      yue: ["旁白語言", "旁白語言", "旁白講邊種話", "佢用邊種話講", "佢用邊種話講"]
    },
    "studio.narratedLangDesc": {
      en: ["Both speaks English first, then 廣東話, strictly one after the other.", "Both speaks English first, then 廣東話, strictly one after the other.", "Both speaks English first, then 廣東話, strictly one after the other.", "Both means English first, then 廣東話 — one after the other, never together.", "Both means English first, then 廣東話 — one after the other, never on top of each other."],
      yue: ["揀「兩種」會先講英文，再講廣東話，一句跟一句。", "揀「兩種」會先講英文，再講廣東話，一句跟一句。", "揀「兩種」就先英文後廣東話，一句跟一句。", "揀「兩種」即係先英文後廣東話 —— 一句跟一句，唔會一齊嗌。", "揀「兩種」即係先英文後廣東話 —— 一句跟一句，唔會一齊嗌。"]
    },

    "studio.dimsumTitle": {
      en: ["Dim sum surprise", "Dim sum surprise", "Dim sum surprise", "Dim sum surprise", "Dim sum surprise"],
      yue: ["點心驚喜", "點心驚喜", "點心驚喜", "點心驚喜", "點心驚喜"]
    },
    "studio.dimsumDesc": {
      en: ["A 1-in-100 chance at launch of a randomly chosen dim sum dish, named in both languages. It never blocks startup, never steals focus, and never appears on a first run or during an error.",
        "A 1-in-100 chance at launch of a randomly chosen dim sum dish, named in both languages. It never blocks startup, never steals focus, and never appears on a first run or during an error.",
        "A 1-in-100 chance at launch of a random dim sum dish, named in both languages. It never blocks startup, never steals focus, and never turns up on a first run or during an error.",
        "One launch in a hundred, a random dim sum dish turns up, named in both languages. It never blocks startup, never steals focus, and never shows its face on a first run or during an error.",
        "One launch in a hundred, a random dim sum dish turns up, named in both languages. It never blocks startup, never steals focus, and has the good manners to stay away on a first run or during an error."],
      yue: ["每次開 app 有百分之一機會出現一碟隨機點心，兩種語言都有名。佢唔會阻住開機、唔會搶焦點，第一次用同出錯嗰陣都唔會出現。",
        "每次開 app 有百分之一機會出現一碟隨機點心，兩種語言都有名。佢唔會阻住開機、唔會搶焦點，第一次用同出錯嗰陣都唔會出現。",
        "開一百次 app 大概中一次，出一碟隨機點心，兩種語言都有名。唔阻開機、唔搶焦點，第一次用同出錯嗰陣唔會出。",
        "開一百次撞中一次，會有碟隨機點心行出嚟，兩種語言都有名。唔阻開機、唔搶焦點，第一次用同出錯嗰陣識做唔會出。",
        "開一百次撞中一次，會有碟隨機點心行出嚟，兩種語言都有名。唔阻開機、唔搶焦點，第一次用同出錯嗰陣好識做，梗係唔出嚟阻你。"]
    },
    "studio.showDimsum": {
      en: ["Show the dim sum surprise", "Show the dim sum surprise", "Show the dim sum surprise", "Let the dim sum turn up", "Let the dim sum turn up"],
      yue: ["顯示點心驚喜", "顯示點心驚喜", "畀點心出嚟", "畀啲點心出嚟", "畀啲點心行出嚟"]
    },
    "studio.showDimsumDesc": {
      en: ["One fresh draw per launch, at most 1%. Bundled artwork, no network.", "One fresh draw per launch, at most 1%. Bundled artwork, no network.", "One fresh draw per launch, 1% at most. Bundled artwork, no network.", "One fresh draw per launch, 1% at most. The pictures ship with the app; nothing is fetched.", "One fresh draw per launch, 1% at most. The pictures ship with the app; nothing is fetched from anywhere."],
      yue: ["每次開機抽一次，最多 1%。相片內置，唔上網。", "每次開機抽一次，最多 1%。相片內置，唔上網。", "每次開機抽一次，最多 1%。啲相內置，唔使上網。", "每次開機抽一次，最多 1%。啲相跟住 app 一齊帶，唔會去邊度攞。", "每次開機抽一次，最多 1%。啲相跟住 app 一齊帶，唔會去邊度攞。"]
    },
    "studio.showOneNow": {
      en: ["Show one now", "Show one now", "Show one now", "Show me one now", "Show me one right now"],
      yue: ["即刻出一個", "即刻出一個", "即刻出一碟嚟睇", "即刻畀我睇一碟", "即刻畀我睇一碟"]
    },
    "studio.showOneNowDesc": {
      en: ["Preview the surface without waiting for the draw.", "Preview the surface without waiting for the draw.", "Preview it without waiting for the draw.", "See it now instead of waiting to get lucky.", "See it now instead of waiting a hundred launches to get lucky."],
      yue: ["唔使等抽中，即刻預覽。", "唔使等抽中，即刻預覽。", "唔使等抽中，即刻睇。", "唔使等好運，而家就睇。", "唔使等一百次先撞中，而家就睇。"]
    },

    "studio.editorTitle": {
      en: ["External editor", "External editor", "External editor", "External editor", "External editor"],
      yue: ["外部編輯器", "外部編輯器", "外部編輯器", "外部編輯器", "外部編輯器"]
    },
    "studio.editorDesc": {
      en: ["Opens the active profile's working directory in the editor you choose. Only editors actually found on this machine are offered.", "Opens the active profile's working directory in the editor you choose. Only editors actually found on this machine are offered.", "Opens the active profile's working directory in the editor you pick. Only editors actually found on this machine are offered.", "Opens the active profile's working directory in whichever editor you pick. Only editors actually found on this machine are offered.", "Opens the active profile's working directory in whichever editor you pick. Only editors actually sitting on this machine are offered — no wishful thinking."],
      yue: ["用你揀嘅編輯器開啟目前設定檔嘅工作目錄。淨係列出部機真係搵到嘅編輯器。", "用你揀嘅編輯器開啟目前設定檔嘅工作目錄。淨係列出部機真係搵到嘅編輯器。", "用你揀嗰個編輯器開目前 profile 嘅工作目錄。淨係列部機真係有嘅。", "你揀邊個編輯器就用邊個開目前 profile 嘅工作目錄。淨係列部機真係有嗰啲。", "你揀邊個編輯器就用邊個開目前 profile 嘅工作目錄。淨係列部機真係有嗰啲，唔會靠估。"]
    },
    "studio.editorRow": {
      en: ["Editor", "Editor", "Editor", "Editor", "Editor"],
      yue: ["編輯器", "編輯器", "編輯器", "編輯器", "編輯器"]
    },
    "studio.editorDetected": {
      en: ["{count} detected on this machine", "{count} detected on this machine", "{count} found on this machine", "{count} found on this machine", "{count} found on this machine"],
      yue: ["喺部機搵到 {count} 個", "喺部機搵到 {count} 個", "部機搵到 {count} 個", "部機搵到 {count} 個", "部機搵到 {count} 個"]
    },
    "studio.editorNone": {
      en: ["No supported editor was found — install one, or use Reveal in Explorer.", "No supported editor was found — install one, or use Reveal in Explorer.", "No supported editor was found. Install one, or use Reveal in Explorer.", "No supported editor turned up. Install one, or fall back to Reveal in Explorer.", "No supported editor turned up. Install one, or fall back to Reveal in Explorer."],
      yue: ["搵唔到支援嘅編輯器 —— 裝一個，或者用「喺檔案總管顯示」。", "搵唔到支援嘅編輯器 —— 裝一個，或者用「喺檔案總管顯示」。", "搵唔到支援嘅編輯器。裝一個，或者用「喺檔案總管顯示」。", "一個支援嘅編輯器都搵唔到。裝一個，唔係就用「喺檔案總管顯示」頂住先。", "一個支援嘅編輯器都搵唔到。裝一個，唔係就用「喺檔案總管顯示」頂住先。"]
    },
    "studio.openWorkingDir": {
      en: ["Open the working directory", "Open the working directory", "Open the working directory", "Open the working directory", "Open the working directory"],
      yue: ["開啟工作目錄", "開啟工作目錄", "開個工作目錄", "開個工作目錄", "開個工作目錄嚟睇"]
    },
    "studio.revealExplorer": {
      en: ["Reveal in File Explorer", "Reveal in File Explorer", "Reveal in File Explorer", "Show it in File Explorer", "Show it in File Explorer"],
      yue: ["喺檔案總管顯示", "喺檔案總管顯示", "喺檔案總管度開", "喺檔案總管度開返佢", "喺檔案總管度揾畀你睇"]
    },
    "studio.revealExplorerDesc": {
      en: ["Always available, even with no editor installed.", "Always available, even with no editor installed.", "Always available, even with no editor installed.", "Always there, even if you have no editor at all.", "Always there, even if you have no editor at all."],
      yue: ["一定用得，就算冇裝編輯器都得。", "一定用得，就算冇裝編輯器都得。", "一定用得，冇編輯器都用得。", "一定喺度，你一個編輯器都冇都用得。", "一定喺度，你一個編輯器都冇都用得。"]
    },

    "studio.historyTitle": {
      en: ["Local version history", "Local version history", "Local version history", "Local version history", "Local version history"],
      yue: ["本機版本歷史", "本機版本歷史", "本機版本歷史", "本機版本歷史", "本機版本歷史"]
    },
    "studio.historyDesc": {
      en: ["A git repository beside the app's own data — never inside your project, never pushed. Restoring writes a new revision instead of rewinding, so an undo can itself be undone.",
        "A git repository beside the app's own data — never inside your project, never pushed. Restoring writes a new revision instead of rewinding, so an undo can itself be undone.",
        "A git repository beside the app's own data. Never inside your project, never pushed. Restoring writes a new revision instead of rewinding, so an undo can itself be undone.",
        "A git repository beside the app's own data — never inside your project, never pushed anywhere. Restoring writes a new revision rather than rewinding, so an undo can itself be undone.",
        "A git repository beside the app's own data — never inside your project, never pushed anywhere. Restoring writes a new revision rather than rewinding, so you can undo an undo, and then undo that."],
      yue: ["一個 git 倉庫，擺喺 app 自己啲資料隔籬 —— 唔會擺入你個 project，亦都唔會 push 出去。還原係寫一個新版本，唔係倒帶，所以撤銷咗都可以再撤銷返。",
        "一個 git 倉庫，擺喺 app 自己啲資料隔籬 —— 唔會擺入你個 project，亦都唔會 push 出去。還原係寫一個新版本，唔係倒帶，所以撤銷咗都可以再撤銷返。",
        "一個 git 倉庫，擺喺 app 自己啲資料隔籬。唔會入你個 project，亦唔會 push 出去。還原係寫個新版本，唔係倒帶，所以撤銷咗都撤銷得返。",
        "一個 git 倉庫，擺喺 app 自己啲資料隔籬 —— 唔會入你個 project，亦唔會 push 去邊。還原係寫個新版本而唔係倒帶，所以撤銷都撤銷得返。",
        "一個 git 倉庫，擺喺 app 自己啲資料隔籬 —— 唔會入你個 project，亦唔會 push 去邊。還原係寫個新版本而唔係倒帶，所以你撤銷咗可以再撤銷，再撤銷多次都得。"]
    },
    "studio.openHistoryRepo": {
      en: ["Open the history repository", "Open the history repository", "Open the history repository", "Open the history repository", "Open the history repository"],
      yue: ["開啟歷史倉庫", "開啟歷史倉庫", "開個歷史倉庫", "開個歷史倉庫", "開個歷史倉庫睇吓"]
    },
    "studio.pruneRevisions": {
      en: ["Prune old revisions", "Prune old revisions", "Prune old revisions", "Trim the old revisions", "Trim the old revisions"],
      yue: ["清理舊版本", "清理舊版本", "剪走舊版本", "剪走啲舊版本", "剪走啲舊版本"]
    },
    "studio.pruneRevisionsDesc": {
      en: ["Keeps the newest {keep}. Only you can trigger this; nothing is pruned automatically.", "Keeps the newest {keep}. Only you can trigger this; nothing is pruned automatically.", "Keeps the newest {keep}. Only you can start it — nothing is pruned automatically.", "Keeps the newest {keep}. Only you can start it; nothing is ever pruned behind your back.", "Keeps the newest {keep}. Only you can start it; nothing is ever pruned behind your back."],
      yue: ["保留最新 {keep} 個。淨係你自己撳先會做，唔會自動剪。", "保留最新 {keep} 個。淨係你自己撳先會做，唔會自動剪。", "留低最新 {keep} 個。要你自己撳先會剪，唔會自動。", "留低最新 {keep} 個。要你自己撳先會剪，唔會喺你背後偷偷剪。", "留低最新 {keep} 個。要你自己撳先會剪，唔會喺你背後偷偷剪。"]
    },

    "studio.appearanceTitle": {
      en: ["Appearance", "Appearance", "Appearance", "Appearance", "How it all looks"],
      yue: ["外觀", "外觀", "外觀", "外觀", "個樣點"]
    },
    "studio.appearanceDesc": {
      en: ["Theme and density apply live. Every individual element also has its own editor — right-click any surface and choose Edit appearance.", "Theme and density apply live. Every individual element also has its own editor — right-click any surface and choose Edit appearance.", "Theme and density apply live. Every individual element also has its own editor: right-click any surface and choose Edit appearance.", "Theme and density apply live. Every single element has its own editor too — right-click any surface and choose Edit appearance.", "Theme and density apply live. Every single element has its own editor too — right-click anything at all and choose Edit appearance."],
      yue: ["主題同密度即時生效。每一個元素都有自己嘅編輯器 —— 喺任何介面右 click，揀「編輯外觀」。", "主題同密度即時生效。每一個元素都有自己嘅編輯器 —— 喺任何介面右 click，揀「編輯外觀」。", "主題同密度即時生效。每個元素都有自己嘅編輯器：喺任何介面右 click，揀「編輯外觀」。", "主題同密度即時生效。每一粒元素都有自己嘅編輯器 —— 喺任何嘢度右 click，揀「編輯外觀」。", "主題同密度即時生效。每一粒元素都有自己嘅編輯器 —— 見到乜都右 click 得，揀「編輯外觀」。"]
    },
    "studio.themeRow": {
      en: ["Theme", "Theme", "Theme", "Theme", "Theme"],
      yue: ["主題", "主題", "主題", "主題", "主題"]
    },
    "studio.themeRowDesc": {
      en: ["Material 3 light and dark palettes.", "Material 3 light and dark palettes.", "Material 3 light and dark palettes.", "The Material 3 light and dark palettes.", "The Material 3 light and dark palettes."],
      yue: ["Material 3 淺色同深色色盤。", "Material 3 淺色同深色色盤。", "Material 3 淺色同深色色盤。", "Material 3 嘅淺色同深色色盤。", "Material 3 嘅淺色同深色色盤。"]
    },
    "studio.exportAppearance": {
      en: ["Export appearance to a file", "Export appearance to a file", "Export the appearance to a file", "Save the whole look to a file", "Save the whole look to a file"],
      yue: ["將外觀匯出做檔案", "將外觀匯出做檔案", "將外觀 export 做一個檔", "將成個樣儲做一個檔", "將成個樣儲做一個檔"]
    },
    "studio.exportAppearanceDesc": {
      en: ["Every saved element style, as a file you can keep, share or re-import after a reinstall.", "Every saved element style, as a file you can keep, share or re-import after a reinstall.", "Every saved element style, in a file you can keep, share or import back after a reinstall.", "Every saved element style, in one file you can keep, pass on, or import back after a reinstall.", "Every saved element style, in one file you can keep, pass on, or import back after a reinstall."],
      yue: ["所有已儲存嘅元素樣式，出一個檔，你可以留低、share 畀人，或者重裝之後再 import 返。", "所有已儲存嘅元素樣式，出一個檔，你可以留低、share 畀人，或者重裝之後再 import 返。", "所有儲低咗嘅元素樣式，寫成一個檔，留得、share 得、重裝之後 import 返都得。", "所有儲低咗嘅元素樣式，一個檔搞掂：留得、畀得人、重裝之後 import 返都得。", "所有儲低咗嘅元素樣式，一個檔搞掂：留得、畀得人、重裝之後 import 返都得。"]
    },
    "studio.importAppearance": {
      en: ["Import an appearance file", "Import an appearance file", "Import an appearance file", "Bring in an appearance file", "Bring in an appearance file"],
      yue: ["匯入外觀檔案", "匯入外觀檔案", "import 一個外觀檔", "揀個外觀檔 import 入嚟", "揀個外觀檔 import 入嚟"]
    },
    "studio.importAppearanceDesc": {
      en: ["Anything the file asks for that this build cannot represent is reported, never dropped in silence.", "Anything the file asks for that this build cannot represent is reported, never dropped in silence.", "Anything the file asks for that this build cannot represent is reported, never dropped in silence.", "If the file asks for something this build cannot do, you are told — it is never dropped in silence.", "If the file asks for something this build cannot do, you are told. It is never dropped in silence and pretended away."],
      yue: ["個檔要求嘅嘢如果呢個版本做唔到，會話你知，唔會靜靜雞掉咗佢。", "個檔要求嘅嘢如果呢個版本做唔到，會話你知，唔會靜靜雞掉咗佢。", "個檔要求嘅嘢呢個版本做唔到嘅，會話你知，唔會靜靜雞丟咗。", "個檔要求啲呢個版本做唔到嘅嘢，會話你知 —— 唔會靜雞雞掉咗當冇事。", "個檔要求啲呢個版本做唔到嘅嘢，會話你知 —— 唔會靜雞雞掉咗，再扮冇發生過。"]
    },
    "studio.presetsRow": {
      en: ["Named presets", "Named presets", "Named presets", "Saved looks", "Saved looks"],
      yue: ["已命名預設", "已命名預設", "已命名預設", "儲低咗嘅樣", "儲低咗嘅樣"]
    },
    "studio.resetEveryElement": {
      en: ["Reset every element", "Reset every element", "Reset every element", "Put every element back", "Put every element back"],
      yue: ["重設所有元素", "重設所有元素", "所有元素打返原形", "所有元素打返原形", "全部元素打返原形"]
    },
    "studio.resetEveryElementDesc": {
      en: ["Clears all per-element appearance overrides. Recorded in History, so it is undoable.", "Clears all per-element appearance overrides. Recorded in History, so it is undoable.", "Clears every per-element appearance override. Recorded in History, so it is undoable.", "Clears every per-element appearance override. It is recorded in History, so you can undo it.", "Clears every per-element appearance override. It goes into History like everything else, so you can undo it."],
      yue: ["清除所有逐個元素嘅外觀覆寫。會記落歷史，所以撤銷得返。", "清除所有逐個元素嘅外觀覆寫。會記落歷史，所以撤銷得返。", "清走每個元素嘅外觀覆寫。會記落歷史，撤銷得返。", "清走每個元素嘅外觀覆寫。會記落歷史，所以你撤銷得返。", "清走每個元素嘅外觀覆寫。同其他嘢一樣會記落歷史，所以你撤銷得返。"]
    },
/* Batch 9 — the appearance editor's typography controls. Group headings, every
   control's accessible name, the option words, and the platform-capability notes that
   stay on screen where a control cannot exist. Values a user typed (a pixel offset, a
   percentage) ride in placeholders and read identically at every level. */

    "appear.groupType": {
      en: ["Typeface", "Typeface", "Typeface", "Typeface", "Typeface"],
      yue: ["字體", "字體", "字體", "字體", "字體"]
    },
    "appear.groupStyle": {
      en: ["Style", "Style", "Style", "Style", "Style"],
      yue: ["樣式", "樣式", "樣式", "樣式", "樣式"]
    },
    "appear.groupDecoration": {
      en: ["Lines", "Lines", "Lines", "Lines", "Lines"],
      yue: ["線", "線", "線", "線", "線"]
    },
    "appear.groupSpacing": {
      en: ["Spacing", "Spacing", "Spacing", "Spacing", "Spacing"],
      yue: ["間距", "間距", "間距", "間距", "間距"]
    },
    "appear.groupLayout": {
      en: ["Direction and alignment", "Direction and alignment", "Direction and alignment", "Direction and alignment", "Direction and alignment"],
      yue: ["方向同對齊", "方向同對齊", "方向同對齊", "方向同對齊", "方向同對齊"]
    },
    "appear.groupColour": {
      en: ["Colour", "Colour", "Colour", "Colour", "Colour"],
      yue: ["顏色", "顏色", "顏色", "顏色", "顏色"]
    },
    "appear.groupEffects": {
      en: ["Effects", "Effects", "Effects", "Effects", "Effects"],
      yue: ["效果", "效果", "效果", "效果", "效果"]
    },
    "appear.sizeExact": {
      en: ["Size, exact percent", "Size, exact percent", "Size, exact percent", "Size, type an exact percent", "Size, type an exact percent"],
      yue: ["大小，準確百分比", "大小，準確百分比", "大小，準確百分比", "大小，自己打個百分比", "大小，自己打個百分比"]
    },
    "appear.size": {
      en: ["Size {value}", "Size {value}", "Size {value}", "Size {value}", "Size {value}"],
      yue: ["大小 {value}", "大小 {value}", "大小 {value}", "大小 {value}", "大小 {value}"]
    },
    "appear.weight": {
      en: ["Weight {value}", "Weight {value}", "Weight {value}", "Weight {value}", "Weight {value}"],
      yue: ["字重 {value}", "字重 {value}", "字重 {value}", "字重 {value}", "字重 {value}"]
    },
    "appear.slant": {
      en: ["Slant", "Slant", "Slant", "Slant", "Slant"],
      yue: ["傾斜", "傾斜", "傾斜", "打斜", "打斜"]
    },
    "appear.slantNone": {
      en: ["Upright", "Upright", "Upright", "Upright", "Upright"],
      yue: ["正體", "正體", "企定定", "企定定", "企定定"]
    },
    "appear.slantOblique": {
      en: ["Oblique", "Oblique", "Oblique", "Oblique", "Oblique"],
      yue: ["斜置", "斜置", "斜置", "扽斜", "扽斜"]
    },
    "appear.caps": {
      en: ["Capitalization", "Capitalization", "Capitalization", "Capitalization", "Capitalization"],
      yue: ["大小寫", "大小寫", "大小寫", "大小寫", "大小寫"]
    },
    "appear.capsNone": {
      en: ["As written", "As written", "As written", "Leave it as written", "Leave it as written"],
      yue: ["照原文", "照原文", "照原文", "原文點寫就點", "原文點寫就點"]
    },
    "appear.capsUpper": {
      en: ["UPPERCASE", "UPPERCASE", "UPPERCASE", "UPPERCASE", "UPPERCASE"],
      yue: ["全大階", "全大階", "全大階", "全大階", "全大階"]
    },
    "appear.capsLower": {
      en: ["lowercase", "lowercase", "lowercase", "lowercase", "lowercase"],
      yue: ["全細階", "全細階", "全細階", "全細階", "全細階"]
    },
    "appear.capsTitle": {
      en: ["Capitalize Each Word", "Capitalize Each Word", "Capitalize Each Word", "Capitalize Each Word", "Capitalize Each Word"],
      yue: ["每個字大階", "每個字大階", "每個字大階", "每個字大階", "每個字大階"]
    },
    "appear.capsSmall": {
      en: ["Small caps", "Small caps", "Small caps", "Small caps", "Small caps"],
      yue: ["小型大階", "小型大階", "小型大階", "小型大階", "小型大階"]
    },
    "appear.underlineStyle": {
      en: ["Underline", "Underline", "Underline", "Underline", "Underline"],
      yue: ["底線", "底線", "底線", "底線", "底線"]
    },
    "appear.underlineNone": {
      en: ["None", "None", "None", "No underline", "No underline"],
      yue: ["冇", "冇", "唔要", "唔要底線", "唔要底線"]
    },
    "appear.underlineSolid": {
      en: ["Single", "Single", "Single", "Single", "Single"],
      yue: ["單線", "單線", "單線", "單線", "單線"]
    },
    "appear.underlineDouble": {
      en: ["Double", "Double", "Double", "Double", "Double"],
      yue: ["雙線", "雙線", "雙線", "雙線", "雙線"]
    },
    "appear.underlineDotted": {
      en: ["Dotted", "Dotted", "Dotted", "Dotted", "Dotted"],
      yue: ["點線", "點線", "點線", "點線", "點線"]
    },
    "appear.underlineDashed": {
      en: ["Dashed", "Dashed", "Dashed", "Dashed", "Dashed"],
      yue: ["虛線", "虛線", "虛線", "虛線", "虛線"]
    },
    "appear.underlineWavy": {
      en: ["Wavy", "Wavy", "Wavy", "Wavy", "Wavy"],
      yue: ["波浪線", "波浪線", "波浪線", "波浪線", "波浪線"]
    },
    "appear.strikeStyle": {
      en: ["Strikethrough", "Strikethrough", "Strikethrough", "Strikethrough", "Strikethrough"],
      yue: ["刪除線", "刪除線", "刪除線", "刪除線", "刪除線"]
    },
    "appear.strikeNone": {
      en: ["None", "None", "None", "No strike", "No strike"],
      yue: ["冇", "冇", "唔要", "唔要刪除線", "唔要刪除線"]
    },
    "appear.strikeSingle": {
      en: ["Single", "Single", "Single", "Single", "Single"],
      yue: ["單線", "單線", "單線", "單線", "單線"]
    },
    "appear.strikeDouble": {
      en: ["Double", "Double", "Double", "Double", "Double"],
      yue: ["雙線", "雙線", "雙線", "雙線", "雙線"]
    },
    "appear.overline": {
      en: ["Overline", "Overline", "Overline", "Line above", "Line above"],
      yue: ["頂線", "頂線", "頂線", "上面加條線", "上面加條線"]
    },
    "appear.vertAlign": {
      en: ["Superscript and subscript", "Superscript and subscript", "Superscript and subscript", "Raised or lowered", "Raised or lowered"],
      yue: ["上標同下標", "上標同下標", "上標同下標", "抬高定放低", "抬高定放低"]
    },
    "appear.vertNone": {
      en: ["On the line", "On the line", "On the line", "On the line", "On the line"],
      yue: ["平排", "平排", "平排", "平排", "平排"]
    },
    "appear.vertSuper": {
      en: ["Superscript", "Superscript", "Superscript", "Superscript", "Superscript"],
      yue: ["上標", "上標", "上標", "上標", "上標"]
    },
    "appear.vertSub": {
      en: ["Subscript", "Subscript", "Subscript", "Subscript", "Subscript"],
      yue: ["下標", "下標", "下標", "下標", "下標"]
    },
    "appear.letterSpacing": {
      en: ["Character spacing {value}", "Character spacing {value}", "Character spacing {value}", "Character spacing {value}", "Character spacing {value}"],
      yue: ["字元間距 {value}", "字元間距 {value}", "字元間距 {value}", "字距 {value}", "字距 {value}"]
    },
    "appear.wordSpacing": {
      en: ["Word spacing {value}", "Word spacing {value}", "Word spacing {value}", "Word spacing {value}", "Word spacing {value}"],
      yue: ["字詞間距 {value}", "字詞間距 {value}", "字詞間距 {value}", "詞距 {value}", "詞距 {value}"]
    },
    "appear.lineHeight": {
      en: ["Line height {value}", "Line height {value}", "Line height {value}", "Line height {value}", "Line height {value}"],
      yue: ["行高 {value}", "行高 {value}", "行高 {value}", "行高 {value}", "行高 {value}"]
    },
    "appear.baseline": {
      en: ["Baseline offset {value}", "Baseline offset {value}", "Baseline offset {value}", "Baseline offset {value}", "Baseline offset {value}"],
      yue: ["基線偏移 {value}", "基線偏移 {value}", "基線偏移 {value}", "基線偏移 {value}", "基線偏移 {value}"]
    },
    "appear.direction": {
      en: ["Text direction", "Text direction", "Text direction", "Text direction", "Text direction"],
      yue: ["文字方向", "文字方向", "文字方向", "文字方向", "文字方向"]
    },
    "appear.dirAuto": {
      en: ["Inherit", "Inherit", "Inherit", "Whatever the page uses", "Whatever the page uses"],
      yue: ["跟隨", "跟隨", "跟隨上層", "跟返個頁面", "跟返個頁面"]
    },
    "appear.dirLtr": {
      en: ["Left to right", "Left to right", "Left to right", "Left to right", "Left to right"],
      yue: ["由左至右", "由左至右", "由左至右", "由左至右", "由左至右"]
    },
    "appear.dirRtl": {
      en: ["Right to left", "Right to left", "Right to left", "Right to left", "Right to left"],
      yue: ["由右至左", "由右至左", "由右至左", "由右至左", "由右至左"]
    },
    "appear.align": {
      en: ["Alignment", "Alignment", "Alignment", "Alignment", "Alignment"],
      yue: ["對齊", "對齊", "對齊", "對齊", "對齊"]
    },
    "appear.alignInherit": {
      en: ["Inherit", "Inherit", "Inherit", "Whatever the page uses", "Whatever the page uses"],
      yue: ["跟隨", "跟隨", "跟隨上層", "跟返個頁面", "跟返個頁面"]
    },
    "appear.alignLeft": {
      en: ["Left", "Left", "Left", "Left", "Left"],
      yue: ["靠左", "靠左", "靠左", "埋左邊", "埋左邊"]
    },
    "appear.alignCenter": {
      en: ["Centre", "Centre", "Centre", "Centre", "Centre"],
      yue: ["置中", "置中", "置中", "擺中間", "擺中間"]
    },
    "appear.alignRight": {
      en: ["Right", "Right", "Right", "Right", "Right"],
      yue: ["靠右", "靠右", "靠右", "埋右邊", "埋右邊"]
    },
    "appear.alignJustify": {
      en: ["Justify", "Justify", "Justify", "Justify", "Justify"],
      yue: ["左右對齊", "左右對齊", "左右對齊", "兩邊都貼齊", "兩邊都貼齊"]
    },
    "appear.targetText": {
      en: ["Text", "Text", "Text", "Text", "Text"],
      yue: ["文字", "文字", "文字", "文字", "文字"]
    },
    "appear.targetUnderline": {
      en: ["Underline", "Underline", "Underline", "Underline", "Underline"],
      yue: ["底線", "底線", "底線", "底線", "底線"]
    },
    "appear.targetHighlight": {
      en: ["Highlight", "Highlight", "Highlight", "Highlight", "Highlight"],
      yue: ["螢光標示", "螢光標示", "螢光標示", "螢光筆", "螢光筆"]
    },
    "appear.targetOutline": {
      en: ["Outline", "Outline", "Outline", "Outline", "Outline"],
      yue: ["描邊", "描邊", "描邊", "描邊", "描邊"]
    },
    "appear.targetShadow": {
      en: ["Shadow", "Shadow", "Shadow", "Shadow", "Shadow"],
      yue: ["陰影", "陰影", "陰影", "陰影", "陰影"]
    },
    "appear.targetGlow": {
      en: ["Glow", "Glow", "Glow", "Glow", "Glow"],
      yue: ["光暈", "光暈", "光暈", "光暈", "光暈"]
    },
    "appear.editing": {
      en: ["Editing the {target} colour", "Editing the {target} colour", "The picker below sets the {target} colour", "The picker below sets the {target} colour", "The picker below sets the {target} colour"],
      yue: ["而家改緊「{target}」嘅顏色", "而家改緊「{target}」嘅顏色", "下面個色板改嘅係「{target}」嘅顏色", "下面個色板改嘅係「{target}」嘅顏色", "下面個色板改嘅係「{target}」嘅顏色"]
    },
    "appear.clearColour": {
      en: ["Clear", "Clear", "Clear", "Clear it", "Clear it"],
      yue: ["清除", "清除", "清走", "清走佢", "清走佢"]
    },
    "appear.notSupported": {
      en: ["What this build cannot do", "What this build cannot do", "What this build cannot do", "What this build cannot do", "What this build cannot do"],
      yue: ["呢個版本做唔到嘅嘢", "呢個版本做唔到嘅嘢", "呢個版本做唔到嘅嘢", "呢個版本做唔到嘅嘢", "呢個版本做唔到嘅嘢"]
    },
    "appear.resetElement": {
      en: ["Reset element", "Reset element", "Reset element", "Reset this element", "Reset this element"],
      yue: ["重設元素", "重設元素", "重設呢個元素", "呢個元素打返原形", "呢個元素打返原形"]
    },
  };

  function resolve(key, mode, funny) {
    const entry = STRINGS[key];
    if (!entry) return key;                    // a missing key must be visible, not blank
    const en = entry.en[level(funny, "en")];
    const yue = entry.yue[level(funny, "yue")];
    if (mode === "yue") return yue;
    if (mode !== "bi") return en;
    return en === yue ? en : en + JOIN + yue;
  }

  function format(key, mode, funny, vars) {
    return interpolate(resolve(key, mode, funny), vars);
  }

  g.CX_I18N = { VERSION: 1, STRINGS: STRINGS, CATEGORIES: CATEGORIES, resolve: resolve, format: format };
})(window);
