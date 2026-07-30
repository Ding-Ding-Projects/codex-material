"use strict";
/* Electron main process for the UI audit harness.
 *
 * Loads the REAL frontend with the REAL preload and the REAL electron/commands.js
 * backend, then sweeps a matrix of viewport widths, zoom factors, language modes and
 * nav sections. For each cell it runs an in-page audit and collects layout and
 * accessibility findings with their measured numbers.
 *
 * Nothing is mocked and nothing is fixed: this file only measures. The findings go to
 * assets/audit/ui-audit.json for whoever owns the template. */

const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUT = process.env.CODEX_STUDIO_AUDIT_DIR || path.join(ROOT, "assets", "audit");

/* A throwaway profile directory. The audit drives CX.i18n.setMode / setFunny, which
 * persist to localStorage — pointed at the shipped userData path this run would
 * silently rewrite the operator's own language and funny-level preferences. It also
 * makes the sweep reproducible: every run starts from the shipped defaults. */
const PROFILE = path.join(os.tmpdir(), "codex-studio-ui-audit");
try {
  fs.rmSync(PROFILE, { recursive: true, force: true });
} catch {
  /* a locked leftover profile is not worth failing the run over */
}
app.setPath("userData", PROFILE);

// Required after setPath, so the backend registers against the same app instance the
// window belongs to.
const commands = require(path.join(ROOT, "electron", "commands.js"));

/* The ten nav sections, in the order app/index.html's NAV declares them. */
const SECTIONS = [
  { id: "chat", label: "Chats" },
  { id: "console", label: "Console" },
  { id: "ext", label: "Extend" },
  { id: "settings", label: "Config" },
  { id: "cost", label: "Cost" },
  { id: "runtime", label: "Runtime" },
  { id: "health", label: "Health" },
  { id: "history", label: "History" },
  { id: "changelog", label: "Changelog" },
  { id: "studio", label: "Studio" },
];

/** Overlays left open by the previous cell would be measured as part of the next
 *  section. Every cell starts from the same cleared state. */
const RESET = {
  regexOpen: false, appearOpen: false, bulkOpen: false, centreOpen: false,
  dimSum: null, menu: null, dd: null, paletteOpen: false, slashOpen: false,
  theme: "dark", clogQuery: "", clogRegex: null, studioQuery: "", healthView: "doctor",
  listQuery: "", listRegex: null, extCat: "mcp", extQuery: "", extRegex: null,
  setSection: "model", setQuery: "", setRegex: null, consoleSub: "exec", historyKind: "all",
};

/** The report is committed to a public repository, so nothing in it may carry the
 *  operator's identity. The fixture CODEX_HOME keeps real session names out in the
 *  first place; this is the second line of defence for any absolute path that still
 *  reaches an element's text. */
function redact(text) {
  const home = os.homedir();
  let out = text;
  for (const form of [home.replace(/\\/g, "\\\\"), home.replace(/\\/g, "/"), home]) {
    if (form) out = out.split(form).join("<home>");
  }
  let user = "";
  try {
    user = String(os.userInfo().username || "");
  } catch {
    /* no account information available; the home-directory pass still applies */
  }
  if (user.length >= 4) out = out.split(user).join("<user>");
  return out;
}

/** Which tree this run measured. The frontend is edited by other work in parallel,
 *  so a finding without the exact commit and file digest behind it is unfalsifiable:
 *  a reader cannot tell a fixed defect from a stale report. */
function provenance() {
  const crypto = require("node:crypto");
  const digest = (rel) => {
    try {
      return crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, rel))).digest("hex").slice(0, 16);
    } catch {
      return "missing";
    }
  };
  let head = "unknown";
  let dirty = null;
  try {
    const { execFileSync } = require("node:child_process");
    const opts = { cwd: ROOT, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] };
    head = execFileSync("git", ["rev-parse", "--short", "HEAD"], opts).trim();
    dirty = execFileSync("git", ["status", "--porcelain", "app", "electron"], opts).trim().length > 0;
  } catch {
    /* not a checkout, or no git on PATH — the digests below still pin the files */
  }
  return {
    head: head,
    frontendUncommitted: dirty,
    sha256: {
      "app/index.html": digest("app/index.html"),
      "app/codex-core.js": digest("app/codex-core.js"),
      "app/cx-i18n.js": digest("app/cx-i18n.js"),
      "app/cx-tabs.js": digest("app/cx-tabs.js"),
      "app/support.js": digest("app/support.js"),
    },
  };
}

