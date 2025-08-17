import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const { handleOAuthCallback, authState, error } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        // Check for OAuth errors
        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }

        // Get stored OAuth data from session storage
        const storedState = sessionStorage.getItem('oauth_state');
        const storedCodeVerifier = sessionStorage.getItem('oauth_code_verifier');
        const storedProvider = sessionStorage.getItem('oauth_provider');

        if (!storedState || !storedProvider) {
          throw new Error('OAuth session data not found. Please try logging in again.');
        }

        // Process the OAuth callback
        await handleOAuthCallback(storedProvider, code, state, storedState, storedCodeVerifier);

        // Clear OAuth session data
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_provider');

        // Redirect to the main application
        window.location.href = '/';
      } catch (error) {
        console.error('OAuth callback processing error:', error);
        setProcessingError(error.message);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [handleOAuthCallback]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your sign-in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (processingError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {processingError}
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
              You have been successfully signed in. Redirecting...
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

export default OAuthCallback;
