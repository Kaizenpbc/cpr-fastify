import { getPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { InvoiceRepository, Invoice, InvoiceWithDetails, DashboardData } from '../repositories/InvoiceRepository.js';
import { CoursePricingRepository, CoursePricing } from '../repositories/CoursePricingRepository.js';

const HST_RATE = parseFloat(process.env.HST_RATE ?? '0.13');
const INVOICE_DUE_DAYS = parseInt(process.env.INVOICE_DUE_DAYS ?? '30', 10);

export class BillingError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'BillingError';
  }
}

export class BillingService {
  constructor(
    private invoiceRepo: InvoiceRepository,
    private pricingRepo: CoursePricingRepository,
  ) {}

  // --- Dashboard ---

  async getDashboard(): Promise<DashboardData> {
    return this.invoiceRepo.getDashboard();
  }

  // --- Pricing ---

  async getAllPricing(): Promise<CoursePricing[]> {
    return this.pricingRepo.findAllActive();
  }

  async getOrgPricing(orgId: number): Promise<CoursePricing[]> {
    return this.pricingRepo.findByOrg(orgId);
  }

  async upsertPricing(orgId: number, courseTypeId: number, pricePerStudent: number): Promise<CoursePricing> {
    if (!orgId || !courseTypeId || !pricePerStudent || pricePerStudent <= 0) {
      throw new BillingError('All fields are required and price must be greater than 0');
    }
    return this.pricingRepo.upsert(orgId, courseTypeId, pricePerStudent);
  }

  async updatePricing(id: number, pricePerStudent: number): Promise<CoursePricing> {
    if (!pricePerStudent || pricePerStudent <= 0) {
      throw new BillingError('Valid price per student is required');
    }
    const updated = await this.pricingRepo.updatePrice(id, pricePerStudent);
    if (!updated) throw new BillingError('Course pricing record not found', 404);
    return updated;
  }

  async deletePricing(id: number): Promise<void> {
    const deleted = await this.pricingRepo.remove(id);
    if (!deleted) throw new BillingError('Course pricing not found', 404);
  }

  // --- Billing queue ---

  async getBillingQueue(): Promise<any[]> {
    return this.invoiceRepo.getBillingQueue();
  }

  // --- Invoice creation ---

  async createInvoice(courseId: number): Promise<Invoice> {
    if (!courseId) throw new BillingError('Course ID is required');

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Get course + pricing details
      const [courseRows] = await conn.query<any[]>(
        `SELECT cr.id, cr.organization_id, cr.completed_at, cr.location,
                o.name as organization_name, o.contact_email,
                ct.name as course_type_name,
                (SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id AND cs.attended = true) as students_attended,
                cp.price_per_student,
                COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))), ''), u.username) as instructor_name
         FROM course_requests cr
         JOIN organizations o ON cr.organization_id = o.id
         JOIN class_types ct ON cr.course_type_id = ct.id
         JOIN course_pricing cp ON cr.organization_id = cp.organization_id
           AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
         LEFT JOIN users u ON cr.instructor_id = u.id
         WHERE cr.id = ? AND cr.ready_for_billing = true`,
        [courseId]
      );

      if (courseRows.length === 0) {
        throw new BillingError('Course not found, not ready for billing, or pricing not configured', 404);
      }

      const course = courseRows[0];

      if (!course.contact_email) {
        throw new BillingError('Organization has no billing contact email. Please add one before creating an invoice.', 422);
      }

      const baseCost = course.students_attended * course.price_per_student;
      const taxAmount = baseCost * HST_RATE;
      const totalAmount = baseCost + taxAmount;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const [result] = await conn.query<any>(
        `INSERT INTO invoices (
           invoice_number, organization_id, course_request_id, invoice_date,
           amount, base_cost, tax_amount, students_billed, status, due_date,
           posted_to_org, course_type_name, location, date_completed,
           rate_per_student, approval_status
         ) VALUES (?, ?, ?, CURRENT_DATE, ?, ?, ?, ?, 'pending',
           CURRENT_DATE + INTERVAL ? DAY, FALSE, ?, ?, ?, ?, 'pending')`,
        [invoiceNumber, course.organization_id, courseId, totalAmount, baseCost, taxAmount,
         course.students_attended, INVOICE_DUE_DAYS, course.course_type_name,
         course.location, course.completed_at, course.price_per_student]
      );

      // Mark course as invoiced
      await conn.query(
        `UPDATE course_requests SET invoiced = TRUE, invoiced_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [courseId]
      );

      await conn.commit();

      const invoice = await this.invoiceRepo.findById(result.insertId);
      logger.info({ invoiceId: result.insertId, courseId, invoiceNumber }, 'Invoice created');
      return invoice!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Invoice queries ---

  async getAllInvoices(): Promise<InvoiceWithDetails[]> {
    return this.invoiceRepo.findAllWithDetails();
  }

  async getInvoiceById(id: number): Promise<InvoiceWithDetails> {
    const invoice = await this.invoiceRepo.findByIdWithDetails(id);
    if (!invoice) throw new BillingError('Invoice not found', 404);
    return invoice;
  }

  async getPendingApproval(): Promise<InvoiceWithDetails[]> {
    return this.invoiceRepo.findPendingApproval();
  }

  async getRejected(): Promise<any[]> {
    return this.invoiceRepo.findRejected();
  }

  // --- Approval workflow ---

  async approve(id: number, approvedBy: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new BillingError('Invoice not found', 404);
    if (invoice.approval_status !== 'pending') {
      throw new BillingError(`Invoice is already ${invoice.approval_status}`);
    }

    await this.invoiceRepo.execute(
      `UPDATE invoices SET approval_status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [approvedBy, id]
    );

    return (await this.invoiceRepo.findById(id))!;
  }

