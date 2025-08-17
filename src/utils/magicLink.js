// Magic Link Authentication Utilities

// Generate a secure random token for magic links
export const generateMagicToken = () => {
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

// Create a magic link URL
export const createMagicLink = (email, token, baseUrl) => {
  // Detect if we're on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');
  const basePath = isGitHubPages ? '/Project-tracker' : '';
  
  const url = new URL(basePath + '/auth/verify', baseUrl);
  url.searchParams.set('email', email);
  url.searchParams.set('token', token);
  return url.toString();
};

// Validate magic link token
export const validateMagicToken = (token, storedToken, expirationTime) => {
  if (!token || !storedToken) return false;
  if (token !== storedToken) return false;
  if (Date.now() > expirationTime) return false;
  return true;
};

// Simulate sending magic link email (in production, use a real email service)
export const sendMagicLinkEmail = async (email, magicLink) => {
  // For demo purposes, we'll just log the link
  // In production, integrate with SendGrid, AWS SES, or similar
  console.log('🔐 Magic Link Generated:');
  console.log('📧 To:', email);
  console.log('🔗 Link:', magicLink);
  console.log('⏰ Expires in: 15 minutes');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, message: 'Magic link sent to your email!' };
};

// Store magic link data in localStorage (in production, use a database)
export const storeMagicLinkData = (email, token) => {
  const expirationTime = Date.now() + (15 * 60 * 1000); // 15 minutes
  
  const magicLinkData = {
    email,
    token,
    expirationTime,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem('magic_link_data', JSON.stringify(magicLinkData));
    return true;
  } catch (error) {
    console.error('Failed to store magic link data:', error);
    return false;
  }
};

// Retrieve magic link data from localStorage
export const getMagicLinkData = () => {
  try {
    const data = localStorage.getItem('magic_link_data');
    if (!data) return null;
    
    const magicLinkData = JSON.parse(data);
    
    // Check if expired
    if (Date.now() > magicLinkData.expirationTime) {
      localStorage.removeItem('magic_link_data');
      return null;
    }
    
    return magicLinkData;
  } catch (error) {
    console.error('Failed to retrieve magic link data:', error);
    return null;
  }
};

// Clear magic link data
export const clearMagicLinkData = () => {
  try {
    localStorage.removeItem('magic_link_data');
    return true;
  } catch (error) {
    console.error('Failed to clear magic link data:', error);
    return false;
  }
};

// Check if user is authenticated via magic link
export const isMagicLinkAuthenticated = () => {
  const data = getMagicLinkData();
  return data !== null;
};

// Get current authenticated user
export const getMagicLinkUser = () => {
  const data = getMagicLinkData();
  if (!data) return null;
  
  return {
    email: data.email,
    name: data.email.split('@')[0], // Use email prefix as name
    provider: 'magic-link',
    verified: true
  };
};

// Persist an authenticated user session (separate from the temporary magic link data)
export const storeAuthenticatedUser = (user, ttlMs = 24 * 60 * 60 * 1000) => {
  try {
    const payload = {
      user,
      expiresAt: Date.now() + ttlMs
    };
    localStorage.setItem('auth_user', JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Failed to store authenticated user:', error);
    return false;
  }
};

export const getAuthenticatedUser = () => {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return null;
    if (Date.now() > payload.expiresAt) {
      localStorage.removeItem('auth_user');
      return null;
    }
    return payload.user || null;
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
};

export const clearAuthenticatedUser = () => {
  try {
    localStorage.removeItem('auth_user');
    return true;
  } catch (error) {
    console.error('Failed to clear authenticated user:', error);
    return false;
  }
};
