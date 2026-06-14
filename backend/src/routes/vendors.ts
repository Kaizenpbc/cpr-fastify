import { FastifyInstance } from 'fastify';
import mysql from 'mysql2/promise';
import { z } from 'zod';
import { getPool } from '../config/database.js';
import { requireAuth, requireRole } from '../plugins/auth.js';

const updateProfileSchema = z.object({
  vendor_name: z.string().min(1),
  contact_first_name: z.string().optional(),
  contact_last_name: z.string().optional(),
  phone: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_province: z.string().optional(),
  address_postal_code: z.string().optional(),
  vendor_type: z.string().optional(),
});

const submitInvoiceSchema = z.object({
  invoice_number: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string(),
  due_date: z.string().optional(),
  manual_type: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  detected_vendor_id: z.number().int().positive().optional(),
  rate: z.number().optional().default(0),
  subtotal: z.number().optional(),
  hst: z.number().optional().default(0),
  total: z.number().optional(),
});

const resendSchema = z.object({
  notes: z.string().min(1, 'Notes are required when resending rejected invoice'),
});

async function getVendorIdForUser(pool: mysql.Pool, userId: number): Promise<{ vendorId: number; email: string }> {
  const [userRows] = await pool.query<any[]>('SELECT email FROM users WHERE id = ?', [userId]);
  if (userRows.length === 0) throw { statusCode: 404, message: 'User not found' };
  const email = userRows[0].email;
  const [vendorRows] = await pool.query<any[]>('SELECT id FROM vendors WHERE contact_email = ?', [email]);
  if (vendorRows.length === 0) throw { statusCode: 404, message: 'Vendor not found' };
  return { vendorId: vendorRows[0].id, email };
}

