# Production Rollback Procedure

## Quick Rollback (< 5 minutes)

Pushing a revert to `master` triggers an automatic deploy via CI/CD.

### 1. Identify the last known good commit
```bash
git log --oneline -10
```

### 2. Revert and push
```bash
git revert HEAD --no-edit   # Revert last commit
# OR for multiple commits:
git revert HEAD~N..HEAD --no-edit

git push origin master
```

CI/CD will automatically: build backend + frontend, deploy via FTPS, restart Passenger, and run a health check.

### 3. Monitor the deploy
```bash
gh run watch          # Watch the CI/CD pipeline
# Or check: https://github.com/Kaizenpbc/cpr-fastify/actions
```

## Database Rollback

Database migrations are forward-only. If a migration causes issues:

1. Check `schema_migrations` table for the problematic version
2. Manually reverse the migration SQL
3. Delete the row from `schema_migrations`:
   ```sql
   DELETE FROM schema_migrations WHERE version = N;
   ```

## Emergency: Force Restart Without Deploy

Restart Passenger without redeploying (uses FTP credentials from GitHub Secrets or env):
```bash
echo "restart" | curl --ftp-ssl -k -u "$FTP_USERNAME:$FTP_PASSWORD" \
  -T - "ftp://$FTP_SERVER/cpr.kpbc.ca/tmp/restart.txt"
```

## Verification After Rollback

1. **Health check**: `curl -s https://cpr.kpbc.ca/api/v1/health`
2. **Login test**: `curl -s https://cpr.kpbc.ca/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"...","password":"..."}'`
3. **Frontend**: Open https://cpr.kpbc.ca in browser, verify login page loads

## Monitoring

- **CI/CD status**: https://github.com/Kaizenpbc/cpr-fastify/actions
- **Health endpoint**: `GET /api/v1/health` returns 200 (UP) or 503 (DEGRADED)
- **Backend logs**: cPanel Error Logs
- **Client errors**: Logged via `POST /client-errors` with `clientError: true` tag
- **Error tracking**: Sentry (if configured via `SENTRY_DSN`)
