const express = require('express');
const router = express.Router();
const { getPersonality, getEmotionalPatterns } = require('../controllers/personalityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPersonality);
router.get('/emotional', protect, getEmotionalPatterns);

module.exports = router;
