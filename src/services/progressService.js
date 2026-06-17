import auditService from "./auditService";
import {
  loadEncryptedLocal,
  saveEncryptedLocal,
} from "../security/localEncryptedStorage";

const PROGRESS_STORAGE_KEY = "progress-sessions";

const normalizeSession = (session) => ({
  id: session.id,
  iepId: session.iep_id ?? session.iepId,
  goalId: String(session.goal_id ?? session.goalId),
  sessionDate: session.session_date ?? session.sessionDate,
  score: Number(session.score ?? 0),
  total: Number(session.total ?? 0),
  notes: session.notes || "",
  recordedBy: session.recorded_by ?? session.recordedBy,
  isDeleted: Boolean(session.is_deleted ?? session.isDeleted),
  deletedAt: session.deleted_at ?? session.deletedAt,
  createdAt: session.created_at ?? session.createdAt,
});

class ProgressService {
  loadLocalSessions() {
    return loadEncryptedLocal(PROGRESS_STORAGE_KEY, []).map(normalizeSession);
  }

  saveLocalSessions(sessions) {
    saveEncryptedLocal(PROGRESS_STORAGE_KEY, sessions);
  }

  async getByIEP(iepId, options = {}) {
    if (window.electronAPI?.progress?.getByIEP) {
      const sessions = await window.electronAPI.progress.getByIEP(iepId, options);
      return sessions.map(normalizeSession);
    }

    return this.loadLocalSessions()
      .filter(
        (session) =>
          session.iepId === iepId && (options.includeDeleted || !session.isDeleted),
      )
      .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  }

  async getAll(iepIds = [], options = {}) {
    if (window.electronAPI?.progress?.getAll) {
      const sessions = await window.electronAPI.progress.getAll();
      return sessions.map(normalizeSession);
    }

    if (window.electronAPI?.progress?.getByIEP && iepIds.length) {
      const groups = await Promise.all(
        iepIds.map((iepId) => this.getByIEP(iepId, options)),
      );
      return groups.flat();
    }

    return this.loadLocalSessions()
      .filter((session) => options.includeDeleted || !session.isDeleted)
      .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
  }

  async logSession(data) {
    if (window.electronAPI?.progress?.logSession) {
      const session = normalizeSession(
        await window.electronAPI.progress.logSession(data),
      );
      auditService.log({
        type: "progress",
        title: "Progress session logged",
        description: `${session.score}/${session.total} on ${session.sessionDate}`,
        entity: "iep",
        entityId: session.iepId,
        href: "/progress",
      });
      return session;
    }

    const sessions = this.loadLocalSessions();
    const session = normalizeSession({
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    });
    sessions.push(session);
    this.saveLocalSessions(sessions);
    auditService.log({
      type: "progress",
      title: "Progress session logged",
      description: `${session.score}/${session.total} on ${session.sessionDate}`,
      entity: "iep",
      entityId: session.iepId,
      href: "/progress",
    });
    return session;
  }

  async delete(id) {
    if (window.electronAPI?.progress?.delete) {
      return window.electronAPI.progress.delete(id);
    }

    // Soft delete fallback: keep progress evidence but remove it from normal views.
    this.saveLocalSessions(
      this.loadLocalSessions().map((session) =>
        session.id === id
          ? {
              ...session,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            }
          : session,
      ),
    );
    return true;
  }
}

export default new ProgressService();
