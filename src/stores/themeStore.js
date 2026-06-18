// src/stores/themeStore.js
import { create } from "zustand";

const themes = ["guro-blue", "dark"];
const defaultTheme = "guro-blue";

const getSavedTheme = () => {
  const savedTheme = localStorage.getItem("app-theme");
  return themes.includes(savedTheme) ? savedTheme : defaultTheme;
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (document.body) {
    document.body.setAttribute("data-theme", theme);
  }
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
    set