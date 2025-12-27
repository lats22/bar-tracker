const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const employeesController = require('../controllers/employeesController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const createEmployeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('position').trim().notEmpty().withMessage('Position is required')
];

const updateEmployeeValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// All routes require authentication
router.use(authenticateToken);

// Employee management routes
router.get('/', employeesController.getEmployees);
router.get('/:id', employeesController.getEmployeeById);
router.post('/', createEmployeeValidation, validate, employeesController.createEmployee);
router.put('/:id', requireRole('admin', 'manager'), updateEmployeeValidation, validate, employeesController.updateEmployee);
router.delete('/:id', requireRole('admin'), employeesController.deactivateEmployee);

module.exports = router;
