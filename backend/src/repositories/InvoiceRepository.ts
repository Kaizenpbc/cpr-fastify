import { BaseRepository } from './BaseRepository.js';
import { getPool } from '../config/database.js';
import { RowDataPacket } from 'mysql2/promise';

export interface Invoice {
  id: number;
  invoice_number: string;
  organization_id: number;
  course_request_id: number;
  invoice_date: Date;
  due_date: Date;
  amount: number;
  base_cost: number;
  tax_amount: number;
  students_billed: number;
  rate_per_student: number;
  status: string;
  approval_status: string;
  posted_to_org: boolean;
  posted_to_org_at: Date | null;
  email_sent_at: Date | null;
  rejection_reason: string | null;
  rejected_at: Date | null;
  rejected_by: number | null;
  approved_by: number | null;
  approved_at: Date | null;
  course_type_name: string | null;
  location: string | null;
  date_completed: Date | null;
  notes: string | null;
  paid_date: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface InvoiceWithDetails extends Invoice {
  organization_name: string;
  contact_email: string | null;
  amount_paid: number;
  balance_due: number;
  payment_status: string;
  aging_bucket: string;
}

export interface DashboardData {
  totalBilled: number;
  totalPaid: number;
  outstandingInvoices: { count: number; amount: number };
  paymentsThisMonth: { count: number; amount: number };
  completedCoursesThisMonth: number;
}

export class InvoiceRepository extends BaseRepository<Invoice> {
  constructor() {
    super('invoices');
  }

