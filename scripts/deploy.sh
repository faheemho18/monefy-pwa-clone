#!/bin/bash

# Deployment script for Monefy PWA Clone

set -e

echo "🚀 Starting deployment process..."

echo "📦 Building project..."
npm run build

echo "🔍 Checking build output..."
if [ ! -d "dist" ]; then
    echo "❌ Build failed - no dist folder found"
    exit 1
fi

echo "☁️  Deploying to Vercel..."
echo "Note: Make sure you're logged in with 'vercel login'"

# Deploy to production
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your app should be live at the provided URL"