import {
  loadEncryptedLocal,
  saveEncryptedLocal,
} from "../security/localEncryptedStorage";

class WorkspaceStoreService {
  async get(key, fallback = null) {
    if (window.electronAPI?.workspace?.get) {
      const value = await window.electronAPI.workspace.get(key);
      if (value !== null && value !== undefined) return value;

      // One-time lazy migration: keep old localStorage values usable in SQLite.
      const localValue = loadEncryptedLocal(key, undefined);
      if (localValue !== undefined) {
        await this.set(key, localValue);
        return localValue;
      }

      return fallback;
    }

    return loadEncryptedLocal(key, fallback);
  }

  async set(key, value) {
    if (window.electronAPI?.workspace?.set) {
      await window.electronAPI.workspace.set(key, value);
    }

    saveEncryptedLocal(key, value);
    return value;
  }

  async remove(key) {
    if (window.electronAPI?.workspace?.remove) {
      await window.electronAPI.workspace.remove(key);
    }

    localStorage.removeItem(key);
  }
}

export default new WorkspaceStoreService();
