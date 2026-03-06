import { COLLECTIONS } from "@/config/firebase";
import { notificationService } from "@/services/notifications";
import type {
    ActivityLog,
    ClassLog,
    Homework,
    HomeworkComment,
    PaymentStatus,
    Tuition,
} from "@/types";
import firestore from "@react-native-firebase/firestore";

/**
 * Payment History Interface
 */
export interface PaymentHistory {
  id: string;
  tuitionId: string;
  teacherId: string;
  studentId: string;
  month: string; // Format: "2026-03"
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Invitation Code Interface
 */
export interface Invitation {
  id: string;
  code: string;
  tuitionId: string;
  teacherId: string;
  createdAt: string;
  expiresAt?: string;
  usedBy?: string | null;
  usedAt?: string | null;
}

/**
 * Helper function to remove undefined values from object
 * Firestore doesn't accept undefined values, only null or omit the field
 */
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T;
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key as keyof T] = obj[key];
    }
  });
  return cleaned;
}

/**
 * Firestore Database Service
 * Handles all database operations with offline support
 */
export class FirestoreService {
  /**
   * Initialize offline persistence
   */
  static async initializeOfflinePersistence(): Promise<void> {
    try {
      await firestore().settings({
        persistence: true,
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
      });
    } catch (error) {
      console.warn("Offline persistence setup failed:", error);
    }
  }

  // ============================================================
  // TUITION OPERATIONS
  // ============================================================

  /**
   * Create a new tuition
   */
  static async createTuition(
    data: Omit<Tuition, "id" | "createdAt">,
  ): Promise<Tuition> {
    try {
      const tuitionRef = firestore().collection(COLLECTIONS.TUITIONS).doc();
      const tuition: Tuition = {
        ...data,
        id: tuitionRef.id,
        createdAt: new Date().toISOString(),
      };

      // Remove undefined values before writing to Firestore
      const cleanedTuition = removeUndefined(tuition);
      await tuitionRef.set(cleanedTuition);

      // Create activity log
      await this.addActivityLog(
        tuition.id,
        "class_added",
        `Tuition created: ${tuition.subject}`,
      );

      return tuition;
    } catch (error) {
      console.error("Create tuition error:", error);
      throw new Error("Failed to create tuition");
    }
  }

