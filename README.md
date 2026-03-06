# TuitionTrack - Tuition Management Mobile App

> A production-grade React Native app for tutors and students to manage tuitions, classes, homework, and payments.

## 🚀 Quick Start

### For First-Time Setup

**⚠️ IMPORTANT: Start here for security!**

1. **[SECURITY_SETUP.md](SECURITY_SETUP.md)** - ⚠️ **Read this first!** Protect your Firebase credentials from GitHub
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete step-by-step setup
3. **[FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md)** - Firebase Console reference
4. **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** - What's implemented & next steps

**Quick Steps:**

1. Create Firebase project and configure services
2. Add `google-services.json` to `android/app/`
3. Update Firebase config in `eas.json` (already done!)
4. Build the app: `eas build --profile development --platform android`
5. Download APK from EAS build link (~15-20 mins)
6. Install on phone, seed database, and test!

### For Developers (App Already Configured)

```bash
# Install dependencies
npm install

# Start development server (for testing with Expo Go or dev client)
npx expo start

# Build APK using EAS Build (cloud build - no SDK needed!)
eas build --profile development --platform android

# Alternative: Local build (requires Android SDK)
npx expo run:android
```

---

## 🎯 Features

### For Teachers

- ✅ Dashboard with statistics
- ✅ Manage multiple tuitions
- ✅ Track class attendance
- ✅ Assign homework with deadlines
- ✅ Monitor payment status by month
- ✅ Generate invitation codes for students
- ✅ Export PDF reports
- ⏳ File attachments (optional - requires Firebase Storage)
- ⏳ Offline support with sync
- ⏳ Offline support with sync

### For Students

- ✅ View enrolled tuitions
- ✅ Check class history
- ✅ View assigned homework
- ✅ Submit comments on homework
- ✅ Check payment status
- ✅ Join tuitions via invitation code

---

## 🏗️ Tech Stack

- **Framework**: React Native with Expo (Development Build)
- **Navigation**: Expo Router (File-based routing)
- **State Management**: Zustand
- **Backend**: Firebase
  - Authentication (Email/Password)
  - Firestore Database (Real-time)
  - Cloud Storage (Optional - for file uploads)
- **UI Components**: React Native Paper
- **Fonts**: Poppins
- **PDF Generation**: expo-print

---

## 📱 Demo Accounts

After seeding the database:

**Teacher Account**:

- Email: `teacher@demo.com`
- Password: `password123`

**Student Account**:

- Email: `student@demo.com`
- Password: `password123`

---

## 📂 Project Structure

```
TuitionTrack/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (teacher)/         # Teacher dashboard & features
│   └── (student)/         # Student dashboard & features
├── components/            # Reusable UI components
├── config/                # Firebase & app configuration
├── services/              # Firebase service layer
│   └── firebase/
│       ├── auth.service.ts
│       ├── firestore.service.ts
│       └── storage.service.ts
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions
└── scripts/               # Database seeding scripts
```

---

## 🔐 Security

### Current Status (Development)

- Firestore: Test mode (⚠️ expires in 30 days)
- Storage: Test mode (⚠️ expires in 30 days)
- Email verification: Disabled for demo

### Before Production

- [ ] Implement Firestore security rules
- [ ] Implement Storage security rules
- [ ] Enable email verification
- [ ] Add rate limiting
- [ ] Enable Firebase App Check

---

## 🛠️ Development

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Android Studio (for Android development)
- Expo CLI
- Firebase account

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Follow [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for Firebase setup
4. Build: `npx expo run:android`

### Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Build and run on Android
npm run ios        # Build and run on iOS
npm run web        # Run on web (limited support)
npm run lint       # Run ESLint
```

---

## 📖 Documentation

- [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Complete setup instructions
- [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) - Development status
- [`Project_context.md`](Project_context.md) - Project requirements
- [`FIREBASE_SETUP_GUIDE.md`](FIREBASE_SETUP_GUIDE.md) - Firebase reference

---

## 🐛 Troubleshooting

### Build Issues

```bash
cd android && ./gradlew clean && cd ..
npm install
npx expo run:android
```

### Firebase Connection Issues

- Verify `google-services.json` is in `android/app/`
- Check Firebase services are enabled in console
- Ensure internet connection is active

### Authentication Issues

- Check EMAIL_VERIFICATION_REQUIRED setting
- Verify Email/Password provider is enabled in Firebase
- Check user exists in Firebase Console

See [`SETUP_GUIDE.md`](SETUP_GUIDE.md) for more troubleshooting tips.

---

## 🚦 Development Status

**Phase 1: Firebase Foundation** ✅ Complete

- [x] Firebase integration
- [x] Authentication service
- [x] Firestore database service
- [x] Storage service
- [x] Auth store updated
- [x] Database seeding
- [x] Documentation

**Phase 2: Real-time Data** ⏳ Next

- [ ] Update TeacherStore with Firebase
- [ ] Real-time tuition sync
- [ ] Real-time class logs
- [ ] Real-time homework sync

See [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) for full roadmap.

---

## 📄 License

This project is private and proprietary.

---

## 🤝 Support

For setup help or issues, check:

1. [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Complete setup instructions
2. [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) - Common issues
3. Firebase Console logs
4. React Native error logs

---

**Built with ❤️ using React Native & Firebase**
