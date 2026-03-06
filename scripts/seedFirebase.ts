/**
 * Firebase Seed Data Script
 *
 * This script seeds the Firebase database with initial demo data:
 * - 1 Teacher account (teacher@demo.com)
 * - 1 Student account (student@demo.com)
 * - 2 Tuitions assigned to the teacher
 *
 * RUN THIS SCRIPT ONLY ONCE after Firebase is configured!
 *
 * To run: Place this code in a temporary React Native component and execute it once,
 * or use Firebase Console to manually create the data.
 */

import { COLLECTIONS } from "@/config/firebase";
import type { ClassLog, Tuition, User } from "@/types";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export const SEED_DATA = {
  teacher: {
    email: "teacher@demo.com",
    password: "password123",
    name: "Rahul Sharma",
    role: "teacher" as const,
  },
  student: {
    email: "student@demo.com",
    password: "password123",
    name: "Demo Student",
    role: "student" as const,
  },
};

/**
 * Seed database with demo data
 * WARNING: This will create user accounts and data in Firebase!
 */
export async function seedFirebase(): Promise<void> {
  try {
    console.log("🌱 Starting Firebase seeding...");

    // ============================================================
    // CREATE TEACHER ACCOUNT
    // ============================================================
    console.log("Creating teacher account...");
    let teacherCredential;
    try {
      teacherCredential = await auth().createUserWithEmailAndPassword(
        SEED_DATA.teacher.email,
        SEED_DATA.teacher.password,
      );
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log("Teacher account already exists, signing in...");
        teacherCredential = await auth().signInWithEmailAndPassword(
          SEED_DATA.teacher.email,
          SEED_DATA.teacher.password,
        );
      } else {
        throw error;
      }
    }

    const teacherId = teacherCredential.user.uid;

    // Update teacher profile
    await teacherCredential.user.updateProfile({
      displayName: SEED_DATA.teacher.name,
    });

    // Mark email as verified for demo account
    // Note: This is not officially possible via SDK, so we'll skip verification requirement for demo
    console.log(
      "⚠️  Note: Email verification must be done manually or disabled for demo accounts",
    );

    // Create teacher user document
    const teacherData: User = {
      id: teacherId,
      name: SEED_DATA.teacher.name,
      email: SEED_DATA.teacher.email,
      role: "teacher",
      createdAt: new Date().toISOString(),
    };

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(teacherId)
      .set(teacherData);
    console.log("✅ Teacher account created:", SEED_DATA.teacher.email);

    // ============================================================
    // CREATE STUDENT ACCOUNT
    // ============================================================
    console.log("Creating student account...");

    // Sign out teacher first
    await auth().signOut();

    let studentCredential;
    try {
      studentCredential = await auth().createUserWithEmailAndPassword(
        SEED_DATA.student.email,
        SEED_DATA.student.password,
      );
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        console.log("Student account already exists, signing in...");
        studentCredential = await auth().signInWithEmailAndPassword(
          SEED_DATA.student.email,
          SEED_DATA.student.password,
        );
      } else {
        throw error;
      }
    }

    const studentId = studentCredential.user.uid;

    // Update student profile
    await studentCredential.user.updateProfile({
      displayName: SEED_DATA.student.name,
    });

    // Create student user document
    const studentData: User = {
      id: studentId,
      name: SEED_DATA.student.name,
      email: SEED_DATA.student.email,
      role: "student",
      createdAt: new Date().toISOString(),
    };

    await firestore()
      .collection(COLLECTIONS.USERS)
      .doc(studentId)
      .set(studentData);
    console.log("✅ Student account created:", SEED_DATA.student.email);

    // Sign out student
    await auth().signOut();

    // ============================================================
    // CREATE TUITIONS
    // ============================================================
    console.log("Creating tuitions...");

    const tuition1Id = firestore().collection(COLLECTIONS.TUITIONS).doc().id;
    const tuition1: Tuition = {
      id: tuition1Id,
      teacherId: teacherId,
      subject: "Mathematics",
      startTime: "5:00 PM",
      endTime: "6:00 PM",
      schedule: "Mon, Wed, Fri",
      datesPerWeek: 3,
      plannedClassesPerMonth: 12,
      studentName: SEED_DATA.student.name,
      studentEmail: SEED_DATA.student.email,
      studentId: studentId,
      salary: 2000,
      status: "active",
      paymentStatus: "not_paid",
      createdAt: "2025-01-05T00:00:00.000Z",
    };

    await firestore()
      .collection(COLLECTIONS.TUITIONS)
      .doc(tuition1Id)
      .set(tuition1);
    console.log("✅ Tuition 1 created: Mathematics");

    const tuition2Id = firestore().collection(COLLECTIONS.TUITIONS).doc().id;
    const tuition2: Tuition = {
      id: tuition2Id,
      teacherId: teacherId,
      subject: "Physics",
      startTime: "6:00 PM",
      endTime: "7:00 PM",
      schedule: "Tue, Thu",
      datesPerWeek: 2,
      plannedClassesPerMonth: 8,
      studentName: SEED_DATA.student.name,
      studentEmail: SEED_DATA.student.email,
      studentId: studentId,
      salary: 1800,
      status: "active",
      paymentStatus: "paid",
      createdAt: "2025-01-05T00:00:00.000Z",
    };

    await firestore()
      .collection(COLLECTIONS.TUITIONS)
      .doc(tuition2Id)
      .set(tuition2);
    console.log("✅ Tuition 2 created: Physics");

    // ============================================================
    // CREATE SAMPLE CLASS LOGS FOR TUITION 1
    // ============================================================
    console.log("Creating sample class logs...");

    const sampleDates = [
      "2026-03-03",
      "2026-03-05",
      "2026-03-10",
      "2026-03-12",
      "2026-03-17",
    ];

    const batch = firestore().batch();

    for (const date of sampleDates) {
      const logId = firestore().collection(COLLECTIONS.CLASS_LOGS).doc().id;
      const classLog: ClassLog = {
        id: logId,
        tuitionId: tuition1Id,
        date,
        createdAt: `${date}T17:00:00.000Z`,
      };

      batch.set(
        firestore().collection(COLLECTIONS.CLASS_LOGS).doc(logId),
        classLog,
      );
    }

    await batch.commit();
    console.log(`✅ Created ${sampleDates.length} class logs for Mathematics`);

    // ============================================================
    // SEEDING COMPLETE
    // ============================================================
    console.log("");
    console.log("🎉 Firebase seeding completed successfully!");
    console.log("");
    console.log("📝 Demo Accounts:");
    console.log("   Teacher: teacher@demo.com / password123");
    console.log("   Student: student@demo.com / password123");
    console.log("");
    console.log(
      "⚠️  IMPORTANT: Disable email verification in config/firebase.ts",
    );
    console.log("   Set EMAIL_VERIFICATION_REQUIRED: false for demo accounts");
    console.log("");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}

