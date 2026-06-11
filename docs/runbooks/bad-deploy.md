# Runbook: Bad Deploy / Instant Rollback

**Symptoms:** Production errors spike after a deploy. Sentry shows new errors. Users report broken flows. Uptime monitor fires.

## Instant rollback via Vercel (< 2 minutes)

1. Go to **vercel.com → your project → Deployments**
2. Find the last known-good deployment (the one before the current broken one)
3. Click the three-dot menu on that deployment → **Promote to Production**
4. Vercel instantly switches traffic — no rebuild needed

This is the fastest path. Do it before investigating.

## Verify the rollback worked

1. Hit the home page and a tool page — verify they load
2. Hit `/api/tx/burn` with a test request — verify a transaction is returned (not a 500)
3. Check Sentry error rate — it should drop within 30 seconds of rollback

## After rollback — root-cause investigation

1. Check what changed in the bad commit:
   ```
   git diff <good-commit>..<bad-commit> -- token/
   ```

2. Reproduce the error locally on devnet before re-deploying.

3. If the issue was a DB migration that ran with the bad deploy:
   - **Do not auto-run migrations on deploy.** Migrations are manual (`psql -f db/migrations/xxx.sql`).
   - If a migration was applied and caused the issue, you may need to roll it back manually. There is no automated rollback for DB migrations — write the inverse SQL and apply carefully.

## Preventing bad deploys

- [ ] Run `pnpm build` locally before pushing
- [ ] Dev/devnet environment mirrors production config — test there first
- [ ] DB migrations are never part of the deploy script — they require a manual apply + sign-off

## Recovery checklist

- [ ] Rollback deployed via Vercel
- [ ] Sentry error rate confirmed dropping
- [ ] Root cause identified before re-deploying fix
- [ ] If DB migration involved: manual rollback applied and verified
- [ ] Post-mortem note added to incident log (even a one-liner is enough)
