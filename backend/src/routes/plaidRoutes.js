const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createLinkToken,
  exchangeToken,
  getLinkedAccounts,
  unlinkAccount,
  syncAll,
  webhook,
  getBalances,
} = require("../controllers/plaidController");

// Create Plaid Link token (protected)
router.post("/create-link-token", protect, createLinkToken);

// Exchange public token after user links bank (protected)
router.post("/exchange-token", protect, exchangeToken);

// Get all linked accounts (protected)
router.get("/accounts", protect, getLinkedAccounts);

// Remove a linked account (protected)
router.delete("/accounts/:id", protect, unlinkAccount);

// Manually trigger sync for all linked accounts (protected)
router.post("/sync", protect, syncAll);

// Real-time account balances (protected) — calls Plaid live, not cached
router.get("/balances", protect, getBalances);

// Plaid webhook — no auth (Plaid calls this)
router.post("/webhook", webhook);

module.exports = router;
