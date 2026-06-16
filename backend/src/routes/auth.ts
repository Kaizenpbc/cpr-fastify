import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService, AuthError } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { requireAuth } from '../plugins/auth.js';

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

      return { success: true, data: { user: result.user, accessToken: result.tokens.accessToken } };
    } catch (err) {
      if (err instanceof AuthError) {
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
    return { success: true, data: { user: safeUser } };
  });

  // POST /api/v1/auth/logout
  app.post('/logout', async (_request, reply) => {
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
      return { message: 'Password changed' };
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(400).send({ error: err.message });
      }
      throw err;
    }
  });
}
