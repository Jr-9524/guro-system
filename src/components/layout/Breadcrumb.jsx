// src/components/layout/NotionBreadcrumb.jsx
import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";

const NotionBreadcrumb = () => {
  const location = useLocation();
  const paths = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = paths.map((path) => {
    const url = `/${paths.slice(0, paths.indexOf(path) + 1).join("/")}`;
    const label =
      path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

    return { url, label, isLast: paths.indexOf(path) === paths.length - 1 };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      {/* Home */}
      <Link
        to="/dashboard"
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        Home
      </Link>

      {breadcrumbs.map((crumb) => (
        <Fragment key={crumb.url}>
          <span className="opacity-30">/</span>
          {crumb.isLast ? (
            <span className="font-medium">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.url}
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
};

export default NotionBreadcrumb;
