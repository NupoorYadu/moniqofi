/**
 * Run this once to create the Setu Account Aggregator tables.
 * Usage:  node src/migrations/aa_tables.js
 */

require('dotenv').config();
const pool = require('../config/db');

const sql = `
-- Stores consent requests created on behalf of users
CREATE TABLE IF NOT EXISTS aa_consents (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  consent_id     TEXT UNIQUE NOT NULL,       -- Setu-generated UUID (request ID)
  status         TEXT NOT NULL DEFAULT 'PENDING',
  redirect_url   TEXT,
  vua            TEXT,                        -- Virtual user address  e.g. 9999999999@setu
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores data-fetch sessions (one per data-pull against an approved consent)
CREATE TABLE IF NOT EXISTS aa_sessions (
  id           SERIAL PRIMARY KEY,
  consent_id   TEXT NOT NULL REFERENCES aa_consents(consent_id) ON DELETE CASCADE,
  session_id   TEXT UNIQUE NOT NULL,          -- Setu-generated data session UUID
  status       TEXT NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on aa_consents
CREATE OR REPLACE FUNCTION update_aa_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aa_consents_updated_at ON aa_consents;
CREATE TRIGGER trg_aa_consents_updated_at
  BEFORE UPDATE ON aa_consents
  FOR EACH ROW EXECUTE FUNCTION update_aa_consents_updated_at();

-- Auto-update updated_at on aa_sessions
CREATE OR REPLACE FUNCTION update_aa_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aa_sessions_updated_at ON aa_sessions;
CREATE TRIGGER trg_aa_sessions_updated_at
  BEFORE UPDATE ON aa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_aa_sessions_updated_at();
`;

(async () => {
  const client = await pool.connect();
  try {
    console.log('Running AA tables migration…');
    await client.query(sql);
    console.log('✅ aa_consents and aa_sessions tables ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
