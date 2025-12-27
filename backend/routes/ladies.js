const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const ladiesController = require('../controllers/ladiesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const createLadyValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
];

const updateLadyValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

const saveLadyDrinksValidation = [
  body('date').isISO8601().withMessage('Invalid date format'),
  body('ladyDrinks').isArray().withMessage('ladyDrinks must be an array'),
  body('ladyDrinks.*.ladyId').isUUID().withMessage('Invalid lady ID'),
  body('ladyDrinks.*.drinkCount').isInt({ min: 0 }).withMessage('Drink count must be a positive integer')
];

const dateRangeValidation = [
  query('startDate').isISO8601().withMessage('Invalid startDate format'),
  query('endDate').isISO8601().withMessage('Invalid endDate format')
];

// All routes require authentication
router.use(authenticateToken);

// Lady management routes
router.get('/', ladiesController.getLadies);
router.get('/:id', ladiesController.getLadyById);
router.post('/', createLadyValidation, validate, ladiesController.createLady);
router.put('/:id', requireRole('admin', 'manager'), updateLadyValidation, validate, ladiesController.updateLady);
router.delete('/:id', requireRole('admin'), ladiesController.deactivateLady);

// Lady drinks routes
router.post('/drinks', saveLadyDrinksValidation, validate, ladiesController.saveLadyDrinks);
router.get('/drinks/date/:date', ladiesController.getLadyDrinksByDate);
router.get('/drinks/summary', dateRangeValidation, validate, ladiesController.getLadyDrinksSummary);
router.get('/drinks/range', dateRangeValidation, validate, ladiesController.getLadyDrinksByDateRange);

module.exports = router;
