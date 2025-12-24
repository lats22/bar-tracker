const pool = require('../config/database');

class Sale {
  // Create new sale
  static async create({ date, amount, paymentMethod, category, notes, createdBy }) {
    const result = await pool.query(
      `INSERT INTO sales (date, amount, payment_method, category, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [date, amount, paymentMethod, category, notes, createdBy]
    );
    return result.rows[0];
  }

  // Get all sales with optional filters
  static async getAll(filters = {}) {
    let query = `
      SELECT s.*, u.full_name as created_by_name
      FROM sales s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.startDate) {
      query += ` AND s.date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND s.date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND s.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.paymentMethod) {
      query += ` AND s.payment_method = $${paramCount}`;
      params.push(filters.paymentMethod);
      paramCount++;
    }

    query += ' ORDER BY s.date DESC, s.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get sale by ID
  static async getById(id) {
    const result = await pool.query(
      `SELECT s.*, u.full_name as created_by_name
       FROM sales s
       LEFT JOIN users u ON s.created_by = u.id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update sale
  static async update(id, updates) {
    const allowedFields = ['date', 'amount', 'payment_method', 'category', 'notes'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE sales SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete sale
  static async delete(id) {
    await pool.query('DELETE FROM sales WHERE id = $1', [id]);
  }

  // Get sales summary by period
  static async getSummary(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_transactions,
        SUM(amount) as total_sales,
        AVG(amount) as average_sale,
        MAX(amount) as highest_sale,
        MIN(amount) as lowest_sale,
        COUNT(DISTINCT DATE(date)) as days_with_sales
       FROM sales
       WHERE date >= $1 AND date <= $2`,
      [startDate, endDate]
    );
    return result.rows[0];
  }

  // Get sales by category
  static async getByCategory(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total
       FROM sales
       WHERE date >= $1 AND date <= $2
       GROUP BY category
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Get sales by payment method
  static async getByPaymentMethod(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total
       FROM sales
       WHERE date >= $1 AND date <= $2
       GROUP BY payment_method
       ORDER BY total DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Get daily sales for a period
  static async getDailySales(startDate, endDate) {
    const result = await pool.query(
      `SELECT
        date,
        COUNT(*) as transactions,
        SUM(amount) as total
       FROM sales
       WHERE date >= $1 AND date <= $2
       GROUP BY date
       ORDER BY date`,
      [startDate, endDate]
    );
    return result.rows;
  }
}

module.exports = Sale;
