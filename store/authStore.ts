import { CONFIG } from "@/config";
import { AuthService } from "@/services/firebase";
import type { User } from "@/types";
import auth from "@react-native-firebase/auth";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  emailVerified: boolean;
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: User["role"],
  ) => Promise<void>;
  logout: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => Promise<void>;
  /** Re-checks the signed-in user's email verification; signs them in when verified. */
  refreshVerification: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  emailVerified: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      emailVerified: user ? auth().currentUser?.emailVerified || false : false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const user = await AuthService.login(email, password);
      set({
        user,
        isAuthenticated: true,
        emailVerified: auth().currentUser?.emailVerified || false,
      });
    } catch (error: any) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true });
    try {
      const user = await AuthService.register(name, email, password, role);

      // If email verification is required, don't set as authenticated
      if (CONFIG.EMAIL_VERIFICATION_REQUIRED) {
        set({
          user,
          isAuthenticated: false,
          emailVerified: false,
        });
      } else {
        set({
          user,
          isAuthenticated: true,
          emailVerified: true,
        });
      }
    } catch (error: any) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
      set({
        user: null,
        isAuthenticated: false,
        emailVerified: false,
      });
    } catch (error: any) {
      throw error;
    }
  },

  resendVerificationEmail: async () => {
    try {
      await AuthService.resendVerificationEmail();
    } catch (error: any) {
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      await AuthService.resetPassword(email);
    } catch (error: any) {
      throw error;
    }
  },

  refreshVerification: async () => {
    const current = auth().currentUser;
    if (!current) return false;
    await current.reload();
    if (!auth().currentUser?.emailVerified) return false;
    const user = await AuthService.getCurrentUser();
    if (!user) return false;
    set({ user, isAuthenticated: true, emailVerified: true });
    return true;
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    // Resolve once the first auth state is known, so the app doesn't flash the sign-in screen
    // while a saved session is being restored.
    let resolveFirst: () => void = () => {};
    const firstState = new Promise<void>((r) => (resolveFirst = r));
    const timeout = setTimeout(() => resolveFirst(), 8000);
    try {
      // Listen to auth state changes
      AuthService.onAuthStateChanged(async (firebaseUser) => {
        try {
          await handleAuthState(firebaseUser);
        } finally {
          clearTimeout(timeout);
          resolveFirst();
        }
      });
      await firstState;
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isLoading: false });
    }

    async function handleAuthState(firebaseUser: Parameters<Parameters<typeof AuthService.onAuthStateChanged>[0]>[0]) {
      {
        if (firebaseUser) {
          // Check email verification
          if (
            CONFIG.EMAIL_VERIFICATION_REQUIRED &&
            !firebaseUser.emailVerified
          ) {
            set({
              user: null,
              isAuthenticated: false,
              emailVerified: false,
              isLoading: false,
            });
            return;
          }

          // Get user data from Firestore (retry once: Firestore can be briefly unavailable at startup)
          let user = await AuthService.getCurrentUser();
          if (!user) {
            await new Promise((r) => setTimeout(r, 1500));
            user = await AuthService.getCurrentUser();
          }
          if (user) {
            set({
              user,
              isAuthenticated: true,
              emailVerified: firebaseUser.emailVerified,
              isLoading: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              emailVerified: false,
              isLoading: false,
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            emailVerified: false,
            isLoading: false,
          });
        }
      }
    }
  },
}));
