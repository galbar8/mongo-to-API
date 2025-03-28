
export const MAX_LIMIT = 1000;

export const parsePagination = (query: any): { page: number; limit: number; skip: number } => {
  const page = Math.max(Number(query?.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query?.limit) || 100, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