  /**
   * Update tuition
   */
  static async updateTuition(
    tuitionId: string,
    data: Partial<Tuition>,
  ): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.TUITIONS)
        .doc(tuitionId)
        .update(removeUndefined(data));
    } catch (error) {
      console.error("Update tuition error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update tuition: ${error.message}`);
      }
      throw new Error("Failed to update tuition");
    }
  }

  /**
   * Delete tuition and all related data
   */
  static async deleteTuition(tuitionId: string): Promise<void> {
    try {
      const batch = firestore().batch();

      // Delete tuition
      batch.delete(firestore().collection(COLLECTIONS.TUITIONS).doc(tuitionId));

      // Delete class logs
      const classLogs = await firestore()
        .collection(COLLECTIONS.CLASS_LOGS)
        .where("tuitionId", "==", tuitionId)
        .get();
      classLogs.forEach((doc) => batch.delete(doc.ref));

      // Delete homework
      const homework = await firestore()
        .collection(COLLECTIONS.HOMEWORK)
        .where("tuitionId", "==", tuitionId)
        .get();
      homework.forEach((doc) => batch.delete(doc.ref));

      // Delete activity logs
      const activityLogs = await firestore()
        .collection(COLLECTIONS.ACTIVITY_LOGS)
        .where("tuitionId", "==", tuitionId)
        .get();
      activityLogs.forEach((doc) => batch.delete(doc.ref));

      // Delete payment history
      const payments = await firestore()
        .collection(COLLECTIONS.PAYMENT_HISTORY)
        .where("tuitionId", "==", tuitionId)
        .get();
      payments.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error("Delete tuition error:", error);
      throw new Error("Failed to delete tuition");
    }
  }

  /**
   * Get tuitions for a teacher (real-time)
   */
  static subscribeToTeacherTuitions(
    teacherId: string,
    callback: (tuitions: Tuition[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.TUITIONS)
      .where("teacherId", "==", teacherId)
      .onSnapshot(
        (snapshot) => {
          const tuitions = snapshot.docs
            .map((doc) => doc.data() as Tuition)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          callback(tuitions);
        },
        (error) => {
          console.error("Subscribe to tuitions error:", error);
        },
      );
  }

  /**
   * Get tuitions for a student (real-time)
   */
  static subscribeToStudentTuitions(
    studentId: string,
    callback: (tuitions: Tuition[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.TUITIONS)
      .where("studentId", "==", studentId)
      .onSnapshot(
        (snapshot) => {
          const tuitions = snapshot.docs
            .map((doc) => doc.data() as Tuition)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          callback(tuitions);
        },
        (error) => {
          console.error("Subscribe to student tuitions error:", error);
        },
      );
  }

  // ============================================================
  // CLASS LOG OPERATIONS
  // ============================================================

  /**
   * Add class log
   */
  static async addClassLog(tuitionId: string, date: string): Promise<ClassLog> {
    try {
      const logRef = firestore().collection(COLLECTIONS.CLASS_LOGS).doc();
      const classLog: ClassLog = {
        id: logRef.id,
        tuitionId,
        date,
        createdAt: new Date().toISOString(),
      };

      await logRef.set(classLog);

      // Add activity log
      await this.addActivityLog(
        tuitionId,
        "class_added",
        `Class added for ${date}`,
      );

      // Send notification to student (non-blocking)
      try {
        const tuitionDoc = await firestore()
          .collection(COLLECTIONS.TUITIONS)
          .doc(tuitionId)
          .get();
        const tuition = tuitionDoc.data() as Tuition;

        if (
          tuition?.studentId &&
          tuition.subject &&
          tuition.schedule &&
          tuition.startTime
        ) {
          // Get teacher name
          const teacherDoc = await firestore()
            .collection(COLLECTIONS.USERS)
            .doc(tuition.teacherId)
            .get();
          const teacherName = teacherDoc.data()?.name || "Teacher";

          await notificationService.sendClassScheduledNotification(
            tuition.studentId,
            tuition.subject,
            tuition.schedule,
            tuition.startTime,
            teacherName,
            tuitionId,
          );
        }
      } catch (notifError) {
        console.warn("Failed to send class notification:", notifError);
      }

      return classLog;
    } catch (error) {
      console.error("Add class log error:", error);
      throw new Error("Failed to add class log");
    }
  }

  /**
   * Delete class log
   */
  static async deleteClassLog(logId: string, tuitionId: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.CLASS_LOGS).doc(logId).delete();

      // Add activity log
      await this.addActivityLog(tuitionId, "class_deleted", "Class removed");
    } catch (error) {
      console.error("Delete class log error:", error);
      throw new Error("Failed to delete class log");
    }
  }

  /**
   * Reset all class logs for a tuition
   */
  static async resetClassLogs(tuitionId: string): Promise<void> {
    try {
      const logs = await firestore()
        .collection(COLLECTIONS.CLASS_LOGS)
        .where("tuitionId", "==", tuitionId)
        .get();

      const batch = firestore().batch();
      logs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      // Add activity log
      await this.addActivityLog(tuitionId, "reset", "Class count reset");
    } catch (error) {
      console.error("Reset class logs error:", error);
      throw new Error("Failed to reset class logs");
    }
  }

  /**
   * Subscribe to class logs for a tuition (real-time)
   */
  static subscribeToClassLogs(
    tuitionId: string,
    callback: (logs: ClassLog[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.CLASS_LOGS)
      .where("tuitionId", "==", tuitionId)
      .onSnapshot(
        (snapshot) => {
          const logs = snapshot.docs
            .map((doc) => doc.data() as ClassLog)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          callback(logs);
        },
        (error) => {
          console.error("Subscribe to class logs error:", error);
        },
      );
  }

  // ============================================================
  // HOMEWORK OPERATIONS
  // ============================================================

  /**
   * Create homework
   */
  static async createHomework(
    data: Omit<Homework, "id" | "createdAt" | "completed" | "comments">,
  ): Promise<Homework> {
    try {
      const hwRef = firestore().collection(COLLECTIONS.HOMEWORK).doc();
      const homework: Homework = {
        ...data,
        id: hwRef.id,
        completed: false,
        comments: [],
        createdAt: new Date().toISOString(),
      };

      await hwRef.set(removeUndefined(homework));

      // Add activity log
      await this.addActivityLog(
        homework.tuitionId,
        "homework_added",
        `Homework: ${homework.chapter}`,
      );

      // Send notification to student (non-blocking)
      try {
        const tuitionDoc = await firestore()
          .collection(COLLECTIONS.TUITIONS)
          .doc(homework.tuitionId)
          .get();
        const tuition = tuitionDoc.data() as Tuition;

        if (tuition?.studentId) {
          await notificationService.sendNewHomeworkNotification(
            tuition.studentId,
            homework.subject,
            homework.chapter,
            homework.task,
            homework.tuitionId,
            homework.id,
          );
        }
      } catch (notifError) {
        console.warn("Failed to send homework notification:", notifError);
      }

      return homework;
    } catch (error) {
      console.error("Create homework error:", error);
      throw new Error("Failed to create homework");
    }
  }

  /**
   * Update homework
   */
  static async updateHomework(
    homeworkId: string,
    data: Partial<Homework>,
  ): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.HOMEWORK)
        .doc(homeworkId)
        .update(removeUndefined(data));
    } catch (error) {
      console.error("Update homework error:", error);
      throw new Error("Failed to update homework");
    }
  }

  /**
   * Delete homework
   */
  static async deleteHomework(homeworkId: string): Promise<void> {
    try {
      await firestore()
        .collection(COLLECTIONS.HOMEWORK)
        .doc(homeworkId)
        .delete();
    } catch (error) {
      console.error("Delete homework error:", error);
      throw new Error("Failed to delete homework");
    }
  }

  /**
   * Add comment to homework
   */
  static async addHomeworkComment(
    homeworkId: string,
    comment: Omit<HomeworkComment, "id" | "timestamp">,
  ): Promise<void> {
    try {
      const hwComment: HomeworkComment = {
        ...comment,
        id: firestore().collection("_").doc().id,
        timestamp: new Date().toISOString(),
      };

      await firestore()
        .collection(COLLECTIONS.HOMEWORK)
        .doc(homeworkId)
        .update({
          comments: firestore.FieldValue.arrayUnion(hwComment),
        });
    } catch (error) {
      console.error("Add homework comment error:", error);
      throw new Error("Failed to add comment");
    }
  }

  /**
   * Subscribe to homework for a tuition (real-time)
   */
  static subscribeToHomework(
    tuitionId: string,
    callback: (homework: Homework[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.HOMEWORK)
      .where("tuitionId", "==", tuitionId)
      .onSnapshot(
        (snapshot) => {
          const homework = snapshot.docs
            .map((doc) => doc.data() as Homework)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          callback(homework);
        },
        (error) => {
          console.error("Subscribe to homework error:", error);
        },
      );
  }

  /**
   * Subscribe to all homework for a teacher (real-time)
   */
  static subscribeToTeacherHomework(
    teacherId: string,
    callback: (homework: Homework[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.HOMEWORK)
      .where("teacherId", "==", teacherId)
      .onSnapshot(
        (snapshot) => {
          const homework = snapshot.docs
            .map((doc) => doc.data() as Homework)
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );
          callback(homework);
        },
        (error) => {
          console.error("Subscribe to teacher homework error:", error);
        },
      );
  }

  // ============================================================
  // PAYMENT HISTORY OPERATIONS
  // ============================================================

  /**
   * Update payment status for a month
   */
  static async updatePaymentStatus(
    tuitionId: string,
    teacherId: string,
    studentId: string,
    month: string,
    status: PaymentStatus,
    amount: number,
    notes?: string,
  ): Promise<void> {
    try {
      console.log("updatePaymentStatus called with:", {
        tuitionId,
        teacherId,
        studentId,
        month,
        status,
        amount,
      });

      // Check if payment record exists for this month
      const existingPayment = await firestore()
        .collection(COLLECTIONS.PAYMENT_HISTORY)
        .where("tuitionId", "==", tuitionId)
        .where("month", "==", month)
        .limit(1)
        .get();

      console.log("Existing payment query result:", existingPayment.size);

      const now = new Date().toISOString();

      if (!existingPayment.empty) {
        // Update existing record
        console.log("Updating existing payment record");
        const paymentDoc = existingPayment.docs[0];
        await paymentDoc.ref.update(
          removeUndefined({
            status,
            amount,
            notes,
            paidAt: status === "paid" ? now : null,
            updatedAt: now,
          }),
        );
      } else {
        // Create new payment record
        console.log("Creating new payment record");
        const paymentRef = firestore()
          .collection(COLLECTIONS.PAYMENT_HISTORY)
          .doc();
        const payment: PaymentHistory = {
          id: paymentRef.id,
          tuitionId,
          teacherId,
          studentId,
          month,
          amount,
          status,
          paidAt: status === "paid" ? now : undefined,
          notes,
          createdAt: now,
          updatedAt: now,
        };
        await paymentRef.set(removeUndefined(payment));
      }

      console.log("Updating tuition payment status");
      // Update tuition payment status
      await this.updateTuition(tuitionId, { paymentStatus: status });

      console.log("Adding activity log");
      // Add activity log
      await this.addActivityLog(
        tuitionId,
        "payment_updated",
        `Payment ${status} for ${month}`,
      );

      // Send notification to student when payment is confirmed (non-blocking)
      if (status === "paid") {
        try {
          const tuitionDoc = await firestore()
            .collection(COLLECTIONS.TUITIONS)
            .doc(tuitionId)
            .get();
          const tuition = tuitionDoc.data() as Tuition;

          if (tuition?.studentId && tuition.subject) {
            await notificationService.sendPaymentConfirmedNotification(
              tuition.studentId,
              tuition.subject,
              amount,
              month,
              tuitionId,
            );
          }
        } catch (notifError) {
          console.warn("Failed to send payment notification:", notifError);
        }
      }

      console.log("Payment status updated successfully");
    } catch (error) {
      console.error("Update payment status error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to update payment status: ${error.message}`);
      }
      throw new Error("Failed to update payment status");
    }
  }

  /**
   * Subscribe to payment history for a tuition (real-time)
   */
  static subscribeToPaymentHistory(
    tuitionId: string,
    callback: (payments: PaymentHistory[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.PAYMENT_HISTORY)
      .where("tuitionId", "==", tuitionId)
      .onSnapshot(
        (snapshot) => {
          const payments = snapshot.docs
            .map((doc) => doc.data() as PaymentHistory)
            .sort((a, b) => b.month.localeCompare(a.month));
          callback(payments);
        },
        (error) => {
          console.error("Subscribe to payment history error:", error);
        },
      );
  }

  // ============================================================
  // ACTIVITY LOG OPERATIONS
  // ============================================================

  /**
   * Add activity log
   */
  static async addActivityLog(
    tuitionId: string,
    type: ActivityLog["type"],
    description: string,
  ): Promise<void> {
    try {
      const logRef = firestore().collection(COLLECTIONS.ACTIVITY_LOGS).doc();
      const activityLog: ActivityLog = {
        id: logRef.id,
        tuitionId,
        type,
        description,
        timestamp: new Date().toISOString(),
      };

      await logRef.set(activityLog);
    } catch (error) {
      console.error("Add activity log error:", error);
      // Don't throw - activity logs are non-critical
    }
  }

  /**
   * Subscribe to activity logs for a tuition (real-time)
   */
  static subscribeToActivityLogs(
    tuitionId: string,
    callback: (logs: ActivityLog[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.ACTIVITY_LOGS)
      .where("tuitionId", "==", tuitionId)
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const logs = snapshot.docs
            .map((doc) => doc.data() as ActivityLog)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
          callback(logs);
        },
        (error) => {
          console.error("Subscribe to activity logs error:", error);
        },
      );
  }

  // ============================================================
  // INVITATION CODE OPERATIONS
  // ============================================================

  /**
   * Generate invitation code for a tuition
   */
  static async generateInvitationCode(
    tuitionId: string,
    teacherId: string,
  ): Promise<string> {
    try {
      // Generate 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const inviteRef = firestore().collection(COLLECTIONS.INVITATIONS).doc();
      const invitation: Invitation = {
        id: inviteRef.id,
        code,
        tuitionId,
        teacherId,
        createdAt: new Date().toISOString(),
        usedBy: null,
        usedAt: null,
      };

      await inviteRef.set(invitation);

      return code;
    } catch (error) {
      console.error("Generate invitation error:", error);
      throw new Error("Failed to generate invitation code");
    }
  }

  /**
   * Join tuition using invitation code
   */
  static async joinTuitionWithCode(
    code: string,
    studentId: string,
    studentName: string,
    studentEmail: string,
  ): Promise<Tuition> {
    try {
      // Find invitation by code only (avoid null query issues)
      const invitations = await firestore()
        .collection(COLLECTIONS.INVITATIONS)
        .where("code", "==", code.toUpperCase())
        .limit(1)
        .get();

      if (invitations.empty) {
        throw new Error("Invalid invitation code");
      }

      const inviteDoc = invitations.docs[0];
      const invitation = inviteDoc.data() as Invitation;

      // Get the tuition first to check enrollment status
      const tuitionDoc = await firestore()
        .collection(COLLECTIONS.TUITIONS)
        .doc(invitation.tuitionId)
        .get();

      if (!tuitionDoc.exists) {
        throw new Error("Tuition not found");
      }

      const tuition = tuitionDoc.data() as Tuition;

      // Check if this student is already enrolled
      if (tuition.studentId === studentId) {
        throw new Error("You are already enrolled in this tuition");
      }

      // Check if invitation was used by someone else
      if (invitation.usedBy && invitation.usedBy !== studentId) {
        throw new Error(
          "This invitation code has already been used by another student",
        );
      }

      // Check if tuition already has a different student
      if (tuition.studentId && tuition.studentId !== studentId) {
        throw new Error("This tuition already has a student enrolled");
      }

      // Update tuition with student info
      await tuitionDoc.ref.update({
        studentId,
        studentName,
        studentEmail,
      });

      // Mark invitation as used
      await inviteDoc.ref.update({
        usedBy: studentId,
        usedAt: new Date().toISOString(),
      });

      // Send notifications to both student and teacher (non-blocking)
      try {
        // Get teacher name
        const teacherDoc = await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(tuition.teacherId)
          .get();
        const teacherName = teacherDoc.data()?.name || "Teacher";

        // Notify student about enrollment confirmation
        await notificationService.sendEnrollmentConfirmedNotification(
          studentId,
          tuition.subject,
          teacherName,
          invitation.tuitionId,
        );

        // Notify teacher about new student
        await notificationService.sendNewStudentEnrolledNotification(
          tuition.teacherId,
          studentName,
          tuition.subject,
          invitation.tuitionId,
        );
      } catch (notifError) {
        console.warn("Failed to send enrollment notifications:", notifError);
      }

      return { ...tuition, studentId, studentName, studentEmail };
    } catch (error: any) {
      console.error("Join tuition error:", error);
      // If it's already an Error with our custom message, rethrow it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap unknown errors
      throw new Error("Failed to join tuition");
    }
  }
}
