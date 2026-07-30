/* Codex Studio — changelog viewer engine.
   Pure logic behind the in-app changelog: parse CHANGELOG.md, compose a date filter
   with a text-or-regex search, and export exactly what the user is looking at. No DOM,
   no fetch, no storage — the view layer owns all of that. */
(function (g) {
  "use strict";

  const DAY = 86400000;

  /* ------------------------------------------------ dates
     Everything is compared at local midnight, so a release dated 2026-07-30 lands
     inside a range whose bounds came off the same calendar the user was looking at. */
  const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const SPLIT = /^(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4})$/;

  const pad = (n) => String(n).padStart(2, "0");
  const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const dayEnd = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  const daysIn = (y, m) => new Date(y, m, 0).getDate();
  const nowMs = () => (g.performance && g.performance.now ? g.performance.now() : Date.now());

  function validDate(y, m, d) {
    if (!(y > 0) || m < 1 || m > 12 || d < 1 || d > daysIn(y, m)) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  function isoOf(v) {
    const d = new Date(v);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function stamp(d) {
    const off = -d.getTimezoneOffset(), sign = off < 0 ? "-" : "+";
    return isoOf(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) +
      sign + pad(Math.floor(Math.abs(off) / 60)) + ":" + pad(Math.abs(off) % 60);
  }

  /* ------------------------------------------------ copy
     The funny level moves the voice only. Version numbers, dates, counts, patterns and
     limits are substituted after the level is chosen, so they read identically at 1 and
     at 5 — a warning nobody can act on is a broken warning, not a funny one. */
  const MSG = {
    "parse.empty": {
      en: ["The changelog file is empty — there is nothing to show.", "The changelog file is empty, so there is nothing to list here.", "The changelog file is completely empty. Nothing to show, nothing to hide."],
      yue: ["個 changelog 檔係空嘅 — 無嘢可以睇。", "個 changelog 檔空空如也，無嘢可以列出嚟。", "個 changelog 檔乾淨到連一個字都無，真係無嘢好睇。"]
    },
    "parse.noVersions": {
      en: ["No `## [version]` heading was found — this file is not in Keep a Changelog format.", "No `## [version]` heading anywhere, so this file is not in Keep a Changelog format.", "Not one `## [version]` heading in the whole file — whatever this is, it is not Keep a Changelog."],
      yue: ["搵唔到 `## [版本]` 標題 — 呢個檔唔係 Keep a Changelog 格式。", "成個檔都無 `## [版本]` 標題，即係唔係 Keep a Changelog 格式。", "由頭搵到尾都無一個 `## [版本]` 標題，呢個檔點睇都唔係 Keep a Changelog。"]
    },
    "parse.crashed": {
      en: ["Parsing stopped on an unexpected error ({error}). Versions read before it are still shown.", "Parsing hit an unexpected error ({error}) and stopped there. Everything read before it is still shown.", "Parsing tripped over something unexpected ({error}) and stopped. Whatever it had already read is still below."],
      yue: ["解析途中出咗個意外錯誤（{error}），停咗喺嗰度，之前讀到嘅版本照樣顯示。", "解析撞到意外錯誤（{error}）停咗，之前讀到嘅嘢仲喺度。", "解析行行下畀 {error} 絆低咗，唯有停，不過之前讀到嘅版本一個都無走。"]
    },
    "parse.badDate": {
      en: ["Line {line}: the date \"{date}\" is not yyyy-mm-dd. It is shown as written and left out of date filtering.", "Line {line}: \"{date}\" is not a yyyy-mm-dd date, so it is shown as written and the date filter skips it.", "Line {line}: \"{date}\" is not yyyy-mm-dd, so it stays exactly as typed and the date filter politely ignores it."],
      yue: ["第 {line} 行：日期「{date}」唔係 yyyy-mm-dd，會照原文顯示，日期篩選會略過佢。", "第 {line} 行：「{date}」唔係 yyyy-mm-dd 格式，照原文出，日期篩選唔理佢。", "第 {line} 行：「{date}」唔係 yyyy-mm-dd，照原文擺出嚟，日期篩選就當睇唔到佢。"]
    },
    "parse.noDate": {
      en: ["Line {line}: version {version} has no date, so the date filter cannot place it.", "Line {line}: version {version} carries no date, so the date filter has nowhere to put it.", "Line {line}: version {version} arrived without a date, so the date filter cannot place it anywhere."],
      yue: ["第 {line} 行：版本 {version} 無日期，日期篩選擺唔到佢入去。", "第 {line} 行：版本 {version} 無日期，日期篩選唔知擺佢去邊。", "第 {line} 行：版本 {version} 唔帶日期就嚟咗，日期篩選真係唔知放佢去邊格。"]
    },
    "parse.noVersion": {
      en: ["Line {line}: this `##` heading has no version number.", "Line {line}: this `##` heading is missing its version number.", "Line {line}: a `##` heading with no version number at all."],
      yue: ["第 {line} 行：呢個 `##` 標題無版本號。", "第 {line} 行：呢個 `##` 標題唔見咗版本號。", "第 {line} 行：呢個 `##` 標題連版本號都無，好神秘。"]
    },
    "parse.dupe": {
      en: ["Version {version} appears twice, on lines {first} and {line}. Both are shown.", "Version {version} is declared twice (lines {first} and {line}); both are shown.", "Version {version} shows up twice, lines {first} and {line}. Both are shown — sorting that out is a human job."],
      yue: ["版本 {version} 出現咗兩次（第 {first} 同第 {line} 行），兩個都會顯示。", "版本 {version} 寫咗兩次，第 {first} 同第 {line} 行，兩個都出。", "版本 {version} 一稿兩投，第 {first} 同第 {line} 行都有，兩個照出，邊個啱要人手決定。"]
    },
    "parse.loose": {
      en: ["Line {line}: entries under {version} sit outside any `###` section and are grouped as uncategorised.", "Line {line}: {version} has entries outside any `###` section; they are grouped as uncategorised.", "Line {line}: some of {version}'s entries wandered off outside any `###` section, so they are grouped as uncategorised."],
      yue: ["第 {line} 行：{version} 有項目唔喺任何 `###` 分類入面，會歸做「未分類」。", "第 {line} 行：{version} 有啲項目跌咗出 `###` 分類之外，歸做「未分類」。", "第 {line} 行：{version} 有啲項目走咗出 `###` 分類外面遊蕩，唯有歸做「未分類」。"]
    },
    "parse.orphan": {
      en: ["Line {line}: the section \"{title}\" appears before any version heading and was skipped.", "Line {line}: section \"{title}\" sits before any version heading, so it was skipped.", "Line {line}: section \"{title}\" turned up before any version heading, so it was skipped."],
      yue: ["第 {line} 行：分類「{title}」出現喺任何版本標題之前，跳過咗。", "第 {line} 行：分類「{title}」排喺所有版本標題之前，唯有跳過。", "第 {line} 行：分類「{title}」走得太前，行喺所有版本標題前面，唯有跳過佢。"]
    },
    "parse.uncategorised": { en: ["Uncategorised", "Uncategorised", "Uncategorised"], yue: ["未分類", "未分類", "未歸邊"] },

    "date.yearOnly": {
      en: ["Year only — add a month and a day, for example {ex}.", "That is a year, not a date yet. Add a month and a day, e.g. {ex}.", "A fine year. It still wants a month and a day — {ex} will do."],
      yue: ["淨係有年份 — 再加月同日，例如 {ex}。", "得個年份，仲爭月同日，例如 {ex}。", "個年份好靚，不過都要有月同日先計到數，例如 {ex}。"]
    },
    "date.needDay": {
      en: ["Incomplete date — add a day, for example {ex}.", "Almost there: the day is still missing, e.g. {ex}.", "So close. Add the day and it is done — {ex}."],
      yue: ["日期未完整 — 加返個日，例如 {ex}。", "就快得，仲爭個日字，例如 {ex}。", "就差咁少少，補返個日就搞掂 — {ex}。"]
    },
    "date.needYear": {
      en: ["Incomplete date — add a year, in the form {shape}.", "The year is still missing — type it as {shape}.", "Day and month noted. The year is still outstanding — {shape}."],
      yue: ["日期未完整 — 加返年份，格式 {shape}。", "爭個年份，照 {shape} 咁打。", "日同月收到晒，年份仲未見人 — {shape} 咁打就得。"]
    },
    "date.shortYear": {
      en: ["Year \"{year}\" is ambiguous — type all four digits, for example 20{year}.", "A two-digit year \"{year}\" could be either century — type 20{year} in full.", "\"{year}\" could be 19{year} or it could be 20{year}. Type the four digits so nobody has to guess."],
      yue: ["年份「{year}」唔清楚 — 打齊四位數，例如 20{year}。", "兩位數年份「{year}」邊個世紀都得 — 打全 20{year} 啦。", "「{year}」可以係 19{year}，又可以係 20{year}，打齊四個字免得大家估。"]
    },
    "date.badMonth": {
      en: ["Month {month} does not exist — months run from 1 to 12.", "There is no month {month}; months run 1 to 12.", "Month {month} does not exist. The calendar stops at 12 and shows no sign of expanding."],
      yue: ["無 {month} 月呢樣嘢 — 月份只有 1 至 12。", "邊有 {month} 月？月份得 1 至 12。", "{month} 月係唔存在嘅，個曆數到 12 就收工，暫時未有加場。"]
    },
    "date.swap": {
      en: ["Month {month} does not exist. This field reads {shape}; the other order would make it {alt} — type {alt} to be unambiguous.", "There is no month {month}. This field reads {shape}, and the other order would give {alt} — type {alt} to be unambiguous.", "Month {month} does not exist. This field reads {shape}; flip the order and you get {alt} — type {alt} and the argument is over."],
      yue: ["無 {month} 月。呢格係照 {shape} 讀，掉轉次序就會變 {alt} — 直接打 {alt} 就唔會誤會。", "邊有 {month} 月。呢格照 {shape} 讀，另一個次序會係 {alt} — 打 {alt} 最穩陣。", "{month} 月唔存在。呢格照 {shape} 讀，掉轉嚟就係 {alt} — 直接打 {alt}，大家唔使拗。"]
    },
    "date.badDay": {
      en: ["Day {day} does not exist in {ym} — that month has {last} days.", "There is no day {day} in {ym}; that month has {last} days.", "Day {day} does not exist in {ym}. That month has {last} days and is not taking requests."],
      yue: ["{ym} 無 {day} 號 — 嗰個月得 {last} 日。", "{ym} 邊有 {day} 號？嗰個月得 {last} 日。", "{ym} 真係無 {day} 號，嗰個月得 {last} 日，加班都加唔到。"]
    },
    "date.unknown": {
      en: ["\"{typed}\" is not a date this field understands — type {shape}, or an ISO date such as 2026-07-30.", "\"{typed}\" is not a date this field can read. Type {shape}, or an ISO date such as 2026-07-30.", "\"{typed}\" is not a date this field can read. Try {shape}, or an ISO date like 2026-07-30."],
      yue: ["「{typed}」唔係呢格識睇嘅日期 — 打 {shape}，或者 ISO 格式好似 2026-07-30。", "「{typed}」呢格讀唔明，打 {shape}，或者 ISO 格式例如 2026-07-30。", "「{typed}」呢格真係讀唔明，試下 {shape}，或者 ISO 格式好似 2026-07-30 咁。"]
    },

    "rx.long": {
      en: ["The pattern is {len} characters and the limit is {max}. Shorten it, or search plain text instead.", "The pattern is {len} characters; the limit is {max}. Shorten it, or switch back to plain text.", "The pattern runs to {len} characters against a limit of {max}. Trim it, or switch back to plain text."],
      yue: ["個 pattern 有 {len} 個字，上限係 {max}。剪短啲，或者改用純文字搜尋。", "個 pattern {len} 個字，上限 {max}，剪短啲或者轉返純文字搜尋。", "個 pattern 長到 {len} 個字，上限先至 {max}。剪短佢，或者轉返純文字搜尋。"]
    },
    "rx.bad": {
      en: ["Invalid pattern: {error}. The date filter still applies; fix the pattern or switch back to plain text.", "That pattern will not compile: {error}. The date filter still applies — fix the pattern or switch back to plain text.", "That pattern will not compile: {error}. The date filter is still doing its job — fix the pattern, or switch back to plain text."],
      yue: ["Pattern 唔啱：{error}。日期篩選照樣生效，改返個 pattern 或者轉返純文字搜尋。", "呢個 pattern 編譯唔到：{error}。日期篩選照計，改返 pattern 或者轉返純文字。", "呢個 pattern 編譯唔到：{error}。日期篩選照做嘢，改返個 pattern，或者轉返純文字搜尋。"]
    },
    "rx.nested": {
      en: ["This pattern repeats a repetition ({found}), which can take exponential time on an ordinary line and would freeze the window before any budget could stop it. Put a bound on the outer repeat (for example {1,20}), rewrite it without the nesting, or search plain text.", "This pattern repeats a repetition ({found}). That can take exponential time on an ordinary line and would freeze the window before any budget could stop it — bound the outer repeat (for example {1,20}), rewrite it without the nesting, or search plain text.", "This pattern repeats a repetition ({found}) — the classic way to make a regex engine think until the heat death of the window. Bound the outer repeat (for example {1,20}), drop the nesting, or search plain text."],
      yue: ["呢個 pattern 喺重複入面再重複（{found}），撞正一行普通字都可以行到指數級咁耐，未等到時間上限就已經卡死成個視窗。畀個上限外面嗰個重複（例如 {1,20}），或者拆走個嵌套，又或者用純文字搜尋。", "呢個 pattern 重複入面再重複（{found}），一行普通字都可能行到指數級咁耐，時間上限都嚟唔切救，成個視窗會卡死。外面嗰個重複加返上限（例如 {1,20}）、拆走個嵌套，或者用純文字搜尋。", "呢個 pattern 重複入面再重複（{found}），係整死 regex 引擎嘅經典手法，計到天荒地老都未計完，時間上限都救唔切。外面嗰個重複加返上限（例如 {1,20}）、拆走個嵌套，或者用純文字搜尋。"]
    },
    "rx.slow": {
      en: ["The search stopped after {ms} ms — that pattern is too expensive to run over the whole changelog. What matched before it stopped is shown below; simplify the pattern, or use plain text.", "The search stopped after {ms} ms because that pattern is too expensive for the whole changelog. What matched first is shown below — simplify the pattern, or use plain text.", "The search tapped out after {ms} ms: that pattern is too expensive to run over the whole changelog. What matched before it gave up is below — simplify it, or use plain text."],
      yue: ["搜尋行咗 {ms} 毫秒就停咗 — 呢個 pattern 跑成個 changelog 太貴。下面係停之前搵到嘅結果，簡化個 pattern 或者用純文字搜尋。", "搜尋 {ms} 毫秒後停咗，呢個 pattern 跑晒成個 changelog 太貴。下面係停之前嘅結果 — 簡化個 pattern 或者用純文字。", "搜尋跑咗 {ms} 毫秒就舉手投降 — 呢個 pattern 掃成個 changelog 實在太貴。下面係佢投降前搵到嘅嘢，簡化佢或者用純文字搜尋。"]
    },

    "exp.title": {
      en: ["Codex Studio — changelog export", "Codex Studio — changelog export", "Codex Studio — changelog export", "Codex Studio — changelog, as you filtered it", "Codex Studio — changelog, exactly as you filtered it"],
      yue: ["Codex Studio — changelog 匯出", "Codex Studio — changelog 匯出", "Codex Studio — changelog 匯出（照你篩嘅嚟）", "Codex Studio — changelog，你篩成點就係點", "Codex Studio — changelog，你篩成點佢就係點，一個字都無加"]
    },
    "exp.range": { en: ["Range: {range}", "Date range: {range}", "Dates covered: {range}"], yue: ["日期範圍：{range}", "日期範圍：{range}", "涵蓋日期：{range}"] },
    "exp.rangeAll": { en: ["all time (no date filter)", "all time — no date filter applied", "everything, start to finish — no date filter applied"], yue: ["全部時間（無用日期篩選）", "全部時間 — 無用日期篩選", "由頭到尾全部 — 無用過日期篩選"] },
    "exp.rangeFrom": { en: ["{from} onwards", "{from} onwards, with no end date", "{from} onwards, no end date in sight"], yue: ["由 {from} 起", "由 {from} 起，無設結束日期", "由 {from} 一路計落去，無設結束日期"] },
    "exp.rangeTo": { en: ["up to {to}", "everything up to {to}", "everything up to {to}, no start date"], yue: ["直到 {to}", "一路到 {to} 為止", "由最早一路到 {to} 為止，無設開始日期"] },
    "exp.search": { en: ["Search: {search}", "Search: {search}", "Searched for: {search}"], yue: ["搜尋：{search}", "搜尋：{search}", "搵緊：{search}"] },
    "exp.searchNone": { en: ["none — every entry in range", "none, so every entry in range is included", "nothing typed, so every entry in range came along"], yue: ["無 — 範圍入面全部項目", "無搜尋，範圍入面全部項目都收", "咩都無打，所以範圍入面全部項目都跟埋出嚟"] },
    "exp.searchText": { en: ["plain text \"{text}\"", "plain text \"{text}\"", "plain text \"{text}\" — no regex involved"], yue: ["純文字「{text}」", "純文字「{text}」", "純文字「{text}」，無用 regex"] },
    "exp.searchRegex": { en: ["regex /{pattern}/{flags}", "regex /{pattern}/{flags}", "regex /{pattern}/{flags} — you opted in"], yue: ["regex /{pattern}/{flags}", "regex /{pattern}/{flags}", "regex /{pattern}/{flags}，你自己㩒落去嘅"] },
    "exp.searchBad": { en: ["regex /{pattern}/ — invalid, so no text filter was applied", "regex /{pattern}/ — invalid, so no text filter was applied", "regex /{pattern}/ — would not compile, so no text filter was applied"], yue: ["regex /{pattern}/ — 唔啱，所以無做文字篩選", "regex /{pattern}/ — 唔啱，所以無做文字篩選", "regex /{pattern}/ — 編譯唔到，所以文字篩選無做過"] },
    "exp.counted": { en: ["{entries} entries across {versions} versions", "{entries} entries across {versions} versions", "{entries} entries spread across {versions} versions"], yue: ["{versions} 個版本、合共 {entries} 條項目", "{versions} 個版本、合共 {entries} 條項目", "{versions} 個版本入面，一共 {entries} 條項目"] },
    "exp.undated": { en: ["{n} versions have no usable date and fall outside this range", "{n} versions have no usable date, so they fall outside this range", "{n} versions turned up without a usable date, so this range cannot hold them"], yue: ["有 {n} 個版本無可用日期，跌咗出呢個範圍之外", "有 {n} 個版本無可用日期，所以唔喺呢個範圍入面", "有 {n} 個版本連個可用日期都無，呢個範圍收唔到佢哋"] },
    "exp.stamp": { en: ["Exported: {at}", "Exported at: {at}", "Exported at: {at}"], yue: ["匯出時間：{at}", "匯出時間：{at}", "匯出時間：{at}"] },
    "exp.empty": {
      en: ["Nothing matched this range and this search, so no entries were exported.", "Nothing matched this range and this search — no entries were exported.", "Nothing matched this range and this search. Zero entries exported, and the file says so rather than pretending otherwise."],
      yue: ["呢個日期範圍加呢個搜尋，一條都無中，所以無匯出任何項目。", "呢個範圍同搜尋一條都無中 — 無匯出任何項目。", "呢個範圍加呢個搜尋，一條都無中。匯出咗零條，寫明畀你知，唔會扮有嘢。"]
    },
    "exp.noChanges": { en: ["No changes are recorded for this version.", "No changes are recorded for this version.", "No changes are recorded for this version — and none were invented to fill the gap."], yue: ["呢個版本無記錄任何改動。", "呢個版本無記錄任何改動。", "呢個版本無記錄任何改動，亦都無作啲嘢出嚟填數。"] },
    "exp.untitled": { en: ["(version not named)", "(version not named)", "(version not named)"], yue: ["（無寫版本號）", "（無寫版本號）", "（無寫版本號）"] },

    "pre.all": { en: ["All time", "All time", "Everything"], yue: ["全部時間", "全部時間", "由頭到尾"] },
    "pre.7d": { en: ["Last 7 days", "Last 7 days", "The past 7 days", "Just the last 7 days", "Only the last 7 days"], yue: ["過去 7 日", "過去 7 日", "近 7 日嘅嘢", "淨係睇呢 7 日", "得呢 7 日，舊嘢唔使嚟"] },
    "pre.30d": { en: ["Last 30 days", "Last 30 days", "The past 30 days", "Just the last 30 days", "Only the last 30 days"], yue: ["過去 30 日", "過去 30 日", "近 30 日嘅嘢", "淨係睇呢 30 日", "得呢 30 日，再舊唔計"] },
    "pre.90d": { en: ["Last 90 days", "Last 90 days", "The past 90 days", "The last 90 days", "The last 90 days, roughly a quarter"], yue: ["過去 90 日", "過去 90 日", "近 90 日嘅嘢", "呢 90 日", "呢 90 日，即係大概一季"] },
    "pre.month": { en: ["This month", "This month", "This month so far", "This month so far", "This month so far, nothing older"], yue: ["今個月", "今個月", "今個月至今", "今個月至今", "今個月至今，舊嘅唔計"] },
    "pre.year": { en: ["This year", "This year", "This year so far", "This year so far", "This year so far, nothing older"], yue: ["今年", "今年", "今年至今", "今年至今", "今年至今，舊年嘅唔計"] },
    "pre.lastYear": { en: ["Last year", "Last year", "All of last year", "All of last year", "All of last year, January to December"], yue: ["舊年", "舊年", "成個舊年", "成個舊年", "成個舊年，一月數到十二月"] }
  };

  function variant(v, lang) {
    if (!Array.isArray(v)) return v;
    const i18n = g.CX && g.CX.i18n ? g.CX.i18n : null;
    const lvl = Math.min(5, Math.max(1, (i18n && i18n.funny && i18n.funny[lang]) || 3));
    return v[Math.min(v.length - 1, Math.floor(((lvl - 1) * v.length) / 5))];
  }
  function render(en, yue, vars) {
    const fill = (s) => String(s == null ? "" : s).replace(/\{(\w+)\}/g, (all, k) => (vars && vars[k] != null ? String(vars[k]) : all));
    const e = fill(variant(en, "en")), y = fill(variant(yue, "yue"));
    const mode = g.CX && g.CX.i18n ? g.CX.i18n.mode : "en";
    if (mode === "yue") return y;
    if (mode === "bi") return e === y ? e : e + "  ·  " + y;
    return e;
  }
  function say(key, vars) { const m = MSG[key]; return m ? render(m.en, m.yue, vars) : key; }
  function labelOf(l) { return l ? render(l.en, l.yue, null) : ""; }

  /* ------------------------------------------------ Keep a Changelog parser */
  const H1 = /^#\s+/;
  const H2 = /^##\s+(\S.*?)\s*$/;
  const H3 = /^###\s+(\S.*?)\s*$/;
  const BULLET = /^([-*+])\s+(.*)$/;
  const LINKDEF = /^\[([^\]]+)\]:\s*(\S+)\s*$/;
  const YANKED = /\[\s*yanked\s*\]/i;

  function parseHeading(text) {
    const h = { version: "", date: "", time: null, yanked: false, unreleased: false, bad: null };
    let s = String(text).trim();
    if (YANKED.test(s)) { h.yanked = true; s = s.replace(/\[\s*yanked\s*\]/gi, " ").trim(); }
    // Split on a spaced dash only: "1.0.0-beta.2" has no spaces around its hyphen and survives.
    const parts = s.split(/\s+[-–—]\s+/);
    h.version = String(parts[0] || "").replace(/^\[|\]$/g, "").trim();
    h.date = parts.slice(1).join(" - ").replace(/^\(|\)$/g, "").trim();
    h.unreleased = /^unreleased$/i.test(h.version);
    if (h.date) {
      const m = h.date.match(ISO);
      const d = m ? validDate(+m[1], +m[2], +m[3]) : null;
      if (d) h.time = d.getTime();
      else h.bad = h.date;               // kept verbatim — the viewer shows what the author wrote
    }
    return h;
  }

  function parse(markdown) {
    const out = [];
    const warnings = [];
    out.warnings = warnings;
    const src = markdown == null ? "" : String(markdown);
    if (!src.trim()) { warnings.push(say("parse.empty")); return out; }

    try {
      const lines = src.split(/\r?\n/);
      const links = {}, seen = {};
      let rel = null, sec = null, entry = null, loose = false;

      const flush = () => {
        if (sec && entry != null) { const t = entry.replace(/\s+$/, ""); if (t) sec.entries.push(t); }
        entry = null;
      };
      const bucket = (n) => {
        if (sec) return;
        if (!loose) { loose = true; warnings.push(say("parse.loose", { line: n, version: rel.version || "?" })); }
        sec = { title: say("parse.uncategorised"), entries: [] };
        rel.sections.push(sec);
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i], n = i + 1, t = line.trim();

        const ld = line.match(LINKDEF);
        if (ld) { flush(); links[ld[1].toLowerCase()] = ld[2]; continue; }

        const h2 = line.match(H2);
        if (h2) {
          flush();
          const h = parseHeading(h2[1]);
          rel = { version: h.version, date: h.date, time: h.time, yanked: h.yanked, unreleased: h.unreleased, summary: "", link: null, line: n, sections: [] };
          sec = null; loose = false;
          out.push(rel);
          if (!h.version) warnings.push(say("parse.noVersion", { line: n }));
          if (h.bad) warnings.push(say("parse.badDate", { line: n, date: h.bad }));
          else if (!h.date && !h.unreleased) warnings.push(say("parse.noDate", { line: n, version: h.version || "?" }));
          const key = h.version.toLowerCase();
          if (key && seen[key]) warnings.push(say("parse.dupe", { version: h.version, first: seen[key], line: n }));
          else if (key) seen[key] = n;
          continue;
        }

        const h3 = line.match(H3);
        if (h3) {
          flush();
          if (!rel) { warnings.push(say("parse.orphan", { line: n, title: h3[1] })); continue; }
          sec = { title: h3[1], entries: [] };
          rel.sections.push(sec);
          continue;
        }

        if (!rel) continue;                                   // preamble above the first version heading
        if (!t) { flush(); continue; }

        const b = line.match(BULLET);
        if (b) { flush(); bucket(n); entry = b[2]; continue; }
        if (entry != null && /^\s/.test(line)) { entry += "\n" + t; continue; }   // wrapped bullet or nested list
        if (H1.test(line)) { flush(); continue; }             // a stray "# " heading is document furniture
        if (!sec) { rel.summary = rel.summary ? rel.summary + "\n" + t : t; continue; }
        flush(); entry = t;                                   // loose prose inside a section is still content
      }
      flush();

      out.forEach((r) => {
        const l = links[String(r.version).toLowerCase()];
        if (l) r.link = l;
      });
      if (!out.length) warnings.push(say("parse.noVersions"));
    } catch (e) {
      warnings.push(say("parse.crashed", { error: e && e.message ? e.message : String(e) }));
    }
    return out;
  }

  /* ------------------------------------------------ typed dates
     Nothing here consumes the user's input: `text` comes back untouched so the field
     can keep showing what was typed while the error is reported beside it. */
  function parseDate(text, locale) {
    const typed = text == null ? "" : String(text);
    const s = typed.trim();
    const mdy = /^(en[-_]?US|und[-_]?US)\b/i.test(String(locale || ""));   // Hong Kong and most of the world type d/m
    const order = mdy ? "mdy" : "dmy";
    const shape = mdy ? "m/d/yyyy" : "d/m/yyyy";
    const other = mdy ? "d/m/yyyy" : "m/d/yyyy";
    const r = { ok: false, date: null, error: null, text: typed, order: order, shape: shape, partial: false, empty: s === "", iso: null };
    if (!s) return r;                                          // a blank field is not an error worth shouting about

    if (/^\d{4}$/.test(s)) { r.partial = true; r.error = say("date.yearOnly", { ex: s + "-01-31" }); return r; }
    if (/^\d{4}[\/.\-]\d{1,2}$/.test(s)) {
      const p = s.split(/[\/.\-]/);
      r.partial = true;
      r.error = say("date.needDay", { ex: p[0] + "-" + pad(Math.min(12, Math.max(1, +p[1]))) + "-01" });
      return r;
    }
    if (/^\d{1,2}[\/.\-]\d{1,2}$/.test(s)) { r.partial = true; r.error = say("date.needYear", { shape: shape }); return r; }

    const parts = s.match(SPLIT);
    if (!parts) { r.error = say("date.unknown", { typed: s, shape: shape }); return r; }

    const a = +parts[1], b = +parts[2], c = +parts[3];
    let y, m, d;
    if (parts[1].length === 4) { y = a; m = b; d = c; }        // yyyy-mm-dd wins whatever the separator is
    else if (parts[3].length === 4) { y = c; m = mdy ? a : b; d = mdy ? b : a; }
    else { r.partial = true; r.error = say("date.shortYear", { year: parts[3] }); return r; }

    if (m < 1 || m > 12) {
      const swapped = parts[1].length === 4 ? null : validDate(y, mdy ? b : a, m);
      r.error = swapped
        ? say("date.swap", { month: m, shape: shape, alt: isoOf(swapped), other: other })
        : say("date.badMonth", { month: m });
      return r;
    }
    const last = daysIn(y, m);
    if (d < 1 || d > last) { r.error = say("date.badDay", { day: d, ym: y + "-" + pad(m), last: last }); return r; }

    r.ok = true;
    r.date = validDate(y, m, d);
    r.iso = isoOf(r.date);
    return r;
  }

  /* ------------------------------------------------ calendar presets */
  const at = (v) => (v ? new Date(v) : new Date());
  const PRESETS = [
    { id: "all", label: MSG["pre.all"], range: function () { return { from: null, to: null }; } },
    { id: "7d", label: MSG["pre.7d"], range: function (now) { const n = at(now); return { from: dayStart(dayStart(n).getTime() - 6 * DAY), to: dayEnd(n) }; } },
    { id: "30d", label: MSG["pre.30d"], range: function (now) { const n = at(now); return { from: dayStart(dayStart(n).getTime() - 29 * DAY), to: dayEnd(n) }; } },
    { id: "90d", label: MSG["pre.90d"], range: function (now) { const n = at(now); return { from: dayStart(dayStart(n).getTime() - 89 * DAY), to: dayEnd(n) }; } },
    { id: "month", label: MSG["pre.month"], range: function (now) { const n = at(now); return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: dayEnd(n) }; } },
    { id: "year", label: MSG["pre.year"], range: function (now) { const n = at(now); return { from: new Date(n.getFullYear(), 0, 1), to: dayEnd(n) }; } },
    { id: "lastYear", label: MSG["pre.lastYear"], range: function (now) { const n = at(now); return { from: new Date(n.getFullYear() - 1, 0, 1), to: dayEnd(new Date(n.getFullYear() - 1, 11, 31)) }; } }
  ];

  /* ------------------------------------------------ bounded matching
     Plain text is the default and regex is opt-in, but both leave through the same
     predicate so a flag set in the builder cannot drift away from what actually runs.
     The whole scan shares one deadline: a catastrophic pattern costs one budget, not
     one budget per entry. */
  function limits() {
    const l = g.CX && g.CX.LIMITS;
    return { pattern: (l && l.pattern) || 2000, sample: (l && l.sample) || 20000, ms: (l && l.ms) || 300 };
  }

  /* A budget can only be checked between calls. One `exec` of `(a+)+$` against sixty
     ordinary characters never returns to be checked at all, so the shapes that blow up
     exponentially are refused before they run rather than timed out afterwards. */
  const UNBOUNDED = /^(\*|\+|\{\d+,\})/;
  function skipClass(s, i) {
    let j = i + 1;
    if (s[j] === "^") j++;
    if (s[j] === "]") j++;
    while (j < s.length && s[j] !== "]") { if (s[j] === "\\") j++; j++; }
    return j + 1;
  }
  function groupEnd(s, i) {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (c === "(") depth++;
      else if (c === ")" && !--depth) return j;
    }
    return -1;
  }
  function hasUnbounded(s) {
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (UNBOUNDED.test(s.slice(j))) return true;
    }
    return false;
  }
  function branches(s) {
    const out = [];
    let depth = 0, last = 0;
    for (let j = 0; j < s.length; j++) {
      const c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === "|" && !depth) { out.push(s.slice(last, j)); last = j + 1; }
    }
    out.push(s.slice(last));
    return out;
  }
  function overlapping(body) {
    const b = branches(body);
    if (b.length < 2) return false;
    const lead = (x) => { const c = x.charAt(0); return !c || "\\[(.^$".indexOf(c) !== -1 ? null : c; };
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) {
        if (b[i] === b[j]) return true;                                                 // (a|a)+
        if (b[i] && b[j] && (b[i].indexOf(b[j]) === 0 || b[j].indexOf(b[i]) === 0)) return true;  // (a|ab)*
        const x = lead(b[i]), y = lead(b[j]);
        if (!x || !y || x === y) return true;                     // shared, or an opening we cannot rule out
      }
    }
    return false;
  }
  function nested(pattern) {
    const s = String(pattern);
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === "\\") { i++; continue; }
      if (c === "[") { i = skipClass(s, i) - 1; continue; }
      if (c !== "(") continue;
      const end = groupEnd(s, i);
      if (end < 0) break;
      if (!UNBOUNDED.test(s.slice(end + 1))) continue;
      if (/^\?(=|!|<=|<!)/.test(s.slice(i + 1))) continue;        // a lookaround is not the shape meant here
      const body = s.slice(i + 1, end).replace(/^\?(:|<[A-Za-z_$][\w$]*>)/, "");
      if (hasUnbounded(body) || overlapping(body)) return s.slice(i, Math.min(end + 3, s.length));
    }
    return null;
  }

  function matcher(query) {
    const q = query || {};
    const raw = typeof q.text === "string" ? q.text : "";
    const rx = q.regex && q.regex.pattern ? q.regex : null;
    const L = limits();
    const m = { mode: "off", error: null, timedOut: false, test: function () { return true; } };
    if (!rx && !raw.trim()) return m;

    if (!rx) {
      const needle = raw.trim().toLowerCase();
      m.mode = "text";
      m.test = function (s) { return String(s).toLowerCase().indexOf(needle) !== -1; };
      return m;
    }

    // A global or sticky flag carries lastIndex between calls, which would make the
    // same entry match or not depending on what was tested before it.
    const flags = String(rx.flags || "").replace(/[gy]/g, "");
    if (rx.pattern.length > L.pattern) {
      m.mode = "invalid";
      m.error = say("rx.long", { len: rx.pattern.length, max: L.pattern });
      return m;
    }
    let re = null;
    try { re = new RegExp(rx.pattern, flags); }
    catch (e) { m.mode = "invalid"; m.error = say("rx.bad", { error: e.message }); return m; }

    const found = nested(rx.pattern);
    if (found) { m.mode = "invalid"; m.error = say("rx.nested", { found: found }); return m; }

    const evaluate = g.CX && typeof g.CX.evaluate === "function" ? g.CX.evaluate : null;
    const deadline = nowMs() + L.ms;
    m.mode = "regex";
    m.test = function (s) {
      if (m.timedOut) return false;
      if (nowMs() > deadline) { m.timedOut = true; m.error = say("rx.slow", { ms: L.ms }); return false; }
      const str = String(s);
      const sample = str.length > L.sample ? str.slice(0, L.sample) : str;
      if (evaluate) {
        const r = evaluate(rx.pattern, flags, sample);       // the core engine already caps matches and wall time
        if (r.timedOut) { m.timedOut = true; m.error = say("rx.slow", { ms: L.ms }); return false; }
        return r.ok && r.matches.length > 0;
      }
      re.lastIndex = 0;
      return re.test(sample);
    };
    return m;
  }

  function edge(v, end) {
    if (v == null || v === "") return null;
    if (v instanceof Date) return (end ? dayEnd(v) : dayStart(v)).getTime();
    if (typeof v === "number") return v;
    const m = String(v).trim().match(ISO);
    const d = m ? validDate(+m[1], +m[2], +m[3]) : null;
    return d ? (end ? dayEnd(d) : dayStart(d)).getTime() : null;
  }
  function normRange(range) {
    const r = { from: edge(range && range.from, false), to: edge(range && range.to, true) };
    if (r.from != null && r.to != null && r.from > r.to) { const t = r.from; r.from = r.to; r.to = t; }
    return r;
  }

  /* The date filter and the search compose: the range narrows which releases are in
     play, the search then narrows the entries inside them. Neither replaces the other,
     and `ranged` reports whether a date bound was actually applied. */
  function filter(releases, range, query) {
    const list = Array.isArray(releases) ? releases : [];
    const r = normRange(range);
    const m = matcher(query);
    const searching = m.mode === "text" || m.mode === "regex";
    const bounded = r.from != null || r.to != null;
    const today = dayStart(new Date()).getTime();
    const out = [];
    let matchCount = 0, undated = 0;

    for (let i = 0; i < list.length; i++) {
      const rel = list[i] || {};
      const sections = Array.isArray(rel.sections) ? rel.sections : [];
      if (bounded) {
        // An unreleased section is dated "now" — it describes the state of the tree today.
        const t = rel.time != null ? rel.time : (rel.unreleased ? today : null);
        if (t == null) { undated++; continue; }
        if (r.from != null && t < r.from) continue;
        if (r.to != null && t > r.to) continue;
      }

      let kept;
      const head = [rel.version, rel.date, rel.summary].filter(Boolean).join(" ");
      if (!searching || m.test(head)) {
        kept = sections.map((s) => ({ title: s.title, entries: (s.entries || []).slice() }));
      } else {
        kept = [];
        for (let j = 0; j < sections.length; j++) {
          const s = sections[j], all = s.entries || [];
          const entries = m.test(s.title || "") ? all.slice() : all.filter((e) => m.test(e));
          if (entries.length) kept.push({ title: s.title, entries: entries });
        }
        if (!kept.length) continue;
      }
      for (let k = 0; k < kept.length; k++) matchCount += kept[k].entries.length;
      out.push(Object.assign({}, rel, { sections: kept }));
    }

    return {
      releases: out, matchCount: matchCount, ranged: bounded,
      from: r.from, to: r.to, undated: undated, mode: m.mode, error: m.error, timedOut: m.timedOut
    };
  }

  /* ------------------------------------------------ export
     Whatever the filter produced is what leaves the app, and the header states the
     range and the search so the file can never be mistaken for the whole changelog. */
  function rangeText(range, view) {
    const id = range && (range.id || range.presetId);
    const p = id ? PRESETS.filter((x) => x.id === id)[0] : null;
    const suffix = p ? " (" + labelOf(p.label) + ")" : "";
    if (view.from == null && view.to == null) return say("exp.rangeAll") + suffix;
    if (view.from != null && view.to != null) return isoOf(view.from) + " → " + isoOf(view.to) + suffix;
    if (view.from != null) return say("exp.rangeFrom", { from: isoOf(view.from) }) + suffix;
    return say("exp.rangeTo", { to: isoOf(view.to) }) + suffix;
  }
  function queryText(query, view) {
    const q = query || {};
    if (view.mode === "regex") return say("exp.searchRegex", { pattern: q.regex.pattern, flags: String(q.regex.flags || "").replace(/[gy]/g, "") });
    if (view.mode === "text") return say("exp.searchText", { text: String(q.text || "").trim() });
    if (view.mode === "invalid") return say("exp.searchBad", { pattern: (q.regex && q.regex.pattern) || "" });
    return say("exp.searchNone");
  }
  const rule = (ch, n) => new Array(Math.max(1, n) + 1).join(ch);

  function exportView(releases, range, query, format) {
    const md = format !== "text";
    const view = filter(releases, range, query);
    const L = [];
    const head = say("exp.title");
    L.push(md ? "# " + head : head);
    if (!md) L.push(rule("=", head.length));
    L.push("");

    const note = (s) => (md ? "- " + s : "  " + s);
    L.push(note(say("exp.range", { range: rangeText(range, view) })));
    L.push(note(say("exp.search", { search: queryText(query, view) })));
    L.push(note(say("exp.counted", { entries: view.matchCount, versions: view.releases.length })));
    if (view.undated) L.push(note(say("exp.undated", { n: view.undated })));
    if (view.error) L.push(note(view.error));
    L.push(note(say("exp.stamp", { at: stamp(new Date()) })));
    L.push("");

    if (!view.releases.length) { L.push(say("exp.empty")); L.push(""); return L.join("\n"); }

    view.releases.forEach((rel) => {
      const title = (rel.version || say("exp.untitled")) + (rel.date ? " - " + rel.date : "") + (rel.yanked ? " [YANKED]" : "");
      L.push(md ? "## " + title : title);
      if (!md) L.push(rule("-", title.length));
      if (rel.summary) { L.push(""); L.push(md ? rel.summary : "  " + rel.summary.split("\n").join("\n  ")); }
      if (!rel.sections.length) { L.push(""); L.push(md ? "_" + say("exp.noChanges") + "_" : "  " + say("exp.noChanges")); }
      rel.sections.forEach((s) => {
        L.push("");
        L.push(md ? "### " + s.title : "  " + s.title);
        s.entries.forEach((e) => {
          const body = String(e).split("\n");
          L.push(md ? "- " + body[0] : "    - " + body[0]);
          for (let i = 1; i < body.length; i++) L.push((md ? "  " : "      ") + body[i]);
        });
      });
      L.push("");
    });
    return L.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "") + "\n";
  }

  g.CX_CHANGELOG = { VERSION: 1, parse: parse, parseDate: parseDate, PRESETS: PRESETS, filter: filter, exportView: exportView };
})(window);
