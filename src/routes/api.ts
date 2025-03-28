
import { FastifyInstance } from 'fastify';
import { registerAggregateHandler } from '../handlers/aggregate.handler.js';
import { registerFindHandler } from '../handlers/find.handler.js';
import { registerCountHandler } from '../handlers/count.handler.js';
import { registerDistinctHandler } from '../handlers/distinct.handler.js';

export const registerApiRoutes = async (app: FastifyInstance) => {
  registerAggregateHandler(app);
  registerFindHandler(app);
  registerCountHandler(app);
  registerDistinctHandler(app);
};
