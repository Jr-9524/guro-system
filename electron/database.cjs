// electron/database.js
const Database = require("better-sqlite3");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

let db = null;

function getDatabasePath() {
  const userDataPath = app.getPath("userData");
  const dbDir = path.join(userDataPath, "data");

  // Create data directory if not exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, "iep-manager.db");
}

function initDatabase() {
  const dbPath = getDatabasePath();

  db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === "development" ? console.log : null,
  });

  // Performance optimizations
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("cache_size = -64000"); // 64MB cache

  createTables();
  migrateSchema();

  console.log("Database initialized at:", dbPath);
  return db;
}

function getDatabase() {
  return db;
}

function createTables() {
  db.exec(`
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'teacher',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      lrn TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      birth_date TEXT,
      gender TEXT,
      grade_level TEXT,
      section TEXT,
      school TEXT,
      primary_disability_category TEXT,
      severity_level TEXT,
      communication_mode TEXT,
      address TEXT,
      guardian_name TEXT,
      guardian_contact TEXT,
      guardian_email TEXT,
      guardian_relationship TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Guardians
    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      relationship TEXT,
      contact_number TEXT,
      email TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- Student Disabilities
    CREATE TABLE IF NOT EXISTS student_disabilities (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT,
      diagnosis_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    -- IEP Documents
    -- title, data, and completed_sections are encrypted at rest in ipc-handlers.cjs.
    CREATE TABLE IF NOT EXISTS iep_documents (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      title TEXT,
      data TEXT NOT NULL,
      completed_sections TEXT,
      active_section INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      created_by TEXT,
      last_modified TEXT DEFAULT (datetime('now')),
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Progress Data
    -- notes is encrypted at rest because progress comments may contain sensitive details.
    CREATE TABLE IF NOT EXISTS progress_data (
      id TEXT PRIMARY KEY,
      iep_id TEXT NOT NULL,
      goal_id TEXT NOT NULL,
      session_date TEXT NOT NULL,
      score REAL,
      total REAL,
      notes TEXT,
      recorded_by TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (iep_id) REFERENCES iep_documents(id) ON DELETE CASCADE
    );

    -- Audit Log
    -- details is encrypted at rest; action/entity fields stay readable for filtering.
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Workspace key/value settings formerly stored in localStorage.
    -- value is encrypted at rest because it can contain custom goals and preferences.
    CREATE TABLE IF NOT EXISTS workspace_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(lrn);
    CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
    CREATE INDEX IF NOT EXISTS idx_iep_student ON iep_documents(student_id);
    CREATE INDEX IF NOT EXISTS idx_iep_status ON iep_documents(status);
    CREATE INDEX IF NOT EXISTS idx_progress_iep ON progress_data(iep_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
  `);
}

function migrateSchema() {
  addMissingColumns("students", {
    primary_disability_category: "TEXT",
    severity_level: "TEXT",
    communication_mode: "TEXT",
    guardian_name: "TEXT",
    guardian_contact: "TEXT",
    guardian_email: "TEXT",
    guardian_relationship: "TEXT",
  });
  addMissingColumns("iep_documents", {
    // Soft delete marker: deleted IEPs stay recoverable in the database.
    deleted_at: "TEXT",
  });
  addMissingColumns("progress_data", {
    // Progress logs use flags so records can be hidden without being destroyed.
    is_deleted: "INTEGER DEFAULT 0",
    deleted_at: "TEXT",
  });
}

function addMissingColumns(tableName, columns) {
  const existingColumns = new Set(
    db.prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .map((column) => column.name),
  );

  for (const [columnName, definition] of Object.entries(columns)) {
    if (!existingColumns.has(columnName)) {
      db.prepare(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
      ).run();
    }
  }
}

function closeDatabase() {
  if (db?.open) db.close();
  db = null;
}

module.exports = {
  initDatabase,
  getDatabase,
  getDatabasePath,
  closeDatabase,
};
