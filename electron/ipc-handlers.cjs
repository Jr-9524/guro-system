// electron/ipc-handlers.js
const { ipcMain } = require("electron");
const { getDatabase } = require("./database.cjs");
const { encryptValue, decryptValue } = require("./encryption.cjs");
const { v4: uuidv4 } = require("uuid");
const aiService = require("./ai-service.cjs");
const aiSettingsService = require("./ai-settings-service.cjs");
const backupService = require("./backup-service.cjs");

const ENCRYPTED_STUDENT_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "birth_date",
  "gender",
  "section",
  "school",
  "primary_disability_category",
  "severity_level",
  "communication_mode",
  "address",
  "guardian_name",
  "guardian_contact",
  "guardian_email",
  "guardian_relationship",
];
const MAX_ACTIVITY_ITEMS = 500;

const normalizeRole = (role) => {
  const value = String(role || "teacher")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (value === "admin") return "admin";
  if (value === "coordinator" || value === "sped_coordinator") {
    return "sped_coordinator";
  }
  return "teacher";
};

const validateAccountData = (data = {}) => {
  const fullName = String(data.fullName || "").trim();
  const username = String(data.username || "").trim();
  const email = String(data.email || "").trim();
  const password = String(data.password || "");
  if (!fullName) return "Full name is required.";
  if (!username) return "Username is required.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
};

const toSafeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email || "",
    role: normalizeRole(user.role),
    is_active: Number(user.is_active ?? 1),
    last_login: user.last_login || null,
    created_at: user.created_at || null,
    updated_at: user.updated_at || null,
  };
};

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

function encryptStudentData(data) {
  return {
    lrn: data.lrn,
    firstName: encryptValue(data.firstName),
    middleName: encryptValue(data.middleName),
    lastName: encryptValue(data.lastName),
    birthDate: encryptValue(data.birthDate),
    gender: encryptValue(data.gender),
    gradeLevel: data.gradeLevel,
    section: encryptValue(data.section),
    school: encryptValue(data.school),
    primaryDisabilityCategory: encryptValue(data.primaryDisabilityCategory),
    severityLevel: encryptValue(data.severityLevel),
    communicationMode: encryptValue(data.communicationMode),
    address: encryptValue(data.address),
    guardianName: encryptValue(data.guardianName),
    guardianContact: encryptValue(data.guardianContact),
    guardianEmail: encryptValue(data.guardianEmail),
    guardianRelationship: encryptValue(data.guardianRelationship),
  };
}

function decryptStudentRow(row) {
  if (!row) return row;

  const decrypted = { ...row };
  for (const field of ENCRYPTED_STUDENT_FIELDS) {
    decrypted[field] = decryptValue(decrypted[field]);
  }

  return decrypted;
}

function encryptIepData(data) {
  return {
    title: encryptValue(data.title),
    data: encryptValue(JSON.stringify(data.data || {})),
    completedSections: encryptValue(JSON.stringify(data.completedSections || [])),
  };
}

function decryptIepRow(row) {
  if (!row) return row;

  return {
    ...row,
    title: decryptValue(row.title),
    data: decryptValue(row.data),
    completed_sections: decryptValue(row.completed_sections),
  };
}

function encryptProgressData(data) {
  return {
    notes: encryptValue(data.notes),
  };
}

function decryptProgressRow(row) {
  if (!row) return row;

  return {
    ...row,
    notes: decryptValue(row.notes),
  };
}

function decryptWorkspaceValue(value) {
  return parseJson(decryptValue(value), null);
}

function decryptAuditRowDetails(row) {
  return row.details ? parseJson(decryptValue(row.details), {}) : {};
}

