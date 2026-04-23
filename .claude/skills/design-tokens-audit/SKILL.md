---
name: design-tokens-audit
description: Find hardcoded colors, fonts, and spacing values that should use the theme tokens in mobile/src/theme and server/admin-web/src/theme. Use periodically or before a design refresh to keep styling consistent.
argument-hint: [optional-scope: mobile | admin | all]
---

Audit hardcoded design values that should reference the theme. Scope = $ARGUMENTS (default `all`).

## Source of truth

### Mobile
- Colors: [mobile/src/theme/colors.ts](mobile/src/theme/colors.ts) — `primary`, `primaryLight`, `gold`, `goldLight`, `ink`, `parchment`, `parchmentDark`, `muted`, `white`, `error`, `success`, `border`.
- Fonts: [mobile/src/theme/fonts.ts](mobile/src/theme/fonts.ts) — use `getFontFamily(lang)`.

### Admin
- Colors / fonts live under [server/admin-web/src/theme/](server/admin-web/src/theme/). Read those files first so you know the current token set before reporting drift.

## Steps

1. **Colors.** Grep the source tree for hex colors (`#[0-9a-fA-F]{3,8}`), `rgb(`, `rgba(`, `hsl(`. For each match:
   - If it matches a token's exact value, suggest replacing with the token reference.
   - If it's close (within a few points of lightness) to a token, flag as "should probably be `colors.X`".
   - If it's a one-off (e.g. a shadow rgba), note it but don't necessarily flag — shadows are sometimes deliberately off-palette.
   Skip locale JSON, asset files, and anything under `node_modules/`.

2. **Fonts.** Grep for `fontFamily:` and `font-family:`. Flag any value that isn't coming from the theme helper:
   - Mobile: must go through `getFontFamily(lang)` or reference `fontFamilies.*`. Flag literal `'Amiri_700Bold'` etc.
   - Admin: must come from the admin theme file.

3. **Spacing.** Less strict — flag only _repeated_ magic numbers (e.g. `padding: 16` appearing in 10+ files) as candidates for a `spacing` token if the theme doesn't already have one. Don't flag every number.

4. **Radii & shadows.** Same as spacing — flag only recurring values.

## Output

Report as a token-adoption scorecard:

- **Colors** — `X hardcoded instances across Y files`. Group by the token they should map to. Top offenders first.
- **Fonts** — each violation with file:line and suggested replacement.
- **Spacing / radii** — only if there's a clear recurring pattern worth tokenizing.

Finish with a priority list: the 5 changes with the highest consistency payoff, in the order you'd make them.
