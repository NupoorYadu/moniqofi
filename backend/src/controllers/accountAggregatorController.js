/**
 * Account Aggregator (Setu AA) controller
 *
 * Endpoints exposed:
 *  POST /api/aa/consent              → createConsent
 *  GET  /api/aa/consent/:id          → getConsentStatus
 *  GET  /api/aa/banks                → getLinkedBanks
 *  POST /api/aa/fetch/:consentId     → fetchData
 *  POST /api/aa/webhook              → setuWebhook  (no auth – called by Setu)
 */

const pool = require('../config/db');
const { setuClient } = require('../config/setu');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Derive a simple category from a transaction narration */
function categorize(narration = '') {
  const n = narration.toLowerCase();
  if (/salary|payroll|stipend/.test(n)) return 'Income';
  if (/zomato|swiggy|food|restaurant|cafe|dining/.test(n)) return 'Food & Dining';
  if (/amazon|flipkart|myntra|shopping|mart/.test(n)) return 'Shopping';
  if (/ola|uber|irctc|flight|travel|cab/.test(n)) return 'Travel';
  if (/netflix|spotify|hotstar|prime|subscription/.test(n)) return 'Subscriptions';
  if (/electricity|water|gas|broadband|recharge|bill/.test(n)) return 'Utilities';
  if (/hospital|pharmacy|medical|health|doctor/.test(n)) return 'Health';
  if (/rent|maintenance|society/.test(n)) return 'Housing';
  if (/atm|cash/.test(n)) return 'Cash';
  if (/neft|imps|upi|transfer|payment/.test(n)) return 'Transfer';
  return 'Other';
}

/**
 * Extract transactions from Setu FI JSON (account format v1.1)
 * Returns an array of flat transaction objects ready to INSERT.
 */
function extractTransactions(fiData, userId) {
  const results = [];

  for (const fip of fiData || []) {
    for (const account of fip.data || fip.accounts || []) {
      const decoded = account.decryptedFI || account.data?.account;
      if (!decoded) continue;

      const accRef = decoded.linkedAccRef || account.linkRefNumber;
      const transactions = decoded.transactions?.transaction || [];
      const txList = Array.isArray(transactions) ? transactions : [transactions];

      for (const tx of txList) {
        if (!tx) continue;
        const amount = parseFloat(tx.amount || 0);
        const type = (tx.type || '').toUpperCase(); // CREDIT or DEBIT
        const narration = tx.narration || tx.remark || '';
        const date = tx.transactionTimestamp || tx.valueDate || new Date().toISOString();

        results.push({
          user_id: userId,
          title: narration || (type === 'CREDIT' ? 'Credit' : 'Expense'),
          amount: Math.abs(amount),
          type: type === 'CREDIT' ? 'income' : 'expense',
          category: categorize(narration),
          date: date.split('T')[0],
          description: `${tx.mode || ''} | Ref: ${tx.txnId || accRef || ''}`.trim(),
          source: 'aa',
        });
      }
    }
  }

  return results;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/aa/consent
 * Body: { mobile, fromDate, toDate }
 * Creates a Setu consent request and returns the redirect URL.
 */
exports.createConsent = async (req, res) => {
  const userId = req.user.id;
  const { mobile, fromDate, toDate } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: 'mobile number is required' });
  }

  const from = fromDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();
  const to   = toDate   || new Date().toISOString();

  try {
    const client = await setuClient();

    const payload = {
      consentDuration: { unit: 'MONTH', value: '12' },
      vua: mobile.includes('@') ? mobile : `${mobile}@setu`,
      dataRange: { from, to },
      context: [],
    };

    const { data } = await client.post('/consents', payload);
    const { id: consentId, url: redirectUrl } = data;

    // Persist to DB
    await pool.query(
      `INSERT INTO aa_consents (user_id, consent_id, status, redirect_url, vua)
       VALUES ($1, $2, 'PENDING', $3, $4)
       ON CONFLICT (consent_id) DO NOTHING`,
      [userId, consentId, redirectUrl, payload.vua]
    );

    return res.json({ consentId, redirectUrl });
  } catch (err) {
    console.error('[AA] createConsent error:', err.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to create consent with Setu AA', detail: err.response?.data });
  }
};

/**
 * GET /api/aa/consent/:id
 * Returns consent status from our DB (+ optionally polls Setu for latest).
 */
