# Regex builder

> Guided pattern construction, a raw editor, live matches and bounded evaluation — anchored beside
> the search bar it belongs to.

**Implementation:** `evaluate`, `CONSTRUCTS`, `FLAGS` and `LIMITS` in `app/codex-core.js`; the
builder panel and its anchoring in `app/index.html` (`openRegexFor`, `sampleFor`, `matcher`).

## The engine

The engine is **the JavaScript `RegExp` of the WebView2 runtime the app is rendering in** — the
same engine the app's own filtering uses. There is no second dialect, no server-side evaluation
and no translation layer, so a pattern that works in the builder works in the search bar it was
built for, byte for byte.

Consequences worth stating to users, because they surprise people arriving from PCRE:

- **No atomic groups and no possessive quantifiers.** `a++` is a syntax error, not a possessive
  match. The construct palette says so in its label.
- **Lookbehind is supported** (`(?<=…)`, `(?<!…)`) — modern V8 has it.
- **Named groups** (`(?<name>…)`) are supported and surfaced as `named` on each match.
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
| `v` | Unicode sets (newer engines; falls back to a syntax error where unsupported) |
| `y` | Sticky |
| `d` | Match indices |

`evaluate()` **always adds `g`** internally, because it walks every match to build the results
list. That is an implementation detail of the preview, not a change to the pattern you copy out.

Search filtering strips `g` (and, in the tab predicate, `y`) before testing, since a stateful
`lastIndex` would make the same pattern match a row on one pass and miss it on the next.

## The bounds that stop catastrophic backtracking

`CX.LIMITS`, applied by `CX.evaluate(pattern, flags, sample)`:

| Limit | Value | Enforced how |
| --- | --- | --- |
| `pattern` | 2000 characters | Rejected before compiling: *"Pattern exceeds 2000 characters."* |
| `sample` | 20000 characters | Rejected before compiling: *"Sample exceeds 20000 characters."* |
| `matches` | 500 | Collection stops and `truncated: true` is reported |
| `ms` | 300 | The elapsed time is checked every 200 iterations; on overrun `timedOut: true` and the result is not `ok` |

The timeout message names the likely cause rather than shrugging:
*"Evaluation stopped after 300 ms (possible catastrophic backtracking)."*

This is an honest mitigation, not a guarantee. **JavaScript regex evaluation is not
interruptible**: the check happens between matches, so a single pathological match — the classic
`(a+)+$` against a long run of `a` — can still block the UI thread inside one `exec` call before
any bound is consulted. The 20 000-character sample cap is what keeps that bounded in practice.
Do not remove it, and do not raise it without moving evaluation off the main thread.

A zero-width match advances `lastIndex` manually, so a pattern like `^` or `\b*` produces a finite
result list instead of looping forever.

`evaluate()` returns:

```jsonc
{ "ok": true, "error": null, "ms": 1.2, "truncated": false, "timedOut": false,
  "matches": [ { "index": 12, "text": "…", "groups": ["…"], "named": null } ] }
```

## Guided construction

`CX.CONSTRUCTS` supplies the palette, grouped so a user who does not write regex daily can build
one by clicking:

| Group | Contents |
| --- | --- |
| Characters | `.` `\d` `\w` `\s` `\D` `\S` `[abc]` `[^abc]` `[a-z]` `\p{L}` |
| Anchors | `^` `$` `\b` `\B` |
| Quantifiers | `*` `+` `?` `{2,4}` `*?` (and the note that possessive `++` is not JavaScript) |
| Groups | `(…)` `(?:…)` `(?<name>…)` `(?=…)` `(?!…)` `(?<=…)` `(?<!…)` `a\|b` |

Each token carries a plain-language description shown on hover, and clicking it inserts the token
into the raw pattern editor. Alternation and literals are typed directly.

## Every search bar has one, anchored beside it

This is the product rule, not a nicety: **a builder belongs to the field the user is already
typing in.**

Mechanically, in `app/index.html`:

1. The search field's container carries `data-anchor="<target>"`.
2. Its trailing `.*` button calls `openRegexFor("<target>", currentQuery)`.
3. `openRegexFor` measures the anchor with `getBoundingClientRect()`, clamps the popover inside
   the viewport (`Math.min/Math.max` against `window.innerWidth/innerHeight`) and opens it just
   below the field, pre-loaded with the current query as the starting pattern.
4. `sampleFor(target)` fills the sample box with **the values that field actually filters** — the
   extension titles, the setting keys, the slash-command names, the dropdown options, the palette
   entries — so "does this match?" is answered against real data rather than a lorem-ipsum
   paragraph.
5. **Apply** stores `{ pattern, flags }` as `<target>Regex` in state; `matcher(query, spec)` then
   filters with the compiled pattern instead of the plain-text substring test.

