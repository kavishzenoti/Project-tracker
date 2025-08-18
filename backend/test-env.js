require('dotenv').config();

console.log('=== Environment Variables Test ===');
console.log('GITHUB_TOKEN loaded:', !!process.env.GITHUB_TOKEN);
console.log('Token length:', process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.length : 0);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SESSION_SECRET loaded:', !!process.env.SESSION_SECRET);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('================================');
