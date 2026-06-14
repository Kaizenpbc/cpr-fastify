import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, closeDatabaseConnections } from './config/database.js';

async function start() {
  await connectDatabase();

  const app = await buildApp();
  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Server listening on ${address}`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    await app.close();
    await closeDatabaseConnections();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});
