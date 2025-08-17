import { AUTH_CONFIG, SSO_PROVIDERS } from '../config/auth.js';

// Debug: Log the imported config
console.log('Auth config imported:', AUTH_CONFIG);
console.log('SSO providers imported:', SSO_PROVIDERS);

// Generate random state for CSRF protection
export const generateRandomState = () => {
  const array = new Uint8Array(32);
  
  // Use crypto.getRandomValues if available, otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Generate PKCE challenge for enhanced security
export const generatePKCEChallenge = async () => {
  const codeVerifier = generateRandomState();
  
  // Use crypto.subtle.digest if available, otherwise return a simplified challenge
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return { codeVerifier, codeChallenge };
    } catch (error) {
      console.warn('PKCE challenge generation failed, using simplified version:', error);
    }
  }
  
  // Fallback: use a simplified challenge (less secure but functional)
  const simplifiedChallenge = btoa(codeVerifier)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge: simplifiedChallenge };
};

// Build OAuth2 authorization URL
export const buildAuthUrl = (provider, state, codeChallenge = null) => {
  console.log('Building auth URL for provider:', provider);
  const config = AUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  console.log('Provider config:', {
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scope,
    authUrl: config.authUrl
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: state
  });

  // Add PKCE challenge if supported
  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  const finalUrl = `${config.authUrl}?${params.toString()}`;
  console.log('Final auth URL:', finalUrl);
  return finalUrl;
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (provider, code, codeVerifier = null) => {
  const config = AUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri
  });

  // Add PKCE verifier if used
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    return tokenData;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

// Get user information from the OAuth provider
export const getUserInfo = async (provider, accessToken) => {
  const config = AUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  try {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    return normalizeUserData(provider, userData);
  } catch (error) {
    console.error('User info fetch error:', error);
    throw error;
  }
};

// Normalize user data from different providers
export const normalizeUserData = (provider, userData) => {
  switch (provider) {
    case SSO_PROVIDERS.GOOGLE:
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.given_name,
        lastName: userData.family_name,
        picture: userData.picture,
        provider: 'google',
        verified: userData.verified_email
      };
    
    case SSO_PROVIDERS.MICROSOFT:
      return {
        id: userData.id,
        email: userData.mail || userData.userPrincipalName,
        name: userData.displayName,
        firstName: userData.givenName,
        lastName: userData.surname,
        picture: null, // Microsoft Graph doesn't provide profile picture by default
        provider: 'microsoft',
        verified: true // Azure AD users are verified by default
      };
    
    case SSO_PROVIDERS.GENERIC:
      return {
        id: userData.sub || userData.id,
        email: userData.email,
        name: userData.name,
        firstName: userData.given_name || userData.first_name,
        lastName: userData.family_name || userData.last_name,
        picture: userData.picture,
        provider: 'generic',
        verified: userData.email_verified || true
      };
    
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
};

// Validate JWT token (if provided by the OAuth provider)
export const validateJWT = (token) => {
  try {
    // This is a basic validation - in production, you should validate against the provider's public keys
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      throw new Error('Token has expired');
    }
    
    return payload;
  } catch (error) {
    console.error('JWT validation error:', error);
    throw error;
  }
};

// Store authentication data in localStorage
export const storeAuthData = (authData) => {
  try {
    localStorage.setItem('auth_data', JSON.stringify({
      ...authData,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to store auth data:', error);
  }
};

// Retrieve authentication data from localStorage
export const getStoredAuthData = () => {
  try {
    const data = localStorage.getItem('auth_data');
    if (!data) return null;
    
    const authData = JSON.parse(data);
    const currentTime = Date.now();
    
    // Check if data is older than 1 hour
    if (currentTime - authData.timestamp > 60 * 60 * 1000) {
      localStorage.removeItem('auth_data');
      return null;
    }
    
    return authData;
  } catch (error) {
    console.error('Failed to retrieve auth data:', error);
    return null;
  }
};

// Clear stored authentication data
export const clearStoredAuthData = () => {
  try {
    localStorage.removeItem('auth_data');
  } catch (error) {
    console.error('Failed to clear auth data:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const authData = getStoredAuthData();
  return authData && authData.accessToken;
};

// Get current user from stored data
export const getCurrentUser = () => {
  const authData = getStoredAuthData();
  return authData ? authData.user : null;
};
