import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes.js';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(healthRoutes);
}
