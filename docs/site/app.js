/* Codex Studio — GitHub Pages site behaviour.
 *
 * Plain browser JavaScript. No framework, no build step, no import, no fetch. The page
 * opens by double-clicking the file, and everything it needs is already on the page:
 * articles.js attached `window.CXS_DATA`, and this file reads it.
 *
 * Sections below, in order:
 *   store          namespaced localStorage that never throws
 *   i18n           three modes, two funny sliders, facts interpolated after the voice
 *   colour         hex/rgb/hsl/hsv/oklch conversion and a WCAG contrast ratio
 *   theme          light / dark / system, accent, font, density
 *   regex          the bounded engine, including the shape it refuses outright
 *   tabs           strip, roving focus, pinning, overflow, persistence
 *   render         one function per panel
 *   toasts         corner notifications, never a blocking alert()
 *   dim sum        a 1% draw per page load, never on a first visit
 */
(function () {
  "use strict";

  var D = window.CXS_DATA;
  if (!D) { return; }
  var F = D.FACTS;

  /* =================================================================== store
     A corrupted or unavailable localStorage must degrade to defaults, never throw:
     a settings page that cannot save is a nuisance, one that cannot render is a bug. */
  var PREFIX = "cxs.";
  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(PREFIX + key); } catch (e) { /* nothing to do */ }
    }
  };

  var DEFAULTS = {
    theme: "system",          // system | light | dark
    accent: "",               // "" = the Material 3 default for the active theme
    font: "roboto",
    fontScale: 100,
    density: "cosy",
    lang: "en",               // en | yue | bi
    funnyEn: 3,
    funnyYue: 3,
    dimsum: true,
    tab: "overview",
    pinned: ["overview"],
    regex: false
  };
  var prefs = {};
  (function loadPrefs() {
    for (var k in DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
        var v = store.get(k, DEFAULTS[k]);
        prefs[k] = (v === null || v === undefined) ? DEFAULTS[k] : v;
      }
    }
    if (!Array.isArray(prefs.pinned)) { prefs.pinned = DEFAULTS.pinned.slice(); }
    prefs.funnyEn = clamp(Math.round(Number(prefs.funnyEn) || 3), 1, 5);
    prefs.funnyYue = clamp(Math.round(Number(prefs.funnyYue) || 3), 1, 5);
    prefs.fontScale = clamp(Math.round(Number(prefs.fontScale) || 100), 80, 150);
  })();
  function savePref(key, value) { prefs[key] = value; store.set(key, value); }

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

  /* ==================================================================== i18n
     The level chooses the voice; the placeholders are filled afterwards. That
     ordering is the whole guarantee — no variant of a key can name a different
     number from any other, because none of them contains a number at all. */
  var JOIN = "  ·  ";
  var MARK_OPEN = String.fromCharCode(1);
  var MARK_CLOSE = String.fromCharCode(2);

  function levelIndex(lang) {
    var n = lang === "yue" ? prefs.funnyYue : prefs.funnyEn;
    return clamp(Math.round(Number(n) || 3), 1, 5) - 1;
  }

  function interpolate(text, vars, markFacts) {
    return String(text).replace(/\{(\w+)\}/g, function (whole, name) {
      var v = vars && Object.prototype.hasOwnProperty.call(vars, name) ? vars[name]
        : Object.prototype.hasOwnProperty.call(F, name) ? F[name]
          : null;
      // An unknown placeholder stays visible. A fact we cannot fill is not a fact we
      // may quietly hide.
      if (v === null) { return whole; }
      // MARK_OPEN/MARK_CLOSE are two control characters no copy will ever contain.
      // They survive HTML escaping and are swapped for <mark> afterwards.
      return markFacts ? MARK_OPEN + v + MARK_CLOSE : String(v);
    });
  }

  /** Plain-text lookup. `vars` falls back to FACTS for any name it does not carry. */
  function t(key, vars) {
    var entry = D.STRINGS[key];
    if (!entry) { return key; }              // a missing key must be visible, not blank
    var en = interpolate(entry.en[levelIndex("en")], vars, false);
    var yue = interpolate(entry.yue[levelIndex("yue")], vars, false);
    if (prefs.lang === "yue") { return yue; }
    if (prefs.lang !== "bi") { return en; }
    return en === yue ? en : en + JOIN + yue;
  }

  /** Same lookup, returning escaped HTML with every interpolated fact wrapped in
   *  <mark>. Used by the settings demonstration so the claim is checkable on screen. */
  function tMarked(key, vars, lang) {
    var entry = D.STRINGS[key];
    if (!entry) { return esc(key); }
    var raw = interpolate(entry[lang][levelIndex(lang)], vars, true);
    return esc(raw).split(MARK_OPEN).join("<mark>").split(MARK_CLOSE).join("</mark>");
  }

  function langsInPlay() {
    if (prefs.lang === "yue") { return ["yue"]; }
    if (prefs.lang === "bi") { return ["en", "yue"]; }
    return ["en"];
  }

  /* ================================================================== colour
     The same conversions the app performs in app/codex-core.js, reimplemented here
     because this page loads nothing from app/ except its fonts and its photographs. */
  var colour = {
    hexToRgb: function (hex) {
      var h = String(hex).replace("#", "").trim();
      if (h.length === 3) { h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2); }
      if (!/^[0-9a-fA-F]{6}$/.test(h)) { return null; }
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    },
    rgbToHex: function (c) {
      function p(n) { return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0"); }
      return "#" + p(c.r) + p(c.g) + p(c.b);
    },
    rgbToHsv: function (c) {
      var R = c.r / 255, G = c.g / 255, B = c.b / 255;
      var max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min, h = 0;
      if (d) {
        if (max === R) { h = ((G - B) / d) % 6; }
        else if (max === G) { h = (B - R) / d + 2; }
        else { h = (R - G) / d + 4; }
        h *= 60; if (h < 0) { h += 360; }
      }
      return { h: h, s: max ? (d / max) * 100 : 0, v: max * 100 };
    },
    hsvToRgb: function (c) {
      var s = c.s / 100, v = c.v / 100;
      var C = v * s, X = C * (1 - Math.abs(((c.h / 60) % 2) - 1)), m = v - C;
      var t = c.h < 60 ? [C, X, 0] : c.h < 120 ? [X, C, 0] : c.h < 180 ? [0, C, X]
        : c.h < 240 ? [0, X, C] : c.h < 300 ? [X, 0, C] : [C, 0, X];
      return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255 };
    },
    rgbToHsl: function (c) {
      var R = c.r / 255, G = c.g / 255, B = c.b / 255;
      var max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min, l = (max + min) / 2, h = 0;
      if (d) {
        if (max === R) { h = ((G - B) / d) % 6; }
        else if (max === G) { h = (B - R) / d + 2; }
        else { h = (R - G) / d + 4; }
        h *= 60; if (h < 0) { h += 360; }
      }
      return { h: h, s: d ? (d / (1 - Math.abs(2 * l - 1))) * 100 : 0, l: l * 100 };
    },
    hslToRgb: function (c) {
      var s = c.s / 100, l = c.l / 100;
      var C = (1 - Math.abs(2 * l - 1)) * s, X = C * (1 - Math.abs(((c.h / 60) % 2) - 1)), m = l - C / 2;
      var t = c.h < 60 ? [C, X, 0] : c.h < 120 ? [X, C, 0] : c.h < 180 ? [0, C, X]
        : c.h < 240 ? [0, X, C] : c.h < 300 ? [X, 0, C] : [C, 0, X];
      return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255 };
    },
    lin: function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); },
    oklab: function (c) {
      var R = this.lin(c.r), G = this.lin(c.g), B = this.lin(c.b);
      var l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
      var m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
      var s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
      return {
        l: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
      };
    },
    oklch: function (c) {
      var o = this.oklab(c);
      return { l: o.l, c: Math.hypot(o.a, o.b), h: (Math.atan2(o.b, o.a) * 180 / Math.PI + 360) % 360 };
    },
    luminance: function (c) { return 0.2126 * this.lin(c.r) + 0.7152 * this.lin(c.g) + 0.0722 * this.lin(c.b); },
    contrast: function (a, b) {
      var x = this.luminance(a), y = this.luminance(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    },
    /** Every representation the translator shows, in the order it shows them. */
    translate: function (hex) {
      var rgb = this.hexToRgb(hex);
      if (!rgb) { return []; }
      function n(v, d) { return Number(v.toFixed(d === undefined ? 1 : d)); }
      var hsl = this.rgbToHsl(rgb), hsv = this.rgbToHsv(rgb), ok = this.oklch(rgb);
      return [
        ["HEX", this.rgbToHex(rgb).toUpperCase()],
        ["RGB", "rgb(" + Math.round(rgb.r) + " " + Math.round(rgb.g) + " " + Math.round(rgb.b) + ")"],
        ["HSL", "hsl(" + n(hsl.h) + " " + n(hsl.s) + "% " + n(hsl.l) + "%)"],
        ["HSV", "hsv(" + n(hsv.h) + " " + n(hsv.s) + "% " + n(hsv.v) + "%)"],
        ["OKLCH", "oklch(" + n(ok.l, 3) + " " + n(ok.c, 3) + " " + n(ok.h) + ")"]
      ];
    }
  };

  /* =================================================================== theme */
  var FONTS = {
    roboto: { label: "Roboto (bundled)", stack: 'Roboto, "Segoe UI", "Helvetica Neue", Helvetica, Arial, var(--cx-cjk)' },
    system: { label: "System UI", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif, var(--cx-cjk)' },
    serif: { label: "Serif", stack: 'Georgia, "Times New Roman", "Songti TC", serif' },
    mono: { label: "Monospace", stack: '"Roboto Mono", "Cascadia Mono", Consolas, monospace' }
  };

  function effectiveTheme() {
    if (prefs.theme === "light" || prefs.theme === "dark") { return prefs.theme; }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyAppearance() {
    var root = document.documentElement;
    if (prefs.theme === "system") { root.removeAttribute("data-theme"); }
    else { root.setAttribute("data-theme", prefs.theme); }
    root.setAttribute("data-density", prefs.density);
    root.style.setProperty("--ui-font", (FONTS[prefs.font] || FONTS.roboto).stack);
    root.style.setProperty("--fs", (15 * prefs.fontScale / 100).toFixed(2) + "px");
    applyAccent();
    var btn = document.getElementById("themeBtn");
    if (btn) {
      btn.textContent = "Theme: " + prefs.theme + (prefs.theme === "system" ? " (" + effectiveTheme() + ")" : "");
    }
  }

  /** An accent replaces the four primary tokens. Container shades are derived by
   *  moving lightness toward the surface, so the pair stays legible in both themes,
   *  and the foreground is whichever of black or white contrasts better. */
  function applyAccent() {
    var root = document.documentElement;
    var props = ["--m3-primary", "--m3-on-primary", "--m3-primary-container", "--m3-on-primary-container"];
    var i;
    if (!prefs.accent) {
      for (i = 0; i < props.length; i++) { root.style.removeProperty(props[i]); }
      return;
    }
    var rgb = colour.hexToRgb(prefs.accent);
    if (!rgb) {
      for (i = 0; i < props.length; i++) { root.style.removeProperty(props[i]); }
      return;
    }
    var dark = effectiveTheme() === "dark";
    var hsl = colour.rgbToHsl(rgb);
    var base = colour.hslToRgb({ h: hsl.h, s: hsl.s, l: dark ? Math.max(hsl.l, 62) : Math.min(hsl.l, 48) });
    var onBase = colour.contrast(base, { r: 0, g: 0, b: 0 }) >= colour.contrast(base, { r: 255, g: 255, b: 255 })
      ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    var container = colour.hslToRgb({ h: hsl.h, s: Math.min(hsl.s, 70), l: dark ? 30 : 90 });
    var onContainer = colour.hslToRgb({ h: hsl.h, s: Math.min(hsl.s, 80), l: dark ? 92 : 18 });
    root.style.setProperty("--m3-primary", colour.rgbToHex(base));
    root.style.setProperty("--m3-on-primary", colour.rgbToHex(onBase));
    root.style.setProperty("--m3-primary-container", colour.rgbToHex(container));
    root.style.setProperty("--m3-on-primary-container", colour.rgbToHex(onContainer));
  }

  /* =================================================================== regex
     The same bounds and the same refusal as app/codex-core.js. A single
     `RegExp.exec` call cannot be interrupted from JavaScript, so a millisecond budget
     only helps BETWEEN matches. The one real defence against `(a+)+` is to recognise
     the shape and refuse to run it. */
  var LIMITS = { pattern: 2000, sample: 20000, matches: 500, ms: 300 };

  function repeatsMoreThanOnce(tail) {
    var m = /^(\*|\+|\?|\{(\d+)(,(\d*))?\})/.exec(tail);
    if (!m) { return false; }
    if (m[1] === "*" || m[1] === "+") { return true; }
    if (m[1] === "?") { return false; }
    var min = Number(m[2]);
    if (m[3] !== undefined && (m[4] === "" || m[4] === undefined)) { return true; }   // {n,}
    var max = (m[4] !== undefined && m[4] !== "") ? Number(m[4]) : min;
    return max > 1;
  }
  function skipClass(s, i) {
    var j = i + 1;
    if (s[j] === "^") { j++; }
    if (s[j] === "]") { j++; }
    while (j < s.length && s[j] !== "]") { if (s[j] === "\\") { j++; } j++; }
    return j + 1;
  }
  function groupEnd(s, i) {
    var depth = 0;
    for (var j = i; j < s.length; j++) {
      var c = s[j];
      if (c === "\\") { j++; continue; }
      if (c === "[") { j = skipClass(s, j) - 1; continue; }
      if (c === "(") { depth++; }
      else if (c === ")") { depth--; if (depth === 0) { return j; } }
    }
    return -1;
  }
  /** The offending fragment, or null. Reported verbatim so the refusal names the
   *  exact part of the pattern that is the problem. */
  function nestedQuantifier(pattern) {
    var s = String(pattern);
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === "\\") { i++; continue; }
      if (c === "[") { i = skipClass(s, i) - 1; continue; }
      if (c !== "(") { continue; }
      var end = groupEnd(s, i);
      if (end < 0) { break; }
      if (!repeatsMoreThanOnce(s.slice(end + 1))) { continue; }
      if (/^\?(=|!|<=|<!)/.test(s.slice(i + 1))) { continue; }   // a lookaround is a different shape
      var body = s.slice(i + 1, end).replace(/^\?(:|<[A-Za-z_$][\w$]*>)/, "");
      var j = 0;
      while (j < body.length) {
        if (body[j] === "\\") { j += 2; continue; }
        if (body[j] === "[") { j = skipClass(body, j); continue; }
        if (repeatsMoreThanOnce(body.slice(j)) && j > 0) { return s.slice(i, Math.min(end + 4, s.length)); }
        j++;
      }
    }
    return null;
  }

  /** Compile a pattern into something safe to run, or explain why not. */
  function compile(pattern, flags) {
    if (!pattern) { return { ok: false, error: "Empty pattern — nothing is matched." }; }
    if (pattern.length > LIMITS.pattern) {
      return { ok: false, error: "Pattern exceeds " + LIMITS.pattern + " characters." };
    }
    var nested = nestedQuantifier(pattern);
    if (nested) {
      return { ok: false, refused: nested, error: t("regex.refused", { frag: nested, ms: LIMITS.ms }) };
    }
    var re;
    try { re = new RegExp(pattern, flags.indexOf("g") === -1 ? flags + "g" : flags); }
    catch (e) { return { ok: false, error: t("regex.bad", { detail: e.message }) }; }
    return { ok: true, re: re };
  }

  function evaluate(pattern, flags, sample) {
    var res = { ok: true, error: null, matches: [], truncated: false, timedOut: false, ms: 0 };
    var built = compile(pattern, flags);
    if (!built.ok) { res.ok = false; res.error = built.error; res.refused = built.refused; return res; }
    if (sample.length > LIMITS.sample) {
      res.ok = false; res.error = "Sample exceeds " + LIMITS.sample + " characters."; return res;
    }
    var re = built.re, m, guard = 0;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
    while ((m = re.exec(sample)) !== null) {
      res.matches.push({ index: m.index, text: m[0], groups: m.slice(1) });
      if (m[0] === "") { re.lastIndex++; }                    // zero-width guard
      if (res.matches.length >= LIMITS.matches) { res.truncated = true; break; }
      if ((++guard % 200) === 0 && now() - t0 > LIMITS.ms) { res.timedOut = true; break; }
    }
    res.ms = Math.round((now() - t0) * 100) / 100;
    if (res.timedOut) {
      res.ok = false;
      res.error = "Evaluation stopped after " + LIMITS.ms + " ms (possible catastrophic backtracking).";
    }
    return res;
  }

  var CONSTRUCTS = [
    { group: "Characters", items: [[".", "any character"], ["\\d", "digit"], ["\\w", "word char"], ["\\s", "whitespace"],
      ["\\D", "non-digit"], ["\\S", "non-space"], ["[abc]", "class"], ["[^abc]", "negated class"], ["[a-z]", "range"],
      ["\\p{L}", "unicode property (u flag)"]] },
    { group: "Anchors", items: [["^", "start"], ["$", "end"], ["\\b", "word boundary"], ["\\B", "non-boundary"]] },
    { group: "Quantifiers", items: [["*", "0 or more"], ["+", "1 or more"], ["?", "0 or 1"], ["{2,4}", "2 to 4"],
      ["*?", "lazy 0+"], ["+?", "lazy 1+"]] },
    { group: "Groups", items: [["(…)", "capture"], ["(?:…)", "non-capturing"], ["(?<name>…)", "named capture"],
      ["(?=…)", "lookahead"], ["(?!…)", "negative lookahead"], ["(?<=…)", "lookbehind"], ["(?<!…)", "negative lookbehind"],
      ["a|b", "alternation"]] }
  ];
  var FLAG_LIST = [["g", "global"], ["i", "ignore case"], ["m", "multiline anchors"], ["s", "dot matches newline"],
    ["u", "unicode"], ["v", "unicode sets"], ["y", "sticky"], ["d", "match indices"]];

  /* ================================================================ helpers */
  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /** Escape first, then apply the tiny inline grammar the article data uses:
   *  ``code with a backtick``, `code`, **bold**. Nothing else is interpreted. */
  function inline(s) {
    return esc(s)
      .replace(/``([\s\S]+?)``/g, function (_m, c) { return "<code>" + c + "</code>"; })
      .replace(/`([^`]+)`/g, function (_m, c) { return "<code>" + c + "</code>"; })
      .replace(/\*\*([^*]+)\*\*/g, function (_m, c) { return "<strong>" + c + "</strong>"; });
  }
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] !== null && attrs[k] !== undefined) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (html !== undefined) { node.innerHTML = html; }
    return node;
  }
  function $(id) { return document.getElementById(id); }

  /* ================================================================= toasts */
  var TOAST_TIMEOUT = { info: 5000, success: 4000, warning: 0, error: 0 };
  function toast(kind, title, body) {
    var host = $("toasts");
    if (!host) { return; }
    var node = el("div", { "class": "toast", "data-kind": kind, role: kind === "error" || kind === "warning" ? "alert" : "status" });
    var text = el("div", { "class": "toast__body" });
    text.appendChild(el("div", { "class": "toast__title" }, esc(title)));
    if (body) { text.appendChild(el("div", null, esc(body))); }
    var close = el("button", { "class": "icon-btn", type: "button", "aria-label": "Dismiss this notification" }, "✕");
    close.addEventListener("click", function () { node.remove(); });
    node.appendChild(text);
    node.appendChild(close);
    host.appendChild(node);
    var ms = TOAST_TIMEOUT[kind];
    if (ms > 0) { window.setTimeout(function () { node.remove(); }, ms); }
    while (host.children.length > 4) { host.firstChild.remove(); }
  }

  function copyText(text, what) {
    function ok() { toast("success", t("toast.copied", { what: what })); }
    function fail(e) { toast("error", t("toast.copyFailed", { what: what, detail: (e && e.message) || "the clipboard was refused" })); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fail);
      return;
    }
    // execCommand is deprecated but is the only path on a file:// page in some browsers.
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var done = document.execCommand("copy");
      ta.remove();
      if (done) { ok(); } else { fail(new Error("the browser refused the copy")); }
    } catch (e) { fail(e); }
  }

  /* =================================================================== tabs */
  var TABS = [
    { id: "overview", key: "nav.overview", render: renderOverview },
    { id: "features", key: "nav.features", render: renderFeatures },
    { id: "docs", key: "nav.docs", render: renderDocs },
    { id: "shots", key: "nav.shots", render: renderShots },
    { id: "changelog", key: "nav.changelog", render: renderChangelog },
    { id: "settings", key: "nav.settings", render: renderSettings }
  ];

  function isPinned(id) { return prefs.pinned.indexOf(id) !== -1; }
  function tabById(id) {
    for (var i = 0; i < TABS.length; i++) { if (TABS[i].id === id) { return TABS[i]; } }
    return null;
  }
  /** Pinned tabs occupy a stable region ahead of the ordinary ones and keep their own
   *  relative order within it — the same rule the app's own strip uses. */
  function orderedTabs() {
    var pinned = [], loose = [];
    for (var i = 0; i < TABS.length; i++) { (isPinned(TABS[i].id) ? pinned : loose).push(TABS[i]); }
    return pinned.concat(loose);
  }

  function buildStrip() {
    var list = $("tablist");
    list.innerHTML = "";
    var ordered = orderedTabs();
    for (var i = 0; i < ordered.length; i++) {
      (function (tab) {
        var selected = tab.id === prefs.tab;
        var btn = el("button", {
          type: "button", role: "tab", id: "tab-" + tab.id, "class": "tab",
          "aria-selected": selected ? "true" : "false",
          "aria-controls": "panel-" + tab.id,
          tabindex: selected ? "0" : "-1",
          "data-tab": tab.id,
          title: (isPinned(tab.id) ? "Pinned. " : "") + "Press P to " + (isPinned(tab.id) ? "unpin" : "pin") + ", or open the context menu."
        });
        if (isPinned(tab.id)) { btn.appendChild(el("span", { "class": "tab__pin", "aria-hidden": "true" }, "📌")); }
        btn.appendChild(el("span", { "class": "tab__label" }, esc(t(tab.key))));
        if (isPinned(tab.id)) { btn.appendChild(el("span", { "class": "vh" }, "(pinned)")); }
        btn.addEventListener("click", function () { activate(tab.id, true); });
        btn.addEventListener("keydown", onTabKey);
        btn.addEventListener("contextmenu", function (e) { e.preventDefault(); openTabMenu(tab, btn); });
        list.appendChild(btn);
      })(ordered[i]);
    }
    layoutStrip();
  }

  function onTabKey(e) {
    var buttons = Array.prototype.slice.call($("tablist").querySelectorAll(".tab"))
      .filter(function (b) { return !b.hidden; });
    var at = buttons.indexOf(e.currentTarget);
    var next = -1;
    if (e.key === "ArrowRight") { next = (at + 1) % buttons.length; }
    else if (e.key === "ArrowLeft") { next = (at - 1 + buttons.length) % buttons.length; }
    else if (e.key === "Home") { next = 0; }
    else if (e.key === "End") { next = buttons.length - 1; }
    else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      togglePin(e.currentTarget.getAttribute("data-tab"));
      return;
    } else { return; }
    e.preventDefault();
    if (next >= 0 && buttons[next]) {
      activate(buttons[next].getAttribute("data-tab"), true);
      var moved = $("tablist").querySelector('[data-tab="' + buttons[next].getAttribute("data-tab") + '"]');
      if (moved) { moved.focus(); }
    }
  }

  function togglePin(id) {
    var tab = tabById(id);
    if (!tab) { return; }
    if (isPinned(id)) {
      prefs.pinned = prefs.pinned.filter(function (x) { return x !== id; });
      toast("info", t("toast.unpinned", { what: t(tab.key) }));
    } else {
      prefs.pinned = prefs.pinned.concat([id]);
      toast("info", t("toast.pinned", { what: t(tab.key) }));
    }
    store.set("pinned", prefs.pinned);
    buildStrip();
    var moved = $("tablist").querySelector('[data-tab="' + id + '"]');
    if (moved) { moved.focus(); }
  }

  /* One popup implementation for both the overflow list and a tab's own menu. */
  var openMenu = null;
  function closeMenu() {
    if (!openMenu) { return; }
    if (openMenu.node && openMenu.node.parentNode) { openMenu.node.remove(); }
    if (openMenu.trigger) { openMenu.trigger.setAttribute("aria-expanded", "false"); }
    openMenu = null;
  }
  function popupMenu(anchor, items, trigger) {
    closeMenu();
    var menu = el("ul", { "class": "overflow__menu", role: "menu" });
    menu.style.position = "absolute";
    items.forEach(function (item) {
      var li = el("li", { role: "none" });
      var b = el("button", { type: "button", role: "menuitem", "class": "menu-item" });
      b.appendChild(el("span", null, esc(item.label)));
      if (item.hint) { b.appendChild(el("span", { "class": "menu-item__key" }, esc(item.hint))); }
      b.addEventListener("click", function () { closeMenu(); item.run(); });
      li.appendChild(b);
      menu.appendChild(li);
    });
    document.body.appendChild(menu);
    var box = anchor.getBoundingClientRect();
    var top = box.bottom + window.scrollY + 6;
    var left = Math.min(box.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - menu.offsetWidth - 10);
    menu.style.top = top + "px";
    menu.style.left = Math.max(8, left) + "px";
    if (trigger) { trigger.setAttribute("aria-expanded", "true"); }
    openMenu = { node: menu, trigger: trigger, returnTo: anchor };
    var first = menu.querySelector("button");
    if (first) { first.focus(); }
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); anchor.focus(); }
    });
  }
  document.addEventListener("click", function (e) {
    if (openMenu && openMenu.node && !openMenu.node.contains(e.target) &&
        (!openMenu.trigger || !openMenu.trigger.contains(e.target))) { closeMenu(); }
  });

  function openTabMenu(tab, anchor) {
    popupMenu(anchor, [
      { label: "Open " + t(tab.key), run: function () { activate(tab.id, true); } },
      { label: isPinned(tab.id) ? "Unpin this tab" : "Pin this tab", hint: "P", run: function () { togglePin(tab.id); } },
      { label: "Copy a link to this tab", run: function () {
        copyText(location.href.split("#")[0] + "#" + tab.id, "the link");
      } }
    ], null);
  }

  /** Hide the tabs that do not fit and list them in the overflow menu. Pinned tabs
   *  and the active tab are never hidden — an overflow that can swallow the tab you
   *  are reading is worse than no overflow at all. */
  function layoutStrip() {
    var list = $("tablist");
    var btn = $("overflowBtn");
    var buttons = Array.prototype.slice.call(list.querySelectorAll(".tab"));
    var i;
    for (i = 0; i < buttons.length; i++) { buttons[i].hidden = false; }
    btn.hidden = true;

    var available = list.clientWidth;
    if (!available) { return; }
    var used = 0, hidden = [];
    for (i = 0; i < buttons.length; i++) {
      var w = buttons[i].offsetWidth + 5;
      var id = buttons[i].getAttribute("data-tab");
      var protectedTab = isPinned(id) || id === prefs.tab;
      if (used + w <= available || protectedTab) { used += w; }
      else { hidden.push(buttons[i]); }
    }
    // Leave room for the overflow control itself, then re-check.
    if (hidden.length) {
      used = 0; hidden = [];
      var budget = available - 96;
      for (i = 0; i < buttons.length; i++) {
        var w2 = buttons[i].offsetWidth + 5;
        var id2 = buttons[i].getAttribute("data-tab");
        var keep = isPinned(id2) || id2 === prefs.tab;
        if (used + w2 <= budget || keep) { used += w2; }
        else { hidden.push(buttons[i]); }
      }
    }
    for (i = 0; i < hidden.length; i++) { hidden[i].hidden = true; }
    if (!hidden.length) { return; }

    btn.hidden = false;
    $("overflowCount").textContent = "(" + hidden.length + ")";
    btn.onclick = function (e) {
      e.stopPropagation();
      if (btn.getAttribute("aria-expanded") === "true") { closeMenu(); return; }
      popupMenu(btn, hidden.map(function (b) {
        var id = b.getAttribute("data-tab");
        var tab = tabById(id);
        return { label: t(tab.key), run: function () { activate(id, true); } };
      }), btn);
    };
  }

  function activate(id, persist) {
    if (!tabById(id)) { id = "overview"; }
    prefs.tab = id;
    if (persist) { store.set("tab", id); }
    var i, tab;
    for (i = 0; i < TABS.length; i++) {
      tab = TABS[i];
      var panel = $("panel-" + tab.id);
      var button = $("tab-" + tab.id);
      var on = tab.id === id;
      if (panel) { panel.hidden = !on; }
      if (button) {
        button.setAttribute("aria-selected", on ? "true" : "false");
        button.setAttribute("tabindex", on ? "0" : "-1");
      }
    }
    if (location.hash.slice(1) !== id) {
      try { history.replaceState(null, "", "#" + id); } catch (e) { location.hash = id; }
    }
    renderActive();
    layoutStrip();
  }

  function renderActive() {
    var tab = tabById(prefs.tab);
    if (!tab) { return; }
    var panel = $("panel-" + tab.id);
    panel.innerHTML = "";
    tab.render(panel);
  }

  /* ================================================================= search
     One index over every article, every documentation page and the changelog. */
  var INDEX = [];
  (function buildIndex() {
    D.ARTICLES.forEach(function (art) {
      var parts = [art.title, art.tag, art.summary];
      art.lead.en.forEach(function (v) { parts.push(v); });
      art.sections.forEach(function (sec) {
        parts.push(sec.h);
        sec.blocks.forEach(function (b) {
          if (b.t === "p" || b.t === "code") { parts.push(b.v); }
          else if (b.t === "ul") { parts.push(b.v.join(" ")); }
          else if (b.t === "kv") { b.v.forEach(function (row) { parts.push(row[0] + " " + row[1]); }); }
        });
      });
      INDEX.push({ kind: "article", id: art.id, title: art.title, tag: art.tag, summary: art.summary, text: parts.join("\n") });
    });
    D.DOCS.forEach(function (cat) {
      cat.pages.forEach(function (page) {
        INDEX.push({
          kind: "doc", id: page.path, title: page.title, tag: cat.cat, summary: page.note,
          text: [page.path, page.title, page.note, cat.cat].join("\n")
        });
      });
    });
    D.CHANGELOG.forEach(function (rel) {
      var parts = [rel.version, rel.date, rel.status, rel.note];
      rel.sections.forEach(function (sec) { parts.push(sec.kind); sec.items.forEach(function (x) { parts.push(x); }); });
      INDEX.push({
        kind: "changelog", id: rel.version, title: "Changelog " + rel.version, tag: "Changelog",
        summary: rel.date, text: parts.join("\n")
      });
    });
  })();

  var rxState = { pattern: "", flags: ["i"], sample: "" };

  function currentQuery() { return $("q").value; }

  function runSearch() {
    var q = currentQuery();
    var results = $("results");
    var panels = $("panels");
    var meta = $("searchmeta");

    if (!q) {
      results.hidden = true;
      results.innerHTML = "";
      panels.hidden = false;
      meta.textContent = prefs.regex ? t("regex.plain") : "";
      meta.removeAttribute("data-tone");
      return;
    }

    var test;
    if (prefs.regex) {
      var built = compile(q, rxState.flags.filter(function (f) { return f !== "g" && f !== "y"; }).join(""));
      if (!built.ok) {
        meta.textContent = built.error;
        meta.setAttribute("data-tone", "error");
        results.hidden = false;
        panels.hidden = true;
        results.innerHTML = "";
        results.appendChild(el("div", { "class": "card" }, "<p>" + esc(built.error) + "</p>"));
        return;
      }
      test = function (text) { built.re.lastIndex = 0; return built.re.test(text.slice(0, LIMITS.sample)); };
    } else {
      var needle = q.toLowerCase();
      test = function (text) { return text.toLowerCase().indexOf(needle) !== -1; };
    }

    var hits = INDEX.filter(function (doc) {
      return test(doc.title) || test(doc.summary || "") || test(doc.text);
    });

    meta.removeAttribute("data-tone");
    meta.textContent = t("search.hits", { n: hits.length, total: INDEX.length });

    panels.hidden = true;
    results.hidden = false;
    results.innerHTML = "";

    if (!hits.length) {
      results.appendChild(el("div", { "class": "card" }, "<p>" + esc(t("search.none", { q: q })) + "</p>"));
      return;
    }

    var head = el("div");
    head.appendChild(el("h2", { "class": "section-title" }, esc("Results for “" + q + "”")));
    head.appendChild(el("p", { "class": "section-note" },
      esc(t("search.hits", { n: hits.length, total: INDEX.length })) + " " +
      esc(prefs.regex ? "Matching as a regular expression." : "Matching as plain text.")));
    results.appendChild(head);

    var grid = el("div", { "class": "grid grid--wide" });
    hits.forEach(function (doc) {
      var card;
      if (doc.kind === "article") {
        card = el("button", { type: "button", "class": "artcard" });
        card.addEventListener("click", function () { openArticle(doc.id); });
      } else {
        card = el("div", { "class": "artcard", style: "cursor:default" });
      }
      card.appendChild(el("span", { "class": "artcard__tag" }, esc(doc.tag)));
      card.appendChild(el("span", { "class": "artcard__title" }, esc(doc.title)));
      card.appendChild(el("span", { "class": "artcard__sum" }, inline(doc.summary || "")));
      if (doc.kind === "doc") {
        var a = el("a", {
          "class": "linkchip",
          href: F.repoUrl + "/blob/main/" + doc.id,
          rel: "noreferrer",
          style: "align-self:flex-start"
        }, esc(doc.id) + " ↗");
        card.appendChild(a);
      }
      if (doc.kind === "changelog") {
        var b = el("button", { type: "button", "class": "linkchip", style: "align-self:flex-start" }, "Open the changelog");
        b.addEventListener("click", function () { activate("changelog", true); });
        card.appendChild(b);
      }
      grid.appendChild(card);
    });
    results.appendChild(grid);
  }

  function clearSearch() {
    $("q").value = "";
    runSearch();
    toast("info", t("toast.cleared", { total: INDEX.length }));
  }

  /* --------------------------------------------------------- regex builder */
  function buildBuilder() {
    var host = $("rxConstructs");
    host.innerHTML = "";
    CONSTRUCTS.forEach(function (grp) {
      var wrap = el("div", { "class": "builder__grp" });
      wrap.appendChild(el("h4", null, esc(grp.group)));
      var row = el("div", { "class": "tokens" });
      grp.items.forEach(function (item) {
        var b = el("button", { type: "button", "class": "token", title: item[1] });
        b.innerHTML = esc(item[0]) + "<small>" + esc(item[1]) + "</small>";
        b.addEventListener("click", function () { insertToken(item[0]); });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      host.appendChild(wrap);
    });

    var flags = $("rxFlags");
    flags.innerHTML = "";
    FLAG_LIST.forEach(function (f) {
      var on = rxState.flags.indexOf(f[0]) !== -1;
      var b = el("button", {
        type: "button", "class": "flag", "aria-pressed": on ? "true" : "false",
        title: f[1] + " (" + f[0] + ")"
      }, esc(f[0]));
      b.addEventListener("click", function () {
        if (rxState.flags.indexOf(f[0]) === -1) { rxState.flags.push(f[0]); }
        else { rxState.flags = rxState.flags.filter(function (x) { return x !== f[0]; }); }
        buildBuilder();
        evaluateBuilder();
      });
      flags.appendChild(b);
    });
  }

  function insertToken(token) {
    var input = $("rxPattern");
    var text = token.replace(/…/g, "");
    var start = input.selectionStart === null ? input.value.length : input.selectionStart;
    var end = input.selectionEnd === null ? input.value.length : input.selectionEnd;
    input.value = input.value.slice(0, start) + text + input.value.slice(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + text.length;
    evaluateBuilder();
  }

  function evaluateBuilder() {
    var pattern = $("rxPattern").value;
    var sample = $("rxSample").value;
    var status = $("rxStatus");
    var hits = $("rxHits");
    hits.innerHTML = "";
    if (!pattern) {
      status.textContent = "Empty pattern — nothing is matched.";
      status.setAttribute("data-tone", "error");
      return;
    }
    var flags = rxState.flags.filter(function (f) { return f !== "y"; }).join("");
    var res = evaluate(pattern, flags, sample);
    if (!res.ok) {
      status.textContent = res.error;
      status.setAttribute("data-tone", "error");
      return;
    }
    status.setAttribute("data-tone", "ok");
    status.textContent = t("regex.matches", { n: res.matches.length }) +
      (res.truncated ? " Truncated at " + LIMITS.matches + "." : "") + " " + res.ms + " ms.";
    res.matches.slice(0, 40).forEach(function (m) {
      var line = "@" + m.index + "  " + (m.text === "" ? "(zero-width)" : m.text);
      if (m.groups.length) { line += "   groups: " + m.groups.map(function (g2) { return g2 === undefined ? "—" : g2; }).join(" | "); }
      hits.appendChild(el("li", null, esc(line)));
    });
  }

  function toggleBuilder(force) {
    var panel = $("builder");
    var btn = $("rxOpen");
    var show = force === undefined ? panel.hidden : force;
    panel.hidden = !show;
    btn.setAttribute("aria-expanded", show ? "true" : "false");
    if (show) {
      if (!$("rxSample").value) {
        $("rxSample").value = D.ARTICLES.map(function (a2) { return a2.title; }).join("\n");
      }
      if (!$("rxPattern").value && currentQuery()) { $("rxPattern").value = currentQuery(); }
      evaluateBuilder();
      $("rxPattern").focus();
    } else {
      btn.focus();
    }
  }

  /* ================================================================ panels */

  function factTable(rows) {
    var wrap = el("div", { "class": "tablewrap" });
    var table = el("table");
    var body = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr");
      tr.appendChild(el("th", { scope: "row" }, inline(row[0])));
      tr.appendChild(el("td", null, inline(row[1])));
      body.appendChild(tr);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function codeBlock(text) {
    var wrap = el("div", { "class": "codewrap" });
    var pre = el("pre");
    pre.appendChild(el("code", null, esc(text)));
    var copy = el("button", { type: "button", "class": "chip copy", "aria-label": "Copy this code block" }, "Copy");
    copy.addEventListener("click", function () { copyText(text, "the command"); });
    wrap.appendChild(pre);
    wrap.appendChild(copy);
    return wrap;
  }

  /* ------------------------------------------------------------- overview */
  function renderOverview(panel) {
    var hero = el("div", { "class": "hero" });
    hero.appendChild(el("h1", null, esc("Codex Studio")));
    hero.appendChild(el("p", { "class": "hero__lede" }, inline(t("site.tagline"))));
    hero.appendChild(el("div", { "class": "hero__status" }, inline(t("site.status"))));
    panel.appendChild(hero);

    var kpis = el("div", { "class": "kpis" });
    [
      [F.ipcTotal, "IPC commands"],
      [F.subcommands, "CLI subcommands catalogued"],
      [F.settingFields, "config.toml fields"],
      [F.featureFlags, "feature flag keys"],
      [F.tests, "tests, all passing"],
      [F.shots, "real screenshots"],
      [F.cliSize, "bundled Codex CLI"],
      [F.articles, "articles on this site"]
    ].forEach(function (row) {
      var k = el("div", { "class": "kpi" });
      k.appendChild(el("div", { "class": "kpi__n" }, esc(row[0])));
      k.appendChild(el("div", { "class": "kpi__l" }, esc(row[1])));
      kpis.appendChild(k);
    });
    panel.appendChild(kpis);

    var what = el("div", { "class": "card" });
    what.appendChild(el("h2", { "class": "section-title" }, "What it is"));
    what.innerHTML += [
      "<p>Codex Studio is a <strong>Windows-only</strong> Material 3 desktop GUI for the OpenAI Codex CLI. ",
      "It composes flags, runs the real <code>codex</code> binary and streams back exactly what the CLI said. ",
      "It never reimplements the agent, the sandbox, the config schema or the plugin system.</p>",
      "<p>Every panel either invokes the real binary and renders its output, reads or writes a real file ",
      "(<code>$CODEX_HOME/config.toml</code>, a skill directory, a rollout transcript), or is a local convenience — ",
      "cost arithmetic, the regex builder, appearance — that touches no agent behaviour at all.</p>"
    ].join("");
    panel.appendChild(what);

    var facts = el("div", { "class": "card card--flat" });
    facts.appendChild(el("h2", { "class": "section-title" }, "The facts, in one table"));
    facts.appendChild(factTable([
      ["Version", "`" + F.version + "` in `package.json` — every green build publishes its own tagged release"],
      ["Platform", "Windows only — the bundle targets NSIS and MSI, and nothing is conditionally compiled for another platform"],
      ["Shell", "Electron `" + F.electron + "`, replacing the Tauri 2 shell at commit `561da4b`"],
      ["IPC surface", F.ipcTotal + " named commands (" + F.ipcCodex + " `codex_*`, " + F.ipcWindow + " `window_*`) — an allow-list, not a generic passthrough"],
      ["Bundled CLI", "`" + F.cliSpec + "` — " + F.cliBytes + " bytes (" + F.cliSize + ") unpacked"],
      ["Binary preference", "`CODEX_BIN`, then the user's own `codex` on PATH, then the bundled copy"],
      ["Frontend", "no build step — plain browser JavaScript with a vendored React and bundled Roboto"],
      ["Network at runtime", "none"],
      ["Tests", F.testsFrontend + " frontend + " + F.testsBackend + " backend = " + F.tests + ", plus a `node --check` sweep in CI"],
      ["Licence", "Apache-2.0"]
    ]));
    panel.appendChild(facts);

    var start = el("div", { "class": "card" });
    start.appendChild(el("h2", { "class": "section-title" }, "Run it from a checkout"));
    start.appendChild(codeBlock([
      "git clone https://github.com/" + F.repo,
      "cd codex-material",
      "npm install",
      "npm start                 # electron .",
      "npm test                  # " + F.tests + " tests",
      "npm run capture           # " + F.shots + " screenshots, headless",
      "npm run dist              # NSIS + MSI into dist/"
    ].join("\n")));
    start.appendChild(el("p", { "class": "section-note" }, inline(
      "`npm run dist` runs `tools/sync-changelog.mjs` and `tools/fetch-codex.mjs` first, so the installer carries " +
      "the mirrored changelog and the staged CLI. Staging downloads " + F.cliSize + ".")));
    panel.appendChild(start);

    var jump = el("div", { "class": "card card--flat" });
    jump.appendChild(el("h2", { "class": "section-title" }, "Start reading"));
    jump.appendChild(el("p", { "class": "section-note" },
      "Each article covers behaviour, configuration, failure modes, security considerations and how to verify it, and ends by pointing at the next one."));
    var row = el("div", { "class": "linkrow" });
    ["shell", "cli", "regex", "tabs", "language", "ci"].forEach(function (id) {
      var art = articleById(id);
      var b = el("button", { type: "button", "class": "linkchip" }, esc(art.title));
      b.addEventListener("click", function () { openArticle(id); });
      row.appendChild(b);
    });
    jump.appendChild(row);
    panel.appendChild(jump);
  }

  /* ------------------------------------------------------------- features */
  var openArticleId = null;

  function articleById(id) {
    for (var i = 0; i < D.ARTICLES.length; i++) { if (D.ARTICLES[i].id === id) { return D.ARTICLES[i]; } }
    return null;
  }

  function openArticle(id) {
    openArticleId = id;
    if (prefs.tab !== "features") { activate("features", true); }
    else { renderActive(); }
    var panel = $("panel-features");
    if (panel) { panel.focus(); }
    if (window.scrollTo) { window.scrollTo({ top: 0, behavior: "auto" }); }
  }

  function renderFeatures(panel) {
    if (openArticleId) { renderArticle(panel, articleById(openArticleId)); return; }

    panel.appendChild(el("h2", { "class": "section-title" }, "Every feature, one article each"));
    panel.appendChild(el("p", { "class": "section-note" },
      "Behaviour, configuration, failure modes, security considerations and how to verify it — then a pointer to what to read next."));

    var byTag = {};
    D.ARTICLES.forEach(function (art) {
      if (!byTag[art.tag]) { byTag[art.tag] = []; }
      byTag[art.tag].push(art);
    });
    ["Architecture", "Product", "Feature", "Experience", "Build"].forEach(function (tag) {
      if (!byTag[tag]) { return; }
      var block = el("div");
      block.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, esc(tag)));
      var grid = el("div", { "class": "grid grid--wide" });
      byTag[tag].forEach(function (art) {
        var card = el("button", { type: "button", "class": "artcard" });
        card.appendChild(el("span", { "class": "artcard__tag" }, esc(art.tag)));
        card.appendChild(el("span", { "class": "artcard__title" }, esc(art.title)));
        card.appendChild(el("span", { "class": "artcard__sum" }, inline(art.summary)));
        card.addEventListener("click", function () { openArticle(art.id); });
        grid.appendChild(card);
      });
      block.appendChild(grid);
      panel.appendChild(block);
    });
  }

  function renderArticle(panel, art) {
    if (!art) { openArticleId = null; renderFeatures(panel); return; }

    var back = el("button", { type: "button", "class": "chip" }, "← " + esc(t("article.back")));
    back.addEventListener("click", function () { openArticleId = null; renderActive(); });
    panel.appendChild(back);

    var article = el("article", { "class": "article" });
    var head = el("div", { "class": "article__head" });
    head.appendChild(el("span", { "class": "artcard__tag" }, esc(art.tag)));
    head.appendChild(el("h2", null, esc(art.title)));
    head.appendChild(el("p", { "class": "article__lead" }, inline(voiced(art.lead))));
    head.appendChild(el("p", { "class": "section-note", style: "margin:0" }, inline(art.summary)));
    article.appendChild(head);

    art.sections.forEach(function (sec) {
      var s = el("section");
      s.appendChild(el("h3", null, esc(sec.h)));
      sec.blocks.forEach(function (b) {
        if (b.t === "p") { s.appendChild(el("p", null, inline(b.v))); }
        else if (b.t === "ul") {
          var list = el("ul");
          b.v.forEach(function (item) { list.appendChild(el("li", null, inline(item))); });
          s.appendChild(list);
        } else if (b.t === "code") { s.appendChild(codeBlock(b.v)); }
        else if (b.t === "kv") { s.appendChild(factTable(b.v)); }
      });
      article.appendChild(s);
    });

    /* Suggested articles: related, prerequisites, and the natural next step. A reader
       is never dropped at a dead end. */
    var sug = el("div", { "class": "suggest" });
    sug.appendChild(el("h3", null, esc(t("article.suggested"))));
    function group(label, ids, cls) {
      if (!ids || !ids.length) { return; }
      var g2 = el("div", { "class": "suggest__grp" });
      g2.appendChild(el("div", { "class": "suggest__lab" }, esc(label)));
      var row = el("div", { "class": "linkrow" });
      ids.forEach(function (id) {
        var target = articleById(id);
        if (!target) { return; }
        var b = el("button", { type: "button", "class": "linkchip" + (cls ? " " + cls : "") }, esc(target.title));
        b.addEventListener("click", function () { openArticle(id); });
        row.appendChild(b);
      });
      g2.appendChild(row);
      sug.appendChild(g2);
    }
    group("Read first", art.suggested.prereq);
    group("Related", art.suggested.related);
    group("Next", art.suggested.next ? [art.suggested.next] : [], "linkchip--next");
    article.appendChild(sug);

    panel.appendChild(article);
  }

  /** Pick a lead paragraph in the active language(s) at the active level(s). */
  function voiced(lead) {
    var en = lead.en[levelIndex("en")];
    var yue = lead.yue[levelIndex("yue")];
    if (prefs.lang === "yue") { return yue; }
    if (prefs.lang === "bi") { return en + "\n\n" + yue; }
    return en;
  }

  /* ------------------------------------------------------------------ docs */
  function renderDocs(panel) {
    panel.appendChild(el("h2", { "class": "section-title" }, "The repository's own documentation"));
    panel.appendChild(el("p", { "class": "section-note" }, inline(
      "Every feature has a Markdown page under `docs/`, and every category has a `README.md` index. " +
      "The links below open the file on GitHub; the paths are repository-relative, so they also work in a checkout.")));

    var note = el("div", { "class": "card card--flat" });
    note.innerHTML = [
      "<h3 class=\"section-title\" style=\"font-size:1.05rem\">One caveat, stated rather than hidden</h3>",
      "<p>The repository documentation under <code>docs/</code> was rewritten for the Electron shell after commit ",
      "<code>561da4b</code>. Any remaining mention of <code>src-tauri/</code> or Tauri is framed as history, not as the ",
      "current tree. Where a page and the code disagree, <strong>the code is right</strong> — say so in an issue and the page ",
      "gets fixed.</p>",
      "<p><a href=\"#features\" data-open-article=\"shell\">The Electron shell article</a> on this site describes the current tree.</p>"
    ].join("");
    var link = note.querySelector("[data-open-article]");
    if (link) {
      link.addEventListener("click", function (e) { e.preventDefault(); openArticle("shell"); });
    }
    panel.appendChild(note);

    D.DOCS.forEach(function (cat) {
      var block = el("div", { "class": "card" });
      block.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, esc(cat.cat)));
      var wrap = el("div", { "class": "tablewrap" });
      var table = el("table");
      var thead = el("thead");
      var hr = el("tr");
      hr.appendChild(el("th", { scope: "col" }, "Page"));
      hr.appendChild(el("th", { scope: "col" }, "What it covers"));
      thead.appendChild(hr);
      table.appendChild(thead);
      var tbody = el("tbody");
      cat.pages.forEach(function (page) {
        var tr = el("tr");
        var th = el("th", { scope: "row" });
        th.appendChild(el("a", { href: F.repoUrl + "/blob/main/" + page.path, rel: "noreferrer" }, esc(page.title)));
        th.appendChild(el("div", { "class": "shot__file" }, esc(page.path)));
        tr.appendChild(th);
        tr.appendChild(el("td", null, inline(page.note)));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      block.appendChild(wrap);
      panel.appendChild(block);
    });

    var api = el("div", { "class": "card card--flat" });
    api.innerHTML = [
      "<h3 class=\"section-title\" style=\"font-size:1.05rem\">There is no HTTP API, and no Postman collection</h3>",
      "<p>Nothing in this repository binds a port, accepts a request or opens a socket. A Postman collection for a ",
      "desktop app with no network surface would be a fabricated artifact, so none is maintained. The only programmatic ",
      "boundary is the IPC surface between the renderer and the Electron main process, and that is documented on this ",
      "site and in <code>docs/api/README.md</code>.</p>"
    ].join("");
    panel.appendChild(api);
  }

  /* ----------------------------------------------------------- screenshots */
  function renderShots(panel) {
    panel.appendChild(el("h2", { "class": "section-title" }, "Screenshots"));
    panel.appendChild(el("p", { "class": "section-note" }, inline(
      t("shots.caption") + " The harness loads the real main process, the real preload and the real frontend, then " +
      "captures each surface through Electron's own `capturePage` with the window positioned off-screen. Captions are " +
      "the manifest's own; alt text is written for this page.")));

    var grid = el("div", { "class": "grid grid--wide" });
    D.SHOTS.forEach(function (shot) {
      var fig = el("figure", { "class": "shot" });
      var img = el("img", {
        src: "assets/screenshots/" + shot.file,
        alt: shot.alt,
        loading: "lazy",
        width: "1600", height: "1000"
      });
      fig.appendChild(img);
      var cap = el("figcaption");
      cap.appendChild(el("b", null, esc(shot.note)));
      cap.appendChild(el("span", null, esc(shot.alt)));
      cap.appendChild(el("div", { "class": "shot__file" }, esc("assets/screenshots/" + shot.file)));
      fig.appendChild(cap);
      grid.appendChild(fig);
    });
    panel.appendChild(grid);

    var honesty = el("div", { "class": "card card--flat" });
    honesty.innerHTML = [
      "<h3 class=\"section-title\" style=\"font-size:1.05rem\">What the manifest also records</h3>",
      "<p>The capture run wrote five console messages into <code>assets/screenshots/manifest.json</code>: four ",
      "template-binding warnings from number inputs on the Cost panel, and Electron's development-mode ",
      "Content-Security-Policy warning, which does not appear once the app is packaged. They are recorded here rather ",
      "than trimmed, because a manifest is evidence and evidence includes the untidy parts.</p>"
    ].join("");
    panel.appendChild(honesty);
  }

  /* ------------------------------------------------------------ changelog */
  function renderChangelog(panel) {
    panel.appendChild(el("h2", { "class": "section-title" }, "Changelog"));
    panel.appendChild(el("p", { "class": "section-note" }, inline(
      "Transcribed from `CHANGELOG.md` at the repository root, which follows Keep a Changelog and Semantic Versioning. " +
      "Codex Studio has no earlier releases — its history starts at " + F.version + ". The in-app viewer parses the same " +
      "file with a date filter and a search wired to the regex builder; this page is the flat reading of it.")));

    D.CHANGELOG.forEach(function (rel) {
      var card = el("div", { "class": "card" });
      var head = el("div", { style: "display:flex;align-items:baseline;gap:12px;flex-wrap:wrap" });
      head.appendChild(el("h3", { style: "font-size:1.3rem" }, esc(rel.version)));
      head.appendChild(el("span", { "class": "chip chip--mono" }, esc(rel.date)));
      card.appendChild(head);
      card.appendChild(el("div", { "class": "hero__status", style: "margin-top:12px" }, inline(rel.status)));
      card.appendChild(el("p", { "class": "section-note", style: "margin-top:12px" }, inline(rel.note)));
      rel.sections.forEach(function (sec) {
        var s = el("section", { style: "margin-top:18px" });
        s.appendChild(el("h4", { style: "font-size:.78rem;letter-spacing:.11em;text-transform:uppercase;color:var(--m3-primary)" }, esc(sec.kind)));
        var list = el("ul", { style: "padding-left:1.25em" });
        sec.items.forEach(function (item) { list.appendChild(el("li", null, inline(item))); });
        s.appendChild(list);
        card.appendChild(s);
      });
      var row = el("div", { "class": "linkrow", style: "margin-top:18px" });
      row.appendChild(el("a", { "class": "linkchip", href: F.repoUrl + "/blob/main/CHANGELOG.md", rel: "noreferrer" }, "CHANGELOG.md on GitHub ↗"));
      var copy = el("button", { type: "button", "class": "linkchip" }, "Copy this version as text");
      copy.addEventListener("click", function () {
        var lines = ["## [" + rel.version + "] - " + rel.date, "", rel.status, "", rel.note, ""];
        rel.sections.forEach(function (sec) {
          lines.push("### " + sec.kind, "");
          sec.items.forEach(function (item) { lines.push("- " + item); });
          lines.push("");
        });
        copyText(lines.join("\n"), "version " + rel.version);
      });
      row.appendChild(copy);
      card.appendChild(row);
      panel.appendChild(card);
    });
  }

  /* ------------------------------------------------------------- settings */
  function renderSettings(panel) {
    panel.appendChild(el("h2", { "class": "section-title" }, "Settings"));
    panel.appendChild(el("p", { "class": "section-note" },
      "Everything here is stored in this browser's localStorage under the `cxs.` prefix and persists across reloads. " +
      "Nothing is sent anywhere; there is nowhere to send it to."));

    /* ---- appearance ---- */
    var look = el("div", { "class": "card" });
    look.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Appearance"));

    look.appendChild(setRow("Theme", "System follows your operating system. Light and dark override it in both directions.",
      segmented(["system", "light", "dark"], prefs.theme, function (v) {
        savePref("theme", v); applyAppearance(); renderActive();
        toast("success", t("toast.saved", { what: "the theme" }));
      })));

    look.appendChild(setRow("Density", "Scales spacing, control height and corner radius together.",
      segmented(["compact", "cosy", "roomy"], prefs.density, function (v) {
        savePref("density", v); applyAppearance();
        toast("success", t("toast.saved", { what: "the density" }));
      })));

    var fontSelect = el("select", { "aria-label": "Interface font" });
    Object.keys(FONTS).forEach(function (key) {
      var opt = el("option", { value: key }, esc(FONTS[key].label));
      if (prefs.font === key) { opt.setAttribute("selected", "selected"); }
      fontSelect.appendChild(opt);
    });
    fontSelect.addEventListener("change", function () {
      savePref("font", fontSelect.value); applyAppearance();
      toast("success", t("toast.saved", { what: "the font" }));
    });
    look.appendChild(setRow("Font", "Roboto is the repository's own bundled woff2, the same faces the app ships. No font is fetched.", fontSelect));

    var size = el("input", { type: "range", min: "80", max: "150", step: "5", value: String(prefs.fontScale), "aria-label": "Font size percentage" });
    var sizeOut = el("span", { "class": "chip chip--mono" }, prefs.fontScale + "%");
    size.addEventListener("input", function () {
      prefs.fontScale = Number(size.value);
      sizeOut.textContent = prefs.fontScale + "%";
      applyAppearance();
    });
    size.addEventListener("change", function () {
      savePref("fontScale", Number(size.value));
      toast("success", t("toast.saved", { what: "the font size" }));
    });
    var sizeCtl = el("span", { style: "display:flex;align-items:center;gap:8px" });
    sizeCtl.appendChild(size);
    sizeCtl.appendChild(sizeOut);
    look.appendChild(setRow("Font size", "Scales the base type size from 80% to 150%.", sizeCtl));
    panel.appendChild(look);

    /* ---- accent colour ---- */
    panel.appendChild(renderPicker());

    /* ---- language ---- */
    var lang = el("div", { "class": "card" });
    lang.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Language and voice"));
    lang.appendChild(el("p", { "class": "section-note" }, inline(
      "The funny level styles **every** category of copy on this site, including errors and warnings. What it never " +
      "changes is what a message says happened: every number, version, path and command is interpolated **after** the " +
      "voice is chosen, so no variant of a string can name a different fact from any other.")));

    lang.appendChild(setRow("Language mode", "English, playful Hong Kong Cantonese, or both.",
      segmented([["en", "English"], ["yue", "廣東話"], ["bi", "Bilingual"]], prefs.lang, function (v) {
        savePref("lang", v);
        buildStrip(); renderActive();
        document.querySelector(".brand__name").textContent = t("site.title");
        $("q").setAttribute("placeholder", t("search.placeholder", { articles: D.ARTICLES.length }));
        $("langBtn").textContent = (v === "en" ? "EN" : v === "yue" ? "廣東話" : "EN + 廣東話") + " ▾";
        toast("success", t("toast.saved", { what: "the language mode" }));
      })));

    lang.appendChild(slider("English funny level", "1 is fully professional. 5 is maximum playfulness.", prefs.funnyEn, function (v) {
      prefs.funnyEn = v; store.set("funnyEn", v); refreshVoice();
    }));
    lang.appendChild(slider("廣東話 funny level", "Independent of the English slider, on purpose.", prefs.funnyYue, function (v) {
      prefs.funnyYue = v; store.set("funnyYue", v); refreshVoice();
    }));

    var demo = el("div", { style: "margin-top:14px" });
    demo.appendChild(el("div", { "class": "setrow__d", style: "margin-bottom:8px" },
      "The same string at all five levels. The highlighted parts are interpolated facts — compare level 1 with level 5."));
    demo.appendChild(voiceBox());
    lang.appendChild(demo);
    panel.appendChild(lang);

    /* ---- dim sum ---- */
    var dim = el("div", { "class": "card" });
    dim.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Dim sum surprise"));
    dim.appendChild(setRow("Show the dim sum surprise",
      "One fresh draw per page load, at most " + F.dimsumRate + ", from the " + F.dishes +
      " bundled photographs in app/dimsum/. Never on a first visit, never twice in one load, and never fetched from anywhere.",
      switchCtl(prefs.dimsum !== false, function (on) {
        savePref("dimsum", on);
        toast("info", t("toast.dimsum", { state: on ? "on" : "off" }));
      })));
    var preview = el("button", { type: "button", "class": "linkchip" }, "Show one now");
    preview.addEventListener("click", function () { showDish(drawDish(1)); });
    dim.appendChild(setRow("Preview", "Draws at rate 1 so the surface can be checked without waiting.", preview));
    panel.appendChild(dim);

    /* ---- search defaults + reset ---- */
    var misc = el("div", { "class": "card" });
    misc.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Search and reset"));
    misc.appendChild(setRow("Treat the query as a regular expression",
      "Plain text is the default. The bounds are " + LIMITS.pattern + " characters of pattern, " +
      LIMITS.sample + " of sample, " + LIMITS.matches + " matches and " + LIMITS.ms +
      " ms — and a nested unbounded quantifier is refused before it runs.",
      switchCtl(prefs.regex, function (on) {
        savePref("regex", on);
        $("rxToggle").setAttribute("aria-pressed", on ? "true" : "false");
        runSearch();
      })));
    var reset = el("button", { type: "button", "class": "linkchip" }, "Reset every preference");
    reset.addEventListener("click", function () {
      Object.keys(DEFAULTS).forEach(function (k) { store.remove(k); prefs[k] = DEFAULTS[k]; });
      prefs.pinned = DEFAULTS.pinned.slice();
      applyAppearance();
      buildStrip();
      $("q").value = "";
      $("rxToggle").setAttribute("aria-pressed", "false");
      runSearch();
      renderActive();
      toast("success", t("toast.reset"));
    });
    misc.appendChild(setRow("Reset", "Clears theme, accent, font, density, language, funny levels, pins, the active tab and the dim sum switch.", reset));
    panel.appendChild(misc);
  }

  function setRow(title, desc, control) {
    var row = el("div", { "class": "setrow" });
    var text = el("div", { "class": "setrow__text" });
    text.appendChild(el("div", { "class": "setrow__t" }, esc(title)));
    text.appendChild(el("div", { "class": "setrow__d" }, inline(desc)));
    row.appendChild(text);
    var ctl = el("div", { "class": "setrow__ctl" });
    ctl.appendChild(control);
    row.appendChild(ctl);
    // A control without a visible label of its own borrows the row's title.
    if (control.tagName === "SELECT" || control.tagName === "BUTTON") {
      if (!control.getAttribute("aria-label")) { control.setAttribute("aria-label", title); }
    }
    return row;
  }

  function segmented(options, current, onPick) {
    var wrap = el("div", { "class": "seg", role: "group" });
    options.forEach(function (opt) {
      var value = Array.isArray(opt) ? opt[0] : opt;
      var label = Array.isArray(opt) ? opt[1] : opt;
      var b = el("button", { type: "button", "aria-pressed": current === value ? "true" : "false" }, esc(label));
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(wrap.children, function (c) { c.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        onPick(value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function switchCtl(on, onChange) {
    var b = el("button", { type: "button", "class": "switch", role: "switch", "aria-checked": on ? "true" : "false" });
    b.addEventListener("click", function () {
      var next = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", next ? "true" : "false");
      onChange(next);
    });
    return b;
  }

  function slider(title, desc, value, onChange) {
    var out = el("span", { "class": "chip chip--mono" }, String(value));
    var input = el("input", { type: "range", min: "1", max: "5", step: "1", value: String(value), "aria-label": title });
    input.addEventListener("input", function () {
      out.textContent = input.value;
      onChange(Number(input.value));
    });
    var ctl = el("span", { style: "display:flex;align-items:center;gap:8px" });
    ctl.appendChild(input);
    ctl.appendChild(out);
    return setRow(title, desc, ctl);
  }

  function voiceBox() {
    var box = el("div", { "class": "voicebox", id: "voicebox" });
    fillVoiceBox(box);
    return box;
  }
  function fillVoiceBox(box) {
    box.innerHTML = "";
    var langs = langsInPlay();
    var saveEn = prefs.funnyEn, saveYue = prefs.funnyYue;
    langs.forEach(function (lang) {
      for (var lv = 1; lv <= 5; lv++) {
        if (lang === "yue") { prefs.funnyYue = lv; } else { prefs.funnyEn = lv; }
        var row = el("div", { "class": "voicebox__row" });
        row.appendChild(el("span", { "class": "voicebox__lv" }, (lang === "yue" ? "粵 " : "EN ") + lv));
        row.appendChild(el("span", null, tMarked("voice.demo", { level: lv }, lang)));
        box.appendChild(row);
      }
      prefs.funnyEn = saveEn; prefs.funnyYue = saveYue;
    });
    prefs.funnyEn = saveEn; prefs.funnyYue = saveYue;
  }
  function refreshVoice() {
    var box = $("voicebox");
    if (box) { fillVoiceBox(box); }
    buildStrip();
    document.querySelector(".brand__name").textContent = t("site.title");
    $("q").setAttribute("placeholder", t("search.placeholder", { articles: D.ARTICLES.length }));
  }

  /* ------------------------------------------- continuous colour picker */
  function renderPicker() {
    var card = el("div", { "class": "card" });
    card.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Accent colour"));
    card.appendChild(el("p", { "class": "section-note" }, inline(
      "A continuous field, not a fixed swatch list: drag anywhere in the square for saturation and value, use the hue " +
      "slider for the rest of the spectrum, or type an exact value. The translator below shows the same colour in five " +
      "notations with a WCAG contrast ratio against the page surface.")));

    var start = prefs.accent || getComputedStyle(document.documentElement).getPropertyValue("--m3-primary").trim() || "#6750A4";
    var rgb = colour.hexToRgb(start) || { r: 103, g: 80, b: 164 };
    var hsv = colour.rgbToHsv(rgb);

    var grid = el("div", { "class": "picker" });

    var left = el("div");
    var sv = el("div", { "class": "sv", tabindex: "0", role: "application",
      "aria-label": "Saturation and value field. Use the arrow keys to adjust, Shift for larger steps." });
    var dot = el("div", { "class": "sv__dot" });
    sv.appendChild(dot);
    left.appendChild(sv);

    var hue = el("input", { type: "range", "class": "hue", min: "0", max: "359", step: "1",
      value: String(Math.round(hsv.h)), "aria-label": "Hue in degrees" });
    left.appendChild(hue);

    var entry = el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" });
    var hexIn = el("input", { type: "text", "class": "plain", size: "9", "aria-label": "Hex value", value: colour.rgbToHex(rgb).toUpperCase() });
    var rgbIn = el("input", { type: "text", "class": "plain", size: "16", "aria-label": "RGB value" });
    var hslIn = el("input", { type: "text", "class": "plain", size: "18", "aria-label": "HSL value" });
    entry.appendChild(hexIn);
    entry.appendChild(rgbIn);
    entry.appendChild(hslIn);
    left.appendChild(entry);
    grid.appendChild(left);

    var right = el("div");
    var swatch = el("div", { "class": "swatchbig" });
    right.appendChild(swatch);
    var dl = el("dl", { "class": "trans" });
    right.appendChild(dl);
    var contrast = el("p", { "class": "contrast", role: "status", "aria-live": "polite" });
    right.appendChild(contrast);
    var actions = el("div", { "class": "linkrow", style: "margin-top:10px" });
    var apply = el("button", { type: "button", "class": "linkchip linkchip--next" }, "Apply as accent");
    var clear = el("button", { type: "button", "class": "linkchip" }, "Use the Material 3 default");
    var copyBtn = el("button", { type: "button", "class": "linkchip" }, "Copy every notation");
    actions.appendChild(apply);
    actions.appendChild(clear);
    actions.appendChild(copyBtn);
    right.appendChild(actions);
    grid.appendChild(right);
    card.appendChild(grid);

    function currentHex() { return colour.rgbToHex(colour.hsvToRgb(hsv)); }

    function paint(syncFields) {
      var pure = colour.hsvToRgb({ h: hsv.h, s: 100, v: 100 });
      sv.style.backgroundColor = colour.rgbToHex(pure);
      dot.style.left = hsv.s + "%";
      dot.style.top = (100 - hsv.v) + "%";
      var hex = currentHex().toUpperCase();
      swatch.style.background = hex;
      var c = colour.hexToRgb(hex);
      swatch.style.color = colour.contrast(c, { r: 0, g: 0, b: 0 }) >= colour.contrast(c, { r: 255, g: 255, b: 255 }) ? "#000" : "#fff";
      swatch.textContent = hex;

      dl.innerHTML = "";
      colour.translate(hex).forEach(function (row) {
        dl.appendChild(el("dt", null, esc(row[0])));
        dl.appendChild(el("dd", null, esc(row[1])));
      });

      var surfaceHex = readSurfaceHex();
      var ratio = colour.contrast(c, colour.hexToRgb(surfaceHex) || { r: 255, g: 255, b: 255 });
      var pass = ratio >= 4.5;
      contrast.innerHTML = "Contrast against the page surface (" + esc(surfaceHex) + "): <strong>" +
        ratio.toFixed(2) + ":1</strong> <span class=\"badge " + (pass ? "badge--pass" : "badge--fail") + "\">" +
        (ratio >= 7 ? "AAA text" : pass ? "AA text" : ratio >= 3 ? "AA large text only" : "below AA") + "</span>";

      if (syncFields !== false) {
        hexIn.value = hex;
        var r2 = colour.hexToRgb(hex);
        rgbIn.value = "rgb(" + r2.r + " " + r2.g + " " + r2.b + ")";
        var h2 = colour.rgbToHsl(r2);
        hslIn.value = "hsl(" + h2.h.toFixed(1) + " " + h2.s.toFixed(1) + "% " + h2.l.toFixed(1) + "%)";
        hue.value = String(Math.round(hsv.h));
      }
    }

    function pick(e) {
      var box = sv.getBoundingClientRect();
      var x = ((e.touches ? e.touches[0].clientX : e.clientX) - box.left) / box.width;
      var y = ((e.touches ? e.touches[0].clientY : e.clientY) - box.top) / box.height;
      hsv.s = clamp(x * 100, 0, 100);
      hsv.v = clamp(100 - y * 100, 0, 100);
      paint();
    }
    var dragging = false;
    sv.addEventListener("pointerdown", function (e) { dragging = true; sv.setPointerCapture(e.pointerId); pick(e); });
    sv.addEventListener("pointermove", function (e) { if (dragging) { pick(e); } });
    sv.addEventListener("pointerup", function () { dragging = false; });
    sv.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowRight") { hsv.s = clamp(hsv.s + step, 0, 100); }
      else if (e.key === "ArrowLeft") { hsv.s = clamp(hsv.s - step, 0, 100); }
      else if (e.key === "ArrowUp") { hsv.v = clamp(hsv.v + step, 0, 100); }
      else if (e.key === "ArrowDown") { hsv.v = clamp(hsv.v - step, 0, 100); }
      else { return; }
      e.preventDefault();
      paint();
    });
    hue.addEventListener("input", function () { hsv.h = Number(hue.value); paint(); });

    hexIn.addEventListener("change", function () {
      var parsed = colour.hexToRgb(hexIn.value);
      if (!parsed) { toast("error", "That is not a hex colour", "Expected three or six hex digits, for example #6750A4."); paint(); return; }
      hsv = colour.rgbToHsv(parsed);
      paint();
    });
    rgbIn.addEventListener("change", function () {
      var m = rgbIn.value.match(/(\d{1,3})\D+(\d{1,3})\D+(\d{1,3})/);
      if (!m) { toast("error", "That is not an RGB value", "Expected three numbers from 0 to 255, for example rgb(103 80 164)."); paint(); return; }
      hsv = colour.rgbToHsv({ r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255) });
      paint();
    });
    hslIn.addEventListener("change", function () {
      var m = hslIn.value.match(/(-?[\d.]+)\D+([\d.]+)%\D+([\d.]+)%/);
      if (!m) { toast("error", "That is not an HSL value", "Expected hue in degrees then two percentages, for example hsl(258 30% 48%)."); paint(); return; }
      hsv = colour.rgbToHsv(colour.hslToRgb({ h: ((+m[1]) % 360 + 360) % 360, s: clamp(+m[2], 0, 100), l: clamp(+m[3], 0, 100) }));
      paint();
    });

    apply.addEventListener("click", function () {
      savePref("accent", currentHex());
      applyAppearance();
      paint();
      toast("success", t("toast.saved", { what: "the accent colour " + currentHex().toUpperCase() }));
    });
    clear.addEventListener("click", function () {
      savePref("accent", "");
      applyAppearance();
      toast("success", t("toast.saved", { what: "the Material 3 default accent" }));
    });
    copyBtn.addEventListener("click", function () {
      var text = colour.translate(currentHex()).map(function (r) { return r[0] + ": " + r[1]; }).join("\n");
      copyText(text, "every notation");
    });

    paint();
    return card;
  }

  function readSurfaceHex() {
    var v = getComputedStyle(document.body).backgroundColor;
    var m = v && v.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (!m) { return effectiveTheme() === "dark" ? "#141218" : "#FEF7FF"; }
    return colour.rgbToHex({ r: +m[1], g: +m[2], b: +m[3] }).toUpperCase();
  }

  /* ================================================================ dim sum
     One draw per page load, never on a first visit, never more frequent than the
     rate it is given, and never fetched from anywhere. */
  var drawn = false;
  function drawDish(rate) {
    if (drawn && rate !== 1) { return null; }
    if (rate !== 1) { drawn = true; }
    if (rate !== 1 && prefs.dimsum === false) { return null; }
    if (rate !== 1 && !store.get("visited", false)) { store.set("visited", true); return null; }
    if (!D.DISHES.length) { return null; }
    if (Math.random() >= rate) { return null; }
    return D.DISHES[Math.floor(Math.random() * D.DISHES.length) % D.DISHES.length];
  }

  var dimTimer = null;
  function showDish(dish) {
    if (!dish) { return; }
    var host = $("dimsumHost");
    host.innerHTML = "";
    window.clearTimeout(dimTimer);

    var yue = prefs.lang === "yue";
    var card = el("div", { "class": "dimsum", role: "status", "aria-live": "polite" });
    card.appendChild(el("img", {
      src: "assets/dimsum/" + dish.slug + ".png",
      alt: yue ? dish.altYue : dish.altEn,
      width: "60", height: "60", loading: "lazy"
    }));
    var body = el("div", { style: "flex:1;min-width:0" });
    body.appendChild(el("div", { "class": "dimsum__name" }, esc(dish.en + " · " + dish.yue)));
    body.appendChild(el("div", { "class": "dimsum__note" },
      esc(t("dimsum.hello", { dish: yue ? dish.yue : dish.en, rate: F.dimsumRate }))));
    card.appendChild(body);
    var close = el("button", { type: "button", "class": "icon-btn", "aria-label": "Dismiss the dim sum card" }, "✕");
    close.addEventListener("click", function () { window.clearTimeout(dimTimer); host.innerHTML = ""; });
    card.appendChild(close);
    host.appendChild(card);
    dimTimer = window.setTimeout(function () { host.innerHTML = ""; }, 9000);
  }

  /* ================================================================== boot */
  function boot() {
    applyAppearance();

    $("verChip").textContent = "v" + F.version;
    document.querySelector(".brand__name").textContent = t("site.title");
    $("q").setAttribute("placeholder", t("search.placeholder", { articles: D.ARTICLES.length }));
    $("langBtn").textContent = (prefs.lang === "en" ? "EN" : prefs.lang === "yue" ? "廣東話" : "EN + 廣東話") + " ▾";
    $("rxToggle").setAttribute("aria-pressed", prefs.regex ? "true" : "false");
    $("repoLink").setAttribute("href", F.repoUrl);

    buildBuilder();
    buildStrip();

    var hashTab = location.hash.slice(1);
    activate(tabById(hashTab) ? hashTab : prefs.tab, false);

    /* ---- top bar ---- */
    $("themeBtn").addEventListener("click", function () {
      var order = ["system", "light", "dark"];
      savePref("theme", order[(order.indexOf(prefs.theme) + 1) % order.length]);
      applyAppearance();
      if (prefs.tab === "settings") { renderActive(); }
    });
    $("langBtn").addEventListener("click", function (e) {
      e.stopPropagation();
      popupMenu($("langBtn"), [
        { label: "English", run: function () { setLang("en"); } },
        { label: "廣東話", run: function () { setLang("yue"); } },
        { label: "Bilingual · 雙語", run: function () { setLang("bi"); } }
      ], $("langBtn"));
    });

    /* ---- search ---- */
    var typing = null;
    $("q").addEventListener("input", function () {
      window.clearTimeout(typing);
      typing = window.setTimeout(runSearch, 120);
    });
    $("q").addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("q").value) { e.preventDefault(); clearSearch(); }
    });
    $("qClear").addEventListener("click", clearSearch);
    $("rxToggle").addEventListener("click", function () {
      savePref("regex", !prefs.regex);
      $("rxToggle").setAttribute("aria-pressed", prefs.regex ? "true" : "false");
      runSearch();
    });
    $("rxOpen").addEventListener("click", function () { toggleBuilder(); });
    $("rxClose").addEventListener("click", function () { toggleBuilder(false); });
    $("rxPattern").addEventListener("input", evaluateBuilder);
    $("rxSample").addEventListener("input", evaluateBuilder);
    $("rxApply").addEventListener("click", function () {
      var pattern = $("rxPattern").value;
      if (!pattern) { toast("warning", "There is no pattern to apply", "Type one, or pick constructs from the panel above."); return; }
      savePref("regex", true);
      $("rxToggle").setAttribute("aria-pressed", "true");
      $("q").value = pattern;
      runSearch();
      toggleBuilder(false);
    });
    $("rxCopy").addEventListener("click", function () {
      var pattern = $("rxPattern").value;
      if (!pattern) { toast("warning", "There is no pattern to copy"); return; }
      copyText("/" + pattern + "/" + rxState.flags.join(""), "the pattern");
    });
    $("rxReset").addEventListener("click", function () {
      $("rxPattern").value = "";
      rxState.flags = ["i"];
      buildBuilder();
      evaluateBuilder();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (openMenu) { closeMenu(); return; }
        if (!$("builder").hidden) { toggleBuilder(false); }
      }
      if ((e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) &&
          document.activeElement !== $("q") &&
          ["INPUT", "TEXTAREA"].indexOf((document.activeElement || {}).tagName) === -1) {
        e.preventDefault();
        $("q").focus();
      }
    });

    window.addEventListener("hashchange", function () {
      var id = location.hash.slice(1);
      if (tabById(id) && id !== prefs.tab) { openArticleId = null; activate(id, true); }
    });
    window.addEventListener("resize", layoutStrip);
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onScheme = function () { if (prefs.theme === "system") { applyAppearance(); } };
      if (mq.addEventListener) { mq.addEventListener("change", onScheme); }
      else if (mq.addListener) { mq.addListener(onScheme); }
    }

    runSearch();
    showDish(drawDish(0.01));
  }

  function setLang(v) {
    savePref("lang", v);
    $("langBtn").textContent = (v === "en" ? "EN" : v === "yue" ? "廣東話" : "EN + 廣東話") + " ▾";
    refreshVoice();
    renderActive();
    runSearch();
    toast("success", t("toast.saved", { what: "the language mode" }));
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", boot); }
  else { boot(); }
})();
