const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create({ username, email, password, fullName, role = 'staff' }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
      [username, email, hashedPassword, fullName, role]
    );

    return result.rows[0];
  }

  // Find user by username (case-insensitive)
  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return result.rows[0];
  }

  // Find user by email (case-insensitive)
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Get all users
  static async getAll() {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  // Update user
  static async update(id, updates) {
    const setClauses = [];
    const values = [id];
    let paramCount = 1;

    // Handle regular fields
    if (updates.email) {
      paramCount++;
      setClauses.push(`email = $${paramCount}`);
      values.push(updates.email);
    }
    if (updates.fullName) {
      paramCount++;
      setClauses.push(`full_name = $${paramCount}`);
      values.push(updates.fullName);
    }
    if (updates.role) {
      paramCount++;
      setClauses.push(`role = $${paramCount}`);
      values.push(updates.role);
    }
    if (updates.is_active !== undefined) {
      paramCount++;
      setClauses.push(`is_active = $${paramCount}`);
      values.push(updates.is_active);
    }

    // Handle password separately (needs hashing)
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      paramCount++;
      setClauses.push(`password_hash = $${paramCount}`);
      values.push(hashedPassword);
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $1
       RETURNING id, username, email, full_name, role, is_active`,
      values
    );

    return result.rows[0];
  }

  // Change password
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
  }

  // Delete user (soft delete by setting is_active to false)
  static async delete(id) {
    await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );
  }
}

module.exports = User;
