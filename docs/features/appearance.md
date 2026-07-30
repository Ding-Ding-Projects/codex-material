# Appearance

> Every rendered element is its own customisation target, edited from a non-modal popover anchored
> beside the element itself — with typography controls, an infinite colour picker and a colour
> translator that speaks twelve colour spaces.

**Implementation:** the editor panel and its bindings in `app/index.html` (`appearItem`,
`applyAppearance`, `patchAppear`, and the `appear*` / `colorRows` / `contrastLabel` keys of
`renderVals`); the colour mathematics in `CX.color` (`app/codex-core.js`). Deeper typography is
scheduled for `app/cx-appearance.js`.

## How an element becomes editable

Two things, both in the template:

1. `data-appear="<name>"` on the element. The name is the identity of that target — it keys the
   saved overrides, so renaming it orphans a user's customisation.
2. `this.appearItem(e)` as the last entry of the element's context menu. It walks up from the
   event target with `closest("[data-appear]")`, so a menu opened anywhere inside the element
   finds the right target and the menu entry reads **Edit appearance — Navigation rail** rather
   than a generic label.

Every panel added to the app must do both. Elements currently carrying `data-appear` include the
title bar, the lifetime-cost chip, the navigation rail, the tab strip, every search bar, list
items, message bubbles, the flag panel, the command preview, filter bars, the settings panel, the
TOML preview, cost inputs, health cards, runtime cards, commit rows, the command catalog, the
composer, the command palette, dropdowns and the regex builder itself.

## The editor

Opened from **Edit appearance…** in any element's right-click menu. It is a **non-modal popover**
positioned from the click point and clamped inside the viewport
(`Math.min(e.clientX, window.innerWidth - 350)`, and likewise vertically), so it stays beside what
is being edited and never lands half off-screen. <kbd>Esc</kbd> closes it; the rest of the app
stays live and repaints as values change.

### What it edits today

| Control | Values | Applied as |
| --- | --- | --- |
| Font family | Default (Roboto), Roboto Mono, Georgia, Helvetica Neue, System UI | `font-family` |
| Size | 70–180 %, step 5 | `font-size: <n>%` |
| Weight | 300–700, step 100 | `font-weight` |
| Italic / Underline / Strike / Wide | On/off | `font-style`, `text-decoration`, `letter-spacing: .06em` |
| Colour | HSV sliders (hue 0–360, saturation 0–100, value 0–100) plus direct hex entry | `color` |
| Translator | 12 rows, click to copy | — |
| Contrast | Live ratio against the current theme surface | — |
| Reset element / Reset all | — | Removes the override(s) |

Overrides are applied by `applyAppearance()` on every `componentDidUpdate`, which walks
`[data-appear]` elements and writes inline styles. An unset property is written as `""`, which
restores the stylesheet value — so a reset genuinely reverts rather than freezing the default.

### Status: what is required and not yet shipped

Stated plainly rather than implied:

| Required | State |
| --- | --- |
| Every installed font, searchable, each name rendered in its own face | **Not shipped.** The picker offers five hard-coded families. The backend command `codex_fonts` already returns the installed families from `%WINDIR%\Fonts` and `%LOCALAPPDATA%\Microsoft\Windows\Fonts` — it is not yet wired to the picker, and its values are file stems that need mapping to family names. |
| Word-depth typography: variable-font axes, small caps, super/subscript, underline style and colour, double strikethrough, overline, word spacing, line height, baseline offset, text direction, alignment, highlight, outline, shadow, glow | **Not shipped.** Four toggles plus size, weight and colour exist today. |
| A continuous 2-D colour field / wheel | **Partly shipped.** Hue, saturation and value are continuous sliders plus free hex entry — continuous, not swatch-only — but there is no 2-D field or eyedropper. |
| Named presets, user-saved themes, export/import as a file | **Not shipped.** Overrides persist, but cannot be named, exported or shared. |
| Per-element search wired to the regex builder | **Not shipped** for the appearance editor's own controls. |
| Density and seed-colour controls | `CX.settings` carries a `density` value; the appearance editor does not expose it yet. |
| Unsupported properties shown with a capability explanation instead of disappearing | **Not applicable yet** — nothing is hidden, because nothing beyond the list above is offered. |

Do not describe any of the above as working. Adding them is the next project-changing task's job.

## The infinite colour picker and translator

`CX.color` is the engine. It is continuous by construction: `hsvToRgb` accepts any hue in
0–360 and any saturation/value in 0–100, and the hex field accepts `#rgb`, `#rrggbb` and
`#rrggbbaa`. Swatches, when they exist, will be a convenience on top — never a replacement.

`CX.color.translate(hex)` returns the same colour in twelve representations, each copyable with
one click:

| | | |
| --- | --- | --- |
| `HEX` | `HEX8` (with alpha) | `RGB` |
| `RGBA` | `HSL` | `HSV` |
| `HWB` | `LAB` | `LCH` |
| `OKLAB` | `OKLCH` | `CMYK` |

