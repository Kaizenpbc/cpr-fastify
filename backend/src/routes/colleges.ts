import { FastifyInstance } from 'fastify';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../plugins/auth.js';

export async function collegeRoutes(app: FastifyInstance) {
  const pool = getPool();
  const adminRole = [requireRole('admin', 'sysadmin')];

  // Get active colleges (for dropdowns)
  app.get('/', { preHandler: [requireAuth] }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name FROM colleges WHERE is_active = true ORDER BY name'
    );
    return { success: true, data: rows };
  });

  // Get all colleges including inactive (admin)
  app.get('/all', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name, is_active, created_at, updated_at FROM colleges ORDER BY name'
    );
    return { success: true, data: rows };
  });

  // Create college
  app.post('/', { preHandler: adminRole }, async (request, reply) => {
    const { name } = request.body as { name: string };
    if (!name?.trim()) return reply.status(400).send({ error: 'College name is required' });

    const [existing] = await pool.query<any[]>('SELECT id FROM colleges WHERE LOWER(name) = LOWER(?)', [name.trim()]);
    if (existing.length > 0) return reply.status(400).send({ error: 'College with this name already exists' });

    const [result] = await pool.query<any>(
      'INSERT INTO colleges (name) VALUES (?)', [name.trim()]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM colleges WHERE id = ?', [result.insertId]);
    return { success: true, data: rows[0] };
  });

  // Update college
  app.put('/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, is_active, isActive } = request.body as any;
    const activeValue = isActive !== undefined ? isActive : is_active;

    const sets: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) { sets.push('name = ?'); params.push(name.trim()); }
    if (activeValue !== undefined) { sets.push('is_active = ?'); params.push(activeValue); }
    if (sets.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    sets.push('updated_at = CURRENT_TIMESTAMP');
    params.push(parseInt(id));

    const [result] = await pool.query<any>(
      `UPDATE colleges SET ${sets.join(', ')} WHERE id = ?`, params
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'College not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM colleges WHERE id = ?', [parseInt(id)]);
    return { success: true, data: rows[0] };
  });

  // Delete college
  app.delete('/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await pool.query<any>('DELETE FROM colleges WHERE id = ?', [parseInt(id)]);
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'College not found' });
    return { success: true, data: { deleted: true, id: parseInt(id) } };
  });
}
