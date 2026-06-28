# CPR Training Management System -- Migration Guide

**Last Updated**: 2026-06-28
**System**: CPR Training Management System (Fastify 5 / MySQL)

---

## Table of Contents

1. [How Migrations Work](#1-how-migrations-work)
2. [Migration Structure](#2-migration-structure)
3. [Current Migrations](#3-current-migrations)
4. [How to Add a New Migration](#4-how-to-add-a-new-migration)
5. [How to Verify Migrations Ran](#5-how-to-verify-migrations-ran)
6. [Rollback Considerations](#6-rollback-considerations)
7. [Best Practices](#7-best-practices)

---

## 1. How Migrations Work

The migration system is defined in `backend/src/config/migrations.ts` and is invoked during server startup from `backend/src/index.ts`.

### Startup Sequence

1. The server connects to the database (`connectDatabase()`)
2. `runMigrations()` is called
3. The tax configuration is initialized (`initTaxConfig()`)
4. The Fastify app is built and starts listening

### Tracking Table

Migrations are tracked in the `schema_migrations` table, which is automatically created if it does not exist:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

Each row records a migration version number, its name, and the timestamp when it was applied.

### Execution Logic

1. The runner queries `schema_migrations` to get all already-applied version numbers.
2. It iterates through the `migrations` array in order.
3. For each migration, if its version is already in the applied set, it is **skipped** (idempotent).
4. If the migration has not been applied, its `up` SQL or function is executed, and a row is inserted into `schema_migrations`.
5. After all migrations, old `login_attempts` records (older than 1 hour) are cleaned up.
6. The runner logs how many migrations were applied, or "Schema up to date" if none were pending.

Migrations run **automatically on every server startup**. There is no separate CLI command required.

---

## 2. Migration Structure

Each migration is defined as an object in the `migrations` array with the following interface:

```typescript
interface Migration {
  version: number;      // Unique, incrementing version number
  name: string;         // Descriptive name (used in schema_migrations table)
  up: string | ((pool: Pool) => Promise<void>);  // SQL string or async function
}
```

### Simple SQL Migration

For straightforward DDL changes, `up` is a SQL string:

```typescript
{
  version: 8,
  name: 'add_certification_expiry_tracking',
  up: `ALTER TABLE class_types
    ADD COLUMN IF NOT EXISTS certification_validity_months INT DEFAULT NULL`,
}
```

### Programmatic Migration

For complex migrations that require multiple queries, conditional logic, or data backfills, `up` is an async function that receives the database connection pool:

```typescript
{
  version: 7,
  name: 'backfill_students_master',
  up: async (pool: Pool) => {
    // Multiple queries, loops, conditional logic
    const [rows] = await pool.query<any[]>(`SELECT ...`);
    for (const r of rows) {
      await pool.query('INSERT IGNORE INTO students ...', [r.email, ...]);
    }
    // Link records
    await pool.query('UPDATE course_students cs JOIN students s ...');
  },
}
```

---

## 3. Current Migrations

| Version | Name | Description |
|---------|------|-------------|
| **v1** | `create_login_attempts` | Creates the `login_attempts` table for tracking failed login attempts (account lockout). Includes index on `(username, attempted_at)`. |
| **v2** | `create_token_blacklist` | Creates the `token_blacklist` table for invalidating JWT tokens on password change. Keyed by `user_id`. |
| **v3** | `create_invoice_number_sequences` | Creates the `invoice_number_sequences` table for configurable per-organization invoice numbering. Supports format tokens, padding, reset policies (none/yearly/monthly). |
| **v4** | `fix_token_blacklist_add_invalidated_at` | Adds the `invalidated_at` column to `token_blacklist` if missing. Fixes an issue where the table was manually created on production before the migration system existed, without this column. |
| **v5** | `create_students_master` | Creates the `students` master table with email-based deduplication, organization FK, marketing consent fields, and indexes on email, org, and name. |
| **v6** | `add_student_id_to_course_students` | Adds `student_id` FK column to `course_students` table, linking individual course enrollments to the master student record. |
| **v7** | `backfill_students_master` | Programmatic migration. Groups existing `course_students` by email, creates master `students` records via `INSERT IGNORE`, then links `course_students` rows to their master records via a JOIN UPDATE. |
| **v8** | `add_certification_expiry_tracking` | Adds `certification_validity_months` column to `class_types` table (nullable INT). Allows each course type to define how long its certification is valid. |
| **v9** | `add_certificate_fields_to_course_students` | Adds `certificate_number`, `certificate_issued_at`, and `certificate_expires_at` columns to `course_students`. Includes index on `certificate_expires_at` for expiry queries. |
| **v10** | `backfill_certificate_dates` | Programmatic migration. For attended students in completed courses where the class type has a validity period, sets `certificate_issued_at` to the course completion date and calculates `certificate_expires_at`. |
| **v11** | `create_system_config` | Programmatic migration. Creates the `system_config` key-value table and seeds the `tax_rate` entry from the `HST_RATE` environment variable (default 0.13 = 13% HST). |
| **v12** | `create_certification_reminders` | Creates the `certification_reminders` table for deduplicating cert expiry reminder emails. Tracks `course_student_id`, `reminder_type` (30d/60d/90d), and `sent_at`. |
| **v13** | `create_audit_logs` | Creates the `audit_logs` table for security audit logging. Stores user, action, entity references, details (JSON), and IP address. Includes indexes on `created_at`, `user_id`, and `(entity_type, entity_id)`. |

---

## 4. How to Add a New Migration

### Step-by-Step

1. **Open** `backend/src/config/migrations.ts`.

2. **Add a new entry** to the end of the `migrations` array. Use the next sequential version number:

   ```typescript
   {
     version: 14,
     name: 'descriptive_name_here',
     up: `YOUR SQL STATEMENT HERE`,
   },
   ```

   Or for a programmatic migration:

   ```typescript
   {
     version: 14,
     name: 'descriptive_name_here',
     up: async (pool: Pool) => {
       // Your migration logic
       await pool.query('...');
     },
   },
   ```

3. **Use `IF NOT EXISTS` / `IF EXISTS`** in DDL statements where possible (e.g., `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) for additional safety.

4. **Test locally**:
   - Start the server: `npm run dev`
   - Check the console for `Migration applied` log entries
   - Verify the change in the database

5. **Test on staging**:
   - Push to the repository
   - The staging auto-deploy will pick up the change and run migrations on startup
   - Verify via the `schema_migrations` table

6. **Commit** the change. The migration will run automatically on the next production deployment when the server restarts.

### Important Rules

- **Never modify an existing migration** that has already been applied to staging or production. The migration system checks by version number -- if a version is already in `schema_migrations`, it will never run again, even if the SQL has changed.
- **Never reuse a version number**. Always increment.
- **Never reorder migrations**. New migrations must be appended to the end of the array.

---

## 5. How to Verify Migrations Ran

### Check the `schema_migrations` Table

Connect to the database and query:

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

This shows every migration that has been applied and when.

### Check Server Startup Logs

On startup, the migration runner logs one of:

- `Migration applied { version: N, name: '...' }` -- for each newly applied migration
- `Migrations complete { count: N }` -- summary after applying pending migrations
- `Schema up to date` -- if no migrations were pending

These log entries appear in the Pino-formatted server logs (stdout or log files depending on deployment).

### Verify Table/Column Exists

For DDL migrations, you can verify directly:

```sql
-- Check if a table exists
SHOW TABLES LIKE 'audit_logs';

-- Check if a column exists
SHOW COLUMNS FROM class_types LIKE 'certification_validity_months';

-- Check table structure
DESCRIBE students;
```

---

## 6. Rollback Considerations

### No Automatic Rollback

The migration system does **not** support automatic rollback. There is no `down` function defined on migrations. If a migration needs to be reversed, you must:

1. **Write the reverse SQL manually**. For example:
   - If the migration added a column: `ALTER TABLE x DROP COLUMN y`
   - If the migration created a table: `DROP TABLE IF EXISTS x`
   - If the migration backfilled data: write a query to undo the data changes

2. **Execute the reverse SQL** against the database directly (via MySQL client or a database management tool).

3. **Remove the migration record** from the tracking table:
   ```sql
   DELETE FROM schema_migrations WHERE version = <N>;
   ```
   This allows the corrected migration to run again on next startup if needed.

### Test in Staging First

Always test migrations on the staging environment (`stagecprapp.kpbc.ca`) before deploying to production. The staging environment has its own database and auto-deploys from the repository hourly.

### Partial Failure

If a migration fails mid-execution (e.g., a SQL error), the version will **not** be recorded in `schema_migrations` (because the INSERT happens after the migration SQL). This means the migration will be retried on the next server startup. However, if the migration made partial changes before failing (e.g., the first of two ALTER TABLE statements succeeded), you may need to manually clean up before retrying. Using `IF NOT EXISTS` / `IF EXISTS` guards in DDL statements helps make this safe.

For programmatic migrations, ensure your logic is idempotent (e.g., use `INSERT IGNORE`, check for existing data before modifying).

---

## 7. Best Practices

### Column Additions

- **Always add new columns as `NULL` or with a `DEFAULT` value.** Adding a `NOT NULL` column without a default to a table with existing data will fail.
  ```sql
  -- Good
  ADD COLUMN IF NOT EXISTS new_field VARCHAR(100) DEFAULT NULL

  -- Bad (will fail if table has rows)
  ADD COLUMN new_field VARCHAR(100) NOT NULL
  ```

### Column Removals

- **Never drop columns in production without verifying that no code references them.** Search the entire codebase for the column name before writing a DROP COLUMN migration. Queries referencing a dropped column will fail at runtime with no compile-time warning (since SQL is written as strings, not type-checked).

### Data Migrations

- **Use `INSERT IGNORE` or `ON DUPLICATE KEY UPDATE`** for data seeding and backfills to make them idempotent.
- **Batch large updates** to avoid locking tables for extended periods.
- **Log progress** using the `logger` for programmatic migrations so you can verify what happened.

### Table Creation

- **Always use `CREATE TABLE IF NOT EXISTS`** so the migration is safe to retry.
- **Always use `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`** for consistency with the rest of the schema.
- **Define indexes inline** in the CREATE TABLE statement rather than as separate ALTER TABLE statements.

### Foreign Keys

- **Use `ON DELETE SET NULL` or `ON DELETE CASCADE`** explicitly. The default (`ON DELETE RESTRICT`) can cause unexpected failures when deleting parent records.
- **Name constraints** with a descriptive prefix (e.g., `fk_students_org`) so they are easy to identify if you need to drop them later.

### General

- **Keep migrations small and focused.** One logical change per migration. Do not combine unrelated schema changes.
- **Test the migration on an empty database** (fresh install) and on a **database with existing data** (upgrade path) to verify both scenarios work.
- **Never modify a migration that has been deployed.** If it was wrong, add a new migration to fix it (as was done with v4 fixing v2's missing column).
- **Document the migration** in `TODO.md` or release notes so the team knows what schema changes were made and why.

---

## File References

| File | Purpose |
|------|---------|
| `backend/src/config/migrations.ts` | Migration definitions and runner |
| `backend/src/index.ts` | Server startup -- calls `runMigrations()` |
| `backend/src/config/database.ts` | Database connection pool |
| `backend/src/config/logger.ts` | Pino logger used by migration runner |

---

*This guide documents the database migration system for the CPR Training Management System as of 2026-06-28. Update this document when adding significant migrations or changing the migration infrastructure.*