/**
 * Clear all seeded data (for testing)
 * WARNING: This will delete all data!
 */
export async function clearSeedData(): Promise<void> {
  try {
    console.log("🗑️  Clearing seed data...");

    // Delete users (NOTE: User auth accounts must be deleted manually in Firebase Console)
    console.log(
      "Please delete user accounts manually in Firebase Console > Authentication",
    );

    // Delete tuitions
    const tuitions = await firestore().collection(COLLECTIONS.TUITIONS).get();
    const batch1 = firestore().batch();
    tuitions.docs.forEach((doc) => batch1.delete(doc.ref));
    await batch1.commit();
    console.log(`✅ Deleted ${tuitions.size} tuitions`);

    // Delete class logs
    const classLogs = await firestore()
      .collection(COLLECTIONS.CLASS_LOGS)
      .get();
    const batch2 = firestore().batch();
    classLogs.docs.forEach((doc) => batch2.delete(doc.ref));
    await batch2.commit();
    console.log(`✅ Deleted ${classLogs.size} class logs`);

    // Delete homework
    const homework = await firestore().collection(COLLECTIONS.HOMEWORK).get();
    const batch3 = firestore().batch();
    homework.docs.forEach((doc) => batch3.delete(doc.ref));
    await batch3.commit();
    console.log(`✅ Deleted ${homework.size} homework items`);

    console.log("✅ Seed data cleared");
  } catch (error) {
    console.error("Error clearing seed data:", error);
    throw error;
  }
}
