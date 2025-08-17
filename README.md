# Design System Task Tracker

A React-based project management tool for tracking design system tasks across weekly sprints, now with **SSO Authentication** support.

## Features

- **🔐 SSO Authentication**: Secure sign-in with Google, Microsoft, or any OAuth2 provider
- **📅 Weekly View**: 12-week planning horizon starting from current week
- **📋 Task Categories**: Design Roadmap, Audit, Maintenance, Advocacy & Training
- **⚡ Priority Management**: High, Medium, Low priority levels
- **👥 Team Assignment**: Assign tasks to team members with role-based access control
- **📊 Status Tracking**: Planned, In Progress, Completed, Blocked, Delayed
- **🖱️ Interactive Grid**: Click, shift+click, and ctrl+click for cell selection
- **📱 Context Menu**: Right-click for quick actions
- **🔄 Change Logging**: Track all user actions and modifications
- **🔒 Secure**: PKCE flow, CSRF protection, and secure token storage

## 🔐 Email Code Authentication

The application supports a secure email code (OTP) authentication flow:

- **Passwordless Login** - No passwords to remember or manage
- **Email-Based** - 6-digit verification codes sent to user's email
- **Code Expiration** - Codes expire after 10 minutes
- **Secure Storage** - Session stored securely in localStorage (24h)
- **Role-Based Access Control** - Admin detection based on `@zenoti.com`

### Security Features

- **Stateless Server** - Codes are never stored server-side; only HMAC-hashed in a signed token with TTL
- **Automatic Expiration** - Tokens and codes expire to prevent reuse
- **Email Validation** - Ensures codes are used by intended recipient
- **Local Storage Security** - Sensitive temp data cleared after use
- **HTTPS Ready** - Works seamlessly with secure connections

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- GitHub account (for hosting)

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:3000`

The application will open in your browser at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Usage

### Authentication

Two modes:

- Secure (recommended):
  1. Enter your `@zenoti.com` email and click "Send Verification Code"
  2. Check your inbox for a 6-digit code
  3. Enter the code to sign in (code expires in 10 minutes)

- Demo fallback (when no API configured):
  1. Enter email and click "Send Verification Code"
  2. Code is logged to the console (no real email sent)
  3. Enter code to sign in

### Basic Navigation

- **Click** on any cell to schedule a task for that week
- **Shift+Click** to select a range of weeks for the same task
- **Ctrl/Cmd+Click** to select multiple individual cells
- **Right-click** to open the context menu for assignments and status changes

### Adding Tasks

1. Use the input field in each category section
2. Type the task name and press Enter or click Add
3. Set priority using the dropdown

### Managing Tasks

- **Edit**: Hover over a task row and click the edit icon
- **Delete**: Hover over a task row and click the delete icon
- **Priority**: Change priority using the dropdown in each task row

### Cell Management

- **Status**: Use the context menu to change status (Planned, In Progress, Completed, etc.)
- **Assignment**: Assign team members through the context menu
- **Clear**: Remove scheduling from selected cells

### Role-Based Access

- **Admin Users** (with `@zenoti.com` emails): Can assign anyone to any task
- **Regular Users**: Automatically assigned to cells they interact with
- **All Users**: Can view change log and manage their own assignments

## Project Structure

```
src/
├── components/
│   ├── DesignSystemTracker.jsx  # Main tracker component
│   ├── MagicLinkLogin.jsx           # Magic link authentication component
│   ├── MagicLinkVerification.jsx    # Magic link verification handler
│   └── ProtectedRoute.jsx       # Route protection component
├── contexts/
│   └── MagicLinkAuthContext.jsx     # Magic link authentication context
├── utils/
│   └── magicLink.js                 # Magic link utilities
├── App.jsx                       # App wrapper with auth
├── main.jsx                      # Entry point
└── index.css                     # Styles (Tailwind CSS)
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Email OTP** - Passwordless authentication
- **HMAC Tokens** - Stateless signed tokens for verification

