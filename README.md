# CPR Training Management System

A multi-portal web application for managing CPR/First Aid training operations — scheduling, billing, instructor management, certification tracking, and vendor invoicing.

**Production**: https://cpr.kpbc.ca
**Repo**: https://github.com/Kaizenpbc/cpr-fastify

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify 5, TypeScript, Zod validation |
| Frontend | React 18, MUI 5, Vite |
| Database | MySQL 8 (InnoDB) |
| Auth | JWT access + refresh tokens, bcrypt, role-based guards |
| Email | Resend API |
| CI/CD | GitHub Actions → FTPS deploy → Passenger restart |
| Hosting | cPanel shared hosting (Passenger Node.js) |

## Architecture

```
cpr-jun132026-dev/
  backend/
    src/
      config/       # database, migrations, env
      plugins/      # auth middleware (requireAuth, requireRole)
      repositories/ # data access layer (MySQL queries)
      routes/       # Fastify route handlers (23 files)
      services/     # business logic (billing, HR, PDF, etc.)
      utils/        # helpers (taxConfig, logger)
      __tests__/    # Vitest unit tests (89 tests)
  frontend/
    src/
      components/
        gtacpr/     # GTACPR design system primitives
        portals/    # 8 role-based portal UIs
      contexts/     # AuthContext, ThemeContext
      services/     # API client (axios)
      __tests__/    # Vitest component tests (40 tests)
```

### Portals (8 roles)

| Portal | Role | Purpose |
|--------|------|---------|
| System Admin | `sysadmin` | Users, orgs, courses, certifications, students |
| Super Admin | `superadmin` | System-wide settings, email templates |
| Course Admin | `courseadmin` | Schedule courses, assign instructors |
| Organization | `organization` | Request courses, view invoices, submit payments |
| Instructor | `instructor` | View schedule, submit timesheets |
| Accounting | `accountant` | Billing, invoicing, AR aging, payments |
| HR | `hr` | Profile changes, pay rates, payroll |
| Vendor | `vendor` | Submit invoices, track payment status |

## Quick Start

### Prerequisites

- Node.js 20+
- MySQL 8
- npm

### Setup

```bash
# Clone
git clone https://github.com/Kaizenpbc/cpr-fastify.git
cd cpr-fastify

# Install dependencies (monorepo — single root install)
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

# Run database migrations (automatic on first start)
# Migrations are in backend/src/config/migrations.ts (v1–v11)

# Start backend (port 3001)
cd backend && npx tsx src/index.ts

# Start frontend (port 5173, proxies /api to backend)
cd frontend && npx vite
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | Yes | `3306` | MySQL port |
| `DB_USER` | Yes | — | MySQL username |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | `kaizenmo_cpr` | MySQL database name |
| `JWT_ACCESS_SECRET` | Yes | — | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | No | `15m` | Access token TTL |
| `REFRESH_TOKEN_EXPIRY` | No | `7d` | Refresh token TTL |
| `PORT` | No | `3001` | Backend port |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS origin |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Password hashing rounds |
| `HST_RATE` | No | `0.13` | Tax rate (overridable via `system_config` table) |
| `RESEND_API_KEY` | No | — | Resend email API key |

## Authentication

Stateless JWT with refresh token rotation:

1. `POST /api/v1/auth/login` — returns access token in body, refresh token as httpOnly secure cookie
2. Access token sent via `Authorization: Bearer <token>` header
3. `POST /api/v1/auth/refresh` — rotates tokens using cookie
4. `POST /api/v1/auth/logout` — clears cookie, blacklists token

Role-based access enforced per route via `requireRole('admin', 'hr', ...)` middleware.

## API

All endpoints are under `/api/v1`. See [docs/API.md](docs/API.md) for the full reference.

Key route groups:

| Prefix | Module | Endpoints |
|--------|--------|-----------|
| `/auth` | Authentication | login, logout, refresh, change-password |
| `/courses` | Course Management | CRUD, scheduling, roster, billing prep |
| `/accounting` | Billing & Invoicing | invoices, payments, pricing, AR aging, PDF |
| `/organization` | Org Self-Service | profile, courses, dashboard |
| `/hr` | Human Resources | instructors, profile changes, returned payments |
| `/instructor` | Instructor Portal | schedule, classes, availability |
| `/timesheet` | Timesheets | submit, approve, notes |
| `/pay-rates` | Pay Rate Management | tiers, instructor rates, bulk update |
| `/payroll` | Payroll | calculate, approve, payment records |
| `/vendor` | Vendor Portal | profile, invoice upload, download |
| `/sysadmin` | System Admin | users, orgs, courses, vendors, students, certs |
| `/notifications` | Notifications | list, read, preferences |

## Database

MySQL with a forward-only migration system. Migrations run automatically on startup.

Current schema (11 migrations): `login_attempts`, `token_blacklist`, `invoice_number_sequences`, `students`, `course_students` (enhanced), `class_types` (enhanced), `system_config`.

Core tables (pre-migration): `users`, `organizations`, `class_types`, `course_requests`, `course_students`, `invoices`, `payments`, `certifications`, `timesheets`, `payment_requests`, `payroll_payments`, `vendors`, `vendor_invoices`, `notifications`, `email_templates`, `colleges`.

## Testing

```bash
# Backend tests (89 tests)
cd backend && npx vitest run

# Frontend tests (40 tests)
cd frontend && npx vitest run

# All tests run automatically in CI on push to master
```

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. **Backend** — TypeScript typecheck + Vitest tests
2. **Frontend** — Vitest tests + Vite production build
3. **Deploy** (master only) — FTPS upload to cPanel, Passenger restart, health check

Deployments are automatic on push to `master`. Health check retries 3 times with 10s intervals.

## Security

- CSRF defense: Origin header validation on state-changing requests
- File upload validation: magic byte verification (PDF, HTML)
- Payment race conditions: `SELECT ... FOR UPDATE` locking
- Rate limiting: 100 req/min global, 10 req/min auth
- Helmet security headers with CSP
- No production sourcemaps
- SQL injection prevention: parameterized queries + column name whitelisting

## License

Proprietary. All rights reserved.
