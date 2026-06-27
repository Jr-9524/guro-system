import { guroBase, guroButtonSizes, guroButtonVariants } from "../../styles/guroStyles";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  const baseClass = `${guroBase.button} ${guroBase.disabled}`;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClass}
        ${guroButtonSizes[size] || guroButtonSizes.md}
        ${guroButtonVariants[variant] || guroButtonVariants.primary}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon className="h-5 w-5" />
      )}

      {children}
    </button>
  );
};

export default Button;
