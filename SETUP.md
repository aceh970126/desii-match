# Project Setup (Expo + Supabase)

## Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm i -g expo`)
- Supabase account

## 1) Install & Run

```bash
npm install
npm start
```

## 2) Environment Variables

Create a `.env` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3) Database

- Open Supabase → SQL Editor
- Run `DATABASE_SETUP.sql`
- (Optional) Create public `avatars` storage bucket and apply policies if needed

## 4) Mobile Deep Linking

- App scheme: `desiimatch`
- Callback: `desiimatch://auth/callback`

## 5) Start in Development

```bash
npm start
# iOS: npm run ios
# Android: npm run android
# Web: npm run web
```

## 6) Production Build (EAS)

```bash
eas build --platform ios
eas build --platform android
```

## Project Structure (high level)

```
components/       # Reusable UI components
contexts/         # Context providers
navigation/       # Navigation config
screens/          # App screens (incl. onboarding)
services/         # Supabase client and services
utils/            # Helpers
DATABASE_SETUP.sql
```

## Troubleshooting

- If auth/session issues: re-run `DATABASE_SETUP.sql`
- Clear cache: `npx expo start --clear`
- Ensure `.env` values match Supabase Settings → API
