// src/stores/authStore.js
import { create } from "zustand";
import HashingService from "../security/hashing";
import { RateLimiter } from "../security/validation";

const rateLimiter = new RateLimiter(5, 15 * 60 * 1000);

const toClientUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.full_name ?? user.fullName,
  role: user.role || "teacher",
});

const persistSession = (user) => {
  const token = HashingService.generateToken();
  const clientUser = toClientUser(user);

  localStorage.setItem("auth_token", token);
  localStorage.setItem("current_user", JSON.stringify(clientUser));

  return { token, user: clientUser };
};

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });

    try {
      // Rate limiting check
      if (rateLimiter.isRateLimited(username)) {
        throw new Error(
          "Too many login attempts. Please try again in 15 minutes.",
        );
      }

      if (window.electronAPI?.auth?.login) {
        const result = await window.electronAPI.auth.login({
          username,
          password,
        });

        if (!result.success) {
          rateLimiter.addAttempt(username);
          throw new Error(result.error || "Invalid username or password");
        }

        const session = persistSession(result.user);
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });

        return true;
      }

      // For development: Check against stored users in localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u) => u.username === username);

      if (!user) {
        rateLimiter.addAttempt(username);
        throw new Error("Invalid username or password");
      }

      const isValid = await HashingService.comparePassword(
        password,
        user.passwordHash,
      );

      if (!isValid) {
        rateLimiter.addAttempt(username);
        throw new Error("Invalid username or password");
      }

      const session = persistSession(user);

      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });

    try {
      if (window.electronAPI?.auth?.register) {
        const result = await window.electronAPI.auth.register(userData);
        if (!result.success) {
          throw new Error(result.error || "Registration failed");
        }

        set({ isLoading: false });
        return true;
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");

      // Check if username exists
      if (users.find((u) => u.username === userData.username)) {
        throw new Error("Username already exists");
      }

      // Hash password
      const passwordHash = await HashingService.hashPassword(userData.password);

      // Create new user
      const newUser = {
        id: HashingService.generateToken(8),
        username: userData.username,
        passwordHash,
        fullName: userData.fullName,
        email: userData.email,
        role: "teacher",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    window.electronAPI?.auth?.logout?.().catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("auth_token");
    const storedUser = JSON.parse(
      localStorage.getItem("current_user") || "null",
    );

    if (!token || !storedUser) {
      set({ isInitialized: true });
      return;
    }

    const clientUser = toClientUser(storedUser);
    if (!window.electronAPI?.auth?.resume) {
      set({
        user: clientUser,
        token,
        isAuthenticated: true,
        isInitialized: true,
      });
      return;
    }

    try {
      const result = await window.electronAPI.auth.resume(clientUser.id);
      if (!result?.success) throw new Error("Session is no longer valid");

      const resumedUser = toClientUser(result.user);
      localStorage.setItem("current_user", JSON.stringify(resumedUser));
      set({
        user: resumedUser,
        token,
        isAuthenticated: true,
        isInitialized: true,
      });
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
