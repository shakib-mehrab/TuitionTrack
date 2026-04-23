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

      // Write to Firestore with student fields explicitly set to null (not omitted).
      // The Firestore rule isNullOrEmpty() checks `value == null || value == ''`.
      // If these keys are absent from the document, the rule can behave
      // inconsistently — always writing null guarantees the check works reliably.
      // We inject null only into the raw write payload (untyped) to avoid
      // a TS conflict with the `string | undefined` fields on the Tuition type.
      const firestorePayload = {
        ...removeUndefined(tuition),
        studentId: tuition.studentId ?? null,
        studentName: tuition.studentName ?? null,
        studentEmail: tuition.studentEmail ?? null,
      };
      await tuitionRef.set(firestorePayload);

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
   * Supports both legacy single-student `studentId` and new multi-student `studentIds` array.
   */
  static subscribeToStudentTuitions(
    studentId: string,
    callback: (tuitions: Tuition[]) => void,
  ): () => void {
    return firestore()
      .collection(COLLECTIONS.TUITIONS)
      .where(
        firestore.Filter.or(
          firestore.Filter("studentId", "==", studentId),
          firestore.Filter("studentIds", "array-contains", studentId)
        )
      )
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

      // Reset payment status to unpaid
      await this.updateTuition(tuitionId, { paymentStatus: "not_paid" });

      // Add activity log
      await this.addActivityLog(tuitionId, "reset", "Class count reset");
    } catch (error) {
      console.error("Reset class logs error:", error);
      throw new Error("Failed to reset class logs");
    }
  }

  /**
   * Subscribe to class logs for a tuition (real-time)
   * Includes a retry mechanism for transient permission-denied errors that can
   * occur due to Firestore rules evaluator cache lag immediately after joining a tuition.
   */
  static subscribeToClassLogs(
    tuitionId: string,
    callback: (logs: ClassLog[]) => void,
    retryCount = 0,
  ): () => void {
    let unsub = firestore()
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
        (error: any) => {
          if (error.code === "firestore/permission-denied" && retryCount < 3) {
            console.log(`Class logs subscribe denied (cache lag). Retrying in 2s... (${retryCount + 1}/3)`);
            setTimeout(() => {
              unsub = this.subscribeToClassLogs(tuitionId, callback, retryCount + 1);
            }, 2000);
            return;
          }
          console.error("Subscribe to class logs error:", error);
        },
      );
    
    return () => unsub();
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
   * Includes a retry mechanism for transient permission-denied errors.
   */
  static subscribeToHomework(
    tuitionId: string,
    callback: (homework: Homework[]) => void,
    retryCount = 0,
  ): () => void {
    let unsub = firestore()
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
        (error: any) => {
          if (error.code === "firestore/permission-denied" && retryCount < 3) {
            console.log(`Homework subscribe denied (cache lag). Retrying in 2s... (${retryCount + 1}/3)`);
            setTimeout(() => {
              unsub = this.subscribeToHomework(tuitionId, callback, retryCount + 1);
            }, 2000);
            return;
          }
          console.error("Subscribe to homework error:", error);
        },
      );

    return () => unsub();
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
   * Subscribe to activity logs (real-time)
   * Includes a retry mechanism for transient permission-denied errors.
   */
  static subscribeToActivityLogs(
    tuitionId: string,
    callback: (logs: ActivityLog[]) => void,
    retryCount = 0,
  ): () => void {
    let unsub = firestore()
      .collection(COLLECTIONS.ACTIVITY_LOGS)
      .where("tuitionId", "==", tuitionId)
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const logs = snapshot.docs.map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as ActivityLog,
          );
          callback(logs);
        },
        (error: any) => {
          if (error.code === "firestore/permission-denied" && retryCount < 3) {
            console.log(`Activity logs subscribe denied (cache lag). Retrying in 2s... (${retryCount + 1}/3)`);
            setTimeout(() => {
              unsub = this.subscribeToActivityLogs(tuitionId, callback, retryCount + 1);
            }, 2000);
            return;
          }
          console.error("Subscribe to activity logs error:", error);
        },
      );

    return () => unsub();
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
      // First check if an invitation already exists for this tuition
      const existingInvites = await firestore()
        .collection(COLLECTIONS.INVITATIONS)
        .where("tuitionId", "==", tuitionId)
        .limit(1)
        .get();

      if (!existingInvites.empty) {
        // Return existing code
        return existingInvites.docs[0].data().code;
      }

      // Generate 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const inviteRef = firestore().collection(COLLECTIONS.INVITATIONS).doc();
      const invitation = {
        id: inviteRef.id,
        code,
        tuitionId,
        teacherId,
        createdAt: new Date().toISOString(),
        isPermanent: true, // Mark as permanent code
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

      // Attempt to assign the student using arrays (Google Classroom style)
      // while maintaining backward compatibility
      
      const tuitionRef = firestore()
        .collection(COLLECTIONS.TUITIONS)
        .doc(invitation.tuitionId);

      let enrolledTuitionData: Tuition | null = null;

      try {
        await firestore().runTransaction(async (transaction) => {
          const tuitionSnap = await transaction.get(tuitionRef);

          if (!tuitionSnap.exists) {
            throw new Error("Tuition not found. The invitation may be invalid.");
          }

          const data = tuitionSnap.data() as Tuition;
          
          // Backward compatibility: Extract existing legacy student if any
          const existingStudentIds = data.studentIds || [];
          if (data.studentId && !existingStudentIds.includes(data.studentId)) {
            existingStudentIds.push(data.studentId);
          }

          const existingEnrolled = data.enrolledStudents || [];
          if (data.studentId && data.studentName && data.studentEmail && !existingEnrolled.find(s => s.id === data.studentId)) {
            existingEnrolled.push({
              id: data.studentId,
              name: data.studentName,
              email: data.studentEmail
            });
          }

          // Check if already enrolled
          if (existingStudentIds.includes(studentId)) {
            // Already enrolled — idempotent, no write needed.
            enrolledTuitionData = data;
            return;
          }

          // Add the new student
          const newStudentIds = [...existingStudentIds, studentId];
          const newEnrolledStudents = [
            ...existingEnrolled,
            { id: studentId, name: studentName, email: studentEmail }
          ];

          // We update the arrays. We MUST also touch the legacy `studentId` fields if they
          // are currently empty/null so the Firestore rule `isStudentSelfAssignOnTuition` passes.
          // In the new Firestore rules, we will authorize array updates.
          const updatePayload: any = {
            studentIds: newStudentIds,
            enrolledStudents: newEnrolledStudents,
          };

          // If it's a brand new tuition with no students, set the legacy fields too
          // to satisfy the old `isNullOrEmpty(studentId)` strict rule requirement
          // before the new rules are deployed.
          if (!data.studentId) {
            updatePayload.studentId = studentId;
            updatePayload.studentName = studentName;
            updatePayload.studentEmail = studentEmail;
          }

          transaction.update(tuitionRef, updatePayload);
          enrolledTuitionData = { ...data, ...updatePayload };
        });
      } catch (error: any) {
        // If it throws permission-denied, it means the Firestore rules haven't been updated yet
        // to support array writes. 
        if (error?.code === "firestore/permission-denied") {
           throw new Error(
             "Permission denied. The teacher needs to update their database rules to support multiple students.",
           );
        }
        throw error;
      }

      // No longer marking the invitation as "used" because it is permanent!

      if (!enrolledTuitionData) {
        throw new Error("Tuition not found after enrollment.");
      }

      const tuition = enrolledTuitionData as Tuition;

      // Send notifications to both student and teacher (non-blocking)
      try {
        const teacherDoc = await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(tuition.teacherId)
          .get();
        const teacherName = teacherDoc.data()?.name || "Teacher";

        await notificationService.sendEnrollmentConfirmedNotification(
          studentId,
          tuition.subject,
          teacherName,
          invitation.tuitionId,
        );

        await notificationService.sendNewStudentEnrolledNotification(
          tuition.teacherId,
          studentName,
          tuition.subject,
          invitation.tuitionId,
        );
      } catch (notifError) {
        console.warn("Failed to send enrollment notifications:", notifError);
      }

      return tuition;
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
