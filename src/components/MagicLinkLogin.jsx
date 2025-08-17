import React, { useState } from 'react';
import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';
import { createMagicLink } from '../utils/magicLink.js';
import { Mail, Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft, Copy, ExternalLink } from 'lucide-react';

const MagicLinkLogin = () => {
  const { authState, error, sendMagicLink, isSendingLink } = useMagicLinkAuth();

  const [email, setEmail] = useState('');
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    try {
      const result = await sendMagicLink(email);
      if (result?.success) {
        setIsLinkSent(true);
        // Demo: show the magic link so user can click it locally
        const demoLink = createMagicLink(email, 'demo-token', window.location.origin);
        setMagicLink(demoLink);
      }
    } catch (err) {
      // error is exposed via context; no-op here
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (_) {}
  };

  const handleOpenLink = () => {
    window.open(magicLink, '_blank');
  };

  const handleBackToLogin = () => {
    setIsLinkSent(false);
    setEmail('');
    setMagicLink('');
  };

  if (isLinkSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Magic Link Sent!</h1>
            <p className="text-gray-600">We've sent a secure login link to <strong>{email}</strong></p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Your Magic Link (demo):</div>
            <div className="text-xs text-blue-700 break-all mb-3 p-2 bg-white rounded border">{magicLink}</div>
            <div className="flex gap-2">
              <button onClick={handleCopyLink} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                {showCopied ? (<><CheckCircle className="w-4 h-4" />Copied!</>) : (<><Copy className="w-4 h-4" />Copy Link</>)}
              </button>
              <button onClick={handleOpenLink} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                <ExternalLink className="w-4 h-4" />Open Link
              </button>
            </div>
          </div>

          <button onClick={handleBackToLogin} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Login
          </button>
        </div>
      </div>
    );
  }

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

          <form onSubmit={handleSendMagicLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@zenoti.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSendingLink}
                />
              </div>
            </div>

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={!email.trim() || isSendingLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSendingLink ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Sending Magic Link...</>
              ) : (
                <><CheckCircle className="w-5 h-5" />Send Magic Link</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-400 space-y-1">
              <p>• No passwords to remember</p>
              <p>• Secure magic link authentication</p>
              <p>• Only authorized team members can access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkLogin;
