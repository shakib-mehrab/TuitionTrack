import type { User } from "@/types";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  logout: () => void;
}

// Mock credentials for testing the UI without Firebase
const MOCK_USERS: Record<string, User & { password: string }> = {
  "teacher@demo.com": {
    id: "teacher_1",
    name: "Rahul Sharma",
    email: "teacher@demo.com",
    role: "teacher",
    createdAt: "2025-01-01T00:00:00.000Z",
    password: "password123",
  },
  "student@demo.com": {
    id: "student_1",
    name: "Arjun Kumar",
    email: "student@demo.com",
    role: "student",
    createdAt: "2025-01-01T00:00:00.000Z",
    password: "password123",
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await new Promise((r) => setTimeout(r, 1000)); // simulate network
      const found = MOCK_USERS[email.toLowerCase()];
      if (!found || found.password !== password) {
        throw new Error("Invalid email or password");
      }
      const { password: _pw, ...user } = found;
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, _password, role) => {
    set({ isLoading: true });
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const user: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      set({ user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => set({ user: null, isAuthenticated: false }),
}));
