
import { FastifyInstance } from 'fastify';
import { connections } from '../config/databases.js';
import { parsePagination } from '../utils/pagination.js';
import { normalize } from '../utils/normalize.js';
import { CollectionRequest, FindRequestBody } from '../types/api.js';

export const registerFindHandler = (app: FastifyInstance) => {
  app.post<CollectionRequest>('/api/v2/:db/:collection/find', async (req, res) => {
    try {
      const db = normalize(req.params?.db);
      const collection = normalize(req.params?.collection);
      const { filter = {}, sort = {}, projection = {} }: FindRequestBody = req.body || {};
      const { page, limit, skip } = parsePagination(req.query);

      const conn = connections[db];
      if (!conn?.db) return res.status(404).send({ error: `Database '${db}' not found.` });

      const col = conn.db.collection(collection);
      const total = await col.countDocuments(filter);
      const data = await col.find(filter).sort(sort).project(projection).skip(skip).limit(limit).toArray();

      return res.send({ data, page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total });
    } catch (err: any) {
      console.error(err);
      return res.status(500).send({ error: 'Find failed', details: err.message });
    }
  });
};
