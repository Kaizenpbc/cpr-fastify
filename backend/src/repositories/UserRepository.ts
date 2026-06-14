import { BaseRepository } from './BaseRepository.js';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Users table uses organization_id — default org column works
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  async findByUsername(username: string): Promise<User | null> {
    // Login lookup is unscoped — we don't know the org yet
    const rows = await this.query<User>(
      'SELECT * FROM users WHERE username = ? AND deleted_at IS NULL',
      [username]
    );
    return rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.query<User>(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows[0] ?? null;
  }

  async findByRole(role: string, options?: { limit?: number; offset?: number }): Promise<User[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    // When scoped with forOrg(), only returns users in that org
    return this.findAll({ limit, offset });
  }

  async updatePassword(id: number, passwordHash: string): Promise<boolean> {
    return this.update(id, { password_hash: passwordHash } as Partial<User>);
  }
}
