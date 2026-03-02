const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { uploadMiddleware, previewImport, confirmImport, debugPDF } = require("../controllers/importController");

// Upload CSV → parse + return preview (doesn't save)
router.post("/preview",  protect, uploadMiddleware, previewImport);

// Accept confirmed rows → save to DB
router.post("/confirm",  protect, confirmImport);

// Debug: return raw extracted text from a PDF (no auth, dev only)
router.post("/debug", uploadMiddleware, debugPDF);

module.exports = router;
