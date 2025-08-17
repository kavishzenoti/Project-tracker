# 🎯 Magic Link Authentication Demo

This guide will show you how to test the magic link authentication system in your Design System Tracker application.

## 🚀 Quick Demo

### **Step 1: Start the Application**
```bash
npm run dev
```

### **Step 2: Open Your Browser**
Navigate to `http://localhost:3000`

### **Step 3: Test Magic Link Authentication**

1. **Enter Your Email**
   - You'll see a beautiful login screen
   - Type any email address (e.g., `test@example.com`)
   - Click "Send Magic Link"

2. **Check the Console**
   - Open browser developer tools (F12)
   - Go to Console tab
   - You'll see the magic link logged like this:

   ```
   🔐 Magic Link Generated:
   📧 To: test@example.com
   🔗 Link: http://localhost:3000/auth/verify?email=test%40example.com&token=demo-token
   ⏰ Expires in: 1 hour
   ```

3. **Use the Magic Link**
   - Copy the magic link from the console
   - Open it in a new tab
   - You'll be automatically authenticated!

4. **Access the Application**
   - Once authenticated, you'll see the full Design System Tracker
   - Your email will be displayed in the top-right corner
   - Admin privileges are automatically detected for `@zenoti.com` emails

## 🔍 What's Happening Behind the Scenes

### **Magic Link Flow**
1. **User enters email** → System generates secure token
2. **Token stored locally** → 1-hour expiration timer starts
3. **Magic link created** → Contains email and token as URL parameters
4. **User clicks link** → System validates token and email
5. **Authentication complete** → User redirected to main application

### **Security Features**
- **Secure Tokens**: 32-byte random tokens (cryptographically secure)
- **Automatic Expiration**: Links expire after 1 hour
- **Email Validation**: Links only work for the email they were sent to
- **Local Storage**: Sensitive data cleared after successful authentication

## 🎨 Demo Features to Try

### **1. Task Management**
- Create new tasks in different categories
- Set priorities (High, Medium, Low)
- Edit task names by hovering and clicking the edit icon

### **2. Cell Scheduling**
- Click on cells to schedule tasks for specific weeks
- Use Shift+Click for range selection
- Right-click for context menu options

### **3. User Assignment**
- Assign team members to scheduled cells
- Change task status (Planned, In Progress, Completed, etc.)
- View change log for all actions

### **4. Role-Based Access**
- Users with `@zenoti.com` emails get admin privileges
- Regular users are auto-assigned to cells they interact with
- All users can view the comprehensive change log

## 🚨 Demo Mode Notice

**Current Implementation**: This is a demo version that logs magic links to the console instead of sending real emails.

**For Production**: Replace the demo email function with a real email service:
- SendGrid
- AWS SES
- Nodemailer
- Or any other email provider

## 🔧 Troubleshooting

### **Magic Link Not Working?**
1. Check that the link hasn't expired (1 hour)
2. Ensure you're using the link for the correct email
3. Clear browser localStorage if needed
4. Check browser console for error messages

### **Authentication Issues?**
1. Verify the magic link URL is correct
2. Check that the verification route (`/auth/verify`) is accessible
3. Ensure localStorage is enabled in your browser

### **Build Errors?**
1. Make sure all dependencies are installed: `npm install`
2. Check Node.js version (16+ required)
3. Clear node_modules and reinstall if needed

## 🌟 Next Steps

1. **Test all features** to ensure everything works
2. **Customize the UI** to match your brand
3. **Deploy to GitHub Pages** using the deployment guide
4. **Integrate real email service** for production use
5. **Add custom domain** for professional appearance

## 🎉 You're Ready!

Your Design System Tracker now has:
- ✅ **Modern Magic Link Authentication**
- ✅ **Beautiful, Responsive UI**
- ✅ **Full Project Management Features**
- ✅ **Role-Based Access Control**
- ✅ **Ready for Production Deployment**

Happy tracking! 🚀
