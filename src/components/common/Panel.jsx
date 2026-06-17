import { Link } from "react-router-dom";

const Panel = ({
  title,
  action,
  actionLabel = "View",
  children,
  className = "",
}) => (
  <section
    className={`rounded-md border border-base-300 bg-base-100 p-5 ${className}`}
  >
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h2 className="text-base font-semibold">{title}</h2>}
        {action && (
          <Link to={action} className="text-sm font-medium text-default">
            {actionLabel}
          </Link>
        )}
      </div>
    )}
    {children}
  </section>
);

export default Panel;
