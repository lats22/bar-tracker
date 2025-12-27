const pool = require('../config/database');

class Salary {
  // Get all salaries with employee information
  static async getAll(startDate, endDate) {
    const query = `
      SELECT
        s.*,
        e.name as employee_name,
        u.full_name as created_by_name
      FROM salaries s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE ($1::date IS NULL OR s.date >= $1)
        AND ($2::date IS NULL OR s.date <= $2)
      ORDER BY s.date DESC, s.created_at DESC
    `;
    const result = await pool.query(query, [startDate || null, endDate || null]);
    return result.rows;
  }

  // Get salary by ID
  static async getById(id) {
    const query = `
      SELECT
        s.*,
        e.name as employee_name,
        u.full_name as created_by_name
      FROM salaries s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Create new salary record
  static async create(data) {
    const { date, amount, employee_id, position, notes, created_by } = data;
    const query = `
      INSERT INTO salaries (date, amount, employee_id, position, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [date, amount, employee_id, position, notes, created_by]);
    return result.rows[0];
  }

  // Update salary record
  static async update(id, data) {
    const { amount, notes } = data;
    const query = `
      UPDATE salaries
      SET amount = COALESCE($1, amount),
          notes = COALESCE($2, notes)
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [amount, notes, id]);
    return result.rows[0];
  }

  // Delete salary record
  static async delete(id) {
    const query = 'DELETE FROM salaries WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get summary by date range
  static async getSummary(startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM salaries
      WHERE ($1::date IS NULL OR date >= $1)
        AND ($2::date IS NULL OR date <= $2)
    `;
    const result = await pool.query(query, [startDate || null, endDate || null]);
    return result.rows[0];
  }
}

module.exports = Salary;