## Customization

### Adding New SSO Providers

1. Add configuration to `src/config/auth.js`
2. Update the provider list in `SSOLogin.jsx`
3. Add provider-specific user data normalization in `src/utils/auth.js`

### Adding New Categories

Modify the `categories` array in `DesignSystemTracker.jsx`:

```javascript
const categories = ["Design Roadmap", "Audit", "Maintenance", "Advocacy & Training", "New Category"];
```

### Adding Team Members

Update the `teamMembers` array:

```javascript
const teamMembers = ["Charissa", "Praveen", "Nitin", "Agam", "Subhranta", "New Member"];
```

### Modifying Status Options

Edit the `statusOptions` array to add new statuses or change colors:

```javascript
const statusOptions = [
  { value: "planned", label: "Planned", icon: Circle },
  { value: "new-status", label: "New Status", icon: NewIcon }
];
```

## Environment and Deployment
## Secure Email Flow (Vercel + Resend)

1) Create a Resend account and API key. Configure a sender domain/address.
2) Deploy the `api/` directory to Vercel (import repo or add as project).
3) Set Vercel env vars: `RESEND_API_KEY`, `AUTH_FROM_EMAIL`, `AUTH_HMAC_SECRET`, `APP_ORIGINS`.
4) Set `VITE_API_BASE_URL` in the frontend (GitHub Pages build) to the Vercel URL.
5) Redeploy. Login will use the secure email flow automatically.

Security notes:
- Codes are HMAC-hashed and carried in a signed token with TTL; no DB is required.
- Add rate limits/IP throttling at the edge as needed.


Frontend (Vite):
- `VITE_API_BASE_URL` → Set to your API base (e.g. Vercel URL) to enable secure email delivery

Serverless API (Vercel):
- `RESEND_API_KEY` → Resend API key
- `AUTH_FROM_EMAIL` → Sender, e.g. `Project Tracker <no-reply@yourdomain.com>`
- `AUTH_HMAC_SECRET` → Long random secret for signing/hashing
- `APP_ORIGINS` → Comma-separated origins for CORS (e.g., `http://localhost:5173,https://kavishzenoti.github.io`)

2. **Security Considerations:**
   - Enable HTTPS
   - Implement rate limiting
   - Add IP whitelisting if needed
   - Set up audit logging

3. **Build and Deploy:**
   ```bash
   npm run build
   # GitHub Pages uses docs/ output automatically
   ```

## Troubleshooting

### Common SSO Issues

- **Invalid redirect URI**: Ensure URIs match exactly between your OAuth app and `.env`
- **Client ID not found**: Verify environment variables are set and restart the dev server
- **State parameter mismatch**: Clear browser cookies and try again
- **Token exchange failed**: Check client secret and redirect URI configuration

### Debug Mode

Enable debug logging by adding to your `.env`:
```bash
VITE_DEBUG=true
```

## Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Complete GitHub Pages deployment instructions
- **[Magic Link Authentication](https://en.wikipedia.org/wiki/Magic_link)** - Wikipedia article on magic links
- **[GitHub Pages](https://pages.github.com/)** - Official GitHub Pages documentation

## 🚀 Deployment

### GitHub Pages (Free Hosting)

This application is configured for easy deployment to GitHub Pages:

1. **Push to GitHub**: The GitHub Actions workflow automatically deploys on every push
2. **Free Hosting**: Your app will be available at `https://YOUR_USERNAME.github.io/Project-tracker/`
3. **Automatic Updates**: Every code change automatically triggers a new deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Other Hosting Options

- **Vercel**: Great for React apps with automatic deployments
- **Netlify**: Excellent for static sites with form handling
- **Firebase Hosting**: Google's hosting solution with good performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including authentication flows)
5. Submit a pull request

## License

This project is open source and available under the MIT License. 