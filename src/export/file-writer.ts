import { File, Directory, Paths } from "expo-file-system";

const EXPORT_DIR_NAME = "ora-exports";
let _exportDirCache: Directory | null = null;

function getExportDir(): Directory {
  if (_exportDirCache) return _exportDirCache;
  const dir = new Directory(Paths.document, EXPORT_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  _exportDirCache = dir;
  return dir;
}

export function writeCSVFile(csv: string, filename: string): string {
  const dir = getExportDir();
  const file = new File(dir, filename);
  file.write(csv);
  return file.uri;
}

export function listExportFiles(): string[] {
  const dir = getExportDir();
  return dir
    .list()
    .map((entry) => (entry instanceof File ? entry.name : ""))
    .filter(Boolean);
}

export function deleteExportFile(filename: string): void {
  const dir = getExportDir();
  const file = new File(dir, filename);
  if (file.exists) {
    file.delete();
  }
}
