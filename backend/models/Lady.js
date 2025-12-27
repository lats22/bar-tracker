const pool = require('../config/database');

class Lady {
  // Create new lady
  static async create({ name }) {
    const result = await pool.query(
      `INSERT INTO ladies (name)
       VALUES ($1)
       RETURNING *`,
      [name]
    );
    return result.rows[0];
  }

  // Get all active ladies
  static async getAll(includeInactive = false) {
    let query = `
      SELECT * FROM ladies
    `;

    if (!includeInactive) {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query);
    return result.rows;
  }

  // Get lady by ID
  static async getById(id) {
    const result = await pool.query(
      `SELECT * FROM ladies WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get lady by name
  static async getByName(name) {
    const result = await pool.query(
      `SELECT * FROM ladies WHERE LOWER(name) = LOWER($1)`,
      [name]
    );
    return result.rows[0];
  }

  // Update lady
  static async update(id, updates) {
    const allowedFields = ['name', 'is_active'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE ladies SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0];
  }

  // Soft delete (deactivate) lady
  static async deactivate(id) {
    const result = await pool.query(
      `UPDATE ladies SET is_active = false WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  // Hard delete lady
  static async delete(id) {
    await pool.query(
      `DELETE FROM ladies WHERE id = $1`,
      [id]
    );
  }
}

module.exports = Lady;
