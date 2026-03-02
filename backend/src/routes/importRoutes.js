const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadMiddleware, previewImport, confirmImport } = require("../controllers/importController");

// Upload CSV → parse + return preview (doesn't save)
router.post("/preview",  protect, uploadMiddleware, previewImport);

// Accept confirmed rows → save to DB
router.post("/confirm",  protect, confirmImport);

module.exports = router;
