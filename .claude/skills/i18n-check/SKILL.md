---
name: i18n-check
description: Verify every user-facing string has translations in all three languages (ar, ru, en) across mobile and admin panel, and flag hardcoded strings. Use when adding a new screen, preparing a release, or reviewing translation coverage.
argument-hint: [optional-scope: mobile | admin | all]
---

Audit i18n coverage. Scope = `$ARGUMENTS` (defaults to `all`).

## Mobile locales
- [mobile/src/locales/ar.json](mobile/src/locales/ar.json)
- [mobile/src/locales/ru.json](mobile/src/locales/ru.json)
- [mobile/src/locales/en.json](mobile/src/locales/en.json)

## Admin locales
- [server/admin-web/src/locales/](server/admin-web/src/locales/)

## Steps

1. **Key parity.** For each scope, diff the key sets across ar/ru/en. List:
   - keys present in one or two files but missing in the third
   - keys whose value is empty, equal to the key itself, or obviously still English inside the AR or RU file

2. **Hardcoded strings.** Grep the relevant source tree for:
   - JSX text nodes that contain Cyrillic, Arabic, or ≥2 consecutive English letters and are NOT wrapped in `t('...')` or `{t('...')}`.
   - `Alert.alert(...)`, `Text` children, `placeholder=`, `title=`, `accessibilityLabel=` with literal strings.
   - In mobile scope, check `mobile/src/screens/` and `mobile/src/components/`.
   - In admin scope, check `server/admin-web/src/pages/` and `server/admin-web/src/components/`.
   Skip: test files, locale JSON, type-only strings, console.log / throw new Error, log lines, file paths.

3. **Pluralization & interpolation.** Flag any `t(...)` call that uses string concatenation instead of i18next interpolation (`t('key', { name })`).

4. **Date/number formatting.** Flag `toLocaleString`/`toLocaleDateString` calls without an explicit locale argument that matches the current i18n language.

## Output

Report in three sections, in priority order:

- **Missing translations** — key: which file(s) miss it. Suggest a translation if you can infer it from the other two languages.
- **Hardcoded strings** — file:line, the literal, a proposed `t('namespace.key')` name, and the three-language entry to add.
- **Formatting issues** — file:line, what, suggested fix.

Finish with a coverage summary (e.g. `ar: 142/145, ru: 145/145, en: 145/145 — 3 keys missing from ar`).
