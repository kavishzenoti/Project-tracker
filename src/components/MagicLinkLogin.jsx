import React, { useState } from 'react';
// Removed unused auth hook and magic-link helpers
// import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';
// import { createMagicLink } from '../utils/magicLink.js';
import { 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const MagicLinkLogin = () => {
  // Removed unused context values
  // const { authState, error } = useMagicLinkAuth();
  
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    // Validate email format and domain
    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!email.endsWith('@zenoti.com')) {
      setLocalError('Only @zenoti.com emails are allowed');
      return;
    }

    try {
      setIsSendingCode(true);

      if (API_BASE) {
        // Secure path: call serverless API to send the code
        const resp = await fetch(`${API_BASE.replace(/\/$/, '')}/api/send-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.token) {
          throw new Error(data.error || 'Failed to send code');
        }
        // Store verification token for next step
        localStorage.setItem('verification_token', data.token);
        setCodeSent(true);
        setSuccess(`Verification code sent to ${email}`);
      } else {
        // Demo fallback: local generation (no real email)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('verification_code', JSON.stringify({
          email,
          code,
          expiresAt: Date.now() + (10 * 60 * 1000)
        }));
        setCodeSent(true);
        setSuccess(`Verification code (demo) generated. Check console.`);
        console.log(`Demo: Verification code for ${email}: ${code}`);
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!verificationCode || verificationCode.length !== 6) {
      setLocalError('Please enter the 6-digit verification code');
      return;
    }

    try {
      setIsVerifying(true);

      if (API_BASE) {
        const token = localStorage.getItem('verification_token');
        if (!token) {
          throw new Error('Missing verification token. Please request a new code.');
        }
        const resp = await fetch(`${API_BASE.replace(/\/$/, '')}/api/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: verificationCode, token }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.success || !data.user) {
          throw new Error(data.error || 'Verification failed');
        }
        // Persist session
        localStorage.setItem('auth_user', JSON.stringify({
          user: data.user,
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        }));
        // Clean temp token
        localStorage.removeItem('verification_token');
      } else {
        // Demo fallback verification
        const stored = JSON.parse(localStorage.getItem('verification_code') || 'null');
        if (!stored || stored.email !== email) {
          setLocalError('Verification code expired. Please request a new one.');
          return;
        }
        if (Date.now() > stored.expiresAt) {
          setLocalError('Verification code expired. Please request a new one.');
          localStorage.removeItem('verification_code');
          return;
        }
        if (stored.code !== verificationCode) {
          setLocalError('Invalid verification code. Please try again.');
          return;
        }
        const userInfo = {
          id: Date.now(),
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          role: 'Design System User',
          isAdmin: email.endsWith('@zenoti.com')
        };
        localStorage.setItem('auth_user', JSON.stringify({ user: userInfo, expiresAt: Date.now() + (24 * 60 * 60 * 1000) }));
        localStorage.removeItem('verification_code');
      }

      setSuccess('Authentication successful! Redirecting...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setLocalError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Design System Tracker</h1>
            <p className="text-gray-600">Sign in with your work email</p>
          </div>

          {!codeSent ? (
            // Step 1: Enter email
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.name@zenoti.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {localError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingCode}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Verification Code
                  </>
                )}
              </button>
            </form>
          ) : (
            // Step 2: Enter verification code
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {localError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {localError}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify & Sign In
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                  setLocalError('');
                  setSuccess('');
                }}
                className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Email
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-400 space-y-1">
              <p>• No passwords to remember</p>
              <p>• Secure email verification</p>
              <p>• Only @zenoti.com emails allowed</p>
              <p>• Quick and simple access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkLogin;
