import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPool } from '../config/database.js';
import { requireRole } from '../plugins/auth.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import bcrypt from 'bcryptjs';
import { StudentRepository } from '../repositories/StudentRepository.js';

const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'instructor', 'organization', 'accountant', 'hr', 'courseadmin', 'vendor', 'sysadmin']),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  organizationId: z.number().int().positive().optional(),
  locationId: z.number().int().positive().optional(),
});

const createCourseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive(),
  course_code: z.string().optional(),
  is_active: z.boolean().default(true),
});

const createOrgSchema = z.object({
  name: z.string().min(1),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

const vendorBodySchema = z.object({
  vendor_name: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  contactEmail: z.string().email().optional(),
  contact_email: z.string().email().optional(),
  phone: z.string().optional(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_province: z.string().optional(),
  address_postal_code: z.string().optional(),
  vendor_type: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  const pool = getPool();
  const adminRole = [requireRole('admin', 'sysadmin')];
  const sysadminRole = [requireRole('sysadmin')];

  // ===== Course type management =====
  app.get('/courses', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name, description, duration_minutes, course_code,
              COALESCE(is_active, true) as is_active, created_at, updated_at
       FROM class_types ORDER BY name`
    );
    return { success: true, data: rows };
  });

  app.post('/courses', { preHandler: adminRole }, async (request, reply) => {
    const data = createCourseSchema.parse(request.body);
    const [existing] = await pool.query<any[]>('SELECT id FROM class_types WHERE LOWER(name) = LOWER(?)', [data.name]);
    if (existing.length > 0) return reply.status(400).send({ error: 'A course with this name already exists' });

    const [result] = await pool.query<any>(
      'INSERT INTO class_types (name, description, duration_minutes, course_code, is_active) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.description ?? null, data.duration_minutes, data.course_code ?? null, data.is_active]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM class_types WHERE id = ?', [result.insertId]);
    return { success: true, message: 'Course created successfully', data: rows[0] };
  });

  app.put('/courses/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, description, duration_minutes, course_code, is_active } = createCourseSchema.partial().parse(request.body);

    if (name) {
      const [dup] = await pool.query<any[]>('SELECT id FROM class_types WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id]);
      if (dup.length > 0) return reply.status(400).send({ error: 'A course with this name already exists' });
    }

    const [result] = await pool.query<any>(
      `UPDATE class_types SET name = COALESCE(?, name), description = COALESCE(?, description),
       duration_minutes = COALESCE(?, duration_minutes), course_code = COALESCE(?, course_code),
       is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name ?? null, description ?? null, duration_minutes ?? null, course_code ?? null, is_active ?? null, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Course not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM class_types WHERE id = ?', [id]);
    return { success: true, message: 'Course updated successfully', data: rows[0] };
  });

  app.put('/courses/:id/toggle-active', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await pool.query<any>(
      'UPDATE class_types SET is_active = NOT COALESCE(is_active, true), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Course not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM class_types WHERE id = ?', [id]);
    return { success: true, message: `Course ${rows[0].is_active ? 'activated' : 'deactivated'} successfully`, data: rows[0] };
  });

  app.delete('/courses/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [usage] = await pool.query<any[]>('SELECT COUNT(*) as count FROM course_requests WHERE course_type_id = ?', [id]);
    if (Number(usage[0].count) > 0) {
      await pool.query('UPDATE class_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      const [rows] = await pool.query<any[]>('SELECT * FROM class_types WHERE id = ?', [id]);
      return { success: true, message: `Course deactivated (${usage[0].count} course requests exist)`, data: rows[0], softDeleted: true };
    }
    const [result] = await pool.query<any>('DELETE FROM class_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Course not found' });
    return { success: true, message: 'Course deleted permanently', softDeleted: false };
  });

  // ===== User management =====
  app.get('/users', { preHandler: adminRole }, async (request) => {
    const { page = '1', limit = '100', search = '', role = '' } = request.query as Record<string, string>;
    const safeLimit = Math.min(parseInt(limit), 200);
    const offset = (parseInt(page) - 1) * safeLimit;

    let where = '';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) { conditions.push('u.role = ?'); params.push(role); }
    if (conditions.length > 0) where = 'WHERE ' + conditions.join(' AND ');

    const [rows] = await pool.query<any[]>(
      `SELECT u.id, u.username, u.email, u.role, u.phone, u.mobile,
              u.first_name, u.last_name, u.full_name,
              u.organization_id, o.name as organization_name,
              u.location_id, ol.location_name,
              u.date_onboarded, u.date_offboarded, u.user_comments, u.status,
              u.created_at, u.updated_at
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN organization_locations ol ON u.location_id = ol.id
       ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );
    const [countRows] = await pool.query<any[]>(`SELECT COUNT(*) as count FROM users u ${where}`, params);
    const total = Number(countRows[0]?.count ?? 0);

    return { success: true, data: rows, pagination: { page: parseInt(page), limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
  });

  app.post('/users', { preHandler: adminRole }, async (request, reply) => {
    const data = createUserSchema.parse(request.body);

    // Check duplicates
    const [existingUser] = await pool.query<any[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?', [data.username, data.email]
    );
    if (existingUser.length > 0) return reply.status(400).send({ error: 'Username or email already exists' });

    if (!data.password) return reply.status(400).send({ error: 'Password is required' });
    const password = data.password;
    const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    const [result] = await pool.query<any>(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name,
       phone, mobile, organization_id, location_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.username, data.email, hash, data.role, data.firstName ?? null, data.lastName ?? null,
       data.phone ?? null, data.mobile ?? null, data.organizationId ?? null, data.locationId ?? null]
    );
    const [rows] = await pool.query<any[]>(
      'SELECT id, username, email, role, first_name, last_name, organization_id, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    return { success: true, message: 'User created successfully', data: rows[0] };
  });

  app.put('/users/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { username, email, role, firstName, lastName, phone, mobile, organizationId, locationId, status } = createUserSchema.extend({
      status: z.enum(['active', 'inactive', 'deleted']).optional(),
    }).partial().parse(request.body);

    const [result] = await pool.query<any>(
      `UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email),
       role = COALESCE(?, role), first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
       phone = COALESCE(?, phone), mobile = COALESCE(?, mobile),
       organization_id = COALESCE(?, organization_id), location_id = COALESCE(?, location_id),
       status = COALESCE(?, status), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [username ?? null, email ?? null, role ?? null, firstName ?? null, lastName ?? null,
       phone ?? null, mobile ?? null, organizationId ?? null, locationId ?? null, status ?? null, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'User not found' });
    const [rows] = await pool.query<any[]>(
      `SELECT id, username, email, full_name, first_name, last_name, role,
              organization_id, location_id, status, phone, mobile, address,
              date_onboarded, date_offboarded, created_at, updated_at
       FROM users WHERE id = ?`, [id]
    );
    return { success: true, message: 'User updated successfully', data: rows[0] };
  });

  app.post('/users/:id/reset-password', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { password } = z.object({ password: z.string().min(6) }).parse(request.body);
    const hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    const [result] = await pool.query<any>(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hash, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'User not found' });
    return { success: true, message: 'Password reset successfully' };
  });

  // ===== Organization management =====
  app.get('/organizations', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM organizations ORDER BY name LIMIT 500'
    );
    return { success: true, data: rows };
  });

  app.post('/organizations', { preHandler: adminRole }, async (request) => {
    const data = createOrgSchema.parse(request.body);
    const [result] = await pool.query<any>(
      'INSERT INTO organizations (name, contact_email, contact_phone, address) VALUES (?, ?, ?, ?)',
      [data.name, data.contact_email ?? null, data.contact_phone ?? null, data.address ?? null]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE id = ?', [result.insertId]);
    return { success: true, message: 'Organization created successfully', data: rows[0] };
  });

  app.put('/organizations/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, contact_email, contact_phone, address } = createOrgSchema.partial().parse(request.body);
    const [result] = await pool.query<any>(
      `UPDATE organizations SET name = COALESCE(?, name), contact_email = COALESCE(?, contact_email),
       contact_phone = COALESCE(?, contact_phone), address = COALESCE(?, address),
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name ?? null, contact_email ?? null, contact_phone ?? null, address ?? null, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Organization not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM organizations WHERE id = ?', [id]);
    return { success: true, message: 'Organization updated successfully', data: rows[0] };
  });

  // ===== Sysadmin: PIPEDA data erasure =====
  app.delete('/users/:userId/personal-data', { preHandler: sysadminRole }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const id = parseInt(userId);
    if (isNaN(id) || id <= 0) return reply.status(400).send({ error: 'Invalid userId' });

    const [check] = await pool.query<any[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (check.length === 0) return reply.status(404).send({ error: `User ${id} not found` });

    await pool.query(
      `UPDATE users SET username = CONCAT('deleted_', id), email = CONCAT('deleted_', id, '@deleted.invalid'),
       first_name = NULL, last_name = NULL, phone = NULL, status = 'deleted' WHERE id = ?`,
      [id]
    );
    logger.info({ userId: id, sysadmin: request.userId }, 'PIPEDA personal data anonymised');
    return { success: true, message: 'Personal data anonymised' };
  });

  // ===== Instructor list for dropdowns =====
  app.get('/instructors', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT id, username, email, first_name, last_name FROM users
       WHERE role = 'instructor' AND status = 'active' ORDER BY username`
    );
    return { success: true, data: rows };
  });

  // ===== Organization locations =====
  app.get('/organizations/:orgId/locations', { preHandler: adminRole }, async (request) => {
    const { orgId } = request.params as { orgId: string };
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM organization_locations WHERE organization_id = ? ORDER BY location_name', [orgId]
    );
    return { success: true, data: rows };
  });

  // ===== System admin dashboard =====
  app.get('/dashboard', { preHandler: adminRole }, async () => {
    const [[userCount], [orgCount], [courseCount], [vendorCount]] = await Promise.all([
      pool.query<any[]>('SELECT COUNT(*) as count FROM users'),
      pool.query<any[]>('SELECT COUNT(*) as count FROM organizations'),
      pool.query<any[]>('SELECT COUNT(*) as count FROM class_types WHERE is_active = true'),
      pool.query<any[]>('SELECT COUNT(*) as count FROM vendors WHERE is_active = true'),
    ]);

    const [recentUsers] = await pool.query<any[]>(
      'SELECT username, role, created_at as createdAt FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const [recentCourses] = await pool.query<any[]>(
      `SELECT name, course_code as courseCode, created_at as createdAt
       FROM class_types WHERE is_active = true ORDER BY created_at DESC LIMIT 5`
    );

    return {
      success: true,
      data: {
        summary: {
          totalUsers: Number(userCount[0]?.count ?? 0),
          totalOrganizations: Number(orgCount[0]?.count ?? 0),
          totalCourses: Number(courseCount[0]?.count ?? 0),
          totalVendors: Number(vendorCount[0]?.count ?? 0),
        },
        recentActivity: { users: recentUsers, courses: recentCourses },
      },
    };
  });

  // ===== System configurations =====
  app.get('/configurations', { preHandler: sysadminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM system_configurations ORDER BY category, config_key LIMIT 500'
    );
    return { success: true, data: rows };
  });

  app.get('/configurations/categories', { preHandler: sysadminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT DISTINCT category FROM system_configurations ORDER BY category'
    );
    return { success: true, data: rows.map((r: any) => r.category) };
  });

  app.get('/configurations/category/:category', { preHandler: sysadminRole }, async (request) => {
    const { category } = request.params as { category: string };
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM system_configurations WHERE category = ? ORDER BY config_key',
      [category]
    );
    return { success: true, data: rows };
  });

  app.get('/configurations/:key', { preHandler: sysadminRole }, async (request, reply) => {
    const { key } = request.params as { key: string };
    const [rows] = await pool.query<any[]>(
      'SELECT * FROM system_configurations WHERE config_key = ?', [key]
    );
    if (rows.length === 0) return reply.status(404).send({ error: `Configuration key '${key}' not found` });
    return { success: true, data: { key, value: rows[0].config_value } };
  });

  app.put('/configurations/:key', { preHandler: sysadminRole }, async (request, reply) => {
    const { key } = request.params as { key: string };
    const { value } = request.body as { value: string };
    if (!value) return reply.status(400).send({ error: 'Configuration value is required' });

    const [result] = await pool.query<any>(
      `UPDATE system_configurations SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE config_key = ?`,
      [value, request.userId, key]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: `Configuration key '${key}' not found` });
    const [rows] = await pool.query<any[]>('SELECT * FROM system_configurations WHERE config_key = ?', [key]);
    return { success: true, data: rows[0], message: `Configuration '${key}' updated successfully` };
  });

  // ===== Vendor entity CRUD (sysadmin) =====
  app.get('/vendors', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT id, name as vendorName, contact_email as email, contact_phone as phone,
              address, vendor_type as vendorType, is_active as isActive,
              created_at as createdAt, updated_at as updatedAt
       FROM vendors ORDER BY name`
    );
    const vendors = rows.map((v: any) => {
      let addressStreet = '', addressCity = '', addressProvince = '', addressPostalCode = '';
      if (v.address) {
        const parts = v.address.split(',').map((p: string) => p.trim());
        addressStreet = parts[0] || '';
        addressCity = parts[1] || '';
        addressProvince = parts[2] || '';
        addressPostalCode = parts[3] || '';
      }
      return { ...v, addressStreet, addressCity, addressProvince, addressPostalCode,
               status: v.isActive ? 'active' : 'inactive' };
    });
    return { success: true, data: vendors };
  });

  app.post('/vendors', { preHandler: adminRole }, async (request, reply) => {
    const { vendor_name, name, email, contactEmail, contact_email, phone, contact_phone,
            address, address_street, address_city, address_province, address_postal_code,
            vendor_type, is_active } = vendorBodySchema.parse(request.body);

    const vendorName = vendor_name || name;
    if (!vendorName) return reply.status(400).send({ error: 'Vendor name is required' });

    let fullAddress = address;
    if (address_street || address_city || address_province || address_postal_code) {
      fullAddress = [address_street, address_city, address_province, address_postal_code].filter(Boolean).join(', ');
    }

    const [result] = await pool.query<any>(
      'INSERT INTO vendors (name, contact_email, contact_phone, address, vendor_type, is_active) VALUES (?, ?, ?, ?, ?, COALESCE(?, true))',
      [vendorName, email || contactEmail || contact_email || null, phone || contact_phone || null,
       fullAddress || null, vendor_type || null, is_active ?? true]
    );
    const [rows] = await pool.query<any[]>('SELECT * FROM vendors WHERE id = ?', [result.insertId]);
    return { success: true, message: 'Vendor created successfully', data: rows[0] };
  });

  app.put('/vendors/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { vendor_name, name, email, contact_email, phone, contact_phone,
            address, address_street, address_city, address_province, address_postal_code,
            vendor_type, is_active } = vendorBodySchema.parse(request.body);

    const vendorName = vendor_name || name;
    let fullAddress = address;
    if (address_street || address_city || address_province || address_postal_code) {
      fullAddress = [address_street, address_city, address_province, address_postal_code].filter(Boolean).join(', ');
    }

    const [result] = await pool.query<any>(
      `UPDATE vendors SET name = COALESCE(?, name), contact_email = COALESCE(?, contact_email),
       contact_phone = COALESCE(?, contact_phone), address = COALESCE(?, address),
       vendor_type = COALESCE(?, vendor_type), is_active = COALESCE(?, is_active),
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [vendorName || null, email || contact_email || null, phone || contact_phone || null,
       fullAddress || null, vendor_type || null, is_active ?? null, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Vendor not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM vendors WHERE id = ?', [id]);
    return { success: true, message: 'Vendor updated successfully', data: rows[0] };
  });

  app.delete('/vendors/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await pool.query<any>(
      'UPDATE vendors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Vendor not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM vendors WHERE id = ?', [id]);
    return { success: true, message: 'Vendor deactivated successfully', data: rows[0] };
  });

  // ===== Student directory =====
  const studentRepo = new StudentRepository();

  // Search students by name or email
  app.get('/students', { preHandler: adminRole }, async (request) => {
    const { q, orgId } = request.query as { q?: string; orgId?: string };

    if (orgId) {
      const students = await studentRepo.findByOrg(parseInt(orgId));
      return { success: true, data: students };
    }

    if (q && q.trim().length >= 2) {
      const students = await studentRepo.search(q.trim());
      return { success: true, data: students };
    }

    // No filter — return recent students (last 100)
    const [rows] = await pool.query<any[]>(
      `SELECT s.*, COUNT(DISTINCT cs.course_request_id) as course_count,
              MAX(cr.completed_at) as last_course_date,
              o.name as organization_name
       FROM students s
       LEFT JOIN course_students cs ON cs.student_id = s.id
       LEFT JOIN course_requests cr ON cs.course_request_id = cr.id
       LEFT JOIN organizations o ON s.organization_id = o.id
       GROUP BY s.id
       ORDER BY s.created_at DESC LIMIT 100`
    );
    return { success: true, data: rows };
  });

  // Get single student with full course history
  app.get('/students/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const student = await studentRepo.findById(parseInt(id));
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const history = await studentRepo.getCourseHistory(parseInt(id));
    return { success: true, data: { ...student, courses: history } };
  });

  // Update student details
  app.put('/students/:id', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = z.object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
      phone: z.string().optional(),
      organization_id: z.number().int().positive().nullable().optional(),
      notes: z.string().optional(),
    }).parse(request.body);

    const student = await studentRepo.findById(parseInt(id));
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    const fields = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return reply.status(400).send({ error: 'No fields to update' });

    const setClauses = fields.map(([k]) => `${k} = ?`).join(', ');
    const values = fields.map(([, v]) => v);

    await pool.query(
      `UPDATE students SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    const updated = await studentRepo.findById(parseInt(id));
    return { success: true, data: updated };
  });

  // Update marketing consent
  app.put('/students/:id/consent', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { marketing_consent } = z.object({
      marketing_consent: z.boolean(),
    }).parse(request.body);

    const student = await studentRepo.findById(parseInt(id));
    if (!student) return reply.status(404).send({ error: 'Student not found' });

    await studentRepo.updateMarketingConsent(parseInt(id), marketing_consent);
    return { success: true, message: `Marketing consent ${marketing_consent ? 'granted' : 'revoked'}` };
  });
}
