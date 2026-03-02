const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  contributeToGoal,
  deleteGoal,
  getGoalStatus
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');
const { validate, goalRules } = require('../middleware/validation');

router.post('/', protect, goalRules, validate, createGoal);
router.get('/', protect, getGoals);
router.get('/status', protect, getGoalStatus);
router.post('/:id/contribute', protect, contributeToGoal);
router.delete('/:id', protect, deleteGoal);

module.exports = router;
