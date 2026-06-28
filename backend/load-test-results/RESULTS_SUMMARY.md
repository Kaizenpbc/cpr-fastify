# Load Test Results — 2026-06-28

**Target**: https://stagecprapp.kpbc.ca/api/v1 (staging)
**Infrastructure**: TMD Hosting shared (LVE: 100 procs, 2GB RAM, 2 CPU cores)
**Tool**: autocannon v8.0.0, Node.js v22.17.1

## Results

| Test | Connections | Duration | Req/sec | Avg Latency | p99 Latency | Errors | Timeouts |
|------|------------|----------|---------|-------------|-------------|--------|----------|
| Health (baseline) | 10 | 10s | 167.6 | 59ms | 63ms | 0 | 0 |
| Health (stress) | 50 | 10s | 1,002.5 | 49ms | 92ms | 0 | 0 |
| Health (peak burst) | 100 | 10s | 1,777.2 | 56ms | 112ms | 0 | 0 |
| Login (auth load) | 10 | 10s | 197.7 | 50ms | 78ms | 0 | 0 |
| Metrics | 20 | 10s | 414.5 | 48ms | 73ms | 0 | 0 |

## Analysis

- **Zero errors or timeouts** across all tests, even at 100 concurrent connections
- **Health endpoint scales linearly**: 168 req/s at 10 conn -> 1,777 req/s at 100 conn
- **p99 latency stays under 120ms** even under peak burst — well below the 2,000ms slow request threshold
- **Login endpoint** handles 198 req/s at 10 connections (all 401s as expected with fake credentials) — bcrypt hashing doesn't bottleneck under this load
- **No LVE limit violations** detected during testing

## Capacity Estimate

For a CPR training management app with typical usage patterns:
- **10 concurrent users**: ~168+ req/sec capacity — more than sufficient
- **50 concurrent users**: ~1,000+ req/sec — handles comfortably
- **100 concurrent users**: ~1,777 req/sec — still zero errors

Given typical SaaS usage (users aren't all hitting endpoints simultaneously), the current infrastructure comfortably supports **50-100 active users** before needing a VPS upgrade.

## Recommendations

1. Current shared hosting is adequate for early customers (5-10 orgs, ~50 active users)
2. Plan VPS upgrade (HOSTING-1) before scaling beyond 10+ orgs or 100+ active users
3. Re-run these tests after major changes or before onboarding large customers
4. Consider testing authenticated endpoints with real tokens for more realistic load profiles
