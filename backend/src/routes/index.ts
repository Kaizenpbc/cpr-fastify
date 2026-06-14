import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { healthRoutes } from './health.js';
import { courseRoutes } from './courses.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(courseRoutes, { prefix: '/courses' });

  // Add new domain routes here as they're ported:
  // await app.register(billingRoutes, { prefix: '/billing' });
  // await app.register(userRoutes, { prefix: '/users' });
  // await app.register(instructorRoutes, { prefix: '/instructors' });
  // await app.register(vendorRoutes, { prefix: '/vendors' });
  // await app.register(adminRoutes, { prefix: '/admin' });
}
