import { COLLECTIONS } from "@/config/firebase";
import firestore from "@react-native-firebase/firestore";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type:
    | "new_homework"
    | "class_scheduled"
    | "payment_reminder"
    | "payment_confirmed"
    | "enrollment_confirmed"
    | "new_student_enrolled";
  tuitionId?: string;
  homeworkId?: string;
  [key: string]: any;
}

class NotificationService {
  /**
   * Request notification permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permissions not granted");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  /**
   * Get Expo push token for the device
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          DEFAULT_NOTIFICATION_CHANNEL_ID,
          {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#EAB308",
          },
        );
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        throw new Error("Expo project ID is missing from app configuration");
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return tokenData.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  /**
   * Save push token to user's Firestore document
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    try {
      await firestore().collection(COLLECTIONS.USERS).doc(userId).set(
        {
          pushToken: token,
          pushTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  }

  /**
   * Send notification to specific user by their push token
   */
  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data: data || {},
        priority: "high",
        channelId: DEFAULT_NOTIFICATION_CHANNEL_ID,
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(
          `Expo push request failed (${response.status}): ${JSON.stringify(responseBody)}`,
        );
      }

      if (responseBody?.data?.status === "error") {
        throw new Error(
          `Expo push rejected notification: ${JSON.stringify(responseBody)}`,
        );
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  /**
   * Send notification to user by userId (fetches their push token)
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<void> {
    try {
      const userDoc = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .get();

      const pushToken = userDoc.data()?.pushToken;

      if (pushToken) {
        await this.sendPushNotification(pushToken, title, body, data);
      }
    } catch (error) {
      console.error("Error sending notification to user:", error);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: NotificationData,
  ): Promise<void> {
    try {
      const promises = userIds.map((userId) =>
        this.sendNotificationToUser(userId, title, body, data),
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error sending notifications to multiple users:", error);
    }
  }

  // ==================== STUDENT NOTIFICATIONS ====================

  /**
   * 1. New Homework Assigned
   */
  async sendNewHomeworkNotification(
    studentId: string,
    subject: string,
    chapter: string,
    task: string,
    tuitionId: string,
    homeworkId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      studentId,
      `New Homework in ${subject}`,
      `Chapter: ${chapter} - Task: ${task}`,
      {
        type: "new_homework",
        tuitionId,
        homeworkId,
      },
    );
  }

  /**
   * 2. Class Schedule Added
   */
  async sendClassScheduledNotification(
    studentId: string,
    subject: string,
    day: string,
    time: string,
    teacherName: string,
    tuitionId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      studentId,
      `Class Scheduled - ${subject}`,
      `${day} at ${time} with ${teacherName}`,
      {
        type: "class_scheduled",
        tuitionId,
      },
    );
  }

  /**
   * 3. Payment Reminder
   */
  async sendPaymentReminderNotification(
    studentId: string,
    subject: string,
    amount: number,
    month: string,
    tuitionId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      studentId,
      `Payment Due for ${subject}`,
      `₹${amount} due for ${month}`,
      {
        type: "payment_reminder",
        tuitionId,
      },
    );
  }

  /**
   * 4. Payment Confirmed
   */
  async sendPaymentConfirmedNotification(
    studentId: string,
    subject: string,
    amount: number,
    month: string,
    tuitionId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      studentId,
      "Payment Received ✓",
      `₹${amount} for ${subject} - ${month}`,
      {
        type: "payment_confirmed",
        tuitionId,
      },
    );
  }

  /**
   * 5. Enrollment Confirmed
   */
  async sendEnrollmentConfirmedNotification(
    studentId: string,
    subject: string,
    teacherName: string,
    tuitionId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      studentId,
      `Welcome to ${subject} Tuition! 🎉`,
      `You've successfully joined ${teacherName}'s class`,
      {
        type: "enrollment_confirmed",
        tuitionId,
      },
    );
  }

  // ==================== TEACHER NOTIFICATIONS ====================

  /**
   * 6. New Student Enrolled
   */
  async sendNewStudentEnrolledNotification(
    teacherId: string,
    studentName: string,
    subject: string,
    tuitionId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      teacherId,
      "New Student Joined! 👨‍🎓",
      `${studentName} joined ${subject} class`,
      {
        type: "new_student_enrolled",
        tuitionId,
      },
    );
  }
}

export const notificationService = new NotificationService();
