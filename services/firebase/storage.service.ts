import { CONFIG, STORAGE_PATHS } from "@/config/firebase";
import storage from "@react-native-firebase/storage";

/**
 * Firebase Storage Service
 * Handles file uploads and downloads
 *
 * NOTE: Firebase Storage requires Blaze (pay-as-you-go) plan in some regions.
 * If disabled, file upload features will not work.
 */
export class StorageService {
  /**
   * Check if storage is enabled
   */
  static isStorageEnabled(): boolean {
    return CONFIG.ENABLE_FILE_UPLOADS;
  }

  /**
   * Upload homework attachment
   */
  static async uploadHomeworkAttachment(
    homeworkId: string,
    fileUri: string,
    fileName: string,
  ): Promise<string> {
    if (!this.isStorageEnabled()) {
      throw new Error(
        "File uploads are currently disabled. Please enable Firebase Storage.",
      );
    }

    try {
      // Check file size
      const fileSize = await this.getFileSize(fileUri);
      if (fileSize > CONFIG.MAX_FILE_SIZE) {
        throw new Error(
          `File size exceeds ${CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        );
      }

      const path = `${STORAGE_PATHS.HOMEWORK_ATTACHMENTS}/${homeworkId}/${fileName}`;
      const reference = storage().ref(path);

      // Upload file
      await reference.putFile(fileUri);

      // Get download URL
      const downloadURL = await reference.getDownloadURL();

      return downloadURL;
    } catch (error: any) {
      console.error("Upload homework attachment error:", error);
      throw new Error(error.message || "Failed to upload file");
    }
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(
    userId: string,
    fileUri: string,
  ): Promise<string> {
    if (!this.isStorageEnabled()) {
      throw new Error(
        "File uploads are currently disabled. Please enable Firebase Storage.",
      );
    }

    try {
      const path = `${STORAGE_PATHS.PROFILE_PICTURES}/${userId}.jpg`;
      const reference = storage().ref(path);

      // Upload file
      await reference.putFile(fileUri);

      // Get download URL
      const downloadURL = await reference.getDownloadURL();

      return downloadURL;
    } catch (error) {
      console.error("Upload profile picture error:", error);
      throw new Error("Failed to upload profile picture");
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(downloadURL: string): Promise<void> {
    if (!this.isStorageEnabled()) {
      return; // Silently skip if storage is disabled
    }

    try {
      const reference = storage().refFromURL(downloadURL);
      await reference.delete();
    } catch (error) {
      console.error("Delete file error:", error);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Delete all homework attachments
   */
  static async deleteHomeworkAttachments(homeworkId: string): Promise<void> {
    if (!this.isStorageEnabled()) {
      return; // Silently skip if storage is disabled
    }

    try {
      const path = `${STORAGE_PATHS.HOMEWORK_ATTACHMENTS}/${homeworkId}`;
      const reference = storage().ref(path);
      const list = await reference.listAll();

      // Delete all files
      await Promise.all(list.items.map((item) => item.delete()));
    } catch (error) {
      console.error("Delete homework attachments error:", error);
    }
  }

  /**
   * Get file size from URI
   */
  private static async getFileSize(fileUri: string): Promise<number> {
    // This is a placeholder - actual implementation depends on file system access
    // For now, we'll skip validation in development
    return 0;
  }
}
