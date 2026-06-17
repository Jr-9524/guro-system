// src/services/studentService.js - Updated for Electron
import EncryptionService from "../security/encryption";

const STUDENTS_STORAGE_KEY = "students";
const STUDENTS_ENCRYPTION_KEY = "students:encryptionKey";

class StudentService {
  getLocalEncryptionKey() {
    let key = localStorage.getItem(STUDENTS_ENCRYPTION_KEY);
    if (!key) {
      key = EncryptionService.generateKey();
      localStorage.setItem(STUDENTS_ENCRYPTION_KEY, key);
    }

    return key;
  }

  loadLocalStudents() {
    const stored = JSON.parse(
      localStorage.getItem(STUDENTS_STORAGE_KEY) || "null",
    );
    if (!stored) return [];

    if (stored.ciphertext && stored.iv) {
      return EncryptionService.decrypt(
        stored.ciphertext,
        this.getLocalEncryptionKey(),
        stored.iv,
      );
    }

    return Array.isArray(stored) ? stored : [];
  }

  saveLocalStudents(students) {
    const encrypted = EncryptionService.encrypt(
      students,
      this.getLocalEncryptionKey(),
    );
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(encrypted));
  }

  toStudent(row) {
    if (!row) return row;

    return {
      id: row.id,
      lrn: row.lrn,
      firstName: row.first_name ?? row.firstName,
      middleName: row.middle_name ?? row.middleName,
      lastName: row.last_name ?? row.lastName,
      birthDate: row.birth_date ?? row.birthDate,
      gender: row.gender,
      gradeLevel: row.grade_level ?? row.gradeLevel,
      section: row.section,
      school: row.school,
      primaryDisabilityCategory:
        row.primary_disability_category ?? row.primaryDisabilityCategory,
      severityLevel: row.severity_level ?? row.severityLevel,
      communicationMode: row.communication_mode ?? row.communicationMode,
      address: row.address,
      guardianName: row.guardian_name ?? row.guardianName,
      guardianContact: row.guardian_contact ?? row.guardianContact,
      guardianEmail: row.guardian_email ?? row.guardianEmail,
      guardianRelationship:
        row.guardian_relationship ?? row.guardianRelationship,
      isActive: Boolean(row.is_active ?? row.isActive),
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
    };
  }

  async getAll() {
    if (window.electronAPI) {
      const students = await window.electronAPI.students.getAll();
      return students.map((student) => this.toStudent(student));
    }
    // Fallback to localStorage for development
    return this.loadLocalStudents();
  }

  async create(data) {
    if (window.electronAPI) {
      const student = await window.electronAPI.students.create(data);
      return this.toStudent(student);
    }
    // Fallback
    const students = this.loadLocalStudents();
    const newStudent = { ...data, id: Date.now().toString() };
    students.push(newStudent);
    this.saveLocalStudents(students);
    return newStudent;
  }

  async update(id, data) {
    if (window.electronAPI) {
      const student = await window.electronAPI.students.update(id, data);
      return this.toStudent(student);
    }
    // Fallback
    const students = this.loadLocalStudents();
    const index = students.findIndex((s) => s.id === id);
    if (index >= 0) {
      students[index] = { ...students[index], ...data };
      this.saveLocalStudents(students);
      return students[index];
    }
    return null;
  }

  async delete(id) {
    if (window.electronAPI) {
      return window.electronAPI.students.delete(id);
    }
    // Fallback
    const students = this.loadLocalStudents();
    this.saveLocalStudents(students.filter((s) => s.id !== id));
    return true;
  }

  async search(query) {
    if (window.electronAPI) {
      const students = await window.electronAPI.students.search(query);
      return students.map((student) => this.toStudent(student));
    }
    // Fallback
    const students = this.loadLocalStudents();
    const q = query.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName?.toLowerCase().includes(q) ||
        s.lastName?.toLowerCase().includes(q) ||
        s.lrn?.includes(q),
    );
  }
}

export default new StudentService();
