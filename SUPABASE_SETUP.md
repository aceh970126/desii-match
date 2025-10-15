# Supabase Setup

## 1) Get API Keys

- Supabase → Settings → API
- Copy Project URL → `EXPO_PUBLIC_SUPABASE_URL`
- Copy anon/public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2) Environment (.env)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3) Database Migration

- Supabase → SQL Editor → run `DATABASE_SETUP.sql`

## 4) Storage (optional, for avatars)

- Create bucket `avatars` (public)
- Add RLS policies if required by your org

## 5) Deep Links and Redirects

- App scheme: `togetherapp`
- App callback: `togetherapp://auth/callback`

In Supabase → Authentication → URL configuration:

- Site URL: `togetherapp://`
- Redirect URLs:
  - `togetherapp://*`
  - `togetherapp://auth/callback`

## 6) Google OAuth (via Supabase)

- Enable Google provider in Supabase → Authentication → Providers
- In Google Cloud Console, create OAuth credentials (Web + Android as needed)
- Authorized redirect URI (Web):
  - `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Add client IDs in Supabase provider settings

## 7) Verify in App

Ensure the app imports URL polyfill and uses the scheme.

- `index.js`: import `react-native-url-polyfill/auto`
- App deep link scheme is configured in `app.json`.

## 8) Test

```bash
npx expo start --clear
```

- Run app → Continue with Google → Confirm session appears in Supabase

## Troubleshooting

- Redirect goes to localhost: update Supabase Site URL and Redirect URLs as above
- "Invalid redirect": ensure `togetherapp://*` is added
- Session missing: verify deep link handling and polyfill import
