import HashingService from "../security/hashing";
import { getUserRole, USER_ROLES } from "../utils/permissions";

const USERS_STORAGE_KEY = "users";

const normalizeUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name ?? user.fullName ?? "",
  email: user.email || "",
  role: getUserRole(user),
  isActive: Boolean(user.is_active ?? user.isActive ?? true),
  lastLogin: user.last_login ?? user.lastLogin ?? null,
  createdAt: user.created_at ?? user.createdAt ?? null,
});

const getStoredUsers = () =>
  JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");

const saveStoredUsers = (users) =>
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

const requireLocalAdmin = () => {
  const currentUser = JSON.parse(
    localStorage.getItem("current_user") || "null",
  );
  if (getUserRole(currentUser) !== USER_ROLES.ADMIN) {
    throw new Error("Admin permission is required.");
  }
  return currentUser;
};

const unwrap = (result, fallbackMessage) => {
  if (!result?.success) {
    throw new Error(result?.error || result?.message || fallbackMessage);
  }
  return result;
};

const validatePassword = (password) => {
  if (String(password || "").length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
};

const validateAccount = (data) => {
  if (!String(data.fullName || "").trim()) throw new Error("Full name is required.");
  if (String(data.username || "").trim().length < 3) throw new Error("Username must be at least 3 characters.");
  validatePassword(data.password);
};

const isActiveAdmin = (user) =>
  getUserRole(user) === USER_ROLES.ADMIN && user.isActive !== false;

const userService = {
  async getUserCount() {
    if (window.electronAPI?.auth?.getUserCount) {
      return Number(
        unwrap(
          await window.electronAPI.auth.getUserCount(),
          "Could not check account setup.",
        ).count || 0,
      );
    }
    return getStoredUsers().length;
  },

  async createFirstAdmin(data) {
    validateAccount(data);
    if (window.electronAPI?.auth?.createFirstAdmin) {
      return normalizeUser(
        unwrap(
          await window.electronAPI.auth.createFirstAdmin(data),
          "Could not create the first administrator.",
        ).user,
      );
    }

    const users = getStoredUsers();
    if (users.length) {
      throw new Error("First administrator setup is no longer available.");
    }
    const user = {
      id: HashingService.generateToken(8),
      username: data.username.trim(),
      passwordHash: await HashingService.hashPassword(data.password),
      fullName: data.fullName.trim(),
      email: data.email?.trim() || "",
      role: USER_ROLES.ADMIN,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    saveStoredUsers([user]);
    return normalizeUser(user);
  },

  async list() {
    if (window.electronAPI?.users?.list) {
      return unwrap(
        await window.electronAPI.users.list(),
        "Could not load users.",
      ).users.map(normalizeUser);
    }
    requireLocalAdmin();
    return getStoredUsers().map(normalizeUser);
  },

  async create(data) {
    validateAccount(data);
    if (window.electronAPI?.users?.create) {
      return normalizeUser(
        unwrap(
          await window.electronAPI.users.create(data),
          "Could not create user.",
        ).user,
      );
    }

    requireLocalAdmin();
    const users = getStoredUsers();
    if (
      users.some(
        (user) =>
          user.username.toLowerCase() === data.username.trim().toLowerCase(),
      )
    ) {
      throw new Error("Username already exists.");
    }
    const user = {
      id: HashingService.generateToken(8),
      username: data.username.trim(),
      passwordHash: await HashingService.hashPassword(data.password),
      fullName: data.fullName.trim(),
      email: data.email?.trim() || "",
      role: getUserRole({ role: data.role }),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveStoredUsers(users);
    return normalizeUser(user);
  },

  async updateRole(userId, role) {
    if (window.electronAPI?.users?.updateRole) {
      return normalizeUser(
        unwrap(
          await window.electronAPI.users.updateRole(userId, role),
          "Could not update role.",
        ).user,
      );
    }
    const currentUser = requireLocalAdmin();
    if (String(currentUser.id) === String(userId)) {
      throw new Error("You cannot change your own role.");
    }
    const users = getStoredUsers();
    const user = users.find((item) => String(item.id) === String(userId));
    if (!user) throw new Error("User not found.");
    const nextRole = getUserRole({ role });
    if (
      isActiveAdmin(user) &&
      nextRole !== USER_ROLES.ADMIN &&
      users.filter(isActiveAdmin).length <= 1
    ) {
      throw new Error("At least one active Admin is required.");
    }
    user.role = nextRole;
    saveStoredUsers(users);
    return normalizeUser(user);
  },

  async setActive(userId, isActive) {
    if (window.electronAPI?.users?.setActive) {
      return normalizeUser(
        unwrap(
          await window.electronAPI.users.setActive(userId, isActive),
          "Could not update account status.",
        ).user,
      );
    }
    const currentUser = requireLocalAdmin();
    if (String(currentUser.id) === String(userId) && !isActive) {
      throw new Error("You cannot deactivate your own account.");
    }
    const users = getStoredUsers();
    const user = users.find((item) => String(item.id) === String(userId));
    if (!user) throw new Error("User not found.");
    if (
      isActiveAdmin(user) &&
      !isActive &&
      users.filter(isActiveAdmin).length <= 1
    ) {
      throw new Error("At least one active Admin is required.");
    }
    user.isActive = Boolean(isActive);
    saveStoredUsers(users);
    return normalizeUser(user);
  },

  async resetPassword(userId, password) {
    validatePassword(password);
    if (window.electronAPI?.users?.resetPassword) {
      unwrap(
        await window.electronAPI.users.resetPassword(userId, password),
        "Could not reset password.",
      );
      return true;
    }
    requireLocalAdmin();
    const users = getStoredUsers();
    const user = users.find((item) => String(item.id) === String(userId));
    if (!user) throw new Error("User not found.");
    user.passwordHash = await HashingService.hashPassword(password);
    saveStoredUsers(users);
    return true;
  },
};

export default userService;