exports.getConsentStatus = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // First check DB
    const { rows } = await pool.query(
      'SELECT * FROM aa_consents WHERE consent_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Consent not found' });
    }

    const consent = rows[0];

    // If still PENDING, poll Setu for the latest status
    if (consent.status === 'PENDING') {
      try {
        const client = await setuClient();
        const { data } = await client.get(`/consents/${id}`);
        const liveStatus = data.status || consent.status;

        if (liveStatus !== consent.status) {
          await pool.query(
            'UPDATE aa_consents SET status = $1 WHERE consent_id = $2',
            [liveStatus, id]
          );
          consent.status = liveStatus;
        }
      } catch (_) {
        // Setu poll failed – return cached DB status
      }
    }

    return res.json(consent);
  } catch (err) {
    console.error('[AA] getConsentStatus error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * GET /api/aa/banks
 * Lists all linked bank consents for the logged-in user.
 */
exports.getLinkedBanks = async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT consent_id, status, vua, created_at, updated_at
       FROM aa_consents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[AA] getLinkedBanks error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * POST /api/aa/fetch/:consentId
 * Creates a data session against an ACTIVE consent and fetches FI transactions.
 */
exports.fetchData = async (req, res) => {
  const userId = req.user.id;
  const { consentId } = req.params;

  try {
    // Verify consent belongs to this user and is ACTIVE
    const { rows } = await pool.query(
      'SELECT * FROM aa_consents WHERE consent_id = $1 AND user_id = $2',
      [consentId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Consent not found' });
    }

    const consent = rows[0];

    if (consent.status !== 'ACTIVE') {
      return res.status(400).json({
        message: `Consent is ${consent.status}. Bank must approve before data can be fetched.`,
      });
    }

    const client = await setuClient();

    // ── Step 1: Create data session ──────────────────────────────────────────
    const sessionPayload = {
      consentId,
      dataRange: {
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        to:   new Date().toISOString(),
      },
      format: 'json',
    };

    const { data: sessionData } = await client.post('/sessions', sessionPayload);
    const sessionId = sessionData.id;

    await pool.query(
      `INSERT INTO aa_sessions (consent_id, session_id, status)
       VALUES ($1, $2, 'PENDING')
       ON CONFLICT (session_id) DO NOTHING`,
      [consentId, sessionId]
    );

    // ── Step 2: Poll until COMPLETED / PARTIAL (max 20 s) ───────────────────
    let fiData = null;
    let sessionStatus = 'PENDING';
    const start = Date.now();

    while (Date.now() - start < 20000) {
      await new Promise(r => setTimeout(r, 2000));
      const { data: sd } = await client.get(`/sessions/${sessionId}`);
      sessionStatus = sd.status;

      if (['COMPLETED', 'PARTIAL'].includes(sessionStatus)) {
        fiData = sd.fips;
        break;
      }
      if (['EXPIRED', 'FAILED'].includes(sessionStatus)) break;
    }

    await pool.query(
      'UPDATE aa_sessions SET status = $1 WHERE session_id = $2',
      [sessionStatus, sessionId]
    );

    if (!fiData) {
      return res.status(202).json({
        message: 'Data not yet ready. Check back shortly or wait for the webhook.',
        sessionId,
        sessionStatus,
      });
    }

    // ── Step 3: Parse & insert transactions ──────────────────────────────────
    const transactions = extractTransactions(fiData, userId);

    let saved = 0;
    for (const tx of transactions) {
      try {
        await pool.query(
          `INSERT INTO transactions (user_id, title, amount, type, category, date, description, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [tx.user_id, tx.title, tx.amount, tx.type, tx.category, tx.date, tx.description, tx.source]
        );
        saved++;
      } catch (_) {
        // skip duplicates / constraint errors silently
      }
    }

    return res.json({ message: 'Transactions imported', total: transactions.length, saved, sessionId });
  } catch (err) {
    console.error('[AA] fetchData error:', err.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to fetch data from Setu AA', detail: err.response?.data });
  }
};

/**
 * POST /api/aa/webhook  (no JWT auth — called by Setu)
 *
 * Setu sends two types:
 *   CONSENT_STATUS_UPDATE  – consent approved/rejected by user
 *   SESSION_STATUS_UPDATE  – FI data ready / completed
 */
exports.setuWebhook = async (req, res) => {
  const { type, consentId, data } = req.body;

  // Always acknowledge immediately
  res.status(200).json({ success: true });

  try {
    if (type === 'CONSENT_STATUS_UPDATE') {
      const newStatus = data?.status;
      if (consentId && newStatus) {
        await pool.query(
          'UPDATE aa_consents SET status = $1 WHERE consent_id = $2',
          [newStatus, consentId]
        );
        console.log(`[AA Webhook] Consent ${consentId} → ${newStatus}`);
      }
    }

    if (type === 'SESSION_STATUS_UPDATE') {
      const sessionId = req.body.dataSessionId;
      const sessionStatus = data?.status;
      if (sessionId && sessionStatus) {
        await pool.query(
          'UPDATE aa_sessions SET status = $1 WHERE session_id = $2',
          [sessionStatus, sessionId]
        );
        console.log(`[AA Webhook] Session ${sessionId} → ${sessionStatus}`);
      }

      // If data is auto-pushed (Auto-Fetch feature), ingest inline
      if (['COMPLETED', 'PARTIAL'].includes(sessionStatus) && Array.isArray(data?.fips)) {
        const { rows } = await pool.query(
          'SELECT user_id FROM aa_consents WHERE consent_id = $1',
          [consentId]
        );
        if (rows.length) {
          const userId = rows[0].user_id;
          const transactions = extractTransactions(data.fips, userId);
          for (const tx of transactions) {
            try {
              await pool.query(
                `INSERT INTO transactions (user_id, title, amount, type, category, date, description, source)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [tx.user_id, tx.title, tx.amount, tx.type, tx.category, tx.date, tx.description, tx.source]
              );
            } catch (_) { /* skip duplicates */ }
          }
          console.log(`[AA Webhook] Auto-ingested ${transactions.length} txns for user ${userId}`);
        }
      }
    }

    // FI_DATA_READY — auto-fetch mode sends full data in the webhook
    if (type === 'FI_DATA_READY') {
      const fiData = req.body.fiData;
      const { rows } = await pool.query(
        'SELECT user_id FROM aa_consents WHERE consent_id = $1',
        [consentId]
      );
      if (rows.length && fiData) {
        const userId = rows[0].user_id;
        const transactions = extractTransactions(fiData, userId);
        for (const tx of transactions) {
          try {
            await pool.query(
              `INSERT INTO transactions (user_id, title, amount, type, category, date, description, source)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [tx.user_id, tx.title, tx.amount, tx.type, tx.category, tx.date, tx.description, tx.source]
            );
          } catch (_) { /* skip duplicates */ }
        }
        console.log(`[AA Webhook FI_DATA_READY] Ingested ${transactions.length} txns for user ${userId}`);
      }
    }
  } catch (err) {
    console.error('[AA] webhook processing error:', err.message);
    // Never error-respond to Setu (already sent 200 above)
  }
};
