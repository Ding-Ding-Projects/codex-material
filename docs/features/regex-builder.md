# Regex builder

> Guided pattern construction, a raw editor, live matches and bounded evaluation — anchored beside
> the search bar it belongs to, and refusing outright the shapes no time budget can save it from.

**Implementation:** `evaluate`, `nestedQuantifier`, `overlappingBranches`, `CONSTRUCTS`, `FLAGS`
and `LIMITS` in `app/codex-core.js`; the builder panel, `openRegexFor`, `sampleFor` and `matcher`
in `app/index.html`; a second, independent guard for changelog search in `app/cx-changelog.js`
(`nested`, `matcher`); a third, deliberately simpler one for tab labels in `app/cx-tabs.js`
(`predicate`).

## The engine

The engine is **the JavaScript `RegExp` of the Chromium runtime Electron bundles** — the same
engine every list filter in the app already uses. There is no second dialect, no server-side
evaluation and no translation layer, so a pattern that works in the builder works in the search
bar it was built for, character for character. Because Electron ships its own Chromium, the
dialect is the same on every machine; it does not vary with what the user has installed.

Consequences worth stating, because they surprise people arriving from PCRE:

- **No atomic groups and no possessive quantifiers.** `a++` is a syntax error, not a possessive
  match. The construct palette labels it as such.
- **Lookbehind is supported** — `(?<=…)` and `(?<!…)` both compile.
- **Named groups** `(?<name>…)` are supported and surfaced as `named` on each match row.
- **`\p{…}` needs the `u` flag.** Without it the escape is a literal `p`.

### Supported flags

All eight JavaScript flags, from `CX.FLAGS`:

| Flag | Meaning |
| --- | --- |
| `g` | Global — every match, not just the first |
| `i` | Ignore case |
| `m` | Multiline anchors: `^`/`$` match at line breaks |
| `s` | Dot matches newline |
| `u` | Unicode mode (required for `\p{…}` and astral escapes) |
| `v` | Unicode sets |
| `y` | Sticky |
| `d` | Match indices |

`CX.evaluate()` **always adds `g`** internally, because it walks every match to build the results
list. That is an implementation detail of the preview, not a change to the pattern you copy out.

Every *filtering* path strips the stateful flags before testing, because a carried `lastIndex`
would make the same row match on one pass and miss on the next:

| Caller | Strips |
| --- | --- |
| `matcher()` in `app/index.html` | `g` |
| `matcher()` in `app/cx-changelog.js` | `g` and `y` |
| `predicate()` in `app/cx-tabs.js` | `g` and `y` |

## The bounds

`CX.LIMITS`, applied by `CX.evaluate(pattern, flags, sample)`:

| Limit | Value | Enforced how |
| --- | --- | --- |
| `pattern` | 2000 characters | Rejected before compiling: *"Pattern exceeds 2000 characters."* |
| `sample` | 20000 characters | Rejected before compiling: *"Sample exceeds 20000 characters."* |
| `matches` | 500 | Collection stops, `truncated: true` is reported, the pattern is still valid |
| `ms` | 300 | Elapsed time checked **every 200 matches**; on overrun `timedOut: true` and `ok: false` |

A zero-width match advances `lastIndex` by hand (`if (m[0] === "") re.lastIndex++`), so `^`, `\b`
or `(?:)` produce a finite result list instead of spinning forever.

`app/cx-tabs.js` keeps its own smaller set — `{ pattern: 2000, matches: 5000, ms: 250 }` — because
it matches short tab labels rather than a sample blob. `app/cx-changelog.js` reads `CX.LIMITS`
when it is present and falls back to the same numbers when it is not.

## Why a time budget is not enough

This is the part that matters, and it is not a theoretical concern.

**A single `RegExp.exec` (or `test`) call cannot be interrupted from JavaScript.** There is no
preemption point inside it. The `LIMITS.ms` check in `evaluate()` sits in the `while` loop
*between* matches:

```js
if (++guard % 200 === 0 && performance.now() - t0 > LIMITS.ms) { res.timedOut = true; break; }
```

That loop body only runs after `re.exec()` has returned. A pattern whose cost is spent *inside*
one call never reaches the check at all. The window stops repainting, the title bar stops
responding, and the only remedy left to the user is killing the process.

