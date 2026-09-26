import { buildServer } from './server.js';
import { config } from './config/index.js';

async function main() {
  const server = await buildServer();

  try {
    await server.listen({
      port: config.port,
      host: config.host,
    });
    console.log(`OneMoon API listening on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
