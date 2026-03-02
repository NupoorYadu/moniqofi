const { body, validationResult } = require('express-validator');

/**
 * Runs validation result check — returns 400 with errors if any fail.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth validation rules ───

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const resetPasswordRules = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
];

const resendVerificationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
];

// ─── Transaction validation rules ───

const transactionRules = [
  body('type')
    .notEmpty().withMessage('Transaction type is required')
    .isIn(['income', 'expense']).withMessage('Type must be "income" or "expense"'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01, max: 999999999 }).withMessage('Amount must be a positive number'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 50 }).withMessage('Category max 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Description max 255 characters'),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO date'),
];

// ─── Budget validation rules ───

const budgetRules = [
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ max: 50 }).withMessage('Category max 50 characters'),
  body('amount')
    .notEmpty().withMessage('Budget amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
];

// ─── Goal validation rules ───

const goalRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Goal title is required')
    .isLength({ max: 100 }).withMessage('Title max 100 characters'),
  body('target_amount')
    .notEmpty().withMessage('Target amount is required')
    .isFloat({ min: 0.01 }).withMessage('Target must be a positive number'),
  body('current_amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Current amount must be >= 0'),
  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  resendVerificationRules,
  transactionRules,
  budgetRules,
  goalRules,
};
