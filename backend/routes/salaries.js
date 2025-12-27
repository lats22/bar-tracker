const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const salariesController = require('../controllers/salariesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const createSalaryValidation = [
  body('date').isDate().withMessage('Valid date is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('position').trim().notEmpty().withMessage('Position is required')
];

const updateSalaryValidation = [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('notes').optional().trim()
];

// All routes require authentication
router.use(authenticateToken);

// Salary management routes
router.get('/', salariesController.getSalaries);
router.get('/summary', salariesController.getSalarySummary);
router.get('/:id', salariesController.getSalaryById);
router.post('/', requireRole('admin', 'manager'), createSalaryValidation, validate, salariesController.createSalary);
router.put('/:id', requireRole('admin', 'manager'), updateSalaryValidation, validate, salariesController.updateSalary);
router.delete('/:id', requireRole('admin'), salariesController.deleteSalary);

module.exports = router;
