# Coptic Moscow — Pre-Launch Audit Plan

Branch: `audit/pre-launch-fixes`
Started: 2026-04-24

Living checklist of every finding from the pre-launch audit. Each item is updated as it's completed. Severity: **P0** blocks launch, **P1** fix before Abouna's daily use, **P2** first month, **P3** flag-and-move.

---

## Status summary

| Phase | P0 | P1 | P2 | Done |
|---|---|---|---|---|
| Critical bugs | 3 | — | — | **3 / 3** (C1, C2 coded; C3 runbook-only) |
| High priority | — | 3 | — | **1 / 3** (H2 rate-limit shipped; role-check + H1 + H3 pending) |
| Quick wins | — | — | 3 | **3 / 3** |
| Observability | — | 4 | 3 | **5 / 10** (OB2, OB4, OB5, OB6, OB8 shipped; OB1/OB3/OB7/OB9/OB10 pending) |
| Other | — | — | 5 | 0 / 5 |

---

## P0 — Launch blockers (critical bugs)

### [x] C1 — Scheduled cron can double-send  ✅ shipped
- **Files:** `server/src/routes/cron.ts:14-37`, `server/src/services/fcm.ts:295-303`
- **Repro:** Scheduler ticks `/cron/send-due` at T=0 (handler runs 8s multicast). Scheduler retries at T=5s — same `status='scheduled'` row re-selected, second dispatch starts. Two notifications delivered to every parishioner.
- **Fix plan:**
  1. Migration 002 adds `'sending'` and `'send_failed'` to the announcement status enum.
  2. `cron.ts` atomically transitions `scheduled → sending` per row via `UPDATE ... WHERE id=? AND status='scheduled'`. Only proceeds if `affectedRows=1`.
  3. `fcm.ts::markSent` already sets `status='sent'` — confirmed to work on `sending` rows too.
  4. On FCM failure inside the loop, transition `sending → send_failed` (paired with C2).

### [x] C2 — FCM failure silently marks announcement as "sent"  ✅ shipped
- **File:** `server/src/routes/announcements.ts:131-180`
- **Repro:** Service account creds expire or network blip. Abouna clicks Send. `INSERT` writes `status='sent'`; `sendAnnouncementToAll` throws; catch at line 174 swallows; response is `201 { status: 'sent' }`. Zero devices received.
- **Fix plan:**
  1. Immediate-send path INSERTs with `status='sending'` instead of `'sent'`.
  2. On FCM success → existing `markSent` flips to `'sent'` (no change).
  3. On FCM failure → transition to `'send_failed'`, return `500` with `{ id, status: 'send_failed' }` so admin-web can show a retry banner.
  4. Admin-web History page shows a red "Failed to send — retry" pill for `send_failed` rows. (Follow-up UI work — flagged separately; core fix is backend state correctness.)

### [~] C3 — Production timezone not programmatically verified  ⏳ runbook ready, operator action pending
- **File:** `server/src/routes/cron.ts:15-16` uses `NOW()`.
- **Risk:** If Hostinger Node process starts without `TZ=Europe/Moscow`, and MySQL `@@session.time_zone` is not `+03:00`, scheduled announcements fire 3h late (or early, depending on which clock is UTC).
- **Fix plan:** This is a production verification task, not a code fix. Runbook added at bottom of this doc (§ Prod TZ runbook). Run on the live host before launch.
- **Longer-term option** (P2): store `scheduled_for_utc` as UTC and compare against `UTC_TIMESTAMP()` — removes env-var dependency. Deferred; not a launch blocker once runbook passes.

---

## P1 — High priority

### [ ] H1 — JWT has no revocation path
- **File:** `server/src/lib/jwt.ts`, `server/src/middleware/authJwt.ts` (or wherever `requireAuth` lives)
- **Observation:** Disabled admins retain valid tokens up to 7 days. `active` flag only checked at login.
- **Fix:** In `requireAuth` middleware, after JWT verify, query `SELECT active FROM admins WHERE id=?` and reject if `0`. One indexed lookup per admin request; admin traffic <1 QPS.

### [~] H2 — Missing role checks + rate limits on admin endpoints  ⏳ rate limits shipped; role-check decision pending
- **Files:** `server/src/routes/announcements.ts:126` (POST /admin), `server/src/routes/admin.ts:288` (GET /stats), `server/src/routes/admin.ts:124` (POST /me/password)
- **Observation:** Any authenticated admin (including non-super) can send to all 500 devices. `/me/password` is unrate-limited. Stats endpoint exposes device counts to all admins.
- **Fix plan:**
  - Rate-limit `/me/password` via existing `loginLimiter`-style middleware (30 req / 15 min).
  - Rate-limit `POST /announcements/admin` (30 req / 15 min).
  - **Decision needed from user:** Should regular admins (role=`admin`) be able to send announcements, or only super-admins? Defaulting to "keep current behavior" unless told otherwise — just add the rate limit for now.
  - **Decision needed:** Should stats be super-admin-only? Defaulting to scope-everyone-sees-all-counts (current) but doc the trade-off.

