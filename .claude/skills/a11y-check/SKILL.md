---
name: a11y-check
description: Accessibility audit for mobile screens (React Native) and admin panel (web). Covers screen reader labels, tap target sizes, contrast, focus order, and keyboard navigation. Use before a release or when adding a new screen/component.
argument-hint: [optional-path]
---

Run an accessibility audit on $ARGUMENTS (default: all of `mobile/src/` and `server/admin-web/src/`).

Target audience is a multilingual parish that includes elderly users — accessibility is a real, not theoretical, requirement.

## Mobile (React Native)

### Screen reader
- Every `Pressable` / `TouchableOpacity` / button has `accessibilityLabel` (or wraps a `Text` with a clear label).
- The label is translated via `t('...')` — not a hardcoded English string.
- `accessibilityRole` is set (`'button'`, `'header'`, `'link'`, `'image'`) where semantic meaning matters.
- `accessibilityHint` is set for non-obvious actions (e.g. "Sends a push notification to all devices").
- Icon-only buttons (close ×, menu ☰, bell 🔔) always have a label — flag any that don't.
- `accessibilityState={{ disabled, selected, expanded }}` is set on toggles and collapsibles.

### Tap targets
- Buttons and touchables are at least 44×44 px (iOS HIG) / 48×48 dp (Material). Flag anything smaller.
- `hitSlop` is used when the visible element must be smaller than the target.

### Text
- `allowFontScaling` is NOT set to `false` on body text — users set their font size for a reason. Flag any `allowFontScaling={false}` on non-icon text.
- `numberOfLines` with ellipsis on content that could be a full sentence in one language (AR words are long) — confirm it's intentional.
- Color contrast: primary/ink on parchment must be WCAG AA (4.5:1 for body, 3:1 for large). Check the palette in [mobile/src/theme/colors.ts](mobile/src/theme/colors.ts) against usage.

### Focus & navigation
- Modal/sheet has a way to dismiss with a labeled close button (not only swipe or tap-outside).
- `accessibilityLiveRegion="polite"` on status messages that appear after an action (e.g. "Notification sent").

## Admin panel (web)

### Semantic HTML
- Real `<button>` for clickable things, real `<a>` for navigation — not `<div onClick>`.
- Form inputs have an associated `<label htmlFor>` or `aria-label`.
- Headings (`<h1>`–`<h3>`) form a sensible outline per page — no skipped levels.

### Keyboard
- All interactive elements reachable with Tab in a logical order.
- `:focus-visible` styles present (not `outline: none` without a replacement).
- Modals trap focus while open and return focus to the trigger on close.
- Escape closes modals and dropdowns.

### Screen reader
- `aria-label` on icon-only buttons.
- `aria-live="polite"` on toast/alert regions.
- `role="dialog"` + `aria-labelledby` on modals.
- Form errors associated with inputs via `aria-describedby` or inline `<span id>`.

### Color & contrast
- Text over the parchment background meets 4.5:1.
- Error red (`#C62828`) and success green (`#2E7D32`) from the theme — confirm both meet contrast on parchment and white.
- Information conveyed by color (red = error) is also conveyed by icon or text.

### Responsive
- Works at 320 px wide (smallest phone).
- Admin panel usable at 768 px (tablet) — see `/mobile-responsive-admin` for the deep check.

## Output

1. **Blockers** — unlabeled interactive elements, failing contrast, unreachable via keyboard.
2. **Should fix** — small tap targets, missing hints, color-only signaling.
3. **Polish** — focus-visible styling, live regions, heading outline.

Each: file:line, what, a one-line fix. End with an overall grade: `AA`, `AA with gaps`, `A`, `below A`.
