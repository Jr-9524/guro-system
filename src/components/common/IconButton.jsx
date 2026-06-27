import { Link } from "react-router-dom";
import Tooltip from "./Tooltip";

const IconButton = ({
  icon: Icon,
  label,
  to,
  className = "",
  tooltipPosition = "bottom",
  type = "button",
  ...props
}) => {
  const controlClass =
    "btn btn-ghost btn-sm px-3 rounded-md border border-base-300 text-base-content/70 hover:bg-base-100 hover:text-base-content " +
    className;
  const content = (
    <>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  );

  return (
    <Tooltip label={label} position={tooltipPosition}>
      {to ? (
        <Link to={to} className={controlClass} aria-label={label} {...props}>
          {content}
        </Link>
      ) : (
        <button
          type={type}
          className={controlClass}
          aria-label={label}
          {...props}
        >
          {content}
        </button>
      )}
    </Tooltip>
  );
};

export default IconButton;
