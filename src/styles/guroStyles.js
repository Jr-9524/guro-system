// Shared semantic class recipes. Keep palette values in themes.js.

export const guroBase = {
  button:
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition-all duration-200 focus:outline-none",

  row: "cursor-pointer border-b transition-colors duration-200",

  disabled: "disabled:cursor-not-allowed disabled:opacity-60",
};

export const guroButtonSizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const guroButtonVariants = {
  primary: "bg-primary text-primary-content hover:brightness-90 focus:ring-primary/20",
  secondary: "border border-base-300 bg-base-100 text-base-content hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus:ring-primary/20",
  soft: "border border-primary/15 bg-primary/10 text-primary hover:bg-primary/15 focus:ring-primary/20",
  ghost: "bg-transparent text-base-content shadow-none hover:bg-base-200",
  danger: "bg-error text-error-content hover:brightness-90 focus:ring-error/20",
};

export const guroTable = {
  wrapper: "overflow-hidden rounded-2xl border border-base-300 bg-base-100",

  table: "w-full border-collapse",

  row: "cursor-pointer border-b border-base-300 transition-colors duration-200 last:border-b-0 hover:bg-base-200",

  cell: "px-4 py-3",

  title: "font-semibold text-base-content",

  subtitle: "mt-1 text-xs text-base-content/60",

  badge:
    "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary",
};

export const guroCard = {
  base: "rounded-2xl border border-base-300 bg-base-100 shadow-sm transition-all duration-200",

  hover: "hover:border-primary/25 hover:shadow-md",

  padding: "p-5",
};

export const guroPanel = {
  header: "mb-4 flex items-center justify-between gap-3",

  title: "text-base font-bold text-base-content",
};

export const guroText = {
  main: "text-base-content",

  soft: "text-base-content/80",

  muted: "text-base-content/60",

  primary: "text-primary",

  dark: "text-primary",

  link: "text-sm font-semibold text-primary transition-opacity hover:opacity-75 hover:underline",
};

export const guroInput =
  "w-full rounded-xl border border-base-300 bg-base-100 px-3 py-2.5 text-sm text-base-content outline-none transition-all duration-200 placeholder:text-base-content/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10";

export const guroLabel = "mb-1.5 block text-sm font-semibold text-base-content/80";

export const guroStat = {
  card: "rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md",

  title: "text-sm font-semibold text-base-content/60",

  value: "mt-2 text-3xl font-black tracking-tight text-base-content",

  note: "mt-2 text-sm font-semibold",

  iconBox: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",

  variants: {
    blue: {
      iconBox: "bg-primary/10",
      icon: "text-primary",
      note: "text-primary",
    },

    success: {
      iconBox: "bg-success/10",
      icon: "text-success",
      note: "text-success",
    },

    warning: {
      iconBox: "bg-warning/10",
      icon: "text-warning",
      note: "text-warning",
    },

    danger: {
      iconBox: "bg-error/10",
      icon: "text-error",
      note: "text-error",
    },

    slate: {
      iconBox: "bg-base-200",
      icon: "text-base-content/80",
      note: "text-base-content/60",
    },

    teal: {
      iconBox: "bg-secondary/10",
      icon: "text-secondary",
      note: "text-secondary",
    },
  },
};
