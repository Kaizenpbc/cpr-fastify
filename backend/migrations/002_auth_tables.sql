-- Migration 002: DB-backed login lockout and token blacklist
-- Replaces in-memory Maps that were lost on server restart

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts_username (username, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS token_blacklist (
  user_id INT NOT NULL PRIMARY KEY,
  invalidated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_blacklist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Periodic cleanup: delete login attempts older than 1 hour
-- Run via cron or application-level cleanup
-- DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 1 HOUR;
