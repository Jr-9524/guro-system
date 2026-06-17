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
    borderColor: state.isFocused ? "#000000" : undefined,
    boxShadow: state.isFocused ? "0 0 0 1px #000" : undefined,
    cursor: "pointer",

    "&:hover": {
      borderColor: "#9ca3af",
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
      ? "#2a64d7"
      : state.isFocused
        ? "#e8f0fe"
        : themeColor.base100,
    color: state.isSelected ? "#ffffff" : themeColor.baseContent,
    lineHeight: "0.5",
    whiteSpace: "normal",
    wordBreak: "break-word",
    cursor: "pointer",
  }),
};

export default selectStyles;
