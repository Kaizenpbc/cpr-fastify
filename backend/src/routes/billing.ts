import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BillingService, BillingError } from '../services/BillingService.js';
import { InvoiceRepository } from '../repositories/InvoiceRepository.js';
import { CoursePricingRepository } from '../repositories/CoursePricingRepository.js';
import { requireAuth, requireRole } from '../plugins/auth.js';

// --- Schemas ---

const createPricingSchema = z.object({
  organizationId: z.number().int().positive(),
  courseTypeId: z.number().int().positive(),
  pricePerStudent: z.number().positive(),
});

const updatePricingSchema = z.object({
  pricePerStudent: z.number().positive(),
});

const createInvoiceSchema = z.object({
  courseId: z.number().int().positive(),
});

const approvalSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  reference: z.string().optional(),
});

function handleError(err: unknown, reply: any) {
  if (err instanceof BillingError) return reply.status(err.statusCode).send({ error: err.message });
  throw err;
}

// --- Routes ---

export async function billingRoutes(app: FastifyInstance) {
  const service = new BillingService(new InvoiceRepository(), new CoursePricingRepository());
  const acctRole = [requireRole('accountant', 'admin', 'sysadmin')];

  // ===== Dashboard =====
  app.get('/dashboard', { preHandler: acctRole }, async () => {
    return { success: true, data: await service.getDashboard() };
  });

  // ===== Pricing =====
  app.get('/pricing', { preHandler: [requireAuth] }, async (request) => {
    const isAdmin = ['accountant', 'admin', 'sysadmin'].includes(request.userRole);
    const data = isAdmin
      ? await service.getAllPricing()
      : request.userOrgId ? await service.getOrgPricing(request.userOrgId) : [];
    return { success: true, data };
  });

  app.post('/pricing', { preHandler: acctRole }, async (request, reply) => {
    const { organizationId, courseTypeId, pricePerStudent } = createPricingSchema.parse(request.body);
    try {
      const pricing = await service.upsertPricing(organizationId, courseTypeId, pricePerStudent);
      return { success: true, message: 'Pricing saved', data: pricing };
    } catch (err) { return handleError(err, reply); }
  });

  app.put('/pricing/:id', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { pricePerStudent } = updatePricingSchema.parse(request.body);
    try {
      const pricing = await service.updatePricing(parseInt(id), pricePerStudent);
      return { success: true, data: pricing };
    } catch (err) { return handleError(err, reply); }
  });

  app.delete('/pricing/:id', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await service.deletePricing(parseInt(id));
      return { success: true, message: 'Pricing deleted' };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Billing queue =====
  app.get('/queue', { preHandler: acctRole }, async () => {
    return { success: true, data: await service.getBillingQueue() };
  });

  // ===== Invoices =====
  app.post('/invoices', { preHandler: acctRole }, async (request, reply) => {
    const { courseId } = createInvoiceSchema.parse(request.body);
    try {
      const invoice = await service.createInvoice(courseId);
      return { success: true, message: 'Invoice created — pending approval', data: invoice };
    } catch (err) { return handleError(err, reply); }
  });

  app.get('/invoices', { preHandler: acctRole }, async () => {
    return { success: true, data: await service.getAllInvoices() };
  });

  app.get('/invoices/pending-approval', { preHandler: acctRole }, async () => {
    return { success: true, data: await service.getPendingApproval() };
  });

  app.get('/invoices/rejected', { preHandler: acctRole }, async () => {
    return { success: true, data: await service.getRejected() };
  });

  app.get('/invoices/:id', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return { success: true, data: await service.getInvoiceById(parseInt(id)) };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Approval workflow =====
  app.put('/invoices/:id/approval', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approvalStatus, notes } = approvalSchema.parse(request.body);
    try {
      const invoice = approvalStatus === 'approved'
        ? await service.approve(parseInt(id), request.userId)
        : await service.reject(parseInt(id), notes ?? '', request.userId);
      return { success: true, message: `Invoice ${approvalStatus}`, data: invoice };
    } catch (err) { return handleError(err, reply); }
  });

  app.put('/invoices/:id/resubmit', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const invoice = await service.resubmit(parseInt(id));
      return { success: true, message: 'Invoice resubmitted for approval', data: invoice };
    } catch (err) { return handleError(err, reply); }
  });

  app.put('/invoices/:id/fix-calculations', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await service.fixCalculations(parseInt(id));
      return { success: true, message: 'Calculations fixed', data: result };
    } catch (err) { return handleError(err, reply); }
  });

  app.put('/invoices/:id/post-to-org', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const invoice = await service.postToOrg(parseInt(id), request.userId);
      return { success: true, message: 'Invoice posted to organization', data: invoice };
    } catch (err) { return handleError(err, reply); }
  });

  // ===== Payments =====
  app.get('/invoices/:id/payments', { preHandler: acctRole }, async (request) => {
    const { id } = request.params as { id: string };
    return { success: true, data: await service.getPayments(parseInt(id)) };
  });

  app.post('/invoices/:id/payments', { preHandler: acctRole }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount, paymentMethod, reference } = paymentSchema.parse(request.body);
    try {
      const payment = await service.recordPayment(parseInt(id), amount, paymentMethod, reference);
      return { success: true, message: 'Payment recorded', data: payment };
    } catch (err) { return handleError(err, reply); }
  });
}
