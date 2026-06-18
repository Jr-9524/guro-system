// src/stores/themeStore.js
import { create } from "zustand";

const themes = ["guro-blue", "dark"];
const defaultTheme = "guro-blue";

const getSavedTheme = () => {
  const savedTheme = localStorage.getItem("app-theme");
  return themes.includes(savedTheme) ? savedTheme : defaultTheme;
};

const useThemeStore = create((set, get) => ({
  currentTheme: getSavedTheme(),

  themeCategories: {
    Appearance: themes,
  },

  setTheme: (theme) => {
    const nextTheme = themes.includes(theme) ? theme : defaultTheme;
    applyTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
    set({ currentTheme: nextTheme });
  },

  initTheme: () => {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    localStorage.setItem("app-theme", savedTheme);
    set({ currentTheme: savedTheme });
  },

  getCurrentTheme: () => get().currentTheme,
}));