import { FastifyInstance } from 'fastify';
import { logger } from '../config/logger.js';

const SLOW_REQUEST_MS = 2000;

interface MetricsBucket {
  requests: number;
  errors: number;
  totalDuration: number;
  maxDuration: number;
  slowRequests: number;
  startedAt: number;
}

let metrics: MetricsBucket = {
  requests: 0,
  errors: 0,
  totalDuration: 0,
  maxDuration: 0,
  slowRequests: 0,
  startedAt: Date.now(),
};

export function resetMetrics() {
  metrics = {
    requests: 0,
    errors: 0,
    totalDuration: 0,
    maxDuration: 0,
    slowRequests: 0,
    startedAt: Date.now(),
  };
}

export function registerMetrics(app: FastifyInstance) {
  // Collect metrics on every response
  app.addHook('onResponse', (request, reply, done) => {
    const duration = reply.elapsedTime;
    metrics.requests++;
    metrics.totalDuration += duration;
    if (duration > metrics.maxDuration) metrics.maxDuration = duration;
    if (reply.statusCode >= 500) metrics.errors++;
    if (duration > SLOW_REQUEST_MS) {
      metrics.slowRequests++;
      logger.warn({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: Math.round(duration),
      }, 'Slow request detected');
    }
    done();
  });

  // Metrics endpoint
  app.get('/metrics', async () => {
    const uptimeMs = Date.now() - metrics.startedAt;
    return {
      uptime_seconds: Math.round(uptimeMs / 1000),
      requests: {
        total: metrics.requests,
        errors: metrics.errors,
        error_rate: metrics.requests > 0
          ? parseFloat((metrics.errors / metrics.requests * 100).toFixed(2))
          : 0,
      },
      latency: {
        avg_ms: metrics.requests > 0
          ? Math.round(metrics.totalDuration / metrics.requests)
          : 0,
        max_ms: Math.round(metrics.maxDuration),
        slow_requests: metrics.slowRequests,
        slow_threshold_ms: SLOW_REQUEST_MS,
      },
      timestamp: new Date().toISOString(),
    };
  });
}
