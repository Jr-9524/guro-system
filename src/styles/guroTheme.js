// src/styles/guroTheme.js
export const guroColors = {
  black: "#000000",
  white: "#FFFFFF",

  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate500: "#64748B",
  slate700: "#334155",
  slate900: "#0F172A",

  blue50: "#EFF6FF",
  blue100: "#DBEAFE",
  blue300: "#93C5FD",
  blue600: "#2563EB",
  blue700: "#1D4ED8",
  blue800: "#1E3A8A",

  green100: "#DCFCE7",
  green600: "#16A34A",

  amber100: "#FEF3C7",
  amber600: "#D97706",

  red100: "#FEE2E2",
  red600: "#DC2626",
};

export const guroTheme = {
  primary: guroColors.blue600,
  primaryHover: guroColors.blue700,
  primaryDark: guroColors.blue800,

  secondary: "#0f766e",
  accent: guroColors.amber600,

  background: guroColors.slate50,
  surface: guroColors.white,
  surfaceAlt: guroColors.slate100,
  selected: guroColors.blue50,

  border: guroColors.slate200,
  borderStrong: guroColors.slate300,
  focus: guroColors.blue300,

  text: guroColors.slate900,
  textSoft: guroColors.slate700,
  textMuted: guroColors.slate500,
  textInverse: guroColors.white,

  success: guroColors.green600,
  successBg: guroColors.green100,

  warning: guroColors.amber600,
  warningBg: guroColors.amber100,

  danger: guroColors.red600,
  dangerBg: guroColors.red100,

  infoBg: guroColors.blue100,
};

export const guroClass = {
  textDark: "text-[#172554]",
  textMain: "text-[#1e293b]",
  textMuted: "text-[#64748b]",

  bgSoft: "bg-[#eff6ff]",
  bgSurface: "bg-white",
  bgPrimary: "bg-[#1e40af]",

  borderSoft: "border-[#dbeafe]",

  hoverSoft: "hover:bg-[#eff6ff]",
  hoverBorderSoft: "hover:border-[#dbeafe]",
};
