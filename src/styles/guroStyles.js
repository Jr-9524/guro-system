// Shared Tailwind recipes. GURO-specific hex values stay centralized here.

export const guroBase = {
  button:
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-4",
  row: "cursor-pointer border-b transition-colors duration-200",
  disabled: "disabled:cursor-not-allowed disabled:opacity-60",
};

export const guroPage = {
  shell: "flex h-screen overflow-hidden bg-base-200 text-base-content",
  content: "flex-1 overflow-y-auto bg-base-200",
  container:
    "mx-auto min-h-full w-full max-w-[1600px] px-5 py-6 lg:px-8 lg:py-8",
  header: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
  title: "text-2xl font-bold tracking-tight text-base-content",
  description: "mt-1 max-w-2xl text-sm leading-5 text-base-content/60",
};

export const guroButtonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const guroButtonVariants = {
  primary:
    "bg-primary text-primary-content hover:brightness-90 focus:ring-primary/20",
  secondary:
    "border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus:ring-primary/15",
  accent:
    "bg-accent text-accent-content hover:brightness-90 focus:ring-accent/25",
  soft:
    "border border-base-300 bg-base-200 text-base-content hover:bg-base-300 focus:ring-primary/15",
  ghost:
    "border border-base-300 bg-transparent text-base-content shadow-none hover:bg-base-200 focus:ring-primary/10",
  danger: "bg-error text-error-content hover:brightness-90 focus:ring-error/20",
};

export const guroCard = {
  base: "rounded-xl bg-base-100",
  bordered: "rounded-xl border border-base-300 bg-base-100",
  hover: "transition-colors hover:bg-base-200/50",
  padding: "p-5",
};

export const guroPanel = {
  header: "mb-3 flex items-center justify-between gap-3",
  title: "text-base font-bold text-base-content",
};

export const guroSectionHeading = {
  title: "text-lg font-bold text-base-content",
  description: "mt-1 text-sm leading-5 text-base-content/60",
};

export const guroText = {
  main: "text-base-content",
  soft: "text-base-content/80",
  muted: "text-base-content/60",
  primary: "text-primary",
  dark: "text-base-content",
  link: "text-sm font-semibold text-primary transition-opacity hover:opacity-75 hover:underline",
};

export const guroInput =
  "w-full rounded-sm border border-base-300 bg-base-100 px-3 py-2.5 text-sm text-base-content outline-none transition-all duration-200 placeholder:text-base-content/40 focus:border-primary focus:ring-0";

export const guroLabel =
  "mb-1.5 block text-sm font-semibold text-base-content/80";

export const guroBadge = {
  base: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
  variants: {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-base-200 text-base-content/75",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-error/10 text-error",
  },
};

export const guroTable = {
  wrapper: "overflow-hidden rounded-xl border border-base-300 bg-base-100",
  table: "w-full border-collapse",
  row: "cursor-pointer border-b border-base-300 transition-colors duration-200 last:border-b-0 hover:bg-base-200",
  cell: "px-4 py-3",
  title: "font-semibold text-base-content",
  subtitle: "mt-1 text-xs text-base-content/60",
  badge:
    "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary",
};

export const guroEmptyState = {
  root: "flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 p-6 text-center",
  icon: "flex h-12 w-12 items-center justify-center text-primary",
  title: "mt-4 font-semibold text-base-content",
  message: "mt-1 max-w-sm text-sm leading-5 text-base-content/60",
};

export const guroSidebar = {
  shell:
    "flex h-full flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-content)]",
  divider: "border-[var(--color-sidebar-border)]",
  brandCaption:
    "text-[10px] font-semibold tracking-wider text-[var(--color-sidebar-muted)]",
  create:
    "mb-4 w-full justify-start gap-2 rounded-xl border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-hover)] px-3 text-[var(--color-sidebar-content)] shadow-none hover:brightness-95",
  link: "flex select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
  linkIdle:
    "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-content)]",
  linkActive:
    "bg-[var(--color-sidebar-active)] font-bold text-[var(--color-sidebar-active-content)] shadow-sm",
  activeDot:
    "ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--color-sidebar-accent)]",
  avatar:
    "flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-sidebar-hover)] text-sm font-bold text-[var(--color-sidebar-content)]",
  iconButton:
    "text-[var(--color-sidebar-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-content)]",
  meta: "text-[var(--color-sidebar-muted)]",
};

export const guroStat = {
  card: "rounded-xl border border-base-300 bg-base-100 p-4",
  title: "text-sm font-semibold text-base-content/60",
  value: "mt-1 text-2xl font-bold tracking-tight text-base-content",
  note: "mt-1 text-xs",
  iconBox: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
  variants: {
    blue: {
      iconBox: "",
      icon: "text-primary",
      note: "text-base-content/70",
    },
    success: {
      iconBox: "",
      icon: "text-success",
      note: "text-success",
    },
    warning: {
      iconBox: "",
      icon: "text-warning",
      note: "text-warning",
    },
    danger: {
      iconBox: "",
      icon: "text-error",
      note: "text-error",
    },
    slate: {
      iconBox: "",
      icon: "text-base-content/80",
      note: "text-base-content/60",
    },
    teal: {
      iconBox: "",
      icon: "text-primary",
      note: "text-base-content/70",
    },
  },
};
