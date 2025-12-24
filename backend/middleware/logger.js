const pool = require('../config/database');

// Log user activity to database
const logActivity = async (userId, action, entityType = null, entityId = null, req) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId, ipAddress, userAgent]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - logging should not break the main flow
  }
};

module.exports = { logActivity };
