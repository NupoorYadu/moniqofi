const pool = require("../config/db");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const XLSX = require("xlsx");

// --- Multer: accept any file, detect internally ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, _file, cb) => cb(null, true),
});
exports.uploadMiddleware = upload.single("file");
