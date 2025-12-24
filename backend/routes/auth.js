const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('role').optional().isIn(['admin', 'manager', 'staff']).withMessage('Invalid role')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Public routes
router.post('/login', loginValidation, validate, authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, changePasswordValidation, validate, authController.changePassword);

// Admin/Manager routes
router.get('/users', authenticateToken, requireRole('admin', 'manager'), authController.getAllUsers);

// Admin only routes
router.post('/register', authenticateToken, requireRole('admin'), registerValidation, validate, authController.register);
router.put('/users/:id', authenticateToken, requireRole('admin'), authController.updateUser);
router.delete('/users/:id', authenticateToken, requireRole('admin'), authController.deleteUser);

module.exports = router;
