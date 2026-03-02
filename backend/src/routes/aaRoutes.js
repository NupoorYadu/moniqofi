const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const {
  createConsent,
  getConsentStatus,
  getLinkedBanks,
  fetchData,
  setuWebhook,
} = require('../controllers/accountAggregatorController');

// Webhook – no auth, called by Setu servers
router.post('/webhook', setuWebhook);

// Protected routes – user must be logged in
router.post('/consent', auth, createConsent);
router.get('/consent/:id', auth, getConsentStatus);
router.get('/banks', auth, getLinkedBanks);
router.post('/fetch/:consentId', auth, fetchData);

module.exports = router;