export async function vendorRoutes(app: FastifyInstance) {
  const pool = getPool();
  const vendorRole = [requireRole('vendor')];

  // ===== Vendor list (for dropdowns) =====
  app.get('/vendors', { preHandler: [requireAuth] }, async () => {
    const [rows] = await pool.query<any[]>(
      'SELECT id, name as vendor_name, vendor_type FROM vendors WHERE is_active = true ORDER BY name'
    );
    return { success: true, data: rows };
  });

  // ===== Profile =====
  app.get('/profile', { preHandler: vendorRole }, async (request, reply) => {
    try {
      const { vendorId, email } = await getVendorIdForUser(pool, request.userId);
      const [rows] = await pool.query<any[]>('SELECT * FROM vendors WHERE contact_email = ?', [email]);
      return { success: true, data: rows[0] };
    } catch (err: any) {
      return reply.status(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.put('/profile', { preHandler: vendorRole }, async (request, reply) => {
    try {
      const { email } = await getVendorIdForUser(pool, request.userId);
      const data = updateProfileSchema.parse(request.body);
      await pool.query(
        `UPDATE vendors SET vendor_name = ?, contact_first_name = ?, contact_last_name = ?,
         phone = ?, address_street = ?, address_city = ?, address_province = ?,
         address_postal_code = ?, vendor_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE contact_email = ?`,
        [data.vendor_name, data.contact_first_name ?? null, data.contact_last_name ?? null,
         data.phone ?? null, data.address_street ?? null, data.address_city ?? null,
         data.address_province ?? null, data.address_postal_code ?? null, data.vendor_type ?? null, email]
      );
      return { success: true, message: 'Profile updated successfully' };
    } catch (err: any) {
      return reply.status(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // ===== Dashboard =====
  app.get('/dashboard', { preHandler: vendorRole }, async (request, reply) => {
    try {
      const { vendorId } = await getVendorIdForUser(pool, request.userId);
      const [[pending], [total], [paid], [avg]] = await Promise.all([
        pool.query<any[]>(`SELECT COUNT(*) as count FROM vendor_invoices WHERE vendor_id = ? AND status = 'submitted'`, [vendorId]),
        pool.query<any[]>('SELECT COUNT(*) as count FROM vendor_invoices WHERE vendor_id = ?', [vendorId]),
        pool.query<any[]>(`SELECT COALESCE(SUM(amount), 0) as total FROM vendor_invoices WHERE vendor_id = ? AND status = 'paid'`, [vendorId]),
        pool.query<any[]>(`SELECT COALESCE(AVG(DATEDIFF(payment_date, created_at)), 0) as avg_days FROM vendor_invoices WHERE vendor_id = ? AND status = 'paid' AND payment_date IS NOT NULL`, [vendorId]),
      ]);
      return {
        success: true,
        data: {
          pendingInvoices: Number(pending[0]?.count ?? 0),
          totalInvoices: Number(total[0]?.count ?? 0),
          totalPaid: Number(paid[0]?.total ?? 0),
          averagePaymentTime: Math.round(Number(avg[0]?.avg_days ?? 0)),
        },
      };
    } catch (err: any) {
      return reply.status(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // ===== Vendor invoices =====
  app.get('/invoices', { preHandler: vendorRole }, async (request, reply) => {
    try {
      const { vendorId } = await getVendorIdForUser(pool, request.userId);
      const { status, search } = request.query as Record<string, string>;

      let where = 'WHERE vi.vendor_id = ?';
      const params: unknown[] = [vendorId];
      if (status) { where += ' AND vi.status = ?'; params.push(status); }
      if (search) { where += ' AND (vi.invoice_number LIKE ? OR vi.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

      const [rows] = await pool.query<any[]>(
        `SELECT vi.*, v.name as company, v.name as billing_company,
                COALESCE(vi.rate, 0) as rate, COALESCE(vi.amount, 0) as amount,
                COALESCE(vi.amount, 0) as subtotal, COALESCE(vi.hst, 0) as hst,
                COALESCE(vi.total, vi.amount) as total
         FROM vendor_invoices vi LEFT JOIN vendors v ON vi.vendor_id = v.id
         ${where} ORDER BY vi.created_at DESC`,
        params
      );
      return { success: true, data: rows };
    } catch (err: any) {
      return reply.status(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // ===== Submit invoice =====
  app.post('/invoices', { preHandler: vendorRole }, async (request, reply) => {
    try {
      const { vendorId } = await getVendorIdForUser(pool, request.userId);
      const data = submitInvoiceSchema.parse(request.body);

      let targetVendorId = vendorId;
      if (data.detected_vendor_id) {
        const [detected] = await pool.query<any[]>('SELECT id FROM vendors WHERE id = ? AND is_active = true', [data.detected_vendor_id]);
        if (detected.length > 0) targetVendorId = detected[0].id;
      }

      const subtotal = data.subtotal ?? data.amount;
      const total = data.total ?? data.amount;

      const [result] = await pool.query<any>(
        `INSERT INTO vendor_invoices (
           vendor_id, invoice_number, amount, description, invoice_date, due_date,
           manual_type, quantity, status, rate, subtotal, hst, total, submitted_by, submitted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_submission', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [targetVendorId, data.invoice_number, data.amount, data.description ?? null,
         data.date, data.due_date ?? null, data.manual_type ?? null, data.quantity ?? null,
         data.rate, subtotal, data.hst, total, request.userId]
      );

      return { success: true, message: 'Invoice submitted successfully', invoice_id: result.insertId };
    } catch (err: any) {
      return reply.status(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  // ===== Get specific invoice =====
  app.get('/invoices/:id', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [rows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as company, v.name as billing_company,
              COALESCE(vi.rate, 0) as rate, COALESCE(vi.amount, 0) as amount,
              COALESCE(vi.amount, 0) as subtotal, COALESCE(vi.hst, 0) as hst,
              COALESCE(vi.total, vi.amount) as total,
              u_approved.username as approved_by_name,
              COALESCE(payments.total_paid, 0) as total_paid,
              (COALESCE(vi.total, vi.amount) - COALESCE(payments.total_paid, 0)) as balance_due
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN users u_approved ON vi.approved_by = u_approved.id
       LEFT JOIN (SELECT vendor_invoice_id, SUM(amount) as total_paid FROM vendor_payments WHERE status = 'processed' GROUP BY vendor_invoice_id) payments
         ON payments.vendor_invoice_id = vi.id
       WHERE vi.id = ?`,
      [id]
    );
    if (rows.length === 0) return reply.status(404).send({ error: 'Invoice not found' });
    return { success: true, data: rows[0] };
  });

  // ===== Invoice details with payment history =====
  app.get('/invoices/:id/details', { preHandler: [requireAuth] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [invoiceRows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as company, COALESCE(vi.rate, 0) as rate,
              COALESCE(payments.total_paid, 0) as total_paid,
              (COALESCE(vi.total, vi.amount) - COALESCE(payments.total_paid, 0)) as balance_due
       FROM vendor_invoices vi LEFT JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN (SELECT vendor_invoice_id, SUM(amount) as total_paid FROM vendor_payments WHERE status = 'processed' GROUP BY vendor_invoice_id) payments
         ON payments.vendor_invoice_id = vi.id
       WHERE vi.id = ?`,
      [id]
    );
    if (invoiceRows.length === 0) return reply.status(404).send({ error: 'Invoice not found' });

    const [paymentRows] = await pool.query<any[]>(
      `SELECT vp.*, u_processed.username as processed_by_name
       FROM vendor_payments vp LEFT JOIN users u_processed ON vp.processed_by = u_processed.id
       WHERE vp.vendor_invoice_id = ? ORDER BY vp.payment_date DESC`,
      [id]
    );
    return { success: true, data: { ...invoiceRows[0], payments: paymentRows } };
  });

  // ===== Submit to admin =====
  app.post('/invoices/:id/submit-to-admin', { preHandler: vendorRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [result] = await pool.query<any>(
      `UPDATE vendor_invoices SET status = 'submitted_to_admin', updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending_submission'`,
      [id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Invoice not found or not ready to submit' });
    return { success: true, message: 'Invoice submitted to admin successfully' };
  });

  // ===== Resend rejected =====
  app.post('/invoices/:id/resend-to-admin', { preHandler: vendorRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { notes } = resendSchema.parse(request.body);
    const [result] = await pool.query<any>(
      `UPDATE vendor_invoices SET status = 'submitted_to_admin', admin_notes = ?,
       rejection_reason = NULL, rejected_at = NULL, rejected_by = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN ('rejected_by_admin', 'rejected_by_accountant')`,
      [notes, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Invoice not found or not in rejected state' });
    return { success: true, message: 'Invoice resent to admin successfully' };
  });
}