function encryptExistingSensitiveData(db) {
  // Startup migration: encrypt existing plain-text records while encryptValue stays idempotent.
  const updateStudent = db.prepare(
    `UPDATE students SET ${ENCRYPTED_STUDENT_FIELDS.map(
      (field) => `${field} = ?`,
    ).join(", ")} WHERE id = ?`,
  );
  db.prepare(
    `SELECT id, ${ENCRYPTED_STUDENT_FIELDS.join(", ")} FROM students`,
  )
    .all()
    .forEach((row) => {
      updateStudent.run(
        ...ENCRYPTED_STUDENT_FIELDS.map((field) => encryptValue(row[field])),
        row.id,
      );
    });

  const updateIep = db.prepare(
    "UPDATE iep_documents SET title = ?, data = ?, completed_sections = ? WHERE id = ?",
  );
  db.prepare("SELECT id, title, data, completed_sections FROM iep_documents")
    .all()
    .forEach((row) => {
      updateIep.run(
        encryptValue(row.title),
        encryptValue(row.data),
        encryptValue(row.completed_sections),
        row.id,
      );
    });

  const updateProgress = db.prepare("UPDATE progress_data SET notes = ? WHERE id = ?");
  db.prepare("SELECT id, notes FROM progress_data")
    .all()
    .forEach((row) => {
      updateProgress.run(encryptValue(row.notes), row.id);
    });

  const updateWorkspace = db.prepare("UPDATE workspace_store SET value = ? WHERE key = ?");
  db.prepare("SELECT key, value FROM workspace_store")
    .all()
    .forEach((row) => {
      updateWorkspace.run(encryptValue(row.value), row.key);
    });

  const updateAudit = db.prepare("UPDATE audit_log SET details = ? WHERE id = ?");
  db.prepare("SELECT id, details FROM audit_log")
    .all()
    .forEach((row) => {
      updateAudit.run(encryptValue(row.details), row.id);
    });
}

function sortStudentsByName(students) {
  return [...students].sort((a, b) => {
    const lastNameCompare = (a.last_name || "").localeCompare(
      b.last_name || "",
    );
    if (lastNameCompare !== 0) return lastNameCompare;

    return (a.first_name || "").localeCompare(b.first_name || "");
  });
}

