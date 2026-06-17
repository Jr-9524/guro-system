import auditService from "./auditService";
import { normalizeIep } from "../utils/iepUtils";
import {
  loadEncryptedLocal,
  saveEncryptedLocal,
} from "../security/localEncryptedStorage";

const IEPS_STORAGE_KEY = "ieps";

class IepService {
  loadLocalIeps() {
    return loadEncryptedLocal(IEPS_STORAGE_KEY, []).map(normalizeIep);
  }

  saveLocalIeps(ieps) {
    saveEncryptedLocal(IEPS_STORAGE_KEY, ieps);
  }

  async getAll(filters = {}) {
    if (window.electronAPI?.iep?.getAll) {
      const ieps = await window.electronAPI.iep.getAll(filters);
      return ieps.map(normalizeIep);
    }

    return this.loadLocalIeps()
      .filter((iep) => {
        if (!filters.includeDeleted && iep.status === "deleted") {
          return false;
        }
        if (filters.studentId && iep.studentId !== filters.studentId) {
          return false;
        }
        if (filters.status && iep.status !== filters.status) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.lastModified || b.createdAt || 0) -
          new Date(a.lastModified || a.createdAt || 0),
      );
  }

  async getById(id) {
    if (window.electronAPI?.iep?.getById) {
      return normalizeIep(await window.electronAPI.iep.getById(id));
    }

    return (
      this.loadLocalIeps().find(
        (iep) => iep.id === id && iep.status !== "deleted",
      ) || null
    );
  }

  async save(data) {
    const isUpdate = Boolean(data.id);
    if (window.electronAPI?.iep?.save) {
      const saved = normalizeIep(await window.electronAPI.iep.save(data));
      auditService.log({
        type: "iep",
        title: isUpdate ? "IEP saved" : "IEP created",
        description: saved.title,
        entity: "iep",
        entityId: saved.id,
        href: `/iep/${saved.id}/edit`,
      });
      return saved;
    }

    const ieps = this.loadLocalIeps();
    const now = new Date().toISOString();
    const iep = normalizeIep({
      ...data,
      id: data.id || Date.now().toString(),
      lastModified: now,
      createdAt: data.createdAt || now,
    });
    const index = ieps.findIndex((item) => item.id === iep.id);

    if (index >= 0) {
      ieps[index] = iep;
    } else {
      ieps.push(iep);
    }

    this.saveLocalIeps(ieps);
    auditService.log({
      type: "iep",
      title: isUpdate ? "IEP saved" : "IEP created",
      description: iep.title,
      entity: "iep",
      entityId: iep.id,
      href: `/iep/${iep.id}/edit`,
    });
    return iep;
  }

  getRestoredStatus(iep) {
    return iep.completedSections.length >= 6 ? "complete" : "draft";
  }

  async archive(id) {
    const iep = await this.getById(id);
    if (!iep) return null;

    const archived = await this.save({
      ...iep,
      status: "archived",
    });
    auditService.log({
      type: "iep",
      title: "IEP archived",
      description: archived.title,
      entity: "iep",
      entityId: archived.id,
      href: `/iep/${archived.id}/edit`,
    });
    return archived;
  }

  async restore(id) {
    const iep = await this.getById(id);
    if (!iep) return null;

    const restored = await this.save({
      ...iep,
      status: this.getRestoredStatus(iep),
    });
    auditService.log({
      type: "iep",
      title: "IEP restored",
      description: restored.title,
      entity: "iep",
      entityId: restored.id,
      href: `/iep/${restored.id}/edit`,
    });
    return restored;
  }

  async delete(id) {
    if (window.electronAPI?.iep?.delete) {
      return window.electronAPI.iep.delete(id);
    }

    // Soft delete fallback: retain the IEP locally but hide it from normal lists.
    this.saveLocalIeps(
      this.loadLocalIeps().map((iep) =>
        iep.id === id
          ? {
              ...iep,
              status: "deleted",
              deletedAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            }
          : iep,
      ),
    );
    return true;
  }
}

export default new IepService();
