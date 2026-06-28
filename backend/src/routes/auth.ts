import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService, AuthError } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { requireAuth } from '../plugins/auth.js';
import { getPool } from '../config/database.js';
import { logAudit } from '../utils/auditLog.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

/** Enrich a safe user object with organization_name and location_name from DB */
async function enrichUser(safeUser: Record<string, unknown>) {
  try {
    const pool = getPool();
    if (safeUser.organization_id) {
      const [orgRows] = await pool.query<any[]>(
        'SELECT name FROM organizations WHERE id = ?', [safeUser.organization_id]
      );
      if (orgRows.length) safeUser.organization_name = orgRows[0].name;
    }
    if (safeUser.location_id) {
      const [locRows] = await pool.query<any[]>(
        'SELECT location_name FROM organization_locations WHERE id = ?', [safeUser.location_id]
      );
      if (locRows.length) safeUser.location_name = locRows[0].location_name;
    }
  } catch {
    // Non-critical enrichment — don't break login if org/location lookup fails
  }
  return safeUser;
}

export async function authRoutes(app: FastifyInstance) {
  const userRepo = new UserRepository();
  const authService = new AuthService(userRepo);

  // Stricter rate limit for auth endpoints (10 req/min vs global 100)
  const authRateLimit = {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  };

  // POST /api/v1/auth/login
  app.post('/login', authRateLimit, async (request, reply) => {
    const body = loginSchema.parse(request.body);

    try {
      const result = await authService.login(body.username, body.password);

      reply.setCookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      const enrichedUser = await enrichUser(result.user as Record<string, unknown>);
      logAudit({ userId: result.user.id, username: body.username, action: 'login', ipAddress: request.ip });
      return { success: true, data: { user: enrichedUser, accessToken: result.tokens.accessToken } };
    } catch (err) {
      if (err instanceof AuthError) {
        logAudit({ username: body.username, action: 'login_failed', details: { reason: err.message }, ipAddress: request.ip });
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });

  // POST /api/v1/auth/refresh
  app.post('/refresh', authRateLimit, async (request, reply) => {
    const token = request.cookies.refreshToken;
    if (!token) return reply.status(401).send({ error: 'No refresh token' });

    try {
      const tokens = await authService.refreshToken(token);

      reply.setCookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      return { success: true, data: { accessToken: tokens.accessToken } };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(401).send({ error: err.message });
      }
      throw err;
    }
  });

  // GET /api/v1/auth/me — verify current session
  app.get('/me', { preHandler: [requireAuth] }, async (request) => {
    const user = await userRepo.findById(request.userId!);
    if (!user) return { success: false, error: { message: 'User not found' } };
    const { password_hash, ...safeUser } = user;
    const enrichedUser = await enrichUser(safeUser as Record<string, unknown>);
    return { success: true, data: { user: enrichedUser } };
  });

  // POST /api/v1/auth/logout
  app.post('/logout', async (request, reply) => {
    logAudit({ userId: request.userId ?? undefined, action: 'logout', ipAddress: request.ip });
    reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    return { success: true, data: { message: 'Logged out' } };
  });

  // POST /api/v1/auth/change-password (authenticated)
  app.post('/change-password', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId!;
    if (!userId) return reply.status(401).send({ error: 'Not authenticated' });

    const body = changePasswordSchema.parse(request.body);

    try {
      await authService.changePassword(userId, body.currentPassword, body.newPassword);
      logAudit({ userId, action: 'change_password', entityType: 'user', entityId: userId, ipAddress: request.ip });
      return { message: 'Password changed' };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
