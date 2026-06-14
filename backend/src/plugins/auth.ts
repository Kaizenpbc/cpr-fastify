import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: number;
    userRole: string;
    userOrgId: number | null;
  }
}

const authService = new AuthService(new UserRepository());

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('userId', 0);
  app.decorateRequest('userRole', '');
  app.decorateRequest('userOrgId', null);
}

export default fp(authPlugin);

// Use as a preHandler on protected routes:
// app.get('/protected', { preHandler: [requireAuth] }, handler)
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing authorization token' });
  }

  const token = header.slice(7);
  try {
    const payload = authService.verifyAccessToken(token);
    request.userId = payload.userId;
    request.userRole = payload.role;
    request.userOrgId = payload.orgId ?? null;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) return;

    if (!roles.includes(request.userRole)) {
      return reply.status(403).send({ error: 'Insufficient permissions' });
    }
  };
}
