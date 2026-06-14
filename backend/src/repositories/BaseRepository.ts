import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../config/database.js';

export class BaseRepository<T> {
  constructor(protected readonly table: string) {}

  async findById(id: number): Promise<T | null> {
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM ${this.table} WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return (rows[0] as T) ?? null;
  }

  async findAll(options?: { limit?: number; offset?: number }): Promise<T[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT * FROM ${this.table} WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows as T[];
  }

  async create(data: Partial<T>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.map((k) => `\`${k}\``).join(', ');

    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`,
      values
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<T>): Promise<boolean> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(', ');

    const [result] = await getPool().query<ResultSetHeader>(
      `UPDATE ${this.table} SET ${setClause} WHERE id = ? AND deleted_at IS NULL`,
      [...values, id]
    );
    return result.affectedRows > 0;
  }

  async softDelete(id: number): Promise<boolean> {
    const [result] = await getPool().query<ResultSetHeader>(
      `UPDATE ${this.table} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.affectedRows > 0;
  }

  async count(where?: string, params?: unknown[]): Promise<number> {
    const whereClause = where ? `AND ${where}` : '';
    const [rows] = await getPool().query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${this.table} WHERE deleted_at IS NULL ${whereClause}`,
      params ?? []
    );
    return rows[0].count;
  }

  async query<R = T>(sql: string, params?: unknown[]): Promise<R[]> {
    const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
    return rows as R[];
  }

  async execute(sql: string, params?: unknown[]): Promise<ResultSetHeader> {
    const [result] = await getPool().query<ResultSetHeader>(sql, params);
    return result;
  }
}
