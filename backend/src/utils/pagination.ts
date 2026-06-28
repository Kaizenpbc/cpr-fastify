import { RowDataPacket } from 'mysql2/promise';
import { getPool } from '../config/database.js';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 25;

/**
 * Parse page/limit from query string with safe defaults.
 */
export function parsePagination(query: Record<string, string>): PaginationParams {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  return { page, limit };
}

/**
 * Run a paginated query. Executes both the data query (with LIMIT/OFFSET)
 * and a count query in parallel.
 *
 * @param dataSQL   – SQL for data rows (must NOT include LIMIT/OFFSET — they are appended)
 * @param countSQL  – SQL that returns a single `count` column
 * @param params    – Bind params shared by both queries
 * @param pagination – { page, limit } from parsePagination()
 */
export async function paginatedQuery<T = any>(
  dataSQL: string,
  countSQL: string,
  params: unknown[],
  pagination: PaginationParams,
): Promise<PaginatedResult<T>> {
  const pool = getPool();
  const offset = (pagination.page - 1) * pagination.limit;

  const [[rows], [countRows]] = await Promise.all([
    pool.query<RowDataPacket[]>(`${dataSQL} LIMIT ? OFFSET ?`, [...params, pagination.limit, offset]),
    pool.query<RowDataPacket[]>(countSQL, params),
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  return {
    data: rows as unknown as T[],
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}
