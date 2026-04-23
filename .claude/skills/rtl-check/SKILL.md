---
name: rtl-check
description: Verify Arabic / RTL layout correctness across mobile and admin panel. Checks for directional layout bugs, mirrored icons, and hardcoded left/right styles. Use when auditing a screen for Arabic users or before an AR-focused release.
argument-hint: [optional-path]
---

Audit RTL correctness for $ARGUMENTS (default: all of `mobile/src/` and `server/admin-web/src/`).

The app is used primarily in Arabic by Abouna Dawood and parishioners. RTL must feel native — not flipped-in-reverse.

## Mobile (React Native)

Check each screen/component for:

### Hard-coded directional styles
Grep for and flag:
- `textAlign: 'left'` or `textAlign: 'right'` — should be `textAlign: 'auto'` or `I18nManager.isRTL`-aware.
- `marginLeft` / `marginRight` / `paddingLeft` / `paddingRight` on anything language-sensitive — prefer `marginStart`/`marginEnd`, `paddingStart`/`paddingEnd`.
- `left:` / `right:` absolute positioning on chrome that should flip.
- `flexDirection: 'row'` on rows that include a leading icon, chevron, back arrow, or avatar — confirm they read correctly in AR (they should, because RN auto-flips `row` → `row-reverse` in RTL, but only if you haven't opted out).
- `I18nManager.forceRTL(false)` or `allowRTL(false)` — should be intentional; flag for confirmation.

### Icons that must mirror
- Back arrows, forward chevrons, next/prev, reply, share-with-arrow. Confirm each is either imported as a direction-aware variant or wrapped with `{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }`.
- Icons that must NOT mirror: logos, crosses, church/religious symbols, numbers, play-button triangles for non-video media. Flag any of these that are being mirrored by accident.

### Fonts
- AR text uses `fontFamilies.ar` from [mobile/src/theme/fonts.ts](mobile/src/theme/fonts.ts) (`Amiri_700Bold` for headings, `NotoNaskhArabic` for body). Flag any Latin-only font on a Text node that renders AR.

### Input fields
- `TextInput` with `textAlign: 'auto'` so it follows the typed content, not the UI direction.
- Placeholders match the language of the current UI.

## Admin panel (web)

Check each page/component for:

### CSS logical properties
- Use `margin-inline-start` / `margin-inline-end`, `padding-inline-*`, `inset-inline-*` instead of `left`/`right`.
- `text-align: start` instead of `text-align: left`.
- Flex containers with directional children rely on `flex-direction: row` + `dir="rtl"` on an ancestor.

### The `dir` attribute
- `<html dir="rtl">` when UI language is AR (check [server/admin-web/src/i18n.ts](server/admin-web/src/i18n.ts) or main.tsx for where direction is set).
- Per-component `dir="auto"` on any element that renders user-entered content that could be mixed.

### Numbers & dates
- Latin digits vs Arabic-Indic digits — confirm the project's chosen convention and flag inconsistency.
- Date strings use `toLocaleDateString('ar-EG', ...)` (or the project's chosen AR locale) when UI language is AR.

## Output

Group findings:

1. **Breaks in AR** — anything a parishioner would notice (mirrored cross, wrong-side back arrow, English font on AR text, misaligned row).
2. **Layout drift** — hardcoded left/right that mostly works but will bite later.
3. **Polish** — number formatting, dir="auto" on user-content fields.

Each finding: file:line, what's wrong, what it should be. If you can, suggest the one-line fix inline.
