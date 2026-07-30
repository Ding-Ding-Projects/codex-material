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
      en: ["Codex Studio — {profile}", "Codex Studio — {profile}", "Codex Studio — {profile}",
        "Codex Studio — {profile}", "Codex Studio — {profile}, hard at it"],
      yue: ["Codex Studio — {profile}", "Codex Studio — {profile}", "Codex Studio — {profile}",
        "Codex Studio — {profile}", "Codex Studio — {profile} 開緊工"]
    },
    "app.ready": {
      en: ["Ready. Profile {profile}, model {model}.",
        "Ready. Profile {profile}, model {model}.",
        "Ready — profile {profile}, on {model}.",
        "All set: profile {profile}, running {model}.",
        "Warmed up and waiting — profile {profile}, model {model}. Go on then."],
      yue: ["已就緒。設定檔 {profile}，模型 {model}。",
        "已就緒。設定檔 {profile}，模型 {model}。",
        "搞掂喇 — 設定檔 {profile}，用緊 {model}。",
        "一切就緒：設定檔 {profile}，行緊 {model}。",
        "熱定身等你 — 設定檔 {profile}，模型 {model}，快啲落單啦。"]
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
    "nav.chats": {
      en: ["Chats", "Chats", "Chats", "Chats", "Chats"],
      yue: ["對話", "對話", "傾偈", "傾偈", "吹水位"]
    },
    "nav.chats.hint": {
      en: ["Interactive Codex sessions in the active profile.",
        "Interactive Codex sessions in the active profile.",
        "Your interactive Codex sessions in the active profile.",
        "Where you actually talk to Codex — interactive sessions in the active profile.",
        "Where the talking happens: interactive Codex sessions in the active profile."],
      yue: ["現用設定檔入面嘅互動 Codex 對話。",
        "現用設定檔入面嘅互動 Codex 對話。",
        "喺現用設定檔度同 Codex 傾嘅對話。",
        "真係同 Codex 對話嗰度 — 現用設定檔嘅互動對話。",
        "傾偈就喺呢度：現用設定檔嘅互動 Codex 對話。"]
    },
    "nav.console": {
      en: ["Console", "Console", "Console", "Console", "Console"],
      yue: ["主控台", "主控台", "主控台", "打指令嗰度", "打指令位"]
    },
    "nav.console.hint": {
      en: ["Every CLI subcommand and flag, composed and run from here.",
        "Every CLI subcommand and flag, composed and run from here.",
        "Every CLI subcommand and flag — build the line, then run it.",
        "Every CLI subcommand and flag: point, click, and it runs.",
        "Every CLI subcommand and flag, so you can stop guessing at the shell."],
      yue: ["喺呢度砌好同執行每一個 CLI 子指令同 flag。",
        "喺呢度砌好同執行每一個 CLI 子指令同 flag。",
        "全部 CLI 子指令同 flag — 砌好條線再行。",
        "全部 CLI 子指令同 flag：撳兩下就行得。",
        "全部 CLI 子指令同 flag 都喺度，唔使再靠估打 shell。"]
    },
    "nav.extend": {
      en: ["Extend", "Extend", "Extend", "Extend", "Extend"],
      yue: ["擴充", "擴充", "擴充", "加料", "加料區"]
    },
    "nav.extend.hint": {
      en: ["MCP servers, plugins, marketplaces, skills, hooks and feature flags.",
        "MCP servers, plugins, marketplaces, skills, hooks and feature flags.",
        "MCP servers, plugins, marketplaces, skills, hooks and feature flags — all the bolt-ons.",
        "Everything you bolt on: MCP servers, plugins, marketplaces, skills, hooks and feature flags.",
        "The bolt-on drawer: MCP servers, plugins, marketplaces, skills, hooks and feature flags."],
      yue: ["MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。",
        "MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。",
        "MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標 — 全部加料嘢。",
        "所有加料嘢：MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。",
        "加料抽屜：MCP 伺服器、外掛、市集、技能、掛鈎同功能旗標。"]
    },
    "nav.config": {
      en: ["Config", "Config", "Config", "Config", "Config"],
      yue: ["設定", "設定", "設定", "設定", "設定房"]
    },
    "nav.config.hint": {
      en: ["Every config.toml setting for this profile.",
        "Every config.toml setting for this profile.",
        "Every config.toml setting for this profile, with what each one does.",
        "Every config.toml setting for this profile — no TOML editing required.",
        "Every config.toml setting for this profile, so you never hand-edit TOML again."],
      yue: ["呢個設定檔嘅所有 config.toml 設定。",
        "呢個設定檔嘅所有 config.toml 設定。",
        "呢個設定檔嘅所有 config.toml 設定，仲有每項嘅解釋。",
        "呢個設定檔嘅所有 config.toml 設定 — 唔使自己開 TOML。",
        "呢個設定檔嘅所有 config.toml 設定，由今日起唔使再手改 TOML。"]
    },
    "nav.cost": {
      en: ["Cost", "Cost", "Cost", "Cost", "Cost"],
      yue: ["費用", "費用", "洗費", "洗咗幾多", "銀両"]
    },
    "nav.cost.hint": {
      en: ["API-equivalent cost for the tokens you have used.",
        "API-equivalent cost for the tokens you have used.",
        "What those tokens would have cost on the API.",
        "What those tokens would have cost you on the API, to the cent.",
        "The bill you did not get: what those tokens would cost on the API."],
      yue: ["你用咗嘅 token 換算成 API 價錢。",
        "你用咗嘅 token 換算成 API 價錢。",
        "呢啲 token 用 API 計要幾錢。",
        "呢啲 token 用 API 計要幾錢，計到落個 cent。",
        "你唔使畀嗰張單：呢啲 token 用 API 計要幾錢。"]
    },
    "nav.runtime": {
      en: ["Runtime", "Runtime", "Runtime", "Runtime", "Runtime"],
      yue: ["執行環境", "執行環境", "執行環境", "Runtime", "隻企鵝嗰度"]
    },
    "nav.runtime.hint": {
      en: ["Per-tab WSL instances — spawn one per session and route work through it.",
        "Per-tab WSL instances — spawn one per session and route work through it.",
        "One WSL instance per tab — spawn one per session and run work inside it.",
        "A WSL box per tab: spawn one per session and let it take the work.",
        "A little Linux per tab — spawn one per session and let it do the dirty work."],
      yue: ["每個 tab 一個 WSL 實例 — 每節開一個，工作經佢行。",
        "每個 tab 一個 WSL 實例 — 每節開一個，工作經佢行。",
        "一個 tab 一個 WSL — 每節開一個，啲嘢入面行。",
        "每個 tab 一個 WSL 盒：每節開一個，交嘢俾佢做。",
        "每個 tab 養隻細細嘅 Linux — 每節開一個，污糟嘢交晒俾佢。"]
    },
    "nav.health": {
      en: ["Health", "Health", "Health", "Health", "Health"],
      yue: ["狀態", "狀態", "健康", "身體檢查", "體檢報告"]
    },
    "nav.health.hint": {
      en: ["Doctor checks, account, usage and cloud tasks.",
        "Doctor checks, account, usage and cloud tasks.",
        "Doctor checks, your account, usage and cloud tasks.",
        "The check-up: doctor checks, account, usage and cloud tasks.",
        "The full check-up — doctor checks, account, usage and cloud tasks."],
      yue: ["Doctor 檢查、帳戶、用量同雲端任務。",
        "Doctor 檢查、帳戶、用量同雲端任務。",
        "Doctor 檢查、你個帳戶、用量同雲端任務。",
        "體檢時間：Doctor 檢查、帳戶、用量同雲端任務。",
        "全套體檢 — Doctor 檢查、帳戶、用量同雲端任務。"]
    },
    "nav.history": {
      en: ["History", "History", "History", "History", "History"],
      yue: ["歷史", "歷史", "歷史", "時光機", "後悔藥"]
    },
    "nav.history.hint": {
      en: ["Local git history — undo anything, including an undo.",
        "Local git history — undo anything, including an undo.",
        "Local git history: undo anything here, including an undo.",
        "Local git history — undo anything, even an undo, as often as you like.",
        "Local git history: undo anything, undo the undo, undo that too. It is turtles."],
      yue: ["本機 git 歷史 — 咩都可以復原，連復原本身都復原得。",
        "本機 git 歷史 — 咩都可以復原，連復原本身都復原得。",
        "本機 git 歷史：咩都撤銷得，連撤銷都撤銷得。",
        "本機 git 歷史 — 咩都收得返，連收返嗰下都收得返，幾多次都得。",
        "本機 git 歷史：後悔一次，後悔返嗰次，再後悔多次都得，一路後悔落去。"]
    },
    "nav.changelog": {
      en: ["Changelog", "Changelog", "Changelog", "Changelog", "Changelog"],
      yue: ["更新紀錄", "更新紀錄", "更新紀錄", "更新紀錄", "改咗啲乜"]
    },
    "nav.changelog.hint": {
      en: ["Every released version, with a date filter and search.",
        "Every released version, with a date filter and search.",
        "Every released version — filter by date, search the text.",
        "Every released version, filterable by date and searchable to the word.",
        "Every released version ever — filter by date, hunt by regex, brag in the group chat."],
      yue: ["每一個已發佈版本，可以按日期篩選同搜尋。",
        "每一個已發佈版本，可以按日期篩選同搜尋。",
        "每一個已發佈版本 — 揀日期，搵字。",
        "每一個已發佈版本，可以揀日期範圍，逐個字搵。",
        "有史以來每個版本 — 揀日期、regex 亂咁搵、然後入 group 曬命。"]
    },
    "nav.appearance": {
      en: ["Appearance", "Appearance", "Appearance", "Appearance", "Appearance"],
      yue: ["外觀", "外觀", "外觀", "打扮", "扮靚位"]
    },
    "nav.appearance.hint": {
      en: ["Theme, density, accent, fonts, language and the funny level.",
        "Theme, density, accent, fonts, language and the funny level.",
        "Theme, density, accent, fonts, language and how funny this app is allowed to be.",
        "Theme, density, accent, fonts, language, and exactly how funny this app may get.",
        "Theme, density, accent, fonts, language, and the dial that decides how cheeky I am."],
      yue: ["主題、密度、主色、字型、語言同搞笑程度。",
        "主題、密度、主色、字型、語言同搞笑程度。",
        "主題、密度、主色、字型、語言，仲有呢個 app 可以幾好笑。",
        "主題、密度、主色、字型、語言，同埋呢個 app 准許幾串。",
        "主題、密度、主色、字型、語言，同埋控制我幾串嗰個掣。"]
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
      en: ["Close tabs to the right", "Close tabs to the right", "Close everything to the right",
        "Close everything to the right", "Close everything to the right of here"],
      yue: ["關閉右邊嘅分頁", "關閉右邊嘅分頁", "閂晒右邊啲 tab",
        "右邊啲 tab 一次過閂晒", "右邊啲 tab 一次過閂晒佢"]
    },
    "tab.closeLeft": {
      en: ["Close tabs to the left", "Close tabs to the left", "Close everything to the left",
        "Close everything to the left", "Close everything to the left of here"],
      yue: ["關閉左邊嘅分頁", "關閉左邊嘅分頁", "閂晒左邊啲 tab",
        "左邊啲 tab 一次過閂晒", "左邊啲 tab 一次過閂晒佢"]
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
      en: ["Remove group — its {count} tabs stay open",
        "Remove group — its {count} tabs stay open",
        "Remove this group; its {count} tabs stay open",
        "Drop the group, keep the tabs — all {count} of them stay open",
        "Drop the group, keep the tabs — all {count} of them stay open"],
      yue: ["移除群組 — 入面 {count} 個 tab 唔會閂",
        "移除群組 — 入面 {count} 個 tab 唔會閂",
        "拆咗呢個群組；入面 {count} 個 tab 照開",
        "拆組唔拆 tab — {count} 個 tab 全部照開",
        "拆組唔拆 tab — {count} 個 tab 全部照開，唔使驚"]
    },
    "tab.groupMoveIn": {
      en: ["Move to {group}", "Move to {group}", "Move this tab into {group}",
        "Shift this tab into {group}", "Shift this tab into {group}"],
      yue: ["移去 {group}", "移去 {group}", "將呢個 tab 移入 {group}",
        "搬呢個 tab 入 {group}", "搬呢個 tab 入 {group} 度"]
    },
    "tab.overflow": {
      en: ["{count} more", "{count} more", "{count} more tabs",
        "{count} more tabs hiding in here", "{count} more tabs hiding in here"],
      yue: ["仲有 {count} 個", "仲有 {count} 個", "仲有 {count} 個 tab",
        "仲有 {count} 個 tab 匿埋咗", "仲有 {count} 個 tab 匿埋喺度"]
    },
    "tab.overflowMenu": {
      en: ["Show the hidden tabs", "Show the hidden tabs", "Show the tabs that do not fit",
        "Show me the tabs that do not fit", "Show me the tabs that could not fit"],
      yue: ["顯示匿埋咗嘅 tab", "顯示匿埋咗嘅 tab", "睇下擺唔落嗰啲 tab",
        "睇下擺唔落嗰啲 tab", "睇下擠唔落嗰啲 tab"]
    },
    "tab.bulkContaining": {
      en: ["Close tabs containing text…", "Close tabs containing text…",
        "Close tabs whose title contains…", "Close tabs whose title contains…",
        "Close tabs whose title contains…"],
      yue: ["關閉標題包含某段文字嘅分頁…", "關閉標題包含某段文字嘅分頁…",
        "閂晒標題有呢段字嘅 tab…", "閂晒標題有呢段字嘅 tab…", "閂晒標題有呢段字嘅 tab…"]
    },
    "tab.bulkNotContaining": {
      en: ["Close tabs not containing text…", "Close tabs not containing text…",
        "Close tabs whose title does not contain…", "Close tabs whose title does not contain…",
        "Close tabs whose title does not contain…"],
      yue: ["關閉標題唔包含某段文字嘅分頁…", "關閉標題唔包含某段文字嘅分頁…",
        "閂晒標題冇呢段字嘅 tab…", "閂晒標題冇呢段字嘅 tab…", "閂晒標題冇呢段字嘅 tab…"]
    },
    "tab.bulkPreview": {
      en: ["{count} of {total} tabs match {query}. Review the list before closing.",
        "{count} of {total} tabs match {query}. Review the list before closing.",
        "{count} of {total} tabs match {query} — have a look before they close.",
        "{count} of {total} tabs match {query}. Eyeball the list first; there is no undo for a closed tab.",
        "{count} of {total} tabs match {query}. Eyeball the list first — a closed tab does not come back."],
      yue: ["{total} 個 tab 入面有 {count} 個符合 {query}。閂之前請先睇清楚張清單。",
        "{total} 個 tab 入面有 {count} 個符合 {query}。閂之前請先睇清楚張清單。",
        "{total} 個 tab 入面 {count} 個中咗 {query} — 閂之前望多眼。",
        "{total} 個 tab 入面 {count} 個中咗 {query}。望清楚先，閂咗嘅 tab 冇得返轉頭。",
        "{total} 個 tab 入面 {count} 個中咗 {query}。望清楚先啦，閂咗就冇得叫返佢返嚟。"]
    },
    "tab.bulkPinnedExcluded": {
      en: ["{count} pinned tabs are excluded. Tick include pinned to close them too.",
        "{count} pinned tabs are excluded. Tick include pinned to close them too.",
        "{count} pinned tabs are being spared. Tick include pinned if you want them gone too.",
        "{count} pinned tabs are being spared. Tick include pinned if you really want them gone too.",
        "{count} pinned tabs are hiding behind the pin. Tick include pinned if you really want them gone too."],
      yue: ["有 {count} 個釘住嘅 tab 唔會閂。想連佢哋一齊閂，請剔「包括釘住嘅」。",
        "有 {count} 個釘住嘅 tab 唔會閂。想連佢哋一齊閂，請剔「包括釘住嘅」。",
        "{count} 個釘住嘅 tab 放過咗佢。真係想閂埋就剔「包括釘住嘅」。",
        "{count} 個釘住嘅 tab 暫時逃過一劫。真係想閂埋就剔「包括釘住嘅」。",
        "{count} 個釘住嘅 tab 匿喺個釘後面逃過一劫。真係想閂埋就剔「包括釘住嘅」。"]
    },
    "tab.bulkEmptyQuery": {
      en: ["Type something first — an empty query would match all {total} tabs, so nothing was closed.",
        "Type something first — an empty query would match all {total} tabs, so nothing was closed.",
        "Type something first: an empty query matches all {total} tabs, so nothing was closed.",
        "Nice try — an empty query matches all {total} tabs, so nothing was closed. Type something first.",
        "Nice try. An empty query matches all {total} tabs, so nothing was closed. Type something first."],
      yue: ["請先輸入文字 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。",
        "請先輸入文字 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。",
        "打返啲字先：空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。",
        "咪玩喇 — 空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。打返啲字先。",
        "咪玩喇。空白條件會中晒全部 {total} 個 tab，所以乜都冇閂。打返啲字先啦。"]
    },
    "tab.bulkDone": {
      en: ["Closed {count} tabs. {kept} stayed open.",
        "Closed {count} tabs. {kept} stayed open.",
        "Closed {count} tabs; {kept} stayed open.",
        "{count} tabs gone, {kept} still standing.",
        "{count} tabs gone, {kept} still standing. Tidy."],
      yue: ["閂咗 {count} 個 tab，仲有 {kept} 個照開。",
        "閂咗 {count} 個 tab，仲有 {kept} 個照開。",
        "閂咗 {count} 個 tab；仲有 {kept} 個照開。",
        "{count} 個 tab 走咗，{kept} 個仲企喺度。",
        "{count} 個 tab 走咗，{kept} 個仲企喺度。幾整齊喎。"]
    },
    "tab.closed": {
      en: ["Closed {name}.", "Closed {name}.", "Closed {name}.",
        "{name} is closed.", "{name} has left the building."],
      yue: ["閂咗 {name}。", "閂咗 {name}。", "閂咗 {name} 喇。",
        "{name} 閂咗喇。", "{name} 收工走咗喇。"]
    },
    "tab.restoreClosed": {
      en: ["Reopen {name}", "Reopen {name}", "Reopen {name}",
        "Bring {name} back", "Bring {name} back from the dead"],
      yue: ["重開 {name}", "重開 {name}", "開返 {name}",
        "攞返 {name}", "叫返 {name} 返嚟"]
    },
    "tab.reorder": {
      en: ["Drag to reorder, or press Alt+Shift+Arrow.",
        "Drag to reorder, or press Alt+Shift+Arrow.",
        "Drag to reorder — or Alt+Shift+Arrow if you prefer the keyboard.",
        "Drag them around, or Alt+Shift+Arrow if the mouse is too far away.",
        "Drag them around, or Alt+Shift+Arrow if the mouse is too far away."],
      yue: ["拖曳嚟排序，或者撳 Alt+Shift+方向鍵。",
        "拖曳嚟排序，或者撳 Alt+Shift+方向鍵。",
        "拖住佢排 — 想用鍵盤就撳 Alt+Shift+方向鍵。",
        "拖住佢周圍擺，唔想攞 mouse 就撳 Alt+Shift+方向鍵。",
        "拖住佢周圍擺，隻 mouse 太遠就撳 Alt+Shift+方向鍵。"]
    },
    "tab.searchStrip": {
      en: ["Search the tabs in this strip", "Search the tabs in this strip",
        "Search the tabs in this strip", "Find a tab in this strip", "Find a tab in this strip"],
      yue: ["搜尋呢條 tab 列嘅分頁", "搜尋呢條 tab 列嘅分頁",
        "搵呢條 tab 列嘅 tab", "喺呢條 tab 列度搵 tab", "喺呢條 tab 列度搵返個 tab"]
    },
    "tab.searchGroup": {
      en: ["Search the tabs in {group}", "Search the tabs in {group}",
        "Search the tabs in {group}", "Find a tab in {group}", "Find a tab in {group}"],
      yue: ["搜尋 {group} 入面嘅分頁", "搜尋 {group} 入面嘅分頁",
        "搵 {group} 入面嘅 tab", "喺 {group} 度搵 tab", "喺 {group} 度搵返個 tab"]
    },
    "tab.searchGroups": {
      en: ["Search tab groups by name", "Search tab groups by name",
        "Search tab groups by name", "Find a tab group by name", "Find a tab group by name"],
      yue: ["按名搜尋 tab 群組", "按名搜尋 tab 群組",
        "按個名搵 tab 群組", "用個名搵返個 tab 群組", "用個名搵返個 tab 群組"]
    },
    "tab.searchAll": {
      en: ["Search every open tab in every window", "Search every open tab in every window",
        "Search every open tab in every window", "Find any tab, in any window",
        "Find any tab, in any window, anywhere"],
      yue: ["搜尋所有視窗嘅所有已開分頁", "搜尋所有視窗嘅所有已開分頁",
        "搵晒所有視窗嘅 tab", "邊個視窗嘅 tab 都搵得返", "邊個視窗嘅 tab 都搵得返，一個都跑唔甩"]
    },
    "tab.searchResultAt": {
      en: ["{name} — {window} · {strip} · {group}", "{name} — {window} · {strip} · {group}",
        "{name} — {window} · {strip} · {group}", "{name}, over in {window} · {strip} · {group}",
        "{name}, hiding over in {window} · {strip} · {group}"],
      yue: ["{name} — {window} · {strip} · {group}", "{name} — {window} · {strip} · {group}",
        "{name} — {window} · {strip} · {group}", "{name}，喺 {window} · {strip} · {group} 嗰邊",
        "{name}，匿咗喺 {window} · {strip} · {group} 嗰邊"]
    },
    "tab.editAppearance": {
      en: ["Edit tab appearance…", "Edit tab appearance…", "Edit this tab's appearance…",
        "Dress this tab up…", "Dress this tab up…"],
      yue: ["編輯分頁外觀…", "編輯分頁外觀…", "改呢個 tab 嘅外觀…",
        "幫呢個 tab 扮靚…", "幫呢個 tab 扮靚…"]
    },
    "tab.editGroupAppearance": {
      en: ["Edit group appearance…", "Edit group appearance…", "Edit this group's appearance…",
        "Dress this group up…", "Dress this group up…"],
      yue: ["編輯群組外觀…", "編輯群組外觀…", "改呢個群組嘅外觀…",
        "幫呢個群組扮靚…", "幫呢個群組扮靚…"]
    },
    "tab.unsaved": {
      en: ["{name} has unsaved work.", "{name} has unsaved work.",
        "{name} has unsaved work in it.", "{name} still has unsaved work in it.",
        "{name} is still holding unsaved work."],
      yue: ["{name} 有未儲存嘅嘢。", "{name} 有未儲存嘅嘢。",
        "{name} 入面仲有嘢未 save。", "{name} 入面仲有嘢未 save 㗎。",
        "{name} 仲揸住啲未 save 嘅嘢。"]
    },

    /* ---- search and the regex builder */
    "search.placeholder": {
      en: ["Search", "Search", "Search", "Search for anything", "Search — type and I will hunt it down"],
      yue: ["搜尋", "搜尋", "搵嘢", "搵咩都得", "打幾隻字，我幫你搵"]
    },
    "search.regexOn": {
      en: ["Regular expressions on", "Regular expressions on", "Regex on",
        "Regex is on", "Regex mode on — full firepower"],
      yue: ["已開啟正規表達式", "已開啟正規表達式", "regex 開咗",
        "regex 開咗喇", "regex 全開，火力全放"]
    },
    "search.regexOff": {
      en: ["Regular expressions off — plain text search", "Regular expressions off — plain text search",
        "Regex off — plain text search", "Regex off, plain text search",
        "Regex off — plain, sensible, boring text search"],
      yue: ["已關閉正規表達式 — 純文字搜尋", "已關閉正規表達式 — 純文字搜尋",
        "regex 閂咗 — 純文字搜尋", "regex 閂咗，行純文字搜尋",
        "regex 閂咗 — 老老實實純文字搵，唔玩花臣"]
    },
    "search.noMatches": {
      en: ["No matches for {query}.", "No matches for {query}.", "Nothing matches {query}.",
        "Nothing matches {query} — not one thing.", "Nothing matches {query}. Not a sausage."],
      yue: ["{query} 冇任何符合結果。", "{query} 冇任何符合結果。", "{query} 乜都搵唔到。",
        "{query} 乜都搵唔到 — 一個都冇。", "{query} 乜都搵唔到，白鴿眼咁清。"]
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
      en: ["Invalid pattern: {message}", "Invalid pattern: {message}",
        "That pattern will not compile: {message}",
        "That pattern will not compile: {message}",
        "That pattern will not compile: {message}"],
      yue: ["樣式無效：{message}", "樣式無效：{message}",
        "呢個樣式 compile 唔到：{message}",
        "呢個樣式 compile 唔到：{message}",
        "呢個樣式 compile 唔到，佢投訴：{message}"]
    },
    "search.truncated": {
      en: ["Showing the first {count} matches.", "Showing the first {count} matches.",
        "Showing the first {count} matches only.",
        "Only the first {count} matches are shown — there were more.",
        "Only the first {count} matches are shown; there were more, but we stopped counting."],
      yue: ["只顯示頭 {count} 個結果。", "只顯示頭 {count} 個結果。",
        "淨係顯示頭 {count} 個結果。",
        "淨係顯示頭 {count} 個結果 — 其實仲有更多。",
        "淨係顯示頭 {count} 個結果；其實仲有更多，數到攰。"]
    },
    "search.otherTab": {
      en: ["{count} matches are on the {tab} tab.", "{count} matches are on the {tab} tab.",
        "{count} matches are over on the {tab} tab.",
        "{count} matches are hiding on the {tab} tab.",
        "{count} matches are hiding on the {tab} tab. Go on, have a look."],
      yue: ["有 {count} 個結果喺 {tab} 分頁度。", "有 {count} 個結果喺 {tab} 分頁度。",
        "有 {count} 個結果喺 {tab} 嗰個 tab 度。",
        "有 {count} 個結果匿咗喺 {tab} 嗰個 tab 度。",
        "有 {count} 個結果匿咗喺 {tab} 嗰個 tab 度，過去睇下啦。"]
    },
    "search.builderOpen": {
      en: ["Open the regex builder", "Open the regex builder", "Open the regex builder",
        "Let the builder write the pattern", "Let the builder write the pattern for you"],
      yue: ["開啟 regex 產生器", "開啟 regex 產生器", "開個 regex 產生器",
        "等產生器幫你砌個樣式", "等產生器幫你砌個樣式，唔使自己諗"]
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
      en: ["No notifications yet.", "No notifications yet.", "No notifications yet.",
        "No notifications yet — quiet in here.", "No notifications yet. Beautifully quiet in here."],
      yue: ["暫時未有通知。", "暫時未有通知。", "暫時未有通知。",
        "暫時未有通知 — 幾清靜。", "暫時未有通知，清靜到有啲得意。"]
    },
    "notify.dismissed": {
      en: ["Dismissed. It is still in the notification centre.",
        "Dismissed. It is still in the notification centre.",
        "Dismissed — it is still in the notification centre if you want it back.",
        "Dismissed. It is still in the notification centre, so nothing is lost.",
        "Dismissed. It is still in the notification centre, so nothing is lost."],
      yue: ["已收起。佢仲喺通知中心度。",
        "已收起。佢仲喺通知中心度。",
        "收起咗 — 想睇返就去通知中心搵佢。",
        "收起咗。佢仲喺通知中心度，冇嘢會唔見。",
        "收起咗。佢仲喺通知中心度，冇嘢會唔見，放心。"]
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
      en: ["Copied to the clipboard.", "Copied to the clipboard.", "Copied to the clipboard.",
        "Copied — it is on your clipboard.", "Copied — it is on your clipboard, go paste it."],
      yue: ["已複製到剪貼簿。", "已複製到剪貼簿。", "copy 咗去剪貼簿。",
        "copy 咗 — 已經喺你個剪貼簿度。", "copy 咗 — 已經喺你個剪貼簿度，快啲 paste 啦。"]
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
      en: ["The MCP server {name} could not be added: {message}. Nothing was written to config.toml.",
        "The MCP server {name} could not be added: {message}. Nothing was written to config.toml.",
        "Adding the MCP server {name} failed: {message}. Nothing was written to config.toml.",
        "The MCP server {name} would not go in: {message}. Nothing was written to config.toml, so nothing is broken.",
        "The MCP server {name} refused to move in: {message}. Nothing was written to config.toml, so nothing is broken."],
      yue: ["加唔到 MCP 伺服器 {name}：{message}。config.toml 冇寫入任何嘢。",
        "加唔到 MCP 伺服器 {name}：{message}。config.toml 冇寫入任何嘢。",
        "加 MCP 伺服器 {name} 失敗：{message}。config.toml 乜都冇寫。",
        "MCP 伺服器 {name} 點都入唔到：{message}。config.toml 乜都冇寫，所以冇搞爛嘢。",
        "MCP 伺服器 {name} 死都唔肯搬入嚟：{message}。config.toml 乜都冇寫，所以冇搞爛嘢。"]
    },
    "err.mcpUnreachable": {
      en: ["The MCP server {name} did not answer at {url}. Check it is running, then enable it again here.",
        "The MCP server {name} did not answer at {url}. Check it is running, then enable it again here.",
        "No answer from the MCP server {name} at {url}. Check it is running, then enable it again here.",
        "The MCP server {name} is not answering at {url}. Check it is running, then enable it again here.",
        "Called {url} for the MCP server {name} and got dead air. Check it is running, then enable it again here."],
      yue: ["MCP 伺服器 {name} 喺 {url} 冇回應。請確認佢行緊，然後喺呢度再啟用佢。",
        "MCP 伺服器 {name} 喺 {url} 冇回應。請確認佢行緊，然後喺呢度再啟用佢。",
        "喺 {url} 度撳唔到 MCP 伺服器 {name}。睇下佢行緊未，然後喺呢度再啟用佢。",
        "MCP 伺服器 {name} 喺 {url} 度唔應機。睇下佢行緊未，然後喺呢度再啟用佢。",
        "打 {url} 搵 MCP 伺服器 {name}，得把聲都冇。睇下佢行緊未，然後喺呢度再啟用佢。"]
    },
    "err.pluginInstall": {
      en: ["The plugin {name} did not install: {message}. Nothing was changed.",
        "The plugin {name} did not install: {message}. Nothing was changed.",
        "Installing the plugin {name} failed: {message}. Nothing was changed.",
        "The plugin {name} would not install: {message}. Nothing was changed, so you are exactly where you were.",
        "The plugin {name} took one look and left: {message}. Nothing was changed, so you are exactly where you were."],
      yue: ["外掛 {name} 裝唔到：{message}。冇改動過任何嘢。",
        "外掛 {name} 裝唔到：{message}。冇改動過任何嘢。",
        "裝外掛 {name} 失敗：{message}。乜都冇改到。",
        "外掛 {name} 死都唔肯裝：{message}。乜都冇改到，你仲喺原地。",
        "外掛 {name} 望一望就走咗：{message}。乜都冇改到，你仲喺原地。"]
    },
    "err.pluginUninstall": {
      en: ["The plugin {name} could not be removed: {message}. It is still installed.",
        "The plugin {name} could not be removed: {message}. It is still installed.",
        "Removing the plugin {name} failed: {message}. It is still installed.",
        "The plugin {name} would not budge: {message}. It is still installed.",
        "The plugin {name} is clinging on: {message}. It is still installed."],
      yue: ["移除唔到外掛 {name}：{message}。佢仲裝住喺度。",
        "移除唔到外掛 {name}：{message}。佢仲裝住喺度。",
        "拆外掛 {name} 失敗：{message}。佢仲喺度。",
        "外掛 {name} 郁都唔郁：{message}。佢仲裝住喺度。",
        "外掛 {name} 揸到實一實：{message}。佢仲裝住喺度。"]
    },
    "err.wslMissing": {
      en: ["WSL is not installed, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.",
        "WSL is not installed, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.",
        "There is no WSL here, so the distro {distro} cannot start. Run wsl --install in an elevated terminal, then reopen Runtime.",
        "No WSL on this machine, so the distro {distro} has nowhere to start. Run wsl --install in an elevated terminal, then reopen Runtime.",
        "No WSL on this machine at all, so the distro {distro} has nowhere to live. Run wsl --install in an elevated terminal, then reopen Runtime."],
      yue: ["未安裝 WSL，所以 {distro} 開唔到。請喺管理員終端機行 wsl --install，然後再開返 Runtime。",
        "未安裝 WSL，所以 {distro} 開唔到。請喺管理員終端機行 wsl --install，然後再開返 Runtime。",
        "部機冇 WSL，所以 {distro} 開唔到。喺管理員終端機行 wsl --install，然後再開返 Runtime。",
        "部機根本冇 WSL，{distro} 冇地方開。喺管理員終端機行 wsl --install，然後再開返 Runtime。",
        "部機根本冇 WSL，{distro} 連間屋都冇。喺管理員終端機行 wsl --install，然後再開返 Runtime。"]
    },
    "err.wslExec": {
      en: ["The command in {distro} exited with code {code}. Its output is in the Runtime log.",
        "The command in {distro} exited with code {code}. Its output is in the Runtime log.",
        "The command in {distro} came back with code {code}. Its output is in the Runtime log.",
        "The command in {distro} bailed out with code {code}. Its output is in the Runtime log.",
        "The command in {distro} stormed off with code {code}. Its output is in the Runtime log."],
      yue: ["{distro} 入面嘅指令以代碼 {code} 結束。輸出喺 Runtime 記錄度。",
        "{distro} 入面嘅指令以代碼 {code} 結束。輸出喺 Runtime 記錄度。",
        "{distro} 入面嗰條指令回咗代碼 {code}。輸出喺 Runtime 記錄度。",
        "{distro} 入面嗰條指令劈炮，代碼 {code}。輸出喺 Runtime 記錄度。",
        "{distro} 入面嗰條指令發脾氣走咗，代碼 {code}。輸出喺 Runtime 記錄度。"]
    },
    "err.editorMissing": {
      en: ["{editor} was not found, so {path} was not opened. Pick another editor in Config.",
        "{editor} was not found, so {path} was not opened. Pick another editor in Config.",
        "{editor} is not on this machine, so {path} was not opened. Pick another editor in Config.",
        "{editor} is nowhere on this machine, so {path} stayed shut. Pick another editor in Config.",
        "{editor} is nowhere on this machine, so {path} stayed firmly shut. Pick another editor in Config."],
      yue: ["搵唔到 {editor}，所以冇開到 {path}。請喺 Config 揀第個編輯器。",
        "搵唔到 {editor}，所以冇開到 {path}。請喺 Config 揀第個編輯器。",
        "部機冇 {editor}，所以 {path} 開唔到。喺 Config 揀第個編輯器。",
        "成部機都搵唔到 {editor}，{path} 冇開到。喺 Config 揀第個編輯器。",
        "成部機都搵唔到 {editor}，{path} 咪繼續閂實囉。喺 Config 揀第個編輯器。"]
    },
    "err.historyWrite": {
      en: ["The version history could not be written: {message}. Your change was still applied — only the snapshot is missing.",
        "The version history could not be written: {message}. Your change was still applied — only the snapshot is missing.",
        "The version history did not save: {message}. Your change was still applied; only the snapshot is missing.",
        "The version history did not save: {message}. Your change went through anyway — only the snapshot is missing.",
        "The version history dropped the pen: {message}. Your change went through anyway — only the snapshot is missing."],
      yue: ["版本歷史寫唔到：{message}。你嘅改動照樣生效 — 淨係少咗個快照。",
        "版本歷史寫唔到：{message}。你嘅改動照樣生效 — 淨係少咗個快照。",
        "版本歷史 save 唔到：{message}。你嘅改動照樣生效；淨係少咗個快照。",
        "版本歷史 save 唔到：{message}。你嘅改動照過 — 淨係少咗個快照。",
        "版本歷史寫寫下甩咗支筆：{message}。你嘅改動照過 — 淨係少咗個快照。"]
    },
    "err.regexTimeout": {
      en: ["Evaluating {pattern} was stopped after {ms} ms — it may backtrack catastrophically. Simplify the pattern, or shorten the sample.",
        "Evaluating {pattern} was stopped after {ms} ms — it may backtrack catastrophically. Simplify the pattern, or shorten the sample.",
        "{pattern} was cut off after {ms} ms — it looks like catastrophic backtracking. Simplify the pattern, or shorten the sample.",
        "{pattern} was still chewing after {ms} ms, so it was stopped — that smells like catastrophic backtracking. Simplify the pattern, or shorten the sample.",
        "{pattern} was still chewing after {ms} ms and got sent home — classic catastrophic backtracking. Simplify the pattern, or shorten the sample."],
      yue: ["{pattern} 行咗 {ms} 毫秒之後被中止 — 可能出現災難性回溯。請簡化樣式，或者縮短樣本。",
        "{pattern} 行咗 {ms} 毫秒之後被中止 — 可能出現災難性回溯。請簡化樣式，或者縮短樣本。",
        "{pattern} 行到 {ms} 毫秒就 cut 咗 — 睇落係災難性回溯。簡化個樣式，或者縮短樣本。",
        "{pattern} 嚼咗 {ms} 毫秒都未完，唯有截停佢 — 好似災難性回溯。簡化個樣式，或者縮短樣本。",
        "{pattern} 嚼咗 {ms} 毫秒都未肯收工，勸咗佢返屋企 — 典型災難性回溯。簡化個樣式，或者縮短樣本。"]
    },
    "err.tomlWriteRefused": {
      en: ["{path} was not written: {reason}. The file on disk is unchanged.",
        "{path} was not written: {reason}. The file on disk is unchanged.",
        "{path} was left alone: {reason}. The file on disk is unchanged.",
        "{path} was left well alone: {reason}. The file on disk is unchanged.",
        "{path} was left well alone: {reason}. The file on disk has not moved a byte."],
      yue: ["冇寫入 {path}：{reason}。硬碟上嗰個檔案原封不動。",
        "冇寫入 {path}：{reason}。硬碟上嗰個檔案原封不動。",
        "{path} 冇郁過：{reason}。硬碟上嗰個檔案原封不動。",
        "{path} 一隻手指都冇掂過：{reason}。硬碟上嗰個檔案原封不動。",
        "{path} 一隻手指都冇掂過：{reason}。硬碟上嗰個檔案一個 byte 都冇郁。"]
    },
    "err.sessionMissing": {
      en: ["The session {id} is no longer on disk. Start a new chat, or resume another session.",
        "The session {id} is no longer on disk. Start a new chat, or resume another session.",
        "The session {id} is gone from disk. Start a new chat, or resume another session.",
        "The session {id} has vanished from disk — probably pruned. Start a new chat, or resume another session.",
        "The session {id} has vanished from disk, probably pruned by a tidy hand. Start a new chat, or resume another session."],
      yue: ["對話 {id} 已經唔喺硬碟度。開個新對話，或者續返另一個對話。",
        "對話 {id} 已經唔喺硬碟度。開個新對話，或者續返另一個對話。",
        "對話 {id} 喺硬碟度冇咗。開個新對話，或者續返另一個對話。",
        "對話 {id} 喺硬碟度消失咗 — 好可能俾人清咗。開個新對話，或者續返另一個對話。",
        "對話 {id} 喺硬碟度人間蒸發，多數俾人手快清咗。開個新對話，或者續返另一個對話。"]
    },
    "err.permissionDenied": {
      en: ["Windows refused access to {path}. Grant access, or choose a folder Codex Studio can write to.",
        "Windows refused access to {path}. Grant access, or choose a folder Codex Studio can write to.",
        "Windows said no to {path}. Grant access, or choose a folder Codex Studio can write to.",
        "Windows slammed the door on {path}. Grant access, or choose a folder Codex Studio can write to.",
        "Windows slammed the door on {path} and locked it. Grant access, or choose a folder Codex Studio can write to."],
      yue: ["Windows 拒絕存取 {path}。請開放權限，或者揀個 Codex Studio 寫得入嘅資料夾。",
        "Windows 拒絕存取 {path}。請開放權限，或者揀個 Codex Studio 寫得入嘅資料夾。",
        "Windows 唔畀掂 {path}。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。",
        "Windows 喺 {path} 度大力閂埋度門。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。",
        "Windows 喺 {path} 度閂埋度門仲落埋鎖。開返權限，或者揀個 Codex Studio 寫得入嘅資料夾。"]
    },
    "err.commandFailed": {
      en: ["{command} exited with code {code}. The full output is in the console.",
        "{command} exited with code {code}. The full output is in the console.",
        "{command} came back with code {code}. The full output is in the console.",
        "{command} bailed out with code {code}. The full output is in the console.",
        "{command} threw its hands up with code {code}. The full output is in the console."],
      yue: ["{command} 以代碼 {code} 結束。完整輸出喺主控台度。",
        "{command} 以代碼 {code} 結束。完整輸出喺主控台度。",
        "{command} 回咗代碼 {code}。完整輸出喺主控台度。",
        "{command} 劈炮走咗，代碼 {code}。完整輸出喺主控台度。",
        "{command} 攤大手掌唔做，代碼 {code}。完整輸出喺主控台度。"]
    },
    "err.profileMissing": {
      en: ["The profile {name} no longer exists. Pick another profile, or create {name} again in Config.",
        "The profile {name} no longer exists. Pick another profile, or create {name} again in Config.",
        "The profile {name} is gone. Pick another profile, or create {name} again in Config.",
        "The profile {name} has left the building. Pick another profile, or create {name} again in Config.",
        "The profile {name} has left the building without a note. Pick another profile, or create {name} again in Config."],
      yue: ["設定檔 {name} 已經唔存在。揀第個設定檔，或者喺 Config 度重新建立 {name}。",
        "設定檔 {name} 已經唔存在。揀第個設定檔，或者喺 Config 度重新建立 {name}。",
        "設定檔 {name} 冇咗。揀第個設定檔，或者喺 Config 度起返個 {name}。",
        "設定檔 {name} 走咗佬。揀第個設定檔，或者喺 Config 度起返個 {name}。",
        "設定檔 {name} 走咗佬，仲要連張字條都冇。揀第個設定檔，或者喺 Config 度起返個 {name}。"]
    },
    "err.importInvalid": {
      en: ["{file} is not a Codex Studio theme: {message}. Nothing was imported and your current appearance is untouched.",
        "{file} is not a Codex Studio theme: {message}. Nothing was imported and your current appearance is untouched.",
        "{file} is not a Codex Studio theme — {message}. Nothing was imported; your current appearance is untouched.",
        "{file} is not a Codex Studio theme, whatever it thinks it is: {message}. Nothing was imported; your current appearance is untouched.",
        "{file} is not a Codex Studio theme, whatever it thinks it is: {message}. Nothing was imported, and your current look is exactly as you left it."],
      yue: ["{file} 唔係 Codex Studio 主題檔：{message}。冇匯入任何嘢，你而家嘅外觀原封不動。",
        "{file} 唔係 Codex Studio 主題檔：{message}。冇匯入任何嘢，你而家嘅外觀原封不動。",
        "{file} 唔係 Codex Studio 主題檔 — {message}。乜都冇 import 到；你而家嘅外觀原封不動。",
        "{file} 唔理佢自認係乜，總之唔係 Codex Studio 主題檔：{message}。乜都冇 import 到；你而家嘅外觀原封不動。",
        "{file} 唔理佢自認係乜，總之唔係 Codex Studio 主題檔：{message}。乜都冇 import 到，你個樣同你走嗰陣一模一樣。"]
    },
    "err.fontMissing": {
      en: ["The font {font} is not installed, so a fallback face is being drawn. Install {font}, or pick another family in Appearance.",
        "The font {font} is not installed, so a fallback face is being drawn. Install {font}, or pick another family in Appearance.",
        "The font {font} is not on this machine, so a fallback face is being drawn. Install {font}, or pick another family in Appearance.",
        "The font {font} is nowhere on this machine, so a fallback face is standing in. Install {font}, or pick another family in Appearance.",
        "The font {font} is nowhere on this machine, so a stunt double is standing in. Install {font}, or pick another family in Appearance."],
      yue: ["字型 {font} 未安裝，所以而家用緊後備字型。請安裝 {font}，或者喺 Appearance 揀第隻字型。",
        "字型 {font} 未安裝，所以而家用緊後備字型。請安裝 {font}，或者喺 Appearance 揀第隻字型。",
        "部機冇 {font} 呢隻字型，而家用緊後備嗰隻。裝返 {font}，或者喺 Appearance 揀第隻。",
        "成部機都搵唔到 {font}，而家搵咗個替工頂住。裝返 {font}，或者喺 Appearance 揀第隻。",
        "成部機都搵唔到 {font}，而家搵咗個替身頂住檔。裝返 {font}，或者喺 Appearance 揀第隻。"]
    },
    "err.exportFailed": {
      en: ["The export to {path} failed: {message}. Nothing was written.",
        "The export to {path} failed: {message}. Nothing was written.",
        "Exporting to {path} failed: {message}. Nothing was written.",
        "The export to {path} fell over: {message}. Nothing was written.",
        "The export to {path} fell over on the doorstep: {message}. Nothing was written."],
      yue: ["匯出去 {path} 失敗：{message}。乜都冇寫到。",
        "匯出去 {path} 失敗：{message}。乜都冇寫到。",
        "export 去 {path} 失敗：{message}。乜都冇寫到。",
        "export 去 {path} 仆咗街：{message}。乜都冇寫到。",
        "export 去 {path} 喺門口位仆咗街：{message}。乜都冇寫到。"]
    },
    "err.authExpired": {
      en: ["The credentials for {account} expired on {date}. Sign in again from Health.",
        "The credentials for {account} expired on {date}. Sign in again from Health.",
        "The credentials for {account} ran out on {date}. Sign in again from Health.",
        "The credentials for {account} ran out on {date} and Codex noticed. Sign in again from Health.",
        "The credentials for {account} ran out on {date}, and Codex noticed immediately. Sign in again from Health."],
      yue: ["{account} 嘅憑證喺 {date} 過期。請喺 Health 度重新登入。",
        "{account} 嘅憑證喺 {date} 過期。請喺 Health 度重新登入。",
        "{account} 嘅憑證喺 {date} 到期咗。喺 Health 度重新登入。",
        "{account} 嘅憑證喺 {date} 到期，Codex 一眼就睇穿。喺 Health 度重新登入。",
        "{account} 嘅憑證喺 {date} 到期，Codex 即刻就發現咗。喺 Health 度重新登入。"]
    },
    "err.diskFull": {
      en: ["There is not enough free space to write {path}. Free some space on that drive, then try again.",
        "There is not enough free space to write {path}. Free some space on that drive, then try again.",
        "There is no room left to write {path}. Free some space on that drive, then try again.",
        "There is no room left to write {path} — the drive is full. Free some space, then try again.",
        "There is no room left to write {path}; that drive is stuffed. Free some space, then try again."],
      yue: ["空間唔夠，寫唔到 {path}。請喺嗰隻碟清返啲空間，然後再試。",
        "空間唔夠，寫唔到 {path}。請喺嗰隻碟清返啲空間，然後再試。",
        "冇位寫 {path}。喺嗰隻碟清返啲空間，然後再試。",
        "冇位寫 {path} — 隻碟爆咗。清返啲空間，然後再試。",
        "冇位寫 {path}；隻碟塞到滿瀉。清返啲空間，然後再試。"]
    },
    "err.unknown": {
      en: ["Something failed and only said: {message}. The details are in the notification centre.",
        "Something failed and only said: {message}. The details are in the notification centre.",
        "Something failed with nothing but: {message}. The details are in the notification centre.",
        "Something failed and would only mutter: {message}. The details are in the notification centre.",
        "Something failed and would only mutter {message} before wandering off. The details are in the notification centre."],
      yue: ["有嘢出錯，佢淨係講咗一句：{message}。詳情喺通知中心度。",
        "有嘢出錯，佢淨係講咗一句：{message}。詳情喺通知中心度。",
        "有嘢出錯，得返一句：{message}。詳情喺通知中心度。",
        "有嘢出錯，佢細細聲咕嚕咗句：{message}。詳情喺通知中心度。",
        "有嘢出錯，咕嚕咗句 {message} 就行開咗。詳情喺通知中心度。"]
    },
    /* ---- errors: the voice moves, the fact never does. Every level below names
       the same path, the same count and the same failure text, because a warning
       nobody can act on is a broken warning rather than a funny one. ---- */
    "err.state": {
      en: ["Could not read the Codex state: {detail}", "Could not read the Codex state: {detail}",
        "Could not read the Codex state — {detail}", "Could not read the Codex state. It said: {detail}",
        "Could not read the Codex state. Its exact words: {detail}"],
      yue: ["讀唔到 Codex 嘅狀態：{detail}", "讀唔到 Codex 嘅狀態：{detail}",
        "讀唔到 Codex 狀態 — {detail}", "讀唔到 Codex 狀態，佢話：{detail}",
        "讀唔到 Codex 狀態，佢原句咁講：{detail}"]
    },
    "err.version": {
      en: ["Could not run the codex binary: {detail}", "Could not run the codex binary: {detail}",
        "Could not run `codex` — {detail}", "Could not run `codex`. It said: {detail}",
        "Could not run `codex`. Is it installed? It said: {detail}"],
      yue: ["行唔到 codex：{detail}", "行唔到 codex：{detail}", "行唔到 `codex` — {detail}",
        "行唔到 `codex`，佢話：{detail}", "行唔到 `codex`，裝咗未呀？佢話：{detail}"]
    },
    "err.section": {
      en: ["The {section} list could not be read.", "The {section} list could not be read.",
        "Could not read the {section} list.", "Could not read the {section} list — so it is empty here, not on your machine.",
        "Could not read the {section} list. It looks empty here, but that is this panel failing, not your machine being tidy."],
      yue: ["讀唔到 {section} 個清單。", "讀唔到 {section} 個清單。", "讀唔到 {section} 清單。",
        "讀唔到 {section} 清單 — 所以呢度空咗，唔係你部機真係冇。",
        "讀唔到 {section} 清單。呢度睇落空空如也，但係呢版壞咗嗻，唔係你部機咁乾淨。"]
    },
    "err.history": {
      en: ["The history could not be written: {detail}", "The history could not be written: {detail}",
        "Could not write the history — {detail}", "Could not write the history. Your change stands; the undo entry does not: {detail}",
        "Could not write the history. Your change went through fine — it just will not have an undo entry: {detail}"],
      yue: ["寫唔到歷史紀錄：{detail}", "寫唔到歷史紀錄：{detail}", "寫唔到歷史紀錄 — {detail}",
        "寫唔到歷史紀錄。你改嘅嘢照生效，但係冇得 undo：{detail}",
        "寫唔到歷史紀錄。你改嗰下係成功咗嘅，只係冇留低個 undo 位：{detail}"]
    },
    "err.wsl": {
      en: ["WSL could not be reached: {detail}", "WSL could not be reached: {detail}",
        "Could not reach WSL — {detail}", "Could not reach WSL. Installed? It said: {detail}",
        "Could not reach WSL. Either it is not installed or it is sulking: {detail}"],
      yue: ["搵唔到 WSL：{detail}", "搵唔到 WSL：{detail}", "搵唔到 WSL — {detail}",
        "搵唔到 WSL，裝咗未？佢話：{detail}", "搵唔到 WSL。可能未裝，可能佢扭計：{detail}"]
    },
    "err.fonts": {
      en: ["The installed fonts could not be listed: {detail}", "The installed fonts could not be listed: {detail}",
        "Could not list the installed fonts — {detail}", "Could not list your installed fonts. It said: {detail}",
        "Could not list your installed fonts, so you get the bundled five. It said: {detail}"],
      yue: ["讀唔到你部機裝咗嘅字體：{detail}", "讀唔到你部機裝咗嘅字體：{detail}",
        "列唔到啲字體 — {detail}", "讀唔到你部機啲字體，佢話：{detail}",
        "讀唔到你部機啲字體，所以淨係得打包嗰五隻。佢話：{detail}"]
    },
    "config.written": {
      en: ["Wrote {count} settings to {path}.", "Wrote {count} settings to {path}.",
        "Wrote {count} settings into {path}.", "Wrote {count} settings into {path} — everything else in it is untouched.",
        "Wrote {count} settings into {path}. Everything else in that file is exactly where you left it."],
      yue: ["寫咗 {count} 個設定入 {path}。", "寫咗 {count} 個設定入 {path}。",
        "{count} 個設定寫咗入 {path}。", "{count} 個設定寫咗入 {path} —— 入面其他嘢一律冇郁過。",
        "{count} 個設定寫咗入 {path}。份檔入面其他嘢，你點擺佢就仲喺度。"]
    },
    "config.nothingToWrite": {
      en: ["This profile has no overrides to write.", "This profile has no overrides to write.",
        "Nothing to write — this profile overrides nothing.", "Nothing to write: this profile overrides nothing yet.",
        "Nothing to write. This profile overrides nothing, so the file stays as it is."],
      yue: ["呢個 profile 冇嘢要寫。", "呢個 profile 冇嘢要寫。",
        "冇嘢寫 —— 呢個 profile 咩都冇改。", "冇嘢寫，呢個 profile 暫時乜都冇 override。",
        "冇嘢寫。呢個 profile 咩都冇改，份檔照舊。"]
    },
    "err.configWrite": {
      en: ["The settings could not be written: {detail}", "The settings could not be written: {detail}",
        "Could not write the settings — {detail}", "Could not write the settings. It said: {detail}",
        "Could not write the settings. Nothing after the failure was applied. It said: {detail}"],
      yue: ["寫唔到啲設定：{detail}", "寫唔到啲設定：{detail}", "寫唔到設定 — {detail}",
        "寫唔到設定，佢話：{detail}", "寫唔到設定，出事之後嗰啲一個都冇寫入。佢話：{detail}"]
    },
    "warn.configPartial": {
      en: ["{count} settings were written before it stopped: {keys}",
        "{count} settings were written before it stopped: {keys}",
        "{count} settings landed before it stopped — {keys}",
        "{count} settings landed before it stopped. These are in the file: {keys}",
        "{count} settings landed before it gave up. These are in the file, the rest are not: {keys}"],
      yue: ["停之前寫咗 {count} 個設定：{keys}", "停之前寫咗 {count} 個設定：{keys}",
        "停之前有 {count} 個寫咗入去 — {keys}", "停之前有 {count} 個入咗檔：{keys}",
        "佢放棄之前有 {count} 個入咗檔，其餘冇：{keys}"]
    },
    "err.editor": {
      en: ["The editor could not be opened: {detail}", "The editor could not be opened: {detail}",
        "Could not open the editor — {detail}", "Could not open the editor. It said: {detail}",
        "Could not open the editor. It said, and I quote: {detail}"],
      yue: ["開唔到編輯器：{detail}", "開唔到編輯器：{detail}", "開唔到編輯器 — {detail}",
        "開唔到編輯器，佢話：{detail}", "開唔到編輯器，佢原句係咁：{detail}"]
    },
    "err.bulkclose": {
      en: ["No tabs were closed: {detail}", "No tabs were closed: {detail}",
        "Nothing was closed — {detail}", "Nothing was closed. Reason: {detail}",
        "Nothing was closed, which is the safe outcome. Reason: {detail}"],
      yue: ["冇閂到任何 tab：{detail}", "冇閂到任何 tab：{detail}", "咩都冇閂到 — {detail}",
        "咩都冇閂到，原因：{detail}", "咩都冇閂到 — 咁樣至安全。原因：{detail}"]
    },
    "err.config": {
      en: ["{path} does not parse: {detail}", "{path} does not parse: {detail}",
        "{path} does not parse — {detail}", "{path} will not parse. Nothing was written. It said: {detail}",
        "{path} will not parse, so nothing was written and your old file is untouched. It said: {detail}"],
      yue: ["{path} 解析唔到：{detail}", "{path} 解析唔到：{detail}", "{path} 解析唔到 — {detail}",
        "{path} 解析唔到，所以乜都冇寫入。佢話：{detail}",
        "{path} 解析唔到，所以乜都冇寫入，你原本份檔一條毛都冇郁。佢話：{detail}"]
    },
    "err.notFound": {
      en: ["{path} does not exist.", "{path} does not exist.", "{path} does not exist.",
        "{path} is not there.", "{path} is not there — nothing at that path at all."],
      yue: ["{path} 唔存在。", "{path} 唔存在。", "{path} 唔存在。",
        "{path} 搵唔到。", "{path} 搵唔到 — 嗰個位置乜都冇。"]
    },

    /* ---- warnings ---- */
    "warn.yolo": {
      en: ["YOLO mode is on: approvals and the sandbox are disabled for {profile}, and it survives a restart.",
        "YOLO mode is on: approvals and the sandbox are disabled for {profile}, and it survives a restart.",
        "YOLO is on — approvals off, sandbox off on {profile}. It survives a restart.",
        "YOLO is on. Approvals off, sandbox off on {profile}, and it survives a restart.",
        "YOLO is on. No approvals, no sandbox, on {profile} — and it survives a restart, so it is on until you say otherwise."],
      yue: ["YOLO 開咗：{profile} 冇審批、冇沙盒，重開都仲係咁。",
        "YOLO 開咗：{profile} 冇審批、冇沙盒，重開都仲係咁。",
        "YOLO 開咗 — {profile} 冇審批冇沙盒，重開都仲係咁。",
        "YOLO 開咗。{profile} 冇審批冇沙盒，重開機都照舊。",
        "YOLO 開咗。{profile} 冇審批、冇沙盒，重開機都仲係咁 — 你唔閂佢就一路開住。"]
    },
    "warn.untrustedHook": {
      en: ["{name} is untrusted and never runs. Trust it in config.toml first.",
        "{name} is untrusted and never runs. Trust it in config.toml first.",
        "{name} is untrusted, so it never runs. Trust it in config.toml first.",
        "{name} is untrusted, so it never runs — trust it in config.toml first.",
        "{name} is untrusted, so it never runs no matter what this switch says. Trust it in config.toml first."],
      yue: ["{name} 未信任，永遠唔會行。要先喺 config.toml 信任佢。",
        "{name} 未信任，永遠唔會行。要先喺 config.toml 信任佢。",
        "{name} 未信任，所以點都唔會行。要先喺 config.toml 信任佢。",
        "{name} 未信任，所以點都唔會行 — 去 config.toml 信任咗佢先。",
        "{name} 未信任，你撳幾多下呢個掣都唔會行。去 config.toml 信任咗佢先啦。"]
    },
    "warn.bulkClose": {
      en: ["This will close {count} tabs.", "This will close {count} tabs.",
        "This closes {count} tabs.", "This closes {count} tabs — check the list below first.",
        "This closes {count} tabs. Have a look at the list below before you commit."],
      yue: ["咁樣會閂 {count} 個 tab。", "咁樣會閂 {count} 個 tab。",
        "咁樣會閂 {count} 個 tab。", "咁樣會閂 {count} 個 tab — 撳之前睇下下面個清單。",
        "咁樣會閂 {count} 個 tab。撳落去之前，望多眼下面個清單啦。"]
    },
    "warn.restore": {
      en: ["Restoring {label} replaces the current state. It is recorded as a new revision, so it is undoable.",
        "Restoring {label} replaces the current state. It is recorded as a new revision, so it is undoable.",
        "Restoring {label} replaces what you have now — recorded as a new revision, so it is undoable.",
        "Restoring {label} replaces what you have now. It becomes a new revision, so you can undo the undo.",
        "Restoring {label} replaces what you have now — but it lands as a new revision, so you can undo the undo, and the undo of that."],
      yue: ["還原 {label} 會蓋咗而家嘅狀態。佢會記做新一版，所以仲 undo 得返。",
        "還原 {label} 會蓋咗而家嘅狀態。佢會記做新一版，所以仲 undo 得返。",
        "還原 {label} 會蓋咗你而家嘅嘢 — 記做新一版，所以 undo 得返。",
        "還原 {label} 會蓋咗你而家嘅嘢，但會記做新一版，所以 undo 完仲可以 undo 返。",
        "還原 {label} 會蓋咗你而家嘅嘢，不過佢會記做新一版 — undo 完可以再 undo，再 undo 都得。"]
    },

    /* ---- confirmations: the only copy that gets a blocking dialog ---- */
    "confirm.deleteSession": {
      en: ["Delete the session {name}?", "Delete the session {name}?", "Delete the session {name}?",
        "Delete {name}? It goes from disk, not just from this list.",
        "Delete {name}? It leaves the disk, not just this list — though History keeps an undo."],
      yue: ["刪除 {name} 呢個 session？", "刪除 {name} 呢個 session？", "刪咗 {name} 呢個 session？",
        "刪咗 {name}？佢會由硬碟度消失，唔淨止喺呢個清單度。",
        "刪咗 {name}？佢係真係走出硬碟，唔淨止喺呢個清單度 — 不過 History 度仲有得 undo。"]
    },
    "confirm.removeMcp": {
      en: ["Remove the MCP server {name} from config.toml?", "Remove the MCP server {name} from config.toml?",
        "Remove the MCP server {name} from config.toml?", "Remove {name} from config.toml? The file is backed up first.",
        "Remove {name} from config.toml? Your old file is copied beside it first, so this is recoverable."],
      yue: ["由 config.toml 移除 MCP server {name}？", "由 config.toml 移除 MCP server {name}？",
        "由 config.toml 剷走 MCP server {name}？", "剷走 {name}？寫入前會先備份份 config.toml。",
        "剷走 {name}？寫入前會喺隔籬 copy 一份舊 config.toml，救得返嘅。"]
    },
    "confirm.uninstall": {
      en: ["Uninstall the plugin {name}?", "Uninstall the plugin {name}?", "Uninstall the plugin {name}?",
        "Uninstall {name}? You can reinstall it from the marketplace.",
        "Uninstall {name}? The marketplace will still have it if you change your mind."],
      yue: ["解除安裝外掛 {name}？", "解除安裝外掛 {name}？", "移除外掛 {name}？",
        "移除 {name}？想要返可以去 marketplace 再裝。",
        "移除 {name}？後悔嘅話 marketplace 度仲有得再裝返。"]
    },
    "confirm.prune": {
      en: ["Prune the history to the newest {keep} revisions?", "Prune the history to the newest {keep} revisions?",
        "Prune the history down to the newest {keep} revisions?",
        "Prune down to the newest {keep} revisions? Older ones are gone for good.",
        "Prune down to the newest {keep} revisions? Everything older is gone for good — this one really is not undoable."],
      yue: ["淨係保留最新 {keep} 版歷史？", "淨係保留最新 {keep} 版歷史？",
        "剪到淨返最新 {keep} 版歷史？", "剪到淨返最新 {keep} 版？舊過嗰啲永久消失。",
        "剪到淨返最新 {keep} 版？舊過嗰啲永久消失 — 呢單真係 undo 唔到。"]
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
      en: ["{count} tabs do not fit on the strip", "{count} tabs do not fit on the strip",
        "{count} tabs do not fit — they are in here", "{count} tabs did not fit — they are hiding in here",
        "{count} tabs did not fit on the strip and are hiding in here"],
      yue: ["有 {count} 個 tab 塞唔落條 strip", "有 {count} 個 tab 塞唔落條 strip",
        "有 {count} 個 tab 塞唔落 — 收埋咗喺呢度", "有 {count} 個 tab 塞唔落，匿埋咗喺呢度",
        "有 {count} 個 tab 塞唔落條 strip，匿晒喺呢度等你"]
    },
    "tab.noOverflow": {
      en: ["Every tab fits on the strip.", "Every tab fits on the strip.", "Every tab fits.",
        "Everything fits — nothing hidden.", "Everything fits. Nothing hiding anywhere."],
      yue: ["全部 tab 都放得落。", "全部 tab 都放得落。", "全部都放得落。",
        "全部放得落 — 冇嘢匿埋。", "全部放得落，冇一個匿埋。"]
    },
    "tab.searchHint": {
      en: ["Find a tab, a group, or every tab everywhere", "Find a tab, a group, or every tab everywhere",
        "Find a tab, a group, or every tab everywhere", "Find a tab, a group, or sweep every workspace",
        "Find a tab, find a group, or sweep every workspace at once"],
      yue: ["搵 tab、搵 group，或者搵勻所有地方", "搵 tab、搵 group，或者搵勻所有地方",
        "搵 tab、搵 group，或者全部一次過搵", "搵 tab、搵 group，或者掃勻晒所有 workspace",
        "搵 tab、搵 group，定係一次過掃勻晒所有 workspace"]
    },
    "tab.noGroups": {
      en: ["There are no tab groups yet.", "There are no tab groups yet.", "No tab groups yet.",
        "No groups yet — right-click a tab to make one.", "No groups yet. Right-click any tab and make one."],
      yue: ["仲未有任何 tab group。", "仲未有任何 tab group。", "未有 group。",
        "未有 group — 右 click 個 tab 就可以開。", "未有 group。右 click 個 tab 就開到㗎喇。"]
    },
    "tab.closed": {
      en: ["Closed {name}", "Closed {name}", "Closed {name}", "Closed {name}", "Closed {name} — undo below if that was a mistake"],
      yue: ["閂咗 {name}", "閂咗 {name}", "閂咗 {name}", "閂咗 {name}", "閂咗 {name} — 撳錯咗就撳下面 undo"]
    },
    "tab.closeContaining": {
      en: ["Close tabs containing text", "Close tabs containing text", "Close tabs containing text",
        "Close every tab containing text", "Close every tab whose name contains your text"],
      yue: ["閂晒名有呢啲字嘅 tab", "閂晒名有呢啲字嘅 tab", "閂晒名有呢啲字嘅 tab",
        "閂晒所有名入面有呢啲字嘅 tab", "見到名有呢啲字嘅 tab，一次過閂晒"]
    },
    "tab.closeNotContaining": {
      en: ["Close tabs NOT containing text", "Close tabs NOT containing text", "Close tabs NOT containing text",
        "Close every tab that does not contain your text", "Keep the matches, close everything else"],
      yue: ["閂晒名冇呢啲字嘅 tab", "閂晒名冇呢啲字嘅 tab", "閂晒名冇呢啲字嘅 tab",
        "閂晒所有名入面冇呢啲字嘅 tab", "夾到嘅留低，其餘全部閂晒"]
    },
    "tab.bulkSummary": {
      en: ["{count} of {total} tabs match, using {mode} matching.", "{count} of {total} tabs match, using {mode} matching.",
        "{count} of {total} tabs match ({mode}).", "{count} of {total} tabs match — {mode} matching, names only.",
        "{count} of {total} tabs match with {mode} matching. Names only — nothing reads inside a tab."],
      yue: ["{total} 個 tab 之中夾到 {count} 個，用緊 {mode} 比對。",
        "{total} 個 tab 之中夾到 {count} 個，用緊 {mode} 比對。",
        "{total} 個入面夾到 {count} 個（{mode}）。",
        "{total} 個入面夾到 {count} 個 — {mode} 比對，淨係睇個名。",
        "{total} 個入面夾到 {count} 個，用 {mode} 比對。淨係睇個名 — 唔會偷睇 tab 入面啲嘢。"]
    },
    "tab.bulkNeedsQuery": {
      en: ["Enter text to match. An empty query closes nothing.", "Enter text to match. An empty query closes nothing.",
        "Type something to match — an empty query closes nothing.",
        "Type something first. An empty query closes nothing, on purpose.",
        "Type something first. An empty query closes nothing, and that is deliberate."],
      yue: ["打啲字先。空白嘅話咩都唔會閂。", "打啲字先。空白嘅話咩都唔會閂。",
        "打啲字先 — 空白嘅話咩都唔會閂。", "打啲字先啦。空白就咩都唔閂，特登咁設計。",
        "打啲字先啦。空白就咩都唔閂 — 特登咁設計，唔係壞咗。"]
    },
    "tab.bulkPlaceholder": {
      en: ["Text to match against tab names", "Text to match against tab names", "Text to match against tab names",
        "What should the tab name contain?", "What should the tab name contain?"],
      yue: ["用嚟夾 tab 名嘅字", "用嚟夾 tab 名嘅字", "用嚟夾 tab 名嘅字",
        "個 tab 名要有咩字？", "個 tab 名要有咩字？"]
    },
    "tab.matchNormal": {
      en: ["Matching: contains", "Matching: contains", "Matching: contains",
        "Matching: names that contain it", "Matching: names that contain it"],
      yue: ["比對：包含", "比對：包含", "比對：包含", "比對：個名有呢啲字", "比對：個名有呢啲字"]
    },
    "tab.matchInverted": {
      en: ["Matching: does NOT contain", "Matching: does NOT contain", "Matching: does NOT contain",
        "Matching: names that do NOT contain it", "Matching: names that do NOT contain it"],
      yue: ["比對：唔包含", "比對：唔包含", "比對：唔包含", "比對：個名冇呢啲字", "比對：個名冇呢啲字"]
    },
    "tab.pinnedProtected": {
      en: ["Pinned tabs are protected", "Pinned tabs are protected", "Pinned tabs are protected",
        "Pinned tabs are protected from this", "Pinned tabs sit this one out"],
      yue: ["釘住嘅 tab 受保護", "釘住嘅 tab 受保護", "釘住嘅 tab 受保護",
        "釘住嘅 tab 唔會受影響", "釘住嘅 tab 今次唔關佢事"]
    },
    "tab.pinnedIncluded": {
      en: ["Pinned tabs WILL be closed", "Pinned tabs WILL be closed", "Pinned tabs WILL be closed",
        "Pinned tabs will be closed too", "Pinned tabs are going too — you asked for it"],
      yue: ["連釘住嘅 tab 都會閂", "連釘住嘅 tab 都會閂", "連釘住嘅 tab 都會閂",
        "釘住嗰啲都會一齊閂", "釘住嗰啲都照閂 — 你話要嘅"]
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
      en: ["Closed {count} tabs", "Closed {count} tabs", "Closed {count} tabs",
        "Closed {count} tabs", "Closed {count} tabs — undo below if that was a mistake"],
      yue: ["閂咗 {count} 個 tab", "閂咗 {count} 個 tab", "閂咗 {count} 個 tab",
        "閂咗 {count} 個 tab", "閂咗 {count} 個 tab — 手快撳錯就撳下面 undo"]
    },
    "tab.bulkSkipped": {
      en: ["{count} pinned tabs were kept: {names}", "{count} pinned tabs were kept: {names}",
        "{count} pinned tabs were kept: {names}", "{count} pinned tabs stayed put: {names}",
        "{count} pinned tabs stayed exactly where they were: {names}"],
      yue: ["有 {count} 個釘住嘅 tab 留低咗：{names}", "有 {count} 個釘住嘅 tab 留低咗：{names}",
        "有 {count} 個釘住嘅 tab 留低咗：{names}", "有 {count} 個釘住嘅 tab 冇郁過：{names}",
        "有 {count} 個釘住嘅 tab 原封不動咁留喺度：{names}"]
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
      en: ["Nothing has been notified yet.", "Nothing has been notified yet.", "Nothing here yet.",
        "Nothing here yet — a quiet session.", "Nothing here yet. Suspiciously quiet, honestly."],
      yue: ["未有任何通知。", "未有任何通知。", "呢度未有嘢。",
        "呢度未有嘢 — 今次好靜。", "呢度未有嘢，靜到有啲可疑。"]
    },

    /* ---- search ---- */
    "search.builder": {
      en: ["Open the regex builder for this search", "Open the regex builder for this search",
        "Open the regex builder for this search", "Build a pattern for this search",
        "Build a proper pattern for this search"],
      yue: ["開呢個搜尋嘅 regex 產生器", "開呢個搜尋嘅 regex 產生器", "開呢個搜尋嘅 regex 產生器",
        "幫呢個搜尋砌個 pattern", "幫呢個搜尋砌條靚 pattern"]
    },

    /* ---- settings ---- */
    "settings.search": {
      en: ["Search every setting on this page", "Search every setting on this page",
        "Search every setting here", "Search every setting here", "Type a setting name — it is in here somewhere"],
      yue: ["搵呢版所有設定", "搵呢版所有設定", "搵呢度所有設定", "搵呢度所有設定", "打個設定名 — 一定喺度嘅"]
    },
    "settings.noMatch": {
      en: ["No setting matches {query}.", "No setting matches {query}.", "No setting matches {query}.",
        "Nothing matches {query} on this page.", "Nothing on this page matches {query}."],
      yue: ["冇設定夾到 {query}。", "冇設定夾到 {query}。", "冇設定夾到 {query}。",
        "呢版度冇嘢夾到 {query}。", "呢版度搵唔到夾 {query} 嘅嘢。"]
    },

    /* ---- changelog viewer ---- */
    "changelog.search": {
      en: ["Search the changelog", "Search the changelog", "Search the changelog",
        "Search every release note", "Search every release note ever written"],
      yue: ["搵 changelog", "搵 changelog", "搵 changelog", "搵勻所有版本紀錄", "搵勻由頭到尾所有版本紀錄"]
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
      en: ["{value} is not a date yet. Your text is kept.", "{value} is not a date yet. Your text is kept.",
        "{value} is not a date yet — your text is kept.", "{value} is not a date yet. Nothing was thrown away.",
        "{value} is not a date yet. Keep typing — nothing was thrown away."],
      yue: ["{value} 仲未係一個日期。你打嘅字冇被刪。", "{value} 仲未係一個日期。你打嘅字冇被刪。",
        "{value} 仲未係日期 — 你打嘅字冇被刪。", "{value} 仲未係日期，你打嗰啲一個字都冇冇咗。",
        "{value} 仲未係日期，慢慢打 — 你打嗰啲一個字都冇冇咗。"]
    },
    "changelog.status": {
      en: ["{versions} versions, {matches} matching entries.", "{versions} versions, {matches} matching entries.",
        "{versions} versions · {matches} matching entries.", "{versions} versions, {matches} entries matched.",
        "{versions} versions and {matches} entries made the cut."],
      yue: ["{versions} 個版本，{matches} 條夾到。", "{versions} 個版本，{matches} 條夾到。",
        "{versions} 個版本 · {matches} 條夾到。", "{versions} 個版本，夾到 {matches} 條。",
        "{versions} 個版本，夾到 {matches} 條入圍。"]
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
      en: ["Pick a date from a calendar", "Pick a date from a calendar", "Pick a date from a calendar",
        "Pick it from a calendar instead", "Pick it from a calendar if counting days is not your idea of fun"],
      yue: ["用月曆揀日期", "用月曆揀日期", "用月曆揀", "唔想打字就用月曆揀", "唔想自己數日就用月曆揀啦"]
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
      en: ["Typing in the field works too; the two stay in step.",
        "Typing in the field works too; the two stay in step.",
        "You can type in the field instead — the two stay in step.",
        "Typing in the field works just as well. Neither one clears the other.",
        "Type it if you prefer. Neither one clears the other, so pick whichever you like."],
      yue: ["直接喺格仔打都得，兩邊會同步。", "直接喺格仔打都得，兩邊會同步。",
        "你想打字都得 —— 兩邊會同步。", "喺格仔度打都一樣得，兩邊唔會互相清走對方。",
        "鍾意打字就打字，兩邊唔會互相清走對方，用邊個都得。"]
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
      en: ["Exported the filtered view.", "Exported the filtered view.", "Exported the filtered view.",
        "Exported — the file matches what is on screen.", "Exported. The file says exactly what the screen says."],
      yue: ["已匯出篩選後嘅內容。", "已匯出篩選後嘅內容。", "匯出咗篩選後嘅內容。",
        "匯出咗 — 份檔同你螢幕見到嘅一模一樣。", "匯出咗。份檔同你螢幕見到嘅一個字都唔差。"]
    },
    "changelog.copied": {
      en: ["Copied the filtered view.", "Copied the filtered view.", "Copied the filtered view.",
        "Copied — it matches what is on screen.", "Copied. It matches the screen exactly."],
      yue: ["已複製篩選後嘅內容。", "已複製篩選後嘅內容。", "copy 咗篩選後嘅內容。",
        "copy 咗 — 同螢幕見到嘅一樣。", "copy 咗，同螢幕見到嘅一個字都唔差。"]
    },
    "changelog.empty": {
      en: ["No release matches this filter.", "No release matches this filter.", "No release matches this filter.",
        "No release matches — try widening the dates.", "No release matches. Try widening the dates or clearing the search."],
      yue: ["冇版本夾到呢個篩選。", "冇版本夾到呢個篩選。", "冇版本夾到呢個篩選。",
        "冇版本夾到 — 試下放寬個日期。", "冇版本夾到。試下放寬個日期，或者清走個搜尋。"]
    },
    "changelog.loading": {
      en: ["Reading CHANGELOG.md…", "Reading CHANGELOG.md…", "Reading CHANGELOG.md…",
        "Reading CHANGELOG.md…", "Reading CHANGELOG.md…"],
      yue: ["讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md…",
        "讀緊 CHANGELOG.md…", "讀緊 CHANGELOG.md…"]
    },
    "changelog.unavailable": {
      en: ["The changelog engine is not loaded.", "The changelog engine is not loaded.",
        "The changelog engine is not loaded.", "The changelog engine did not load.",
        "The changelog engine did not load — cx-changelog.js is missing from this build."],
      yue: ["Changelog 引擎未載入。", "Changelog 引擎未載入。", "Changelog 引擎未載入。",
        "Changelog 引擎載入唔到。", "Changelog 引擎載入唔到 — 呢個 build 冇咗 cx-changelog.js。"]
    },

    /* ---- dim sum surprise: the dish's own name is a fact and never changes ---- */
    "dimsum.greeting": {
      en: ["Today's dim sum: {dish}.", "Today's dim sum: {dish}.", "A little dim sum for you: {dish}.",
        "Have some {dish} while the agent thinks.", "Yum cha break — {dish}, on the house."],
      yue: ["今日嘅點心：{dish}。", "今日嘅點心：{dish}。", "請你食件點心：{dish}。",
        "agent 諗嘢，你食住件 {dish} 先。", "飲啖茶食件 {dish}，唔使畀錢嗰隻。"]
    },

    /* ---- local history ---- */
    "history.pruned": {
      en: ["Pruned {count} revisions, kept {kept}.", "Pruned {count} revisions, kept {kept}.",
        "Pruned {count} revisions, kept {kept}.", "Pruned {count} revisions and kept the newest {kept}.",
        "Pruned {count} revisions and kept the newest {kept}. That one is not undoable."],
      yue: ["剪走咗 {count} 版，保留 {kept} 版。", "剪走咗 {count} 版，保留 {kept} 版。",
        "剪走咗 {count} 版，留返 {kept} 版。", "剪走咗 {count} 版，留返最新嘅 {kept} 版。",
        "剪走咗 {count} 版，留返最新嘅 {kept} 版。呢單係 undo 唔到㗎。"]
    },

    /* ---- external editor & appearance ---- */
    "editor.opened": {
      en: ["Opened {path}", "Opened {path}", "Opened {path}", "Opened {path} in your editor", "Opened {path} — go look at your editor"],
      yue: ["開咗 {path}", "開咗 {path}", "開咗 {path}", "喺你個編輯器開咗 {path}", "開咗 {path} — 望下你個編輯器啦"]
    },
    "chat.busy": {
      en: ["A run is already in flight.", "A run is already in flight.", "A run is already in flight.",
        "One run at a time — this thread is still working.", "One at a time. This thread is still busy."],
      yue: ["已經有一個 run 喺度行緊。", "已經有一個 run 喺度行緊。", "已經有嘢行緊。",
        "一次行一個 — 呢條 thread 仲做緊嘢。", "一次行一個啦，佢仲喺度做緊嘢。"]
    },
    "chat.failed": {
      en: ["codex exited {code}", "codex exited {code}", "codex exited {code}",
        "codex exited {code} — the output above is what it said",
        "codex exited {code}. Whatever it printed above is the whole story."],
      yue: ["codex 收咗工，exit {code}", "codex 收咗工，exit {code}", "codex 行完，exit {code}",
        "codex exit {code} — 上面嗰啲就係佢講嘅嘢", "codex exit {code}，佢上面打咗乜就係乜，冇再多。"]
    },
    "err.run": {
      en: ["The run could not start: {detail}", "The run could not start: {detail}",
        "The run could not start — {detail}", "The run never started. It said: {detail}",
        "The run never even started. It said: {detail}"],
      yue: ["個 run 起唔到步：{detail}", "個 run 起唔到步：{detail}", "行唔到 — {detail}",
        "個 run 根本冇開始過，佢話：{detail}", "個 run 連起步都冇，佢話：{detail}"]
    },
    "appearance.exported": {
      en: ["Appearance presets copied to the clipboard.", "Appearance presets copied to the clipboard.",
        "Appearance presets copied.", "Appearance presets copied — paste them somewhere safe.",
        "Appearance presets copied. Paste them somewhere safe and they survive a reinstall."],
      yue: ["外觀設定已複製到剪貼簿。", "外觀設定已複製到剪貼簿。", "外觀設定 copy 咗。",
        "外觀設定 copy 咗 — 搵個安全位 paste 低佢。",
        "外觀設定 copy 咗。搵個安全位 paste 低，重灌都唔怕冇咗。"]
    },

    /* ---- appearance files and named presets. A clipboard blob dies with the
       session; a file survives a reinstall, so every message below names the file
       it wrote or read, and the partial import names both halves of the count —
       what came in AND what did not. A theme that quietly loses half its colours
       is worse than one that refuses outright. ---- */
    "appearance.exportedFile": {
      en: ["Appearance exported to {path}.",
        "Appearance exported to {path}.",
        "Appearance exported to {path} — keep that file somewhere safe.",
        "Appearance exported to {path}. Keep that file and your look survives a reinstall.",
        "Appearance exported to {path}. Guard that file with your life and your theme will outlive the next reinstall."],
      yue: ["外觀已匯出至 {path}。",
        "外觀已匯出至 {path}。",
        "外觀 export 咗去 {path} — 搵個安全位擺好佢。",
        "外觀 export 咗去 {path}。留住份檔，重灌完都仲係呢個樣。",
        "外觀 export 咗去 {path}。份檔睇實佢，下次重灌你個 theme 都照樣返生。"]
    },
    "appearance.imported": {
      en: ["Imported {count} element styles from {file}.",
        "Imported {count} element styles from {file}.",
        "Imported {count} element styles from {file}.",
        "{count} element styles came in from {file} — the app is wearing them now.",
        "{count} element styles came in from {file}, and the app has already put them on."],
      yue: ["已由 {file} 匯入 {count} 個元素樣式。",
        "已由 {file} 匯入 {count} 個元素樣式。",
        "由 {file} import 咗 {count} 個元素樣式。",
        "由 {file} import 咗 {count} 個元素樣式 — 個 app 已經著咗上身。",
        "由 {file} import 咗 {count} 個元素樣式，個 app 即刻換咗新衫。"]
    },
    "appearance.importedPartial": {
      en: ["Imported {count} element styles. {dropped} values could not be represented and were left out; each one is listed with its reason.",
        "Imported {count} element styles. {dropped} values could not be represented and were left out; each one is listed with its reason.",
        "Imported {count} element styles. {dropped} values could not be represented, so they were left out — each one is listed with its reason.",
        "Imported {count} element styles and left {dropped} behind, because this build cannot represent them. Every one is listed with its reason.",
        "Imported {count} element styles and left {dropped} at the door, because this build cannot represent them. Every one is listed with its reason, so nothing vanished quietly."],
      yue: ["已匯入 {count} 個元素樣式。有 {dropped} 個數值表達唔到，冇匯入；每一個都列咗原因。",
        "已匯入 {count} 個元素樣式。有 {dropped} 個數值表達唔到，冇匯入；每一個都列咗原因。",
        "import 咗 {count} 個元素樣式。有 {dropped} 個數值表達唔到，唯有唔要 — 每個都寫低咗原因。",
        "import 咗 {count} 個元素樣式，掉低咗 {dropped} 個，因為呢個 build 表達唔到佢哋。每個都寫低咗原因。",
        "import 咗 {count} 個元素樣式，有 {dropped} 個喺門口停低咗，因為呢個 build 表達唔到佢哋。每個都寫低咗原因，冇一個係靜雞雞唔見咗。"]
    },
    "appearance.presetSaved": {
      en: ["Saved the appearance preset {name}.",
        "Saved the appearance preset {name}.",
        "Saved the appearance preset {name}.",
        "Saved {name} — pick it from the preset list whenever you want this look back.",
        "Saved {name}. Pick it from the preset list whenever you want this look back."],
      yue: ["已儲存外觀預設 {name}。",
        "已儲存外觀預設 {name}。",
        "外觀預設 {name} save 咗。",
        "{name} save 咗 — 想要返呢個樣，喺預設清單度撳返佢就得。",
        "{name} save 咗。想扮返今日呢個樣，喺預設清單度撳返佢就得。"]
    },
    "appearance.presetDeleted": {
      en: ["Deleted the appearance preset {name}.",
        "Deleted the appearance preset {name}.",
        "Deleted the appearance preset {name}. History still has it, so this is undoable.",
        "Deleted {name}. History still has it, so this is undoable.",
        "Deleted {name}. History still has it, so you can pull it back out of the bin."],
      yue: ["已刪除外觀預設 {name}。",
        "已刪除外觀預設 {name}。",
        "外觀預設 {name} 刪咗。History 度仲有，所以 undo 得返。",
        "{name} 刪咗。History 度仲有，所以 undo 得返。",
        "{name} 刪咗。History 度仲有，想撈返上嚟隨時得。"]
    },
    "appearance.presetApplied": {
      en: ["Applied the appearance preset {name}.",
        "Applied the appearance preset {name}.",
        "Applied the appearance preset {name}.",
        "{name} is on. Everything it names has changed shape.",
        "{name} is on, and everything it names has changed shape."],
      yue: ["已套用外觀預設 {name}。",
        "已套用外觀預設 {name}。",
        "外觀預設 {name} 套咗落去。",
        "{name} 上咗身，佢寫住嘅嘢全部換晒樣。",
        "{name} 上咗身，佢寫住嘅嘢全部換晒樣，即刻精神晒。"]
    },

    "err.appearanceParse": {
      en: ["{file} could not be read as an appearance file: {message} Nothing was imported and your current appearance is untouched.",
        "{file} could not be read as an appearance file: {message} Nothing was imported and your current appearance is untouched.",
        "{file} would not read as an appearance file — {message} Nothing was imported; your current appearance is untouched.",
        "{file} refused to read as an appearance file: {message} Nothing was imported, so your current appearance is exactly as you left it.",
        "{file} refused to read as an appearance file: {message} Nothing was imported, so your current look is exactly as you left it."],
      yue: ["{file} 讀唔到做外觀檔：{message} 冇匯入任何嘢，你而家嘅外觀原封不動。",
        "{file} 讀唔到做外觀檔：{message} 冇匯入任何嘢，你而家嘅外觀原封不動。",
        "{file} 讀唔到做外觀檔 — {message} 乜都冇 import 到；你而家嘅外觀原封不動。",
        "{file} 死都唔肯讀做外觀檔：{message} 乜都冇 import 到，你而家個樣同之前一模一樣。",
        "{file} 死都唔肯讀做外觀檔：{message} 乜都冇 import 到，你個樣同你走嗰陣一模一樣。"]
    },
    "err.appearanceImport": {
      en: ["Nothing in {file} could be applied: {message} Your current appearance is untouched.",
        "Nothing in {file} could be applied: {message} Your current appearance is untouched.",
        "Nothing in {file} could be applied — {message} Your current appearance is untouched.",
        "Not one value in {file} could be applied: {message} Your current appearance is untouched.",
        "Not one value in {file} survived the check: {message} Your current appearance is untouched, which is the safe outcome."],
      yue: ["{file} 入面冇一樣嘢用得：{message} 你而家嘅外觀原封不動。",
        "{file} 入面冇一樣嘢用得：{message} 你而家嘅外觀原封不動。",
        "{file} 入面冇一樣嘢用得 — {message} 你而家嘅外觀原封不動。",
        "{file} 入面一個數值都用唔到：{message} 你而家嘅外觀原封不動。",
        "{file} 入面一個數值都過唔到關：{message} 你而家嘅外觀原封不動 — 咁樣至安全。"]
    },
    "warn.appearanceOverwrite": {
      en: ["A preset named {name} already exists. Saving again replaces it, and the copy you have now is gone.",
        "A preset named {name} already exists. Saving again replaces it, and the copy you have now is gone.",
        "A preset named {name} already exists — saving again replaces it, and the copy you have now is gone.",
        "There is already a preset named {name}. Saving again replaces it, and the copy you have now is gone.",
        "There is already a preset called {name}. Saving again writes right over it, and the copy you have now is gone."],
      yue: ["已經有個叫 {name} 嘅預設。再 save 就會蓋咗佢，而家嗰份會冇咗。",
        "已經有個叫 {name} 嘅預設。再 save 就會蓋咗佢，而家嗰份會冇咗。",
        "已經有個叫 {name} 嘅預設 — 再 save 就會蓋咗佢，而家嗰份會冇咗。",
        "已經有個預設叫 {name} 㗎喇。再 save 就會蓋咗佢，而家嗰份會冇咗。",
        "已經有個預設叫 {name} 㗎喇。再 save 就直接寫過佢，而家嗰份會冇咗。"]
    }
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
