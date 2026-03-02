/**
 * Run once to create the linked_accounts table and add source columns to transactions.
 * Usage: node src/migrations/plaid_tables.js
 */
const pool = require("../config/db");

async function migrate() {
  try {
    // Table to store Plaid-linked bank/payment accounts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS linked_accounts (
        id            SERIAL PRIMARY KEY,
        user_id       TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        institution_id   TEXT,
        access_token  TEXT NOT NULL,
        item_id       TEXT NOT NULL UNIQUE,
        account_id    TEXT,
        account_name  TEXT,
        account_mask  TEXT,
        account_type  TEXT,
        cursor        TEXT,
        status        TEXT DEFAULT 'active',
        last_synced   TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("✔  linked_accounts table created");

    // Add source tracking to transactions table
    await pool.query(`
      ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS linked_account_id INTEGER,
        ADD COLUMN IF NOT EXISTS merchant_name TEXT,
        ADD COLUMN IF NOT EXISTS pending BOOLEAN DEFAULT false;
    `);
    console.log("✔  transactions table updated with source columns");

    console.log("\nMigration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
