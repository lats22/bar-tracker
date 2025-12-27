const pool = require('../config/database');

class LadyDrink {
  // Create or update lady drink entry for a date
  static async upsert({ date, ladyId, drinkCount, createdBy }) {
    const result = await pool.query(
      `INSERT INTO lady_drinks (date, lady_id, drink_count, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (date, lady_id)
       DO UPDATE SET drink_count = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [date, ladyId, drinkCount, createdBy]
    );
    return result.rows[0];
  }

  // Batch upsert multiple lady drinks for a date
  static async batchUpsert(date, ladyDrinks, createdBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // First, delete all existing entries for this date
      await client.query(
        'DELETE FROM lady_drinks WHERE date = $1',
        [date]
      );

      // Then insert new entries
      const results = [];
      for (const { ladyId, drinkCount } of ladyDrinks) {
        if (drinkCount > 0) {
          const result = await client.query(
            `INSERT INTO lady_drinks (date, lady_id, drink_count, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [date, ladyId, drinkCount, createdBy]
          );
          results.push(result.rows[0]);
        }
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get lady drinks for a specific date
  static async getByDate(date) {
    const result = await pool.query(
      `SELECT ld.id, ld.date::text as date, ld.lady_id, ld.drink_count,
              ld.created_by, ld.created_at, ld.updated_at, l.name as lady_name
       FROM lady_drinks ld
       JOIN ladies l ON ld.lady_id = l.id
       WHERE ld.date = $1
       ORDER BY l.name ASC`,
      [date]
    );
    return result.rows;
  }

  // Get lady drinks for a date range
  static async getByDateRange(startDate, endDate) {
    const result = await pool.query(
      `SELECT ld.id, ld.date::text as date, ld.lady_id, ld.drink_count,
              ld.created_by, ld.created_at, ld.updated_at, l.name as lady_name
       FROM lady_drinks ld
       JOIN ladies l ON ld.lady_id = l.id
       WHERE ld.date >= $1 AND ld.date <= $2
       ORDER BY ld.date DESC, l.name ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Get summary of drinks per lady for a date range
  static async getSummary(startDate, endDate) {
    const result = await pool.query(
      `SELECT
         l.id as lady_id,
         l.name as lady_name,
         SUM(ld.drink_count) as total_drinks,
         COUNT(DISTINCT ld.date) as days_worked,
         ARRAY_AGG(
           json_build_object(
             'date', ld.date::text,
             'drink_count', ld.drink_count
           ) ORDER BY ld.date DESC
         ) as daily_details
       FROM ladies l
       LEFT JOIN lady_drinks ld ON l.id = ld.lady_id
         AND ld.date >= $1 AND ld.date <= $2
       WHERE l.is_active = true
       GROUP BY l.id, l.name
       HAVING SUM(ld.drink_count) > 0 OR COUNT(DISTINCT ld.date) = 0
       ORDER BY total_drinks DESC NULLS LAST, l.name ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  // Delete lady drinks for a specific date
  static async deleteByDate(date) {
    await pool.query(
      'DELETE FROM lady_drinks WHERE date = $1',
      [date]
    );
  }

  // Delete specific lady drink entry
  static async delete(id) {
    await pool.query(
      'DELETE FROM lady_drinks WHERE id = $1',
      [id]
    );
  }
}

module.exports = LadyDrink;
