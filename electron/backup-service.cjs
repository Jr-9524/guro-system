const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { app, BrowserWindow, dialog, shell } = require("electron");
const {
  closeDatabase,
  getDatabase,
  getDatabasePath,
} = require("./database.cjs");

const REQUIRED_TABLES = ["users", "students", "iep_documents", "progress_data"];

const timestamp = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
};

const backupFilename = () => `guro-backup-${timestamp()}.db`;

const getBackupDirectory = () => {
  const directory = path.join(app.getPath("userData"), "backups");
  fs.mkdirSync(directory, { recursive: true });
  return directory;
};

const showSaveDialog = (options) => {
  const window = BrowserWindow.getFocusedWindow();
  return window ? dialog.showSaveDialog(window, options) : dialog.showSaveDialog(options);
};

const showOpenDialog = (options) => {
  const window = BrowserWindow.getFocusedWindow();
  return window ? dialog.showOpenDialog(window, options) : dialog.showOpenDialog(options);
};

const validateBackup = (filePath) => {
  if (!fs.existsSync(filePath)) throw new Error("The selected backup file does not exist.");

  let candidate;
  try {
    candidate = new Database(filePath, { readonly: true, fileMustExist: true });
    const integrity = candidate.pragma("quick_check", { simple: true });
    if (integrity !== "ok") throw new Error("The selected database failed its integrity check.");

    const tables = new Set(
      candidate
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name),
    );
    const missing = REQUIRED_TABLES.filter((table) => !tables.has(table));
    if (missing.length) throw new Error("The selected file is not a valid GURO database backup.");
  } finally {
    if (candidate?.open) candidate.close();
  }
};

const replaceFile = (source, destination) => {
  const temporary = `${destination}.temporary-${Date.now()}`;
  fs.copyFileSync(source, temporary);
  if (fs.existsSync(destination)) fs.rmSync(destination, { force: true });
  fs.renameSync(temporary, destination);
};

async function createBackup() {
  try {
    const db = getDatabase();
    if (!db?.open) return { success: false, message: "The local database is not available." };

    const result = await showSaveDialog({
      title: "Create GURO Database Backup",
      defaultPath: path.join(getBackupDirectory(), backupFilename()),
      filters: [
        { name: "SQLite Database", extensions: ["db", "sqlite"] },
      ],
    });
    if (result.canceled || !result.filePath) return { success: false, canceled: true };

    const temporary = `${result.filePath}.temporary-${Date.now()}`;
    try {
      await db.backup(temporary);
      replaceFile(temporary, result.filePath);
    } finally {
      fs.rmSync(temporary, { force: true });
    }

    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, message: error.message || "Could not create the database backup." };
  }
}

async function restoreBackup() {
  let rollbackPath = "";
  let restoreTemporary = "";
  let databaseClosed = false;

  try {
    const db = getDatabase();
    if (!db?.open) return { success: false, message: "The local database is not available." };

    const result = await showOpenDialog({
      title: "Restore GURO Database Backup",
      properties: ["openFile"],
      filters: [
        { name: "SQLite Database", extensions: ["db", "sqlite"] },
      ],
    });
    if (result.canceled || !result.filePaths?.[0]) return { success: false, canceled: true };

    const sourcePath = result.filePaths[0];
    const extension = path.extname(sourcePath).toLowerCase();
    if (![".db", ".sqlite"].includes(extension)) {
      return { success: false, message: "Choose a .db or .sqlite backup file." };
    }

    const databasePath = getDatabasePath();
    if (path.resolve(sourcePath) === path.resolve(databasePath)) {
      return { success: false, message: "Choose a backup file other than the active GURO database." };
    }

    validateBackup(sourcePath);

    const safetyBackupPath = path.join(
      getBackupDirectory(),
      `guro-safety-before-restore-${timestamp()}.db`,
    );
    await db.backup(safetyBackupPath);

    restoreTemporary = `${databasePath}.restore-${Date.now()}`;
    fs.copyFileSync(sourcePath, restoreTemporary);
    validateBackup(restoreTemporary);

    db.pragma("wal_checkpoint(TRUNCATE)");
    closeDatabase();
    databaseClosed = true;

    rollbackPath = `${databasePath}.rollback-${Date.now()}`;
    if (fs.existsSync(databasePath)) fs.renameSync(databasePath, rollbackPath);
    fs.renameSync(restoreTemporary, databasePath);
    restoreTemporary = "";
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
    fs.rmSync(rollbackPath, { force: true });
    rollbackPath = "";

    return {
      success: true,
      path: sourcePath,
      safetyBackupPath,
      requiresRestart: true,
      message: "Restore completed. Please restart GURO System to reload the restored data.",
    };
  } catch (error) {
    const databasePath = getDatabasePath();
    try {
      if (rollbackPath && fs.existsSync(rollbackPath)) {
        fs.rmSync(databasePath, { force: true });
        fs.renameSync(rollbackPath, databasePath);
      }
    } catch {
      // The safety backup remains available if rollback cannot be completed.
    }
    return {
      success: false,
      message: error.message || "Could not restore the database backup.",
      requiresRestart: databaseClosed,
    };
  } finally {
    if (restoreTemporary) fs.rmSync(restoreTemporary, { force: true });
  }
}

async function openBackupFolder() {
  try {
    const directory = getBackupDirectory();
    const message = await shell.openPath(directory);
    return message
      ? { success: false, message }
      : { success: true, path: directory };
  } catch (error) {
    return { success: false, message: error.message || "Could not open the backup folder." };
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  openBackupFolder,
  validateBackup,
};