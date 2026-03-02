/**
 * Migration: Add email verification columns to users table.
 * Run once: node src/migrations/email_verification.js
 */
require("dotenv").config();
const pool = require("../config/db");

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_token TEXT,
        ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ
    `);

    console.log("✓ email_verified, verification_token, verification_token_expiry columns added to users table");

    // Mark existing users as verified (they signed up before this feature)
    await pool.query(`UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE`);
    console.log("✓ Existing users marked as verified");

    pool.end();
  } catch (err) {
    console.error("Migration failed:", err.message);
    pool.end();
    process.exit(1);
  }
}

migrate();
