import { COLLECTIONS, CONFIG, firebaseConfig } from "@/config/firebase";
import type { User, UserRole } from "@/types";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

/**
 * Firebase Authentication Service
 * Handles all authentication-related operations
 */
export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    try {
      // Create auth user
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const { uid } = userCredential.user;

      // Send verification email
      if (CONFIG.EMAIL_VERIFICATION_REQUIRED) {
        const actionCodeSettings = {
          // URL to redirect to after verification
          url: `https://${firebaseConfig.authDomain}`,
          // This must be true for email link sign-in
          handleCodeInApp: false,
          iOS: {
            bundleId: "com.tuitiontrack.app",
          },
          android: {
            packageName: "com.tuitiontrack.app",
            installApp: true,
            minimumVersion: "12",
          },
        };
        await userCredential.user.sendEmailVerification(actionCodeSettings);
      }

      // Update display name
      await userCredential.user.updateProfile({ displayName: name });

      // Create user document in Firestore
      const userData: User = {
        id: uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      await firestore().collection(COLLECTIONS.USERS).doc(uid).set(userData);

      return userData;
    } catch (error: any) {
      console.error("Registration error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in with email and password
   */
  static async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const { uid } = userCredential.user;

      // Check email verification
      if (
        CONFIG.EMAIL_VERIFICATION_REQUIRED &&
        !userCredential.user.emailVerified
      ) {
        await auth().signOut();
        throw new Error(
          "Please verify your email before logging in. Check your inbox.",
        );
      }

      // Get user data from Firestore
      const userDoc = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .get();

      if (!userDoc.exists) {
        throw new Error("User data not found");
      }

      return userDoc.data() as User;
    } catch (error: any) {
      console.error("Login error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  static async logout(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Failed to logout. Please try again.");
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error("Password reset error:", error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error("No user is currently signed in");
      }
      const actionCodeSettings = {
        url: `https://${firebaseConfig.authDomain}`,
        handleCodeInApp: false,
        iOS: {
          bundleId: "com.tuitiontrack.app",
        },
        android: {
          packageName: "com.tuitiontrack.app",
          installApp: true,
          minimumVersion: "12",
        },
      };
      await currentUser.sendEmailVerification(actionCodeSettings);
    } catch (error) {
      console.error("Resend verification error:", error);
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return null;

      const userDoc = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(currentUser.uid)
        .get();

      if (!userDoc.exists) return null;

      return userDoc.data() as User;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void,
  ): () => void {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Handle Firebase auth errors
   */
  private static handleAuthError(error: any): Error {
    const code = error.code;

    switch (code) {
      case "firestore/permission-denied":
        return new Error(
          "Login is blocked by Firebase security rules. Update Firestore Rules in Firebase Console and try again.",
        );
      case "auth/email-already-in-use":
        return new Error(
          "This email is already registered. Please login instead.",
        );
      case "auth/invalid-email":
        return new Error("Invalid email address.");
      case "auth/weak-password":
        return new Error("Password should be at least 6 characters.");
      case "auth/user-not-found":
        return new Error("No account found with this email.");
      case "auth/wrong-password":
        return new Error("Incorrect password.");
      case "auth/too-many-requests":
        return new Error("Too many failed attempts. Please try again later.");
      case "auth/network-request-failed":
        return new Error("Network error. Please check your connection.");
      case "auth/user-disabled":
        return new Error("This account has been disabled.");
      default:
        return new Error(
          error.message || "Authentication failed. Please try again.",
        );
    }
  }
}
