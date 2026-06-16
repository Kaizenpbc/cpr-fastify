import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';

export async function healthRoutes(app: FastifyInstance) {
  // Temporary diagnostic — trace full auth flow
  app.get('/auth-debug', async (request) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const results: any = { tokenLength: token?.length };

    if (!token) return { ...results, step: 'no_token' };

    // Step 1: raw jwt.verify
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      results.step1_jwtVerify = { success: true, decoded };
    } catch (err: any) {
      return { ...results, step1_jwtVerify: { error: err.message } };
    }

    // Step 2: AuthService.verifyAccessToken
    const authService = new AuthService(new UserRepository());
    try {
      const payload = authService.verifyAccessToken(token);
      results.step2_authServiceVerify = { success: true, payload };
    } catch (err: any) {
      return { ...results, step2_authServiceVerify: { error: err.message } };
    }

    // Step 3: isTokenBlacklisted
    try {
      const payload = results.step1_jwtVerify.decoded;
      const blacklisted = await authService.isTokenBlacklisted(payload.userId, payload.iat);
      results.step3_blacklist = { success: true, blacklisted };
    } catch (err: any) {
      results.step3_blacklist = { error: err.message, stack: err.stack?.split('\n').slice(0, 3) };
    }

    return results;
  });

  app.get('/', async () => {
    let dbStatus = 'DOWN';
    try {
      const conn = await getPool().getConnection();
      conn.release();
      dbStatus = 'UP';
    } catch {
      dbStatus = 'DOWN';
    }

    return {
      status: dbStatus === 'UP' ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus, critical: true },
      },
    };
  });
}
