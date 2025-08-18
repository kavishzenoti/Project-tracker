import { BACKEND_CONFIG, getBackendApiUrl, getRequestConfig } from '../config/backend.js';

// Backend proxy for GitHub operations (more secure than storing tokens in frontend)
class BackendProxy {
  constructor() {
    this.baseUrl = BACKEND_CONFIG.BASE_URL;
  }

  // Helper method to create fetch with timeout
  async fetchWithTimeout(url, options, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  // Authenticate user with backend (using magic link email)
  async authenticateUser(email) {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.LOGIN),
        getRequestConfig('POST', { email }),
        8000 // 8 second timeout for auth
      );

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  }

  // Check if user has commit permissions
  async checkCommitPermissions() {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.PERMISSIONS),
        getRequestConfig('GET'),
        5000 // 5 second timeout for permissions
      );

      if (!response.ok) {
        throw new Error(`Permission check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking permissions:', error);
      throw error;
    }
  }

  // Get authentication status from backend
  async getAuthStatus() {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.STATUS),
        getRequestConfig('GET'),
        5000 // 5 second timeout for status
      );

      if (!response.ok) {
        throw new Error(`Auth check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking auth status:', error);
      throw error;
    }
  }

  // Logout from backend
  async logout() {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.LOGOUT),
        getRequestConfig('POST'),
        5000 // 5 second timeout for logout
      );

      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // Commit data to GitHub via backend
  async commitData(data, commitMessage) {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.GITHUB.COMMIT),
        getRequestConfig('POST', {
          data,
          commitMessage,
          timestamp: new Date().toISOString()
        }),
        15000 // 15 second timeout for commit
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Commit failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error committing data:', error);
      throw error;
    }
  }

  // Fetch data from GitHub via backend
  async fetchData() {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.GITHUB.FETCH),
        getRequestConfig('GET'),
        10000 // 10 second timeout for fetch
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  // Check backend health
  async checkBackendHealth() {
    try {
      const response = await this.fetchWithTimeout(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.HEALTH),
        getRequestConfig('GET'),
        5000 // 5 second timeout for health check
      );

      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

export default BackendProxy;
