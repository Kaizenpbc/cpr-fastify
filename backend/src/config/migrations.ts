import { getPool } from './database.js';
import { logger } from './logger.js';

/**
 * Run startup migrations (idempotent — safe to run on every boot).
 * Uses CREATE TABLE IF NOT EXISTS so tables are only created once.
 */
export async function runMigrations(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_login_attempts_username (username, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_blacklist (
      user_id INT NOT NULL PRIMARY KEY,
      invalidated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_blacklist_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Clean up old login attempts (> 1 hour)
  await pool.query(`DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 1 HOUR`);

  logger.info('Migrations complete');
}