Alpha is preserved through `hexToRgb`/`rgbToHex` — an 8-digit input round-trips, and a fully
opaque colour omits the alpha pair rather than appending a redundant `ff`.

`CX.color.contrast(fg, bg)` computes the WCAG ratio from relative luminance, and the editor shows
it live against the current theme's surface with a verdict — *passes AA body text* (≥ 4.5),
*large text only* (≥ 3), or *fails AA*. That readout is the point of the picker: a user changing a
label's colour finds out immediately if they have made it unreadable.

**Known conversions to treat with care:** `LAB`/`LCH` use the D65 white point via the sRGB matrix
in `CX.color.lab`, and `CMYK` is a naive device-independent conversion with no ICC profile. Both
are correct for on-screen reasoning and are **not** print-accurate.

## Configuration and persistence

| What | Where | Shape |
| --- | --- | --- |
| Per-element overrides | `localStorage["codexstudio.appearance"]` | `{ "<data-appear name>": { font, size, weight, italic, underline, strike, wide, color } }` |
| Theme (light/dark) | `localStorage["codexstudio.theme"]` | `"dark"` \| `"light"`, mirrored to `<html data-theme>` |
| Density, and other Studio settings | `localStorage["codexstudio.settings"]` | `{ density, dimSum, narrator, … }` |

Appearance is a **Studio preference and never enters `config.toml`** — uninstalling Studio must
not change how the CLI behaves.

Theme tokens are Material 3 custom properties declared in the `<helmet>` block of
`app/index.html`: `--m3-surface*`, `--m3-on-surface*`, `--m3-primary*`, `--m3-secondary-container`,
`--m3-tertiary`, `--m3-error*`, `--m3-outline*`, `--m3-ok`, `--m3-warn`, plus `--cx-cjk` for the
Traditional Chinese fallback stack. Light mode overrides them under `[data-theme="light"]`. New UI
must use these tokens, never literal colours — a hard-coded hex is invisible to theming and to the
appearance system.

## Failure modes

| Symptom | Cause |
| --- | --- |
| **Edit appearance…** opens with a generic label and edits nothing | The element has no `data-appear` ancestor |
| An override survives but the element looks unstyled | The `data-appear` name changed; the saved entry is now orphaned. Reset all, or rename it back |
| A colour override does not appear | `applyAppearance` sets `color` on the marked element; a child with its own explicit colour wins. Mark the child instead |
| The contrast readout says *Enter a valid colour* | `hexToRgb` rejected the text; only 3-, 6- and 8-digit hex parse |
| Overrides lost after restart | `localStorage` was unavailable (private mode); `CX.store` swallows the failure by design so the app still runs |
| Editor opens off-screen near an edge | Should not happen — the position is clamped. If it does, the clamp constants no longer match the panel size |
| A `style-hover` colour ignores the override | Pseudo-class styles are compiled into a CSS class at parse time; inline overrides do not reach them |

## Security considerations

- **Everything is local.** No font, colour or theme is fetched; `codex_fonts` reads two local
  directories and returns names only.
- **Contrast is a safety feature, not decoration.** A theming system that lets a user make an
  error message invisible has created an accessibility failure. Keep the live readout visible
  wherever a foreground colour is edited.
- **`codex_fonts` returns file stems, not family names.** Treat them as candidates to validate
  before writing into `font-family`, or the picker will offer families the renderer cannot
  resolve.
- **Overrides are inline styles written into the live DOM**, always from a fixed set of properties
  with values the editor generated. Never widen `applyAppearance` to write arbitrary CSS text
  from stored state — that is a style-injection primitive.
- **Export/import, when it lands, is an untrusted-file boundary.** A shared theme file must be
  validated key by key against the known property set, not merged wholesale.

## Verification

1. Right-click each `data-appear` element in turn: the menu's last entry names that element, and
   the popover opens beside it.
2. Change font, size, weight and each toggle; the live UI updates immediately — no restart.
3. Drag the hue slider through 0–360 and confirm the twelve translator rows update together and
   the hex field agrees. Click a row and confirm the clipboard receives that exact string.
4. Type `#7f3` and `#7f3a00cc` into the hex field: both parse, and alpha survives in `HEX8` and
   `RGBA`.
5. Set a low-contrast colour and confirm the readout drops through *large text only* to
   *fails AA*.
6. **Reset element** restores only that element; **Reset all** clears every override.
7. Restart the app: surviving overrides match what was set. Switch theme and confirm overrides
   still apply and the contrast readout re-evaluates against the new surface.
8. Open the popover near each screen edge at 100 / 125 / 150 / 200 % display scale and confirm it
   stays fully visible.
9. Switch to `yue` and to bilingual mode and confirm no editor label clips at the minimum window
   size (960 × 640).
10. Confirm the editor is reachable by keyboard and returns focus to the originating element when
    closed — see [../experience/accessibility.md](../experience/accessibility.md).
