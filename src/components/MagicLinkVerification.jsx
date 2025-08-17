import React, { useEffect, useState } from 'react';
import { useMagicLinkAuth } from '../contexts/MagicLinkAuthContext.jsx';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const MagicLinkVerification = () => {
  const { verifyMagicLink, authState, error } = useMagicLinkAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [verificationError, setVerificationError] = useState(null);

  useEffect(() => {
    const processVerification = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const token = urlParams.get('token');

        if (!email || !token) {
          throw new Error('Invalid magic link. Missing email or token.');
        }

        // Verify the magic link
        await verifyMagicLink(email, token);
        
        // Redirect to the main application after successful verification
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        
      } catch (error) {
        console.error('Magic link verification error:', error);
        setVerificationError(error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    processVerification();
  }, [verifyMagicLink]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Magic Link
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your authentication...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {verificationError}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'authenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              You have been successfully signed in. Redirecting to the application...
            </p>
            <div className="animate-pulse">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MagicLinkVerification;
