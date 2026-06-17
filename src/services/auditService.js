const AUDIT_STORAGE_KEY = "workspace-activity";
const MAX_ACTIVITY_ITEMS = 500;

import {
  loadEncryptedLocal,
  saveEncryptedLocal,
} from "../security/localEncryptedStorage";

class AuditService {
  async getAll() {
    if (window.electronAPI?.audit?.getAll) {
      return window.electronAPI.audit.getAll();
    }

    return loadEncryptedLocal(AUDIT_STORAGE_KEY, []);
  }

  async log({
    type,
    title,
    description = "",
    entity = "",
    entityId = "",
    href = "",
  }) {
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      description,
      entity,
      entityId,
      href,
      createdAt: new Date().toISOString(),
    };

    if (window.electronAPI?.audit?.log) {
      return window.electronAPI.audit.log(item);
    }

    const nextItems = [item, ...(await this.getAll())].slice(
      0,
      MAX_ACTIVITY_ITEMS,
    );
    saveEncryptedLocal(AUDIT_STORAGE_KEY, nextItems);
    return item;
  }

  async clear() {
    if (window.electronAPI?.audit?.clear) {
      return window.electronAPI.audit.clear();
    }

    saveEncryptedLocal(AUDIT_STORAGE_KEY, []);
    return true;
  }

  async replace(items = []) {
    if (window.electronAPI?.audit?.replace) {
      await window.electronAPI.audit.replace(items);
    }

    saveEncryptedLocal(AUDIT_STORAGE_KEY, items);
    return true;
  }

  async export() {
    const items = await this.getAll();
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guro-activity-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export default new AuditService();
