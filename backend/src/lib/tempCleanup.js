import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TMP_DIR = path.join(__dirname, "..", "tmp");

const MAX_AGE_MS = 60 * 60 * 1000;

export const cleanTempDir = async () => {
  try {
    const files = await fsp.readdir(TMP_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(TMP_DIR, file);
      try {
        const stat = await fsp.stat(filePath);
        if (stat.isFile() && now - stat.mtimeMs > MAX_AGE_MS) {
          await fsp.unlink(filePath);
        }
      } catch {
        // pass
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Temp cleanup error:", error);
  }
};

export const startTempCleanup = () => {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  cleanTempDir(); 
  return cron.schedule("0 * * * *", cleanTempDir);
};