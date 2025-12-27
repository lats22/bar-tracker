const pool = require('../config/database');

class Employee {
  // Get all employees
  static async getAll(includeInactive = false) {
    let query = 'SELECT * FROM employees';
    if (!includeInactive) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY name ASC';

    const result = await pool.query(query);
    return result.rows;
  }

  // Get employee by ID
  static async getById(id) {
    const result = await pool.query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Create new employee
  static async create({ name, position }) {
    const result = await pool.query(
      `INSERT INTO employees (name, position)
       VALUES ($1, $2)
       RETURNING *`,
      [name, position]
    );
    return result.rows[0];
  }

  // Update employee
  static async update(id, updates) {
    const allowedFields = ['name', 'position', 'is_active'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE employees SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Deactivate employee (soft delete)
  static async deactivate(id) {
    const result = await pool.query(
      'UPDATE employees SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Employee;
