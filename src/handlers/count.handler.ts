
import { FastifyInstance } from 'fastify';
import { connections } from '../config/databases.js';
import { normalize } from '../utils/normalize.js';
import { CollectionRequest } from '../types/api.js';

export const registerCountHandler = (app: FastifyInstance) => {
  app.post<CollectionRequest>('/api/v2/:db/:collection/count', async (req, res) => {
    try {
      const db = normalize(req.params?.db);
      const collection = normalize(req.params?.collection);
      const filter = req.body || {};

      const conn = connections[db];
      if (!conn?.db) return res.status(404).send({ error: `Database '${db}' not found.` });

      const total = await conn.db.collection(collection).countDocuments(filter);
      return res.send({ total });
    } catch (err: any) {
      console.error(err);
      return res.status(500).send({ error: 'Count failed', details: err.message });
    }
  });
};
