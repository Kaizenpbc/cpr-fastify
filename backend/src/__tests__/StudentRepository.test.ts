import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();
vi.mock('../config/database.js', () => ({
  getPool: () => ({ query: mockQuery }),
}));

import { StudentRepository } from '../repositories/StudentRepository.js';

describe('StudentRepository', () => {
  let repo: StudentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new StudentRepository();
  });

  describe('findOrCreate', () => {
    it('inserts and returns student id', async () => {
      mockQuery.mockResolvedValueOnce([{}]); // INSERT IGNORE
      mockQuery.mockResolvedValueOnce([[{ id: 42 }]]); // SELECT

      const id = await repo.findOrCreate({
        email: ' John@Example.COM ',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-1234',
        organizationId: 1,
      });

      expect(id).toBe(42);
      // Email should be trimmed and lowercased
      expect(mockQuery.mock.calls[0][1][0]).toBe('john@example.com');
    });

    it('returns existing student when email already exists', async () => {
      mockQuery.mockResolvedValueOnce([{}]); // INSERT IGNORE (no-op)
      mockQuery.mockResolvedValueOnce([[{ id: 7 }]]); // SELECT existing

      const id = await repo.findOrCreate({
        email: 'existing@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      expect(id).toBe(7);
    });
  });

  describe('findOrCreateBulk', () => {
    it('creates master records and returns email-to-id map', async () => {
      mockQuery.mockResolvedValueOnce([{}]); // INSERT IGNORE bulk
      mockQuery.mockResolvedValueOnce([[
        { id: 1, email: 'a@test.com' },
        { id: 2, email: 'b@test.com' },
      ]]); // SELECT IN

      const result = await repo.findOrCreateBulk([
        { email: 'A@Test.com', firstName: 'A', lastName: 'One' },
        { email: 'B@Test.com', firstName: 'B', lastName: 'Two' },
      ], 5);

      expect(result.size).toBe(2);
      expect(result.get('a@test.com')).toBe(1);
      expect(result.get('b@test.com')).toBe(2);
      // Should pass orgId
      expect(mockQuery.mock.calls[0][1]).toContain(5);
    });

    it('returns empty map when no students have email', async () => {
      const result = await repo.findOrCreateBulk([
        { email: '', firstName: 'No', lastName: 'Email' },
        { email: '  ', firstName: 'Also', lastName: 'None' },
      ]);

      expect(result.size).toBe(0);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('finds student by normalized email', async () => {
      const student = { id: 1, email: 'test@example.com', first_name: 'Test' };
      mockQuery.mockResolvedValueOnce([[student]]);

      const result = await repo.findByEmail(' Test@Example.COM ');

      expect(result).toEqual(student);
      expect(mockQuery.mock.calls[0][1][0]).toBe('test@example.com');
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const result = await repo.findByEmail('nobody@test.com');

      expect(result).toBeNull();
    });
  });

  describe('getCourseHistory', () => {
    it('returns courses for a student', async () => {
      const courses = [
        { id: 1, course_type_name: 'CPR Level C', completed_at: '2026-01-15' },
        { id: 2, course_type_name: 'AED', completed_at: '2026-03-20' },
      ];
      mockQuery.mockResolvedValueOnce([courses]);

      const result = await repo.getCourseHistory(42);

      expect(result).toHaveLength(2);
      expect(result[0].course_type_name).toBe('CPR Level C');
      expect(mockQuery.mock.calls[0][1]).toEqual([42]);
    });
  });

  describe('updateMarketingConsent', () => {
    it('sets consent to true with timestamp', async () => {
      mockQuery.mockResolvedValueOnce([{}]);

      await repo.updateMarketingConsent(5, true);

      expect(mockQuery.mock.calls[0][1]).toEqual([true, true, 5]);
    });

    it('sets consent to false and clears timestamp', async () => {
      mockQuery.mockResolvedValueOnce([{}]);

      await repo.updateMarketingConsent(5, false);

      expect(mockQuery.mock.calls[0][1]).toEqual([false, false, 5]);
    });
  });
});
