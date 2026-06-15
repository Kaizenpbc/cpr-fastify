import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { OrganizationService, OrgError } from '../services/OrganizationService.js';
import { OrganizationRepository } from '../repositories/OrganizationRepository.js';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../plugins/auth.js';

const updateProfileSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(''),
  contactPhone: z.string().optional().default(''),
  contactEmail: z.string().email().optional().default(''),
});

const courseRequestSchema = z.object({
  courseTypeId: z.number().int().positive(),
  scheduledDate: z.string().min(1),
  location: z.string().min(1),
  locationId: z.number().int().positive().optional(),
  registeredStudents: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

function handleError(err: unknown, reply: any) {
  if (err instanceof OrgError) return reply.status(err.statusCode).send({ error: err.message });
  throw err;
}

export async function organizationRoutes(app: FastifyInstance) {
  const service = new OrganizationService(new OrganizationRepository());
  const orgRole = [requireRole('organization')];
  const adminRole = [requireRole('admin', 'sysadmin')];

  // ===== Org user: get own org =====
  app.get('/profile', { preHandler: orgRole }, async (request, reply) => {
    try {
      if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked to this account' });
      return { success: true, data: await service.getOrganization(request.userOrgId) };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Org user: update own org =====
  app.put('/profile', { preHandler: orgRole }, async (request, reply) => {
    if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked to this account' });
    const data = updateProfileSchema.parse(request.body);
    try {
      return { success: true, data: await service.updateProfile(request.userOrgId, data) };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Admin: get any org =====
  app.get('/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return { success: true, data: await service.getOrganization(parseInt(id)) };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Admin: update any org =====
  app.put('/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateProfileSchema.parse(request.body);
    try {
      return { success: true, data: await service.updateProfile(parseInt(id), data) };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Org user: own courses =====
  app.get('/courses', { preHandler: orgRole }, async (request, reply) => {
    if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked' });
    const { page = '1', limit = '50' } = request.query as Record<string, string>;
    const result = await service.getCourses(request.userOrgId, parseInt(page), parseInt(limit));
    return { success: true, data: result.rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: result.total } };
  });

  // ===== Org user: archived courses =====
  app.get('/archive', { preHandler: orgRole }, async (request, reply) => {
    if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked' });
    const result = await service.getArchivedCourses(request.userOrgId);
    return { success: true, data: result.rows };
  });

  // ===== Org dashboard =====
  app.get('/dashboard', { preHandler: orgRole }, async (request, reply) => {
    if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked' });
    const pool = getPool();
    const orgId = request.userOrgId;

    const [[activeCourses], [completedCourses], [pendingInvoices], [totalSpent]] = await Promise.all([
      pool.query<any[]>(`SELECT COUNT(*) as count FROM course_requests WHERE organization_id = ? AND status = 'confirmed'`, [orgId]),
      pool.query<any[]>(`SELECT COUNT(*) as count FROM course_requests WHERE organization_id = ? AND status = 'completed'`, [orgId]),
      pool.query<any[]>(`SELECT COUNT(*) as count FROM invoices WHERE organization_id = ? AND status IN ('posted_to_org', 'overdue')`, [orgId]),
      pool.query<any[]>(`SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE i.organization_id = ?`, [orgId]),
    ]);

    return {
      success: true,
      data: {
        activeCourses: Number(activeCourses[0]?.count ?? 0),
        completedCourses: Number(completedCourses[0]?.count ?? 0),
        pendingInvoices: Number(pendingInvoices[0]?.count ?? 0),
        totalSpent: Number(totalSpent[0]?.total ?? 0),
      },
    };
  });

  // ===== Org course request (POST /organization/course-request) =====
  app.post('/course-request', { preHandler: orgRole }, async (request, reply) => {
    if (!request.userOrgId) return reply.status(400).send({ error: 'No organization linked' });
    const pool = getPool();
    const { courseTypeId, scheduledDate, location, locationId, registeredStudents, notes } = courseRequestSchema.parse(request.body);

    const [result] = await pool.query<any>(
      `INSERT INTO course_requests (organization_id, course_type_id, scheduled_date, location, location_id,
       registered_students, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [request.userOrgId, courseTypeId, scheduledDate, location, locationId ?? null,
       registeredStudents ?? 0, notes ?? null]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM course_requests WHERE id = ?', [result.insertId]);
    return { success: true, message: 'Course request submitted successfully', data: rows[0] };
  });
}
