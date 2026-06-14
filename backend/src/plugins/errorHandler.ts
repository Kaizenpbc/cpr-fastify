import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  // Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Fastify rate limit
  if (error.statusCode === 429) {
    return reply.status(429).send({ error: 'Too many requests, please try again later' });
  }

  // Known HTTP errors
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  // Unexpected errors — log full detail, return generic message
  logger.error({ err: error, url: request.url, method: request.method }, 'Unhandled error');

  return reply.status(500).send({
    error: error.message,
    stack: env.NODE_ENV !== 'production' ? error.stack : undefined,
  });
}
