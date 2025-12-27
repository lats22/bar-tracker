const pool = require('../config/database');

class Expense {
  // Create new expense
  static async create({ date, amount, category, description, receiptUrl, createdBy }) {
    const result = await pool.query(
      `INSERT INTO expenses (date, amount, category, description, receipt_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [date, amount, category, description, receiptUrl, createdBy]
    );
    return result.rows[0];
  }

  // Get all expenses with optional filters
  static async getAll(filters = {}) {
    let query = `
      SELECT e.*, u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.startDate) {
      query += ` AND e.date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND e.date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND e.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get expense by ID
  static async getById(id) {
    const result = await pool.query(
      `SELECT e.*, u.full_name as created_by_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update expense
  static async update(id, updates) {
    const allowedFields = ['amount', 'category', 'description', 'receipt_url'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE expenses SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete expense
  static async delete(id) {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
  }

  // Get expenses summary by period
  static async getSummary(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_transactions,
        SUM(amount) as total_expenses,
        AVG(amount) as average_expense,
        MAX(amount) as highest_expense,
        MIN(amount) as lowest_expense,
        COUNT(DISTINCT DATE(date)) as days_with_expenses
       FROM expenses
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );
    return result.rows[0];
  }

  // Get expenses by category
  static async getByCategory(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total
       FROM expenses
       WHERE date >= $1 AND date <= $2
       GROUP BY category
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Get daily expenses for a period
  static async getDailyExpenses(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        date,
        COUNT(*) as transactions,
        SUM(amount) as total
       FROM expenses
       WHERE date >= $1 AND date <= $2
       GROUP BY date
       ORDER BY date`,
      [startDate, endDate]
    );
    return result.rows;
  }
}

module.exports = Expense;
