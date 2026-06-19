// src/stores/themeStore.js
import { create } from "zustand";
import {
  defaultTheme,
  themeDefinitions,
  themeOptions,
} from "../styles/themes";

const themes = themeOptions.map(({ id }) => id);

const getSavedTheme = () => {
  const savedTheme = localStorage.getItem("app-theme");
  return themes.includes(savedTheme) ? savedTheme : defaultTheme;
};

const applyTheme = (theme) => {
  const option = themeOptions.find(({ id }) => id === theme);
  const colors = themeDefinitions[theme];

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = option?.mode || "light";

  Object.entries(colors).forEach(([token, value]) => {
    document.documentElement.style.setProperty(`--color-${token}`, value);
  });

  if (document.body) {
    document.body.setAttribute("data-theme", theme);
  }
};

const useThemeStore = create((set, get) => ({
  currentTheme: getSavedTheme(),

  themeCategories: {
    Appearance: themeOptions,
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

export default useThemeStore;
