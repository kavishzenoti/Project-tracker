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

## 🔐 Magic Link Authentication

The application now uses modern, secure magic link authentication:

- **Passwordless Login** - No passwords to remember or manage
- **Email-Based** - Secure login links sent to user's email
- **Token Expiration** - Links automatically expire after 15 minutes
- **Secure Storage** - Authentication data stored securely in localStorage
- **Role-Based Access Control** - Automatic admin detection based on email domains

### Security Features

- **Secure Token Generation** - Cryptographically secure random tokens
- **Automatic Expiration** - Links expire to prevent unauthorized access
- **Email Validation** - Ensures links are used by the intended recipient
- **Local Storage Security** - Sensitive data cleared after use
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

1. **First Visit**: You'll see the magic link login screen
2. **Enter Email**: Type your email address and click "Send Magic Link"
3. **Check Console**: The magic link will be logged to your browser console
4. **Click Link**: Copy and open the magic link to automatically sign in
5. **Access**: Once authenticated, you'll have access to the full application

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
- **Magic Links** - Passwordless authentication
- **Secure Tokens** - Cryptographically secure authentication

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

## Production Deployment

1. **Update Environment Variables:**
   - Set production redirect URIs
   - Configure production OAuth applications
   - Set appropriate CORS policies

2. **Security Considerations:**
   - Enable HTTPS
   - Implement rate limiting
   - Add IP whitelisting if needed
   - Set up audit logging

3. **Build and Deploy:**
   ```bash
   npm run build
   # Deploy the dist/ folder to your web server
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