  async getDashboard(): Promise<DashboardData> {
    const pool = getPool();

    const [[billed], [paid], [outstanding], [monthly], [courses]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(base_cost + tax_amount), 0) as total
         FROM invoice_with_breakdown WHERE posted_to_org = TRUE`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM payments WHERE status = 'verified' AND deleted_at IS NULL`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count,
                COALESCE(SUM(i.base_cost + i.tax_amount - COALESCE(p.total_paid, 0)), 0) as total
         FROM invoice_with_breakdown i
         LEFT JOIN (SELECT invoice_id, SUM(amount) as total_paid FROM payments
                    WHERE status = 'verified' AND deleted_at IS NULL GROUP BY invoice_id) p
           ON p.invoice_id = i.id
         WHERE i.posted_to_org = TRUE
         AND (i.base_cost + i.tax_amount - COALESCE(p.total_paid, 0)) > 0`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
         FROM payments WHERE status = 'verified' AND deleted_at IS NULL
         AND MONTH(payment_date) = MONTH(CURRENT_DATE)
         AND YEAR(payment_date) = YEAR(CURRENT_DATE)`
      ),
      pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM course_requests
         WHERE status = 'completed' AND deleted_at IS NULL
         AND MONTH(completed_at) = MONTH(CURRENT_DATE)
         AND YEAR(completed_at) = YEAR(CURRENT_DATE)`
      ),
    ]);

    return {
      totalBilled: Number(billed[0]?.total ?? 0),
      totalPaid: Number(paid[0]?.total ?? 0),
      outstandingInvoices: { count: Number(outstanding[0]?.count ?? 0), amount: Number(outstanding[0]?.total ?? 0) },
      paymentsThisMonth: { count: Number(monthly[0]?.count ?? 0), amount: Number(monthly[0]?.total ?? 0) },
      completedCoursesThisMonth: Number(courses[0]?.count ?? 0),
    };
  }

  async getBillingQueue(): Promise<any[]> {
    return this.query(
      `SELECT
         cr.id as course_id, cr.organization_id,
         o.name as organization_name, o.contact_email,
         ct.name as course_type_name, cr.location,
         DATE(cr.completed_at) as date_completed, cr.registered_students,
         (SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id AND cs.attended = true) as students_attended,
         cp.price_per_student as rate_per_student,
         ((SELECT COUNT(*) FROM course_students cs WHERE cs.course_request_id = cr.id AND cs.attended = true)
           * cp.price_per_student * 1.13) as total_amount,
         COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))), ''), u.username) as instructor_name,
         u.email as instructor_email,
         cr.ready_for_billing_at
       FROM course_requests cr
       JOIN organizations o ON cr.organization_id = o.id
       JOIN class_types ct ON cr.course_type_id = ct.id
       JOIN course_pricing cp ON cr.organization_id = cp.organization_id
         AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
       LEFT JOIN users u ON cr.instructor_id = u.id
       WHERE cr.ready_for_billing = true AND cr.ready_for_billing_at IS NOT NULL
         AND (cr.invoiced IS NULL OR cr.invoiced = FALSE)
       ORDER BY cr.ready_for_billing_at DESC`
    );
  }

  async findAllWithDetails(): Promise<InvoiceWithDetails[]> {
    return this.query<InvoiceWithDetails>(
      `SELECT
         i.id, i.invoice_number, i.organization_id, i.course_request_id,
         COALESCE(i.invoice_date, i.created_at) as invoice_date,
         i.due_date, i.amount, i.base_cost, i.tax_amount,
         i.students_billed, i.rate_per_student,
         i.status, i.approval_status, i.posted_to_org, i.posted_to_org_at,
         i.paid_date, i.created_at,
         o.name as organization_name, o.contact_email,
         cr.location, ct.name as course_type_name, cr.completed_at as date_completed,
         COALESCE(p.total_paid, 0) as amount_paid,
         GREATEST(0, (i.base_cost + i.tax_amount) - COALESCE(p.total_paid, 0)) as balance_due,
         CASE
           WHEN COALESCE(p.total_paid, 0) >= (i.base_cost + i.tax_amount) THEN 'paid'
           WHEN CURRENT_DATE > i.due_date THEN 'overdue'
           ELSE 'pending'
         END as payment_status,
         CASE
           WHEN CURRENT_DATE <= i.due_date THEN 'current'
           WHEN CURRENT_DATE <= i.due_date + INTERVAL 30 DAY THEN '1-30 days'
           WHEN CURRENT_DATE <= i.due_date + INTERVAL 60 DAY THEN '31-60 days'
           WHEN CURRENT_DATE <= i.due_date + INTERVAL 90 DAY THEN '61-90 days'
           ELSE '90+ days'
         END as aging_bucket
       FROM invoice_with_breakdown i
       JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN course_requests cr ON i.course_request_id = cr.id
       LEFT JOIN class_types ct ON cr.course_type_id = ct.id
       LEFT JOIN (SELECT invoice_id, SUM(amount) as total_paid FROM payments
                  WHERE status = 'verified' GROUP BY invoice_id) p ON p.invoice_id = i.id
       ORDER BY i.created_at DESC`
    );
  }

  async findByIdWithDetails(id: number): Promise<InvoiceWithDetails | null> {
    const rows = await this.query<InvoiceWithDetails>(
      `SELECT
         i.*, o.name as organization_name, o.contact_email, o.address, o.contact_phone,
         cr.location, cr.scheduled_date as course_date, cr.completed_at as date_completed,
         cr.course_type_id, ct.name as course_type_name,
         COALESCE(cp.price_per_student, i.rate_per_student) as rate_per_student,
         COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,''))), ''), u.username) as instructor_name,
         COALESCE(p.total_paid, 0) as amount_paid,
         GREATEST(0, i.amount - COALESCE(p.total_paid, 0)) as balance_due
       FROM invoices i
       JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN course_requests cr ON i.course_request_id = cr.id
       LEFT JOIN users u ON cr.instructor_id = u.id
       LEFT JOIN class_types ct ON cr.course_type_id = ct.id
       LEFT JOIN course_pricing cp ON cr.organization_id = cp.organization_id
         AND cr.course_type_id = cp.course_type_id AND cp.is_active = true
       LEFT JOIN (SELECT invoice_id, SUM(amount) as total_paid FROM payments
                  WHERE status = 'verified' GROUP BY invoice_id) p ON p.invoice_id = i.id
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findPendingApproval(): Promise<InvoiceWithDetails[]> {
    return this.query<InvoiceWithDetails>(
      `SELECT i.*, o.name as organization_name,
              COALESCE(p.total_paid, 0) as amount_paid,
              GREATEST(0, (i.base_cost + i.tax_amount) - COALESCE(p.total_paid, 0)) as balance_due
       FROM invoices i
       LEFT JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN (SELECT invoice_id, SUM(amount) as total_paid FROM payments
                  WHERE status = 'completed' GROUP BY invoice_id) p ON p.invoice_id = i.id
       WHERE i.approval_status = 'pending'
       ORDER BY i.created_at ASC`
    );
  }

  async findRejected(): Promise<any[]> {
    return this.query(
      `SELECT i.*, o.name as organization_name, ct.name as course_type_name,
              u.username as rejected_by_name
       FROM invoices i
       LEFT JOIN organizations o ON i.organization_id = o.id
       LEFT JOIN course_requests cr ON i.course_request_id = cr.id
       LEFT JOIN class_types ct ON cr.course_type_id = ct.id
       LEFT JOIN users u ON i.rejected_by = u.id
       WHERE i.approval_status = 'rejected'
       ORDER BY i.rejected_at DESC`
    );
  }

  async getPayments(invoiceId: number): Promise<any[]> {
    return this.query(
      `SELECT * FROM payments WHERE invoice_id = ? AND deleted_at IS NULL ORDER BY payment_date DESC`,
      [invoiceId]
    );
  }
}
