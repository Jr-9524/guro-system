import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import {
  getRoleLabel,
  hasPermission,
  PERMISSIONS,
} from "../../utils/permissions";
import {
  Activity,
  ClipboardList,
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  PersonStanding,
  Plus,
  Settings,
  Target,
  X,
} from "lucide-react";

const navItems = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/students", "Students", PersonStanding, PERMISSIONS.STUDENTS_READ],
  ["/iep/active", "IEPs", ClipboardList, PERMISSIONS.IEP_READ],
  ["/goals", "Goal Bank", Target, PERMISSIONS.GOALBANK_READ],
  ["/progress", "Progress", Activity, PERMISSIONS.PROGRESS_READ],
  ["/reports", "Reports", FileBarChart, PERMISSIONS.REPORTS_READ],
  ["/activity", "Activity Log", History, PERMISSIONS.AUDIT_READ],
  ["/settings", "Settings", Settings, PERMISSIONS.SETTINGS_READ],
];

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isCurrentPath = (href) => {
    if (href === "/iep/active") {
      return location.pathname.startsWith("/iep/");
    }
    if (href === "/reports") return location.pathname.startsWith("/reports");
    return location.pathname === href;
  };

  return (
    <aside className="flex h-full flex-col border-r border-base-300 bg-base-100 text-base-content">
      <div className="border-b border-base-300 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/guro_logo.ico"
              alt="GURO logo"
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
            />
            <div>
              <h1 className="text-lg font-black tracking-[0.16em]">GURO</h1>
              <p className="text-[10px] font-semibold tracking-wider text-base-content/50">
                IEP MANAGEMENT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square md:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto p-3"
        aria-label="Main navigation"
      >
        {hasPermission(user, PERMISSIONS.IEP_WRITE) && (
          <button
            type="button"
            onClick={() => navigate("/iep/new")}
            className="btn btn-sm mb-4 w-full justify-start gap-2 rounded-xl border border-base-300 bg-base-200 px-3 text-base-content shadow-none hover:border-primary/25 hover:bg-primary/5"
          >
            <Plus size={16} className="text-base-content" />
            Create IEP
          </button>
        )}

        {navItems
          .filter(([, , , permission]) => hasPermission(user, permission))
          .map(([href, label, Icon]) => {
            const isActive = isCurrentPath(href);

            return (
              <Link
                key={href}
                to={href}
                draggable={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-base-200 font-bold text-base-content ring-1 ring-inset ring-base-300"
                    : "text-base-content/65 hover:bg-base-200 hover:text-base-content"
                }`}
                onClick={() => window.innerWidth < 768 && onClose()}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
                {isActive && (
                  <span
                    className="ml-auto h-2 w-2 shrink-0 rounded-full bg-base-content/60"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-base-300 p-3">
        <div className="flex items-center gap-2 rounded-xl p-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-base-200 text-sm font-bold text-base-content">
            {user?.fullName?.[0] || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.fullName || "User"}
            </p>
            <p className="text-xs text-base-content/50">{getRoleLabel(user)}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:bg-base-200 hover:text-base-content"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
