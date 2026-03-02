const express = require('express');
const router = express.Router();
const { detectSubscriptions } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, detectSubscriptions);

module.exports = router;
