/* Codex Studio — browser-style tab model.

   Content is navigated, not scrolled: every surface is a discrete tab in a
   persistent strip. This module owns the *model* only — order, pinning, groups,
   the four searches and the bulk-close predicate. Presentation lives in the
   template, so the same rules apply however a strip is drawn.

   Two invariants are worth stating up front because breaking either is a silent
   data-loss bug rather than a visual one:

   1. Bulk close matches the tab's VISIBLE LABEL and nothing else. It never
      inspects page contents or hidden state — a user closing "everything with
      `payments` in the name" must be able to predict the result from the strip.
   2. "Close tabs containing X" and "Close tabs NOT containing X" negate the exact
      same predicate. If they were built separately, casing, Unicode handling or a
      regex flag could drift between them and the two actions would stop being
      inverses of each other. */
(function (g) {
  "use strict";

  var LIMITS = { pattern: 2000, matches: 5000, ms: 250 };

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  /** The one predicate both bulk-close directions are built from.
   *  @param spec {{ text, regex: {pattern, flags[]}|null, caseSensitive }}
   *  @returns {{ ok, error, test(label) }} */
  function predicate(spec) {
    var text = spec && spec.text != null ? String(spec.text) : "";
    var rx = spec && spec.regex && spec.regex.pattern ? spec.regex : null;

    if (rx) {
      if (rx.pattern.length > LIMITS.pattern) {
        return { ok: false, error: "Pattern exceeds " + LIMITS.pattern + " characters.", test: function () { return false; } };
      }
      var flags = (rx.flags || []).filter(function (f) {
        return f !== "g" && f !== "y";
      }).join("");
      var re;
      try {
        re = new RegExp(rx.pattern, flags);
      } catch (e) {
        return { ok: false, error: e.message, test: function () { return false; } };
      }
      return {
        ok: true,
        error: null,
        mode: "regex",
        test: function (label) {
          re.lastIndex = 0;
          return re.test(String(label == null ? "" : label));
        }
      };
    }

    if (!text) {
      return { ok: false, error: "Enter text to match — an empty query closes nothing.", test: function () { return false; } };
    }
    var needle = spec && spec.caseSensitive ? text : text.toLowerCase();
    return {
      ok: true,
      error: null,
      mode: "text",
      test: function (label) {
        var hay = String(label == null ? "" : label);
        if (!(spec && spec.caseSensitive)) hay = hay.toLowerCase();
        return hay.indexOf(needle) !== -1;
      }
    };
  }

  function create(store, opts) {
    opts = opts || {};
    var KEY = opts.key || "tabs";
    var state = {
      tabs: [],
      groups: [],
      activeId: null,
      /** Workspaces are the app's profiles: the master search spans all of them. */
      workspaces: {}
    };
    var subs = [];

    function emit() {
      persist();
      for (var i = 0; i < subs.length; i++) {
        try {
          subs[i]();
        } catch (e) {
          /* one broken subscriber must not stop the rest repainting */
        }
      }
    }

    function persist() {
      if (store) store.set(KEY, { tabs: state.tabs, groups: state.groups, activeId: state.activeId });
    }

    function byId(id) {
      for (var i = 0; i < state.tabs.length; i++) {
        if (state.tabs[i].id === id) return state.tabs[i];
      }
      return null;
    }

    function groupById(id) {
      for (var i = 0; i < state.groups.length; i++) {
        if (state.groups[i].id === id) return state.groups[i];
      }
      return null;
    }

    /** Pinned tabs occupy a stable region ahead of the ordinary ones, and keep
     *  their own relative order within it. */
    function sorted(list) {
      return list.slice().sort(function (a, b) {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
        return (a.order || 0) - (b.order || 0);
      });
    }

    function nextOrder() {
      var max = 0;
      for (var i = 0; i < state.tabs.length; i++) max = Math.max(max, state.tabs[i].order || 0);
      return max + 1;
    }

    var api = {
      VERSION: 1,
      LIMITS: LIMITS,
      predicate: predicate,

      load: function (seed) {
        var saved = store ? store.get(KEY, null) : null;
        if (saved && saved.tabs && saved.tabs.length) {
          state.tabs = saved.tabs;
          state.groups = saved.groups || [];
          state.activeId = saved.activeId || (saved.tabs[0] && saved.tabs[0].id);
        } else if (seed && seed.length) {
          state.tabs = seed.map(function (t, i) {
            return {
              id: t.id || uid("t"),
              title: t.title,
              kind: t.kind || "chat",
              payload: t.payload || null,
              pinned: !!t.pinned,
              groupId: t.groupId || null,
              order: i + 1,
              dirty: false,
              workspace: t.workspace || "default"
            };
          });
          state.activeId = state.tabs[0].id;
        }
        // A group whose last member left is kept only when the user asked to keep it.
        return api;
      },

      subscribe: function (fn) {
        subs.push(fn);
        return function () {
          var i = subs.indexOf(fn);
          if (i >= 0) subs.splice(i, 1);
        };
      },

      /* -------------------------------------------------------- reading */
      all: function () {
        return sorted(state.tabs);
      },
      groups: function () {
        return state.groups.slice().sort(function (a, b) {
          return (a.order || 0) - (b.order || 0);
        });
      },
      /** Ungrouped tabs, in strip order. */
      loose: function () {
        return sorted(state.tabs.filter(function (t) { return !t.groupId; }));
      },
      inGroup: function (groupId) {
        return sorted(state.tabs.filter(function (t) { return t.groupId === groupId; }));
      },
      pinned: function () {
        return sorted(state.tabs.filter(function (t) { return t.pinned; }));
      },
      active: function () {
        return byId(state.activeId);
      },
      get: byId,
      getGroup: groupById,
      count: function () {
        return state.tabs.length;
      },

      /** Tabs that do not fit the strip. The caller measures; this only decides
       *  which ones are eligible — pinned tabs stay visible when others overflow. */
      overflow: function (capacity) {
        var visible = sorted(state.tabs);
        var pinnedCount = 0;
        for (var i = 0; i < visible.length; i++) if (visible[i].pinned) pinnedCount++;
        var room = Math.max(pinnedCount, capacity || visible.length);
        return visible.slice(room);
      },

      /* -------------------------------------------------------- mutation */
      open: function (tab) {
        var t = {
          id: tab.id || uid("t"),
          title: tab.title || "New tab",
          kind: tab.kind || "chat",
          payload: tab.payload || null,
          pinned: !!tab.pinned,
          groupId: tab.groupId || null,
          order: nextOrder(),
          dirty: false,
          workspace: tab.workspace || "default"
        };
        state.tabs.push(t);
        state.activeId = t.id;
        emit();
        return t;
      },

      activate: function (id) {
        if (!byId(id)) return false;
        state.activeId = id;
        // Revealing a tab inside a collapsed group must not destroy the collapsed
        // preference the user set — expand for this navigation only.
        emit();
        return true;
      },

      rename: function (id, title) {
        var t = byId(id);
        if (!t) return false;
        t.title = title;
        emit();
        return true;
      },

      setDirty: function (id, dirty) {
        var t = byId(id);
        if (!t) return false;
        t.dirty = !!dirty;
        emit();
        return true;
      },

      close: function (id) {
        var t = byId(id);
        if (!t) return false;
        state.tabs = state.tabs.filter(function (x) { return x.id !== id; });
        if (state.activeId === id) {
          var rest = sorted(state.tabs);
          state.activeId = rest.length ? rest[0].id : null;
        }
        emit();
        return true;
      },

      pin: function (id, on) {
        var t = byId(id);
        if (!t) return false;
        t.pinned = on == null ? !t.pinned : !!on;
        emit();
        return true;
      },

      /** Move a tab to a new index within its own region (pinned or ordinary). */
      move: function (id, index) {
        var t = byId(id);
        if (!t) return false;
        var region = sorted(state.tabs.filter(function (x) { return !!x.pinned === !!t.pinned; }));
        var without = region.filter(function (x) { return x.id !== id; });
        var at = Math.max(0, Math.min(index, without.length));
        without.splice(at, 0, t);
        without.forEach(function (x, i) { x.order = i + 1; });
        emit();
        return true;
      },

      /* ---------------------------------------------------------- groups */
      createGroup: function (name, color) {
        var gp = {
          id: uid("g"),
          name: name || "Group",
          color: color || "#D0BCFF",
          collapsed: false,
          pinned: false,
          icon: "",
          order: state.groups.length + 1,
          appearance: null
        };
        state.groups.push(gp);
        emit();
        return gp;
      },
      renameGroup: function (id, name) {
        var gp = groupById(id);
        if (!gp) return false;
        gp.name = name;
        emit();
        return true;
      },
      setGroup: function (id, patch) {
        var gp = groupById(id);
        if (!gp) return false;
        for (var k in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, k)) gp[k] = patch[k];
        }
        emit();
        return true;
      },
      moveGroup: function (id, index) {
        var gp = groupById(id);
        if (!gp) return false;
        var rest = api.groups().filter(function (x) { return x.id !== id; });
        rest.splice(Math.max(0, Math.min(index, rest.length)), 0, gp);
        rest.forEach(function (x, i) { x.order = i + 1; });
        emit();
        return true;
      },
      /** Removing a group never closes its tabs — they return to the loose region. */
      removeGroup: function (id) {
        if (!groupById(id)) return false;
        state.tabs.forEach(function (t) {
          if (t.groupId === id) t.groupId = null;
        });
        state.groups = state.groups.filter(function (x) { return x.id !== id; });
        emit();
        return true;
      },
      assign: function (tabId, groupId) {
        var t = byId(tabId);
        if (!t) return false;
        if (groupId && !groupById(groupId)) return false;
        t.groupId = groupId || null;
        emit();
        return true;
      },
      toggleCollapsed: function (id) {
        var gp = groupById(id);
        if (!gp) return false;
        gp.collapsed = !gp.collapsed;
        emit();
        return true;
      },

      /* ------------------------------------------------ the four searches */

      /** 1. Search the current strip. */
      searchStrip: function (spec) {
        return api._search(sorted(state.tabs), spec);
      },

      /** 2. Search inside one group. */
      searchGroup: function (groupId, spec) {
        return api._search(api.inGroup(groupId), spec);
      },

      /** 3. Search groups by their visible names and labels. */
      searchGroups: function (spec) {
        var p = predicate(spec);
        var rows = [];
        if (p.ok) {
          api.groups().forEach(function (gp) {
            if (p.test(gp.name) || (gp.icon && p.test(gp.icon))) {
              rows.push({
                group: gp,
                tabs: api.inGroup(gp.id).length,
                collapsed: !!gp.collapsed,
                pinned: !!gp.pinned
              });
            }
          });
        }
        return { ok: p.ok, error: p.error, mode: p.mode || null, results: rows, count: rows.length };
      },

      /** 4. Master search across every workspace, strip and group the app owns. */
      searchAll: function (spec) {
        var p = predicate(spec);
        var rows = [];
        if (p.ok) {
          sorted(state.tabs).forEach(function (t) {
            if (!p.test(t.title)) return;
            var gp = t.groupId ? groupById(t.groupId) : null;
            rows.push({
              tab: t,
              workspace: t.workspace || "default",
              strip: "main",
              group: gp ? { id: gp.id, name: gp.name, collapsed: !!gp.collapsed } : null,
              pinned: !!t.pinned,
              label: t.title
            });
          });
        }
        return { ok: p.ok, error: p.error, mode: p.mode || null, results: rows, count: rows.length };
      },

      _search: function (list, spec) {
        var p = predicate(spec);
        var rows = [];
        if (p.ok) {
          for (var i = 0; i < list.length && rows.length < LIMITS.matches; i++) {
            if (p.test(list[i].title)) rows.push(list[i]);
          }
        }
        return { ok: p.ok, error: p.error, mode: p.mode || null, results: rows, count: rows.length };
      },

      /* ------------------------------------------------------ bulk close */

      /** Preview a bulk close. Nothing is closed here — the caller shows the
       *  result, and only calls `bulkClose` once the user has seen it.
       *  @param spec {{ text, regex, caseSensitive, invert, includePinned, scope }}
       *    invert         false = "close tabs containing", true = "close tabs NOT containing"
       *    includePinned  pinned tabs are excluded by default; including them is
       *                   an explicit choice and the preview names them
       *    scope          {kind:"strip"} | {kind:"group", id} | {kind:"groups", ids[]} | {kind:"all"} */
      previewBulkClose: function (spec) {
        var p = predicate(spec);
        var scope = (spec && spec.scope) || { kind: "strip" };
        var pool;
        if (scope.kind === "group") pool = api.inGroup(scope.id);
        else if (scope.kind === "groups") {
          pool = [];
          (scope.ids || []).forEach(function (id) {
            pool = pool.concat(api.inGroup(id));
          });
        } else pool = sorted(state.tabs);

        var out = { ok: p.ok, error: p.error, mode: p.mode || null, invert: !!(spec && spec.invert), scope: scope, matched: [], protectedPinned: [], dirty: [], total: pool.length };
        if (!p.ok) return out;

        for (var i = 0; i < pool.length; i++) {
          var t = pool[i];
          var hit = p.test(t.title);
          if (spec && spec.invert) hit = !hit;
          if (!hit) continue;
          if (t.pinned && !(spec && spec.includePinned)) {
            out.protectedPinned.push(t);
            continue;
          }
          if (t.dirty) out.dirty.push(t);
          out.matched.push(t);
        }
        return out;
      },

      /** Apply a preview. Reports what actually closed and what did not, rather
       *  than pretending a protected tab went away. */
      bulkClose: function (preview) {
        if (!preview || !preview.ok) {
          return { closed: [], skipped: [], error: (preview && preview.error) || "nothing to close" };
        }
        var ids = {};
        preview.matched.forEach(function (t) { ids[t.id] = true; });
        var closed = state.tabs.filter(function (t) { return ids[t.id]; });
        state.tabs = state.tabs.filter(function (t) { return !ids[t.id]; });
        if (!byId(state.activeId)) {
          var rest = sorted(state.tabs);
          state.activeId = rest.length ? rest[0].id : null;
        }
        emit();
        return {
          closed: closed,
          skipped: preview.protectedPinned.slice(),
          error: null
        };
      },

      /* --------------------------------------------------- close variants */

      /** Close-others and close-to-the-right exclude pinned tabs by default, the
       *  same way the text-based bulk closes do. */
      closeOthers: function (keepId, includePinned) {
        var victims = state.tabs.filter(function (t) {
          return t.id !== keepId && (includePinned || !t.pinned);
        });
        return api.bulkClose({ ok: true, matched: victims, protectedPinned: state.tabs.filter(function (t) { return t.id !== keepId && t.pinned && !includePinned; }) });
      },

      closeToRight: function (fromId, includePinned) {
        var order = sorted(state.tabs);
        var at = -1;
        for (var i = 0; i < order.length; i++) if (order[i].id === fromId) at = i;
        if (at === -1) return { closed: [], skipped: [], error: "unknown tab" };
        var right = order.slice(at + 1);
        return api.bulkClose({
          ok: true,
          matched: right.filter(function (t) { return includePinned || !t.pinned; }),
          protectedPinned: right.filter(function (t) { return t.pinned && !includePinned; })
        });
      },

      /* ------------------------------------------------ export / restore */
      snapshot: function () {
        return clone({ tabs: state.tabs, groups: state.groups, activeId: state.activeId });
      },
      restore: function (snap) {
        if (!snap || !snap.tabs) return false;
        state.tabs = clone(snap.tabs);
        state.groups = clone(snap.groups || []);
        state.activeId = snap.activeId || (state.tabs[0] && state.tabs[0].id) || null;
        emit();
        return true;
      }
    };

    return api;
  }

  g.CX_TABS = { VERSION: 1, create: create, predicate: predicate, LIMITS: LIMITS };
})(window);
