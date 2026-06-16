import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';
import { env } from '../config/env.js';

export async function healthRoutes(app: FastifyInstance) {
  // Temporary diagnostic — verify JWT on server
  app.get('/auth-debug', async (request) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let verifyResult: any = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        verifyResult = { success: true, decoded };
      } catch (err: any) {
        verifyResult = { success: false, error: err.message, name: err.name };
      }
    }
    return {
      hasHeader: !!authHeader,
      tokenLength: token?.length,
      secretAvailable: !!env.JWT_ACCESS_SECRET,
      secretLength: env.JWT_ACCESS_SECRET?.length,
      verifyResult,
    };
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
