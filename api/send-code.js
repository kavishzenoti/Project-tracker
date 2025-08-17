// POST /api/send-code
// Body: { email }
// Sends a 6-digit code via Resend; returns a stateless token for later verification

import { Resend } from 'resend';
import { allowCors, parseJson, signPayload, hashCode } from './_utils.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.AUTH_FROM_EMAIL; // e.g. "Project Tracker <no-reply@yourdomain.com>"
const HMAC_SECRET = process.env.AUTH_HMAC_SECRET; // random long secret
const APP_ORIGINS = (process.env.APP_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  if (allowCors(req, res, APP_ORIGINS)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!resend || !FROM_EMAIL || !HMAC_SECRET) {
      return res.status(500).json({ error: 'Server not configured for email' });
    }
    const { email } = await parseJson(req);
    if (!email || !email.includes('@') || !email.endsWith('@zenoti.com')) {
      return res.status(400).json({ error: 'Invalid or unauthorized email' });
    }

    // Generate code and stateless token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = hashCode(HMAC_SECRET, code);
    const payload = {
      email,
      codeHash,
      exp: Date.now() + 10 * 60 * 1000, // 10 minutes
      iat: Date.now()
    };
    const token = signPayload(HMAC_SECRET, payload);

    // Send email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}. It will expire in 10 minutes.`,
    });

    // For debugging, do not return the code; return token only
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('send-code error:', err);
    return res.status(500).json({ error: 'Failed to send code' });
  }
}


