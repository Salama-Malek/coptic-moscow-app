---
name: notification-preview
description: Draft, translate, and preview a push notification in Arabic, Russian, and English before it's sent. Use when the user wants to compose an announcement, check tone, or preview the FCM payload. Never actually sends — preview only.
argument-hint: [short description of the announcement]
disable-model-invocation: true
---

Draft a push notification for: $ARGUMENTS

This is a preview-only tool. Do **not** call any FCM or admin API — only produce the payload and previews.

## Steps

1. **Understand the intent.** If $ARGUMENTS is vague, ask the user one clarifying question about:
   - Occasion (feast, liturgy reminder, announcement, emergency)
   - Tone (formal/liturgical, pastoral, informational)
   - Whether it's time-bound (mentions a date/time)

2. **Write AR first.** This is the primary audience. Use the tone the parish is used to — respectful, Abouna's voice, not corporate. Keep the title ≤ 40 chars, body ≤ 120 chars so it fits a lock-screen preview.

3. **Translate to RU and EN.** Match meaning and register, not word-for-word. Keep the same length budget. For religious terms, match the vocabulary used in the existing [mobile/src/locales/ru.json](mobile/src/locales/ru.json) and [mobile/src/locales/en.json](mobile/src/locales/en.json) — grep those files first for any overlapping nouns so the voice stays consistent.

4. **Preview three renderings.** For each language, show:
   ```
   ┌─────────────────────────────────────────────┐
   │ Coptic Moscow · now                         │
   │ <title>                                     │
   │ <body>                                      │
   └─────────────────────────────────────────────┘
   ```
   Render AR right-aligned.

5. **Emit the FCM payload** (ready to paste into the admin panel or the `/announcements` POST body):
   ```json
   {
     "title_ar": "...", "body_ar": "...",
     "title_ru": "...", "body_ru": "...",
     "title_en": "...", "body_en": "...",
     "critical": false,
     "scheduled_at": null
   }
   ```
   Default `critical` to `false` and `scheduled_at` to `null`. Flag if the user's description implies either should be set and ask to confirm.

6. **Sanity checks.** Before finishing:
   - Title + body in each language don't contain the other language's script.
   - No placeholder like `{{name}}` left unfilled.
   - If it's time-sensitive, the date/time is present in all three.
   - No emoji that renders poorly on older Android (test mentally against 🕯️, 📿, ☦ which are the usual suspects — ☦ often doesn't render on old Android).

## Output

Three preview cards, then the JSON payload, then a one-line suggestion: `ready to send` or `revise: <reason>`.
