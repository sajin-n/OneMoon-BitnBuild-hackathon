import { FastifyInstance } from 'fastify';
import { getHealthHandler } from '../controllers/health.controller.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', getHealthHandler);
}
