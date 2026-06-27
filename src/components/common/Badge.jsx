import { guroBadge } from "../../styles/guroStyles";

const Badge = ({
  children,
  variant = "neutral",
  className = "",
  ...props
}) => (
  <span
    className={[
      guroBadge.base,
      guroBadge.variants[variant] || guroBadge.variants.neutral,
      className,
    ].join(" ")}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
