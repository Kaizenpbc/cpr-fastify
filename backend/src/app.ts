import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './plugins/errorHandler.js';

export async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own pino logger
  });

  // Plugins
  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: env.NODE_ENV === 'production' });
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(registerRoutes, { prefix: '/api/v1' });

  // Health check (outside /api/v1)
  app.get('/health', async () => ({ status: 'UP', timestamp: new Date().toISOString() }));

  return app;
}
