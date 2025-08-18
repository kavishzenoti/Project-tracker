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
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests
  }
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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
  
  // Force session save
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    console.log('✅ Session created for:', email);
    console.log('🔑 Session data:', req.session);
    
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
    if (!req.session.user || !req.session.user.isAuthenticated) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Fetch data from GitHub
    const { data: fileData } = await octokit.repos.getContent({
      owner: GITHUB_CONFIG.REPO_OWNER,
      repo: GITHUB_CONFIG.REPO_NAME,
      path: GITHUB_CONFIG.DATA_FILE_PATH,
      ref: GITHUB_CONFIG.DATA_BRANCH
    });
    
    // Decode content
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
