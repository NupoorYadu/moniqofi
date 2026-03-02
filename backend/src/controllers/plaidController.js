const plaidClient = require("../config/plaid");
const pool = require("../config/db");
const { Products } = require("plaid");
const { webcrypto, createHash } = require("crypto");
const { subtle } = webcrypto;

/* ──────────────────────────────────────
   Plaid Webhook Signature Verifier
   Uses ES256 (ECDSA P-256) + Node WebCrypto
   ────────────────────────────────────── */
const _jwkCache = new Map();

async function verifyPlaidWebhook(req) {
  const plaidJwt = req.headers["plaid-verification"];
  if (!plaidJwt) return false;
  try {
    const [rawHeader, rawPayload, rawSig] = plaidJwt.split(".");
    const header  = JSON.parse(Buffer.from(rawHeader,  "base64url").toString());
    const payload = JSON.parse(Buffer.from(rawPayload, "base64url").toString());
    const kid = header.kid;
    if (!kid) return false;

    // Fetch + cache Plaid's public JWK (5-min TTL)
    let jwk = _jwkCache.get(kid);
    if (!jwk) {
      const r = await plaidClient.webhookVerificationKeyGet({ key_id: kid });
      jwk = r.data.key;
      _jwkCache.set(kid, jwk);
      setTimeout(() => _jwkCache.delete(kid), 5 * 60 * 1000);
    }

    // Verify ES256 signature
    const key = await subtle.importKey(
      "jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]
    );
    const valid = await subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      Buffer.from(rawSig, "base64url"),
      Buffer.from(`${rawHeader}.${rawPayload}`)
    );
    if (!valid) return false;

    // Verify body hash
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const bodyHash = createHash("sha256").update(rawBody).digest("hex");
    return payload.request_body_sha256 === bodyHash;
  } catch (e) {
    console.error("Webhook verification error:", e.message);
    return false;
  }
}

/* ──────────────────────────────────────
   1. Create a Link token (frontend uses
      this to open the Plaid Link UI)
   ────────────────────────────────────── */
exports.createLinkToken = async (req, res) => {
  try {
    const userId = String(req.user.userId);

    // Country codes from env (e.g. PLAID_COUNTRY_CODES=US,GB,CA) — default US
    const countryCodes = (process.env.PLAID_COUNTRY_CODES || "US")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "MoniqoFi",
      products: [Products.Transactions],
      country_codes: countryCodes,
      language: "en",
      // Register real-time webhook so Plaid pushes new transactions immediately
      ...(process.env.PLAID_WEBHOOK_URL && {
        webhook: process.env.PLAID_WEBHOOK_URL,
      }),
      // Optional: for mobile
      ...(req.body.platform === "mobile" && {
        android_package_name: "com.moniqofi.app",
      }),
    });

    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Plaid linkTokenCreate error:", error?.response?.data || error);
    res.status(500).json({ message: "Failed to create link token" });
  }
};

/* ──────────────────────────────────────
   2. Exchange public token → access token
      and persist the linked account.
   ────────────────────────────────────── */
exports.exchangeToken = async (req, res) => {
  try {
    const { public_token, metadata } = req.body;
    const userId = req.user.userId;

    if (!public_token) {
      return res.status(400).json({ message: "public_token is required" });
    }

    // Exchange public token for persistent access_token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeRes.data;

    // Grab institution info from metadata (sent by Plaid Link)
    const instName = metadata?.institution?.name || "Unknown Bank";
    const instId = metadata?.institution?.institution_id || null;
    const account = metadata?.accounts?.[0] || {};

    // Save linked account
    const result = await pool.query(
      `INSERT INTO linked_accounts
        (user_id, institution_name, institution_id, access_token, item_id,
         account_id, account_name, account_mask, account_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (item_id) DO UPDATE SET status = 'active'
       RETURNING id, institution_name, account_name, account_mask, account_type, status, created_at`,
      [
        userId,
        instName,
        instId,
        access_token,
        item_id,
        account.id || null,
        account.name || null,
        account.mask || null,
        account.type || null,
      ]
    );

    // Trigger initial transaction sync in background
    syncTransactionsForItem(userId, result.rows[0].id, access_token).catch((e) =>
      console.error("Initial sync failed:", e)
    );

    res.json({
      message: "Bank account linked successfully",
      account: result.rows[0],
    });
  } catch (error) {
    console.error("Plaid exchangeToken error:", error?.response?.data || error);
    res.status(500).json({ message: "Failed to link bank account" });
  }
};

/* ──────────────────────────────────────
   3. Get all linked accounts for user
   ────────────────────────────────────── */
exports.getLinkedAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, institution_name, account_name, account_mask, account_type,
              status, last_synced, created_at
       FROM linked_accounts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ──────────────────────────────────────
   4. Remove (unlink) a bank account
   ────────────────────────────────────── */
exports.unlinkAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const acct = await pool.query(
      `SELECT access_token, item_id FROM linked_accounts WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (acct.rows.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Remove item from Plaid
    try {
      await plaidClient.itemRemove({ access_token: acct.rows[0].access_token });
    } catch (_) {
      // Plaid might already have revoked it — continue anyway
    }

    await pool.query(
      `UPDATE linked_accounts SET status = 'removed' WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Account unlinked" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ──────────────────────────────────────
   5. Manual sync trigger — pull latest
      transactions for all linked accounts
   ────────────────────────────────────── */
exports.syncAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const accounts = await pool.query(
      `SELECT id, access_token FROM linked_accounts
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (accounts.rows.length === 0) {
      return res.json({ message: "No linked accounts to sync", synced: 0 });
    }

    let totalSynced = 0;

    for (const acct of accounts.rows) {
      const count = await syncTransactionsForItem(userId, acct.id, acct.access_token);
      totalSynced += count;
    }

    res.json({ message: `Synced ${totalSynced} new transactions`, synced: totalSynced });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: "Sync failed" });
  }
};

/* ──────────────────────────────────────
   6. Plaid Webhook handler (for auto-
      sync when new transactions arrive)
   ────────────────────────────────────── */
exports.webhook = async (req, res) => {
  // Verify Plaid's JWT signature in production to reject spoofed webhooks
  if (process.env.NODE_ENV === "production") {
    const valid = await verifyPlaidWebhook(req);
    if (!valid) {
      console.warn("Plaid webhook: signature verification failed — rejected");
      return res.sendStatus(400);
    }
  }

  try {
    const { webhook_type, webhook_code, item_id } = req.body;

    if (webhook_type === "TRANSACTIONS") {
      if (["SYNC_UPDATES_AVAILABLE", "DEFAULT_UPDATE", "INITIAL_UPDATE", "HISTORICAL_UPDATE"].includes(webhook_code)) {
        // Find the account and sync
        const acct = await pool.query(
          `SELECT la.id, la.user_id, la.access_token
           FROM linked_accounts la
           WHERE la.item_id = $1 AND la.status = 'active'`,
          [item_id]
        );

        if (acct.rows.length > 0) {
          const { id, user_id, access_token } = acct.rows[0];
          await syncTransactionsForItem(user_id, id, access_token);
          console.log(`Webhook sync completed for item ${item_id}`);
        }
      }
    }

    // Always respond 200 to webhooks
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(200); // Still respond 200 to avoid retries
  }
};

/* ──────────────────────────────────────
   7. Real-time account balances
      Calls Plaid's /accounts/balance/get
      which returns live balances from
      the institution in real time.
   ────────────────────────────────────── */
exports.getBalances = async (req, res) => {
  try {
    const userId = req.user.userId;

    const accounts = await pool.query(
      `SELECT id, institution_name, account_name, account_mask, account_type, access_token
       FROM linked_accounts
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    if (accounts.rows.length === 0) return res.json([]);

    const results = await Promise.allSettled(
      accounts.rows.map(async (acct) => {
        const r = await plaidClient.accountsBalanceGet({ access_token: acct.access_token });
        return r.data.accounts.map((a) => ({
          linked_account_id: acct.id,
          institution_name:  acct.institution_name,
          account_name:      a.official_name || a.name,
          account_mask:      a.mask,
          account_type:      a.type,
          account_subtype:   a.subtype,
          balance_available: a.balances.available,
          balance_current:   a.balances.current,
          balance_limit:     a.balances.limit,
          currency:          a.balances.iso_currency_code || a.balances.unofficial_currency_code,
        }));
      })
    );

    const balances = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value);

    res.json(balances);
  } catch (error) {
    console.error("getBalances error:", error?.response?.data || error);
    res.status(500).json({ message: "Failed to fetch live balances" });
  }
};

/* ──────────────────────────────────────
   HELPER: Sync transactions for a single
   linked account using Plaid Sync API
   ────────────────────────────────────── */