function setupIPCHandlers() {
  const db = getDatabase();
  let currentUserRole = "teacher";
  let currentUserId = null;
  let currentSessionToken = null;
  const canReadAudit = () =>
    currentUserRole === "admin" || currentUserRole === "sped_coordinator";
  const requireAdmin = () =>
    currentUserRole === "admin"
      ? null
      : { success: false, message: "Admin permission is required." };

  encryptExistingSensitiveData(db);

  ipcMain.handle("ai:generatePlaafp", async (_event, payload) =>
    aiService.generatePlaafp(payload),
  );
  ipcMain.handle("ai:suggestGoals", async (_event, payload) =>
    aiService.suggestGoals(payload),
  );
  ipcMain.handle("ai:summarizeProgress", async (_event, payload) =>
    aiService.summarizeProgress(payload),
  );

  // Admin configures credentials; teachers can only check readiness and use AI.
  ipcMain.handle("ai-settings:get", () => {
    const denied = requireAdmin();
    if (denied) return { success: false, error: denied.message };
    return { success: true, settings: aiSettingsService.getPublicSettings() };
  });
  ipcMain.handle("ai-settings:save", (_event, settings) => {
    const denied = requireAdmin();
    if (denied) return { success: false, error: denied.message };
    try {
      return {
        success: true,
        settings: aiSettingsService.saveSettings(settings),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("ai-settings:remove", () => {
    const denied = requireAdmin();
    if (denied) return { success: false, error: denied.message };
    return aiSettingsService.removeSettings();
  });
  ipcMain.handle("ai-settings:test", async (_event, settings) => {
    const denied = requireAdmin();
    if (denied) return { success: false, message: denied.message };
    return aiService.testConnection(settings);
  });
  ipcMain.handle("ai-settings:is-configured", () =>
    aiSettingsService.isConfigured(),
  );
  ipcMain.handle("backup:create", () =>
    requireAdmin() || backupService.createBackup(),
  );
  ipcMain.handle("backup:restore", () =>
    requireAdmin() || backupService.restoreBackup(),
  );
  ipcMain.handle("backup:openFolder", () =>
    requireAdmin() || backupService.openBackupFolder(),
  );

  // ─── Students ────────────────────────

  ipcMain.handle("students:getAll", () => {
    const students = db
      .prepare("SELECT * FROM students WHERE is_active = 1")
      .all();

    return sortStudentsByName(students.map(decryptStudentRow));
  });

  ipcMain.handle("students:getById", (event, id) => {
    return decryptStudentRow(
      db.prepare("SELECT * FROM students WHERE id = ?").get(id),
    );
  });

  ipcMain.handle("students:create", (event, data) => {
    const id = uuidv4();
    const encrypted = encryptStudentData(data);

    db.prepare(
      `
      INSERT INTO students (id, lrn, first_name, middle_name, last_name, birth_date, gender, grade_level, section, school, primary_disability_category, severity_level, communication_mode, address, guardian_name, guardian_contact, guardian_email, guardian_relationship)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      encrypted.lrn,
      encrypted.firstName,
      encrypted.middleName,
      encrypted.lastName,
      encrypted.birthDate,
      encrypted.gender,
      encrypted.gradeLevel,
      encrypted.section,
      encrypted.school,
      encrypted.primaryDisabilityCategory,
      encrypted.severityLevel,
      encrypted.communicationMode,
      encrypted.address,
      encrypted.guardianName,
      encrypted.guardianContact,
      encrypted.guardianEmail,
      encrypted.guardianRelationship,
    );

    return decryptStudentRow(
      db.prepare("SELECT * FROM students WHERE id = ?").get(id),
    );
  });

  ipcMain.handle("students:update", (event, { id, data }) => {
    const encrypted = encryptStudentData(data);

    db.prepare(
      `
      UPDATE students SET lrn=?, first_name=?, middle_name=?, last_name=?, birth_date=?, gender=?, grade_level=?, section=?, school=?, primary_disability_category=?, severity_level=?, communication_mode=?, address=?, guardian_name=?, guardian_contact=?, guardian_email=?, guardian_relationship=?, updated_at=datetime('now')
      WHERE id=?
    `,
    ).run(
      encrypted.lrn,
      encrypted.firstName,
      encrypted.middleName,
      encrypted.lastName,
      encrypted.birthDate,
      encrypted.gender,
      encrypted.gradeLevel,
      encrypted.section,
      encrypted.school,
      encrypted.primaryDisabilityCategory,
      encrypted.severityLevel,
      encrypted.communicationMode,
      encrypted.address,
      encrypted.guardianName,
      encrypted.guardianContact,
      encrypted.guardianEmail,
      encrypted.guardianRelationship,
      id,
    );

    return decryptStudentRow(
      db.prepare("SELECT * FROM students WHERE id = ?").get(id),
    );
  });

  ipcMain.handle("students:delete", (event, id) => {
    // Soft delete: hide the student but keep the record for recovery/audit needs.
    return db
      .prepare(
        "UPDATE students SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
      )
      .run(id);
  });

  ipcMain.handle("students:search", (event, query) => {
    const search = query.toLowerCase();
    const students = db
      .prepare(
        `
      SELECT * FROM students 
      WHERE is_active = 1 
    `,
      )
      .all()
      .map(decryptStudentRow)
      .filter(
        (student) =>
          student.first_name?.toLowerCase().includes(search) ||
          student.last_name?.toLowerCase().includes(search) ||
          student.lrn?.includes(search) ||
          student.grade_level?.toLowerCase().includes(search),
      );

    return sortStudentsByName(students);
  });

  // ─── IEP Documents ────────────────────

  ipcMain.handle("iep:getAll", (event, filters = {}) => {
    let query = "SELECT * FROM iep_documents WHERE 1=1";
    const params = [];

    if (!filters.includeDeleted) {
      query += " AND status != 'deleted'";
    }
    if (filters.studentId) {
      query += " AND student_id = ?";
      params.push(filters.studentId);
    }
    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    query += " ORDER BY last_modified DESC";
    return db.prepare(query).all(...params).map(decryptIepRow);
  });

  ipcMain.handle("iep:getById", (event, id) => {
    return decryptIepRow(
      db
        .prepare("SELECT * FROM iep_documents WHERE id = ? AND status != 'deleted'")
        .get(id),
    );
  });

  ipcMain.handle("iep:save", (event, data) => {
    const existing = db
      .prepare("SELECT id FROM iep_documents WHERE id = ?")
      .get(data.id);
    let documentId = data.id;
    const encrypted = encryptIepData(data);

    if (existing) {
      db.prepare(
        `
        UPDATE iep_documents 
        SET title=?, data=?, completed_sections=?, active_section=?, status=?, deleted_at=?, last_modified=datetime('now')
        WHERE id=?
      `,
      ).run(
        encrypted.title,
        encrypted.data,
        encrypted.completedSections,
        data.activeSection,
        data.status,
        data.deletedAt || data.deleted_at || null,
        data.id,
      );
    } else {
      documentId = data.id || uuidv4();
      db.prepare(
        `
        INSERT INTO iep_documents (id, student_id, title, data, completed_sections, active_section, status, created_by, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        documentId,
        data.studentId,
        encrypted.title,
        encrypted.data,
        encrypted.completedSections,
        data.activeSection,
        data.status,
        data.createdBy,
        data.deletedAt || data.deleted_at || null,
      );
    }

    return decryptIepRow(
      db.prepare("SELECT * FROM iep_documents WHERE id = ?").get(documentId),
    );
  });

  ipcMain.handle("iep:delete", (event, id) => {
    // Soft delete: keep the IEP and its progress logs in SQLite, but hide it.
    return db
      .prepare(
        `
        UPDATE iep_documents
        SET status = 'deleted', deleted_at = datetime('now'), last_modified = datetime('now')
        WHERE id = ?
      `,
      )
      .run(id);
  });

  // ─── Progress Data ────────────────────

  ipcMain.handle("progress:getByIEP", (event, iepId, options = {}) => {
    const deletedClause = options.includeDeleted ? "" : " AND is_deleted = 0";
    return db
      .prepare(
        `SELECT * FROM progress_data WHERE iep_id = ?${deletedClause} ORDER BY session_date DESC`,
      )
      .all(iepId)
      .map(decryptProgressRow);
  });

  ipcMain.handle("progress:logSession", (event, data) => {
    const id = data.id || uuidv4();
    const encrypted = encryptProgressData(data);
    db.prepare(
      `
      INSERT INTO progress_data (id, iep_id, goal_id, session_date, score, total, notes, recorded_by, is_deleted, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      data.iepId,
      data.goalId,
      data.sessionDate,
      data.score,
      data.total,
      encrypted.notes,
      data.recordedBy,
      data.isDeleted || data.is_deleted ? 1 : 0,
      data.deletedAt || data.deleted_at || null,
    );

    return decryptProgressRow(db.prepare("SELECT * FROM progress_data WHERE id = ?").get(id));
  });

  ipcMain.handle("progress:delete", (event, id) => {
    // Soft delete: progress evidence remains available for recovery or audit review.
    return db
      .prepare(
        "UPDATE progress_data SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?",
      )
      .run(id);
  });

  // Workspace Store
  // Keeps non-record workspace state in SQLite while preserving simple keyed access.

  ipcMain.handle("workspace:get", (event, key) => {
    const row = db.prepare("SELECT value FROM workspace_store WHERE key = ?").get(key);
    return row ? decryptWorkspaceValue(row.value) : null;
  });

  ipcMain.handle("workspace:set", (event, { key, value }) => {
    db.prepare(
      `
      INSERT INTO workspace_store (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')
    `,
    ).run(key, encryptValue(JSON.stringify(value)));

    return true;
  });

  ipcMain.handle("workspace:remove", (event, key) => {
    db.prepare("DELETE FROM workspace_store WHERE key = ?").run(key);
    return true;
  });

  // Audit Activity

  const mapAuditRow = (row) => {
    const details = decryptAuditRowDetails(row);

    return {
      id: row.id,
      type: details.type || row.entity_type || "data",
      title: details.title || row.action,
      description: details.description || "",
      entity: row.entity_type || "",
      entityId: row.entity_id || "",
      href: details.href || "",
      createdAt: row.timestamp,
    };
  };

  ipcMain.handle("audit:getAll", () =>
    canReadAudit()
      ? db
          .prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?")
          .all(MAX_ACTIVITY_ITEMS)
          .map(mapAuditRow)
      : [],
  );

  ipcMain.handle("audit:log", (event, item) => {
    const id = uuidv4();
    const details = {
      type: item.type,
      title: item.title,
      description: item.description || "",
      href: item.href || "",
    };

    db.prepare(
      `
      INSERT INTO audit_log (id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      item.title,
      item.entity || item.type || "data",
      item.entityId || "",
      encryptValue(JSON.stringify(details)),
    );

    const extraRows = db
      .prepare("SELECT id FROM audit_log ORDER BY timestamp DESC LIMIT -1 OFFSET ?")
      .all(MAX_ACTIVITY_ITEMS);
    const deleteAudit = db.prepare("DELETE FROM audit_log WHERE id = ?");
    extraRows.forEach((row) => deleteAudit.run(row.id));

    return mapAuditRow(db.prepare("SELECT * FROM audit_log WHERE id = ?").get(id));
  });

  ipcMain.handle("audit:clear", () => {
    if (currentUserRole !== "admin") return false;
    db.prepare("DELETE FROM audit_log").run();
    return true;
  });

  ipcMain.handle("audit:replace", (event, items = []) => {
    if (currentUserRole !== "admin") return false;
    db.prepare("DELETE FROM audit_log").run();
    const insertAudit = db.prepare(
      `
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    );

    items.slice(0, MAX_ACTIVITY_ITEMS).forEach((item) => {
      const details = {
        type: item.type,
        title: item.title,
        description: item.description || "",
        href: item.href || "",
      };

      insertAudit.run(
        item.id || uuidv4(),
        item.title || "Activity",
        item.entity || item.type || "data",
        item.entityId || "",
        encryptValue(JSON.stringify(details)),
        item.createdAt || new Date().toISOString(),
      );
    });

    return true;
  });

  // ─── Auth ────────────────────────────

  const getUserCount = () => db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  const getActiveAdminCount = () => db.prepare("SELECT COUNT(*) AS count FROM users WHERE LOWER(TRIM(role)) = 'admin' AND is_active = 1").get().count;
  const findUserByUsername = (username) => db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(String(username || "").trim());
  const insertUser = (data, forcedRole) => {
    const validationError = validateAccountData(data);
    if (validationError) return { success: false, error: validationError };
    if (findUserByUsername(data.username)) return { success: false, error: "Username already exists." };
    const bcrypt = require("bcryptjs");
    const id = uuidv4();
    db.prepare("INSERT INTO users (id, username, password_hash, full_name, email, role) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, String(data.username).trim(), bcrypt.hashSync(String(data.password), 12),
      String(data.fullName).trim(), String(data.email || "").trim() || null, normalizeRole(forcedRole ?? data.role),
    );
    return { success: true, user: toSafeUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id)) };
  };
  const adminDenied = () => {
    const denied = requireAdmin();
    return denied ? { success: false, error: denied.message || "Admin permission is required." } : null;
  };

  ipcMain.handle("auth:getUserCount", () => ({ success: true, count: getUserCount() }));

  ipcMain.handle("auth:createFirstAdmin", (_event, data) => {
    const createFirstAdmin = db.transaction((accountData) => {
      if (getUserCount() !== 0) return { success: false, error: "First administrator setup is no longer available." };
      return insertUser(accountData, "admin");
    });
    return createFirstAdmin.immediate(data);
  });

  ipcMain.handle("auth:login", (_event, { username, password }) => {
    const identifier = String(username || "").trim();
    const user = db.prepare("SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND is_active = 1").get(identifier, identifier);
    if (!user || !require("bcryptjs").compareSync(String(password || ""), user.password_hash)) {
      return { success: false, error: "Invalid credentials" };
    }
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    currentUserId = user.id;
    currentUserRole = normalizeRole(user.role);
    currentSessionToken = uuidv4();
    return {
      success: true,
      user: toSafeUser(user),
      sessionToken: currentSessionToken,
    };
  });

  ipcMain.handle("auth:resume", (_event, { userId, token } = {}) => {
    if (
      !currentUserId ||
      !currentSessionToken ||
      String(userId) !== String(currentUserId) ||
      token !== currentSessionToken
    ) {
      return { success: false };
    }
    const user = db
      .prepare("SELECT * FROM users WHERE id = ? AND is_active = 1")
      .get(userId);
    if (!user) {
      currentUserId = null;
      currentSessionToken = null;
      currentUserRole = "teacher";
      return { success: false };
    }
    currentUserRole = normalizeRole(user.role);
    return { success: true, user: toSafeUser(user) };
  });

  ipcMain.handle("auth:logout", () => {
    currentUserId = null;
    currentSessionToken = null;
    currentUserRole = "teacher";
    return true;
  });

  ipcMain.handle("users:list", () => {
    const denied = adminDenied();
    if (denied) return denied;
    const users = db.prepare("SELECT id, username, full_name, email, role, is_active, last_login, created_at, updated_at FROM users ORDER BY full_name COLLATE NOCASE, username COLLATE NOCASE").all().map(toSafeUser);
    return { success: true, users };
  });

  ipcMain.handle("users:create", (_event, data) => {
    const denied = adminDenied();
    return denied || insertUser(data, normalizeRole(data?.role));
  });

  ipcMain.handle("users:updateRole", (_event, { userId, role }) => {
    const denied = adminDenied();
    if (denied) return denied;
    if (String(userId) === String(currentUserId)) return { success: false, error: "You cannot change your own role." };
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return { success: false, error: "User not found." };
    const nextRole = normalizeRole(role);
    if (normalizeRole(user.role) === "admin" && nextRole !== "admin" && Number(user.is_active) === 1 && getActiveAdminCount() <= 1) {
      return { success: false, error: "At least one active Admin is required." };
    }
    db.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?").run(nextRole, userId);
    return { success: true, user: toSafeUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId)) };
  });

  ipcMain.handle("users:setActive", (_event, { userId, isActive }) => {
    const denied = adminDenied();
    if (denied) return denied;
    if (String(userId) === String(currentUserId) && !isActive) return { success: false, error: "You cannot deactivate your own account." };
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) return { success: false, error: "User not found." };
    if (normalizeRole(user.role) === "admin" && Number(user.is_active) === 1 && !isActive && getActiveAdminCount() <= 1) {
      return { success: false, error: "At least one active Admin is required." };
    }
    db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(isActive ? 1 : 0, userId);
    return { success: true, user: toSafeUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId)) };
  });

  ipcMain.handle("users:resetPassword", (_event, { userId, password }) => {
    const denied = adminDenied();
    if (denied) return denied;
    if (String(password || "").length < 8) return { success: false, error: "Password must be at least 8 characters." };
    if (!db.prepare("SELECT id FROM users WHERE id = ?").get(userId)) return { success: false, error: "User not found." };
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(require("bcryptjs").hashSync(String(password), 12), userId);
    return { success: true };
  });
}

module.exports = { setupIPCHandlers };
