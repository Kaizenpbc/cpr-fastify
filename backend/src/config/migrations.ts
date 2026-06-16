import { getPool } from './database.js';
import { logger } from './logger.js';

interface Migration {
  version: number;
  name: string;
  up: string;
}

/**
 * Versioned migration runner. Each migration runs exactly once, tracked in
 * the `schema_migrations` table. Add new migrations to the end of the list.
 */
const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_login_attempts',
    up: `CREATE TABLE IF NOT EXISTS login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_login_attempts_username (username, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
  {
    version: 2,
    name: 'create_token_blacklist',
    up: `CREATE TABLE IF NOT EXISTS token_blacklist (
      user_id INT NOT NULL PRIMARY KEY,
      invalidated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_blacklist_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  },
];

export async function runMigrations(): Promise<void> {
  const pool = getPool();

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Get already-applied versions
  const [rows] = await pool.query<any[]>('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r: any) => r.version));

  // Run pending migrations in order
  let ran = 0;
  for (const m of migrations) {
    if (applied.has(m.version)) continue;
    await pool.query(m.up);
    await pool.query(
      'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
      [m.version, m.name]
    );
    logger.info({ version: m.version, name: m.name }, 'Migration applied');
    ran++;
  }

  // Periodic cleanup: old login attempts
  await pool.query('DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 1 HOUR');

  if (ran > 0) {
    logger.info({ count: ran }, 'Migrations complete');
  } else {
    logger.info('Schema up to date');
  }
}
