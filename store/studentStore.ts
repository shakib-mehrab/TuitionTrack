import { FirestoreService } from "@/services/firebase/firestore.service";
import type {
    ActivityLog,
    ClassLog,
    Homework,
    HomeworkComment,
    Tuition,
} from "@/types";
import { create } from "zustand";

// ─── Store Interface ────────────────────────────────────────────────
interface StudentState {
  // Data
  tuitions: Tuition[];
  classLogs: ClassLog[];
  activityLogs: ActivityLog[];
  homework: Homework[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Initialize real-time listeners
  initialize: (studentId: string) => void;
  cleanup: () => void;

  // Join tuition
  joinTuition: (
    code: string,
    studentId: string,
    studentName: string,
    studentEmail: string,
  ) => Promise<void>;

  // Homework
  markHomeworkComplete: (id: string, completed: boolean) => Promise<void>;
  addComment: (
    homeworkId: string,
    comment: Omit<HomeworkComment, "id" | "timestamp">,
  ) => Promise<void>;

  // Selectors
  getLogsForTuition: (tuitionId: string) => ClassLog[];
  getHomeworkForTuition: (tuitionId: string) => Homework[];
  getActivityForTuition: (tuitionId: string) => ActivityLog[];
  getTuitionById: (id: string) => Tuition | undefined;
  getClassCountForMonth: (tuitionId: string, month: string) => number;
}

// Unsubscribe functions for Firebase listeners
let unsubscribeTuitions: (() => void) | null = null;
let unsubscribeClassLogs: Map<string, () => void> = new Map();
let unsubscribeHomework: Map<string, () => void> = new Map();
let unsubscribeActivity: Map<string, () => void> = new Map();

export const useStudentStore = create<StudentState>((set, get) => ({
  tuitions: [],
  classLogs: [],
  activityLogs: [],
  homework: [],
  isLoading: false,
  isInitialized: false,

  // ── Initialize Firebase Listeners ──
  initialize: (studentId: string) => {
    if (get().isInitialized) return;

    set({ isLoading: true, isInitialized: true });

    // Subscribe to tuitions where student is enrolled
    unsubscribeTuitions = FirestoreService.subscribeToStudentTuitions(
      studentId,
      (tuitions) => {
        set({ tuitions, isLoading: false });

        // Subscribe to class logs, homework, and activity for each tuition
        tuitions.forEach((tuition) => {
          // Class logs
          if (!unsubscribeClassLogs.has(tuition.id)) {
            const unsub = FirestoreService.subscribeToClassLogs(
              tuition.id,
              (logs) => {
                set((state) => ({
                  classLogs: [
                    ...state.classLogs.filter(
                      (l) => l.tuitionId !== tuition.id,
                    ),
                    ...logs,
                  ],
                }));
              },
            );
            unsubscribeClassLogs.set(tuition.id, unsub);
          }

          // Homework
          if (!unsubscribeHomework.has(tuition.id)) {
            const unsub = FirestoreService.subscribeToHomework(
              tuition.id,
              (hw) => {
                set((state) => ({
                  homework: [
                    ...state.homework.filter((h) => h.tuitionId !== tuition.id),
                    ...hw,
                  ],
                }));
              },
            );
            unsubscribeHomework.set(tuition.id, unsub);
          }

          // Activity logs
          if (!unsubscribeActivity.has(tuition.id)) {
            const unsub = FirestoreService.subscribeToActivityLogs(
              tuition.id,
              (activity) => {
                set((state) => ({
                  activityLogs: [
                    ...state.activityLogs.filter(
                      (a) => a.tuitionId !== tuition.id,
                    ),
                    ...activity,
                  ],
                }));
              },
            );
            unsubscribeActivity.set(tuition.id, unsub);
          }
        });
      },
    );
  },

  cleanup: () => {
    // Unsubscribe from all listeners
    if (unsubscribeTuitions) {
      unsubscribeTuitions();
      unsubscribeTuitions = null;
    }

    unsubscribeClassLogs.forEach((unsub) => unsub());
    unsubscribeClassLogs.clear();

    unsubscribeHomework.forEach((unsub) => unsub());
    unsubscribeHomework.clear();

    unsubscribeActivity.forEach((unsub) => unsub());
    unsubscribeActivity.clear();

    set({
      tuitions: [],
      classLogs: [],
      activityLogs: [],
      homework: [],
      isInitialized: false,
      isLoading: false,
    });
  },

  // ── Join Tuition ──
  joinTuition: async (code, studentId, studentName, studentEmail) => {
    try {
      set({ isLoading: true });
      await FirestoreService.joinTuitionWithCode(
        code,
        studentId,
        studentName,
        studentEmail,
      );
      // Real-time listener will update the state
    } catch (error) {
      console.error("Join tuition error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Homework ──
  markHomeworkComplete: async (id, completed) => {
    try {
      await FirestoreService.updateHomework(id, { completed });
      // Real-time listener will update the state
    } catch (error) {
      console.error("Mark homework complete error:", error);
      throw error;
    }
  },

  addComment: async (homeworkId, comment) => {
    try {
      await FirestoreService.addHomeworkComment(homeworkId, comment);
      // Real-time listener will update the state
    } catch (error) {
      console.error("Add comment error:", error);
      throw error;
    }
  },

  // ── Selectors ──
  getLogsForTuition: (tuitionId) =>
    get()
      .classLogs.filter((l) => l.tuitionId === tuitionId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),

  getHomeworkForTuition: (tuitionId) =>
    get()
      .homework.filter((h) => h.tuitionId === tuitionId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),

  getActivityForTuition: (tuitionId) =>
    get()
      .activityLogs.filter((a) => a.tuitionId === tuitionId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),

  getTuitionById: (id) => get().tuitions.find((t) => t.id === id),

  getClassCountForMonth: (tuitionId, month) =>
    get().classLogs.filter(
      (l) => l.tuitionId === tuitionId && l.date.startsWith(month),
    ).length,
}));
