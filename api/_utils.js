// Utility helpers for serverless endpoints (ESM)
import crypto from 'crypto';

export const base64urlEncode = (input) => {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export const base64urlDecode = (input) => {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf8');
};

export const hmacSha256 = (secret, data) => {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
};

export const signPayload = (secret, payload) => {
  const payloadB64 = base64urlEncode(payload);
  const signature = hmacSha256(secret, payloadB64);
  return `${payloadB64}.${signature}`;
};

export const verifySignature = (secret, token) => {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  const expected = hmacSha256(secret, payloadB64);
  if (signature !== expected) return null;
  try {
    const json = base64urlDecode(payloadB64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const hashCode = (secret, code) => hmacSha256(secret, String(code));

export const allowCors = (req, res, allowedOrigins = []) => {
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.some((o) => o && origin && origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

export const parseJson = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
};


