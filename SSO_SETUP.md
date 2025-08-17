# SSO Authentication Setup Guide

This guide will help you set up Single Sign-On (SSO) authentication for your Design System Tracker application.

## Overview

The application now supports multiple SSO providers:
- **Google OAuth2** - Sign in with Google accounts
- **Microsoft Azure AD** - Sign in with Microsoft/Office 365 accounts
- **Generic OAuth2** - Support for any OAuth2-compliant provider

## Prerequisites

1. Node.js 16+ and npm/yarn
2. A web server or development environment
3. OAuth2 application credentials from your chosen provider(s)

## Environment Configuration

Create a `.env` file in your project root with the following variables:

```bash
# Google OAuth2 Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# Microsoft Azure AD Configuration
VITE_MICROSOFT_CLIENT_ID=your-microsoft-client-id
VITE_MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback

# Generic OAuth2 Configuration
VITE_GENERIC_CLIENT_ID=your-generic-client-id
VITE_GENERIC_CLIENT_SECRET=your-generic-client-secret
VITE_GENERIC_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_GENERIC_AUTH_URL=https://your-provider.com/oauth/authorize
VITE_GENERIC_TOKEN_URL=https://your-provider.com/oauth/token
VITE_GENERIC_USER_INFO_URL=https://your-provider.com/userinfo
VITE_GENERIC_ISSUER=https://your-provider.com
```

## Provider-Specific Setup

### Google OAuth2

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen
6. Set application type to "Web application"
7. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
8. Copy the Client ID and Client Secret to your `.env` file

### Microsoft Azure AD

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in the application details
5. Go to "Authentication" and add redirect URIs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`
6. Go to "Certificates & secrets" and create a new client secret
7. Copy the Application (client) ID and Client Secret to your `.env` file

### Generic OAuth2 Provider

For any other OAuth2 provider (GitHub, GitLab, Okta, etc.):

1. Check your provider's OAuth2 documentation
2. Create an OAuth2 application in their developer portal
3. Configure the redirect URI to match your application
4. Copy the client ID, client secret, and endpoints to your `.env` file

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Security Features

The SSO implementation includes several security measures:

- **PKCE (Proof Key for Code Exchange)** - Prevents authorization code interception attacks
- **State Parameter** - CSRF protection
- **Secure Token Storage** - Tokens are stored securely in localStorage with expiration
- **HTTPS Enforcement** - All OAuth flows use HTTPS
- **Token Validation** - JWT tokens are validated before use

## Role-Based Access Control

The application automatically determines user roles based on email domains:

- **Admin Users**: Users with `@zenoti.com` email addresses have full access
- **Regular Users**: Other users have limited access and are auto-assigned to tasks they interact with

## Production Deployment

For production deployment:

1. Update all redirect URIs to use your production domain
2. Ensure HTTPS is enabled
3. Set appropriate CORS policies
4. Consider implementing additional security measures like:
   - Rate limiting
   - IP whitelisting
   - Audit logging
   - Token refresh mechanisms

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in your OAuth provider matches exactly
   - Check for trailing slashes or protocol mismatches

2. **"Client ID not found" error**
   - Verify your environment variables are correctly set
   - Restart your development server after changing `.env`

3. **"State parameter mismatch" error**
   - This usually indicates a CSRF attack or session issue
   - Clear your browser cookies and try again

4. **"Token exchange failed" error**
   - Check your client secret is correct
   - Verify your redirect URI matches exactly

### Debug Mode

Enable debug logging by adding to your `.env`:
```bash
VITE_DEBUG=true
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your OAuth provider configuration
3. Ensure all environment variables are set correctly
4. Check that your redirect URIs match exactly

## Additional Resources

- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [PKCE Extension](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect](https://openid.net/connect/)
