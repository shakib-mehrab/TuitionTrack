import { FirestoreService } from "@/services/firebase";
import firebase from "@react-native-firebase/app";
import { CONFIG } from "./firebase";

/**
 * Initialize Firebase App
 *
 * Note: @react-native-firebase automatically initializes from native config:
 * - Android: google-services.json
 * - iOS: GoogleService-Info.plist
 *
 * We just verify it's available and set up offline persistence.
 */
export async function initializeFirebase(): Promise<void> {
  try {
    // Firebase is automatically initialized by @react-native-firebase
    // from google-services.json (Android) or GoogleService-Info.plist (iOS)
    // Just verify it's available
    const app = firebase.app();
    console.log("✅ Firebase app initialized:", app.name);
    console.log("✅ Firebase config loaded from native files");

    // Initialize offline persistence for Firestore
    if (CONFIG.ENABLE_OFFLINE_PERSISTENCE) {
      try {
        await FirestoreService.initializeOfflinePersistence();
        console.log("✅ Firestore offline persistence enabled");
      } catch (persistenceError: any) {
        // Persistence might already be enabled, log but don't fail
        console.warn(
          "⚠️ Firestore persistence setup:",
          persistenceError?.message,
        );
      }
    }
  } catch (error: any) {
    console.error("❌ Firebase initialization error:", error?.message || error);
    throw error;
  }
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp() {
  return firebase.app();
}

export { COLLECTIONS, CONFIG, firebaseConfig, STORAGE_PATHS } from "./firebase";
