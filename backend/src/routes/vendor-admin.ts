import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPool } from '../config/database.js';
import { requireRole } from '../plugins/auth.js';

const approveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export async function vendorAdminRoutes(app: FastifyInstance) {
  const pool = getPool();
  const adminRole = [requireRole('admin', 'sysadmin', 'courseadmin')];
  const acctRole = [requireRole('accountant', 'admin')];

  // ===== Admin: All vendor invoices =====
  app.get('/admin/vendor-invoices', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as vendor_name, v.contact_email as vendor_email,
              u_approved.username as approved_by, u_rejected.username as rejected_by
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN users u_approved ON vi.approved_by = u_approved.id
       LEFT JOIN users u_rejected ON vi.rejected_by = u_rejected.id
       ORDER BY vi.created_at DESC`
    );
    return { success: true, data: rows };
  });

  // ===== Admin: Ready for processing =====
  app.get('/admin/vendor-invoices/ready-for-processing', { preHandler: adminRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as vendor_name, v.contact_email as vendor_email
       FROM vendor_invoices vi LEFT JOIN vendors v ON vi.vendor_id = v.id
       WHERE vi.status = 'submitted_to_admin' ORDER BY vi.created_at ASC`
    );
    return { success: true, data: rows };
  });

  // ===== Admin: Update notes =====
  app.put('/admin/vendor-invoices/:id/notes', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { notes } = z.object({ notes: z.string() }).parse(request.body);
    const [result] = await pool.query<any>(
      'UPDATE vendor_invoices SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [notes, id]
    );
    if (result.affectedRows === 0) return reply.status(404).send({ error: 'Vendor invoice not found' });
    const [rows] = await pool.query<any[]>('SELECT * FROM vendor_invoices WHERE id = ?', [id]);
    return { success: true, message: 'Notes updated successfully', data: rows[0] };
  });

  // ===== Admin: Approve/reject =====
  app.post('/admin/vendor-invoices/:id/approve', { preHandler: adminRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { action, notes } = approveSchema.parse(request.body);
    if (action === 'reject' && !notes?.trim()) return reply.status(400).send({ error: 'Notes are required when rejecting' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [invoiceRows] = await conn.query<any[]>(
        `SELECT vi.* FROM vendor_invoices vi WHERE vi.id = ? AND vi.status = 'submitted_to_admin'`, [id]
      );
      if (invoiceRows.length === 0) { await conn.rollback(); return reply.status(404).send({ error: 'Invoice not found or not ready' }); }

      if (action === 'approve') {
        await conn.query(
          `UPDATE vendor_invoices SET status = 'submitted_to_accounting', approved_by = ?,
           admin_notes = ?, sent_to_accounting_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [request.userId, notes ?? '', id]
        );
      } else {
        await conn.query(
          `UPDATE vendor_invoices SET status = 'rejected_by_admin', admin_notes = ?, rejection_reason = ?,
           rejected_at = CURRENT_TIMESTAMP, rejected_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [notes, notes, request.userId, id]
        );
      }
      await conn.commit();
      return { success: true, message: `Invoice ${action}d successfully.`, data: { invoiceId: id, status: action === 'approve' ? 'submitted_to_accounting' : 'rejected_by_admin' } };
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  });

  // ===== Accounting: All vendor invoices =====
  app.get('/accounting/vendor-invoices', { preHandler: acctRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as vendor_name, v.contact_email as vendor_email,
              u_approved.username as approved_by_name,
              COALESCE(payments.total_paid, 0) as total_paid,
              (vi.total - COALESCE(payments.total_paid, 0)) as balance_due
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN users u_approved ON vi.approved_by = u_approved.id
       LEFT JOIN (SELECT vendor_invoice_id, SUM(amount) as total_paid FROM vendor_payments WHERE status = 'processed' GROUP BY vendor_invoice_id) payments
         ON payments.vendor_invoice_id = vi.id
       ORDER BY vi.created_at DESC`
    );
    return { success: true, data: rows };
  });

  // ===== Accounting: Invoice detail =====
  app.get('/accounting/vendor-invoices/:id', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [invoiceRows] = await pool.query<any[]>(
      `SELECT vi.*, v.name as vendor_name, v.contact_email as vendor_email, v.address as vendor_address,
              u_approved.username as approved_by_name,
              COALESCE(payments.total_paid, 0) as total_paid,
              (vi.total - COALESCE(payments.total_paid, 0)) as balance_due
       FROM vendor_invoices vi LEFT JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN users u_approved ON vi.approved_by = u_approved.id
       LEFT JOIN (SELECT vendor_invoice_id, SUM(amount) as total_paid FROM vendor_payments WHERE status = 'processed' GROUP BY vendor_invoice_id) payments
         ON payments.vendor_invoice_id = vi.id
       WHERE vi.id = ?`,
      [id]
    );
    if (invoiceRows.length === 0) return reply.status(404).send({ error: 'Vendor invoice not found' });

    const [paymentRows] = await pool.query<any[]>(
      `SELECT vp.*, u_processed.username as processed_by_name FROM vendor_payments vp
       LEFT JOIN users u_processed ON vp.processed_by = u_processed.id
       WHERE vp.vendor_invoice_id = ? ORDER BY vp.payment_date DESC`,
      [id]
    );
    return { success: true, data: { invoice: invoiceRows[0], payments: paymentRows } };
  });

  // ===== Accounting: Process payment =====
  app.post('/accounting/vendor-invoices/:id/payments', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = paymentSchema.parse(request.body);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [invoiceRows] = await conn.query<any[]>(
        `SELECT vi.*, COALESCE(payments.total_paid, 0) as total_paid,
                (vi.total - COALESCE(payments.total_paid, 0)) as balance_due
         FROM vendor_invoices vi
         LEFT JOIN (SELECT vendor_invoice_id, SUM(amount) as total_paid FROM vendor_payments WHERE status = 'processed' GROUP BY vendor_invoice_id) payments
           ON payments.vendor_invoice_id = vi.id
         WHERE vi.id = ? AND vi.status = 'submitted_to_accounting'`,
        [id]
      );
      if (invoiceRows.length === 0) { await conn.rollback(); return reply.status(404).send({ error: 'Invoice not found or not ready for payment' }); }

      const balance = Number(invoiceRows[0].balance_due);
      if (data.amount > balance) { await conn.rollback(); return reply.status(400).send({ error: `Payment ($${data.amount.toFixed(2)}) exceeds balance ($${balance.toFixed(2)})` }); }

      const [payResult] = await conn.query<any>(
        `INSERT INTO vendor_payments (vendor_invoice_id, amount, payment_date, payment_method, reference_number, notes, status, processed_by, processed_at)
         VALUES (?, ?, ?, ?, ?, ?, 'processed', ?, CURRENT_TIMESTAMP)`,
        [id, data.amount, data.payment_date ?? new Date().toISOString().split('T')[0], data.payment_method ?? null,
         data.reference_number ?? null, data.notes ?? null, request.userId]
      );

      const invoiceTotal = Number(invoiceRows[0].total) || Number(invoiceRows[0].amount) || 0;
      const totalPaidAfter = Number(invoiceRows[0].total_paid) + data.amount;
      const newStatus = totalPaidAfter >= invoiceTotal ? 'paid' : 'submitted_to_accounting';

      await conn.query(
        `UPDATE vendor_invoices SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStatus, newStatus, id]
      );
      await conn.commit();

      return { success: true, message: `Payment of $${data.amount.toFixed(2)} processed successfully.`, data: { paymentId: payResult.insertId, invoiceStatus: newStatus } };
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  });

  // ===== Accounting: Reject =====
  app.post('/accounting/vendor-invoices/:id/reject', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { notes } = z.object({ notes: z.string().min(1) }).parse(request.body);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [invoiceRows] = await conn.query<any[]>(
        `SELECT * FROM vendor_invoices WHERE id = ? AND status = 'submitted_to_accounting'`, [id]
      );
      if (invoiceRows.length === 0) { await conn.rollback(); return reply.status(404).send({ error: 'Invoice not found or not ready' }); }

      await conn.query(
        `UPDATE vendor_invoices SET status = 'rejected_by_accountant', admin_notes = ?, rejection_reason = ?,
         rejected_at = CURRENT_TIMESTAMP, rejected_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [notes, notes, request.userId, id]
      );
      await conn.commit();
      return { success: true, message: 'Invoice rejected successfully.', data: { invoiceId: id, status: 'rejected_by_accountant' } };
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  });

  // ===== Accounting: Payment history =====
  app.get('/accounting/vendor-payments', { preHandler: acctRole }, async () => {
    const [rows] = await pool.query<any[]>(
      `SELECT vp.*, vi.invoice_number, vi.amount as invoice_amount, v.name as vendor_name,
              u_processed.username as processed_by_name
       FROM vendor_payments vp
       JOIN vendor_invoices vi ON vp.vendor_invoice_id = vi.id
       JOIN vendors v ON vi.vendor_id = v.id
       LEFT JOIN users u_processed ON vp.processed_by = u_processed.id
       ORDER BY vp.payment_date DESC`
    );
    return { success: true, data: rows };
  });
}
