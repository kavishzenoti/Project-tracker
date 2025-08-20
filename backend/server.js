const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// GitHub configuration
const GITHUB_CONFIG = {
  REPO_OWNER: 'kavishzenoti',
  REPO_NAME: 'Project-tracker',
  DATA_FILE_PATH: 'shared-data/project-tracker-data.json',
  DATA_BRANCH: 'main'
};

// Initialize GitHub client with token from environment
if (!process.env.GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is not set!');
  console.error('❌ GitHub operations will fail. Please set GITHUB_TOKEN in Render environment variables.');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || 'no-token-set'
});

console.log('🔧 GitHub integration configured for:', GITHUB_CONFIG.REPO_OWNER, '/', GITHUB_CONFIG.REPO_NAME);
console.log('🔑 GitHub token available:', !!process.env.GITHUB_TOKEN);

// Session store configuration
let sessionStore;
try {
  const MemoryStore = require('express-session').MemoryStore;
  sessionStore = new MemoryStore();
  console.log('🔧 Using MemoryStore for session storage');
} catch (error) {
  console.error('❌ Failed to create MemoryStore:', error);
  sessionStore = undefined;
}

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://kavishzenoti.github.io',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // true in production, false in development
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production cross-origin, 'lax' for development
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined // Production domain
  },
  name: 'project-tracker-session'
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// GitHub token check endpoint
app.get('/api/debug/github', (req, res) => {
  res.json({
    hasToken: !!process.env.GITHUB_TOKEN,
    tokenLength: process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0,
    repoOwner: GITHUB_CONFIG.REPO_OWNER,
    repoName: GITHUB_CONFIG.REPO_NAME,
    dataPath: GITHUB_CONFIG.DATA_FILE_PATH,
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  
  // Validate email against team members
  const teamMembers = [
    'kavisht@zenoti.com',
    'user2@zenoti.com',
    'user3@zenoti.com'
  ];
  
  if (!teamMembers.includes(email)) {
    return res.status(401).json({ error: 'Unauthorized email' });
  }
  
  // Store user in session
  req.session.user = { email, isAuthenticated: true };

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    res.json({ 
      success: true, 
      user: { email },
      sessionId: req.sessionID 
    });
  });
});

app.get('/api/auth/status', (req, res) => {
  if (req.session.user && req.session.user.isAuthenticated) {
    res.json({ 
      isAuthenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.get('/api/auth/permissions', (req, res) => {
  if (!req.session.user || !req.session.user.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const adminEmails = ['kavisht@zenoti.com'];
  const canCommit = adminEmails.includes(req.session.user.email);
  
  res.json({ 
    canCommit,
    user: req.session.user 
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GitHub operations endpoints
app.post('/api/github/commit', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { data, commitMessage } = req.body;
    
    let fileSHA = null;
    try {
      const { data: fileData } = await octokit.repos.getContent({
        owner: GITHUB_CONFIG.REPO_OWNER,
        repo: GITHUB_CONFIG.REPO_NAME,
        path: GITHUB_CONFIG.DATA_FILE_PATH,
        ref: GITHUB_CONFIG.DATA_BRANCH
      });
      fileSHA = fileData.sha;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
    
    const payload = {
      owner: GITHUB_CONFIG.REPO_OWNER,
      repo: GITHUB_CONFIG.REPO_NAME,
      path: GITHUB_CONFIG.DATA_FILE_PATH,
      message: commitMessage || `Update by ${req.session.user.email}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      branch: GITHUB_CONFIG.DATA_BRANCH
    };
    
    if (fileSHA) {
      payload.sha = fileSHA;
    }
    
    const { data: commitResult } = await octokit.repos.createOrUpdateFileContents(payload);
    
    res.json({ 
      success: true, 
      commit: commitResult,
      message: 'Data committed successfully'
    });
    
  } catch (error) {
    console.error('GitHub commit error:', error);
    res.status(500).json({ 
      error: 'Failed to commit data',
      details: error.message 
    });
  }
});

app.get('/api/github/fetch', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_CONFIG.REPO_OWNER,
      repo: GITHUB_CONFIG.REPO_NAME,
      path: GITHUB_CONFIG.DATA_FILE_PATH,
      ref: GITHUB_CONFIG.DATA_BRANCH
    });
    
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    res.json(content);
    
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'No data found' });
    }
    
    console.error('GitHub fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`GitHub integration enabled for: ${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`);
});