  async reject(id: number, reason: string, rejectedBy: number): Promise<Invoice> {
    if (!reason?.trim()) throw new BillingError('Rejection reason is required');

    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new BillingError('Invoice not found', 404);
    if (invoice.approval_status !== 'pending') {
      throw new BillingError(`Invoice is already ${invoice.approval_status}`);
    }

    await this.invoiceRepo.execute(
      `UPDATE invoices SET approval_status = 'rejected', rejection_reason = ?,
       rejected_at = CURRENT_TIMESTAMP, rejected_by = ? WHERE id = ?`,
      [reason, rejectedBy, id]
    );

    return (await this.invoiceRepo.findById(id))!;
  }

  async resubmit(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findById(id);
    if (!invoice) throw new BillingError('Invoice not found', 404);
    if (invoice.approval_status !== 'rejected') {
      throw new BillingError(`Only rejected invoices can be resubmitted`);
    }

    await this.invoiceRepo.execute(
      `UPDATE invoices SET approval_status = 'pending', rejection_reason = NULL,
       rejected_at = NULL, rejected_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    return (await this.invoiceRepo.findById(id))!;
  }

  // --- Post to org ---

  async postToOrg(id: number, postedBy: number): Promise<Invoice> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [invoiceRows] = await conn.query<any[]>(
        `SELECT i.*, o.name as organization_name, o.contact_email
         FROM invoices i JOIN organizations o ON i.organization_id = o.id
         WHERE i.id = ? AND i.posted_to_org = FALSE`,
        [id]
      );

      if (invoiceRows.length === 0) {
        throw new BillingError('Invoice not found or already posted', 404);
      }

      await conn.query(
        `UPDATE invoices SET posted_to_org = TRUE, posted_to_org_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      // Archive the course
      const invoice = invoiceRows[0];
      if (invoice.course_request_id) {
        await conn.query(
          `UPDATE course_requests SET archived = TRUE, archived_at = CURRENT_TIMESTAMP,
           archived_by = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status = 'completed'`,
          [postedBy, invoice.course_request_id]
        );
      }

      await conn.commit();

      logger.info({ invoiceId: id }, 'Invoice posted to org');
      return (await this.invoiceRepo.findById(id))!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Fix calculations ---

  async fixCalculations(id: number): Promise<{ oldAmount: number; newAmount: number }> {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<any[]>(
        `SELECT i.id, i.students_billed, i.amount, cp.price_per_student
         FROM invoices i
         LEFT JOIN course_requests cr ON i.course_request_id = cr.id
         LEFT JOIN course_pricing cp ON cr.organization_id = cp.organization_id
           AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
         WHERE i.id = ?`,
        [id]
      );

      if (rows.length === 0) throw new BillingError('Invoice not found', 404);
      if (!rows[0].price_per_student) throw new BillingError('Pricing not found for this invoice');

      const inv = rows[0];
      const baseCost = inv.students_billed * inv.price_per_student;
      const totalAmount = baseCost + baseCost * HST_RATE;

      await conn.query(
        `UPDATE invoices SET amount = ?, rate_per_student = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [totalAmount, inv.price_per_student, id]
      );

      await conn.commit();
      return { oldAmount: inv.amount, newAmount: totalAmount };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // --- Payments ---

  async getPayments(invoiceId: number): Promise<any[]> {
    return this.invoiceRepo.getPayments(invoiceId);
  }

  async recordPayment(invoiceId: number, amount: number, paymentMethod: string, reference?: string): Promise<any> {
    if (!amount || amount <= 0) throw new BillingError('Valid payment amount is required');

    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) throw new BillingError('Invoice not found', 404);

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query<any>(
        `INSERT INTO payments (invoice_id, amount, payment_method, reference_number,
         payment_date, status) VALUES (?, ?, ?, ?, CURRENT_DATE, 'verified')`,
        [invoiceId, amount, paymentMethod, reference ?? null]
      );

      // Check if fully paid
      const [paid] = await conn.query<any[]>(
        `SELECT SUM(amount) as total FROM payments WHERE invoice_id = ? AND status = 'verified' AND deleted_at IS NULL`,
        [invoiceId]
      );
      const totalPaid = Number(paid[0]?.total ?? 0);

      if (totalPaid >= invoice.amount) {
        await conn.query(
          `UPDATE invoices SET status = 'paid', paid_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [invoiceId]
        );
      }

      await conn.commit();
      logger.info({ invoiceId, amount, paymentId: result.insertId }, 'Payment recorded');
      return { id: result.insertId, amount, totalPaid };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
