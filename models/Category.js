import { pool } from "../config/db.js";

const CategoryModel = {
  async create(name) {
    try {
      const { rows } = await pool.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING *",
        [name]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  async findAll() {
    try {
      const { rows } = await pool.query("SELECT * FROM categories");
      return rows;
    } catch (error) {
      throw error;
    }
  },

  async findById(id) {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM categories WHERE id = $1",
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
};

export default CategoryModel;
