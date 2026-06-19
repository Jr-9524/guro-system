const themeColor = {
  base100: "var(--color-base-100)",
  base200: "var(--color-base-200)",
  base300: "var(--color-base-300)",
  baseContent: "var(--color-base-content)",
  primary: "var(--color-primary)",
  primaryContent: "var(--color-primary-content)",
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    fontSize: "1.0rem",
    backgroundColor: themeColor.base100,
    borderColor: state.isFocused ? themeColor.primary : themeColor.base300,
    boxShadow: state.isFocused
      ? `0 0 0 3px color-mix(in srgb, ${themeColor.primary} 12%, transparent)`
      : "none",
    cursor: "pointer",

    "&:hover": {
      borderColor: themeColor.primary,
    },
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: themeColor.base100,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: themeColor.base100,
    cursor: "pointer",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "1.0rem",
    backgroundColor: state.isSelected
      ? themeColor.primary
      : state.isFocused
        ? themeColor.base200
        : themeColor.base100,
    color: state.isSelected ? themeColor.primaryContent : themeColor.baseContent,
    lineHeight: "0.5",
    whiteSpace: "normal",
    wordBreak: "break-word",
    cursor: "pointer",
  }),
};

export default selectStyles;
