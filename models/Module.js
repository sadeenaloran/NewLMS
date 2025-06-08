import { pool } from "../config/db.js";

const CourseModel = {
  async create({
    title,
    description,
    instructor_id,
    category_id,
    thumbnail_url = null,
    duration,
  }) {
    const { rows } = await pool.query(
      `INSERT INTO courses 
       (title, description, instructor_id, category_id, thumbnail_url, duration) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description, instructor_id, category_id, thumbnail_url, duration]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT c.*, u.name as instructor_name 
       FROM courses c
       JOIN users u ON c.instructor_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0];
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT c.*, u.name as instructor_name 
       FROM courses c
       JOIN users u ON c.instructor_id = u.id`
    );
    return rows;
  },

  async findByInstructor(instructorId) {
    const { rows } = await pool.query(
      "SELECT * FROM courses WHERE instructor_id = $1",
      [instructorId]
    );
    return rows;
  },

  async update(id, updates) {
    const {
      title,
      description,
      category_id,
      thumbnail_url,
      duration,
      status,
      feedback,
    } = updates;

    const { rows } = await pool.query(
      `UPDATE courses 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category_id = COALESCE($3, category_id),
           thumbnail_url = COALESCE($4, thumbnail_url),
           duration = COALESCE($5, duration),
           status = COALESCE($6, status),
           feedback = COALESCE($7, feedback),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        title,
        description,
        category_id,
        thumbnail_url,
        duration,
        status,
        feedback,
        id,
      ]
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    return true;
  },

  async updateStatus(id, status, feedback = null) {
    const { rows } = await pool.query(
      `UPDATE courses
       SET status = $2,
           feedback = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, feedback]
    );
    return rows[0];
  },
};

export default CourseModel;
