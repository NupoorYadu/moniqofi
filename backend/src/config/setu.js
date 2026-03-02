/**
 * Setu Account Aggregator (AA) configuration
 * India's RBI-regulated open banking framework – equivalent to Plaid for India.
 *
 * Sandbox signup: https://bridge.setu.co/v2/signup
 * Credentials live in Bridge → Product → App credentials
 */

const axios = require('axios');

const BASE_URL = process.env.SETU_BASE_URL || 'https://fiu-sandbox.setu.co';
const CLIENT_ID = process.env.SETU_CLIENT_ID;
const CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;

// ─── Token cache ───────────────────────────────────────────────────────────────
let _tokenCache = { token: null, expiresAt: 0 };

/**
 * Fetch (or return a cached) Bearer token from Setu.
 * Token TTL defaults to 3600 s; we refresh 60 s early.
 */
async function getSetuToken() {
  const now = Date.now();
  if (_tokenCache.token && now < _tokenCache.expiresAt) {
    return _tokenCache.token;
  }

  const response = await axios.post(
    `${BASE_URL}/auth/token`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        'x-client_id': CLIENT_ID,
        'x-client-secret': CLIENT_SECRET,
      },
    }
  );

  // Setu returns { accessToken, expiresIn } (seconds)
  const { accessToken, expiresIn = 3600 } = response.data;
  _tokenCache = {
    token: accessToken,
    expiresAt: now + (expiresIn - 60) * 1000,
  };

  return accessToken;
}

/**
 * Returns an axios instance with Setu auth headers pre-set.
 */
async function setuClient() {
  const token = await getSetuToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-product-instance-id': PRODUCT_INSTANCE_ID,
    },
    timeout: 15000,
  });
}

module.exports = { setuClient, BASE_URL, PRODUCT_INSTANCE_ID };