So the ms budget protects against one thing — a cheap pattern producing an enormous number of
matches — and does nothing at all about the classic exponential blow-up. The only real defence is
to **refuse the shape before running it**.

### Measured

Against a 37-character sample (`"a".repeat(30) + "!"` in `tools/test-frontend.mjs`, and a longer
run of `a` by hand):

| Pattern | Result |
| --- | --- |
| `(a+)+$` | **Refused in under 1 ms** by `nestedQuantifier`, before `new RegExp` is even called |
| `(a+){1,20}$` | Before the guard was widened: **ran past 20 seconds** and froze the window |

That second row is the whole point. An earlier version of this guard treated `{n,m}` as a *safe*
outer repeat, and its error message recommended rewriting `(a+)+` as `(a+){1,20}`. The advice was
the defect: bounding the outer repeat does not remove the ambiguity that causes the backtracking,
it only caps the number of ways the engine may split the input — at twenty, which is astronomically
more work than the engine would do for `+` before giving up on a short string. **Bounding the outer
repeat is not a fix.** `tools/test-frontend.mjs` asserts that the remedy text never suggests it:

```js
const advice = CX.evaluate("(a+)+$", "g", "aaa").error;
assert.ok(!/for example \{1,20\}/.test(advice), "the remedy must not recommend the worse rewrite");
```

### What is refused

`nestedQuantifier(pattern)` walks the pattern, finds each group, and checks what follows it. Two
shapes are refused; both return the **offending fragment**, which the error message quotes back so
the user can see exactly which part of their pattern is the problem.

**1. A repeat applied to a group that already repeats.**

The outer repeat counts as "repeats" when it can apply the group more than once — `*`, `+`,
`{n,}`, and `{n,m}` with `m > 1`. `?`, `{1}`, `{0,1}` and `{1,1}` cannot, so they are not a risk
and are allowed through (`repeatsMoreThanOnce`).

| Refused | Allowed |
| --- | --- |
| `(a+)+$` | `(ab){1,3}` — the body has no inner repeat |
| `(a+){1,20}$` | `(a+)?` — the outer repeat runs at most once |
| `(a+){1,10}$` | `\d+` — no group |
| `(\w*)*` | `^(mcp\|plugin)-` — no outer repeat |

**2. A group whose alternation branches overlap.**

`(a|a)*` and `(x|xx)+y` never touch a nested `+`, and both blow up for the same underlying reason:
two branches that can match the same text give the engine an exponential number of equivalent ways
to split the input. `overlappingBranches` splits the group body on top-level `|` (skipping escapes,
character classes and nested groups) and compares the leading token of each branch; a shared or
unresolvable leading token means the branches may overlap and the pattern is refused.

Lookarounds are explicitly skipped — `(?=…)+` is a different shape and is not what this guard is
about — and `(?:…)` / `(?<name>…)` prefixes are stripped from the body before it is examined.

### The message

```
Refused: `(a+)+` repeats a group that already repeats. That takes exponential time inside a
single match attempt, where the 300 ms budget below cannot reach it — the window would simply
stop responding. Bounding the outer repeat does not help. Remove the inner repeat, or rewrite
the group so it cannot match the same text two ways.
```

The changelog engine carries the same refusal under the `rx.nested` key in `app/cx-changelog.js`,
in all five funny levels and both languages, and every one of them says that bounding the outer
repeat does not help. The bounds and the refusal are separate mechanisms and neither replaces the
other: the refusal handles shapes, the bounds handle volume.

### What the refusal does not cover

It is a syntactic guard over group structure, not a proof. A pattern that backtracks
catastrophically without repeating a group and without overlapping alternation branches will not be
caught, and will hit — or fail to hit — the ms budget exactly as described above. The 20 000-character
sample cap is the remaining load-bearing mitigation. **Do not raise it without moving evaluation off
the main thread**, which nothing in this repository does today.

### `evaluate()` returns

```jsonc
{ "ok": true, "error": null, "ms": 1.2, "truncated": false, "timedOut": false,
  "matches": [ { "index": 12, "text": "…", "groups": ["…"], "named": null } ] }
```

On a refusal it additionally carries `refused: "<the offending fragment>"`, which the test suite
asserts is non-empty so a refusal can never be a bare "no".

## Guided construction

`CX.CONSTRUCTS` supplies the palette, grouped so somebody who does not write regex daily can build
one by clicking:

