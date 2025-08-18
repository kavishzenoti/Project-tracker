#!/usr/bin/env bash
# Render build script for backend

echo "🚀 Starting backend build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist (for local development)
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=\$PORT
FRONTEND_URL=https://kavishzenoti.github.io
TEAM_MEMBERS=kavisht@zenoti.com,user2@zenoti.com
ADMIN_EMAILS=kavisht@zenoti.com
EOF
fi

echo "✅ Backend build completed!"
