import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";

const PHOTO_DIR = `${FileSystem.documentDirectory}ora-photos/`;

/**
 * Ensure the photo directory exists.
 */
export async function ensurePhotoDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

/**
 * Save a photo from a temporary URI to the app's persistent storage.
 * Returns the new permanent file URI.
 */
export async function savePhoto(tempUri: string): Promise<string> {
  await ensurePhotoDir();
  const ext = tempUri.split(".").pop() || "jpg";
  const fileName = `${uuidv4()}.${ext}`;
  const destUri = `${PHOTO_DIR}${fileName}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

/**
 * Delete a photo from local storage.
 */
export async function deletePhoto(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri);
  }
}
