---
name: redesign-screen
description: Rewrite a single mobile screen or admin page against the new "Modern Coptic — Parchment & Iconostasis" design system (tokens, Lucide icons, warm shadows, RTL-correct). Use when migrating a screen off the old hardcoded styling.
argument-hint: [path-to-screen-or-page]
---

Redesign $ARGUMENTS against the current design system.

Do not touch behavior or data flow. Only the visual layer, icon set, and token usage. If the component mixes logic with styling, carefully preserve every hook call, effect, navigation call, and API call — this is a rewrite of the JSX/StyleSheet, not the logic.

## 1. Read the system first

Before writing anything, read (so you know the exact token names and values):

- Mobile: [mobile/src/theme/index.ts](mobile/src/theme/index.ts) — re-exports `colors`, `colorsDark`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `getFontFamily`, `useTheme`, `ThemeProvider`.
- Admin: [server/admin-web/src/theme/index.ts](server/admin-web/src/theme/index.ts) and [server/admin-web/src/theme/tokens.css](server/admin-web/src/theme/tokens.css) — prefer CSS variables (`var(--color-primary)`) for anything style-block based, use TS tokens for inline style objects.

Also scan 1–2 already-redesigned neighbors of the target file. If none exist yet, this is the flagship — match the system spec directly.

## 2. Apply the design system

### Colors
- No hex literals. Every color comes from the token set.
- Backgrounds: `parchment` (main), `surface`/`parchmentDark` (cards), `white` for input fields that need to pop.
- Text: `ink` (primary body/headings), `inkMuted` (secondary), `inkFaint` (tertiary, timestamps).
- Accents: `primary` for important CTAs, `gold` for decorative dividers and passive highlights.
- Feedback: `error` / `success` / `warning` + their `*Soft` variants for backgrounds.

### Typography
- Use the `typography` scale: `display` / `h1` / `h2` / `h3` / `body` / `bodySmall` / `caption` / `overline`.
- Font family comes from `getFontFamily(lang)` — never hardcode `'Amiri_700Bold'` etc.
- On admin, use `var(--font-...)` or the TS `fonts` export. Section labels use the `overline` style (uppercase, tracked).

### Spacing & radius
- Padding / margins use the `spacing` scale. No magic numbers like `17` or `23`.
- Card radius: `md` (10). Hero/modal radius: `lg` (16). Chip radius: `sm` (6) or `full` for pills.

### Shadows
- Cards floating over parchment: `shadows.sm`.
- Elevated surfaces (sticky headers, modals): `shadows.md`.
- Menus, tooltips, popovers: `shadows.lg`.
- Never use the RN default shadow colors — always import from the token set (they're already warm-tinted).

### Icons — Lucide
- Mobile: `import { Bell, Calendar, Settings, ... } from 'lucide-react-native'`.
- Admin: `import { Bell, Calendar, Settings, ... } from 'lucide-react'`.
- Default size 24, stroke 1.5, color = `colors.ink` or `colors.primary` depending on role.
- For RTL-directional icons (ChevronLeft/Right, ArrowLeft/Right), pick the correct variant based on `I18nManager.isRTL` (mobile) or `document.dir` (admin). Icons like cross/candle/moon never mirror.

### Motion
- Button press feedback: opacity or scale transition at `motion.duration.micro` with `motion.easing.standard`.
- Screen transitions and modals: `motion.duration.medium`.

## 3. Signature details

Apply these selectively where the screen warrants them (not everywhere):

- **Gold hairline under H1s** — a 1px `gold` border-bottom, 2–4px wide, not full-width, sits under the main screen heading.
- **Card top-edge gold accent** — on hero / pinned cards, add a 2px `gold` border-top inside the card.
- **Coptic cross motif** — use in empty states and as a subtle divider ornament. A simple outlined cross glyph works; if the codebase already has an SVG, reuse it.
- **Candle state** — for announcement/event cards: lit candle icon = live, unlit/wick-only = scheduled, extinguished = expired.

## 4. RTL & i18n

- Every user-facing string must go through `t(...)`. If the old screen had a hardcoded string, add it to all three of ar/ru/en locale files — don't leave any language behind.
- Directional layout: use `start`/`end` padding and margins (mobile: `paddingStart`, admin: `padding-inline-start`). Avoid `left`/`right` physical sides for anything language-sensitive.
- If the screen has a back arrow / chevron, verify the icon direction flips for RTL.

## 5. Accessibility

- Every icon button has an `accessibilityLabel` (mobile) / `aria-label` (admin) translated via i18n.
- Tap / click targets ≥ 44×44.
- `accessibilityRole` / semantic HTML set correctly.
- Don't hardcode `allowFontScaling={false}` on body text.

## 6. Verify

After the rewrite:

1. Run `npx tsc --noEmit` from the appropriate workspace (`mobile/` or `server/admin-web/`). Zero new errors.
2. Mentally walk through: AR (RTL), RU, EN. Confirm text direction, fonts, and any directional icons.
3. If the screen has form inputs or long content, confirm it works at 320 px width (admin) or a small phone (mobile).

## Output

- List files changed (JSX + any new locale keys).
- Summarize what changed visually: "moved X to Y, replaced emoji with Lucide Bell, applied `shadows.sm` on the card, etc."
- Paste the diff for any non-obvious structural change (not line-by-line — just the important bits).
- Confirm tsc passed.
- Call out anything that needs a product decision (copy tone, whether to keep a section, etc.) — don't silently drop features.

## What NOT to do

- Don't rename, move, or restructure files.
- Don't refactor the data layer, hooks, or navigation. This is visual only.
- Don't add a new dependency. Lucide is already installed.
- Don't invent tokens. If you need a value that isn't in the system, flag it at the end of your output so we can decide whether to add it to the token set.
