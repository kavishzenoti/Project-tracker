import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  buildAuthUrl, 
  exchangeCodeForToken, 
  getUserInfo, 
  generateRandomState, 
  generatePKCEChallenge,
  storeAuthData, 
  getStoredAuthData, 
  clearStoredAuthData,
  isAuthenticated,
  getCurrentUser
} from '../utils/auth.js';
import { SSO_PROVIDERS, AUTH_STATES } from '../config/auth.js';

// Create authentication context
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AUTH_STATES.LOADING);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setAuthState(AUTH_STATES.AUTHENTICATED);
          } else {
            // Clear invalid data
            clearStoredAuthData();
            setAuthState(AUTH_STATES.UNAUTHENTICATED);
          }
        } else {
          setAuthState(AUTH_STATES.UNAUTHENTICATED);
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        setError(error.message);
        setAuthState(AUTH_STATES.ERROR);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (provider, code, state, storedState) => {
    try {
      setAuthState(AUTH_STATES.LOADING);
      setError(null);

      // Verify state parameter for CSRF protection
      if (state !== storedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
      }

      // Exchange code for token
      const tokenData = await exchangeCodeForToken(provider, code);
      
      if (!tokenData.access_token) {
        throw new Error('No access token received from provider');
      }

      // Get user information
      const userInfo = await getUserInfo(provider, tokenData.access_token);
      
      // Store authentication data
      const authData = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type,
        user: userInfo,
        provider
      };
      
      storeAuthData(authData);
      
      // Update state
      setUser(userInfo);
      setAuthState(AUTH_STATES.AUTHENTICATED);
      
      return userInfo;
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError(error.message);
      setAuthState(AUTH_STATES.ERROR);
      throw error;
    }
  }, []);

  // Initiate OAuth flow
  const login = useCallback(async (provider) => {
    try {
      console.log('Starting OAuth flow for provider:', provider);
      setAuthState(AUTH_STATES.LOADING);
      setError(null);

      // Generate state and PKCE challenge for security
      const state = generateRandomState();
      console.log('Generated state:', state);
      
      const { codeVerifier, codeChallenge } = await generatePKCEChallenge();
      console.log('Generated PKCE challenge:', { codeVerifier: codeVerifier.substring(0, 10) + '...', codeChallenge: codeChallenge.substring(0, 10) + '...' });
      
      // Store state and code verifier for callback
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_provider', provider);
      
      // Build authorization URL
      const authUrl = buildAuthUrl(provider, state, codeChallenge);
      console.log('Built auth URL:', authUrl);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setAuthState(AUTH_STATES.ERROR);
    }
  }, []);

  // Logout user
  const logout = useCallback(() => {
    try {
      // Clear stored authentication data
      clearStoredAuthData();
      
      // Clear session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_provider');
      
      // Reset state
      setUser(null);
      setError(null);
      setAuthState(AUTH_STATES.UNAUTHENTICATED);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Refresh authentication (if needed)
  const refreshAuth = useCallback(async () => {
    try {
      const authData = getStoredAuthData();
      if (!authData || !authData.refreshToken) {
        throw new Error('No refresh token available');
      }

      // In a real application, you would use the refresh token to get a new access token
      // For now, we'll just check if the current token is still valid
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setAuthState(AUTH_STATES.AUTHENTICATED);
          return;
        }
      }

      // If we get here, the token is invalid, so logout
      logout();
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
    }
  }, [logout]);

  // Check if user has specific role or permission
  const hasRole = useCallback((role) => {
    if (!user) return false;
    // You can implement role-based access control here
    // For now, we'll check if the user is an admin based on email domain
    return user.email && user.email.endsWith('@zenoti.com');
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    // Implement permission checking logic here
    return true; // For now, all authenticated users have all permissions
  }, [user]);

  // Context value
  const value = {
    // State
    authState,
    user,
    error,
    isInitializing,
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    
    // Methods
    login,
    logout,
    refreshAuth,
    handleOAuthCallback,
    hasRole,
    hasPermission,
    
    // Constants
    AUTH_STATES,
    SSO_PROVIDERS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
