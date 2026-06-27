const positions = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

const Tooltip = ({ children, label, position = "bottom", disabled = false }) => (
  <span className="group relative inline-flex">
    {children}
    {!disabled && (
      <span
        className={
          "pointer-events-none absolute z-50 w-max max-w-64 rounded-md border border-base-300 bg-base-content px-2 py-1 text-xs font-medium leading-4 text-base-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 " +
          (positions[position] || positions.bottom)
        }
        role="tooltip"
      >
        {label}
      </span>
    )}
  </span>
);

export default Tooltip;
