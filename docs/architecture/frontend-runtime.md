# The frontend runtime

> How `app/index.html` — one `<x-dc>` template plus one `DCLogic` subclass — becomes a rendered
> React tree, and what it takes to add a panel.

## The two halves of `index.html`

```html
<x-dc>
  <helmet>
    <style>/* M3 tokens, fonts, keyframes */</style>
    <script src="codex-data.js"></script>
    <script src="cx-i18n.js"></script>
    …
    <script src="codex-core.js"></script>
  </helmet>

  <div>… markup with {{ bindings }}, sc-for, sc-if …</div>
</x-dc>

<script type="text/x-dc" data-dc-script>
  class Component extends DCLogic {
    state = { … };
    componentDidMount() { … }
    renderVals() { return { /* everything the template reads */ }; }
  }
</script>
```

`app/support.js` (the generated `dc-runtime`) finds the `<x-dc>` element and the
`script[data-dc-script]`, compiles the template once into React element builders, evaluates the
script with `new Function` and mounts the resulting class.

The script **must** define `class Component extends DCLogic`. If it does not, the runtime reports
`… must define \`class Component extends DCLogic\`` and renders nothing.

`<helmet>` content is hoisted into the document head, which is why the CSS custom properties and
the `cx-*.js` modules load before the component mounts.

## `DCLogic`

`DCLogic` (internally `StreamableLogic`) is a small base class — not `React.Component`:

| Member | Behaviour |
| --- | --- |
| `this.props` | Props passed to the mount, merged **under** `renderVals()`. |
| `this.state` | Plain object. Declare it as a class field. |
| `this.setState(patch, cb)` | Forwards to the host React component; same shallow-merge semantics as React. |
| `this.forceUpdate()` | Re-render without a state change. |
| `componentDidMount()` / `componentDidUpdate(prevProps)` / `componentWillUnmount()` | Called by the host. |
| `renderVals()` | **The whole contract.** Returns a flat object; the template is rendered against `{ ...props, ...renderVals() }`. |

Everything the template shows — strings, colours, arrays of rows, and the event handlers
themselves — comes out of `renderVals()`. Handlers are plain functions placed on that object and
bound in the template as `onClick="{{ someHandler }}"`.

## Template syntax

Compiled by `app/support.js`; this is the complete list of what it understands.

### Interpolation `{{ … }}`

