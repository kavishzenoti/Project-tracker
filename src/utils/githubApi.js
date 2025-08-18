import { GITHUB_CONFIG, getDataFileUrl } from '../config/github.js';

// GitHub API utility functions for data sharing
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  // Get the current SHA of the data file (required for updates)
  async getFileSHA() {
    try {
      const response = await fetch(getDataFileUrl(), { headers: this.headers });

      if (response.status === 404) {
        // File doesn't exist yet, return null
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get file SHA: ${response.status}`);
      }

      const data = await response.json();
      return data.sha;
    } catch (error) {
      console.error('Error getting file SHA:', error);
      throw error;
    }
  }

  // Commit data to GitHub
  async commitData(data, commitMessage) {
    try {
      const fileSHA = await this.getFileSHA();
      const content = JSON.stringify(data, null, 2);
      
      // Check file size
      if (content.length > GITHUB_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Data file too large: ${(content.length / 1024).toFixed(2)}KB exceeds ${(GITHUB_CONFIG.MAX_FILE_SIZE / 1024).toFixed(2)}KB limit`);
      }
      
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const payload = {
        message: commitMessage,
        content: encodedContent,
        branch: GITHUB_CONFIG.DATA_BRANCH,
      };

      // If file exists, include the SHA for update
      if (fileSHA) {
        payload.sha = fileSHA;
      }

      const response = await fetch(getDataFileUrl(), {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to commit data: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Data committed successfully:', result);
      return result;
    } catch (error) {
      console.error('Error committing data:', error);
      throw error;
    }
  }

  // Fetch data from GitHub
  async fetchData() {
    try {
      const response = await fetch(getDataFileUrl(), { headers: this.headers });

      if (response.status === 404) {
        // No shared data exists yet
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
      
      console.log('Data fetched successfully:', content);
      return content;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  // Check if user has access to the repository
  async checkAccess() {
    try {
      const response = await fetch(
        `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Access denied: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error checking access:', error);
      throw error;
    }
  }

  // Get repository info
  async getRepoInfo() {
    try {
      const response = await fetch(
        `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get repo info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting repo info:', error);
      throw error;
    }
  }
}

export default GitHubAPI;
