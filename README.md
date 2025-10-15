# Wherever You Are - React Native Dating App

A modern React Native dating application built with Expo and Supabase. This app features user authentication, profile creation with onboarding flow, and core dating app functionality including individual and family account support.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see PROJECT_DOCUMENTATION.md)
# Run database migration (see PROJECT_DOCUMENTATION.md)

# Start the app
npm start
```

---

## 📚 Documentation

**For complete setup and usage instructions, see:**

- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete documentation

**For database setup:**

- **[DATABASE_SETUP.sql](./DATABASE_SETUP.sql)** - Run this in Supabase SQL Editor

---

## ✨ Features

### Authentication

- Email/password sign up and sign in
- User session management
- Automatic navigation based on authentication state

### Account Types

- **Individual Accounts**: Single profile per user
- **Family Accounts**: Multiple profiles per user with profile switching

### Onboarding Flow (4 Steps)

1. **Account Type Selection**: Choose individual or family account
2. **Profile Information**: Name, gender, age (18+), bio
3. **Interests & Hobbies**: Select from predefined interest categories
4. **Avatar Upload**: Take photo or select from gallery
5. **Profile Preview**: Review and edit all information before saving

### Main App Features

- **Discover**: Swipe through profiles with smart interest matching
- **Likes**: View liked profiles and manage matches
- **Messages**: Real-time chat with matched users, read receipts
- **Profile**: Edit your profile, switch between family members
- **Family Dashboard**: Create and manage family member profiles

### Backend Integration

- Supabase authentication
- PostgreSQL database with Row Level Security (RLS)
- Supabase storage for avatar images
- Real-time messaging and presence

---

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Navigation**: React Navigation v6
- **State Management**: React Context
- **Image Handling**: Expo Image Picker
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler

---

## 📱 Screenshots

The app includes beautifully designed screens with:

- Clean, modern UI design
- Intuitive navigation flow
- Responsive layouts for different screen sizes
- Beautiful profile cards and interaction buttons
- Smooth animations and gestures

---

## 🏗️ Project Structure

```
togetherApp/
├── components/         # Reusable UI components
├── contexts/          # React Context providers
├── navigation/        # Navigation configuration
├── screens/           # App screens
│   └── onboarding/    # Onboarding flow screens
├── services/          # API and service layers
├── utils/             # Utility functions
├── DATABASE_SETUP.sql # Database migration script
└── PROJECT_DOCUMENTATION.md # Complete documentation
```

---

## 🔐 Environment Setup

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed setup instructions.

---

## 🗄️ Database Setup

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run the complete migration script: **[DATABASE_SETUP.sql](./DATABASE_SETUP.sql)**
3. Set up avatar storage bucket (instructions in PROJECT_DOCUMENTATION.md)

---

## 🎯 Key Concepts

### Profile-Based Architecture

**Individual Accounts:**

- 1 profile with `user_id = auth.uid()`
- Direct profile access

**Family Accounts:**

- Multiple profiles with same `user_id = auth.uid()`
- Each profile has unique `id`
- Switch between profiles
- Only one profile active at a time (`is_active = true`)

**Important:** All features (messages, likes, matches) use `profile.id` not `user_id`

---

## 🚢 Running the App

### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Production Build

```bash
# Using Expo EAS Build
eas build --platform ios
eas build --platform android
```

---

## 🐛 Common Issues

See the **Troubleshooting** section in [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

[Your contribution guidelines]

---

## 💬 Support

[Your support information]

---

## 🎉 Acknowledgments

Built with ❤️ using:

- React Native & Expo
- Supabase
- React Navigation
- React Native Reanimated

---

**Made with 💕 - Wherever you are**
