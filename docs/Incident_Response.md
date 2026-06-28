# CPR Training App - Incident Response Runbook

**Date**: 2026-06-28
**App**: https://cpr.kpbc.ca (Production), https://stagecprapp.kpbc.ca (Staging)
**Stack**: Fastify 5 + React on TMD Hosting (Apache + Passenger, Node.js)

---

## 1. Alert Channels

Incidents are detected through three channels:

| Channel | What It Catches | Alert Target | Response Time |
|---------|----------------|--------------|---------------|
| **UptimeRobot** | Site down (health endpoint fails) | Email to kpbcma@gmail.com | Polls `GET /api/v1/health` every 5 min |
| **Sentry** | Unhandled exceptions, backend errors | Sentry dashboard (linked to project) | Real-time capture |
| **User reports** | UI bugs, data issues, login problems | Email / direct contact | Variable |

When you receive an UptimeRobot "DOWN" alert, begin triage immediately. Sentry errors should be reviewed within the same business day. User reports follow normal support flow unless they indicate a P1.

---

## 2. Severity Levels

| Level | Definition | Examples | Target Response | Target Resolution |
|-------|-----------|----------|-----------------|-------------------|
| **P1 - Critical** | Total outage; production is unreachable or data is corrupted | Health endpoint returns DOWN, 502/503 errors, database unreachable, Passenger crash loop | 15 minutes | 1 hour |
| **P2 - Degraded** | Partial functionality broken; some users or features affected | One portal/role cannot login, email sending fails, specific API routes 500-ing, slow response times | 1 hour | 4 hours |
| **P3 - Minor** | Non-critical bug; workaround exists | UI rendering glitch, non-blocking validation error, cosmetic issue | Next business day | Next deploy cycle |

---

## 3. Diagnosis Checklist

Work through these steps in order. Stop when you identify the root cause.

### Step 1: Check the Health Endpoint

```bash
curl -s https://cpr.kpbc.ca/api/v1/health
```

- **Expected**: `{"status":"UP"}` with HTTP 200
- **If DOWN or no response**: Passenger or the database is down. Proceed to Step 3.
- **If UP but users report issues**: Proceed to Step 2.

Also check metrics for error spikes:

```bash
curl -s https://cpr.kpbc.ca/api/v1/metrics
```

Review request counts, error rate, and latency values.

### Step 2: Check Sentry

1. Open the Sentry project dashboard
2. Look for new unhandled exceptions in the last hour
3. Note the error message, stack trace, and affected route
4. Check if the error correlates with a recent deploy (compare timestamps)

### Step 3: Check Passenger / Application Logs

1. Log in to **cPanel** (TMD Hosting)
2. Go to **Metrics > Errors** (Apache error log)
3. Look for:
   - `App ... crashed` or `Passenger` errors
   - `ECONNREFUSED` (database connection refused)
   - `ENOMEM` or out-of-memory errors
   - `MODULE_NOT_FOUND` (missing dependency after deploy)
4. Also check **Metrics > Visitors** for unusual traffic spikes

### Step 4: Check MySQL

1. In cPanel, open **phpMyAdmin**
2. Verify the `kaizenmo_cpr` database is accessible
3. Run a simple query: `SELECT 1;`
4. Check if tables are locked: `SHOW PROCESSLIST;`
5. If the database is down, check **cPanel > MySQL Databases** for status

### Step 5: Check LVE Resource Limits

1. In cPanel, go to **Resource Usage** (or **CPU and Concurrent Connection Usage**)
2. Check for:
   - **CPU** hitting the 2-core limit
   - **RAM** exceeding 2 GB
   - **Processes** hitting the 100-process limit (possible connection leak or SSE abuse)
   - **Entry Processes** maxed out
3. If limits are hit, TMD may be throttling or killing processes

### Step 6: Check Recent Deploys

1. The auto-deploy cron pulls from `master` hourly at `:18`
2. Production deploy script: `/home/kaizenmo/deploy-production.sh`
3. Check if a recent commit broke something:
   ```bash
   # On server or via GitHub
   git log --oneline -5
   ```
4. Check GitHub Actions for failed CI runs (tsc or vitest failures that were merged anyway)

---

## 4. Resolution Procedures

### 4.1 Restart Passenger

**When**: App is unresponsive but server/DB are fine; after config changes.

```bash
# SSH or cPanel Terminal
cd /home/kaizenmo/cpr.kpbc.ca
touch tmp/restart.txt
```

Passenger detects the timestamp change and restarts the Node.js process. Verify with:

```bash
curl -s https://cpr.kpbc.ca/api/v1/health
```

### 4.2 Rollback a Bad Deploy

**When**: A recent deploy introduced a breaking change.

```bash
cd /home/kaizenmo/cpr.kpbc.ca-src
git log --oneline -5          # identify the bad commit
git revert <bad-commit-hash>  # create a revert commit
git push origin master        # push to trigger auto-deploy at :18

# Or for immediate effect, run the deploy manually:
cd /home/kaizenmo
bash deploy-production.sh
```

**Emergency rollback** (restore previous dist without git):