| Group | Contents |
| --- | --- |
| Characters | `.` `\d` `\w` `\s` `\D` `\S` `[abc]` `[^abc]` `[a-z]` `\p{L}` |
| Anchors | `^` `$` `\b` `\B` |
| Quantifiers | `*` `+` `?` `{2,4}` `*?` — plus `++`, labelled *"(not in JS) use atomic-free rewrite"* |
| Groups | `(…)` `(?:…)` `(?<name>…)` `(?=…)` `(?!…)` `(?<=…)` `(?<!…)` `a\|b` |

Each token carries a plain-language description on hover; clicking appends it to the raw pattern
editor. The panel also shows the engine note verbatim:

> Engine: JavaScript RegExp — the same engine that filters these lists. Limits: pattern 2000 chars,
> sample 20000 chars, 500 matches, 300 ms. Nothing is persisted or sent anywhere.

## Every search bar has one, anchored beside it

This is the product rule, not a nicety: **a builder belongs to the field the user is already
typing in.**

Mechanically, in `app/index.html`:

1. The search field's container carries `data-anchor="<target>"`.
2. Its trailing `.*` button calls `openRegexFor("<target>", currentQuery)`.
3. `openRegexFor` finds the anchor with `document.querySelector('[data-anchor="…"]')`, measures it
   with `getBoundingClientRect()`, clamps the popover inside the viewport
   (`Math.min/Math.max` against `window.innerWidth`/`innerHeight`) and opens it just below the
   field — pre-loaded with the pattern already applied to that field, or the current query as a
   starting point.
4. `sampleFor(target)` fills the sample box with **the values that field actually filters** — the
   extension titles, the setting keys, the slash-command names, the dropdown options, the palette
   entries, the session names — so "does this match?" is answered against real data rather than a
   lorem-ipsum paragraph.
5. **Apply** stores `{ pattern, flags }` as `<target>Regex` in state and copies the pattern into
   `<target>Query`; `matcher(query, spec)` then filters with the compiled pattern instead of the
   plain-text substring test.

The nine anchored fields, one `data-anchor` each:

| Anchor | Field |
| --- | --- |
| `list` | The sidebar list search (sessions, commands, settings sections, history kinds — whatever the current tab lists) |
| `ext` | The Extend filter |
| `set` | The Config filter |
| `clog` | The changelog search |
| `studio` | The Studio settings search |
| `slash` | The slash-command catalog |
| `palette` | The command palette (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd>) |
| `dd` | The dropdown option filter — which is what the four tab searches ride on |
| `bulk` | The bulk-close query |

Each owns its own `<target>Query` and `<target>Regex` state, so no two fields share hidden state
and applying a pattern in one never changes another.

Every one of those fields also has a right-click menu (`filterItems`) offering *filter to this*,
*exclude this*, *starts with*, *exact match*, *open the regex builder with this* and *clear* — the
exclude/starts-with/exact entries write a real pattern into the same `<target>Regex` slot the
builder uses, so the modes cannot drift.

**Plain text is the default.** Typing in a field clears any applied pattern (every
`set<Target>Query` handler sets `<target>Regex: null`); regex applies only when the builder's
**Apply** is pressed. The field border and the `.*` button change colour while a pattern is active.

### Where the rule is not fully satisfied yet

The Config panel's search filters the fields of the **currently selected section only**
(`section.fields.filter(setMatch)`), so a setting whose name the user knows but whose section they
do not is not found, and there is no "this match is on another tab" affordance. That is
outstanding work, not documented behaviour.

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Bounds (`pattern`, `sample`, `matches`, `ms`) | `LIMITS` in `app/codex-core.js`, exported as `CX.LIMITS` | 2000 / 20000 / 500 / 300 |
| Tab-label bounds | `LIMITS` in `app/cx-tabs.js` | 2000 / 5000 / 250 |
| Initial flags for a newly opened builder | `state.regexFlags` in `app/index.html` | `["g", "i"]` |
| Per-field applied pattern | `state.<target>Regex` | `null` (plain text) |
| Construct palette | `CX.CONSTRUCTS` | four groups, as above |

None of these are user-editable settings and none are persisted: an applied pattern lasts for the
session, and closing the panel does not silently keep filtering.

## Failure modes

