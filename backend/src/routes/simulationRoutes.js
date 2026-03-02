const express = require('express');
const router = express.Router();
const { projectFuture } = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/project', protect, projectFuture);

module.exports = router;
