import { FastifyInstance } from 'fastify';
import { getPool } from '../config/database.js';

export async function healthRoutes(app: FastifyInstance) {
  // Temporary diagnostic — check what auth header the server receives
  app.get('/auth-debug', async (request) => {
    const authHeader = request.headers.authorization;
    return {
      hasHeader: !!authHeader,
      headerStart: authHeader?.substring(0, 20),
      headerLength: authHeader?.length,
      startsWithBearer: authHeader?.startsWith('Bearer '),
      tokenLength: authHeader?.startsWith('Bearer ') ? authHeader.slice(7).length : null,
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
