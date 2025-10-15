# Google Authentication Setup Guide

This guide will help you complete the Google OAuth setup for your TogetherApp.

## What Has Been Implemented

✅ **Code Implementation Complete:**

- Installed required dependencies (`expo-auth-session`, `expo-web-browser`, `expo-crypto`)
- Created `GoogleSignInButton` component for reusable Google sign-in functionality
- Integrated Google sign-in button into both `SignInScreen` and `SignUpScreen`
- Added URL polyfill for proper OAuth handling
- Configured deep linking scheme (`togetherapp://`) in `app.json`
- Implemented automatic profile creation for Google sign-in users

## Required Configuration Steps

### Step 1: Set Up Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

   - Sign in with your Google account
   - Create a new project or select an existing one

2. **Enable Google Sign-In API**

   - Navigate to **APIs & Services > Library**
   - Search for "Google+ API" or "Google Identity"
   - Click **Enable**

3. **Create OAuth 2.0 Credentials**

   Navigate to **APIs & Services > Credentials** and create two sets of credentials:

   #### A. For Web Application (iOS/Web fallback):

   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `TogetherApp Web`
   - **Authorized redirect URIs**: Add your Supabase callback URL:

     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```

     _(Replace `YOUR_PROJECT_ID` with your actual Supabase project ID)_

   - Click **Create** and note the **Client ID** (you'll need this for Supabase)

   #### B. For Android Application:

   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Android**
   - Name: `TogetherApp Android`
   - **Package name**:

     - For development with Expo Go: `host.exp.exponent`
     - For production: Your app's bundle identifier (check `app.json`)

   - **SHA-1 Certificate Fingerprint**:

     - **For Debug Build**, run:
       ```bash
       keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
       ```
     - **For Production Build**: Get from Google Play Console > App Integrity

   - Click **Create** and note the **Client ID**

4. **Copy Your Client IDs**
   - You should now have two Client IDs:
     - Web Client ID: `xxxxx.apps.googleusercontent.com`
     - Android Client ID: `yyyyy.apps.googleusercontent.com`

### Step 2: Configure Supabase

1. **Go to Your Supabase Dashboard**

   - Navigate to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Enable Google Provider**

   - Go to **Authentication > Providers**
   - Find **Google** in the list
   - Toggle **Enabled** to ON

3. **Add Google Client IDs**

   - In the **Authorized Client IDs** field, paste BOTH client IDs separated by a comma (no spaces):
     ```
     xxxxx.apps.googleusercontent.com,yyyyy.apps.googleusercontent.com
     ```
   - Replace with your actual Client IDs from Google Cloud Console

4. **Verify Redirect URL**

   - The **Redirect URL** should be:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - This should match what you added in Google Cloud Console

5. **Optional: Customize Scopes**

   - Default scopes are `email` and `profile`
   - You can add more if needed (e.g., `openid`)

6. **Click Save**

### Step 3: Get SHA-1 Fingerprint (Android)

If you haven't already, you need to get your SHA-1 certificate fingerprint:

#### For Development (using Expo):

```bash
# On macOS/Linux:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# On Windows:
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the line that says **SHA1:** and copy that value to Google Cloud Console.

#### For Production:

1. Build your app for production
2. Go to **Google Play Console > App Integrity**
3. Copy the SHA-1 from there

### Step 4: Configure Android Package (Optional)

If you're building a standalone Android app, update your `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.yourdomain.togetherapp"  // Your actual package name
        ...
    }
}
```

Make sure this matches the package name you entered in Google Cloud Console.

### Step 5: Test Your Implementation

1. **Start Your Development Server**

   ```bash
   npx expo start
   ```

2. **Test on Physical Device** (recommended for OAuth testing)

   - Scan the QR code with Expo Go
   - Or run `npx expo start --android` or `npx expo start --ios`

3. **Try Signing In with Google**

   - Open the app
   - Tap "Continue with Google" button
   - Select your Google account
   - Grant permissions
   - You should be redirected back to the app

4. **Verify in Supabase**
   - Go to **Authentication > Users** in your Supabase dashboard
   - You should see the new user created with Google provider

## How It Works

1. **User taps "Continue with Google"**

   - `GoogleSignInButton` component triggers the OAuth flow

2. **OAuth Flow Initiated**

   - Supabase generates an OAuth URL
   - App opens the URL in system browser using `expo-web-browser`

3. **User Authenticates**

   - User logs in with Google
   - Google redirects to Supabase callback URL

4. **Supabase Processes**

   - Supabase exchanges the auth code for tokens
   - Redirects back to your app using deep link (`togetherapp://auth/callback`)

5. **Session Established**
   - Supabase session is automatically saved via AsyncStorage
   - App checks if user has a profile
   - Creates profile if needed or navigates to appropriate screen

## Troubleshooting

### Common Issues

1. **"Redirect URI Mismatch" Error**

   - Ensure the redirect URI in Google Cloud Console EXACTLY matches your Supabase callback URL
   - Format: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

2. **"Invalid Client" Error**

   - Double-check that you added BOTH Client IDs to Supabase (web and Android)
   - Ensure no spaces in the comma-separated list

3. **Browser Doesn't Redirect Back**

   - Verify the deep linking scheme in `app.json`: `"scheme": "togetherapp"`
   - Test on a physical device (emulators can have deep linking issues)

4. **SHA-1 Mismatch (Android)**

   - Ensure the SHA-1 fingerprint in Google Cloud Console matches your keystore
   - For Expo Go, use `host.exp.exponent` as package name

5. **"No Session" After Redirect**

   - Ensure `react-native-url-polyfill/auto` is imported at the top of `index.js` ✅ (already done)
   - Check that `expo-web-browser` is installed correctly

6. **iOS Associated Domains**
   - For production iOS apps, you'll need to configure associated domains
   - See [Expo documentation](https://docs.expo.dev/guides/linking/) for details

### Testing Tips

- **Use Physical Devices**: OAuth flows work best on real devices
- **Check Logs**: Use `console.log` or check Supabase logs for errors
- **Test Both Sign-In and Sign-Up**: Both screens have Google buttons
- **Verify Profile Creation**: Check that profiles are created automatically for Google users

## Security Notes

- ✅ **No Client Secret Required**: Mobile OAuth doesn't need client secrets
- ✅ **PKCE Flow**: Supabase uses PKCE for secure OAuth on mobile
- ✅ **Auto-Refresh**: Session tokens refresh automatically
- ✅ **Secure Storage**: Tokens stored securely via AsyncStorage

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Expo Web Browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## Support

If you encounter issues:

1. Check Supabase logs: **Authentication > Logs**
2. Check Google Cloud Console: **APIs & Services > Credentials**
3. Verify all Client IDs are correct
4. Test on a physical device

---

**Next Steps After Setup:**
Once you've completed all configuration steps, rebuild your app and test the Google sign-in flow. Users will be able to sign in/sign up using their Google accounts seamlessly!
