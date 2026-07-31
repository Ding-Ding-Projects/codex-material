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
  /* Every preference write is versioned here, at the one funnel they all pass
     through — recording at each call site instead would mean a future one can forget,
     which is exactly how the app's own snapshot came to be missing half of what it
     owned. `history` itself is excluded, or writing the log would log the write. */
  function savePref(key, value) {
    if (key !== "history" && typeof record === "function") { record(key, prefs[key], value); }
    prefs[key] = value;
    store.set(key, value);
  }

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
    /* The lab/lch half of the translator. Kept beside oklab so the two families sit
       together and nobody has to guess which white point each assumes: both use D65,
       the same one sRGB is defined against. */
    lab: function (c) {
      var r = this.lin(c.r), g = this.lin(c.g), b = this.lin(c.b);
      var x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
      var y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
      var z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
      function f(v) { return v > 0.008856 ? Math.pow(v, 1 / 3) : 7.787 * v + 16 / 116; }
      var fx = f(x), fy = f(y), fz = f(z);
      return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
    },
    lch: function (c) {
      var l = this.lab(c);
      var h = Math.atan2(l.b, l.a) * 180 / Math.PI;
      return { l: l.l, c: Math.sqrt(l.a * l.a + l.b * l.b), h: h < 0 ? h + 360 : h };
    },
    oklab: function (c) {
      var r = this.lin(c.r), g = this.lin(c.g), b = this.lin(c.b);
      var L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      var M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      var S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      return {
        l: 0.2104542553 * L + 0.7936177850 * M - 0.0040720468 * S,
        a: 1.9779984951 * L - 2.4285922050 * M + 0.4505937099 * S,
        b: 0.0259040371 * L + 0.7827717662 * M - 0.8086757660 * S
      };
    },
    hwb: function (c) {
      var hsv = this.rgbToHsv(c);
      return { h: hsv.h, w: Math.min(c.r, c.g, c.b) / 255 * 100, b: 100 - Math.max(c.r, c.g, c.b) / 255 * 100 };
    },
    cmyk: function (c) {
      var r = c.r / 255, g = c.g / 255, b = c.b / 255;
      var k = 1 - Math.max(r, g, b);
      if (k >= 1) { return { c: 0, m: 0, y: 0, k: 100 }; }
      return {
        c: (1 - r - k) / (1 - k) * 100,
        m: (1 - g - k) / (1 - k) * 100,
        y: (1 - b - k) / (1 - k) * 100,
        k: k * 100
      };
    },

    /** The named CSS colours this reads back. Not the full 148 — the ones somebody
     *  actually types — and every one of them round-trips through parse(). */
    NAMED: {
      black: "#000000", white: "#ffffff", red: "#ff0000", lime: "#00ff00", blue: "#0000ff",
      yellow: "#ffff00", cyan: "#00ffff", magenta: "#ff00ff", silver: "#c0c0c0", gray: "#808080",
      grey: "#808080", maroon: "#800000", olive: "#808000", green: "#008000", purple: "#800080",
      teal: "#008080", navy: "#000080", orange: "#ffa500", pink: "#ffc0cb", brown: "#a52a2a",
      gold: "#ffd700", indigo: "#4b0082", violet: "#ee82ee", coral: "#ff7f50", salmon: "#fa8072",
      crimson: "#dc143c", tomato: "#ff6347", turquoise: "#40e0d0", plum: "#dda0dd", khaki: "#f0e68c"
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
    /** Twelve notations plus the named colours, matching the app's own translator so a
     *  value copied from one pastes into the other. Alpha travels: HEX8 and RGBA keep
     *  it rather than dropping it silently, which is the failure that makes a
     *  translator untrustworthy — you cannot tell a lost alpha from a colour that
     *  never had one. */
    translate: function (hex) {
      var rgb = this.hexToRgb(hex);
      if (!rgb) { return []; }
      function n(v, d) { return Number(v.toFixed(d === undefined ? 1 : d)); }
      var a = rgb.a === undefined ? 1 : rgb.a;
      var hsl = this.rgbToHsl(rgb), hsv = this.rgbToHsv(rgb);
      var hwb = this.hwb(rgb), lab = this.lab(rgb), lch = this.lch(rgb);
      var okl = this.oklab(rgb), ok = this.oklch(rgb), cmyk = this.cmyk(rgb);
      var named = null;
      var self = this;
      Object.keys(this.NAMED).forEach(function (k) {
        if (!named && self.NAMED[k].toLowerCase() === self.rgbToHex(rgb).toLowerCase()) { named = k; }
      });
      var rows = [
        ["HEX", this.rgbToHex(rgb).toUpperCase()],
        ["HEX8", (this.rgbToHex(rgb) + Math.round(a * 255).toString(16).padStart(2, "0")).toUpperCase()],
        ["RGB", "rgb(" + Math.round(rgb.r) + " " + Math.round(rgb.g) + " " + Math.round(rgb.b) + ")"],
        ["RGBA", "rgb(" + Math.round(rgb.r) + " " + Math.round(rgb.g) + " " + Math.round(rgb.b) + " / " + n(a, 2) + ")"],
        ["HSL", "hsl(" + n(hsl.h) + " " + n(hsl.s) + "% " + n(hsl.l) + "%)"],
        ["HSV", "hsv(" + n(hsv.h) + " " + n(hsv.s) + "% " + n(hsv.v) + "%)"],
        ["HWB", "hwb(" + n(hwb.h) + " " + n(hwb.w) + "% " + n(hwb.b) + "%)"],
        ["LAB", "lab(" + n(lab.l, 2) + "% " + n(lab.a, 2) + " " + n(lab.b, 2) + ")"],
        ["LCH", "lch(" + n(lch.l, 2) + "% " + n(lch.c, 2) + " " + n(lch.h) + ")"],
        ["OKLAB", "oklab(" + n(okl.l, 4) + " " + n(okl.a, 4) + " " + n(okl.b, 4) + ")"],
        ["OKLCH", "oklch(" + n(ok.l, 3) + " " + n(ok.c, 3) + " " + n(ok.h) + ")"],
        ["CMYK", "cmyk(" + n(cmyk.c) + "% " + n(cmyk.m) + "% " + n(cmyk.y) + "% " + n(cmyk.k) + "%)"]
      ];
      if (named) { rows.push(["NAMED", named]); }
      return rows;
    },

    /** Read any of them back. The translator printing a notation it cannot parse is
     *  the defect this exists to prevent: the panel would show you `oklch(0.85 0.06
     *  300)` and then refuse that exact string typed into the field beneath it.
     *  Returns a hex string, or null — never a guess. */
    parse: function (text) {
      var s = String(text == null ? "" : text).trim().toLowerCase();
      if (!s) { return null; }
      if (Object.prototype.hasOwnProperty.call(this.NAMED, s)) { return this.NAMED[s].toUpperCase(); }
      if (/^#?[0-9a-f]{3,8}$/.test(s)) {
        var viaHex = this.hexToRgb(s);
        return viaHex ? this.rgbToHex(viaHex).toUpperCase() : null;
      }
      var m = s.match(/^([a-z]+)\(([^)]*)\)$/);
      if (!m) { return null; }
      var fn = m[1];
      /* Both spellings: the legacy comma form and the modern space-with-slash-alpha
         form. A translator that emits one and reads the other is half a translator. */
      var parts = m[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean).map(function (p) {
        return parseFloat(p.replace("%", ""));
      });
      if (parts.some(function (p) { return !isFinite(p); })) { return null; }
      var rgb = null;
      if (fn === "rgb" || fn === "rgba") {
        rgb = { r: parts[0], g: parts[1], b: parts[2] };
      } else if (fn === "hsl" || fn === "hsla") {
        rgb = this.hslToRgb({ h: parts[0], s: parts[1], l: parts[2] });
      } else if (fn === "hsv" || fn === "hsb") {
        rgb = this.hsvToRgb({ h: parts[0], s: parts[1], v: parts[2] });
      } else if (fn === "hwb") {
        rgb = this.hsvToRgb({ h: parts[0], s: 100 - parts[1] / (1 - parts[2] / 100 || 1), v: 100 - parts[2] });
        var w = parts[1] / 100, bl = parts[2] / 100;
        var pure = this.hsvToRgb({ h: parts[0], s: 100, v: 100 });
        rgb = {
          r: pure.r * (1 - w - bl) + w * 255,
          g: pure.g * (1 - w - bl) + w * 255,
          b: pure.b * (1 - w - bl) + w * 255
        };
      } else if (fn === "lab") {
        rgb = this.labToRgb({ l: parts[0], a: parts[1], b: parts[2] });
      } else if (fn === "lch") {
        rgb = this.labToRgb({
          l: parts[0],
          a: parts[1] * Math.cos(parts[2] * Math.PI / 180),
          b: parts[1] * Math.sin(parts[2] * Math.PI / 180)
        });
      } else if (fn === "oklab") {
        rgb = this.oklabToRgb({ l: parts[0], a: parts[1], b: parts[2] });
      } else if (fn === "oklch") {
        rgb = this.oklabToRgb({
          l: parts[0],
          a: parts[1] * Math.cos(parts[2] * Math.PI / 180),
          b: parts[1] * Math.sin(parts[2] * Math.PI / 180)
        });
      } else if (fn === "cmyk") {
        var k = parts[3] / 100;
        rgb = {
          r: 255 * (1 - parts[0] / 100) * (1 - k),
          g: 255 * (1 - parts[1] / 100) * (1 - k),
          b: 255 * (1 - parts[2] / 100) * (1 - k)
        };
      }
      if (!rgb || [rgb.r, rgb.g, rgb.b].some(function (v) { return !isFinite(v); })) { return null; }
      return this.rgbToHex(rgb).toUpperCase();
    },

    /* The inverses the parser needs. Same D65 white point as lab()/oklab() above. */
    labToRgb: function (l) {
      function inv(v) { return v * v * v > 0.008856 ? v * v * v : (v - 16 / 116) / 7.787; }
      var fy = (l.l + 16) / 116, fx = fy + l.a / 500, fz = fy - l.b / 200;
      var x = inv(fx) * 0.95047, y = inv(fy), z = inv(fz) * 1.08883;
      return this.fromLinear(
        3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
        -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
        0.0556434 * x - 0.2040259 * y + 1.0572252 * z
      );
    },
    oklabToRgb: function (o) {
      var L = Math.pow(o.l + 0.3963377774 * o.a + 0.2158037573 * o.b, 3);
      var M = Math.pow(o.l - 0.1055613458 * o.a - 0.0638541728 * o.b, 3);
      var S = Math.pow(o.l - 0.0894841775 * o.a - 1.2914855480 * o.b, 3);
      return this.fromLinear(
        4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
        -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
        -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S
      );
    },
    /** Linear-light back to 8-bit sRGB, clamped. Out-of-gamut LAB and OKLCH values
     *  clip here rather than wrapping into a different colour entirely. */
    fromLinear: function (r, g, b) {
      function ch(v) {
        var s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
        return clamp(Math.round(s * 255), 0, 255);
      }
      return { r: ch(r), g: ch(g), b: ch(b) };
    },
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

  /* ============================================================ tab groups
     Groups, reordering and the four tab-discovery searches. The strip already had
     pinning and an overflow surface; these are the rest of what the shared
     instructions ask a tabbed surface to carry.

     Everything persists: group membership, each group's name and colour, whether it
     is collapsed, and the manual order of the strip. A group that forgets it was
     collapsed the moment you reload is a decoration, not a feature. */

  function groups() {
    if (!Array.isArray(prefs.groups)) { prefs.groups = []; }
    return prefs.groups;
  }

  function groupOf(tabId) {
    var all = groups();
    for (var i = 0; i < all.length; i++) {
      if (all[i].members.indexOf(tabId) !== -1) { return all[i]; }
    }
    return null;
  }

  function saveGroups() { savePref("groups", groups()); buildStrip(); }

  function createGroup(name, colour) {
    var g = {
      id: "g" + (groups().length + 1) + "-" + Math.random().toString(36).slice(2, 7),
      name: name || "Group " + (groups().length + 1),
      colour: colour || "#6750A4",
      collapsed: false,
      members: []
    };
    prefs.groups = groups().concat([g]);
    return g;
  }

  function assignToGroup(tabId, groupId) {
    prefs.groups = groups().map(function (g) {
      var members = g.members.filter(function (m) { return m !== tabId; });
      if (g.id === groupId) { members = members.concat([tabId]); }
      return Object.assign({}, g, { members: members });
    });
    saveGroups();
  }

  /** Removing a group keeps every tab it held — the tabs are the site's sections and
   *  there is nothing to close. Only the grouping goes. */
  function removeGroup(groupId) {
    prefs.groups = groups().filter(function (g) { return g.id !== groupId; });
    saveGroups();
  }

  /* ------------------------------------------------------------- reordering */

  function manualOrder() {
    if (!Array.isArray(prefs.order) || !prefs.order.length) {
      prefs.order = TABS.map(function (x) { return x.id; });
    }
    /* A tab added by a later build is not in a stored order, and one removed still is.
       Reconcile against TABS rather than trusting what was written months ago. */
    var known = TABS.map(function (x) { return x.id; });
    var kept = prefs.order.filter(function (id) { return known.indexOf(id) !== -1; });
    known.forEach(function (id) { if (kept.indexOf(id) === -1) { kept.push(id); } });
    prefs.order = kept;
    return kept;
  }

  /** Move within the tab's own region. A pinned tab cannot be shuffled in among the
   *  loose ones and back out again — the pinned region is the point of pinning. */
  function moveTab(id, delta) {
    var order = manualOrder().slice();
    var region = order.filter(function (x) { return isPinned(x) === isPinned(id); });
    var at = region.indexOf(id);
    var to = at + delta;
    if (at === -1 || to < 0 || to >= region.length) { return false; }
    var swap = region[to];
    order[order.indexOf(id)] = swap;
    order[order.indexOf(swap)] = id;
    prefs.order = order;
    savePref("order", order);
    buildStrip();
    return true;
  }


  /* ------------------------------------------- the four tab-discovery searches
     Four separate surfaces, each with its own anchored regex builder, because the
     instructions ask for four and they answer four different questions: what is in
     this strip, what is in one group, which group is called what, and where is that
     tab across everything. One shared field would silently apply the last query you
     typed to whichever surface you opened next. */

  function tabSearchRows(scope, groupId) {
    var rows = [];
    manualOrder().forEach(function (id) {
      var tab = tabById(id);
      if (!tab) { return; }
      var g = groupOf(id);
      if (scope === "group" && (!g || g.id !== groupId)) { return; }
      rows.push({
        id: id,
        label: t(tab.key),
        group: g ? g.name : "",
        groupId: g ? g.id : "",
        pinned: isPinned(id),
        collapsed: g ? !!g.collapsed : false
      });
    });
    return rows;
  }

  /** One search dialog, four callers. `spec` says what it is searching and how to
   *  describe a result, so the shared plumbing never has to guess which surface it is
   *  on — and each caller keeps its own query, pattern, flags and mode. */
  function openTabSearch(spec) {
    var state = { q: "", regex: !!prefs.regex };

    var host = el("div", { "class": "sheet", role: "dialog", "aria-modal": "false", "aria-label": spec.title });
    host.appendChild(el("h3", { "class": "sheet__title" }, esc(spec.title)));
    host.appendChild(el("p", { "class": "section-note" }, esc(spec.note)));

    var bar = el("div", { "class": "sheet__bar" });
    var field = el("input", {
      type: "search", "class": "plain", "aria-label": spec.title,
      placeholder: spec.placeholder || "Type to filter…"
    });
    var mode = el("button", {
      type: "button", "class": "linkchip",
      "aria-pressed": state.regex ? "true" : "false",
      title: "Plain text is the default. Turn this on to match with a regular expression."
    }, state.regex ? ".*" : "abc");
    var builder = el("button", { type: "button", "class": "linkchip", title: "Open the regex builder for this search" }, "Builder");
    bar.appendChild(field);
    bar.appendChild(mode);
    bar.appendChild(builder);
    host.appendChild(bar);

    var status = el("p", { "class": "section-note", role: "status", "aria-live": "polite" });
    host.appendChild(status);
    var list = el("ul", { "class": "sheet__list" });
    host.appendChild(list);

    function matches(row) {
      if (!state.q) { return true; }
      var hay = spec.haystack(row);
      if (!state.regex) { return hay.toLowerCase().indexOf(state.q.toLowerCase()) !== -1; }
      var res = safeRegex(state.q, hay);
      return res.ok && res.matches.length > 0;
    }

    function paint() {
      var rows = spec.rows().filter(matches);
      list.innerHTML = "";
      if (!rows.length) {
        status.textContent = state.q
          ? "Nothing matches “" + state.q + "”" + (state.regex ? " as a regular expression." : " as plain text.")
          : spec.empty;
        return;
      }
      status.textContent = rows.length + (rows.length === 1 ? " result" : " results") +
        (state.q ? (state.regex ? " matching that pattern." : " containing that text.") : ".");
      rows.forEach(function (row) {
        var li = el("li");
        var b = el("button", { type: "button", "class": "sheet__row" });
        b.appendChild(el("span", { "class": "sheet__rowLabel" }, esc(row.label)));
        /* Every result says where it lives — which strip, which group, whether it is
           pinned — because a result you cannot locate is a result you cannot act on. */
        var where = [];
        if (row.pinned) { where.push("pinned"); }
        if (row.group) { where.push("in " + row.group + (row.collapsed ? ", collapsed" : "")); }
        if (where.length) { b.appendChild(el("span", { "class": "sheet__rowWhere" }, esc(where.join(" · ")))); }
        b.addEventListener("click", function () { spec.pick(row); closeSheet(); });
        li.appendChild(b);
        list.appendChild(li);
      });
    }

    field.addEventListener("input", function () { state.q = field.value; paint(); });
    mode.addEventListener("click", function () {
      state.regex = !state.regex;
      mode.textContent = state.regex ? ".*" : "abc";
      mode.setAttribute("aria-pressed", state.regex ? "true" : "false");
      paint();
    });
    /* The builder writes back into THIS field, not into whichever search bar happened
       to open it last. */
    builder.addEventListener("click", function () {
      openRegexBuilder(state.q, function (pattern) {
        state.q = pattern;
        state.regex = true;
        field.value = pattern;
        mode.textContent = ".*";
        mode.setAttribute("aria-pressed", "true");
        paint();
      });
    });

    paint();
    showSheet(host, field);
  }

  function openStripSearch() {
    openTabSearch({
      title: "Search this tab strip",
      note: "Every tab in the strip you are looking at, in its current order.",
      empty: "This strip has no tabs, which should not be possible.",
      rows: function () { return tabSearchRows("strip"); },
      haystack: function (r) { return r.label; },
      pick: function (r) { activate(r.id, true); }
    });
  }

  function openGroupPicker() {
    var all = groups();
    if (!all.length) {
      toast("info", "There are no groups yet", "Right-click a tab and choose “Move to a new group…” to make one.");
      return;
    }
    openTabSearch({
      title: "Which group?",
      note: "Pick a group, then search inside it.",
      empty: "No groups yet.",
      rows: function () {
        return all.map(function (g) {
          return { id: g.id, label: g.name, group: "", groupId: g.id, pinned: false, collapsed: !!g.collapsed,
            count: g.members.length };
        });
      },
      haystack: function (r) { return r.label; },
      pick: function (r) { openInGroupSearch(r.id); }
    });
  }

  function openInGroupSearch(groupId) {
    var g = groups().filter(function (x) { return x.id === groupId; })[0];
    openTabSearch({
      title: "Search “" + (g ? g.name : "group") + "”",
      note: "Only the tabs in this group.",
      empty: "This group is empty.",
      rows: function () { return tabSearchRows("group", groupId); },
      haystack: function (r) { return r.label; },
      pick: function (r) {
        /* Revealing a result inside a collapsed group must not destroy the collapsed
           preference — expand to show it, and put it back the way it was is not
           possible once the user is looking at it, so say so instead of guessing. */
        if (g && g.collapsed) {
          g.collapsed = false;
          saveGroups();
          toast("info", "“" + g.name + "” was expanded", "It was collapsed, and a result you cannot see is not a result.");
        }
        activate(r.id, true);
      }
    });
  }

  function openGroupsSearch() {
    openTabSearch({
      title: "Search tab groups",
      note: "Groups by their visible name.",
      empty: "No groups yet. Right-click a tab and choose “Move to a new group…”.",
      rows: function () {
        return groups().map(function (g) {
          return { id: g.id, label: g.name + " (" + g.members.length + ")", group: "", groupId: g.id,
            pinned: false, collapsed: !!g.collapsed };
        });
      },
      haystack: function (r) { return r.label; },
      pick: function (r) { openInGroupSearch(r.id); }
    });
  }

  function openMasterSearch() {
    openTabSearch({
      title: "Every tab, everywhere",
      note: "Every tab this site owns, whatever strip or group it sits in.",
      empty: "Nothing to search.",
      rows: function () { return tabSearchRows("strip"); },
      /* The master search matches the group name too — that is what makes it the
         master one rather than a second copy of the strip search. */
      haystack: function (r) { return r.label + " " + r.group; },
      pick: function (r) { activate(r.id, true); }
    });
  }


  /* ------------------------------------------------------ sheets and the builder
     A non-modal sheet, so the page behind it stays live and readable, and a compact
     regex builder that opens beside the field that asked for it rather than sending
     the reader to a different page to compose a pattern and carry it back by hand. */

  var openSheetNode = null;
  var sheetReturn = null;

  function closeSheet() {
    if (openSheetNode && openSheetNode.parentNode) { openSheetNode.parentNode.removeChild(openSheetNode); }
    openSheetNode = null;
    if (sheetReturn && sheetReturn.focus) { sheetReturn.focus(); }
    sheetReturn = null;
  }

  function showSheet(node, focusMe) {
    closeSheet();
    sheetReturn = document.activeElement;
    /* The sheet is itself a target: a theming feature that cannot theme its own
       dialog is incomplete, and the instructions name pickers and dialogs explicitly. */
    node.setAttribute("data-appear", "Sheet");
    var wrap = el("div", { "class": "sheet__wrap" });
    var close = el("button", { type: "button", "class": "sheet__close", "aria-label": "Close" }, "✕");
    close.addEventListener("click", closeSheet);
    node.appendChild(close);
    wrap.appendChild(node);
    document.body.appendChild(wrap);
    openSheetNode = wrap;
    if (focusMe && focusMe.focus) { focusMe.focus(); }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && openSheetNode) { closeSheet(); }
  });

  /** Bounded match, using the same engine and the same refusals as everything else on
   *  this page. A search that quietly used a different regex dialect from the builder
   *  beside it would be worse than no builder. */
  function safeRegex(pattern, sample) {
    var res = evaluate(pattern, prefs.regexFlags || "gi", sample);
    return { ok: res.ok, matches: res.matches || [], error: res.error };
  }

  /** The compact builder. Same constructs, same flags and the same bounded engine as
   *  the full one on the docs page — this is that builder sized for a popover, not a
   *  reduced imitation of it. `onApply` receives the pattern, so the field that opened
   *  it is the field that gets it. */
  function openRegexBuilder(seed, onApply) {
    var pattern = seed || "";
    var flags = prefs.regexFlags || "gi";
    var sample = TABS.map(function (x) { return t(x.key); }).join("\n");

    var host = el("div", { "class": "sheet", role: "dialog", "aria-modal": "false", "aria-label": "Regex builder" });
    host.appendChild(el("h3", { "class": "sheet__title" }, "Regex builder"));
    host.appendChild(el("p", { "class": "section-note" },
      "Applies to the search that opened it, and to no other. JavaScript RegExp — the same engine the page filters " +
      "with, so what matches here is what will match there."));

    var input = el("input", { type: "text", "class": "plain", "aria-label": "Pattern", value: pattern, style: "width:100%" });
    host.appendChild(input);

    var flagRow = el("div", { "class": "sheet__bar", role: "group", "aria-label": "Flags" });
    FLAG_LIST.forEach(function (f) {
      var on = flags.indexOf(f[0]) !== -1;
      var b = el("button", { type: "button", "class": "linkchip", "aria-pressed": on ? "true" : "false",
        title: f[1] }, f[0]);
      b.addEventListener("click", function () {
        flags = flags.indexOf(f[0]) !== -1 ? flags.replace(f[0], "") : flags + f[0];
        b.setAttribute("aria-pressed", flags.indexOf(f[0]) !== -1 ? "true" : "false");
        paint();
      });
      flagRow.appendChild(b);
    });
    host.appendChild(flagRow);

    CONSTRUCTS.forEach(function (grp) {
      var box = el("div", { style: "margin-top:10px" });
      box.appendChild(el("div", { "class": "section-note", style: "margin-bottom:4px" }, esc(grp.group)));
      var row = el("div", { "class": "sheet__bar" });
      grp.items.forEach(function (item) {
        var b = el("button", { type: "button", "class": "linkchip linkchip--mono", title: item[1] }, esc(item[0]));
        b.addEventListener("click", function () {
          pattern += item[0];
          input.value = pattern;
          paint();
        });
        row.appendChild(b);
      });
      box.appendChild(row);
      host.appendChild(box);
    });

    var status = el("p", { "class": "section-note", role: "status", "aria-live": "polite" });
    host.appendChild(status);

    var apply = el("button", { type: "button", "class": "linkchip linkchip--next" }, "Apply to the search");
    apply.addEventListener("click", function () {
      if (typeof onApply === "function") { onApply(input.value, flags); }
      savePref("regexFlags", flags);
      closeSheet();
    });
    host.appendChild(apply);

    function paint() {
      pattern = input.value;
      if (!pattern) { status.textContent = "Nothing to match yet."; return; }
      var res = evaluate(pattern, flags, sample);
      if (!res.ok) { status.textContent = res.error; return; }
      status.textContent = res.matches.length + " match" + (res.matches.length === 1 ? "" : "es") +
        " against this strip's tab names" + (res.truncated ? ", truncated" : "") + ".";
    }

    input.addEventListener("input", paint);
    paint();
    showSheet(host, input);
  }

  function tabById(id) {
    for (var i = 0; i < TABS.length; i++) { if (TABS[i].id === id) { return TABS[i]; } }
    return null;
  }
  /** Pinned tabs occupy a stable region ahead of the ordinary ones and keep their own
   *  relative order within it — the same rule the app's own strip uses. */
  function orderedTabs() {
    var pinned = [], loose = [];
    /* The stored manual order first, then the pinned/loose split — so reordering
       inside a region is preserved and pinning still wins over it. */
    manualOrder().forEach(function (id) {
      var tab = tabById(id);
      if (!tab) { return; }
      var g = groupOf(id);
      /* A collapsed group hides its members from the strip but never from the
         searches: that is what makes collapsing safe to use. The active tab is never
         hidden, because a strip that can swallow the tab you are reading is worse
         than one that cannot collapse at all. */
      if (g && g.collapsed && id !== prefs.tab) { return; }
      (isPinned(id) ? pinned : loose).push(tab);
    });
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
        var grp = groupOf(tab.id);
        if (grp) {
          /* The colour is decoration; the group's name goes to the accessible name so
             a screen-reader user learns the grouping too. */
          btn.style.setProperty("--tab-group", grp.colour);
          btn.classList.add("tab--grouped");
          btn.appendChild(el("span", { "class": "vh" }, " (in " + grp.name + ")"));
        }
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
    } else if (e.ctrlKey && e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      var id = e.currentTarget.getAttribute("data-tab");
      if (moveTab(id, e.key === "ArrowRight" ? 1 : -1)) {
        var again = $("tablist").querySelector('[data-tab="' + id + '"]');
        if (again) { again.focus(); }
      }
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
    var g = groupOf(tab.id);
    var items = [
      { label: "Open " + t(tab.key), run: function () { activate(tab.id, true); } },
      { label: isPinned(tab.id) ? "Unpin this tab" : "Pin this tab", hint: "P", run: function () { togglePin(tab.id); } },
      { label: "Move left", hint: "Ctrl+Shift+←", run: function () { moveTab(tab.id, -1); } },
      { label: "Move right", hint: "Ctrl+Shift+→", run: function () { moveTab(tab.id, 1); } },
      { label: "Move to a new group…", run: function () {
        var name = window.prompt("Name the group", "Group " + (groups().length + 1));
        if (name === null) { return; }
        var made = createGroup(name.trim() || null);
        assignToGroup(tab.id, made.id);
        toast("success", "Grouped", "“" + t(tab.key) + "” is now in “" + made.name + "”.");
      } }
    ];
    groups().forEach(function (other) {
      if (g && other.id === g.id) { return; }
      items.push({ label: "Move to “" + other.name + "”", run: function () { assignToGroup(tab.id, other.id); } });
    });
    if (g) {
      items.push({ label: "Take out of “" + g.name + "”", run: function () { assignToGroup(tab.id, null); } });
      items.push({ label: g.collapsed ? "Expand “" + g.name + "”" : "Collapse “" + g.name + "”", run: function () {
        g.collapsed = !g.collapsed;
        saveGroups();
      } });
      items.push({ label: "Rename “" + g.name + "”…", run: function () {
        var name = window.prompt("Rename the group", g.name);
        if (name === null) { return; }
        g.name = name.trim() || g.name;
        saveGroups();
      } });
      items.push({ label: "Colour for “" + g.name + "”…", run: function () {
        var c = window.prompt("A colour for this group — any notation the translator reads", g.colour);
        if (c === null) { return; }
        var hex = colour.parse(c);
        if (!hex) { toast("error", "That is not a colour this reads", "Try #6750A4, rgb(103 80 164), oklch(…), or a name like plum."); return; }
        g.colour = hex;
        saveGroups();
      } });
      items.push({ label: "Ungroup (keeps every tab)", run: function () { removeGroup(g.id); } });
      items.push({ label: "Search “" + g.name + "”…", run: function () { openInGroupSearch(g.id); } });
    }
    items.push({ label: "Copy a link to this tab", run: function () {
      copyText(location.href.split("#")[0] + "#" + tab.id, "the link");
    } });
    popupMenu(anchor, items, null);
  }

  /** Hide the tabs that do not fit and list them in the overflow menu. Pinned tabs
   *  and the active tab are never hidden — an overflow that can swallow the tab you
   *  are reading is worse than no overflow at all. */
  /* The four searches hang off one button, because four buttons in a strip that
     already overflows is how you get a strip that overflows. Each opens its own sheet
     with its own query, pattern, flags and mode — never a shared one. */
  function wireFindTabs() {
    var btn = document.getElementById("findTabsBtn");
    if (!btn) { return; }
    btn.addEventListener("click", function () {
      /* `btn` as the trigger, not null. The document-level dismiss handler closes any
         open menu unless the click landed inside the menu or its trigger — so opening
         from a click with no trigger declared opens and closes on the same event, and
         the menu appears never to open at all. It also sets aria-expanded. */
      popupMenu(btn, [
        { label: "Search this tab strip…", run: openStripSearch },
        { label: "Search inside a group…", run: openGroupPicker },
        { label: "Search tab groups by name…", run: openGroupsSearch },
        { label: "Search every tab, everywhere…", run: openMasterSearch }
      ], btn);
    });
  }

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


  /* ============================================================== history
     Every preference this page owns is versioned. The instructions ask any app that
     owns user records to let a mistake be undone, and a settings page is a record
     store however small it looks — clearing an accent you spent five minutes choosing
     is exactly the kind of loss an undo exists for.

     Append-only. Restoring writes a NEW revision rather than rewinding, so an undo can
     itself be undone, and then that undone in turn. A "restore" that discards the
     branch it replaced is the one shape that makes a history panel unsafe to open. */

  var historyRepaint = null;
  var HISTORY_KEY = "history";
  var HISTORY_KEEP = 200;

  /* What each stored key is called, and which action it belongs to. A filter built
     from a hard-coded list drifts the moment a preference is added; these come from
     the log itself, and this is only how a row is labelled. */
  var PREF_ACTIONS = {
    theme: "appearance", accent: "appearance", font: "appearance", fontScale: "appearance",
    density: "appearance", appearance: "appearance", presets: "preset",
    lang: "language", funnyEn: "language", funnyYue: "language",
    dimsum: "delight", regex: "search", regexFlags: "search",
    tab: "navigation", pinned: "navigation", order: "navigation", groups: "navigation"
  };

  function history() {
    if (!Array.isArray(prefs.history)) { prefs.history = []; }
    return prefs.history;
  }

  function describe(key, before, after) {
    var name = key === "appearance" ? "per-element appearance"
      : key === "presets" ? "the named presets"
      : key === "groups" ? "the tab groups"
      : key === "pinned" ? "the pinned tabs"
      : key === "order" ? "the tab order"
      : "the " + key;
    if (before === undefined || before === null || before === "") { return "Set " + name; }
    if (after === undefined || after === null || after === "") { return "Cleared " + name; }
    /* Say what it became when that is a value a person recognises. "Changed the theme"
       is a worse record than "Theme set to dark" for exactly the reason the app's own
       history rule gives: label a revision with what changed, not that something did. */
    if (typeof after === "string" || typeof after === "number" || typeof after === "boolean") {
      return name.charAt(0).toUpperCase() + name.slice(1) + " set to " + after;
    }
    return "Changed " + name;
  }

  function record(key, before, after) {
    /* An unchanged write records nothing, so the panel stays a list of real events. */
    if (JSON.stringify(before) === JSON.stringify(after)) { return; }
    var log = history();
    log.unshift({
      at: Date.now(),
      key: key,
      action: PREF_ACTIONS[key] || "other",
      label: describe(key, before, after),
      before: before === undefined ? null : before
    });
    if (log.length > HISTORY_KEEP) { log.length = HISTORY_KEEP; }
    prefs.history = log;
    store.set(HISTORY_KEY, log);
    if (typeof historyRepaint === "function") { historyRepaint(); }
  }

  function restoreRevision(index) {
    var log = history();
    var entry = log[index];
    if (!entry) { return; }
    var now = prefs[entry.key];
    /* The restore is itself a write, so it goes through savePref and lands in the log
       as its own revision. That is what makes an undo undoable. */
    savePref(entry.key, entry.before);
    applyAppearance();
    applyElementAppearance();
    renderActive();
    toast("success", "Restored", entry.label + " — undone. This restore is itself a revision, so it can be undone too.",
      { was: now });
  }

  /** Every action present in the log, with a count. Derived, never hard-coded: a list
   *  of four over a log that records eight leaves half of them unreachable, and drifts
   *  every time a new kind is added. */
  function historyActions() {
    var counts = {};
    history().forEach(function (e) { counts[e.action] = (counts[e.action] || 0) + 1; });
    return Object.keys(counts).sort().map(function (a) { return { id: a, n: counts[a] }; });
  }

  function renderHistory() {
    var state = { from: "", to: "", actions: [], q: "" };

    var card = el("div", { "class": "card", "data-appear": "History" });
    card.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "History"));
    card.appendChild(el("p", { "class": "section-note" }, inline(
      "Every preference change on this page, newest first, kept locally. Restoring writes a **new** revision rather " +
      "than rewinding, so an undo can itself be undone. Nothing here leaves this browser.")));

    var bar = el("div", { "class": "sheet__bar" });
    var q = el("input", { type: "search", "class": "plain", "aria-label": "Search the history", placeholder: "Search…" });
    var from = el("input", { type: "date", "class": "plain", "aria-label": "From date" });
    var to = el("input", { type: "date", "class": "plain", "aria-label": "To date" });
    bar.appendChild(q);
    bar.appendChild(el("span", { "class": "section-note" }, "from"));
    bar.appendChild(from);
    bar.appendChild(el("span", { "class": "section-note" }, "to"));
    bar.appendChild(to);
    card.appendChild(bar);

    var chips = el("div", { "class": "sheet__bar", role: "group", "aria-label": "Filter by action" });
    card.appendChild(chips);
    var status = el("p", { "class": "searchmeta", role: "status", "aria-live": "polite" });
    card.appendChild(status);
    var list = el("ul", { "class": "sheet__list" });
    card.appendChild(list);

    function matches(e) {
      if (state.actions.length && state.actions.indexOf(e.action) === -1) { return false; }
      if (state.from && e.at < new Date(state.from + "T00:00:00").getTime()) { return false; }
      /* The end date covers the whole of that day. A filter that hides what happened on
         the day you asked for is a filter nobody trusts twice. */
      if (state.to && e.at > new Date(state.to + "T23:59:59.999").getTime()) { return false; }
      if (state.q && (e.label + " " + e.action).toLowerCase().indexOf(state.q.toLowerCase()) === -1) { return false; }
      return true;
    }

    function paint() {
      chips.innerHTML = "";
      historyActions().forEach(function (a) {
        var on = state.actions.indexOf(a.id) !== -1;
        var b = el("button", { type: "button", "class": "linkchip", "aria-pressed": on ? "true" : "false" },
          esc(a.id) + " " + a.n);
        b.addEventListener("click", function () {
          state.actions = on ? state.actions.filter(function (x) { return x !== a.id; }) : state.actions.concat([a.id]);
          paint();
        });
        chips.appendChild(b);
      });

      var all = history();
      var rows = all.filter(matches);
      list.innerHTML = "";
      if (!all.length) {
        status.textContent = "Nothing yet. Change a setting and it will appear here.";
        return;
      }
      status.textContent = "Showing " + rows.length + " of " + all.length + " revisions.";
      if (!rows.length) {
        status.textContent += " Nothing matches the current filter.";
        return;
      }
      rows.slice(0, 60).forEach(function (e) {
        var i = all.indexOf(e);
        var li = el("li");
        var b = el("button", { type: "button", "class": "sheet__row",
          title: "Restore the value from before this change" });
        b.appendChild(el("span", { "class": "sheet__rowLabel" }, esc(e.label)));
        b.appendChild(el("span", { "class": "sheet__rowWhere" },
          esc(new Date(e.at).toLocaleString() + " · " + e.action)));
        b.addEventListener("click", function () { restoreRevision(i); });
        li.appendChild(b);
        list.appendChild(li);
      });
    }

    q.addEventListener("input", function () { state.q = q.value; paint(); });
    from.addEventListener("change", function () { state.from = from.value; paint(); });
    to.addEventListener("change", function () { state.to = to.value; paint(); });

    paint();
    /* Held while this card is on screen so a change recorded now shows up now. Without
       it the list is whatever it was when the panel was built, and a reader who changes
       a setting and looks straight at the history sees nothing — which reads exactly
       like "it did not record". renderActive() rebuilds the panel and calls this again,
       so the reference never points at a detached node. */
    historyRepaint = paint;
    return card;
  }

  /* ------------------------------------------------- the settings search
     Every adjustment surface carries its own search bar wired to the same regex
     builder — the instructions are explicit, and "it is a short page, just scroll"
     is not an answer for a reader who knows a setting's name but not which card it
     is on. This searches each row's own label, description AND current value, so
     typing "oklch" finds the accent picker and typing "cosy" finds the density row
     by what it is set to rather than by what it is called. */

  function settingsSearchBar(panel) {
    var state = { q: "", regex: !!prefs.regex };

    var wrap = el("div", { "class": "field", style: "margin:10px 0 4px", "data-appear": "Settings search" });
    wrap.appendChild(el("span", { "aria-hidden": "true" }, "🔍"));
    var input = el("input", {
      type: "search", id: "setq", autocomplete: "off", spellcheck: "false",
      "aria-label": "Search settings", placeholder: "Search settings by name, description or current value…"
    });
    var mode = el("button", {
      type: "button", "class": "icon-btn", "aria-pressed": state.regex ? "true" : "false",
      title: "Use this query as a regular expression. Plain text is the default."
    }, ".*");
    var open = el("button", { type: "button", "class": "icon-btn", title: "Open the regex builder for this search" }, "⚙");
    var clear = el("button", { type: "button", "class": "icon-btn", title: "Clear the settings search" }, "✕");
    wrap.appendChild(input);
    wrap.appendChild(mode);
    wrap.appendChild(open);
    wrap.appendChild(clear);

    var meta = el("p", { "class": "searchmeta", role: "status", "aria-live": "polite" });

    function apply() {
      var rows = panel.querySelectorAll(".setrow");
      var cards = panel.querySelectorAll(".card");
      var shown = 0, total = rows.length;
      Array.prototype.forEach.call(rows, function (row) {
        /* Label, description and the control's current value together: a reader who
           knows a setting only by what it is set to should still find it. */
        var hay = row.textContent + " " + Array.prototype.map.call(
          row.querySelectorAll("input,select,button"),
          function (c) { return (c.value || "") + " " + (c.getAttribute("aria-pressed") === "true" ? c.textContent : ""); }
        ).join(" ");
        var hit;
        if (!state.q) { hit = true; }
        else if (!state.regex) { hit = hay.toLowerCase().indexOf(state.q.toLowerCase()) !== -1; }
        else {
          var res = safeRegex(state.q, hay);
          hit = res.ok && res.matches.length > 0;
        }
        row.hidden = !hit;
        if (hit) { shown += 1; }
      });
      /* A card whose every row is hidden is hidden too, so the reader is not left
         scrolling past empty headings looking for the match. */
      Array.prototype.forEach.call(cards, function (card) {
        var rowsIn = card.querySelectorAll(".setrow");
        if (!rowsIn.length) { return; }
        var any = Array.prototype.some.call(rowsIn, function (r) { return !r.hidden; });
        card.hidden = !any;
      });

      if (!state.q) { meta.textContent = ""; return; }
      if (!shown) {
        /* Say plainly that nothing matched here — and that other surfaces exist, since
           a setting the reader is hunting may live in the app rather than on this page. */
        meta.textContent = "Nothing on this page matches “" + state.q + "”" +
          (state.regex ? " as a regular expression." : " as plain text.") +
          " The app's own Studio panel has settings this site does not.";
        return;
      }
      meta.textContent = shown + " of " + total + " settings match" +
        (state.regex ? " that pattern." : " that text.");
    }

    input.addEventListener("input", function () { state.q = input.value; apply(); });
    mode.addEventListener("click", function () {
      state.regex = !state.regex;
      mode.setAttribute("aria-pressed", state.regex ? "true" : "false");
      apply();
    });
    clear.addEventListener("click", function () {
      state.q = "";
      input.value = "";
      state.regex = false;
      mode.setAttribute("aria-pressed", "false");
      apply();
      input.focus();
    });
    /* Its own builder, writing back into this field — not the article search's. */
    open.addEventListener("click", function () {
      openRegexBuilder(state.q, function (pattern) {
        state.q = pattern;
        state.regex = true;
        input.value = pattern;
        mode.setAttribute("aria-pressed", "true");
        apply();
      });
    });

    return { wrap: wrap, meta: meta, apply: apply };
  }

  function renderSettings(panel) {
    panel.appendChild(el("h2", { "class": "section-title" }, "Settings"));
    panel.appendChild(el("p", { "class": "section-note" },
      "Everything here is stored in this browser's localStorage under the `cxs.` prefix and persists across reloads. " +
      "Nothing is sent anywhere; there is nowhere to send it to."));

    var setSearch = settingsSearchBar(panel);
    panel.appendChild(setSearch.wrap);
    panel.appendChild(setSearch.meta);

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
    panel.appendChild(renderPresets());
    panel.appendChild(renderHistory());

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


  /* ============================================ per-element appearance
     Every rendered surface is its own customisation target, edited from a non-modal
     sheet, with the override applied live and kept per element. The shared instructions
     are emphatic that no surface is exempt — including the pickers and dialogs, so the
     appearance system can restyle its own chrome rather than being the one thing on the
     page that cannot be changed. */

  var APPEAR_PROPS = ["font", "size", "weight", "slant", "caps", "underline", "spacing", "colour", "highlight"];

  function appearMap() {
    if (!prefs.appearance || typeof prefs.appearance !== "object") { prefs.appearance = {}; }
    return prefs.appearance;
  }

  /** The one place a stored override becomes CSS. Shared by the live pass and the
      export, so the two can never drift into applying different property sets — which
      is exactly how a property ends up working in the app and missing from its file. */
  function appearStyle(a) {
    if (!a) { return {}; }
    var deco = [];
    if (a.underline) { deco.push("underline"); }
    return {
      fontFamily: a.font ? (FONTS[a.font] ? FONTS[a.font].stack : a.font) : "",
      fontSize: a.size ? a.size + "%" : "",
      fontWeight: a.weight ? String(a.weight) : "",
      fontStyle: a.slant || "",
      fontVariantCaps: a.caps === "small-caps" ? "small-caps" : "",
      textTransform: a.caps && a.caps !== "small-caps" ? a.caps : "",
      textDecorationLine: deco.join(" "),
      letterSpacing: a.spacing ? (a.spacing / 100) + "em" : "",
      color: a.colour || "",
      backgroundColor: a.highlight || ""
    };
  }

  /** Apply every override. Clears only what this system set on the previous pass —
      writing "" for every property it knows about would erase the stylesheet's own
      values, which is a mistake this project has already made once and measured. */
  function applyElementAppearance() {
    var map = appearMap();
    var nodes = document.querySelectorAll("[data-appear]");
    Array.prototype.forEach.call(nodes, function (node) {
      var style = appearStyle(map[node.getAttribute("data-appear")]);
      var applied = node.__cxsApplied || [];
      applied.forEach(function (prop) { if (!style[prop]) { node.style[prop] = ""; } });
      var now = [];
      Object.keys(style).forEach(function (prop) {
        if (!style[prop]) { return; }
        node.style[prop] = style[prop];
        now.push(prop);
      });
      node.__cxsApplied = now;
    });
  }

  function patchAppear(name, patch) {
    var map = appearMap();
    var next = Object.assign({}, map[name] || {}, patch);
    /* A cleared control removes its property rather than storing "". Otherwise every
       control the reader ever touched leaves a tombstone in the exported document. */
    Object.keys(next).forEach(function (k) {
      if (next[k] === "" || next[k] === null || next[k] === undefined || next[k] === false) { delete next[k]; }
    });
    if (Object.keys(next).length) { map[name] = next; } else { delete map[name]; }
    savePref("appearance", map);
    applyElementAppearance();
  }

  /** The editor. Non-modal, so the element being restyled stays visible and the change
      can be watched landing on it. */
  function openAppearFor(name) {
    var a = appearMap()[name] || {};

    var host = el("div", { "class": "sheet", role: "dialog", "aria-modal": "false",
      "aria-label": "Appearance — " + name });
    host.appendChild(el("h3", { "class": "sheet__title" }, "Appearance — " + esc(name)));
    host.appendChild(el("p", { "class": "section-note" },
      "Applies to every element named “" + name + "”, live, and persists. Selecting a segment that is already " +
      "selected clears it."));

    function group(label, prop, options) {
      var box = el("div", { style: "margin-top:12px" });
      box.appendChild(el("div", { "class": "section-note", style: "margin-bottom:4px" }, esc(label)));
      var row = el("div", { "class": "sheet__bar", role: "group", "aria-label": label });
      options.forEach(function (opt) {
        var on = (a[prop] || "") === opt[0];
        var b = el("button", { type: "button", "class": "linkchip", "aria-pressed": on ? "true" : "false" }, esc(opt[1]));
        b.addEventListener("click", function () {
          patchAppear(name, JSON.parse('{"' + prop + '":' + JSON.stringify(on ? "" : opt[0]) + "}"));
          closeSheet();
          openAppearFor(name);
        });
        row.appendChild(b);
      });
      box.appendChild(row);
      host.appendChild(box);
    }

    group("Typeface", "font", Object.keys(FONTS).map(function (k) { return [k, FONTS[k].label]; }));
    group("Slant", "slant", [["italic", "Italic"], ["oblique", "Oblique"]]);
    group("Capitalization", "caps", [["uppercase", "UPPER"], ["lowercase", "lower"], ["capitalize", "Title"], ["small-caps", "Small caps"]]);
    group("Underline", "underline", [["solid", "Underline"]]);

    function slider(label, prop, min, max, step, unit, dflt) {
      var box = el("div", { style: "margin-top:12px" });
      var name2 = el("div", { "class": "section-note", style: "margin-bottom:4px" },
        label + " " + ((a[prop] === undefined ? dflt : a[prop]) + unit));
      box.appendChild(name2);
      var input = el("input", { type: "range", min: String(min), max: String(max), step: String(step),
        value: String(a[prop] === undefined ? dflt : a[prop]), "aria-label": label, style: "width:100%" });
      input.addEventListener("input", function () {
        name2.textContent = label + " " + (input.value + unit);
        patchAppear(name, JSON.parse('{"' + prop + '":' + Number(input.value) + "}"));
      });
      box.appendChild(input);
      host.appendChild(box);
    }
    slider("Size", "size", 70, 180, 5, "%", 100);
    slider("Weight", "weight", 100, 900, 100, "", 400);
    slider("Letter spacing", "spacing", -10, 60, 1, "/100em", 0);

    function colourRow(label, prop) {
      var box = el("div", { "class": "sheet__bar" });
      box.appendChild(el("span", { "class": "section-note", style: "flex:0 0 110px" }, esc(label)));
      var input = el("input", { type: "text", "class": "plain", value: a[prop] || "",
        placeholder: "any notation the translator reads", "aria-label": label, style: "flex:1 1 180px" });
      input.addEventListener("change", function () {
        if (!input.value.trim()) { patchAppear(name, JSON.parse('{"' + prop + '":""}')); return; }
        var hex = colour.parse(input.value);
        if (!hex) {
          toast("error", "That is not a colour this reads", "hex, rgb, hsl, hsv, hwb, lab, lch, oklab, oklch, cmyk, or a name.");
          return;
        }
        patchAppear(name, JSON.parse('{"' + prop + '":' + JSON.stringify(hex) + "}"));
      });
      box.appendChild(input);
      host.appendChild(box);
    }
    host.appendChild(el("div", { "class": "section-note", style: "margin-top:12px" }, "Colour"));
    colourRow("Text", "colour");
    colourRow("Highlight", "highlight");

    var actions = el("div", { "class": "sheet__bar", style: "margin-top:16px" });
    var resetOne = el("button", { type: "button", "class": "linkchip" }, "Reset this element");
    resetOne.addEventListener("click", function () {
      var map = appearMap();
      delete map[name];
      savePref("appearance", map);
      applyElementAppearance();
      closeSheet();
      toast("success", "Reset “" + name + "”", "Back to the stylesheet's own values.");
    });
    var resetAll = el("button", { type: "button", "class": "linkchip" }, "Reset every element");
    resetAll.addEventListener("click", function () {
      savePref("appearance", {});
      applyElementAppearance();
      closeSheet();
      toast("success", "Reset every element", "Every per-element override is gone; theme and accent are untouched.");
    });
    actions.appendChild(resetOne);
    actions.appendChild(resetAll);
    host.appendChild(actions);

    showSheet(host, host.querySelector("button"));
  }

  /* Right-click any named surface. Shift+right-click opens the editor straight away,
     so an element whose own menu matters keeps it. */
  document.addEventListener("contextmenu", function (e) {
    var host = e.target && e.target.closest ? e.target.closest("[data-appear]") : null;
    if (!host) { return; }
    /* A tab has a real menu of its own — tab management — and must not have it
       replaced by a styling menu. Its appearance entry lives inside that menu. */
    if (e.target.closest(".tab")) { return; }
    e.preventDefault();
    var name = host.getAttribute("data-appear");
    if (e.shiftKey) { openAppearFor(name); return; }
    popupMenu(host, [
      { label: "Edit appearance — " + name + "…", hint: "Shift", run: function () { openAppearFor(name); } },
      { label: "Reset this element's appearance", run: function () {
        var map = appearMap();
        delete map[name];
        savePref("appearance", map);
        applyElementAppearance();
      } }
    ], null);
  });

  /* ======================================================= named presets
     A saved look, kept by name, exportable to a file and importable back. The point of
     a preset is surviving a reinstall and being shared; one that lives only in this
     browser's localStorage satisfies neither, which is why export writes a real file
     rather than copying to the clipboard. */

  var PRESET_FORMAT = "codex-studio-site-appearance";
  var PRESET_VERSION = 1;
  /* Exactly the preferences an appearance covers. Deliberately NOT everything in
     prefs: a preset that carried `tab` would move you to a different page, and one
     that carried `pinned` would rearrange your strip, neither of which is what
     "apply this look" means. */
  var PRESET_KEYS = ["theme", "accent", "font", "fontScale", "density"];

  function presets() {
    if (!prefs.presets || typeof prefs.presets !== "object") { prefs.presets = {}; }
    return prefs.presets;
  }

  function currentAppearance() {
    var out = {};
    PRESET_KEYS.forEach(function (k) { out[k] = prefs[k]; });
    return out;
  }

  function savePreset(name) {
    var clean = String(name || "").trim();
    if (!clean) { return null; }
    var all = presets();
    var existed = Object.prototype.hasOwnProperty.call(all, clean);
    all[clean] = currentAppearance();
    savePref("presets", all);
    toast(
      "success",
      existed ? "Replaced “" + clean + "”" : "Saved “" + clean + "”",
      existed
        ? "A preset by that name already existed, and the copy you had is gone."
        : PRESET_KEYS.join(", ") + " — the look, not the page you are on."
    );
    return clean;
  }

  function applyPreset(name) {
    var p = presets()[name];
    if (!p) { toast("error", "No preset called “" + name + "”", "It may have been deleted in another tab."); return; }
    /* Only keys this build understands are applied, and anything else in a stored
       preset is left where it is rather than being written blindly into prefs. */
    PRESET_KEYS.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(p, k)) { savePref(k, p[k]); }
    });
    applyAppearance();
    renderActive();
    toast("success", "Applied “" + name + "”", "Every element wearing it now.");
  }

  function deletePreset(name) {
    var all = presets();
    if (!Object.prototype.hasOwnProperty.call(all, name)) { return; }
    var gone = all[name];
    delete all[name];
    savePref("presets", all);
    /* Deleting is one click, so it gets an undo rather than a confirmation dialog:
       a blocking prompt for something this cheap to reverse is the wrong trade. */
    toast("success", "Deleted “" + name + "”", "", );
    var host = $("toasts");
    if (host && host.lastChild) {
      var undo = el("button", { type: "button", "class": "linkchip" }, "Undo");
      undo.addEventListener("click", function () {
        var back = presets();
        back[name] = gone;
        savePref("presets", back);
        renderActive();
        toast("success", "Restored “" + name + "”");
      });
      host.lastChild.appendChild(undo);
    }
  }

  function exportPresets() {
    var doc = {
      format: PRESET_FORMAT,
      version: PRESET_VERSION,
      exportedAt: new Date().toISOString(),
      current: currentAppearance(),
      presets: presets()
    };
    var blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "codex-studio-site-appearance.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("success", "Exported", Object.keys(presets()).length + " preset(s) and the current look, as a file you can keep or share.");
  }

  function importPresets(file) {
    var reader = new FileReader();
    reader.onerror = function () {
      toast("error", "That file could not be read", file.name + " — nothing was imported and your look is untouched.");
    };
    reader.onload = function () {
      var doc;
      try { doc = JSON.parse(String(reader.result || "")); }
      catch (e) {
        toast("error", "That is not an appearance file", file.name + " does not parse as JSON: " + e.message);
        return;
      }
      if (!doc || doc.format !== PRESET_FORMAT) {
        toast("error", "That is not an appearance file", "Expected format “" + PRESET_FORMAT + "”, found “" + (doc && doc.format) + "”.");
        return;
      }
      /* Never silently drop what it cannot represent: every rejection is named with the
         reason, so the reader can tell a value that was ignored from one that was
         applied. A theme that quietly loses half its settings is worse than one that
         refuses outright, because there is no way to tell which half went. */
      var dropped = [];
      var kept = 0;
      var incoming = doc.presets && typeof doc.presets === "object" ? doc.presets : {};
      var all = presets();
      Object.keys(incoming).forEach(function (name) {
        var p = incoming[name];
        if (!p || typeof p !== "object") { dropped.push(name + ": not a set of appearance values"); return; }
        var clean = {};
        Object.keys(p).forEach(function (k) {
          if (PRESET_KEYS.indexOf(k) === -1) { dropped.push(name + "." + k + ": this build has no such setting"); return; }
          clean[k] = p[k];
        });
        if (!Object.keys(clean).length) { dropped.push(name + ": nothing in it applies here"); return; }
        all[name] = clean;
        kept += 1;
      });
      savePref("presets", all);
      renderActive();
      if (dropped.length) {
        toast("warning", "Imported " + kept + ", with " + dropped.length + " value(s) left out",
          dropped.slice(0, 6).join("\n") + (dropped.length > 6 ? "\n…and " + (dropped.length - 6) + " more" : ""));
      } else {
        toast("success", "Imported " + kept + " preset" + (kept === 1 ? "" : "s"), "From " + file.name + ".");
      }
    };
    reader.readAsText(file);
  }

  /** The presets card for the settings panel. */
  function renderPresets() {
    var card = el("div", { "class": "card" });
    card.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Named presets"));
    card.appendChild(el("p", { "class": "section-note" }, inline(
      "Save the current look under a name, apply one, or carry them to another machine as a file. A preset holds " +
      "**theme, accent, font, font scale and density** — the look, not which page you happen to be reading.")));

    var names = Object.keys(presets()).sort();
    var list = el("div", { "class": "sheet__bar" });
    if (!names.length) {
      list.appendChild(el("span", { "class": "section-note" }, "No presets saved yet."));
    }
    names.forEach(function (name) {
      var row = el("span", { "class": "chip", style: "display:inline-flex;gap:6px;align-items:center" });
      var apply = el("button", { type: "button", "class": "trans__copy", title: "Apply “" + name + "”" }, esc(name));
      apply.addEventListener("click", function () { applyPreset(name); });
      var del = el("button", { type: "button", "class": "trans__copy", "aria-label": "Delete the preset “" + name + "”", title: "Delete" }, "✕");
      del.addEventListener("click", function () { deletePreset(name); renderActive(); });
      row.appendChild(apply);
      row.appendChild(del);
      list.appendChild(row);
    });
    card.appendChild(list);

    var actions = el("div", { "class": "sheet__bar" });
    var save = el("button", { type: "button", "class": "linkchip linkchip--next" }, "Save the current look…");
    save.addEventListener("click", function () {
      var name = window.prompt("Name this preset", "Preset " + (Object.keys(presets()).length + 1));
      if (name === null) { return; }
      if (savePreset(name)) { renderActive(); }
    });
    var out = el("button", { type: "button", "class": "linkchip" }, "Export to a file");
    out.addEventListener("click", exportPresets);
    var inBtn = el("button", { type: "button", "class": "linkchip" }, "Import a file");
    inBtn.addEventListener("click", function () {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.addEventListener("change", function () {
        var f = input.files && input.files[0];
        if (f) { importPresets(f); }
      });
      input.click();
    });
    actions.appendChild(save);
    actions.appendChild(out);
    actions.appendChild(inBtn);
    card.appendChild(actions);
    return card;
  }

  function renderPicker() {
    var card = el("div", { "class": "card" });
    card.appendChild(el("h3", { "class": "section-title", style: "font-size:1.05rem" }, "Accent colour"));
    card.appendChild(el("p", { "class": "section-note" }, inline(
      "A continuous field, not a fixed swatch list: drag anywhere in the square for saturation and value, use the hue " +
      "slider for the rest of the spectrum, or type an exact value in any notation the translator writes. It shows the " +
      "same colour in twelve, plus the named colours when one matches, with a WCAG contrast ratio against the page " +
      "surface. Every row copies.")));

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
    /* One field, every notation. Three fields that each read one space meant the
       panel could print `oklch(0.85 0.06 300)` and then refuse that exact string,
       because nothing was listening for it. */
    var anyIn = el("input", {
      type: "text", "class": "plain", size: "34",
      "aria-label": "Colour value in any notation the translator writes",
      placeholder: "#D0BCFF, rgb(208 188 255), oklch(0.85 0.06 300), plum…",
      value: colour.rgbToHex(rgb).toUpperCase()
    });
    var hexIn = anyIn;
    entry.appendChild(anyIn);
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
        /* A button, not a <dd> with a click handler: twelve values a keyboard user
           cannot reach is a list to read, not a translator to use. Each is named for
           its own space so a screen reader does not announce twelve identical
           "Copy" controls. */
        var dd = el("dd");
        var copy = el("button", {
          type: "button", "class": "trans__copy",
          "aria-label": "Copy the " + row[0] + " value, " + row[1],
          title: "Copy the " + row[0] + " value"
        }, esc(row[1]));
        copy.addEventListener("click", function () {
          copyText(row[1], row[0]);
        });
        dd.appendChild(copy);
        dl.appendChild(dd);
      });

      var surfaceHex = readSurfaceHex();
      var ratio = colour.contrast(c, colour.hexToRgb(surfaceHex) || { r: 255, g: 255, b: 255 });
      var pass = ratio >= 4.5;
      contrast.innerHTML = "Contrast against the page surface (" + esc(surfaceHex) + "): <strong>" +
        ratio.toFixed(2) + ":1</strong> <span class=\"badge " + (pass ? "badge--pass" : "badge--fail") + "\">" +
        (ratio >= 7 ? "AAA text" : pass ? "AA text" : ratio >= 3 ? "AA large text only" : "below AA") + "</span>";

      if (syncFields !== false) {
        anyIn.value = hex;
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

    anyIn.addEventListener("change", function () {
      var parsed = colour.parse(anyIn.value);
      if (!parsed) {
        toast(
          "error",
          "That is not a colour this reads",
          "Every notation in the list below parses: hex, hex8, rgb, hsl, hsv, hwb, lab, lch, oklab, oklch, cmyk, " +
            "and the named colours. Both the comma form and the space form work."
        );
        paint();
        return;
      }
      hsv = colour.rgbToHsv(colour.hexToRgb(parsed));
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
    wireFindTabs();
    applyElementAppearance();

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
