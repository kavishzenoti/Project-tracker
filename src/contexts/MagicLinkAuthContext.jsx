import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  generateMagicToken, 
  createMagicLink, 
  sendMagicLinkEmail,
  storeMagicLinkData,
  getMagicLinkData,
  clearMagicLinkData,
  isMagicLinkAuthenticated,
  getMagicLinkUser,
  validateMagicToken
} from '../utils/magicLink.js';

// Team members list for email validation
const TEAM_MEMBERS = [
  { id: 7, name: "Adit", role: "Design System Governance", email: "aditk@zenoti.com", isAdmin: true },
  { id: 4, name: "Agam", role: "Design System Governance", email: "agamm@zenoti.com", isAdmin: false },
  { id: 1, name: "Charissa", role: "Design System Governance", email: "charissag@zenoti.com", isAdmin: false },
  { id: 6, name: "Kavish", role: "Design System Governance", email: "kavisht@zenoti.com", isAdmin: true },
  { id: 3, name: "Nitin", role: "Design System Governance", email: "nitinb@zenoti.com", isAdmin: false },
  { id: 2, name: "Praveen", role: "Design System Governance", email: "praveenh@zenoti.com", isAdmin: false },
  { id: 5, name: "Subhranta", role: "Design System Governance", email: "subhrantam@zenoti.com", isAdmin: false }
];

// Function to validate if email belongs to a team member
const validateTeamMemberEmail = (email) => {
  return TEAM_MEMBERS.some(member => member.email.toLowerCase() === email.toLowerCase());
};

// Create authentication context
const MagicLinkAuthContext = createContext();

// Custom hook to use authentication context
export const useMagicLinkAuth = () => {
  const context = useContext(MagicLinkAuthContext);
  if (!context) {
    throw new Error('useMagicLinkAuth must be used within a MagicLinkAuthProvider');
  }
  return context;
};

// Authentication provider component
export const MagicLinkAuthProvider = ({ children }) => {
  console.log('MagicLinkAuthProvider: Component mounting...');
  
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSendingLink, setIsSendingLink] = useState(false);

  // Initialize authentication state on component mount
  useEffect(() => {
    console.log('MagicLinkAuthProvider: Initializing authentication...');
    
    const initializeAuth = async () => {
      try {
        console.log('MagicLinkAuthProvider: Checking if user is authenticated...');
        
        // Load persisted authenticated user session if present
        try {
          const persisted = JSON.parse(localStorage.getItem('auth_user') || 'null');
          if (persisted && persisted.user && Date.now() < persisted.expiresAt) {
            console.log('MagicLinkAuthProvider: Found persisted user session');
            setUser(persisted.user);
            setAuthState('authenticated');
            return;
          }
        } catch (_) {}

        // Otherwise, check if user is already authenticated via magic link
        if (isMagicLinkAuthenticated()) {
          console.log('MagicLinkAuthProvider: User is authenticated via magic link, getting user data...');
          const currentUser = getMagicLinkUser();
          if (currentUser) {
            console.log('MagicLinkAuthProvider: User data found:', currentUser);
            setUser(currentUser);
            setAuthState('authenticated');
          } else {
            console.log('MagicLinkAuthProvider: User data invalid, clearing...');
            // Clear invalid data
            clearMagicLinkData();
            setAuthState('unauthenticated');
          }
        } else {
          console.log('MagicLinkAuthProvider: User not authenticated');
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('MagicLinkAuthProvider: Authentication initialization error:', error);
        setError(error.message);
        setAuthState('error');
      } finally {
        console.log('MagicLinkAuthProvider: Initialization complete, setting isInitializing to false');
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Send magic link to user's email
  const sendMagicLink = useCallback(async (email) => {
    try {
      setIsSendingLink(true);
      setError(null);

      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Validate if email belongs to a team member
      if (!validateTeamMemberEmail(email)) {
        throw new Error('You are not authorized to use this magic link. Please contact an administrator.');
      }

      // Generate secure token
      const token = generateMagicToken();
      
      // Create magic link
      const baseUrl = window.location.origin;
      const magicLink = createMagicLink(email, token, baseUrl);
      
      // Store magic link data locally
      const stored = storeMagicLinkData(email, token);
      if (!stored) {
        throw new Error('Failed to generate magic link. Please try again.');
      }

      // Send magic link (simulated for demo)
      const result = await sendMagicLinkEmail(email, magicLink);
      
      if (result.success) {
        setAuthState('link-sent');
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Send magic link error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsSendingLink(false);
    }
  }, []);

  // Verify magic link and authenticate user
  const verifyMagicLink = useCallback(async (email, token) => {
    try {
      setError(null);
      setAuthState('loading');
      
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }

      // Validate if email belongs to a team member
      if (!validateTeamMemberEmail(email)) {
        throw new Error('You are not authorized to use this magic link. Please contact an administrator.');
      }

      // Get stored magic link data
      const storedData = getMagicLinkData();
      if (!storedData) {
        throw new Error('Magic link expired or invalid. Please request a new one.');
      }

      // Validate token
      const isValid = validateMagicToken(token, storedData.token, storedData.expirationTime);
      if (!isValid) {
        throw new Error('Invalid or expired magic link. Please request a new one.');
      }

      // Check if email matches
      if (storedData.email !== email) {
        throw new Error('Email mismatch. Please use the link sent to your email.');
      }

      // Get user information from team members list
      const teamMember = TEAM_MEMBERS.find(member => member.email.toLowerCase() === email.toLowerCase());
      if (!teamMember) {
        throw new Error('User not found in team members list');
      }

      const userInfo = {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        isAdmin: teamMember.isAdmin
      };
      
      // Update state
      setUser(userInfo);
      setAuthState('authenticated');

      // Persist user session for 24h so reloads work on GitHub Pages
      try {
        const payload = { user: userInfo, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
        localStorage.setItem('auth_user', JSON.stringify(payload));
      } catch (e) {
        console.warn('Persist user failed (non-blocking):', e);
      }
      
      // Clear magic link data after successful verification
      clearMagicLinkData();
      
      return userInfo;
    } catch (error) {
      console.error('Magic link verification error:', error);
      setError(error.message);
      setAuthState('error');
      throw error;
    }
  }, []);

  // Logout user
  const logout = useCallback(() => {
    try {
      // Clear stored authentication data
      clearMagicLinkData();
      
      // Reset state
      setUser(null);
      setError(null);
      setAuthState('unauthenticated');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Check if user has specific role or permission
  const hasRole = useCallback((role) => {
    if (!user) return false;
    // Check if the user is an admin based on email domain
    return user.email && user.email.endsWith('@zenoti.com');
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    // All authenticated users have basic permissions
    return true;
  }, [user]);

  // Context value
  const value = {
    // State
    authState,
    user,
    error,
    isInitializing,
    isAuthenticated: authState === 'authenticated',
    isSendingLink,
    
    // Methods
    sendMagicLink,
    verifyMagicLink,
    logout,
    hasRole,
    hasPermission,
    
    // Constants
    AUTH_STATES: {
      LOADING: 'loading',
      UNAUTHENTICATED: 'unauthenticated',
      LINK_SENT: 'link-sent',
      AUTHENTICATED: 'authenticated',
      ERROR: 'error'
    }
  };

  return (
    <MagicLinkAuthContext.Provider value={value}>
      {children}
    </MagicLinkAuthContext.Provider>
  );
};
