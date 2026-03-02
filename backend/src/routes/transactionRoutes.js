const express = require('express');
const router = express.Router();

const { 
  addTransaction, 
  getTransactions, 
  getSummary,
  getCategoryBreakdown,
  updateTransaction,
  deleteTransaction,
  getMonthlyTrend,
  getInsights
} = require('../controllers/transactionController');

const { protect } = require('../middleware/authMiddleware');
const { validate, transactionRules } = require('../middleware/validation');

// Add Transaction
router.post('/', protect, transactionRules, validate, addTransaction);

// Get User Transactions
router.get('/', protect, getTransactions);

// Get Summary
router.get('/summary', protect, getSummary);

// Get Category Breakdown
router.get('/categories', protect, getCategoryBreakdown);

// Update Transaction
router.put('/:id', protect, updateTransaction);

//Delete Transaction
router.delete('/:id', protect, deleteTransaction);

//Add Monthly Trend Controller
router.get('/monthly-trend', protect, getMonthlyTrend);

// Smart Insights
router.get('/insights', protect, getInsights);

module.exports = router;