---
name: rn-review
description: Review a React Native / Expo component or screen in mobile/src for platform issues, performance, styling, and project conventions. Use when the user asks to review, audit, or sanity-check a mobile screen or component.
argument-hint: [path-to-file-or-dir]
---

Review $ARGUMENTS (or, if empty, the most recently-changed files under [mobile/src/](mobile/src/)) as a React Native / Expo component review.

## Checklist

### Platform & RN correctness
- No web-only tags (`div`, `span`, `h1`, raw `<img>`) — use `View`, `Text`, `Image` from `react-native`.
- No `className` — use `StyleSheet.create` or inline `style`.
- `onPress` on `Pressable`/`TouchableOpacity`, not `onClick`.
- `KeyboardAvoidingView` where text input + keyboard could overlap.
- `SafeAreaView` / `useSafeAreaInsets` used on screens with top/bottom chrome.
- `FlatList`/`SectionList` (not `.map` in `ScrollView`) for any list > ~20 items.
- Images have explicit `width`/`height` or a fixed container; remote images have a placeholder.
- No `Dimensions.get('window')` captured at module scope (stale on rotation) — use `useWindowDimensions`.

### Performance
- `useCallback`/`useMemo` only where a stable identity actually matters (passed to memoized child or dep array). Don't wrap everything.
- `key` props are stable IDs, not array indexes, on list items.
- Avoid anonymous inline functions inside `FlatList.renderItem` when the list is large — extract with `useCallback`.
- No heavy sync work in `useEffect` with `[]` — defer or use `InteractionManager`.

### Project conventions
- Colors come from [mobile/src/theme/colors.ts](mobile/src/theme/colors.ts) — flag any hex literal in styles.
- Fonts come from [mobile/src/theme/fonts.ts](mobile/src/theme/fonts.ts) via `getFontFamily(lang)`. Never hardcode a font family.
- User-facing strings go through `react-i18next` (`useTranslation`). Flag any hardcoded AR/RU/EN string.
- Navigation types match the stack defined in [mobile/src/navigation/](mobile/src/navigation/) — no `any` for nav props.

### i18n / RTL
- Confirm the string keys exist in all three of [ar.json](mobile/src/locales/ar.json), [ru.json](mobile/src/locales/ru.json), [en.json](mobile/src/locales/en.json).
- If the screen uses directional layout (rows with icons, chevrons, back arrows), confirm it flips for AR. Prefer `flexDirection: 'row'` + `I18nManager.isRTL` or logical `start/end` spacing.
- No `textAlign: 'left'` hardcoded when it should follow language direction.

## Output format

Report findings grouped as:
1. **Must fix** — bugs, platform-breakers, missing translations.
2. **Should fix** — convention drift, perf smells.
3. **Nitpick** — style, naming.

For each finding: file:line, one-sentence what, one-sentence why, proposed diff if small.

End with a one-line verdict: `ship it`, `ship with fixes`, or `do not ship`.
