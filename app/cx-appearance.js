/* Codex Studio — portable appearance documents and named presets.

   The live look of the app is one per-element map in localStorage, written by the
   anchored appearance editor. This module turns that map into a FILE and back
   again, so a customised appearance survives a reinstall and can be handed to
   someone else, and it owns the named presets that sit beside the live map.

   Three rules shape everything below, and breaking any of them is a data-loss bug
   rather than a cosmetic one:

   1. An import NEVER silently drops a value it cannot represent. A theme that
      quietly loses half its colours is worse than one that refuses outright,
      because the user has no way to tell which half went. Every rejection lands in
      `dropped` with the dotted key from their own file and the reason, and the
      caller is expected to show them.
   2. An imported document is untrusted input. Its strings end up in a style
      attribute, so a value carrying `<`, `javascript:` or `expression(` is refused
      and reported rather than sanitised — a value we had to rewrite is not the
      value its author meant, and guessing at their intent is how an injection gets
      through.
   3. A file from a NEWER format version imports what this build understands and
      warns about the rest. Refusing it outright loses everything; reading it loses
      only the parts that are named in `dropped` anyway. */
(function (g) {
  "use strict";

  var FORMAT = "codex-studio-appearance";
  var VERSION = 1;
  var KEY = "appearancePresets";

  var LIMITS = {
    bytes: 2000000,
    elements: 500,
    presets: 200,
    elementName: 120,
    presetName: 60,
    font: 200,
    size: { min: 10, max: 400 },
    weight: { min: 100, max: 900 }
  };

  /* Exactly the properties applyAppearance() reads back out of the map. An
     unknown key is reported rather than kept: carrying it forward would put a
     value in every future export that nothing on any build can apply. */
  var PROPERTIES = {
    font: "font",
    size: "size",
    weight: "weight",
    color: "color",
    italic: "flag",
    underline: "flag",
    strike: "flag",
    wide: "flag"
  };

  /* Fields this build writes or knowingly ignores. Anything else in an imported
     document is reported, which is how a value from a newer build becomes visible
     instead of vanishing. */
  var KNOWN_FIELDS = {
    format: true,
    version: true,
    exportedAt: true,
    app: true,
    elements: true,
    appearance: true,
    presets: true,
    dropped: true,
    warnings: true,
    note: true
  };

  /* Assigning to `__proto__` with `=` rewrites the object's prototype instead of
     adding a key, and JSON.parse happily produces that name — so a file could
     otherwise reach the prototype chain through a perfectly ordinary-looking
     element. Compared as strings on purpose: a lookup table cannot hold a
     `__proto__` key either, which is the same trap one level up. */
  function reservedKey(name) {
    return name === "__proto__" || name === "constructor" || name === "prototype";
  }

  /* Mirrors CX.color.hexToRgb: 3, 6 or 8 hex digits with an optional `#`. Spelled
     out here so the module still validates when it is loaded on its own. */
  var HEX = /^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

  var UNSAFE_TOKENS = ["<", ">", "javascript:", "expression(", "url(", "{", "}", ";"];

  function isObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
  }

  function typeOf(v) {
    if (v === null) return "null";
    if (v === undefined) return "nothing";
    if (Array.isArray(v)) return "an array";
    if (typeof v === "object") return "an object";
    if (typeof v === "string") return "text";
    return "a " + typeof v;
  }

  function text(v) {
    return typeof v === "string" && v.trim() ? v.trim() : null;
  }

  function numberOf(v) {
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v === "string" && v.trim() !== "" && isFinite(Number(v))) return Number(v);
    return null;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  /** The refusal reason, or null. Names the exact token so the user can find it in
   *  their own file rather than being told "invalid". */
  function unsafe(value) {
    var lower = String(value).toLowerCase();
    for (var i = 0; i < UNSAFE_TOKENS.length; i++) {
      if (lower.indexOf(UNSAFE_TOKENS[i]) !== -1) {
        return "contains `" + UNSAFE_TOKENS[i] + "`, which is not safe to put in a style attribute";
      }
    }
    return null;
  }

  /* CX.color.hexToRgb is the app's own colour reader. When it is loaded its
     verdict wins, so the importer and the picker can never disagree about what
     counts as a colour. */
  function acceptedColor(value) {
    if (!HEX.test(value)) return false;
    var reader = g.CX && g.CX.color && g.CX.color.hexToRgb;
    if (typeof reader !== "function") return true;
    try {
      return !!reader.call(g.CX.color, value);
    } catch (e) {
      return false;
    }
  }

  /** One element's style, property by property.
   *  @returns the kept properties, or null when the value was not a style at all. */
  function validateStyle(path, value, dropped) {
    if (!isObject(value)) {
      dropped.push({ key: path, reason: "expected an object of style properties, found " + typeOf(value) });
      return null;
    }
    var out = {};
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var full = path + "." + key;
      var raw = value[key];
      var reason = null;

      if (reservedKey(key)) {
        dropped.push({ key: full, reason: "`" + key + "` is a reserved JavaScript name and is never read as a style property" });
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(PROPERTIES, key)) {
        dropped.push({
          key: full,
          reason: "unknown style property — this build applies " + Object.keys(PROPERTIES).join(", ")
        });
        continue;
      }

      var kind = PROPERTIES[key];
      if (kind === "font") {
        if (typeof raw !== "string") reason = "a font family must be text, found " + typeOf(raw);
        else if (!raw.trim()) reason = "the font family is blank";
        else if (raw.length > LIMITS.font) reason = "the font family is " + raw.length + " characters, over the " + LIMITS.font + "-character cap";
        else reason = unsafe(raw);
        if (!reason) out.font = raw.trim();
      } else if (kind === "size") {
        var size = numberOf(raw);
        if (size === null) reason = "a size must be a number of percent, found " + typeOf(raw);
        else if (size < LIMITS.size.min || size > LIMITS.size.max) {
          reason = size + "% is outside the supported " + LIMITS.size.min + "-" + LIMITS.size.max + "% range";
        }
        if (!reason) out.size = Math.round(size);
      } else if (kind === "weight") {
        var weight = numberOf(raw);
        if (weight === null) reason = "a font weight must be a number, found " + typeOf(raw);
        else if (weight < LIMITS.weight.min || weight > LIMITS.weight.max) {
          reason = "a weight of " + weight + " is outside the CSS range " + LIMITS.weight.min + "-" + LIMITS.weight.max;
        }
        if (!reason) out.weight = Math.round(weight);
      } else if (kind === "color") {
        if (typeof raw !== "string") reason = "a colour must be text, found " + typeOf(raw);
        else {
          var hex = raw.trim();
          reason = unsafe(hex) || (acceptedColor(hex) ? null : "\"" + hex + "\" is not a hex colour — write #rgb, #rrggbb or #rrggbbaa");
          /* The picker writes a leading `#`; a hand-edited file often does not,
             and a bare `3366ff` is not a colour to CSS. Adding it back loses
             nothing, so it is a normalisation and not a drop. */
          if (!reason) out.color = hex.charAt(0) === "#" ? hex : "#" + hex;
        }
      } else {
        /* Booleans are not coerced. "true" and 1 are guessable, "on" and "yes"
           are not, and a rule that guesses sometimes is a rule nobody can predict. */
        if (typeof raw !== "boolean") reason = "expected true or false, found " + typeOf(raw);
        if (!reason) out[key] = raw;
      }

      if (reason) dropped.push({ key: full, reason: reason });
    }
    return out;
  }

  /** A whole per-element map. Element names come from `data-appear` attributes, so
   *  they are free text rather than a fixed vocabulary — only their shape can be
   *  checked, and that is exactly what happens here. */
  function validateMap(map, dropped, prefix) {
    var out = {};
    var label = prefix || "appearance";
    if (!isObject(map)) {
      dropped.push({ key: label, reason: "expected a map of element names to styles, found " + typeOf(map) });
      return out;
    }
    var names = Object.keys(map);
    var kept = 0;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      var path = label + "." + name;
      var trimmed = String(name).trim();
      var bad = unsafe(trimmed);
      var reason = null;

      if (reservedKey(trimmed)) {
        reason = "`" + trimmed + "` is a reserved JavaScript name and is never used as an element name";
      } else if (!trimmed) {
        reason = "the element name is blank, so nothing could be styled by it";
      } else if (trimmed.length > LIMITS.elementName) {
        reason = "the element name is " + trimmed.length + " characters, over the " + LIMITS.elementName + "-character cap";
      } else if (bad) {
        reason = "the element name " + bad;
      } else if (kept >= LIMITS.elements) {
        reason = "the document carries more than " + LIMITS.elements + " elements and this one is past the cap";
      }
      if (reason) {
        dropped.push({ key: path, reason: reason });
        continue;
      }

      var style = validateStyle(path, map[name], dropped);
      if (!style) continue;
      if (!Object.keys(style).length) {
        dropped.push({ key: path, reason: "no usable style property survived, so the element was left out entirely" });
        continue;
      }
      out[trimmed] = style;
      kept += 1;
    }
    return out;
  }

  /** Trim, collapse the whitespace, cap the length. A name that had to be cut is
   *  reported as truncated rather than quietly shortened. */
  function cleanName(raw) {
    if (typeof raw !== "string") {
      return { ok: false, name: "", truncated: false, error: "a preset name must be text, found " + typeOf(raw) };
    }
    var name = raw.replace(/\s+/g, " ").trim();
    if (!name) return { ok: false, name: "", truncated: false, error: "the preset name is blank" };
    var bad = unsafe(name);
    if (bad) return { ok: false, name: "", truncated: false, error: "the preset name " + bad };
    var truncated = false;
    if (name.length > LIMITS.presetName) {
      name = name.slice(0, LIMITS.presetName).trim();
      truncated = true;
    }
    return { ok: true, name: name, truncated: truncated, error: null };
  }

  /* Two presets whose names differ only in case are a trap in a list, so a
     collision is judged case-insensitively even though the name is stored as the
     user typed it. */
  function indexOfPreset(list, name) {
    var needle = String(name).toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].name).toLowerCase() === needle) return i;
    }
    return -1;
  }

  function normalisePreset(value, path, dropped, warnings) {
    if (!isObject(value)) {
      dropped.push({ key: path, reason: "expected a preset object with a name and an appearance map, found " + typeOf(value) });
      return null;
    }
    var name = cleanName(value.name);
    if (!name.ok) {
      dropped.push({ key: path + ".name", reason: name.error });
      return null;
    }
    if (name.truncated && warnings) {
      warnings.push("The preset name at " + path + " was shortened to " + LIMITS.presetName + " characters: " + name.name);
    }
    var map = validateMap(value.appearance, dropped, path + ".appearance");
    if (!Object.keys(map).length) {
      dropped.push({ key: path, reason: "the preset \"" + name.name + "\" has no usable element style left, so it was not kept" });
      return null;
    }
    return { name: name.name, appearance: map, savedAt: text(value.savedAt) || nowIso() };
  }

  function usableStore(store) {
    return !!store && typeof store.get === "function" && typeof store.set === "function";
  }

  /** The presets on disk. This is the app's own store rather than a user document:
   *  a row that is not a preset was never one, so it is skipped instead of being
   *  reported to somebody who cannot act on it. */
  function readPresets(store) {
    if (!usableStore(store)) return [];
    var raw;
    try {
      raw = store.get(KEY, []);
    } catch (e) {
      return [];
    }
    if (!Array.isArray(raw)) return [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var row = raw[i];
      if (!isObject(row)) continue;
      var name = cleanName(row.name);
      if (!name.ok) continue;
      out.push({
        name: name.name,
        appearance: isObject(row.appearance) ? row.appearance : {},
        savedAt: text(row.savedAt) || null
      });
    }
    return out;
  }

  var api = {
    VERSION: VERSION,
    FORMAT: FORMAT,
    KEY: KEY,
    LIMITS: LIMITS,
    PROPERTIES: PROPERTIES,

    /** Wrap the live per-element map into a portable document with provenance.
     *  @param meta {{ app, version, platform, presets, at }}
     *  @returns the document to write. `dropped` and `warnings` ride along inside
     *    it because a value the exporter could not represent is a fact whoever
     *    opens this file needs, and a reader that ignores the fields loses
     *    nothing — `import` treats both as known and never re-reports them. */
    export: function (appearance, meta) {
      var m = isObject(meta) ? meta : {};
      var dropped = [];
      var warnings = [];
      var live = validateMap(appearance, dropped, "appearance");
      var presets = [];
      var source = Array.isArray(m.presets) ? m.presets : [];
      for (var i = 0; i < source.length; i++) {
        if (presets.length >= LIMITS.presets) {
          dropped.push({ key: "presets[" + i + "]", reason: "more than " + LIMITS.presets + " presets were offered and this one is past the cap" });
          continue;
        }
        var preset = normalisePreset(source[i], "presets[" + i + "]", dropped, warnings);
        if (preset) presets.push(preset);
      }
      return {
        format: FORMAT,
        version: VERSION,
        exportedAt: text(m.at) || nowIso(),
        app: {
          name: text(m.app) || "Codex Studio",
          version: text(m.version) || null,
          platform: text(m.platform) || null
        },
        elements: Object.keys(live).length,
        appearance: live,
        presets: presets,
        dropped: dropped,
        warnings: warnings
      };
    },

    /** Parse a file's text. NEVER throws.
     *  @returns {{ ok, document, error, warnings }} — one distinct, actionable
     *    error per way a file can fail to be an appearance document. */
    parse: function (raw) {
      var out = { ok: false, document: null, error: null, warnings: [] };
      try {
        if (typeof raw !== "string") {
          out.error = "Nothing readable came out of the file: expected JSON text, found " + typeOf(raw) + ".";
          return out;
        }
        if (raw.length > LIMITS.bytes) {
          out.error = "The file is " + raw.length + " characters, past the " + LIMITS.bytes + "-character cap for an appearance file. Nothing was read.";
          return out;
        }
        var body = raw.replace(/^\uFEFF/, "").trim();
        if (!body) {
          out.error = "The file is empty, so there is nothing to import.";
          return out;
        }
        var parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          out.error = "The file is not valid JSON: " + (e && e.message ? e.message : String(e)) + ". Nothing was imported.";
          return out;
        }
        if (!isObject(parsed)) {
          out.error = "The file holds " + typeOf(parsed) + ", not an appearance document. A Codex Studio appearance file is a JSON object whose `format` is \"" + FORMAT + "\".";
          return out;
        }
        if (!Object.prototype.hasOwnProperty.call(parsed, "format")) {
          out.error = "The file has no `format` field, so it cannot be identified as a Codex Studio appearance file. Expected `format` to be \"" + FORMAT + "\".";
          return out;
        }
        if (String(parsed.format) !== FORMAT) {
          out.error = "The file says its format is \"" + String(parsed.format) + "\", not \"" + FORMAT + "\". Nothing was imported.";
          return out;
        }

        var version = numberOf(parsed.version);
        if (version === null) {
          out.warnings.push("The file does not say which format version it is, so it was read as version " + VERSION + ".");
        } else if (version > VERSION) {
          out.warnings.push("The file was written by a newer build (format version " + version + "; this build reads " + VERSION + "). What this build understands is imported and everything else is listed as dropped.");
        } else if (version < VERSION) {
          out.warnings.push("The file is format version " + version + "; this build reads " + VERSION + " and upgrades it on import.");
        }

        out.ok = true;
        out.document = parsed;
        return out;
      } catch (e) {
        /* parse() is called straight from a file picker, so it has to answer even
           when something inside it goes wrong. */
        out.ok = false;
        out.document = null;
        out.error = "The file could not be read: " + (e && e.message ? e.message : String(e)) + ".";
        return out;
      }
    },

    /** Validate and normalise a parsed document into a live appearance map,
     *  dropping anything it cannot represent and REPORTING each drop.
     *  @returns {{ ok, appearance, presets, dropped: [{key, reason}], warnings, error }} */
    import: function (doc) {
      var out = { ok: false, appearance: {}, presets: [], dropped: [], warnings: [], error: null };
      try {
        if (!isObject(doc)) {
          out.error = "There is no appearance document to import: expected an object, found " + typeOf(doc) + ".";
          return out;
        }
        if (doc.format !== undefined && String(doc.format) !== FORMAT) {
          out.error = "This document says its format is \"" + String(doc.format) + "\", not \"" + FORMAT + "\". Nothing was imported.";
          return out;
        }
        var version = numberOf(doc.version);
        if (version !== null && version > VERSION) {
          out.warnings.push("The document is format version " + version + " and this build reads " + VERSION + ". Anything newer than this build is listed as dropped rather than applied.");
        }

        var hasMap = doc.appearance !== undefined;
        var hasPresets = doc.presets !== undefined;
        if (!hasMap && !hasPresets) {
          out.error = "The document carries neither an `appearance` map nor a `presets` list, so there is nothing to import.";
          return out;
        }

        if (hasMap) out.appearance = validateMap(doc.appearance, out.dropped, "appearance");
        if (hasPresets) {
          if (!Array.isArray(doc.presets)) {
            out.dropped.push({ key: "presets", reason: "expected a list of presets, found " + typeOf(doc.presets) });
          } else {
            for (var i = 0; i < doc.presets.length; i++) {
              if (out.presets.length >= LIMITS.presets) {
                out.dropped.push({ key: "presets[" + i + "]", reason: "the document carries more than " + LIMITS.presets + " presets and this one is past the cap" });
                continue;
              }
              var preset = normalisePreset(doc.presets[i], "presets[" + i + "]", out.dropped, out.warnings);
              if (preset) out.presets.push(preset);
            }
          }
        }

        /* A field this build does not know is usually a field a newer build
           wrote. Reporting it is the whole difference between "your file had
           more in it than we applied" and losing it without a word. */
        var fields = Object.keys(doc);
        for (var f = 0; f < fields.length; f++) {
          if (!Object.prototype.hasOwnProperty.call(KNOWN_FIELDS, fields[f])) {
            out.dropped.push({ key: fields[f], reason: "this build does not understand the top-level field `" + fields[f] + "`, so it was not applied" });
          }
        }

        out.ok = Object.keys(out.appearance).length > 0 || out.presets.length > 0;
        if (!out.ok) {
          out.error = "Nothing in the document could be applied: all " + out.dropped.length + " of its values were dropped. Each one is listed with its reason.";
        }
        return out;
      } catch (e) {
        out.ok = false;
        out.error = "The document could not be imported: " + (e && e.message ? e.message : String(e)) + ".";
        return out;
      }
    },

    /* ------------------------------------------------------------- presets */

    /** Named presets stored alongside the live map. */
    listPresets: function (store) {
      return readPresets(store).map(function (p) {
        return {
          name: p.name,
          appearance: p.appearance,
          savedAt: p.savedAt,
          elements: Object.keys(p.appearance).length
        };
      });
    },

    /** @param options {{ overwrite }} — `true` is accepted in its place.
     *  Without it an existing name is REFUSED rather than replaced, so a preset
     *  can never be overwritten by a click the user did not know was destructive.
     *  @returns {{ ok, name, error, exists, replaced, dropped, warnings }} */
    savePreset: function (store, name, appearance, options) {
      var opts = isObject(options) ? options : { overwrite: options === true };
      var out = { ok: false, name: "", error: null, exists: false, replaced: false, dropped: [], warnings: [] };
      if (!usableStore(store)) {
        out.error = "There is nowhere to save the preset — this build has no appearance storage.";
        return out;
      }
      var clean = cleanName(name);
      if (!clean.ok) {
        out.error = "The preset was not saved because " + clean.error + ".";
        return out;
      }
      out.name = clean.name;
      if (clean.truncated) {
        out.warnings.push("The name was shortened to the " + LIMITS.presetName + "-character cap and saved as \"" + clean.name + "\".");
      }

      var map = validateMap(appearance, out.dropped, "appearance");
      if (!Object.keys(map).length) {
        out.error = "There is nothing to save: not one element style could be represented, so \"" + clean.name + "\" was not created.";
        return out;
      }

      var list = readPresets(store);
      var at = indexOfPreset(list, clean.name);
      if (at !== -1 && !opts.overwrite) {
        out.exists = true;
        out.error = "A preset named \"" + list[at].name + "\" already exists. Save again with overwrite to replace it, or pick another name.";
        return out;
      }
      if (at === -1 && list.length >= LIMITS.presets) {
        out.error = "There are already " + LIMITS.presets + " saved presets. Delete one before saving \"" + clean.name + "\".";
        return out;
      }

      var entry = { name: clean.name, appearance: map, savedAt: nowIso() };
      if (at === -1) list.push(entry);
      else {
        list[at] = entry;
        out.replaced = true;
      }
      try {
        store.set(KEY, list);
      } catch (e) {
        out.error = "The preset could not be written to storage: " + (e && e.message ? e.message : String(e)) + ".";
        return out;
      }
      out.ok = true;
      return out;
    },

    /** @returns {{ ok, name, error, preset }} — the removed preset rides back so
     *  the caller can offer an undo without having read it first. */
    deletePreset: function (store, name) {
      var out = { ok: false, name: "", error: null, preset: null };
      if (!usableStore(store)) {
        out.error = "There is no appearance storage in this build, so nothing was deleted.";
        return out;
      }
      var clean = cleanName(name);
      if (!clean.ok) {
        out.error = "Nothing was deleted because " + clean.error + ".";
        return out;
      }
      out.name = clean.name;
      var list = readPresets(store);
      var at = indexOfPreset(list, clean.name);
      if (at === -1) {
        out.error = "There is no preset named \"" + clean.name + "\", so nothing was deleted.";
        return out;
      }
      out.preset = clone(list[at]);
      list.splice(at, 1);
      try {
        store.set(KEY, list);
      } catch (e) {
        out.error = "The preset list could not be written: " + (e && e.message ? e.message : String(e)) + ". \"" + clean.name + "\" is still saved.";
        out.preset = null;
        return out;
      }
      out.ok = true;
      return out;
    },

    /** @returns {{ ok, name, appearance, error, dropped, warnings }} — the stored
     *  map is revalidated on the way out, because localStorage is editable and a
     *  preset saved by an older build is exactly the untrusted input rule 2 is
     *  about. */
    applyPreset: function (store, name) {
      var out = { ok: false, name: "", appearance: {}, error: null, dropped: [], warnings: [] };
      if (!usableStore(store)) {
        out.error = "There is no appearance storage in this build, so no preset could be applied.";
        return out;
      }
      var clean = cleanName(name);
      if (!clean.ok) {
        out.error = "No preset was applied because " + clean.error + ".";
        return out;
      }
      out.name = clean.name;
      var list = readPresets(store);
      var at = indexOfPreset(list, clean.name);
      if (at === -1) {
        out.error = "There is no preset named \"" + clean.name + "\". Nothing was applied and your current appearance is untouched.";
        return out;
      }
      out.name = list[at].name;
      out.appearance = validateMap(list[at].appearance, out.dropped, "appearance");
      if (!Object.keys(out.appearance).length) {
        out.error = "The preset \"" + out.name + "\" holds no usable element style, so nothing was applied. Each dropped value is listed with its reason.";
        return out;
      }
      out.ok = true;
      return out;
    },

    /** A stable filename for a download: the same name always yields the same
     *  file, so re-exporting a preset overwrites its own file rather than piling
     *  up copies. Non-ASCII names keep their characters — only what Windows
     *  actually forbids in a filename is replaced. */
    filename: function (name) {
      var slug = typeof name === "string" ? name : "";
      slug = slug
        .replace(/[\u0000-\u001f\u007f<>:"\/\\|?*]+/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-.]+/, "")
        .replace(/[-.]+$/, "")
        .slice(0, LIMITS.presetName)
        .replace(/[-.]+$/, "");
      return slug ? "codex-studio-appearance-" + slug + ".json" : "codex-studio-appearance.json";
    }
  };

  g.CX_APPEARANCE = api;
})(window);
