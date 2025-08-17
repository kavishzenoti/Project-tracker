// SSO Authentication Configuration
export const AUTH_CONFIG = {
  // Google OAuth2 Configuration
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scope: 'openid email profile',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    issuer: 'https://accounts.google.com'
  },

  // Microsoft Azure AD Configuration
  microsoft: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
    clientSecret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret',
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scope: 'openid email profile',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    issuer: 'https://login.microsoftonline.com'
  },

  // Generic OAuth2 Configuration (for other providers)
  generic: {
    clientId: import.meta.env.VITE_GENERIC_CLIENT_ID || 'your-generic-client-id',
    clientSecret: import.meta.env.VITE_GENERIC_CLIENT_SECRET || 'your-generic-client-secret',
    redirectUri: import.meta.env.VITE_GENERIC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scope: 'openid email profile',
    authUrl: import.meta.env.VITE_GENERIC_AUTH_URL || 'https://your-provider.com/oauth/authorize',
    tokenUrl: import.meta.env.VITE_GENERIC_TOKEN_URL || 'https://your-provider.com/oauth/token',
    userInfoUrl: import.meta.env.VITE_GENERIC_USER_INFO_URL || 'https://your-provider.com/userinfo',
    issuer: import.meta.env.VITE_GENERIC_ISSUER || 'https://your-provider.com'
  }
};

// Environment variables for configuration
export const ENV_VARS = {
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_MICROSOFT_CLIENT_ID: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
  VITE_GENERIC_CLIENT_ID: import.meta.env.VITE_GENERIC_CLIENT_ID,
  VITE_GOOGLE_REDIRECT_URI: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
  VITE_MICROSOFT_REDIRECT_URI: import.meta.env.VITE_MICROSOFT_REDIRECT_URI,
  VITE_GENERIC_REDIRECT_URI: import.meta.env.VITE_GENERIC_REDIRECT_URI
};

// SSO Provider types
export const SSO_PROVIDERS = {
  GOOGLE: 'google',
  MICROSOFT: 'microsoft',
  GENERIC: 'generic'
};

// Authentication state constants
export const AUTH_STATES = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  LOADING: 'loading',
  ERROR: 'error'
};
