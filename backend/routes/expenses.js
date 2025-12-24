const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const expensesController = require('../controllers/expensesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const createExpenseValidation = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('vendor').optional().trim(),
  body('description').optional().trim(),
  body('receiptUrl').optional().isURL().withMessage('Invalid URL')
];

const updateExpenseValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category').optional().trim(),
  body('vendor').optional().trim(),
  body('description').optional().trim(),
  body('receiptUrl').optional().isURL().withMessage('Invalid URL')
];

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', expensesController.getExpenses);
router.get('/summary', expensesController.getSummary);
router.get('/:id', expensesController.getExpenseById);

// POST routes (manager/admin only)
router.post('/', requireRole('admin', 'manager'), createExpenseValidation, validate, expensesController.createExpense);

// PUT routes (manager/admin only)
router.put('/:id', requireRole('admin', 'manager'), updateExpenseValidation, validate, expensesController.updateExpense);

// DELETE routes (admin only)
router.delete('/:id', requireRole('admin'), expensesController.deleteExpense);

module.exports = router;
