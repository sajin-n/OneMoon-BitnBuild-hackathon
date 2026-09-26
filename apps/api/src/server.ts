import Fastify from 'fastify';
import { registerCors } from './plugins/cors.js';
import { registerRoutes } from './routes/index.js';

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await registerCors(app);
  await registerRoutes(app);

  return app;
}