Works in text nodes and in any attribute value, either as the whole value
(`value="{{ query }}"`, which preserves the value's type) or interleaved
(`style="color:{{ fg }}"`, which stringifies).

The expression language is deliberately tiny — **it is not JavaScript**:

| Form | Example |
| --- | --- |
| Property path | `{{ user.name }}`, `{{ rows.0.title }}` |
| Index by another value | `{{ map[key] }}` |
| Literals | `{{ true }}`, `{{ false }}`, `{{ null }}`, `{{ 42 }}`, `{{ 'text' }}` |
| Negation | `{{ !isOpen }}` |
| Equality | `{{ a === b }}`, `{{ a !== b }}`, `{{ a == b }}`, `{{ a != b }}` |
| Parenthesised | `{{ (a === b) }}` |

There are **no function calls, no arithmetic, no ternaries and no member calls** in templates. If
you need one, compute it in `renderVals()` and expose the result. An unresolved hole renders as
empty and logs `[dc-runtime] … never resolved — rendered as empty` once per hole.

### `sc-for`

```html
<sc-for list="{{ navRows }}" as="n" hint-placeholder-count="7">
  <button onClick="{{ n.go }}">{{ n.label }}</button>
</sc-for>
```

Iterates an array, exposing each element as `as` and the position as `$index`.
`hint-placeholder-count` only affects streaming placeholders during design-time rendering; it has
no effect in the shipped app. A non-array value renders nothing and warns.

### `sc-if`

```html
<sc-if value="{{ isConsole }}" hint-placeholder-val="{{ false }}"> … </sc-if>
```

Truthiness test. There is no `sc-else` branch in use here — render the alternative in a second
`sc-if` with the negated flag, or pick the content in `renderVals()`.

### Attributes

| Attribute | Meaning |
| --- | --- |
| `onClick`, `onInput`, `onContextMenu`, … | Mapped to the React handler of the same name. Bind a function from `renderVals()`. |
| `style="…"` | A CSS string; parsed into a React style object. Interpolation inside it is fine. |
| `style-hover="…"`, `style-focus="…"` | Compiled into a generated CSS class for that pseudo-class. **Evaluated at compile time — `{{ }}` inside a `style-*` value does not bind.** |
| `class` / `for` | Rewritten to `className` / `htmlFor`. |
| `data-tauri-drag-region="true"` | Makes the custom title bar draggable. |
| `data-appear="<name>"` | Marks the element as an appearance-editor target. See [../features/appearance.md](../features/appearance.md). |
| `data-anchor="<target>"` | Marks a search field so the regex builder can anchor its popover to it. See [../features/regex-builder.md](../features/regex-builder.md). |

## Render cycle

1. React renders the host component.
2. The host calls `logic.renderVals()` and merges the result over `props`.
3. Each compiled builder resolves its `{{ … }}` holes against that flat object and produces React
   elements.
4. `componentDidUpdate()` runs — `app/index.html` uses it to re-apply per-element appearance
   overrides to the live DOM through `document.querySelectorAll("[data-appear]")`.

`renderVals()` is called on **every** render, so it must stay cheap and must not have side
effects. Anything expensive (filtering a large catalog, evaluating a regex) is computed once at
the top of the method and reused.

If `renderVals()` throws, the runtime catches it and paints a red `Component.renderVals(): …`
overlay in the corner of the host rather than blanking the app.

## Adding a panel

A panel is a nav destination with its own body. Five edits, all in `app/index.html` unless noted.

1. **Add the nav entry.** In the `NAV` array at the top of the logic script:
   ```js
   { id: "audit", icon: "◎", label: "Audit", hint: "What the last run actually did" }
   ```
   The rail renders from `navRows`, which is derived from `NAV`, so no template change is needed
   for the button itself.

2. **Add any state it owns.** In the `state` class field — a query string, the selected row, a
   result cache. Persist only what should survive a restart, via `CX.store.set`.

3. **Add the body to the template.** Beside the other panels, inside the scrolling content area:
   ```html
   <sc-if value="{{ isAudit }}" hint-placeholder-val="{{ false }}">
     <div style="padding:20px 24px;max-width:940px;margin:0 auto">
       <div data-appear="Audit header" style="…">{{ auditTitle }}</div>
       <sc-for list="{{ auditRows }}" as="a" hint-placeholder-count="4">
         <div onContextMenu="{{ a.context }}" data-appear="Audit row" style="…">{{ a.text }}</div>
       </sc-for>
     </div>
   </sc-if>
   ```
   Give every distinct visual element a `data-appear` name — that is what makes it customisable.

4. **Expose the values.** In `renderVals()`:
   ```js
   isAudit: st.nav === "audit",
   auditTitle: CX.i18n.t("audit.title"),
   auditRows: rows.map((r) => ({
     key: r.id,
     text: r.text,
     context: (e) => this.menuAt(e, r.text, [this.copyItem(r.text), this.appearItem(e)])
   })),
   ```
   Every row needs a stable `key`. Every context menu should end with `this.appearItem(e)` so the
   element is reachable from **Edit appearance…**.

5. **Wire the sidebar list and its search.** `listConfig()` returns the title, placeholder and
   rows for the sidebar in the current nav mode; add a branch for the new id. If the panel has its
   own search field, give it `data-anchor="<target>"`, store `<target>Query` and `<target>Regex`
   in state, add a case to `sampleFor(target)` and filter with `this.matcher(query, spec)` so the
   field gets the anchored regex builder for free.

Then check the required cross-cutting rules before calling it done:

- Copy goes through `CX.i18n.t()` so all three language modes and both funny sliders apply.
- Informational results become notifications (`CX.notify.*`), not modal dialogs.
- A change the user could regret gets a `CX.vcs.commit(message, kind)` so it lands in History.
- Anything long-running streams through `codex_run` rather than blocking on `codex_capture`.

## Failure modes

| Symptom | Cause |
| --- | --- |
| A value renders as blank and the console logs `never resolved` | The key is missing from `renderVals()`, or the path is misspelled |
| `dc-runtime: window.React is not available yet` | Script order changed — the vendored React files must load before `support.js` |
| A red `Component.renderVals(): …` overlay | `renderVals()` threw; the message is the original error |
| The whole app is blank | The logic script did not define `class Component extends DCLogic`, or it threw at evaluation time |
| `sc-for … is not an array` warning | The bound value is `undefined` or an object; guard it in `renderVals()` |
| A `style-hover` colour never changes | `{{ }}` does not bind in `style-*`; use a literal or add a class |
| An input loses focus on every keystroke | The element's key changed between renders — check that list rows carry stable `key` values |

## Security considerations

- The logic script is evaluated with `new Function`. It is a **trusted, first-party file bundled
  into the installer**; it is never fetched, never user-supplied, and the CSP has no `unsafe-eval`
  exemption for anything else. Do not add a code path that evaluates text from disk, from the
  CLI's output or from a config file.
- Template interpolation escapes automatically (values become React text nodes), so CLI output
  rendered through `{{ }}` cannot inject markup. Never route CLI output through
  `dangerouslySetInnerHTML`.
- User-supplied regular expressions are evaluated only through `CX.evaluate`, which is bounded —
  see [../features/regex-builder.md](../features/regex-builder.md).
- `app/support.js` is generated. Patching it by hand means the next regeneration silently drops
  the patch; fix the template or the logic class instead.

## Verification

1. **The structural invariants hold.**
   ```bash
   grep -c '<x-dc>' app/index.html                       # 1
   grep -c 'class Component extends DCLogic' app/index.html   # 1
   grep -n '<script src=' app/index.html                 # vendor React before support.js
   ```
2. **Every `{{ hole }}` in the template has a producer.** Extract the identifiers and check them
   against `renderVals()`:
   ```bash
   grep -o '{{ *[a-zA-Z_][a-zA-Z0-9_]* *}}' app/index.html | tr -d '{} ' | sort -u
   ```
   Names that appear only inside an `sc-for` body are supplied by the `as` alias, not by
   `renderVals()`.
3. **Open the page in a browser** (`app/index.html` directly). The title bar must read
   `Browser preview` and the console must be free of `[dc-runtime]` warnings. This checks the
   template only — see [tauri-bridge.md](tauri-bridge.md) for what browser mode cannot prove.
4. **Open it in the shell** (`npx --yes @tauri-apps/cli@2 dev`) and confirm the same panels render
   with real data and the title bar reads `Tauri IPC`.
5. **Resize to the configured minimum** (960 × 640, from `src-tauri/tauri.conf.json`) and check at
   100 / 125 / 150 / 200 % display scale in all three language modes that nothing clips.
