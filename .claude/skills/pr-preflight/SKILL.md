---
name: pr-preflight
description: Run the pre-PR checklist — typecheck mobile, server, and admin; build the admin panel; surface any uncommitted noise. Use before opening a PR to catch issues CI would otherwise catch slowly.
disable-model-invocation: true
allowed-tools: Bash(npm run *) Bash(npx tsc *) Bash(git status *) Bash(git diff *) Bash(cd *)
---

Run the pre-PR checklist. Do not commit or push — only report.

## Steps (run sequentially, stop and report on first hard failure)

1. **Working tree state.**
   - `git status --short` — list uncommitted and untracked files.
   - Flag any `.env`, `*.local`, credential, or keystore files showing up in changes.

2. **Mobile typecheck.** From `mobile/`:
   ```
   npx tsc --noEmit
   ```
   Report the first 20 errors if any; don't dump a 500-line log.

3. **Server typecheck.** From `server/`:
   ```
   npx tsc --noEmit
   ```

4. **Admin typecheck + build.** From `server/admin-web/`:
   ```
   npx tsc --noEmit
   npm run build
   ```
   The admin panel is bundled into the server; a build failure breaks production.

5. **Server build.** From `server/`:
   ```
   npm run build
   ```
   This also rebuilds the admin panel per the project's build script — if step 4 passed standalone, this mostly confirms the composed pipeline.

6. **Branch & commits.**
   - Current branch name — is it `main`? (warn, since the user typically works on main here, but confirm intent).
   - `git log --oneline main..HEAD` if not on main.
   - Scan the most recent commit message for common issues: has a scope (`feat:` / `fix:` / `chore:`), isn't just "wip", isn't longer than 72 chars on the subject line.

7. **Artifact sanity.**
   - Are built artifacts (`dist/`, `build/`) showing up in `git status`? They shouldn't be committed.
   - Any `console.log` left in files that appear in `git diff` since main?

## Output

A single table:

| Step | Result |
|---|---|
| Working tree | clean / N uncommitted |
| Mobile tsc | pass / N errors |
| Server tsc | pass / N errors |
| Admin tsc + build | pass / fail |
| Server build | pass / fail |
| Commit hygiene | ok / notes |
| Artifact sanity | ok / notes |

Then a one-line verdict: `ready to PR`, `ready with warnings: ...`, or `not ready: fix X first`. If any step failed, show the first few error lines so the user can act without digging.
