// POST /api/verify-code
// Body: { email, code, token }
// Verifies code using HMAC-signed token (stateless)

import { allowCors, parseJson, verifySignature, hashCode } from './_utils.js';

const HMAC_SECRET = process.env.AUTH_HMAC_SECRET;
const APP_ORIGINS = (process.env.APP_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  if (allowCors(req, res, APP_ORIGINS)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!HMAC_SECRET) return res.status(500).json({ error: 'Server not configured' });
    const { email, code, token } = await parseJson(req);
    if (!email || !email.endsWith('@zenoti.com') || !code || !token) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    const payload = verifySignature(HMAC_SECRET, token);
    if (!payload) return res.status(400).json({ error: 'Invalid token' });
    if (payload.email !== email) return res.status(400).json({ error: 'Email mismatch' });
    if (Date.now() > payload.exp) return res.status(400).json({ error: 'Code expired' });

    const providedHash = hashCode(HMAC_SECRET, code);
    if (providedHash !== payload.codeHash) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Success: return minimal user profile
    const user = {
      email,
      name: email.split('@')[0],
      isAdmin: email.endsWith('@zenoti.com')
    };
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('verify-code error:', err);
    return res.status(500).json({ error: 'Verification failed' });
  }
}


