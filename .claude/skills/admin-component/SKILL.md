---
name: admin-component
description: Scaffold a new React component for the admin panel at server/admin-web following the project's existing conventions (theme tokens, i18n, RTL-aware, mobile-responsive). Use when adding a component to the admin panel.
argument-hint: [ComponentName] [optional: page|component|form]
disable-model-invocation: true
---

Scaffold a new admin panel component: `$0` (kind: `$1`, default `component`).

## Steps

1. **Read conventions first.** Before writing anything, read:
   - [server/admin-web/src/App.tsx](server/admin-web/src/App.tsx) — routing and layout.
   - One existing file of the same kind under [server/admin-web/src/pages/](server/admin-web/src/pages/) or [server/admin-web/src/components/](server/admin-web/src/components/) — match its style (named exports, how it imports theme, how it uses `useTranslation`, how it handles forms).
   - [server/admin-web/src/i18n.ts](server/admin-web/src/i18n.ts) — namespace convention.
   - The theme under [server/admin-web/src/theme/](server/admin-web/src/theme/) — use these tokens, don't hardcode.

2. **Decide the placement.**
   - `page` → `server/admin-web/src/pages/$0.tsx`, and add a route in App.tsx.
   - `component` → `server/admin-web/src/components/$0.tsx`.
   - `form` → `server/admin-web/src/components/$0Form.tsx`.

3. **Write the component.** It must:
   - Be a function component with explicit prop types. No `any`.
   - Import colors/fonts from the admin theme files — no hex literals, no hardcoded font-family.
   - Use `useTranslation()` for every user-facing string. Add keys to all three of [ar](server/admin-web/src/locales/), [ru](server/admin-web/src/locales/), [en](server/admin-web/src/locales/) locale files. Pick a namespace that matches neighbors.
   - Be RTL-aware: CSS logical properties (`margin-inline-*`, `padding-inline-*`, `text-align: start`) over physical ones.
   - Be mobile-responsive: works at 375 px wide without horizontal scroll.
   - Have proper semantic HTML (`<button>`, `<form>`, `<label htmlFor>`), not `<div onClick>`.
   - Include an `aria-label` on any icon-only button.

4. **If it's a form:**
   - Controlled inputs with a single state object.
   - Disable submit while in flight.
   - Show validation errors inline, associated via `aria-describedby`.
   - On success, clear the form (or navigate) and show a toast/live-region message.
   - Use the shared API client under [server/admin-web/src/api/](server/admin-web/src/api/) — do not call `fetch` directly if a helper exists.

5. **If it's a page:**
   - Add the route in App.tsx and a nav entry if there's a navigation component.
   - Set the document title via whatever pattern the existing pages use.

6. **Verify.** After writing, run `npx tsc --noEmit` from `server/admin-web/` and report pass/fail.

## Output

- List the files you created/modified.
- Show the translation keys you added to each of ar/ru/en (with the values).
- Confirm tsc passes.
- A one-line "next step" (e.g. "add a link from the dashboard", "wire to `/api/announcements`").

## What NOT to do

- Don't add abstractions beyond what the component needs. A form that posts to one endpoint doesn't need a generic form library.
- Don't add comments that describe what the JSX does — let the code speak.
- Don't write tests unless the user asks for them.
