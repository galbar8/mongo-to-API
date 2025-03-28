
import Fastify from 'fastify';
import dotenv from 'dotenv';
import { loadDatabaseConnections } from './config/databases.js';
import { registerApiRoutes } from './routes/api.js';

dotenv.config();

const app = Fastify({ logger: true });

app.addHook('preHandler', async (request, reply) => {
  const expectedToken = process.env.MONGO_DB_AUTH_TOKEN;
  const receivedToken = request.headers['authorization'];

  if (!expectedToken || receivedToken !== `Bearer ${expectedToken}`) {
    reply.code(401).send({ error: 'Unauthorized: missing or invalid token' });
  }
});

const startServer = async () => {
  try {
    app.log.info('🔄 Loading MongoDB connections...');
    await loadDatabaseConnections();

    app.log.info('✅ Registering API routes...');
    await registerApiRoutes(app);

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`🚀 Server ready at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();
