# Fix Google OAuth Redirect to localhost:3000

If you're seeing "localhost:3000" after Google authentication, you need to configure your Supabase redirect URLs properly.

## Problem

The browser is redirecting to `localhost:3000` instead of your app's deep link (`togetherapp://`).

## Solution

### Step 1: Configure Supabase Dashboard

1. **Go to your Supabase Dashboard**

   - Navigate to https://app.supabase.com
   - Select your project

2. **Update Site URL**

   - Go to **Authentication > URL Configuration**
   - Set **Site URL** to: `togetherapp://`
   - Click **Save**

3. **Add Redirect URLs**

   - In the same **URL Configuration** page
   - Under **Redirect URLs**, add:
     ```
     togetherapp://*
     togetherapp://auth/callback
     ```
   - Click **Save**

4. **Remove localhost URLs (if present)**
   - Remove any `localhost:3000` or `http://localhost` URLs from the redirect list
   - This prevents accidental redirects to localhost

### Step 2: Update Google Cloud Console (if needed)

1. **Go to Google Cloud Console**

   - Navigate to your OAuth 2.0 credentials

2. **Update Authorized Redirect URIs**

   - For your **Web application** credential
   - Make sure you have:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID

3. **Save Changes**

### Step 3: Test Again

1. **Restart your app**

   ```bash
   npx expo start --clear
   ```

2. **Try Google sign-in again**
   - The redirect should now go to `togetherapp://` instead of `localhost:3000`

## How It Works Now

```
User clicks "Continue with Google"
  ↓
Opens browser with Google OAuth
  ↓
User authenticates with Google
  ↓
Google redirects to: https://YOUR_PROJECT.supabase.co/auth/v1/callback?code=...
  ↓
Supabase processes the code
  ↓
Supabase redirects to: togetherapp://#access_token=...&refresh_token=...
  ↓
App catches the deep link
  ↓
Extracts tokens and sets session
  ↓
Success! User is signed in
```

## Important Supabase Settings

In your Supabase dashboard, make sure you have:

- ✅ **Site URL**: `togetherapp://`
- ✅ **Redirect URLs**:
  - `togetherapp://*`
  - `togetherapp://auth/callback`
- ❌ **Remove**: Any `localhost` URLs (unless you're testing on web)

## Troubleshooting

### Still seeing localhost?

- Clear your browser cache
- Restart the Expo dev server with `--clear` flag
- Double-check Supabase Site URL is set to `togetherapp://`
- Make sure you saved changes in Supabase dashboard

### "Invalid redirect URL" error?

- Add `togetherapp://*` to Supabase Redirect URLs
- Make sure the URL has `://` after the scheme
- Wait a few minutes for Supabase changes to propagate

### Redirect works but session not set?

- Check console logs for token extraction
- Make sure `react-native-url-polyfill/auto` is imported in `index.js`
- Verify the deep link listener is working

## Quick Reference

**Your App's Deep Link Scheme**: `togetherapp://`

**Supabase Configuration**:

- Site URL: `togetherapp://`
- Redirect URLs: `togetherapp://*`, `togetherapp://auth/callback`

**Google OAuth Redirect**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

---

After making these changes, the OAuth flow should redirect properly to your app instead of localhost! 🎉
