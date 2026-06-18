// src/stores/themeStore.js
import { create } from "zustand";

const themes = ["guro-blue", "dark"];
const defaultTheme = "guro-blue";

const getSavedTheme = () => {
  const savedTheme = localStorage.getItem("app-theme");
  return themes.includes(savedTheme) ? savedTheme : defaultTheme;
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme",