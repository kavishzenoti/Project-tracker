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

// Log GitHub configuration
console.log('🔧 GitHub integration configured for:', GITHUB_CONFIG.REPO_OWNER, '/', GITHUB_CONFIG.REPO_NAME);
console.log('🔑 GitHub token available:', !!process.env.GITHUB_TOKEN);

// Session store configuration
let sessionStore;
if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    const RedisStore = require('connect-redis').default;
    const redis = require('redis');
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });
    redisClient.connect().catch(console.error);
    sessionStore = new RedisStore({ client: redisClient });
    console.log('✅ Using Redis for session storage');
  } catch (error) {
    console.warn('⚠️ Redis not available, falling back to memory store:', error.message);
    sessionStore = undefined;
  }
} else {
  sessionStore = undefined;
  console.log('🔧 Using memory store (Redis not configured)');
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Allow cross-site requests
    path: '/api' // Ensure cookie is available for API endpoints
  },
  name: 'project-tracker-session' // Custom session name
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    hasSession: !!req.session
  });
});

// Debug endpoint for session troubleshooting
app.get('/api/debug/session', (req, res) => {
  res.json({
    sessionId: req.sessionID,
    sessionData: req.session,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
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
  
  console.log('🔐 Login attempt for email:', email);
  console.log('📋 Session ID:', req.sessionID);
  
  // Validate email against team members (you can customize this)
  const teamMembers = [
    'kavisht@zenoti.com',
    'user2@zenoti.com',
    'user3@zenoti.com'
  ];
  
  if (!teamMembers.includes(email)) {
    console.log('❌ Unauthorized email:', email);
    return res.status(401).json({ error: 'Unauthorized email' });
  }
  
  // Store user in session
  req.session.user = { email, isAuthenticated: true };

  // Force session save and wait for it to complete
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    // Verify session was saved
    console.log('✅ Session created for:', email);
    console.log('🔑 Session data after save:', req.session);
    console.log('🔑 Session ID after save:', req.sessionID);
    
    // Set a test flag to verify session persistence
    req.session.testFlag = 'session-working';
    
    res.json({ 
      success: true, 
      user: { email },
      sessionId: req.sessionID 
    });
  });
});

app.get('/api/auth/status', (req, res) => {
  console.log('🔍 Auth status check - Session ID:', req.sessionID);
  console.log('🔍 Session data:', req.session);
  
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
  
  // Check if user has commit permissions
  // You can customize this logic based on your team structure
  const adminEmails = ['kavisht@zenoti.com']; // Add admin emails here
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
    
    // Get current file SHA if it exists
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
      // File doesn't exist yet, that's fine
    }
    
    // Prepare commit payload
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
    
    // Commit to GitHub
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
    console.log('🔍 GitHub fetch request - Session ID:', req.sessionID);
    console.log('🔍 GitHub fetch request - Session data:', req.session);
    console.log('🔍 GitHub fetch request - Cookies:', req.headers.cookie);
    console.log('🔍 GitHub fetch request - User agent:', req.headers['user-agent']);
    
    if (!req.session.user || !req.session.user.isAuthenticated) {
      console.log('❌ GitHub fetch - Session not authenticated');
      console.log('❌ Session user:', req.session.user);
      console.log('❌ Session authenticated:', req.session.user?.isAuthenticated);
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    console.log('✅ GitHub fetch - User authenticated:', req.session.user.email);
    
    // Fetch data from GitHub
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_CONFIG.REPO_OWNER,
      repo: GITHUB_CONFIG.REPO_NAME,
      path: GITHUB_CONFIG.DATA_FILE_PATH,
      ref: GITHUB_CONFIG.DATA_BRANCH
    });
    
    // Decode content
    const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
    
    console.log('✅ GitHub fetch - Data retrieved successfully');
    res.json(content);
    
  } catch (error) {
    if (error.status === 404) {
      console.log('⚠️ GitHub fetch - No data found (404)');
      return res.status(404).json({ error: 'No data found' });
    }
    
    console.error('❌ GitHub fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`GitHub integration enabled for: ${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`);
});
