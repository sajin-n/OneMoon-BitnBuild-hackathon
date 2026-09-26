import { FastifyReply, FastifyRequest } from 'fastify';
import { healthService } from '../services/health.service.js';

export async function getHealthHandler(_request: FastifyRequest, reply: FastifyReply) {
  const health = healthService.getHealth();
  return reply.code(200).send(health);
}
