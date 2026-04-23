/**
 * Firebase Configuration
 *
 * Using Expo's built-in environment variable support.
 * Variables prefixed with EXPO_PUBLIC_ in .env are automatically available.
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Firebase Collections
 * Centralized collection names for consistency
 */
export const COLLECTIONS = {
  USERS: "users",
  TUITIONS: "tuitions",
  CLASS_LOGS: "class_logs",
  HOMEWORK: "homework",
  ACTIVITY_LOGS: "activity_logs",
  PAYMENT_HISTORY: "payment_history",
  INVITATIONS: "invitations",
} as const;

/**
 * Storage paths
 */
export const STORAGE_PATHS = {
  HOMEWORK_ATTACHMENTS: "homework_attachments",
  PROFILE_PICTURES: "profile_pictures",
} as const;

/**
 * Configuration constants
 */
export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ENABLE_OFFLINE_PERSISTENCE: true,
  EMAIL_VERIFICATION_REQUIRED: true,
  ENABLE_FILE_UPLOADS: false, // Set to true if Firebase Storage is enabled
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
} as const;
