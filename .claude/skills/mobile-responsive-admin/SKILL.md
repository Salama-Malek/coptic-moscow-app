---
name: mobile-responsive-admin
description: Check that the admin panel (server/admin-web) works correctly on mobile viewports (320-480px) and tablets. Abouna Dawood often uses the panel from his phone. Use when reviewing admin UI changes or before a release.
argument-hint: [optional-page-or-component]
---

Audit the admin panel for mobile usability. Scope = $ARGUMENTS (default: all of [server/admin-web/src/pages/](server/admin-web/src/pages/) and [server/admin-web/src/components/](server/admin-web/src/components/)).

Abouna Dawood sends announcements from his phone — the panel has to work on a 375×667 viewport minimum, ideally down to 320 px.

## Checklist

### Layout
- No fixed pixel widths that exceed the viewport (`width: 900px`, `min-width: 800px`). Prefer `max-width` + `width: 100%`.
- Multi-column layouts collapse to single column below ~640 px (check `@media` queries or Tailwind breakpoints).
- Tables either: (a) scroll horizontally inside a `overflow-x: auto` wrapper, or (b) switch to a card/stacked layout on mobile. No table that silently overflows the body.
- Sidebars/nav drawers have a hamburger or bottom-sheet version on mobile, not a desktop rail that eats half the screen.
- Sticky headers/footers don't cover content when the on-screen keyboard opens.

### Inputs & forms
- Inputs are at least 44 px tall with 16 px font-size (prevents iOS Safari zoom-on-focus).
- Form buttons (send notification, save, delete) are full-width on mobile or at least tap-target sized.
- Date/time pickers use the native mobile picker where possible — flag custom pickers that are cramped on small screens.
- Textareas for announcement text auto-grow or have generous min-height so AR/RU long text is visible while typing.

### Interactive elements
- Tap targets ≥ 44×44 px; icon-only buttons have padding.
- Tooltips/hover content have a tap or focus equivalent — phones don't hover.
- Dropdowns open in a way that doesn't get clipped by viewport edges.

### Typography & readability
- Body text ≥ 14 px on mobile, headings scale down appropriately.
- Line length caps around 60–75 chars (no full-viewport-width paragraphs).
- AR/RU text doesn't overflow its container — test the longest strings in each language.

### Modals & sheets
- Modals use `max-height: 90vh` + scrolling body so they never exceed the viewport.
- Close button is in a corner reachable by a thumb (top-right for LTR, top-left or both for RTL).
- Backdrop dismiss works; Escape also dismisses.

### Performance on a real phone
- No list renders 500+ items without virtualization.
- Images have `width`/`height` attributes or aspect-ratio so layout doesn't thrash.

## Output

Report the top three worst mobile-viewport issues first (things that would embarrass us if Abouna opened the panel on his phone right now), then the rest.

For each: page/component:line, what breaks at which viewport, suggested CSS/structural fix.

End with a verdict: `phone-usable`, `phone-usable with friction`, or `not phone-usable`.
