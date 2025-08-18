# Project Tracker Backend

Secure backend proxy server for GitHub integration without exposing tokens to the frontend.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token_here

# Session Security
SESSION_SECRET=your_random_session_secret_key_here

# Team Configuration
TEAM_MEMBERS=kavisht@zenoti.com,user2@zenoti.com,user3@zenoti.com

# Admin emails (comma-separated)
ADMIN_EMAILS=kavisht@zenoti.com
```

### 3. GitHub Token Setup
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Generate new token with `repo` permissions
3. Copy token to `.env` file

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Configuration

### Team Members
Update `TEAM_MEMBERS` in `.env` with your team's email addresses.

### Admin Users
Update `ADMIN_EMAILS` in `.env` with admin email addresses.

### Repository Settings
Update `GITHUB_CONFIG` in `server.js` if your repository details change.

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/status` - Check auth status
- `GET /api/auth/permissions` - Check user permissions
- `POST /api/auth/logout` - User logout

### GitHub Operations
- `POST /api/github/commit` - Commit data to GitHub
- `GET /api/github/fetch` - Fetch data from GitHub

### Health Check
- `GET /api/health` - Server health status

## 🔒 Security Features

- **No tokens in frontend** - All GitHub operations go through backend
- **Session-based authentication** - Secure user sessions
- **Email validation** - Only authorized team members can access
- **Permission-based commits** - Only admins can commit changes
- **CORS protection** - Configured for your frontend domain

## 🚀 Deployment

### Heroku
1. Create new Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy with `git push heroku main`

### Vercel
1. Install Vercel CLI
2. Set environment variables
3. Deploy with `vercel --prod`

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Auto-deploy on push

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes |
| `SESSION_SECRET` | Random string for session security | Yes |
| `FRONTEND_URL` | Your frontend application URL | Yes |
| `TEAM_MEMBERS` | Comma-separated team email list | Yes |
| `ADMIN_EMAILS` | Comma-separated admin email list | Yes |

## 🔍 Troubleshooting

### Common Issues
1. **CORS errors** - Check `FRONTEND_URL` in `.env`
2. **GitHub auth errors** - Verify `GITHUB_TOKEN` has correct permissions
3. **Session issues** - Ensure `SESSION_SECRET` is set and unique

### Logs
Check server logs for detailed error information:
```bash
npm run dev
```

## 📚 Dependencies

- **Express** - Web framework
- **CORS** - Cross-origin resource sharing
- **Express-session** - Session management
- **Octokit** - GitHub API client
- **Dotenv** - Environment variable management
