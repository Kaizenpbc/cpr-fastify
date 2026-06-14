import { BaseRepository } from './BaseRepository.js';

export interface CourseStudent {
  id: number;
  course_request_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  attended: boolean;
  attendance_marked: Date | null;
  created_at: Date;
  deleted_at: Date | null;
}

export class CourseStudentRepository extends BaseRepository<CourseStudent> {
  constructor() {
    super('course_students', null, false); // No org column — scoped via course_request
  }

  async findByCourse(courseRequestId: number): Promise<CourseStudent[]> {
    return this.query<CourseStudent>(
      `SELECT id, course_request_id, first_name, last_name, email,
              attended, attendance_marked, created_at
       FROM course_students
       WHERE course_request_id = ?
       ORDER BY last_name, first_name`,
      [courseRequestId]
    );
  }

  async addStudents(courseRequestId: number, students: Array<{ firstName: string; lastName: string; email?: string }>): Promise<number> {
    let inserted = 0;
    for (const s of students) {
      await this.execute(
        `INSERT INTO course_students (course_request_id, first_name, last_name, email)
         VALUES (?, ?, ?, ?)`,
        [courseRequestId, s.firstName, s.lastName, s.email ?? null]
      );
      inserted++;
    }
    return inserted;
  }

  async countAttended(courseRequestId: number): Promise<number> {
    const rows = await this.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM course_students
       WHERE course_request_id = ? AND attended = true`,
      [courseRequestId]
    );
    return rows[0]?.count ?? 0;
  }
}
