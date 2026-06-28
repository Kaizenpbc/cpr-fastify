import { getPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { EmailService } from './EmailService.js';

const REMINDER_WINDOWS = [30, 60, 90]; // days before expiry

export class CertReminderService {
  private emailService: EmailService;

  constructor() {
    this.emailService = EmailService.getInstance();
  }

  async sendReminders(): Promise<{ sent: number; skipped: number; errors: number }> {
    const pool = getPool();
    let sent = 0, skipped = 0, errors = 0;

    for (const days of REMINDER_WINDOWS) {
      // Find certs expiring within this window that haven't been reminded
      const [rows] = await pool.query<any[]>(
        `SELECT cs.id as course_student_id, cs.email, cs.first_name, cs.last_name,
                cs.certificate_number, cs.certificate_expires_at,
                ct.name as course_type_name,
                DATEDIFF(cs.certificate_expires_at, CURDATE()) as days_until_expiry
         FROM course_students cs
         JOIN course_requests cr ON cs.course_request_id = cr.id
         JOIN class_types ct ON cr.course_type_id = ct.id
         WHERE cs.attended = true
           AND cs.certificate_expires_at IS NOT NULL
           AND cs.email IS NOT NULL AND cs.email != ''
           AND DATEDIFF(cs.certificate_expires_at, CURDATE()) BETWEEN 0 AND ?
           AND cs.id NOT IN (
             SELECT course_student_id FROM certification_reminders
             WHERE reminder_type = ?
           )
         ORDER BY cs.certificate_expires_at ASC
         LIMIT 100`,
        [days, `${days}d`]
      );

      for (const row of rows) {
        try {
          const ok = await this.emailService.sendCertExpiryReminder(
            row.email,
            row.first_name || 'Student',
            row.course_type_name,
            row.certificate_number || 'N/A',
            row.certificate_expires_at,
            row.days_until_expiry,
          );

          if (ok) {
            await pool.query(
              `INSERT INTO certification_reminders (course_student_id, student_email, reminder_type) VALUES (?, ?, ?)`,
              [row.course_student_id, row.email, `${days}d`]
            );
            sent++;
          } else {
            errors++;
          }
        } catch (err) {
          logger.error({ err, email: row.email }, 'Failed to send cert reminder');
          errors++;
        }
      }

      skipped += 0; // rows not in result are already skipped by the NOT IN clause
    }

    logger.info({ sent, skipped, errors }, 'Certification reminders batch complete');
    return { sent, skipped, errors };
  }
}
