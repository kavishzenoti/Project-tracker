import React, { useState } from 'react';
import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';
import { createMagicLink } from '../utils/magicLink.js';
import { 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowLeft,
  Copy,
  ExternalLink
} from 'lucide-react';

const MagicLinkLogin = () => {
  const { 
    authState, 
    error, 
    sendMagicLink, 
    verifyMagicLink, 
    isSendingLink 
  } = useMagicLinkAuth();
  
  const [email, setEmail] = useState('');
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    
    try {
      const result = await sendMagicLink(email);
      if (result.success) {
        setIsLinkSent(true);
        // For demo purposes, show the magic link directly (with correct base path on GitHub Pages)
        const demoLink = createMagicLink(email, 'demo-token', window.location.origin);
        setMagicLink(demoLink);
      }
    } catch (error) {
      // Error is handled by the context
      console.error('Failed to send magic link:', error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Magic Link Sent!
            </h1>
            <p className="text-gray-600">
              We've sent a secure login link to <strong>{email}</strong>
            </p>
          </div>

          {/* Magic Link Display */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Your Magic Link:
            </div>
            <div className="text-xs text-blue-700 break-all mb-3 p-2 bg-white rounded border">
              {magicLink}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleOpenLink}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Link
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-medium text-gray-900 mb-2">How to use:</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Copy the magic link above</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Open it in a new tab or window</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>You'll be automatically logged in</span>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your Design System Tracker account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSendMagicLink} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSendingLink}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!email.trim() || isSendingLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSendingLink ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Send Magic Link
              </>
            )}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
            <Lock className="w-3 h-3" />
            <span>Secure Magic Link Authentication</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• No passwords to remember</p>
            <p>• Links expire in 1 hour</p>
            <p>• Secure token-based authentication</p>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs text-yellow-800 text-center">
            <strong>Demo Mode:</strong> Magic links are logged to the console. 
            In production, integrate with a real email service.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkLogin;
