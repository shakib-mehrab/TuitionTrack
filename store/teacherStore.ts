import { currentLogs, monthKey, openMonthKey } from "@/lib/cycle";
import { FirestoreService, type PaymentHistory } from "@/services/firebase/firestore.service";
import firestore from "@react-native-firebase/firestore";
import type {
  ActivityLog,
  ClassLog,
  Homework,
  HomeworkComment,
  PaymentStatus,
  Tuition,
} from "@/types";
import { create } from "zustand";

// ─── Store Interface ────────────────────────────────────────────────
interface TeacherState {
  // Data
  tuitions: Tuition[];
  classLogs: ClassLog[];
  activityLogs: ActivityLog[];
  homework: Homework[];
  payments: PaymentHistory[];

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Initialize real-time listeners
  initialize: (teacherId: string) => void;
  cleanup: () => void;

  // Tuition CRUD
  addTuition: (data: Omit<Tuition, "id" | "createdAt">) => Promise<void>;
  updateTuition: (id: string, data: Partial<Tuition>) => Promise<void>;
  deleteTuition: (id: string) => Promise<void>;

  // Class log CRUD
  /** Logs a class in the open month; resolves to the new log id (for Undo). */
  addClassLog: (tuitionId: string, date: string) => Promise<string>;
  /** Closes the open month (keeps its logs) and starts a new one. */
  closeMonth: (tuitionId: string) => Promise<void>;
  deleteClassLog: (logId: string, tuitionId: string) => Promise<void>;
  resetClassLogs: (tuitionId: string) => Promise<void>;

  // Payment
  updatePaymentStatus: (
    tuitionId: string,
    teacherId: string,
    studentId: string,
    month: string,
    status: PaymentStatus,
    amount: number,
    notes?: string,
  ) => Promise<void>;

  // Homework CRUD
  addHomework: (
    hw: Omit<Homework, "id" | "createdAt" | "completed" | "comments">,
  ) => Promise<void>;
  updateHomework: (id: string, data: Partial<Homework>) => Promise<void>;
  deleteHomework: (id: string) => Promise<void>;
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
  getTotalClassCount: (tuitionId: string) => number;
  /** Class logs of the open month only, newest first. */
  getCurrentLogs: (tuitionId: string) => ClassLog[];
  /** "YYYY-MM" label of the tuition's open month. */
  getOpenMonth: (tuitionId: string) => string;
  getPaymentsForTuition: (tuitionId: string) => PaymentHistory[];

  // Invitation
  generateInviteCode: (tuitionId: string, teacherId: string) => Promise<string>;
}

// Unsubscribe functions for Firebase listeners
let unsubscribeTuitions: (() => void) | null = null;
let unsubscribeClassLogs: Map<string, () => void> = new Map();
let unsubscribeHomework: Map<string, () => void> = new Map();
let unsubscribeActivity: Map<string, () => void> = new Map();
let unsubscribePayments: Map<string, () => void> = new Map();

