const express = require('express');
const router = express.Router();
const { askCoach } = require('../controllers/coachController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, askCoach);

module.exports = router;
