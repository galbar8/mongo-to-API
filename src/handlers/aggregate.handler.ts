
import { FastifyInstance } from 'fastify';
import { connections } from '../config/databases.js';
import { parsePagination } from '../utils/pagination.js';
import { normalize } from '../utils/normalize.js';
import { AggregationPipeline, CollectionRequest } from '../types/api.js';

export const registerAggregateHandler = (app: FastifyInstance) => {
  app.post<CollectionRequest>('/api/v2/:db/:collection/aggregate', async (req, res) => {
    try {
      const db = normalize(req.params?.db);
      const collection = normalize(req.params?.collection);
      const pipeline: AggregationPipeline = Array.isArray(req.body) ? req.body : [];
      const { page, limit, skip } = parsePagination(req.query);

      const conn = connections[db];
      if (!conn?.db) return res.status(404).send({ error: `Database '${db}' not found.` });

      const countResult = await conn.db.collection(collection)
        .aggregate([...pipeline, { $count: 'total' }])
        .toArray();

      const total = countResult[0]?.total || 0;
      const data = await conn.db.collection(collection)
        .aggregate([...pipeline, { $skip: skip }, { $limit: limit }], { allowDiskUse: true })
        .toArray();

      return res.send({ data, page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total });
    } catch (err: any) {
      console.error(err);
      return res.status(500).send({ error: 'Aggregation failed', details: err.message });
    }
  });
};