| Symptom | What the user sees | Cause |
| --- | --- | --- |
| Repeat over a repeating group | *"Refused: `(a+)+` repeats a group that already repeats…"*, with the fragment quoted | The guard, before compiling — see above |
| Overlapping alternation under a repeat | The same refusal, quoting `(a\|a)*` or `(x\|xx)+y` | `overlappingBranches` |
| Invalid pattern | The `RegExp` constructor's own message, verbatim | Syntax error; the message names the position |
| Empty pattern | *"Empty pattern — nothing is matched."* | Guard against a blank filter silently hiding everything |
| Pattern or sample too long | *"Pattern exceeds 2000 characters."* / *"Sample exceeds 20000 characters."* | Bounds, checked before compiling |
| More than 500 matches | Results truncated, `truncated: true`, status line says so | Bound; the pattern is still valid |
| Evaluation timeout | *"Evaluation stopped after 300 ms (possible catastrophic backtracking)."* | The between-match budget — a cheap pattern with an enormous match count |
| Applied pattern matches nothing | An empty list | Honest no-match, not an error |
| A broken pattern applied to a list | `matcher()` returns `() => true` and everything is shown | Deliberate: a filter that cannot compile must not hide every row and imply the list is empty |

## Security considerations

- **Everything is evaluated locally**, in the renderer. Patterns and sample text never leave the
  process: no network call, no telemetry, no write to disk. The CSP in `app/index.html` blocks the
  first of those at the platform level (`connect-src 'self'`).
- **Regex denial of service is mitigated in two layers**, and the layers do different jobs. The
  refusal removes the shapes that cannot be timed out; the bounds cap the shapes that can. Neither
  alone is sufficient and neither is a guarantee.
- **The sample cap is load-bearing.** It is the only thing standing between an uncaught
  pathological pattern and a frozen window.
- **Sample text can contain whatever the field filters**, which may include file paths, session
  names or config keys. It is never logged, never committed to the local history and never sent
  anywhere.
- **Applied patterns filter labels only.** No search in Studio inspects file contents, transcript
  bodies or hidden state — a user must be able to predict a filter's result from what is on screen.
- **Unicode is opt-in.** Without `u`, `\p{…}` means something else entirely. The palette labels the
  requirement so a user does not conclude the class is broken.

## Verification

`node tools/test-frontend.mjs` covers the engine directly — the refusal (five adversarial patterns,
each asserted to be refused in under 250 ms and to name its fragment), the four ordinary patterns
that must still be allowed, zero-width termination, invalid patterns, the match cap, the size
bounds, and capture/named groups.

By hand, from a real search field:

1. **Valid pattern:** `^gpt-5` against the model list — matches; the results panel lists index and
   text.
2. **Refusal:** `(a+)+$` — refused immediately, the fragment is quoted, and the message does not
   recommend `{1,20}`.
3. **The trap:** `(a+){1,20}$` — refused just as fast. If this one ever runs, the guard has
   regressed and the window will freeze.
4. **Overlap:** `(a|a)*$` and `(x|xx)+y` — both refused.
5. **False positives:** `(ab){1,3}`, `^(a|b)+$`, `\d+`, `^(mcp|plugin)-` must all still be
   accepted and match.
6. **Invalid pattern:** `(` — the constructor's message appears, nothing crashes, the list keeps
   rendering.
7. **No match:** `zzzz` — an honest empty state, not an error.
8. **Unicode:** `\p{Han}` with `u` matches Cantonese labels; without `u` it reports something
   different and correct. Switch the app to 廣東話 first so there is Han text to match.
9. **Multiline:** `^codex` with `m` over a multi-line sample matches every line.
10. **Zero-width:** `\b` terminates with finite, strictly increasing match indices.
11. **Capture groups:** `(\w+)-(\w+)` shows both groups; `(?<a>\w+)` populates `named`.
12. **Bounds:** a 2001-character pattern and a 20001-character sample are both refused by message.
13. **Plain text vs regex:** typing `.*` in the field with no pattern applied matches those literal
    characters; the same string applied through the builder matches everything. The two modes must
    visibly differ.
14. **Anchoring:** open the builder from each of the nine fields in turn. The popover must appear
    beside *that* field, stay inside the viewport near a window edge, and close on <kbd>Esc</kbd>.
15. **Independence:** apply a pattern to the Extend filter, then to the Config filter. Neither may
    change the other's query, flags or mode.
