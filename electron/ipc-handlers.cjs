// electron/ipc-handlers.js
const { ipcMain } = require("electron");
const { getDatabase } = require("./database.cjs");
const { encryptValue, decryptValue } = require("./encryption.cjs");
const { v4: uuidv4 } = require("uuid");

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
  encryptExistingSensitiveData(db);

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
    db
      .prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?")
      .all(MAX_ACTIVITY_ITEMS)
      .map(mapAuditRow),
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
    db.prepare("DELETE FROM audit_log").run();
    return true;
  });

  ipcMain.handle("audit:replace", (event, items = []) => {
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

  ipcMain.handle("auth:login", (event, { username, password }) => {
    const bcrypt = require("bcryptjs");
    const user = db
      .prepare("SELECT * FROM users WHERE username = ? AND is_active = 1")
      .get(username);

    if (!user) return { success: false, error: "Invalid credentials" };

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return { success: false, error: "Invalid credentials" };

    db.prepare(
      "UPDATE users SET last_login = datetime('now') WHERE id = ?",
    ).run(user.id);

    const { password_hash, ...safeUser } = user;
    return { success: true, user: safeUser };
  });

  ipcMain.handle("auth:register", (event, data) => {
    const bcrypt = require("bcryptjs");
    const existing = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(data.username);
    if (existing) return { success: false, error: "Username already exists" };

    const id = uuidv4();
    const hash = bcrypt.hashSync(data.password, 12);

    db.prepare(
      `
      INSERT INTO users (id, username, password_hash, full_name, email, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      data.username,
      hash,
      data.fullName,
      data.email,
      data.role || "teacher",
    );

    return { success: true };
  });
}

module.exports = { setupIPCHandlers };
