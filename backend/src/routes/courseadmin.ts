import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPool } from '../config/database.js';
import { requireRole } from '../plugins/auth.js';

const scheduleSchema = z.object({
  instructorId: z.number().int().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function courseAdminRoutes(app: FastifyInstance) {
  const pool = getPool();
  const adminRole = [requireRole('admin', 'sysadmin', 'courseadmin')];

  // Get instructors for scheduling
  app.get('/instructors', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT id, username, email, first_name, last_name
       FROM users WHERE role = 'instructor' AND status = 'active' ORDER BY username`
    );
    return { success: true, data: rows };
  });

  // Schedule a course (assign instructor + times)
  app.post('/courses/:id/schedule', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = scheduleSchema.parse(request.body);

    const [result] = await pool.query<any>(
      `UPDATE course_requests SET
       instructor_id = ?, start_time = ?, end_time = ?,
       status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [data.instructorId, data.startTime, data.endTime, parseInt(id)]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Course not found' });

    const [rows] = await pool.query<any[]>('SELECT * FROM course_requests WHERE id = ?', [parseInt(id)]);
    return { success: true, message: 'Course scheduled successfully', data: rows[0] };
  });
}
