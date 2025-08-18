import { BACKEND_CONFIG, getBackendApiUrl, getRequestConfig } from '../config/backend.js';

// Backend proxy for GitHub operations (more secure than storing tokens in frontend)
class BackendProxy {
  constructor() {
    this.baseUrl = BACKEND_CONFIG.BASE_URL;
  }

  // Get authentication status from backend
  async getAuthStatus() {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.STATUS),
        getRequestConfig('GET')
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

  // Authenticate user with backend (using magic link email)
  async authenticateUser(email) {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.LOGIN),
        getRequestConfig('POST', { email })
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

  // Commit data through backend (backend handles GitHub token)
  async commitData(data, commitMessage) {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.GITHUB.COMMIT),
        getRequestConfig('POST', {
          data,
          commitMessage,
          timestamp: new Date().toISOString()
        })
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Commit failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error committing data:', error);
      throw error;
    }
  }

  // Fetch data through backend (backend handles GitHub token)
  async fetchData() {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.GITHUB.FETCH),
        getRequestConfig('GET')
      );

      if (response.status === 404) {
        return null; // No data found
      }

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  // Check if user has commit permissions
  async checkCommitPermissions() {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.PERMISSIONS),
        getRequestConfig('GET')
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

  // Logout from backend
  async logout() {
    try {
      const response = await fetch(
        getBackendApiUrl(BACKEND_CONFIG.ENDPOINTS.AUTH.LOGOUT),
        getRequestConfig('POST')
      );

      if (!response.ok) {
        console.warn('Logout request failed:', response.status);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if backend is available
  async checkBackendHealth() {
    try {
      const response = await fetch(
        getBackendApiUrl('/health'),
        { method: 'GET', timeout: 5000 }
      );
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}

export default BackendProxy;
