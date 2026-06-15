import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, closeDatabaseConnections } from './config/database.js';

// Initialize Sentry (optional — gracefully skipped if package not installed)
if (env.SENTRY_DSN) {
  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
    logger.info('Sentry initialized');
  } catch {
    logger.warn('Sentry DSN configured but @sentry/node not installed — skipping');
  }
}

async function start() {
  await connectDatabase();

  const app = await buildApp();
  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Server listening on ${address}`);

  // Graceful shutdown with timeout
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);

    // Force exit after 10 seconds if graceful shutdown hangs
    const forceTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    try {
      await app.close();
      await closeDatabaseConnections();
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGINT', () => { shutdown('SIGINT'); });
  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
}

start().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
