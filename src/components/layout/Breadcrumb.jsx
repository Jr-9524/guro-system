import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation, matchPath } from "react-router-dom";

const routeDefinitions = [
  { pattern: "/dashboard", items: [{ label: "Dashboard" }] },
  {
    pattern: "/students/:id",
    items: [
      { label: "Students", to: "/students" },
      { label: "Student Profile" },
    ],
  },
  { pattern: "/students", items: [{ label: "Students" }] },
  {
    pattern: "/iep/new",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "Create IEP" },
    ],
  },
  {
    pattern: "/iep/:id/view",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "IEP Viewer" },
    ],
  },
  {
    pattern: "/iep/:id/edit",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "Edit IEP" },
    ],
  },
  {
    pattern: "/iep/active",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "Active" },
    ],
  },
  {
    pattern: "/iep/drafts",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "Drafts" },
    ],
  },
  {
    pattern: "/iep/archive",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "Archive" },
    ],
  },
  {
    pattern: "/iep/:id",
    items: [
      { label: "IEPs", to: "/iep/active" },
      { label: "IEP Viewer" },
    ],
  },
  {
    pattern: "/reports/iep/:id",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "IEP Report" },
    ],
  },
  {
    pattern: "/reports/iep",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "IEP Report" },
    ],
  },
  {
    pattern: "/reports/progress",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "Progress Report" },
    ],
  },
  {
    pattern: "/reports/compliance",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "Compliance" },
    ],
  },
  {
    pattern: "/reports/analytics",
    items: [
      { label: "Reports", to: "/reports" },
      { label: "Analytics" },
    ],
  },
  { pattern: "/reports", items: [{ label: "Reports" }] },
  { pattern: "/goals", items: [{ label: "Goal Bank" }] },
  { pattern: "/progress", items: [{ label: "Progress Monitoring" }] },
  { pattern: "/reminders", items: [{ label: "Reminders" }] },
  { pattern: "/activity", items: [{ label: "Activity Log" }] },
  { pattern: "/search", items: [{ label: "Search" }] },
  { pattern: "/settings", items: [{ label: "Settings" }] },
];

const getBreadcrumbItems = (pathname) => {
  const route = routeDefinitions.find(({ pattern }) =>
    matchPath({ path: pattern, end: true }, pathname),
  );

  return route?.items || [{ label: "Page" }];
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const pageItems = getBreadcrumbItems(pathname);
  const items =
    pathname === "/dashboard"
      ? pageItems
      : [{ label: "Dashboard", to: "/dashboard" }, ...pageItems];

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={item.label + "-" + index}>
              {index > 0 && (
                <li aria-hidden="true" className="shrink-0 text-base-content/35">
                  <ChevronRight className="h-4 w-4" />
                </li>
              )}
              <li className={isLast ? "min-w-0" : "shrink-0"}>
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="text-base-content/60 transition-colors hover:text-base-content"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="block truncate font-semibold text-base-content"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;