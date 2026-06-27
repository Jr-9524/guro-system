export const PERMISSIONS = Object.freeze({
  STUDENTS_READ: "students:read",
  STUDENTS_WRITE: "students:write",
  IEP_READ: "iep:read",
  IEP_WRITE: "iep:write",
  PROGRESS_READ: "progress:read",
  PROGRESS_WRITE: "progress:write",
  REPORTS_READ: "reports:read",
  REPORTS_EXPORT: "reports:export",
  GOALBANK_READ: "goalbank:read",
  GOALBANK_WRITE: "goalbank:write",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  AI_SETTINGS_MANAGE: "settings:ai:manage",
  BACKUP_CREATE: "backup:create",
  BACKUP_RESTORE: "backup:restore",
  AUDIT_READ: "audit:read",
  USERS_MANAGE: "users:manage",
});

export const USER_ROLES = Object.freeze({
  TEACHER: "teacher",
  COORDINATOR: "sped_coordinator",
  ADMIN: "admin",
});

const teacherPermissions = [
  PERMISSIONS.STUDENTS_READ,
  PERMISSIONS.STUDENTS_WRITE,
  PERMISSIONS.IEP_READ,
  PERMISSIONS.IEP_WRITE,
  PERMISSIONS.PROGRESS_READ,
  PERMISSIONS.PROGRESS_WRITE,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.REPORTS_EXPORT,
  PERMISSIONS.GOALBANK_READ,
  PERMISSIONS.GOALBANK_WRITE,
  PERMISSIONS.SETTINGS_READ,
  PERMISSIONS.SETTINGS_WRITE,
];

const coordinatorPermissions = [
  ...teacherPermissions,
  PERMISSIONS.AUDIT_READ,
];

const rolePermissions = {
  [USER_ROLES.TEACHER]: new Set(teacherPermissions),
  [USER_ROLES.COORDINATOR]: new Set(coordinatorPermissions),
  [USER_ROLES.ADMIN]: new Set(Object.values(PERMISSIONS)),
};

const routePermissions = {
  dashboard: null,
  students: PERMISSIONS.STUDENTS_READ,
  iep: PERMISSIONS.IEP_READ,
  progress: PERMISSIONS.PROGRESS_READ,
  reports: PERMISSIONS.REPORTS_READ,
  reportAdministration: PERMISSIONS.AUDIT_READ,
  goals: PERMISSIONS.GOALBANK_READ,
  settings: PERMISSIONS.SETTINGS_READ,
  activity: PERMISSIONS.AUDIT_READ,
};

export const getUserRole = (user) => {
  const role = String(user?.role || USER_ROLES.TEACHER)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (role === "admin") return USER_ROLES.ADMIN;
  if (role === "coordinator" || role === "sped_coordinator") {
    return USER_ROLES.COORDINATOR;
  }
  return USER_ROLES.TEACHER;
};

export const getRoleLabel = (user) => {
  const role = getUserRole(user);
  if (role === USER_ROLES.ADMIN) return "Admin";
  if (role === USER_ROLES.COORDINATOR) return "SPED Coordinator";
  return "Teacher";
};

export const hasPermission = (user, permission) =>
  !permission || rolePermissions[getUserRole(user)].has(permission);

export const canAccessRoute = (user, routeKey) =>
  hasPermission(user, routePermissions[routeKey]);

export const isAdmin = (user) => getUserRole(user) === USER_ROLES.ADMIN;
export const isCoordinator = (user) =>
  getUserRole(user) === USER_ROLES.COORDINATOR;
export const canAccessPath = (user, pathname = "") => {
  const path = String(pathname).split("?")[0];
  if (
    path === "/activity" ||
    path === "/reports/compliance" ||
    path === "/reports/analytics"
  ) {
    return hasPermission(user, PERMISSIONS.AUDIT_READ);
  }
  if (path.startsWith("/students")) return hasPermission(user, PERMISSIONS.STUDENTS_READ);
  if (path.startsWith("/iep") || path === "/goals") return hasPermission(user, PERMISSIONS.IEP_READ);
  if (path.startsWith("/progress")) return hasPermission(user, PERMISSIONS.PROGRESS_READ);
  if (path.startsWith("/reports")) return hasPermission(user, PERMISSIONS.REPORTS_READ);
  if (path === "/settings/users") {
    return hasPermission(user, PERMISSIONS.USERS_MANAGE);
  }
  if (path === "/settings/ai") {
    return hasPermission(user, PERMISSIONS.AI_SETTINGS_MANAGE);
  }
  if (path.startsWith("/settings")) return hasPermission(user, PERMISSIONS.SETTINGS_READ);
  return true;
};