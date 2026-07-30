/* Codex Studio — non-blocking notifications and the notification centre.

   Anything that only *informs* becomes a corner toast: info, success, progress and
   errors the user does not have to answer right now. A modal dialog is reserved
   for a decision that genuinely blocks the next step — a destructive gate, an
   unsaved-changes prompt, a consent step.

   Toasts auto-dismiss; errors and warnings do not, because a failure that vanishes
   after four seconds is a failure the user never read. Everything that was ever
   shown stays reviewable in the centre, so a dismissed toast is not a lost one. */
(function (g) {
  "use strict";

  var KEY = "notify.history";
  var MAX_HISTORY = 200;
  var MAX_VISIBLE = 4;

  /** Errors and warnings stay until dismissed; the rest fade on their own. */
  var DEFAULT_TIMEOUT = {
    info: 5000,
    success: 4000,
    progress: 0,
    warning: 0,
    error: 0
  };

  var ICON = {
    info: "ⓘ",
    success: "✓",
    progress: "◴",
    warning: "⚠",
    error: "✕"
  };

  function now() {
    return Date.now();
  }

  function store() {
    return g.CX && g.CX.store;
  }

  function create() {
    var seq = 0;
    var live = [];
    var history = [];
    var subs = [];
    var timers = {};
    var readAt = 0;

    function persist() {
      var s = store();
      if (!s) return;
      s.set(KEY, history.slice(0, MAX_HISTORY));
      s.set("notify.readAt", readAt);
    }

    function emit() {
      for (var i = 0; i < subs.length; i++) {
        try {
          subs[i]();
        } catch (e) {
          /* a broken subscriber must not stop the others from repainting */
        }
      }
    }

    function clearTimer(id) {
      if (timers[id]) {
        clearTimeout(timers[id]);
        delete timers[id];
      }
    }

    var api = {
      VERSION: 1,
      ICON: ICON,

      /** Restore the centre's history. Live toasts are deliberately not restored —
       *  a notification from a previous launch is history, not news. */
      load: function () {
        var s = store();
        history = (s && s.get(KEY, [])) || [];
        readAt = (s && s.get("notify.readAt", 0)) || 0;
        return api;
      },

      /** Everything currently on screen, newest last so the stack grows downward. */
      visible: function () {
        return live.slice(0, MAX_VISIBLE);
      },

      /** The full reviewable log, newest first. */
      log: function () {
        return history;
      },

      unread: function () {
        var n = 0;
        for (var i = 0; i < history.length; i++) {
          if (history[i].at > readAt) n++;
        }
        return n;
      },

      markRead: function () {
        readAt = now();
        persist();
        emit();
        return api;
      },

      subscribe: function (fn) {
        subs.push(fn);
        return function () {
          var i = subs.indexOf(fn);
          if (i >= 0) subs.splice(i, 1);
        };
      },

      /** Raise a notification.
       *  @param n {{kind, title, body, actions, timeout, category, detail}}
       *    kind      one of info|success|progress|warning|error (default "info")
       *    actions   [{ label, run }] — retry, undo, open, view details
       *    category  optional dedupe key: a newer item replaces the one it supersedes
       *              rather than stacking a second copy of the same news
       *  @returns the notification id. */
      push: function (n) {
        var item = {
          id: "n" + ++seq + "-" + now().toString(36),
          kind: n && n.kind ? n.kind : "info",
          title: (n && n.title) || "",
          body: (n && n.body) || "",
          detail: (n && n.detail) || "",
          category: (n && n.category) || null,
          actions: (n && n.actions) || [],
          at: now(),
          dismissedAt: null
        };
        if (item.category) {
          // Replace the superseded item in place so a progress line updating three
          // times does not become three toasts.
          for (var i = live.length - 1; i >= 0; i--) {
            if (live[i].category === item.category) {
              clearTimer(live[i].id);
              live.splice(i, 1);
            }
          }
        }
        live.unshift(item);
        history.unshift({
          id: item.id,
          kind: item.kind,
          title: item.title,
          body: item.body,
          detail: item.detail,
          at: item.at
        });
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;

        var ms = n && typeof n.timeout === "number" ? n.timeout : DEFAULT_TIMEOUT[item.kind];
        if (ms > 0) {
          timers[item.id] = setTimeout(function () {
            api.dismiss(item.id);
          }, ms);
        }
        persist();
        emit();
        return item.id;
      },

      /** Update an in-flight notification — used by progress lines so the running
       *  step reports where it got to instead of raising a new toast per tick. */
      update: function (id, patch) {
        for (var i = 0; i < live.length; i++) {
          if (live[i].id !== id) continue;
          for (var k in patch) {
            if (Object.prototype.hasOwnProperty.call(patch, k)) live[i][k] = patch[k];
          }
          if (patch.kind && DEFAULT_TIMEOUT[patch.kind] > 0) {
            clearTimer(id);
            timers[id] = setTimeout(function () {
              api.dismiss(id);
            }, DEFAULT_TIMEOUT[patch.kind]);
          }
          emit();
          return true;
        }
        return false;
      },

      dismiss: function (id) {
        clearTimer(id);
        for (var i = 0; i < live.length; i++) {
          if (live[i].id === id) {
            live.splice(i, 1);
            emit();
            return true;
          }
        }
        return false;
      },

      dismissAll: function () {
        for (var i = 0; i < live.length; i++) clearTimer(live[i].id);
        live = [];
        emit();
        return api;
      },

      /** Clear the reviewable log. The live stack is untouched — clearing history
       *  should not make an error the user is still reading disappear. */
      clearHistory: function () {
        history = [];
        persist();
        emit();
        return api;
      },

      /* ---- convenience wrappers used across the app ---- */
      info: function (title, body, extra) {
        return api.push(merge({ kind: "info", title: title, body: body }, extra));
      },
      success: function (title, body, extra) {
        return api.push(merge({ kind: "success", title: title, body: body }, extra));
      },
      warn: function (title, body, extra) {
        return api.push(merge({ kind: "warning", title: title, body: body }, extra));
      },
      error: function (title, body, extra) {
        return api.push(merge({ kind: "error", title: title, body: body }, extra));
      },
      progress: function (title, body, extra) {
        return api.push(merge({ kind: "progress", title: title, body: body }, extra));
      },

      /** Turn a rejected backend call into an error the user can act on. The
       *  message always names what failed and what the CLI actually said — the
       *  funny level styles the title, never this detail. */
      fromError: function (what, err, actions) {
        var detail = err && err.message ? err.message : String(err);
        return api.error(what, detail, { actions: actions || [], detail: detail });
      }
    };

    function merge(base, extra) {
      if (!extra) return base;
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) base[k] = extra[k];
      }
      return base;
    }

    return api;
  }

  g.CX_NOTIFY = { VERSION: 1, create: create, DEFAULT_TIMEOUT: DEFAULT_TIMEOUT, ICON: ICON };
})(window);
