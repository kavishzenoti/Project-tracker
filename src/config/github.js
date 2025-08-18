// GitHub configuration
export const GITHUB_CONFIG = {
  // Repository details
  REPO_OWNER: 'kavishzenoti',
  REPO_NAME: 'Project-tracker',
  
  // Data file path in the repository
  DATA_FILE_PATH: 'shared-data/project-tracker-data.json',
  
  // Branch to use for data storage
  DATA_BRANCH: 'main',
  
  // GitHub API base URL
  API_BASE: 'https://api.github.com',
  
  // File size limit (GitHub has a 100MB limit, but we'll use 1MB for safety)
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  
  // Commit message templates
  COMMIT_MESSAGES: {
    INITIAL: 'Initial project tracker data',
    UPDATE: 'Update project tracker data',
    USER_UPDATE: (userName) => `Update by ${userName}`,
    MERGE: 'Merge project tracker data',
  }
};

// Helper function to get full API URL
export const getGitHubApiUrl = (endpoint) => {
  return `${GITHUB_CONFIG.API_BASE}/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}${endpoint}`;
};

// Helper function to get data file URL
export const getDataFileUrl = () => {
  return getGitHubApiUrl(`/contents/${GITHUB_CONFIG.DATA_FILE_PATH}`);
};