### [ ] H3 — Mobile foreground sync has overlapping refetch triggers
- **Files:** `mobile/src/screens/HomeScreen.tsx`, `InboxScreen.tsx`, `CalendarScreen.tsx` (uses `useFocusEffect` + `setInterval` + `AppState`)
- **Observation:** On app resume, all three paths fire within ~1s → 3× requests. At scale this is 30k+ unnecessary reads/day on shared Hostinger.
- **Fix:** Single `useSyncOnForeground()` hook that debounces via an AsyncStorage `lastFetchedAt` cache (skip if <15s). Pull-to-refresh bypasses.

---

## P2 — Quick wins (< 4h each)

### [x] QW1 — Rate-limit `/api/admin/me/password`
- **File:** `server/src/routes/admin.ts:124`
- **Fix:** Add the same `loginLimiter` wrapper as login.
- **Effort:** 20 min.

### [x] QW2 — `.max()` bounds on unbounded Zod string fields
- **Files:** `server/src/routes/admin.ts` (login, changePassword), `server/src/routes/templates.ts` (body_*_template, render values), `server/src/routes/snippets.ts` (value_*), `server/src/routes/announcements.ts` (body_* on update schema)
- **Fix:** Add `.max(128)` on passwords, `.max(4000)` on bodies/templates, `.max(500)` on snippet values.
- **Effort:** 45 min.
- **Why:** Unbounded bcrypt input is a DoS (can send 10 MB password and pin a CPU core).

### [x] QW3 — ISO-validate `calendar.since` query param
- **File:** `server/src/routes/calendar.ts:14` (`publicQuerySchema`)
- **Fix:** `z.string().datetime({ offset: true }).optional()` instead of raw `z.string().optional()`.
- **Effort:** 10 min.

---

## Observability & ops

Today's baseline (what exists):
- Health check at `GET /api/health` — returns `{status:'ok'}` unconditionally. Does **not** check DB, Firebase init, or disk. A "healthy" response means nothing right now.
- Global `unhandledRejection` + `uncaughtException` handlers in `server/src/index.ts:22-36` — good for post-mortem, but only visible in Hostinger's Runtime Logs tab.
- `admin_audit_log` table — every mutation is logged with admin id, action, target, IP. Well-covered.
- `send_log` table — per-announcement sent/failed counts. Exists but no dashboard queries it.
- Per-route `console.error` + `console.log`. Unstructured; no request IDs; no timing.
- No Sentry, no pino/winston, no metrics, no uptime monitor, no Express error-handler, no React error boundary.

### [ ] OB1 — External uptime monitoring  `P1  effort: S (30 min, no code)`
Hostinger's runtime logs don't alert. If the Node process crashes and restart fails, nobody knows until Abouna tries to send a notification and it fails silently.
- **Fix:** Sign up for UptimeRobot free tier, add HTTPS check on `https://coptic-notify.sm4tech.com/api/health` at 5-min interval, SMS/email alert on 2-fail. Also add a ping on `/admin/` (verifies static serving works).
- Zero code change. Just the operator setting up the account.

### [x] OB2 — Health check should actually check  `P1  effort: S`  ✅ shipped
- **Current:** `GET /api/health` returns `{status:'ok', timestamp}` with no checks.
- **Fix:** Add `SELECT 1` DB probe (200ms timeout) + Firebase init flag + disk space on admin-web dist. Return `503` if any fail. This is what UptimeRobot watches.

### [ ] OB3 — Sentry on all three surfaces  `P1  effort: M (3-4h one-time)`
Without this, post-launch bugs are invisible. Abouna won't report "the app showed a white screen once" — but that's the signal that matters.
- **Server:** `@sentry/node` in `index.ts` before route registration; Express error-handler with `Sentry.Handlers.errorHandler`. Capture in `cron.ts` and `fcm.ts` catches.
- **Mobile:** `@sentry/react-native` with source maps uploaded via EAS; wrap App in `Sentry.ErrorBoundary`.
- **Admin-web:** `@sentry/react` with `ErrorBoundary` at `<App />`.
- All three use the same DSN from env var; tag events with `service=server|mobile|admin` and `release=package.json#version`.
- **Free tier covers 5k events/month** — parish scale is nowhere near that.

