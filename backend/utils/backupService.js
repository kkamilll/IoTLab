import fs from "fs";
import path from "path";
import { exec } from "child_process";
import zlib from "zlib";
import { promisify } from "util";
import mongoose from "mongoose";
import { logAudit } from "./auditLogger.js";

const execAsync = promisify(exec);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Remove backup archives older than 30 days from the backups/ directory
 * @param {string} backupsDir
 * @returns {number} Number of deleted archives
 */
export const cleanOldBackups = (backupsDir) => {
  let deletedCount = 0;
  try {
    if (!fs.existsSync(backupsDir)) return 0;
    const now = Date.now();
    const files = fs.readdirSync(backupsDir);

    for (const file of files) {
      if (file.endsWith(".gz")) {
        const filePath = path.join(backupsDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > THIRTY_DAYS_MS) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`[Backup Retention] Deleted archive older than 30 days: ${file}`);
          }
        } catch (fileErr) {
          console.warn(`[Backup Retention] Could not process file ${file}:`, fileErr.message);
        }
      }
    }
  } catch (err) {
    console.error("[Backup Retention] Error checking old backups:", err.message);
  }
  return deletedCount;
};

/**
 * Fallback backup method using Mongoose/MongoDB connection and native Gzip compression
 * when mongodump CLI tool is not available in the system PATH.
 * @param {string} targetFile
 */
const performNativeNodeDump = async (targetFile) => {
  if (!mongoose.connection?.db) {
    throw new Error("MongoDB connection not established for native dump.");
  }

  const collections = await mongoose.connection.db.collections();
  const dumpObject = {
    exportedAt: new Date().toISOString(),
    database: mongoose.connection.db.databaseName,
    collections: {},
  };

  for (const col of collections) {
    const colName = col.collectionName;
    const docs = await col.find({}).toArray();
    dumpObject.collections[colName] = docs;
  }

  const jsonString = JSON.stringify(dumpObject);
  const compressed = zlib.gzipSync(Buffer.from(jsonString, "utf-8"));
  fs.writeFileSync(targetFile, compressed);
};

/**
 * Run database backup with gzip compression and cleanup archives older than 30 days
 * @returns {Promise<{ success: boolean, file: string, size: number, deletedOld: number, method: string }>}
 */
export const performDatabaseBackup = async () => {
  const backupsDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `backup-${dateStr}.gz`;
  const filePath = path.join(backupsDir, fileName);

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/iotlab";
  let usedMethod = "mongodump";

  try {
    // 1. Attempt mongodump with gzip archive
    const cmd = `mongodump --uri="${mongoUri}" --archive="${filePath}" --gzip`;
    await execAsync(cmd);
    console.log(`[Backup Service] mongodump archive created successfully at: ${filePath}`);
  } catch (execErr) {
    console.warn(`[Backup Service] mongodump command failed or not installed (${execErr.message}). Using native compressed backup fallback.`);
    usedMethod = "native-gzip-fallback";
    // 2. Fallback to native Node gzip export
    await performNativeNodeDump(filePath);
    console.log(`[Backup Service] Native gzip backup archive created successfully at: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const deletedOld = cleanOldBackups(backupsDir);

  const sizeKb = (stats.size / 1024).toFixed(1);
  const detailsMsg = `Automatyczna kopia bazy danych (${usedMethod}): ${fileName} (${sizeKb} KB). Usunięto kopii > 30 dni: ${deletedOld}`;

  try {
    await logAudit({
      action: "SYSTEM_BACKUP",
      details: detailsMsg,
      targetType: "System",
    });
  } catch (auditErr) {
    console.warn("[Backup Service] Could not log audit for backup:", auditErr.message);
  }

  console.log(`[Backup Service] ${detailsMsg}`);

  return {
    success: true,
    file: fileName,
    size: stats.size,
    deletedOld,
    method: usedMethod,
  };
};
