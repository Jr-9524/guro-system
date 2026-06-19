import { Link } from "react-router-dom";
import { guroButtonSizes, guroButtonVariants } from "../../styles/guroStyles";

const ButtonLink = ({
  to,
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) => {
  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition-all duration-200";

  const variants = {
    ...guroButtonVariants,
    list: "w-full justify-between border border-transparent bg-base-100 text-base-content hover:border-primary/20 hover:bg-primary/10",
  };

  return (
    <Link
      to={to}
      className={`
        ${baseClass}
        ${guroButtonSizes[size] || guroButtonSizes.md}
        ${variants[variant] || variants.primary}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </Link>
  );
};

export default ButtonLink;
