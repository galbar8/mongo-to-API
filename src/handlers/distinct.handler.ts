
import { FastifyInstance } from 'fastify';
import { connections } from '../config/databases.js';
import { normalize } from '../utils/normalize.js';
import { CollectionRequest, DistinctRequestBody } from '../types/api.js';

export const registerDistinctHandler = (app: FastifyInstance) => {
  app.post<CollectionRequest>('/api/v2/:db/:collection/distinct', async (req, res) => {
    try {
      const db = normalize(req.params?.db);
      const collection = normalize(req.params?.collection);
      const { field, filter = {} }: DistinctRequestBody = req.body || {};

      if (!field) return res.status(400).send({ error: 'Missing "field" in request body' });

      const conn = connections[db];
      if (!conn?.db) return res.status(404).send({ error: `Database '${db}' not found.` });

      const values = await conn.db.collection(collection).distinct(field, filter);
      return res.send({ field, values, count: values.length });
    } catch (err: any) {
      console.error(err);
      return res.status(500).send({ error: 'Distinct failed', details: err.message });
    }
  });
};
