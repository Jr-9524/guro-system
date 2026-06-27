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

  // AI drafting runs in Electron so provider credentials never enter React.
  ai: {
    generatePlaafp: (payload) =>
      ipcRenderer.invoke("ai:generatePlaafp", payload),
    suggestGoals: (payload) => ipcRenderer.invoke("ai:suggestGoals", payload),
    summarizeProgress: (payload) =>
      ipcRenderer.invoke("ai:summarizeProgress", payload),
  },

  aiSettings: {
    get: () => ipcRenderer.invoke("ai-settings:get"),
    save: (settings) => ipcRenderer.invoke("ai-settings:save", settings),
    remove: () => ipcRenderer.invoke("ai-settings:remove"),
    test: (settings) => ipcRenderer.invoke("ai-settings:test", settings),
    isConfigured: () => ipcRenderer.invoke("ai-settings:is-configured"),
  },

  // Full SQLite database backup and restore
  backup: {
    createBackup: () => ipcRenderer.invoke("backup:create"),
    restoreBackup: () => ipcRenderer.invoke("backup:restore"),
    openBackupFolder: () => ipcRenderer.invoke("backup:openFolder"),
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
    getUserCount: () => ipcRenderer.invoke("auth:getUserCount"),
    createFirstAdmin: (data) => ipcRenderer.invoke("auth:createFirstAdmin", data),
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
    resume: (session) => ipcRenderer.invoke("auth:resume", session),
    logout: () => ipcRenderer.invoke("auth:logout"),
  },

  users: {
    list: () => ipcRenderer.invoke("users:list"),
    create: (data) => ipcRenderer.invoke("users:create", data),
    updateRole: (userId, role) => ipcRenderer.invoke("users:updateRole", { userId, role }),
    setActive: (userId, isActive) => ipcRenderer.invoke("users:setActive", { userId, isActive }),
    resetPassword: (userId, password) => ipcRenderer.invoke("users:resetPassword", { userId, password }),
  },
});
