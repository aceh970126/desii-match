# Google OAuth Deep Link Not Working - Complete Fix Guide

## Problem

After authenticating with Google in the browser, the browser doesn't redirect back to your app.

## Solution Steps

### Step 1: Configure Supabase Redirect URLs (CRITICAL)

1. **Go to Supabase Dashboard**

   - Navigate to https://app.supabase.com
   - Select your project

2. **Go to Authentication > URL Configuration**

3. **Set these EXACTLY:**
   - **Site URL**: `togetherapp://`
   - **Redirect URLs**: Add both of these lines:
     ```
     togetherapp://**
     togetherapp://
     ```
4. **Click Save** and **wait 2-3 minutes** for changes to propagate

### Step 2: Verify Google Cloud Console

1. **Go to Google Cloud Console** → Credentials
2. **Find your Web application OAuth 2.0 client**
3. **Authorized redirect URIs** should include:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
4. **Save** if you made changes

### Step 3: Verify Android Configuration

Your `android/app/src/main/AndroidManifest.xml` should have this (already configured ✅):

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="togetherapp"/>
</intent-filter>
```

### Step 4: Restart Your App

```bash
# Stop the current dev server (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

### Step 5: Test on Physical Device

⚠️ **Important**: OAuth deep linking often doesn't work well on emulators. Always test on a **real device**.

```bash
# For Android
npx expo start --android

# Or scan the QR code with Expo Go
```

## How to Verify It's Working

### In Console Logs, You Should See:

```
GoogleSignInButton: Starting Google sign-in flow
GoogleSignInButton: Opening OAuth URL
GoogleSignInButton: Browser result: {type: "success", url: "togetherapp://..."}
GoogleSignInButton: Extracted tokens: {hasAccessToken: true, hasRefreshToken: true}
GoogleSignInButton: Session established
Successfully signed in with Google!
```

### What Different Results Mean:

| Result Type        | What It Means                         | Solution                   |
| ------------------ | ------------------------------------- | -------------------------- |
| `type: "success"`  | ✅ Redirect worked                    | Perfect!                   |
| `type: "dismiss"`  | ❌ Browser closed without redirecting | Fix Supabase redirect URLs |
| `type: "cancel"`   | User cancelled                        | User action, not an error  |
| Stays on localhost | ❌ Wrong redirect URL                 | Update Supabase Site URL   |

## Common Issues & Fixes

### Issue 1: Browser Shows "localhost:3000" After Auth

**Cause**: Supabase Site URL is not configured

**Fix**:

- Set Supabase Site URL to: `togetherapp://`
- Remove any `localhost` URLs from redirect list
- Save and wait 2 minutes

### Issue 2: Browser Closes But Doesn't Return to App

**Cause**: Redirect URL not in allowed list

**Fix**:

- Add `togetherapp://**` to Supabase Redirect URLs
- Also add `togetherapp://` (without wildcards)
- Save and restart your app

### Issue 3: "Invalid Redirect URL" Error

**Cause**: Redirect URL format incorrect

**Fix**:

- Use exactly: `togetherapp://**` (with `**` not `*`)
- Make sure there's `://` after scheme
- No trailing slashes

### Issue 4: Works on iOS but Not Android

**Cause**: Intent filter not configured or app not rebuilt

**Fix**:

- Verify AndroidManifest.xml has the intent filter (✅ already there)
- Rebuild: `npx expo run:android` (for development builds)
- Or restart Expo: `npx expo start --clear`

### Issue 5: Emulator Doesn't Redirect

**Cause**: Emulators have limited deep link support

**Fix**:

- ⚠️ **Always test on a real device**
- Emulators are unreliable for OAuth flows

## Testing Checklist

Before testing, verify:

- [ ] Supabase Site URL = `togetherapp://`
- [ ] Supabase Redirect URLs includes `togetherapp://**`
- [ ] Google OAuth redirect = `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- [ ] Restarted dev server with `--clear` flag
- [ ] Testing on **physical device** (not emulator)
- [ ] Waited 2-3 minutes after Supabase config changes

## Debug Commands

If still having issues, check these:

### 1. Verify Deep Link Scheme

```bash
# Check app.json has the scheme
grep -A 2 "scheme" app.json
# Should show: "scheme": "togetherapp"
```

### 2. Test Deep Link Manually (Android)

```bash
adb shell am start -W -a android.intent.action.VIEW -d "togetherapp://"
```

This should open your app. If not, deep linking is broken.

### 3. Check Supabase Configuration

```bash
# View your Supabase project settings
# Look for: Site URL and Redirect URLs
```

## Expected Flow

```
User taps "Continue with Google"
  ↓
[App] Opens browser with Supabase OAuth URL
  ↓
[Browser] User authenticates with Google
  ↓
[Google] Redirects to: https://YOUR_PROJECT.supabase.co/auth/v1/callback?code=...
  ↓
[Supabase] Processes code, exchanges for tokens
  ↓
[Supabase] Redirects to: togetherapp://#access_token=xxx&refresh_token=yyy
  ↓
[Android] Intent filter catches "togetherapp://" scheme
  ↓
[App] Opens and processes deep link
  ↓
[App] Extracts tokens and creates session
  ↓
✅ User is signed in!
```

## Still Not Working?

1. **Double-check Supabase configuration**

   - Site URL: `togetherapp://`
   - Redirect URLs: `togetherapp://**` AND `togetherapp://`

2. **Clear everything and restart**

   ```bash
   # Stop dev server
   # Clear cache
   npx expo start --clear
   ```

3. **Test on real device, not emulator**

4. **Wait 2-3 minutes after changing Supabase settings**

5. **Check console logs** for exact error messages

6. **Verify Google Cloud Console** has correct redirect URI

## Quick Reference

| Setting                | Value                                               |
| ---------------------- | --------------------------------------------------- |
| App Scheme             | `togetherapp`                                       |
| Deep Link              | `togetherapp://`                                    |
| Supabase Site URL      | `togetherapp://`                                    |
| Supabase Redirect URLs | `togetherapp://**` and `togetherapp://`             |
| Google OAuth Redirect  | `https://YOUR_PROJECT.supabase.co/auth/v1/callback` |

---

After following these steps, the OAuth flow should properly redirect from the browser back to your app! 🎉