Existing anchors: the sidebar list (`list`), the Extend filter (`ext`), the Config filter (`set`),
the slash-command catalog (`slash`), the dropdown filter (`dd`) and the command palette
(`palette`).

**Plain text is the default.** Typing in the field clears any applied pattern
(`setListQuery` sets `listRegex: null`); regex applies only when the user opens the builder and
presses Apply. The field's border and the `.*` button change colour while a pattern is active, and
the placeholder becomes `/<pattern>/` so the mode is never ambiguous.

### Where a builder is still missing

Every collection search in the shipped template has one. The rule also requires an anchored
builder on **every settings, preferences and properties surface**, including each tab within
them. The Config panel's search covers the current section's fields; a search that spans all
sections and reports "this match is on another tab" is **not implemented yet**. Treat that as
outstanding work rather than a documented behaviour.

## Configuration

| Knob | Where | Default |
| --- | --- | --- |
| Bounds (`pattern`, `sample`, `matches`, `ms`) | `CX.LIMITS` in `app/codex-core.js` | 2000 / 20000 / 500 / 300 |
| Initial flags for a newly opened builder | `state.regexFlags` in `app/index.html` | `["g", "i"]` |
| Per-field applied pattern | `state.<target>Regex` | `null` (plain text) |
| Construct palette | `CX.CONSTRUCTS` | four groups, as above |

None of these are user-editable settings, and none are persisted: an applied pattern lasts for the
session, and closing the panel does not silently keep filtering.

## Failure modes

| Symptom | What the user sees | Cause |
| --- | --- | --- |
| Invalid pattern | The `RegExp` constructor's own message, verbatim | Syntax error — the message names the position |
| Empty pattern | *"Empty pattern — nothing is matched."* | Guard against a blank filter silently hiding everything |
| Pattern too long / sample too long | *"Pattern exceeds 2000 characters."* / *"Sample exceeds 20000 characters."* | Bounds |
| More than 500 matches | Results list truncated, `truncated: true` | Bound; the pattern is still valid |
| Evaluation timeout | *"Evaluation stopped after 300 ms (possible catastrophic backtracking)."* | Nested quantifiers over a long sample |
| Applied pattern matches nothing | The list is empty | Honest no-match; the placeholder still shows `/pattern/` so the cause is visible |
| A broken pattern applied to a list | `matcher()` falls back to matching everything | Deliberate: a filter that cannot compile must not hide every row and imply the list is empty |

## Security considerations

- **Everything is evaluated locally.** Patterns and sample text never leave the process — no
  network call, no telemetry, no persistence to disk.
- **Regex denial of service is mitigated, not eliminated.** See the bounds above; the sample cap
  is the load-bearing one.
- **Sample text can contain whatever the field filters**, which may include file paths, session
  names or config keys. It is never logged, never committed to the local history and never sent
  anywhere.
- **Applied patterns filter labels only.** No search in Studio inspects file contents, transcript
  bodies or hidden state — a user must be able to predict a filter's result from what is on
  screen.
- **Unicode is opt-in.** Without `u`, `\p{…}` silently means something else. The palette labels the
  requirement so a user does not conclude the class is broken.

## Verification

Cases to exercise against the real engine, from a real search field:

1. **Valid pattern:** `^gpt-5` against the model list — matches, results panel lists index and
   text.
2. **Invalid pattern:** `(` — the constructor's message appears, nothing crashes, the list keeps
   rendering.
3. **No match:** `zzzz` — an honest empty state, not an error.
4. **Unicode:** `\p{Han}` with `u` on matches Cantonese labels; the same pattern with `u` off
   reports a different (and correct) result. Switch the app to `yue` first so there is Han text to
   match.
5. **Multiline:** `^codex` with `m` against a multi-line sample matches every line, not only the
   first.
6. **Zero-width:** `\b` — terminates and reports finite matches.
7. **Capture groups:** `(\w+)-(\w+)` — the results rows show both groups;
   `(?<a>\w+)` populates `named`.
8. **Adversarial:** `(a+)+$` against 5000 `a` characters — the app either times out with the
   catastrophic-backtracking message or is saved by the sample cap. It must not hang forever.
9. **Bounds:** a 2001-character pattern and a 20001-character sample are both refused by message.
10. **Plain text vs regex:** typing `.*` in the field with no pattern applied matches the literal
    characters; the same string applied through the builder matches everything. The two modes must
    visibly differ.
11. **Anchoring:** open the builder from each search field in turn and confirm the popover appears
    beside *that* field, stays inside the viewport near the window edge, and that
    <kbd>Esc</kbd> closes it.
12. **Independence:** apply a pattern to the Extend filter, then to the Config filter. Neither may
    change the other's query, flags or mode.
