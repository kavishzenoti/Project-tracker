// Backend proxy configuration
export const BACKEND_CONFIG = {
  // Backend API base URL
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://project-tracker-backend-rejs.onrender.com/api'  // Replace with your actual Render backend URL
    : 'http://localhost:3001/api',                        // Local development backend
  
  // API endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    AUTH: {
      STATUS: '/auth/status',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      PERMISSIONS: '/auth/permissions'
    },
    GITHUB: {
      COMMIT: '/github/commit',
      FETCH: '/github/fetch'
    }
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    CREDENTIALS: 'include', // Include cookies for session management
    TIMEOUT: 30000,         // 30 seconds timeout
    RETRY_ATTEMPTS: 3       // Number of retry attempts for failed requests
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_BACKEND_PROXY: true,    // Enable/disable backend proxy
    FALLBACK_TO_DIRECT: false,     // Fallback to direct GitHub API if backend fails
    CACHE_RESPONSES: true,         // Cache backend responses
    DEBUG_MODE: process.env.NODE_ENV === 'development'
  }
};

// Helper function to get full API URL
export const getBackendApiUrl = (endpoint) => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to check if backend proxy is enabled
export const isBackendProxyEnabled = () => {
  return BACKEND_CONFIG.FEATURES.ENABLE_BACKEND_PROXY;
};

// Helper function to get request configuration
export const getRequestConfig = (method = 'GET', body = null) => {
  const config = {
    method,
    credentials: BACKEND_CONFIG.REQUEST_CONFIG.CREDENTIALS,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: BACKEND_CONFIG.REQUEST_CONFIG.TIMEOUT
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  return config;
};
