---
name: api-review
description: Review a server API route in server/src/routes for auth, validation, SQL safety, and error handling. Use when the user asks to review, audit, or harden a backend endpoint.
argument-hint: [route-file-or-path]
---

Review $ARGUMENTS (or the most recently-changed files under [server/src/routes/](server/src/routes/) and [server/src/services/](server/src/services/)) as a backend API review.

## Checklist

### Auth & authorization
- Routes that mutate state are behind the admin auth middleware (check [server/src/middleware/](server/src/middleware/)).
- Public routes (device registration, calendar reads) are explicitly intended to be public.
- JWT verification uses the shared middleware — no ad-hoc `jwt.verify` calls.
- No secrets logged (tokens, FCM keys, DB passwords).

### Input validation
- Every `req.body` / `req.query` / `req.params` field read is validated: type, length, format.
- String fields that go to DB have a max length matching the column.
- Timestamps/ISO strings are parsed and checked before use.
- User-facing strings for i18n are validated for each of `ar` / `ru` / `en` when the schema expects all three.

### SQL safety
- All queries use parameterized placeholders (`?`) — no template-literal interpolation into SQL.
- `LIMIT`/`OFFSET` values are coerced to integers before being placed in the query.
- No `SELECT *` on tables with sensitive columns.

### Error handling & responses
- `try`/`catch` or an async wrapper so rejected promises don't crash the process.
- 4xx for client errors (validation, auth) vs 5xx for server errors — not everything is 500.
- Error response body does not leak stack traces or SQL errors to clients.
- Success responses have a stable shape the mobile app / admin panel already depends on.

### Push notifications
- Any route that triggers FCM sends batches device tokens (chunks of 500) and handles partial failures.
- Invalid-token responses from FCM result in the token being removed from `devices` table.
- Critical-alert routes set the Apple APNs headers per [docs/APPLE_CRITICAL_ALERTS.md](docs/APPLE_CRITICAL_ALERTS.md).

### Observability
- Meaningful log lines on failure (what endpoint, which user, which record — no PII).
- No `console.log` debugging left in.

## Output format

1. **Must fix** — security issues, SQL injection risk, missing auth, crashes.
2. **Should fix** — validation gaps, error-handling holes.
3. **Nitpick** — style, naming.

Each finding: file:line, what, why, and a minimal fix. End with `ship it` / `ship with fixes` / `do not ship`.
