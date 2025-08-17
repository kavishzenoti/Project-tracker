import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { SSO_PROVIDERS } from '../config/auth.js';
import { 
  Chrome, 
  Mail, 
  Building2, 
  Lock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const SSOLogin = () => {
  const { login, authState, error } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    issuer: ''
  });

  const handleProviderLogin = async (provider) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with provider:', provider);
      await login(provider);
    } catch (error) {
      console.error('Login error:', error);
      // Show error to user
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomLogin = async () => {
    if (!customConfig.clientId || !customConfig.clientSecret || !customConfig.authUrl) {
      return;
    }

    try {
      setIsLoading(true);
      // For custom providers, you would need to implement custom logic
      // This is a placeholder for demonstration
      console.log('Custom provider configuration:', customConfig);
    } catch (error) {
      console.error('Custom login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const providers = [
    {
      id: SSO_PROVIDERS.GOOGLE,
      name: 'Google',
      description: 'Sign in with your Google account',
      icon: Chrome,
      color: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50'
    },
    {
      id: SSO_PROVIDERS.MICROSOFT,
      name: 'Microsoft',
      description: 'Sign in with your Microsoft account',
      icon: Building2,
      color: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    }
  ];

  if (authState === 'loading' || authState === 'authenticated') {
    return null;
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

        {/* SSO Providers */}
        <div className="space-y-4 mb-6">
          {providers.map((provider) => {
            const IconComponent = provider.icon;
            return (
              <button
                key={provider.id}
                onClick={() => handleProviderLogin(provider.id)}
                disabled={isLoading}
                className={`w-full p-4 rounded-xl border-2 ${provider.borderColor} ${provider.bgColor} hover:shadow-lg transition-all duration-200 group ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${provider.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className={`font-semibold ${provider.textColor}`}>
                      {provider.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {provider.description}
                    </div>
                  </div>
                  {isLoading && (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 py-2"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {/* Custom OAuth2 Configuration */}
        {showAdvanced && (
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 text-sm">Custom OAuth2 Provider</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client ID
              </label>
              <input
                type="text"
                value={customConfig.clientId}
                onChange={(e) => setCustomConfig(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-client-id"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client Secret
              </label>
              <input
                type="password"
                value={customConfig.clientSecret}
                onChange={(e) => setCustomConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-client-secret"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Authorization URL
              </label>
              <input
                type="url"
                value={customConfig.authUrl}
                onChange={(e) => setCustomConfig(prev => ({ ...prev, authUrl: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://your-provider.com/oauth/authorize"
              />
            </div>

            <button
              onClick={handleCustomLogin}
              disabled={!customConfig.clientId || !customConfig.clientSecret || !customConfig.authUrl || isLoading}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Configure Custom Provider
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-2">
            <Lock className="w-3 h-3" />
            <span>Secure OAuth2 Authentication</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Your credentials are never stored locally</p>
            <p>• All communication is encrypted via HTTPS</p>
            <p>• PKCE flow ensures maximum security</p>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Redirecting to provider...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSOLogin;