```bash
cd /home/kaizenmo/cpr.kpbc.ca
rm -rf backend/dist
cp -r backend/dist-backup backend/dist
touch tmp/restart.txt
```

Note: `dist-backup/` is overwritten on every deploy. If you may need it, copy it elsewhere first.

### 4.3 Fix and Redeploy

**When**: You have identified the bug and have a fix ready.

1. Push the fix to `master` on GitHub
2. Wait for GitHub Actions CI to pass (tsc + vitest)
3. Either wait for the hourly auto-deploy at `:18`, or run manually:
   ```bash
   ssh kaizenmo@<server>
   bash /home/kaizenmo/deploy-production.sh
   ```
4. Verify: `curl -s https://cpr.kpbc.ca/api/v1/health`

For FTPS manual deploy (if SSH is unavailable):
1. Build locally: `cd backend && npx tsc`
2. Upload `backend/dist/` via FTPS to `/home/kaizenmo/cpr.kpbc.ca/backend/dist/`
3. Upload updated `package.json` if dependencies changed
4. Touch `tmp/restart.txt` via FTPS or cPanel File Manager

### 4.4 Database Recovery

**When**: Data corruption or accidental deletion.

Daily backups run at 2:00 AM via cron with 7-day rotation.

1. Locate backups on the server (created by `backup-cpr.sh`)
2. Identify the most recent clean backup
3. Restore via phpMyAdmin or command line:
   ```bash
   mysql -u kaizenmo_cpruser -p kaizenmo_cpr < backup_file.sql
   ```
4. Restart Passenger: `touch tmp/restart.txt`

### 4.5 LVE Limit Issues

**When**: Resource Usage shows limits being hit.

- **High process count**: Check for SSE connection leaks (the `/api/v1/events` endpoint). Restart Passenger to clear stuck connections. Consider adding authentication to the SSE endpoint if not yet done.
- **High RAM**: Look for memory leaks in Sentry or logs. Restart Passenger as immediate fix.
- **High CPU**: Check for runaway queries in phpMyAdmin (`SHOW PROCESSLIST`). Kill long-running queries if needed.
- **Persistent resource issues**: Contact TMD support to temporarily increase limits or investigate root cause.

---

## 5. Communication

### During an Incident

| Audience | Channel | When |
|----------|---------|------|
| Development team (George) | Direct message / email | Immediately on P1, within 1 hour on P2 |
| End users (if extended outage) | Email or in-app banner post-recovery | P1 lasting > 30 minutes |
| TMD Hosting support | Support ticket via client area | If server-side issue (DB down, resource limits, infrastructure) |

### Status Updates

- For P1: Post updates every 15 minutes until resolved
- For P2: Post updates every hour until resolved
- Once resolved, send an all-clear message with brief explanation

---

## 6. Post-Incident Review

After every P1 and significant P2 incident, complete a post-incident review within 48 hours.

### Root Cause Analysis Template

```
## Post-Incident Report

**Incident Date**: YYYY-MM-DD
**Severity**: P1 / P2
**Duration**: From HH:MM to HH:MM (X minutes total)
**Detected by**: UptimeRobot / Sentry / User report

### Timeline
- HH:MM — Alert received
- HH:MM — Triage started
- HH:MM — Root cause identified
- HH:MM — Fix applied
- HH:MM — Service confirmed restored

### Root Cause
(What broke and why. Be specific: bad commit, DB issue, resource limit, external dependency, etc.)

### Impact
- Number of users affected (estimated)
- Features/portals impacted
- Data loss (if any)

### Resolution
(What was done to fix it. Include commands run, commits pushed, configs changed.)

### Prevention
- [ ] Action item 1 (assigned to, due date)
- [ ] Action item 2 (assigned to, due date)

### Lessons Learned
(What went well, what could be improved in the response process.)
```

Store completed reports in `docs/incidents/` with the naming convention `YYYY-MM-DD_summary.md`.

---

## 7. Contacts and Access

| Resource | Location |
|----------|----------|
| **cPanel login** | TMD Hosting client area (credentials in password manager) |
| **TMD support** | Support ticket via TMD client portal, or live chat at tmdhosting.com |
| **GitHub repo** | `https://github.com/Kaizenpbc/cpr-fastify` (Fastify/production codebase) |
| **Sentry dashboard** | Linked via `SENTRY_DSN` in production `.htaccess` |
| **UptimeRobot dashboard** | Configured to monitor `/api/v1/health`, alerts to kpbcma@gmail.com |
| **Server paths** | App: `/home/kaizenmo/cpr.kpbc.ca`, Source: `/home/kaizenmo/cpr.kpbc.ca-src/` |
| **Deploy scripts** | Production: `/home/kaizenmo/deploy-production.sh`, Staging: `/home/kaizenmo/deploy-staging.sh` |
| **Backup script** | `/home/kaizenmo/backup-cpr.sh` (cron at 2:00 AM, 7-day rotation) |
| **Email service** | Resend API (sends from `noreply@kpbc.ca`) |

### Server Credentials Reference

Production environment variables are set in `/home/kaizenmo/cpr.kpbc.ca/.htaccess`. Do not commit credentials to the repository. Database user: `kaizenmo_cpruser`, database name: `kaizenmo_cpr`.
