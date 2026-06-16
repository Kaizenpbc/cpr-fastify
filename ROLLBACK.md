# Production Rollback Procedure

## Quick Rollback (< 2 minutes)

### 1. Identify the last known good commit
```bash
git log --oneline -10
```

### 2. Revert to the good commit
```bash
git revert HEAD --no-edit   # Revert last commit
# OR for multiple commits:
git revert HEAD~N..HEAD --no-edit
```

### 3. Push the revert
```bash
git push origin master
```

### 4. Trigger production deploy
Schedule a one-time cron via cPanel v2 API:
```bash
MSYS_NO_PATHCONV=1 curl -sk -u "kaizenmo:!Register001" \
  "https://69.72.136.201:2083/json-api/cpanel?cpanel_jsonapi_version=2&cpanel_jsonapi_module=Cron&cpanel_jsonapi_func=add_line&minute=*&hour=*&day=*&month=*&weekday=*&command=bash%20/home/kaizenmo/deploy-production.sh%20>%20/home/kaizenmo/deploy-production.log%202>%261"
```
Wait ~3 minutes, then remove the cron (get linekey from listcron, then remove_line).

### 5. If frontend-only rollback needed
Rebuild frontend from the reverted code and re-upload:
```bash
cd frontend && VITE_API_URL=https://cpr.kpbc.ca/api/v1 npx vite build
# Then upload via FTPS
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

Touch the restart file to restart Passenger without redeploying:
```bash
echo "restart" | curl --ftp-ssl -k -u "kaizenmo:!Register001" \
  -T - "ftp://69.72.136.201/cpr.kpbc.ca/tmp/restart.txt"
```

## Verification After Rollback

1. **Health check**: `curl -sk https://cpr.kpbc.ca/api/v1/health`
2. **Login test**: `curl -sk https://cpr.kpbc.ca/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"test123"}'`
3. **Frontend**: Open https://cpr.kpbc.ca in browser, verify login page loads

## Monitoring

- Backend logs: Check via cPanel Error Logs or deploy script output
- Health endpoint: `GET /api/v1/health` returns 200 (UP) or 503 (DEGRADED)
- Client errors: Logged via `POST /api/v1/client-errors` with `clientError: true` tag