function list(env, fallback) {
  const raw = String(process.env[env] || "").trim() || fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

const WIDTHS = list("CODEX_STUDIO_AUDIT_WIDTHS", "960,1280,1920").map(Number).filter((n) => n > 0);
const ZOOMS = list("CODEX_STUDIO_AUDIT_ZOOMS", "1,1.25,1.5,2").map(Number).filter((n) => n > 0);
const LANGS = list("CODEX_STUDIO_AUDIT_LANGS", "en,bi");
const ONLY = String(process.env.CODEX_STUDIO_AUDIT_ONLY || "").trim();
const HEIGHT = Number(process.env.CODEX_STUDIO_AUDIT_HEIGHT || 900);
const FUNNY = Number(process.env.CODEX_STUDIO_AUDIT_FUNNY || 5);
const SETTLE = Number(process.env.CODEX_STUDIO_AUDIT_SETTLE || 260);

const sections = ONLY ? SECTIONS.filter((s) => s.id === ONLY) : SECTIONS;

/* Contrast and focus visibility are viewport-invariant and the focus sweep forces a
 * style recalculation per element, so both run in one reference cell per section and
 * language rather than in all of them. */
const DEEP_WIDTH = WIDTHS.indexOf(1280) >= 0 ? 1280 : WIDTHS[0];
const DEEP_ZOOM = ZOOMS.indexOf(1) >= 0 ? 1 : ZOOMS[0];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------ the in-page audit */

/* Everything in this function runs INSIDE the renderer. It is stringified with
 * Function.prototype.toString and evaluated there, so it must close over nothing
 * from this file and must return only JSON-safe values. Writing it as a real
 * function rather than a string literal keeps `node --check` honest about it. */
function auditInPage(opts) {
  "use strict";

  const MIN = opts.minTarget;
  const findings = [];
  const notes = [];
  const styles = new Map();

  const cs = (el) => {
    let v = styles.get(el);
    if (!v) {
      v = getComputedStyle(el);
      styles.set(el, v);
    }
    return v;
  };

  /** A path a human can paste into devtools. nth-of-type rather than nth-child so it
   *  survives the runtime's placeholder nodes. */
  function sel(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 9) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(part + "#" + node.id);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const same = Array.prototype.filter.call(parent.children, (c) => c.tagName === node.tagName);
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  }

  function txt(el, max) {
    const raw = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (raw) return raw.length > max ? raw.slice(0, max) + "…" : raw;
    const alt = el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("placeholder") || "";
    const s = alt.replace(/\s+/g, " ").trim();
    return s.length > max ? s.slice(0, max) + "…" : s;
  }

  function visible(el) {
    const s = cs(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0.5 && r.height > 0.5;
  }

  /** The nearest ancestor that both clips its overflow and sits inside the viewport,
   *  i.e. the thing that actually cuts this element off before the page edge does. */
  function clipper(el) {
    let n = el.parentElement;
    while (n && n !== document.documentElement) {
      const s = cs(n);
      if ((s.overflowX !== "visible" || s.overflowY !== "visible") &&
          n.getBoundingClientRect().right <= window.innerWidth + 1) {
        return n;
      }
      n = n.parentElement;
    }
    return null;
  }

  function add(check, severity, el, message, measured) {
    findings.push({
      check: check,
      severity: severity,
      selector: sel(el),
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || "",
      appear: el.getAttribute("data-appear") || "",
      text: txt(el, 70),
      message: message,
      measured: measured || {},
    });
  }

  const all = Array.prototype.slice.call(document.querySelectorAll("body *"))
    .filter((el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE");
  const shown = all.filter(visible);
  const vw = window.innerWidth;
  const docWidth = document.documentElement.scrollWidth;

  /* ---- 1. horizontal overflow -------------------------------------------- */

  const pageOverflows = docWidth > vw + 1;
  const past = new Set();
  for (const el of shown) {
    if (el.getBoundingClientRect().right > vw + 1) past.add(el);
  }
  let escaped = 0;
  let cut = 0;
  for (const el of past) {
    // Every ancestor of an overflowing element overflows too. Reporting the whole
    // chain buries the one selector worth acting on, so only the innermost offender
    // — the element that actually holds the text at the edge — is filed.
    if (Array.prototype.some.call(el.children, (c) => past.has(c))) continue;
    const r = el.getBoundingClientRect();
    if (cs(el).position === "fixed" && r.left >= vw) continue;
    const clip = clipper(el);
    // Three ways to run off the edge, and only one of them is a defect: an ancestor
    // that scrolls leaves the content reachable, an ancestor that ellipsises it
    // truncates on purpose, and an ancestor that just hides it loses it silently.
    let ellipsis = false;
    let reachable = false;
    for (let n = el; n && n !== clip && n.nodeType === 1; n = n.parentElement) {
      if (cs(n).textOverflow === "ellipsis") ellipsis = true;
    }
    if (clip) {
      const cstyle = cs(clip);
      if (cstyle.textOverflow === "ellipsis") ellipsis = true;
      reachable = cstyle.overflowX === "auto" || cstyle.overflowX === "scroll";
    }
    const measured = {
      right: Math.round(r.right * 10) / 10,
      viewportRight: vw,
      overhang: Math.round((r.right - vw) * 10) / 10,
      documentScrollWidth: docWidth,
      clippedBy: clip ? sel(clip) : null,
      clipperOverflowX: clip ? cs(clip).overflowX : null,
      ellipsisTruncated: ellipsis,
      scrollable: reachable,
    };
    if (pageOverflows && !clip) {
      escaped++;
      add("overflow", "high", el,
        "Extends past the right edge of the viewport with no clipping ancestor, and document.documentElement.scrollWidth exceeds innerWidth — the page itself overflows horizontally.",
        measured);
    } else {
      cut++;
      add("offscreen", "medium", el,
        ellipsis
          ? "Rendered past the right edge of the viewport, but an ancestor truncates it with text-overflow: ellipsis. Deliberate truncation rather than silent loss — read this one as evidence the label no longer fits, not as a defect on its own."
          : reachable
            ? "Rendered past the right edge of the viewport, inside an ancestor that scrolls. The content is still reachable, but only by scrolling sideways to it."
            : clip
              ? "Rendered past the right edge of the viewport and silently cut off by an ancestor's hidden overflow, with no ellipsis and nothing to scroll. The content is simply gone."
              : "Rendered past the right edge of the viewport. The page does not overflow — html and body both set overflow: hidden — so the content is cut away with nothing to scroll to it.",
        measured);
    }
  }
  if (pageOverflows && !escaped) {
    notes.push("document.documentElement.scrollWidth (" + docWidth + ") exceeds innerWidth (" + vw + ") but no innermost element was found past the edge.");
  }

  /* ---- 2. clipped text ---------------------------------------------------- */

  function ownsText(el) {
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim()) return true;
    }
    return false;
  }

  const FIELD = { INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1 };
  for (const el of shown) {
    const isField = FIELD[el.tagName] === 1;
    if (!ownsText(el) && !isField) continue;
    const s = cs(el);
    const hidesX = s.overflowX === "hidden" || s.overflowX === "clip";
    const hidesY = s.overflowY === "hidden" || s.overflowY === "clip";
    const ellipsis = s.textOverflow === "ellipsis";
    if (el.scrollWidth > el.clientWidth + 1 && hidesX && !ellipsis) {
      add("clipped-text", "medium", el,
        "Content is wider than the box and the overflow is hidden with no text-overflow: ellipsis, so it is silently cut mid-word.",
        { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, lost: el.scrollWidth - el.clientWidth, textOverflow: s.textOverflow, overflowX: s.overflowX });
    }
    const singleLine = s.whiteSpace === "nowrap" || el.tagName === "INPUT" || el.tagName === "SELECT";
    if (singleLine && el.scrollHeight > el.clientHeight + 1 && hidesY) {
      add("clipped-text", "medium", el,
        "A single-line control whose content is taller than its box, with the overflow hidden — the text is trimmed vertically.",
        { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, lost: el.scrollHeight - el.clientHeight, whiteSpace: s.whiteSpace, overflowY: s.overflowY });
    }
  }

  /* ---- 3. target size ----------------------------------------------------- */

  const TARGET_SEL = "button, [role=\"button\"], [role=\"tab\"], [role=\"switch\"], a, input, select";
  const targets = Array.prototype.slice.call(document.querySelectorAll(TARGET_SEL)).filter(visible);
  for (const el of targets) {
    if (el.tagName === "INPUT" && el.type === "hidden") continue;
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width * 10) / 10;
    const h = Math.round(r.height * 10) / 10;
    if (w >= MIN && h >= MIN) continue;
    add("target-size", "medium", el,
      "Rendered box is smaller than the " + MIN + "×" + MIN + " CSS px minimum pointer target.",
      { width: w, height: h, min: MIN, shortfall: Math.round(Math.max(MIN - w, MIN - h) * 10) / 10 });
  }

  /* ---- 4. accessible name -------------------------------------------------- */

  const INTERACTIVE_SEL = "button, a[href], input, select, textarea, [role=\"button\"], [role=\"tab\"], [role=\"switch\"], [role=\"checkbox\"], [role=\"menuitem\"], [role=\"link\"]";
  const interactive = Array.prototype.slice.call(document.querySelectorAll(INTERACTIVE_SEL)).filter(visible);

  function labelledBy(el) {
    const ids = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    for (const id of ids) {
      const ref = document.getElementById(id);
      if (ref && (ref.textContent || "").trim()) return true;
    }
    return false;
  }

  function wrappedLabel(el) {
    if (el.id && document.querySelector("label[for=\"" + el.id.replace(/"/g, "") + "\"]")) return true;
    return !!el.closest("label");
  }

  function altText(el) {
    for (const img of el.querySelectorAll("img,svg")) {
      if ((img.getAttribute("alt") || "").trim()) return true;
      if ((img.getAttribute("aria-label") || "").trim()) return true;
    }
    return false;
  }

  for (const el of interactive) {
    const own = (el.textContent || "").trim();
    const aria = (el.getAttribute("aria-label") || "").trim();
    const title = (el.getAttribute("title") || "").trim();
    const named = own || aria || title || labelledBy(el) || wrappedLabel(el) || altText(el);
    if (named) continue;
    const placeholder = (el.getAttribute("placeholder") || "").trim();
    const value = el.tagName === "INPUT" ? String(el.value || "").trim() : "";
    if (placeholder || value) {
      add("accessible-name", "medium", el,
        "No text, aria-label, aria-labelledby or title. Chromium falls back to the placeholder or value, which is a weak name that disappears the moment the field is filled in.",
        { placeholder: placeholder, value: value.slice(0, 40) });
      continue;
    }
    add("accessible-name", "high", el,
      "Interactive element with no accessible name at all: no text content, no aria-label, no aria-labelledby, no title.",
      { html: el.outerHTML.replace(/\s+/g, " ").slice(0, 160) });
  }

  /* ---- 5. tab semantics ---------------------------------------------------- */

  const tablists = Array.prototype.slice.call(document.querySelectorAll("[role=\"tablist\"]"));
  const seenTabs = new Set();
  for (const strip of tablists) {
    const named = (strip.getAttribute("aria-label") || "").trim() || (strip.getAttribute("title") || "").trim() || labelledBy(strip);
    if (!named) {
      add("tab-semantics", "high", strip,
        "role=\"tablist\" with no accessible name: aria-label, aria-labelledby and title are all absent.",
        { tabs: strip.querySelectorAll("[role=\"tab\"]").length });
    }
    const tabs = Array.prototype.slice.call(strip.querySelectorAll("[role=\"tab\"]")).filter(visible);
    tabs.forEach((t) => seenTabs.add(t));
    let zeroIndex = 0;
    for (const tab of tabs) {
      if (tab.tabIndex === 0) zeroIndex++;
      if (!tab.hasAttribute("aria-selected")) {
        add("tab-semantics", "high", tab, "role=\"tab\" with no aria-selected, so no screen reader can report which tab is current.", {});
      }
      const controls = (tab.getAttribute("aria-controls") || "").trim();
      if (!controls) {
        add("tab-semantics", "high", tab, "role=\"tab\" with no aria-controls, so it is not linked to the panel it opens.", { ariaSelected: tab.getAttribute("aria-selected") });
      } else if (!document.getElementById(controls)) {
        add("tab-semantics", "high", tab, "aria-controls points at an element id that does not exist in the document.", { ariaControls: controls });
      }
    }
    if (tabs.length && zeroIndex !== 1) {
      add("tab-semantics", "high", strip,
        "Roving focus is not in place: a tablist must expose exactly one tab stop, with the other tabs at tabIndex -1 and reached with the arrow keys.",
        { tabs: tabs.length, tabIndexZero: zeroIndex });
    }
  }
  const orphanTabs = Array.prototype.slice.call(document.querySelectorAll("[role=\"tab\"]"))
    .filter(visible)
    .filter((t) => !seenTabs.has(t) && !t.closest("[role=\"tablist\"]"));
  for (const tab of orphanTabs) {
    add("tab-semantics", "high", tab, "role=\"tab\" outside any role=\"tablist\" container.", {});
  }

  /* ---- 6. contrast --------------------------------------------------------- */

  function parseColor(v) {
    const m = /^rgba?\(([^)]+)\)$/.exec(String(v).trim());
    if (!m) return null;
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((n) => isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  const over = (fg, bg, a) => ({
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  });

  function luminance(c) {
    const chan = (v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
  }

  function contrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  /** Composite every background layer from the page canvas up to this element. */
  function backdrop(el) {
    const layers = [];
    let n = el;
    while (n && n.nodeType === 1) {
      const c = parseColor(cs(n).backgroundColor);
      if (c && c.a > 0) layers.push(c);
      n = n.parentElement;
    }
    const html = parseColor(getComputedStyle(document.documentElement).backgroundColor);
    let base = html && html.a >= 0.999 ? { r: html.r, g: html.g, b: html.b } : { r: 255, g: 255, b: 255 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base, Math.min(1, layers[i].a));
    return base;
  }

  /** Alpha the text is actually drawn at: its own alpha times every ancestor opacity. */
  function inkAlpha(el, colorAlpha) {
    let a = colorAlpha;
    let n = el;
    while (n && n.nodeType === 1) {
      const o = parseFloat(cs(n).opacity);
      if (!isNaN(o)) a *= o;
      n = n.parentElement;
    }
    return a;
  }

  let unparsed = 0;
  let contrastChecked = 0;
  let minRatio = null;
  if (opts.contrast) {
    for (const el of shown) {
      if (!ownsText(el)) continue;
      const s = cs(el);
      const fg = parseColor(s.color);
      if (!fg) {
        unparsed++;
        continue;
      }
      const bg = backdrop(el);
      const alpha = Math.min(1, Math.max(0, inkAlpha(el, fg.a)));
      if (alpha <= 0) continue;
      contrastChecked++;
      const ink = over(fg, bg, alpha);
      const size = parseFloat(s.fontSize) || 16;
      const weight = Number(s.fontWeight) || (s.fontWeight === "bold" ? 700 : 400);
      const large = size >= 18.66 || (size >= 14 && weight >= 700);
      const need = large ? 3 : 4.5;
      const ratio = contrast(ink, bg);
      // The margin matters as much as the verdict: "no failures" reads very
      // differently when the closest pair sits at 4.6:1 than at 12:1.
      if (minRatio === null || ratio < minRatio) minRatio = Math.round(ratio * 100) / 100;
      if (ratio + 0.005 >= need) continue;
      add("contrast", "medium", el,
        "Text contrast " + (Math.round(ratio * 100) / 100) + ":1 against its composited background is below the " + need + ":1 WCAG 2.1 AA minimum for this size.",
        {
          ratio: Math.round(ratio * 100) / 100,
          required: need,
          fontSizePx: size,
          fontWeight: weight,
          largeText: large,
          color: s.color,
          effectiveOpacity: Math.round(alpha * 1000) / 1000,
          inkRgb: "rgb(" + [ink.r, ink.g, ink.b].map((v) => Math.round(v)).join(", ") + ")",
          backgroundRgb: "rgb(" + [bg.r, bg.g, bg.b].map((v) => Math.round(v)).join(", ") + ")",
        });
    }
    if (unparsed) notes.push(unparsed + " element(s) had a computed colour this harness could not parse and were skipped by the contrast check.");
  }

  /* ---- 7. focus visibility -------------------------------------------------- */

  let focusChecked = 0;
  let focusIndicated = 0;
  const hasFocus = document.hasFocus();
  if (opts.focus) {
    // Chromium only matches :focus (and therefore :focus-visible, and therefore the
    // UA focus ring) while the document itself holds focus. Without this the sweep
    // would report every element as having no focus indicator, which is a harness
    // artefact rather than a defect — so say so instead of filing 200 false findings.
    if (!hasFocus) notes.push("document.hasFocus() was false, so :focus never matched and no focus indicator could be observed. The focus-visible findings from this cell are harness artefacts, not defects.");
    const FOCUS_SEL = "a[href], button, input:not([type=\"hidden\"]), select, textarea, [tabindex], [role=\"button\"], [role=\"tab\"], [role=\"switch\"]";
    const focusable = Array.prototype.slice.call(document.querySelectorAll(FOCUS_SEL))
      .filter((el) => el.getAttribute("tabindex") !== "-1" && !el.disabled)
      .filter(visible);
    const snap = (el) => {
      const s = getComputedStyle(el);
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        backgroundColor: s.backgroundColor,
        color: s.color,
        textDecorationLine: s.textDecorationLine,
      };
    };
    const before0 = document.activeElement;
    for (const el of focusable) {
      const before = snap(el);
      try {
        el.focus({ preventScroll: true });
      } catch {
        continue;
      }
      if (document.activeElement !== el) continue;
      focusChecked++;
      const after = snap(el);
      const ring = after.outlineStyle !== "none" && after.outlineWidth !== "0px";
      const shadow = after.boxShadow !== "none" && after.boxShadow !== before.boxShadow;
      const changed = Object.keys(after).some((k) => after[k] !== before[k]);
      if (ring || shadow || changed) {
        focusIndicated++;
      } else if (hasFocus) {
        add("focus-visible", "medium", el,
          "Focusing this element changes nothing a sighted keyboard user can see: outline-style is \"" + after.outlineStyle + "\", box-shadow is \"" + after.boxShadow + "\", and no border, background or colour moved.",
          {
            outlineStyle: after.outlineStyle,
            outlineWidth: after.outlineWidth,
            boxShadow: after.boxShadow,
            focusVisible: typeof el.matches === "function" && (function () {
              try {
                return el.matches(":focus-visible");
              } catch {
                return null;
              }
            })(),
          });
      }
      try {
        el.blur();
      } catch {
        /* blurring a detached element is not interesting */
      }
    }
    if (before0 && typeof before0.focus === "function") {
      try {
        before0.focus({ preventScroll: true });
      } catch {
        /* nothing to restore focus to */
      }
    }
    if (hasFocus && focusChecked && !focusIndicated) {
      notes.push("Not one of the " + focusChecked + " focusable elements showed any focus indicator, which is unusual enough to be worth re-checking by hand before acting on it.");
    }
  }

  return {
    findings: findings,
    notes: notes,
    stats: {
      elements: all.length,
      visible: shown.length,
      interactive: interactive.length,
      targets: targets.length,
      tablists: tablists.length,
      tabs: seenTabs.size + orphanTabs.length,
      innerWidth: vw,
      innerHeight: window.innerHeight,
      documentScrollWidth: docWidth,
      pageOverflows: pageOverflows,
      escapedRight: escaped,
      cutOffRight: cut,
      contrastChecked: contrastChecked,
      minContrastRatio: minRatio,
      documentHasFocus: hasFocus,
      focusChecked: focusChecked,
      focusIndicated: focusIndicated,
    },
  };
}

/* ------------------------------------------------------------------- the sweep */

/** Findings repeat across the matrix — one nameless button is the same defect at
 *  every width. Collapse on identity and record where each was seen instead. */
function key(f) {
  return [f.check, f.selector, f.text, f.message].join("");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({
    width: Math.max(...WIDTHS),
    height: HEIGHT,
    x: -32000,
    y: -32000,
    show: false,
    frame: false,
    skipTaskbar: true,
    // Unlike the screenshot harness this window has to be focusable: :focus, and so
    // :focus-visible and the UA focus ring, only match while the document holds
    // focus. focusOnWebView() below hands focus to the render widget without ever
    // activating the window on the desktop.
    focusable: true,
    paintWhenInitiallyHidden: true,
    backgroundColor: "#141218",
    webPreferences: {
      preload: path.join(ROOT, "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });
  // Headless, but composited. A window created with `show: false` is never painted,
  // so every measurement comes back from a stale frame — element boxes lag one cell
  // behind the state they are supposed to describe. Showing it far off-screen keeps
  // the compositor running without putting a pixel on a monitor anyone can see.
  win.showInactive();
  win.focusOnWebView();

  commands.setWindow(win);

  const errors = [];
  win.webContents.on("console-message", (_e, level, message) => {
    if (level >= 2) errors.push(message);
  });
  win.webContents.on("render-process-gone", (_e, details) => errors.push(`renderer gone: ${details.reason}`));

  await win.loadFile(path.join(ROOT, "app", "index.html"));
  // The design-compiler runtime has to compile the template, mount React and finish
  // the first backend round trip before anything measured here means anything.
  await wait(3500);

  const hooked = await win.webContents.executeJavaScript(`
    (() => {
      window.__setState = (patch) => {
        if (!window.__cxRoot) return false;
        window.__cxRoot.setState(patch);
        return true;
      };
      return !!window.__cxRoot;
    })()
  `);
  if (!hooked) {
    throw new Error("the app did not publish window.__cxRoot — no surface can be driven, so nothing can be audited");
  }

  // Both funny sliders at their maximum: level 5 produces the longest copy the app
  // can render, which is the case clipping and overflow actually fail at.
  await win.webContents.executeJavaScript(
    `(() => { CX.i18n.setFunny("en", ${FUNNY}); CX.i18n.setFunny("yue", ${FUNNY}); return CX.i18n.funny; })()`,
  );

  const auditSource = "(" + auditInPage.toString() + ")";
  const merged = new Map();
  const cells = [];
  let highTotal = 0;

  for (const width of WIDTHS) {
    for (const zoom of ZOOMS) {
      win.setContentSize(width, HEIGHT);
      win.webContents.setZoomFactor(zoom);
      await wait(120);
      for (const lang of LANGS) {
        for (const section of sections) {
          await win.webContents.executeJavaScript(
            `(() => { document.documentElement.setAttribute("data-theme","dark"); if (window.CX && window.CX.notify) window.CX.notify.dismissAll(); window.CX.i18n.setMode(${JSON.stringify(lang)}); return window.__setState(${JSON.stringify(Object.assign({}, RESET, { lang: lang, nav: section.id }))}); })()`,
          );
          await wait(SETTLE);
          await win.webContents.executeJavaScript(
            "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))",
          );
          // Contrast and focus behaviour do not vary with the viewport, and the focus
          // sweep is by far the most expensive check — run both once per section and
          // language rather than once per cell.
          const deep = zoom === DEEP_ZOOM && width === DEEP_WIDTH;
          if (deep) win.focusOnWebView();
          const opts = { minTarget: 24, focus: deep, contrast: deep };
          const result = await win.webContents.executeJavaScript(auditSource + "(" + JSON.stringify(opts) + ")");
          const cell = { width, zoom, lang, section: section.id, deep, stats: result.stats, notes: result.notes, findings: result.findings.length };
          cells.push(cell);
          for (const note of result.notes) errors.push(`${section.id} ${width}@${zoom} ${lang}: ${note}`);
          for (const f of result.findings) {
            if (f.severity === "high") highTotal++;
            const k = key(f);
            let entry = merged.get(k);
            if (!entry) {
              entry = {
                check: f.check,
                severity: f.severity,
                selector: f.selector,
                tag: f.tag,
                role: f.role,
                appear: f.appear,
                text: f.text,
                message: f.message,
                measured: f.measured,
                worst: f.measured,
                count: 0,
                sections: [],
                widths: [],
                zooms: [],
                langs: [],
                firstSeen: { section: section.id, width, zoom, lang },
              };
              merged.set(k, entry);
            }
            entry.count++;
            if (entry.sections.indexOf(section.id) < 0) entry.sections.push(section.id);
            if (entry.widths.indexOf(width) < 0) entry.widths.push(width);
            if (entry.zooms.indexOf(zoom) < 0) entry.zooms.push(zoom);
            if (entry.langs.indexOf(lang) < 0) entry.langs.push(lang);
            entry.worst = worseOf(f.check, entry.worst, f.measured);
          }
          process.stdout.write(
            `${section.id.padEnd(10)} ${String(width).padStart(4)}px @${String(zoom).padEnd(4)} ${lang}  ${String(result.findings.length).padStart(3)} finding(s)${deep ? "  [+contrast +focus]" : ""}\n`,
          );
        }
      }
    }
  }

  const RANK = { high: 0, medium: 1, low: 2 };
  const findings = [...merged.values()].sort((a, b) => {
    if (RANK[a.severity] !== RANK[b.severity]) return RANK[a.severity] - RANK[b.severity];
    if (a.check !== b.check) return a.check < b.check ? -1 : 1;
    return b.count - a.count;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    harness: "tools/audit-ui.mjs + tools/audit-ui-main.cjs",
    auditedFrom: "the real app — app/index.html with electron/preload.js and electron/commands.js",
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    tree: provenance(),
    matrix: {
      widths: WIDTHS,
      zooms: ZOOMS,
      langs: LANGS,
      sections: sections.map((s) => s.id),
      windowContentHeight: HEIGHT,
      funnyLevel: FUNNY,
      theme: "dark",
      deepCellAt: { width: DEEP_WIDTH, zoom: DEEP_ZOOM },
      cells: cells.length,
      deepCells: cells.filter((c) => c.deep).length,
      codexHome: process.env.CODEX_STUDIO_AUDIT_FIXTURE
        ? "a deterministic fixture built by tools/audit-ui.mjs — six synthetic sessions, two MCP servers, one hook, one extra profile"
        : "the operator's real CODEX_HOME (--codex-home); this run's element text is machine-specific",
    },
    checks: {
      overflow: "document.documentElement.scrollWidth > innerWidth + 1, reported per element that escapes the viewport's right edge with no clipping ancestor. severity: high",
      offscreen: "element rendered past the viewport's right edge but cut off by an ancestor's overflow. severity: medium",
      "clipped-text": "scrollWidth > clientWidth + 1 with overflow hidden and no text-overflow: ellipsis, or scrollHeight > clientHeight + 1 on a single-line control. severity: medium",
      "target-size": "button / [role=button] / [role=tab] / [role=switch] / a / input / select rendered under 24x24 CSS px. severity: medium",
      "accessible-name": "interactive element with no text, aria-label, aria-labelledby, title, wrapping label or descendant alt. high when nothing at all names it, medium when only a placeholder or value does",
      "tab-semantics": "[role=tab] needs aria-selected and a resolvable aria-controls; [role=tablist] needs an accessible name and exactly one tab at tabIndex 0. severity: high",
      contrast: "computed colour composited over the nearest opaque background ancestor, WCAG 2.1 relative-luminance ratio, flagged under 4.5:1 (3:1 at >= 18.66px, or >= 14px bold). severity: medium",
      "focus-visible": "each interactive element focused in turn; flagged when outline-style is none or zero-width, box-shadow is none, and no border, background or colour changed. severity: medium",
    },
    coverage: coverage(cells),
    summary: summarise(findings),
    findings,
    cells,
    consoleErrors: errors,
  };

  fs.writeFileSync(path.join(OUT, "ui-audit.json"), redact(JSON.stringify(report, null, 2)));
  printSummary(report, highTotal);

  win.destroy();
  app.quit();
  // 2 gates CI on a high-severity finding; 1 is reserved for the harness itself
  // failing, so a green run and a broken run can never be confused.
  process.exit(report.summary.bySeverity.high ? 2 : 0);
}

/** Keep the worst number seen for a check so `worst` means something per check. */
function worseOf(check, a, b) {
  if (!a) return b;
  if (!b) return a;
  if (check === "overflow" || check === "offscreen") return (b.overhang || 0) > (a.overhang || 0) ? b : a;
  if (check === "clipped-text") return (b.lost || 0) > (a.lost || 0) ? b : a;
  if (check === "target-size") return (b.shortfall || 0) > (a.shortfall || 0) ? b : a;
  if (check === "contrast") return (b.ratio || 99) < (a.ratio || 99) ? b : a;
  return a;
}

/** How much was actually looked at. A check that reports nothing is only reassuring
 *  next to the number of elements it examined to get there. */
function coverage(cells) {
  const deep = cells.filter((c) => c.deep);
  const sum = (rows, pick) => rows.reduce((n, c) => n + (pick(c) || 0), 0);
  const ratios = deep.map((c) => c.stats.minContrastRatio).filter((v) => typeof v === "number");
  return {
    visibleElementsMeasured: sum(cells, (c) => c.stats.visible),
    pointerTargetsMeasured: sum(cells, (c) => c.stats.targets),
    interactiveElementsMeasured: sum(cells, (c) => c.stats.interactive),
    tabsMeasured: sum(cells, (c) => c.stats.tabs),
    cellsWhereThePageOverflowed: cells.filter((c) => c.stats.pageOverflows).length,
    textRunsMeasuredForContrast: sum(deep, (c) => c.stats.contrastChecked),
    lowestContrastRatioSeen: ratios.length ? Math.min(...ratios) : null,
    elementsFocused: sum(deep, (c) => c.stats.focusChecked),
    elementsThatShowedFocus: sum(deep, (c) => c.stats.focusIndicated),
  };
}

function tally(rows, pick) {
  const out = {};
  for (const row of rows) {
    for (const value of [].concat(pick(row))) {
      const k = String(value);
      out[k] = (out[k] || 0) + 1;
    }
  }
  return out;
}

function summarise(findings) {
  return {
    uniqueFindings: findings.length,
    totalOccurrences: findings.reduce((n, f) => n + f.count, 0),
    bySeverity: tally(findings, (f) => f.severity),
    byCheck: tally(findings, (f) => f.check),
    bySection: tally(findings, (f) => f.sections),
    byWidth: tally(findings, (f) => f.widths),
    byZoom: tally(findings, (f) => f.zooms),
    byLang: tally(findings, (f) => f.langs),
  };
}

function table(title, counts) {
  const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || (a < b ? -1 : 1));
  const width = Math.max(title.length, ...keys.map((k) => k.length), 8);
  const lines = [`  ${title.padEnd(width)}  count`, `  ${"-".repeat(width)}  -----`];
  for (const k of keys) lines.push(`  ${k.padEnd(width)}  ${String(counts[k]).padStart(5)}`);
  return lines.join("\n") + "\n";
}

function printSummary(report, highTotal) {
  const s = report.summary;
  process.stdout.write("\n" + "=".repeat(72) + "\n");
  process.stdout.write(`UI audit — ${s.uniqueFindings} unique finding(s) across ${report.matrix.cells} cells\n`);
  process.stdout.write(`${s.totalOccurrences} occurrence(s) in total; ${highTotal} of them severity high\n`);
  process.stdout.write("=".repeat(72) + "\n\n");
  process.stdout.write(table("severity", s.bySeverity));
  process.stdout.write("\n" + table("check", s.byCheck));
  process.stdout.write("\n" + table("nav section", s.bySection));
  process.stdout.write("\n" + table("viewport width", s.byWidth));
  process.stdout.write("\n" + table("zoom factor", s.byZoom));
  process.stdout.write("\n" + table("language mode", s.byLang));
  process.stdout.write(`\nWritten to ${path.join(OUT, "ui-audit.json")}\n`);
  const m = report.matrix;
  if (m.cells < 240) {
    // The committed report is the full sweep. A filtered run writes to the same path,
    // and a partial report that looks complete is worse than no report.
    process.stdout.write(
      `\n! This was a filtered run (${m.cells} cell(s), not 240) and it has REPLACED the full report.\n` +
        "! Re-run `node tools/audit-ui.mjs` with no filters before committing assets/audit/ui-audit.json.\n",
    );
  }
  if (report.consoleErrors.length) {
    process.stdout.write(`\nRenderer / harness reported ${report.consoleErrors.length} message(s):\n`);
    report.consoleErrors.slice(0, 10).forEach((e) => process.stdout.write(`  ${e}\n`));
  }
}

app.disableHardwareAcceleration();
app.whenReady().then(() =>
  main().catch((e) => {
    process.stderr.write(`audit failed: ${e && e.stack ? e.stack : e}\n`);
    app.quit();
    process.exit(1);
  }),
);
