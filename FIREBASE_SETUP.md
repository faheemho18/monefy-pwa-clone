# 🔥 Firebase Setup Guide

This guide will help you set up Firebase for the Monefy PWA Clone project.

## Prerequisites

- Node.js and npm installed
- A Google account
- Firebase CLI installed globally: `npm install -g firebase-tools`

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `monefy-pwa-clone` (or your preferred name)
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

## 2. Enable Firebase Services

### Enable Authentication

1. In the Firebase console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Click "Save"

### Enable Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll deploy security rules later)
4. Select a location closest to your users
5. Click "Done"

## 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. In the "General" tab, scroll down to "Your apps"
3. Click "Add app" and select the web icon `</>`
4. Enter app nickname: `monefy-pwa-web`
5. **Check** "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy the `firebaseConfig` object

## 4. Set Environment Variables

Create a `.env.local` file in the project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Development Settings
VITE_USE_FIREBASE_EMULATORS=false
VITE_APP_NAME=Monefy PWA Clone
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

Replace the placeholder values with your actual Firebase config values.

## 5. Initialize Firebase CLI

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select the following services:
# - Firestore
# - Hosting
# - Emulators

# Use existing project and select your project
# Accept default files (firestore.rules, firestore.indexes.json)
# Set public directory to: dist
# Configure as single-page app: Yes
# Set up automatic builds: No
# Set up emulators for Firestore and Authentication
```

## 6. Deploy Security Rules

```bash
# Deploy Firestore rules
npm run firebase:rules

# Deploy Firestore indexes
npm run firebase:indexes
```

## 7. Test the Setup

### Option A: Test with Emulators (Recommended for Development)

```bash
# Start Firebase emulators
npm run firebase:emulators

# In another terminal, start the dev server
npm run dev
```

Update your `.env.local`:
```bash
VITE_USE_FIREBASE_EMULATORS=true
```

### Option B: Test with Production Firebase

```bash
# Start the dev server
npm run dev
```

Ensure `VITE_USE_FIREBASE_EMULATORS=false` in your `.env.local`.

## 8. Verify Setup

1. Open the app in your browser
2. Try to register a new account
3. Check the Firebase console:
   - **Authentication** should show the new user
   - **Firestore** should show user and household documents

## Firebase Emulator UI

When running emulators, access the UI at: http://localhost:4000

- **Authentication**: View and manage test users
- **Firestore**: Browse and edit database documents

## Production Deployment

When ready for production:

```bash
# Build and deploy to Firebase Hosting
npm run firebase:deploy
```

## Security Rules

The app uses comprehensive Firestore security rules that ensure:

- Users can only access their own data
- Household members can read/write shared household data
- Transactions require proper validation
- No unauthorized access to other users' data

## Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions"**
   - Check Firestore security rules are deployed
   - Ensure user is authenticated

2. **"Failed to get document because the client is offline"**
   - Check internet connection
   - Enable offline persistence (already configured)

3. **Environment variables not loading**
   - Ensure `.env.local` file exists in project root
   - Restart development server after changing env vars

### Debug Mode

Enable debug logging:

```javascript
// Add to src/lib/firebase.ts for debugging
import { enableNetwork, disableNetwork } from 'firebase/firestore'

// Log connection state
console.log('Firebase initialized:', app)
```

## Cost Optimization

This setup is designed for zero-cost operation:

- **Firestore**: 50K reads, 20K writes, 20K deletes per day (free tier)
- **Authentication**: Unlimited users (free tier)
- **Hosting**: 10GB storage, 125K requests per month (free tier)

For 2 users with moderate usage, this will stay well within free limits.

## Next Steps

Once Firebase is set up:

1. ✅ Firebase Authentication configured
2. ✅ Firestore database enabled
3. ✅ Security rules deployed
4. ✅ Environment variables configured
5. ⏳ Start building the authentication UI components

Your Firebase backend is now ready for the Monefy PWA Clone! 🚀