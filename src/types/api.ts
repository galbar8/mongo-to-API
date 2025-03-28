
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface DistinctRequestBody {
  field: string;
  filter?: Record<string, any>;
}

export interface FindRequestBody {
  filter?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

export type CollectionRequest = {
  Params: {
    db: string;
    collection: string;
  };
  Body: DistinctRequestBody;
}

export type AggregationPipeline = Record<string, any>[];
