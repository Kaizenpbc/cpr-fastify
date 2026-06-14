import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { HRService, HRError } from '../services/HRService.js';
import { ProfileChangeRepository } from '../repositories/ProfileChangeRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { requireAuth } from '../plugins/auth.js';

const submitChangeSchema = z.object({
  field_name: z.string().min(1),
  new_value: z.string().min(1),
  change_type: z.enum(['instructor', 'organization']),
  target_user_id: z.number().int().positive().optional(),
});

function handleError(err: unknown, reply: any) {
  if (err instanceof HRError) return reply.status(err.statusCode).send({ error: err.message });
  throw err;
}

export async function profileChangeRoutes(app: FastifyInstance) {
  const service = new HRService(new ProfileChangeRepository(), new UserRepository());

  // Submit a profile change request (any authenticated user)
  app.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const data = submitChangeSchema.parse(request.body);
    try {
      const change = await service.submitProfileChange(request.userId, request.userRole, {
        fieldName: data.field_name,
        newValue: data.new_value,
        changeType: data.change_type,
        targetUserId: data.target_user_id,
      });
      return { success: true, message: 'Profile change request submitted successfully', data: change };
    } catch (err) { return handleError(err, reply); }
  });

  // Get own profile change requests
  app.get('/', { preHandler: [requireAuth] }, async (request) => {
    return { success: true, data: await service.getMyProfileChanges(request.userId) };
  });
}
