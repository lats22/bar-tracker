const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Dashboard (all authenticated users)
router.get('/dashboard', reportsController.getDashboard);

// Financial report (manager/admin only)
router.get('/financial', requireRole('admin', 'manager'), reportsController.getFinancialReport);

// Activity logs (admin only)
router.get('/activity-logs', requireRole('admin'), reportsController.getActivityLogs);

module.exports = router;