export const useTeacherStore = create<TeacherState>((set, get) => ({
  tuitions: [],
  classLogs: [],
  activityLogs: [],
  homework: [],
  payments: [],
  isLoading: false,
  isInitialized: false,

  // ── Initialize Firebase Listeners ──
  initialize: (teacherId: string) => {
    if (get().isInitialized) return;

    set({ isLoading: true, isInitialized: true });

    // Subscribe to tuitions
    unsubscribeTuitions = FirestoreService.subscribeToTeacherTuitions(
      teacherId,
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

          if (!unsubscribePayments.has(tuition.id)) {
            const unsub = FirestoreService.subscribeToPaymentHistory(
              tuition.id,
              (rows) => {
                set((state) => ({
                  payments: [
                    ...state.payments.filter((p) => p.tuitionId !== tuition.id),
                    ...rows,
                  ],
                }));
              },
            );
            unsubscribePayments.set(tuition.id, unsub);
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

    unsubscribePayments.forEach((unsub) => unsub());
    unsubscribePayments.clear();

    set({
      tuitions: [],
      classLogs: [],
      activityLogs: [],
      homework: [],
      payments: [],
      isInitialized: false,
      isLoading: false,
    });
  },

  // ── Tuition ──
  addTuition: async (data) => {
    try {
      set({ isLoading: true });
      await FirestoreService.createTuition(data);
      // Real-time listener will update the state
    } catch (error) {
      console.error("Add tuition error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTuition: async (id, data) => {
    try {
      await FirestoreService.updateTuition(id, data);
      // Real-time listener will update the state
    } catch (error) {
      console.error("Update tuition error:", error);
      throw error;
    }
  },

  deleteTuition: async (id) => {
    try {
      set({ isLoading: true });

      // Clean up listeners for this tuition
      unsubscribeClassLogs.get(id)?.();
      unsubscribeClassLogs.delete(id);
      unsubscribeHomework.get(id)?.();
      unsubscribeHomework.delete(id);
      unsubscribeActivity.get(id)?.();
      unsubscribeActivity.delete(id);

      await FirestoreService.deleteTuition(id);
      // Real-time listener will update the state
    } catch (error) {
      console.error("Delete tuition error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Class Logs ──
  addClassLog: async (tuitionId, date) => {
    const cycleId = get().tuitions.find((t) => t.id === tuitionId)?.cycleId;
    // Pre-generate the id so the optimistic entry and the stored log match (Undo needs it).
    const logId = firestore().collection("class_logs").doc().id;
    const optimisticLog: ClassLog = {
      id: logId,
      tuitionId,
      date,
      createdAt: new Date().toISOString(),
      ...(cycleId ? { cycleId } : {}),
    };

    set((state) => ({ classLogs: [optimisticLog, ...state.classLogs] }));

    try {
      await FirestoreService.addClassLog(tuitionId, date, cycleId, logId);
      return logId;
    } catch (error) {
      set((state) => ({ classLogs: state.classLogs.filter((log) => log.id !== logId) }));
      throw error;
    }
  },

  closeMonth: async (tuitionId) => {
    const t = get().tuitions.find((x) => x.id === tuitionId);
    if (!t) throw new Error("Tuition not found");
    await FirestoreService.closeMonth(t, openMonthKey(t, get().classLogs), currentLogs(t, get().classLogs));
  },

  deleteClassLog: async (logId, tuitionId) => {
    // Optimistic update - remove from local state immediately
    const deletedLog = get().classLogs.find((log) => log.id === logId);

    set((state) => ({
      classLogs: state.classLogs.filter((log) => log.id !== logId),
    }));

    try {
      await FirestoreService.deleteClassLog(logId, tuitionId);
      // Real-time listener will confirm the deletion
    } catch (error) {
      // Restore the log on error
      if (deletedLog) {
        set((state) => ({
          classLogs: [deletedLog, ...state.classLogs],
        }));
      }
      console.error("Delete class log error:", error);
      throw error;
    }
  },

  resetClassLogs: async (tuitionId) => {
    try {
      await FirestoreService.resetClassLogs(tuitionId);
      // Real-time listener will update the state
    } catch (error) {
      console.error("Reset class logs error:", error);
      throw error;
    }
  },

  // ── Payment ──
  updatePaymentStatus: async (
    tuitionId,
    teacherId,
    studentId,
    month,
    status,
    amount,
    notes,
  ) => {
    try {
      await FirestoreService.updatePaymentStatus(
        tuitionId,
        teacherId,
        studentId,
        month,
        status,
        amount,
        notes,
      );
      // Real-time listener will update the state
    } catch (error) {
      console.error("Update payment status error:", error);
      throw error;
    }
  },

  // ── Homework ──
  addHomework: async (data) => {
    // Optimistic update - add to local state immediately
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticHomework: Homework = {
      ...data,
      id: tempId,
      completed: false,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      homework: [optimisticHomework, ...state.homework],
    }));

    try {
      await FirestoreService.createHomework(data);
      // Real-time listener will replace the optimistic homework with the real one
    } catch (error) {
      // Remove optimistic homework on error
      set((state) => ({
        homework: state.homework.filter((hw) => hw.id !== tempId),
      }));
      console.error("Add homework error:", error);
      throw error;
    }
  },

  updateHomework: async (id, data) => {
    // Optimistic update - update local state immediately
    const oldHomework = get().homework.find((hw) => hw.id === id);

    set((state) => ({
      homework: state.homework.map((hw) =>
        hw.id === id ? { ...hw, ...data } : hw,
      ),
    }));

    try {
      await FirestoreService.updateHomework(id, data);
      // Real-time listener will confirm the update
    } catch (error) {
      // Restore old homework on error
      if (oldHomework) {
        set((state) => ({
          homework: state.homework.map((hw) =>
            hw.id === id ? oldHomework : hw,
          ),
        }));
      }
      console.error("Update homework error:", error);
      throw error;
    }
  },

  deleteHomework: async (id) => {
    // Optimistic update - remove from local state immediately
    const deletedHomework = get().homework.find((hw) => hw.id === id);

    set((state) => ({
      homework: state.homework.filter((hw) => hw.id !== id),
    }));

    try {
      await FirestoreService.deleteHomework(id);
      // Real-time listener will confirm the deletion
    } catch (error) {
      // Restore homework on error
      if (deletedHomework) {
        set((state) => ({
          homework: [deletedHomework, ...state.homework],
        }));
      }
      console.error("Delete homework error:", error);
      throw error;
    }
  },

  markHomeworkComplete: async (id, completed) => {
    // Optimistic update - update local state immediately
    const oldCompleted = get().homework.find((hw) => hw.id === id)?.completed;

    set((state) => ({
      homework: state.homework.map((hw) =>
        hw.id === id ? { ...hw, completed } : hw,
      ),
    }));

    try {
      await FirestoreService.updateHomework(id, { completed });
      // Real-time listener will confirm the update
    } catch (error) {
      // Restore old status on error
      if (oldCompleted !== undefined) {
        set((state) => ({
          homework: state.homework.map((hw) =>
            hw.id === id ? { ...hw, completed: oldCompleted } : hw,
          ),
        }));
      }
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

  getTotalClassCount: (tuitionId) => {
    const t = get().tuitions.find((x) => x.id === tuitionId);
    return t ? currentLogs(t, get().classLogs).length : 0;
  },

  getCurrentLogs: (tuitionId) => {
    const t = get().tuitions.find((x) => x.id === tuitionId);
    return t ? currentLogs(t, get().classLogs) : [];
  },

  getOpenMonth: (tuitionId) => {
    const t = get().tuitions.find((x) => x.id === tuitionId);
    return t ? openMonthKey(t, get().classLogs) : monthKey();
  },

  getPaymentsForTuition: (tuitionId) =>
    get()
      .payments.filter((p) => p.tuitionId === tuitionId)
      .sort((a, b) => b.month.localeCompare(a.month)),

  // ── Invitation ──
  generateInviteCode: async (tuitionId, teacherId) => {
    try {
      const code = await FirestoreService.generateInvitationCode(
        tuitionId,
        teacherId,
      );
      return code;
    } catch (error) {
      console.error("Generate invite code error:", error);
      throw error;
    }
  },
}));
