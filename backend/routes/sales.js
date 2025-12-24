const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const salesController = require('../controllers/salesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const createSaleValidation = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').optional().trim(),
  body('category').optional().trim(),
  body('notes').optional().trim()
];

const updateSaleValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentMethod').optional().trim(),
  body('category').optional().trim(),
  body('notes').optional().trim()
];

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', salesController.getSales);
router.get('/summary', salesController.getSummary);
router.get('/:id', salesController.getSaleById);

// POST routes
router.post('/', createSaleValidation, validate, salesController.createSale);

// PUT routes (manager/admin only)
router.put('/:id', requireRole('admin', 'manager'), updateSaleValidation, validate, salesController.updateSale);

// DELETE routes (admin only)
router.delete('/:id', requireRole('admin'), salesController.deleteSale);

module.exports = router;
