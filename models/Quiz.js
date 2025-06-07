import { pool } from "../config/db.js";

export default {
  // Update create method
  async create(lesson_id, title = "Untitled Quiz", max_score = 10) {
    const query = `
    INSERT INTO quizzes (lesson_id, title, max_score)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
    const result = await pool.query(query, [lesson_id, title, max_score]);
    return result.rows[0];
  },

  // Update update method
  async update(id, updates) {
    const { title, max_score } = updates; // Add title here
    const query = `
    UPDATE quizzes
    SET title = COALESCE($2, title),
        max_score = COALESCE($3, max_score),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
    const result = await pool.query(query, [id, title, max_score]);
    return result.rows[0];
  },
  // الحصول على اختبار بواسطة ID
  async findById(id) {
    try {
      const query = `
        SELECT * FROM quizzes 
        WHERE id = $1
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      error.status = 500;
      error.message = `Failed to find quiz: ${error.message}`;
      throw error;
    }
  },

  // حذف اختبار
  async delete(id) {
    try {
      const query = `
        DELETE FROM quizzes
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      error.status = 500;
      error.message = `Failed to delete quiz: ${error.message}`;
      throw error;
    }
  },

  // الحصول على جميع اختبارات درس معين
  async findByLessonId(lesson_id) {
    try {
      const query = `
        SELECT * FROM quizzes
        WHERE lesson_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [lesson_id]);
      return result.rows;
    } catch (error) {
      error.status = 500;
      error.message = `Failed to find quizzes by lesson: ${error.message}`;
      throw error;
    }
  },
};
