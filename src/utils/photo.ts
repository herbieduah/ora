import { File, Directory, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { getDateKey, zeroPad } from "./time";
import { devError } from "./logger";

const PHOTO_DIR_NAME = "ora-photos";
let _photoDirCache: Directory | null = null;

function getPhotoDir(): Directory {
  if (_photoDirCache) return _photoDirCache;
  const dir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  _photoDirCache = dir;
  return dir;
}

function generatePhotoFilename(ext: string): string {
  const now = new Date();
  const dateKey = getDateKey(now);
  const time = `${zeroPad(now.getHours())}${zeroPad(now.getMinutes())}${zeroPad(now.getSeconds())}`;
  const shortId = Crypto.randomUUID().slice(0, 4);
  return `${dateKey}_${time}_${shortId}.${ext}`;
}

export function savePhoto(
  tempUri: string,
): { uri: string; filename: string } {
  const dir = getPhotoDir();
  const ext = tempUri.split(".").pop() || "jpg";
  const filename = generatePhotoFilename(ext);
  const source = new File(tempUri);
  const dest = new File(dir, filename);
  try {
    source.copy(dest);
  } catch (error) {
    devError("savePhoto", "Failed to copy photo:", error, { tempUri, dest: dest.uri });
    throw error;
  }
  return { uri: dest.uri, filename };
}

export function deletePhoto(uri: string): void {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}

export function ensurePhotoDir(): void {
  getPhotoDir();
}
