import { COLLECTIONS, CONFIG } from "@/config/firebase";
import type { User, UserRole } from "@/types";
import auth, {
  FirebaseAuthTypes,
  GoogleAuthProvider,
} from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

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
          url: `https://${CONFIG.GOOGLE_WEB_CLIENT_ID.split("-")[0]}.firebaseapp.com`,
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
        url: `https://${CONFIG.GOOGLE_WEB_CLIENT_ID.split("-")[0]}.firebaseapp.com`,
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
   * Configure Google Sign-In (call once at app startup)
   */
  static configureGoogleSignIn(): void {
    GoogleSignin.configure({
      webClientId: CONFIG.GOOGLE_WEB_CLIENT_ID,
    });
  }

  /**
   * Sign in with Google — returns user data and whether this is a new account.
   * If isNewUser is true, caller must call completeGoogleRegistration to pick a role.
   */
  static async loginWithGoogle(): Promise<{ user: User; isNewUser: boolean }> {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken)
        throw new Error("Google Sign-In failed — no ID token returned.");

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential =
        await auth().signInWithCredential(googleCredential);
      const { uid, displayName, email } = userCredential.user;
      const isNewUser = userCredential.additionalUserInfo?.isNewUser ?? false;

      if (!isNewUser) {
        const userDoc = await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(uid)
          .get();
        if (userDoc && userDoc.data()) {
          return { user: userDoc.data() as User, isNewUser: false };
        }
      }

      // New user or missing Firestore doc — return shell, role must be selected
      return {
        user: {
          id: uid,
          name: displayName || "User",
          email: email || "",
          role: "student",
          createdAt: new Date().toISOString(),
        },
        isNewUser: true,
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error("Sign-in cancelled.");
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error("Sign-in already in progress.");
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error("Google Play Services not available.");
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Complete Google registration by saving the user doc with their chosen role.
   */
  static async completeGoogleRegistration(role: UserRole): Promise<User> {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error("No user signed in.");

    const userData: User = {
      id: currentUser.uid,
      name: currentUser.displayName || "User",
      email: currentUser.email || "",
      role,
      createdAt: new Date().toISOString(),
    };

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(currentUser.uid)
      .set(userData);
    return userData;
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