### [x] OB4 — Structured request logging with pino-http  `P2  effort: S`  ✅ shipped
- **Current:** no request log at all. Can't tell which admin action triggered a 500.
- **Fix:** `pino-http` with JSON output, request id propagated to audit log, redact Authorization header. Writes to stdout — Hostinger captures it.

### [x] OB5 — Express error-handling middleware  `P1  effort: S`  ✅ shipped
- **Current:** every route has its own `try/catch` + generic 500. Errors swallowed with a `console.error`.
- **Fix:** Centralize. `app.use((err, req, res, next) => { logger.error({err, reqId}); Sentry.captureException(err); res.status(500).json(...) })`. Reduces per-route boilerplate; single place to reshape error responses.

### [x] OB6 — React Error Boundary on admin-web and mobile  `P1  effort: S`  ✅ shipped
- **Current:** neither client has one. Any unhandled render error = white screen with no diagnostic.
- **Fix:** `<ErrorBoundary>` at the App root in both clients. Shows localized "Something went wrong — reload" and fires Sentry. Essential for Abouna's trust.

### [ ] OB7 — Admin panel "System health" page  `P2  effort: M (half day)`
Turn `send_log` + `admin_audit_log` + cron run records into a dashboard Abouna actually sees. Suggested tiles:
- Active devices (7d / 30d trend sparkline)
- Notifications delivered today / this week (from `send_log`)
- Last cron run timestamp + result for `send-due` and `cleanup-tokens`
- Recent `send_failed` announcements with a **Retry** button (uses H2's retry banner)
- Last 10 audit log entries (who did what when)
- Firebase init status, DB connection status, disk free on Hostinger

### [x] OB8 — Cron run history table  `P2  effort: S`  ✅ shipped
- **Current:** cron logs go to stdout only. No retrospective visibility.
- **Fix:** `cron_runs` table — `id, job, started_at, ended_at, result_json, error`. Both cron routes write a row on entry + exit. Powers OB7 dashboard + helps diagnose "why did today's scheduled announcement not fire."

### [ ] OB9 — FCM delivery alerting  `P2  effort: S (2h)`
When an announcement has `sent_count=0` + `failed_count>0`, that's an operator-actionable event (service account expired, Firebase quota, etc.). Send an email/Telegram ping to super_admin. Parish-scale rate is maybe 1 announcement/day — email is fine, no PagerDuty needed.

### [ ] OB10 — Mobile FCM token metrics  `P3  effort: S`
Already have device_tokens + last_seen. Add admin-panel view: registered vs active (heartbeat <7d) over time, breakdown by language. Helps Abouna understand reach without guessing.

---

## P2 — Other (flagged, not expanded yet)

### [ ] O1 — FCM message has no dedupe key
- If C1 regresses (or a manual retry happens for a different reason), notifee uses `id: p.id` which only replaces on the same device *if still visible*. Cross-device or dismissed → two notifications.
- **Fix idea:** Add a `send_attempt_id` UUID column on announcements set on each send; pass as the notifee notification `id`. Two attempts = two UUIDs = but we'd WANT the second to replace the first. So actually keep `id: p.id` (current) and rely on C1's idempotency instead. **Decision:** no code change, C1 is the real fix.

### [ ] O2 — Dynamic `SET ${fields.join(', ')}` in 4 update routes
- Safe today (hardcoded whitelist), fragile to future column additions. **Fix later** via a small typed update-builder helper.

### [ ] O3 — `GET /admin` announcements uses `parseInt` not Zod
- File: `server/src/routes/announcements.ts:70-71`
- Use the `validate()` middleware pattern for consistency.

### [ ] O4 — CORS `origin: '*'` on public routes
- File: `server/src/index.ts:49-51`
- Low risk (stateless JWT, no cookies), but tightening to explicit origins is good hygiene.

### [ ] O5 — FCM multicast has no per-batch retry on network error
- File: `server/src/services/fcm.ts:180-227`
- On transient network error mid-batch, the whole 500-token chunk is lost for that announcement.
- **Fix idea:** Wrap `sendEachForMulticast` in a 3× retry with exponential backoff.

---

## Sanity-check results (recon pass)

Recent work holds up — no regressions found:
- FCM pipeline: clean, no double-listeners, no leftover `expo-notifications` FCM path
- Timezone: all `toLocale*` calls route through `lib/datetime.ts` in both clients ✓
- Admin polling: `useApiGet` + `notifyDataChanged` + visibility refetch — working
- Mobile foreground sync: three triggers present (see H3) — the *correctness* is fine, the *load* is not
- Edit/delete-after-send + fetch-fresh-on-edit: 404 handling in place
- Route fixes (`/admin/calendar` → `/calendar/admin`, `/admin/announcements` → `/announcements/admin`): confirmed fixed across all 28 admin-web calls + 5 mobile calls

Tooling:
- `tsc --noEmit` clean on all three packages
- i18n key parity: mobile 28/28/28, admin-web 75/75/75
- Zero `TODO/FIXME/HACK`, zero stray hardcoded hex in migrated surfaces

---

## § Prod TZ runbook (C3)

Run this on the live Hostinger host before launch. Pass = all three match Moscow time.

**1. Check Node process tz:**
```bash
# SSH into Hostinger, attach to the running Node process env
printenv TZ
# Expected: Europe/Moscow
```

**2. Check MySQL session tz:**
```sql
SELECT @@global.time_zone AS global_tz,
       @@session.time_zone AS session_tz,
       NOW() AS mysql_now,
       UTC_TIMESTAMP() AS utc_now;
-- Expected: session_tz is '+03:00' or 'Europe/Moscow',
--          mysql_now is 3h ahead of utc_now.
```

**3. Check against a real scheduled row:**
```sql
SELECT id, status, scheduled_for, NOW() AS mysql_now,
       (scheduled_for <= NOW()) AS would_fire_now
FROM announcements
WHERE status = 'scheduled'
ORDER BY scheduled_for ASC
LIMIT 5;
```

**If any of these are wrong:**
- Set `TZ=Europe/Moscow` in Hostinger's Node.js env vars panel, restart Node.
- In MySQL: `SET GLOBAL time_zone = '+03:00';` (requires SUPER privilege; on shared hosting may need ticket).
- Fallback: convert stored `scheduled_for` to UTC at write time, compare against `UTC_TIMESTAMP()` at read time — deferred refactor, not needed if TZ is set correctly.

---

## Work log

- **2026-04-24** — Branch created, plan written, ready to start C1+C2 (shared migration 002).
- **2026-04-24** — **First batch shipped**:
  - C1: atomic `scheduled → sending` claim in `cron.ts`; `sending → send_failed` on FCM error. No more double-sends on overlapping cron runs.
  - C2: immediate-send path in `announcements.ts` now inserts `'sending'`, flips to `'sent'` via `markSent` on success or `'send_failed'` on FCM exception. Response carries the final status so admin-web can react.
  - Migration `002_announcement_status_states.sql` adds `'sending'` and `'send_failed'` enum values.
  - i18n: `ann_sending` + `ann_send_failed` added to AR/RU/EN (parity preserved 77/77/77).
  - QW1: `sensitiveActionLimiter` (30 req / 15 min, admin-id keyed) applied to `/api/admin/me/password` and `/api/announcements/admin`.
  - QW2: `.max()` bounds on passwords (128), titles (200), bodies (4000), templates (4000), snippets (500), render values (2000), placeholder arrays (50).
  - QW3: `calendar.since` now ISO-datetime validated; `starts_at` also ISO-validated; description fields capped at 4000; duration/reminder minutes bounded.
  - All three tsc checks remain clean.
- **2026-04-24** — **Observability launch-floor batch shipped**:
  - OB2: `GET /api/health` now probes DB (`SELECT 1` with 1.5s timeout) and Firebase init state. Returns `503` when DB is down — what UptimeRobot actually needs to watch. New route file `server/src/routes/health.ts`; `isFirebaseInitialized()` exported from `services/fcm.ts`.
  - OB4: `pino` + `pino-http` wired. Structured JSON lines in prod, pretty-printed in dev. `x-request-id` generated per request (echoed back in response header and included in error responses so admins can quote it). Auth, cron-secret, and password fields redacted via logger config. Health probes silenced from request log to avoid UptimeRobot noise.
  - OB5: `express-async-errors` imported at the top of `index.ts`; `errorHandler` + `notFoundHandler` middleware added after all routes. Any route that throws async now lands in the centralized handler with request-id propagation. Existing per-route try/catch still works unchanged; this is a safety net.
  - OB6: `ErrorBoundary` on both clients. Admin-web uses `withTranslation()` HOC + locale keys. Mobile uses `i18n.t()` directly + hardcoded theme values (documented: must render even if ThemeProvider itself crashed). Locale parity preserved: admin-web 80/80/80, mobile 31/31/31.
  - OB8: Migration `003_cron_runs.sql` adds history table; `recordCronRun()` helper wraps each cron handler — writes a 'running' row on entry and flips to 'ok'/'error' with duration + result JSON on exit. Cron.ts now uses structured logger throughout.
  - Server deps added: `pino`, `pino-http`, `express-async-errors`, `pino-pretty` (dev).
  - `tsc --noEmit` clean on server + admin-web + mobile.
  - **Deferred (need user action):** OB1 (UptimeRobot account), OB3 (Sentry DSN), OB7 (half-day admin dashboard), OB9 (needs SMTP transport decision).