async function syncTransactionsForItem(userId, linkedAccountId, accessToken) {
  let cursor = null;
  let added = [];
  let modified = [];
  let removed = [];
  let hasMore = true;

  // Get saved cursor
  const cursorResult = await pool.query(
    `SELECT cursor FROM linked_accounts WHERE id = $1`,
    [linkedAccountId]
  );
  cursor = cursorResult.rows[0]?.cursor || null;

  // Paginate through all updates
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: cursor || undefined,
      count: 100,
    });

    const data = response.data;
    added = added.concat(data.added);
    modified = modified.concat(data.modified);
    removed = removed.concat(data.removed);
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  // Process ADDED transactions
  for (const txn of added) {
    const amount = Math.abs(txn.amount); // Plaid uses positive = debit
    const type = txn.amount > 0 ? "expense" : "income"; // Plaid: positive = money out
    const category = mapPlaidCategory(txn.personal_finance_category?.primary || txn.category?.[0]);
    const title = txn.merchant_name || txn.name || "Bank Transaction";

    await pool.query(
      `INSERT INTO transactions
        (user_id, title, amount, type, category, source, plaid_transaction_id,
         linked_account_id, merchant_name, pending)
       VALUES ($1,$2,$3,$4,$5,'bank',$6,$7,$8,$9)
       ON CONFLICT (plaid_transaction_id) DO NOTHING`,
      [
        userId,
        title.substring(0, 100),
        amount,
        type,
        category,
        txn.transaction_id,
        linkedAccountId,
        txn.merchant_name || null,
        txn.pending || false,
      ]
    );
  }

  // Process MODIFIED transactions
  for (const txn of modified) {
    const amount = Math.abs(txn.amount);
    const type = txn.amount > 0 ? "expense" : "income";
    const category = mapPlaidCategory(txn.personal_finance_category?.primary || txn.category?.[0]);
    const title = txn.merchant_name || txn.name || "Bank Transaction";

    await pool.query(
      `UPDATE transactions
       SET title = $1, amount = $2, type = $3, category = $4,
           merchant_name = $5, pending = $6
       WHERE plaid_transaction_id = $7 AND user_id = $8`,
      [
        title.substring(0, 100),
        amount,
        type,
        category,
        txn.merchant_name || null,
        txn.pending || false,
        txn.transaction_id,
        userId,
      ]
    );
  }

  // Process REMOVED transactions
  for (const txn of removed) {
    await pool.query(
      `DELETE FROM transactions WHERE plaid_transaction_id = $1 AND user_id = $2`,
      [txn.transaction_id, userId]
    );
  }

  // Update cursor and last_synced
  await pool.query(
    `UPDATE linked_accounts SET cursor = $1, last_synced = NOW() WHERE id = $2`,
    [cursor, linkedAccountId]
  );

  return added.length;
}

/* ──────────────────────────────────────
   HELPER: Map Plaid categories to our
   app's category system
   ────────────────────────────────────── */
function mapPlaidCategory(plaidCategory) {
  if (!plaidCategory) return "Other";

  const map = {
    // Plaid personal_finance_category primary values
    FOOD_AND_DRINK: "Food",
    GROCERIES: "Food",
    RESTAURANTS: "Food",
    TRANSPORTATION: "Transport",
    TRAVEL: "Transport",
    RENT_AND_UTILITIES: "Bills",
    UTILITIES: "Bills",
    TELECOM: "Bills",
    ENTERTAINMENT: "Entertainment",
    RECREATION: "Entertainment",
    SHOPPING: "Shopping",
    GENERAL_MERCHANDISE: "Shopping",
    PERSONAL_CARE: "Health",
    MEDICAL: "Health",
    HEALTHCARE: "Health",
    EDUCATION: "Education",
    INCOME: "Income",
    TRANSFER_IN: "Income",
    TRANSFER_OUT: "Transfer",
    LOAN_PAYMENTS: "EMI",
    BANK_FEES: "Bills",
    GOVERNMENT_AND_NON_PROFIT: "Other",

    // Legacy Plaid category strings
    "Food and Drink": "Food",
    Transfer: "Transfer",
    Payment: "Bills",
    Travel: "Transport",
    Shops: "Shopping",
    Recreation: "Entertainment",
    "Healthcare": "Health",
    Service: "Bills",
  };

  return map[plaidCategory] || "Other";
}
