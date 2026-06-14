import { BaseRepository } from './BaseRepository.js';

export interface CoursePricing {
  id: number;
  organization_id: number;
  course_type_id: number;
  price_per_student: number;
  effective_date: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class CoursePricingRepository extends BaseRepository<CoursePricing> {
  constructor() {
    super('course_pricing');
  }

  async findAllActive(): Promise<CoursePricing[]> {
    return this.query<CoursePricing>(
      `SELECT cp.*, o.name as organization_name, ct.name as course_type_name
       FROM course_pricing cp
       JOIN organizations o ON cp.organization_id = o.id
       JOIN class_types ct ON cp.course_type_id = ct.id
       WHERE cp.is_active = true
       ORDER BY o.name, ct.name`
    );
  }

  async findByOrg(orgId: number): Promise<CoursePricing[]> {
    return this.query<CoursePricing>(
      `SELECT cp.*, ct.name as course_type_name
       FROM course_pricing cp
       JOIN class_types ct ON cp.course_type_id = ct.id
       WHERE cp.organization_id = ? AND cp.is_active = true
       ORDER BY ct.name`,
      [orgId]
    );
  }

  async findExisting(orgId: number, courseTypeId: number): Promise<CoursePricing | null> {
    const rows = await this.query<CoursePricing>(
      `SELECT id FROM course_pricing
       WHERE organization_id = ? AND course_type_id = ? AND is_active = true`,
      [orgId, courseTypeId]
    );
    return rows[0] ?? null;
  }

  async upsert(orgId: number, courseTypeId: number, pricePerStudent: number): Promise<CoursePricing> {
    const existing = await this.findExisting(orgId, courseTypeId);

    if (existing) {
      await this.execute(
        `UPDATE course_pricing SET price_per_student = ?, effective_date = CURRENT_DATE
         WHERE organization_id = ? AND course_type_id = ? AND is_active = true`,
        [pricePerStudent, orgId, courseTypeId]
      );
    } else {
      await this.execute(
        `INSERT INTO course_pricing (organization_id, course_type_id, price_per_student, effective_date, is_active)
         VALUES (?, ?, ?, CURRENT_DATE, true)`,
        [orgId, courseTypeId, pricePerStudent]
      );
    }

    const rows = await this.query<CoursePricing>(
      `SELECT * FROM course_pricing WHERE organization_id = ? AND course_type_id = ? AND is_active = true`,
      [orgId, courseTypeId]
    );
    return rows[0]!;
  }

  async updatePrice(id: number, pricePerStudent: number): Promise<CoursePricing | null> {
    await this.execute(
      `UPDATE course_pricing SET price_per_student = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND is_active = true`,
      [pricePerStudent, id]
    );
    return this.findById(id);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.execute('DELETE FROM course_pricing WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}
