# 🚀 Deployment Guide: GitHub Pages + Magic Link Authentication

This guide will help you deploy your Design System Tracker application to GitHub Pages with magic link authentication.

## 📋 Prerequisites

- GitHub account
- Git installed on your local machine
- Node.js 16+ and npm

## 🏗️ Step 1: Prepare Your Repository

### **1.1 Initialize Git (if not already done)**
```bash
git init
git add .
git commit -m "Initial commit: Design System Tracker with Magic Link Auth"
```

### **1.2 Create GitHub Repository**
1. Go to [GitHub](https://github.com) and click "New repository"
2. Name it `Project-tracker` (or your preferred name)
3. Make it **Public** (required for free GitHub Pages)
4. Don't initialize with README, .gitignore, or license
5. Click "Create repository"

### **1.3 Connect Local to Remote**
```bash
git remote add origin https://github.com/YOUR_USERNAME/Project-tracker.git
git branch -M main
git push -u origin main
```

## ⚙️ Step 2: Configure GitHub Pages

### **2.1 Enable GitHub Pages**
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **Deploy from a branch**
5. Choose **main** branch and **/ (root)** folder
6. Click **Save**

### **2.2 Update Repository Name in Vite Config**
If your repository name is different from `Project-tracker`, update `vite.config.js`:

```javascript
base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
```

## 🔧 Step 3: Configure Magic Link Authentication

### **3.1 Update Magic Link URLs for Production**
The magic link system automatically detects the environment and uses the correct base URL.

### **3.2 Test Locally First**
```bash
npm run build
npm run preview
```

## 🚀 Step 4: Deploy

### **4.1 Automatic Deployment (Recommended)**
The GitHub Actions workflow will automatically deploy when you push to main:

```bash
git add .
git commit -m "Add magic link authentication and GitHub Pages deployment"
git push origin main
```

### **4.2 Manual Deployment (Alternative)**
If you prefer manual deployment:

```bash
npm run build
# Copy the contents of the dist/ folder to your web server
```

## 🌐 Step 5: Access Your Application

### **5.1 GitHub Pages URL**
Your application will be available at:
```
https://YOUR_USERNAME.github.io/Project-tracker/
```

### **5.2 Custom Domain (Optional)**
1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. Add CNAME record pointing to `YOUR_USERNAME.github.io`
3. Update the workflow file with your domain
4. Add domain to repository settings

## 🔐 Step 6: Production Magic Link Setup

### **6.1 Email Service Integration**
For production, replace the demo email service with a real one:

**Option A: SendGrid (Recommended)**
```bash
npm install @sendgrid/mail
```

**Option B: AWS SES**
```bash
npm install @aws-sdk/client-ses
```

**Option C: Nodemailer**
```bash
npm install nodemailer
```

### **6.2 Update Magic Link Utilities**
Replace the demo email function in `src/utils/magicLink.js`:

```javascript
// Example with SendGrid
import sgMail from '@sendgrid/mail';

export const sendMagicLinkEmail = async (email, magicLink) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: 'noreply@yourdomain.com',
    subject: 'Your Magic Link - Design System Tracker',
    html: `
      <h2>Welcome to Design System Tracker!</h2>
      <p>Click the link below to sign in:</p>
      <a href="${magicLink}" style="padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
        Sign In
      </a>
      <p>This link expires in 15 minutes.</p>
    `
  };
  
  try {
    await sgMail.send(msg);
    return { success: true, message: 'Magic link sent to your email!' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: 'Failed to send email' };
  }
};
```

## 🔍 Step 7: Monitor and Maintain

### **7.1 Check Deployment Status**
- Go to **Actions** tab in your repository
- Monitor the deployment workflow
- Check for any build errors

### **7.2 View Application Logs**
- Open browser developer tools
- Check console for any errors
- Monitor network requests

### **7.3 Update Application**
```bash
# Make your changes
git add .
git commit -m "Update application"
git push origin main
# GitHub Actions will automatically redeploy
```

## 🛠️ Troubleshooting

### **Common Issues**

**1. Build Fails**
- Check Node.js version (should be 16+)
- Verify all dependencies are installed
- Check for syntax errors in your code

**2. Magic Links Don't Work**
- Verify the base URL in `vite.config.js`
- Check that the `/auth/verify` route is accessible
- Ensure localStorage is working in your browser

**3. GitHub Pages Shows 404**
- Verify the repository name matches the base path
- Check that the main branch is selected
- Wait a few minutes for deployment to complete

**4. Authentication Issues**
- Clear browser localStorage
- Check that the magic link token is valid
- Verify the email matches the stored data

## 📱 Testing Your Deployment

### **1. Test Magic Link Flow**
1. Visit your deployed application
2. Enter your email address
3. Check the console for the magic link
4. Copy and open the link in a new tab
5. Verify you're redirected back and authenticated

### **2. Test All Features**
- Task creation and editing
- Cell scheduling and assignment
- Change logging
- User role detection

## 🎉 Congratulations!

Your Design System Tracker is now:
- ✅ **Hosted on GitHub Pages** (free hosting)
- ✅ **Authenticated with Magic Links** (secure, passwordless)
- ✅ **Automatically deployed** on every push
- ✅ **Accessible worldwide** via the internet

## 🔗 Next Steps

1. **Share your application** with your team
2. **Customize the UI** to match your brand
3. **Add real email integration** for production use
4. **Set up a custom domain** for professional appearance
5. **Monitor usage** and gather feedback

## 📞 Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review browser console errors
3. Verify your configuration files
4. Test locally before deploying

Happy deploying! 🚀
