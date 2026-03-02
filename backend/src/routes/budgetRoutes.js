const express = require('express');
const router = express.Router();

const {
  setBudget,
  getBudgets,
  deleteBudget,
  getBudgetStatus,
  suggestBudgets
} = require('../controllers/budgetController');

const { protect } = require('../middleware/authMiddleware');
const { validate, budgetRules } = require('../middleware/validation');

// Set or update budget
router.post('/', protect, budgetRules, validate, setBudget);

// Get all budgets
router.get('/', protect, getBudgets);

// Get budget status (spending vs budget)
router.get('/status', protect, getBudgetStatus);

// AI Budget suggestions
router.get('/suggest', protect, suggestBudgets);

// Delete a budget
router.delete('/:id', protect, deleteBudget);

module.exports = router;
