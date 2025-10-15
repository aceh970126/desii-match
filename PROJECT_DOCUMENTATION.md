# Together App - Complete Documentation

## 📱 Overview

A modern React Native dating app built with Expo and Supabase, featuring individual and family account support.

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js (v14+)
- npm or yarn
- Expo CLI
- Supabase account

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd togetherApp

# Install dependencies
npm install

# Configure environment (see Environment Setup below)
# Set up database (see Database Setup below)

# Run the app
npm start
```

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 🗄️ Database Setup

### Step 1: Run Migration Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the entire contents of `DATABASE_SETUP.sql`
4. Paste and run the script

This will set up:

- ✅ Profiles table (with family account support)
- ✅ User presence tracking
- ✅ Conversations and messages
- ✅ Likes and dislikes
- ✅ All necessary RLS policies

### Step 2: Set up Storage (Optional)

For avatar uploads:

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket called `avatars`
3. Make it **public**
4. Set up RLS policies:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow anyone to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 📊 Database Schema

### Profiles Table

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- full_name: TEXT
- gender: TEXT
- age: INTEGER
- bio: TEXT
- avatar: TEXT (URL)
- interests: TEXT[]
- account_type: TEXT ('individual' or 'family')
- is_active: BOOLEAN (which profile is currently active)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Key Concepts

**Individual Accounts:**

- Has 1 profile where `user_id = auth.uid()`
- `is_active = true` for that profile

**Family Accounts:**

- Has multiple profiles where `user_id = auth.uid()` (same for all)
- Each profile has unique `id`
- Only one profile has `is_active = true` at a time
- Can switch between profiles

**Important:** All features (messages, likes, etc.) use `profile.id` not `user_id`!

---

## 🎯 Features

### ✅ Implemented

- **Authentication**

  - Email/password sign up and sign in
  - Session management
  - Auto-logout on token expiration

- **Account Types**

  - Individual accounts (single profile)
  - Family accounts (multiple profiles per auth user)
  - Profile switching for family accounts

- **Onboarding Flow**

  - Account type selection
  - Profile creation (name, gender, age, bio)
  - Interest selection
  - Avatar upload
  - Profile preview

- **Core Features**
  - Discover page (swipe cards with interest matching)
  - Likes/dislikes with filtering
  - Match detection
  - Real-time messaging with read receipts
  - User presence (online/offline status)
  - Profile editing
  - Family profile management

### 📝 Data Flow

```
Auth User (auth.uid())
    ↓
Profiles (one or many)
    ↓ (active profile)
Features (likes, messages, etc.)
```

---

## 🏗️ Architecture

### Key Files

**Navigation:**

- `navigation/AuthStack.tsx` - Auth screens
- `navigation/MainTabs.tsx` - Main app tabs

**Contexts:**

- `contexts/ProfileContext.tsx` - Active profile management
- `contexts/ProfileRefreshContext.tsx` - Profile refresh trigger
- `contexts/OnboardingContext.tsx` - Onboarding state
- `contexts/ToastContext.tsx` - Toast notifications

**Services:**

- `services/supabaseClient.ts` - Supabase configuration
- `services/userService.ts` - All user/profile operations

**Main Screens:**

- `screens/DiscoverScreen.tsx` - Swipe cards
- `screens/LikeScreen.tsx` - View liked profiles
- `screens/ChatScreen.tsx` - Conversations list
- `screens/ConversationScreen.tsx` - Individual chat
- `screens/ProfileScreen.tsx` - Edit profile
- `screens/FamilyDashboardScreen.tsx` - Manage family profiles

---

## 🔐 Security (RLS Policies)

All tables use Row Level Security to ensure:

- Users can only see/modify their own data
- Profile-based permissions work for family accounts
- Proper isolation between users

Example (Likes):

```sql
-- Users can like using any of their profiles
CREATE POLICY "Users can like others"
ON likes FOR INSERT
WITH CHECK (
  liker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Auth session missing" error**

- User session expired
- Solution: Auto-handled by app, user will be redirected to sign-in

**2. "Row-level security policy violation"**

- RLS policies not set up correctly
- Solution: Re-run `DATABASE_SETUP.sql`

**3. "Duplicate key constraint violation"**

- Trying to insert duplicate data
- Solution: Check if record already exists, use upsert

**4. Profile switcher not working**

- Not a family account, or no other profiles
- Solution: Create additional family member profiles

**5. Messages not loading**

- Profile IDs not set up correctly
- Solution: Ensure all queries use `profile.id` not `user_id`

---

## 🎨 Customization

### Theme Colors

Edit `colors` in your components:

- Primary: `#FF6B6B` (pink/red)
- Background: `#fafafa` (light gray)
- Text: `#1a1a1a` (dark gray)

### Interests List

Edit `INTERESTS` array in:

- `screens/onboarding/Step2Interests.tsx`
- `screens/CreateChildProfileScreen.tsx`
- `screens/EditChildProfileScreen.tsx`
- `screens/ProfileScreen.tsx`

---

## 📱 Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Navigation:** React Navigation v6
- **State Management:** React Context
- **Real-time:** Supabase Realtime
- **Image Handling:** Expo Image Picker
- **Animations:** React Native Reanimated

---

## 🚢 Deployment

### Build for Production

```bash
# iOS
expo build:ios

# Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

### Environment Variables for Production

Ensure `.env` is properly configured with production Supabase credentials.

---

## 📄 License

[Your License Here]

---

## 👥 Contributing

[Your contribution guidelines]

---

## 📞 Support

[Your support contact]

---

## 🎉 Credits

Built with ❤️ using React Native and Supabase
