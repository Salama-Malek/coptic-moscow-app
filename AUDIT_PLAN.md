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
