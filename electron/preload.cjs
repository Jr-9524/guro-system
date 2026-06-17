// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Students
  students: {
    getAll: () => ipcRenderer.invoke("students:getAll"),
    getById: (id) => ipcRenderer.invoke("students:getById", id),
    create: (data) => ipcRenderer.invoke("students:create", data),
    update: (id, data) => ipcRenderer.invoke("students:update", { id, data }),
    delete: (id) => ipcRenderer.invoke("students:delete", id),
    search: (query) => ipcRenderer.invoke("students:search", query),
  },

  // IEPs
  iep: {
    getAll: (filters) => ipcRenderer.invoke("iep:getAll", filters),
    getById: (id) => ipcRenderer.invoke("iep:getById", id),
    save: (data) => ipcRenderer.invoke("iep:save", data),
    delete: (id) => ipcRenderer.invoke("iep:delete", id),
  },

  // Progress
  progress: {
    getByIEP: (iepId, options) =>
      ipcRenderer.invoke("progress:getByIEP", iepId, options),
    logSession: (data) => ipcRenderer.invoke("progress:logSession", data),
    delete: (id) => ipcRenderer.invoke("progress:delete", id),
  },

  // Workspace key/value state
  workspace: {
    get: (key) => ipcRenderer.invoke("workspace:get", key),
    set: (key, value) => ipcRenderer.invoke("workspace:set", { key, value }),
    remove: (key) => ipcRenderer.invoke("workspace:remove", key),
  },

  // Activity audit log
  audit: {
    getAll: () => ipcRenderer.invoke("audit:getAll"),
    log: (item) => ipcRenderer.invoke("audit:log", item),
    clear: () => ipcRenderer.invoke("audit:clear"),
    replace: (items) => ipcRenderer.invoke("audit:replace", items),
  },

  // Auth
  auth: {
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
    register: (data) => ipcRenderer.invoke("auth:register", data),
  },
});
