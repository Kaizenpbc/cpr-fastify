import { getPool } from '../config/database.js';
import { logger } from '../config/logger.js';

interface AuditLogParams {
  userId?: number;
  username?: string;
  action: string;
  entityType?: string;
  entityId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Fire-and-forget audit log entry. Failures are logged but never thrown.
 */
export function logAudit(params: AuditLogParams): void {
  const pool = getPool();
  pool.query(
    `INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId ?? null,
      params.username ?? null,
      params.action,
      params.entityType ?? null,
      params.entityId ?? null,
      params.details ? JSON.stringify(params.details) : null,
      params.ipAddress ?? null,
    ]
  ).catch((err) => {
    logger.warn({ err, action: params.action }, 'Failed to write audit log');
  });
}
