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
/* MORE */
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
