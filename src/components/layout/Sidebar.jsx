import { Link, useLocation, useNavigate } from "react-router-dom";
import { guroSidebar } from "../../styles/guroStyles";
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
    <aside className={guroSidebar.shell}>
      <div className={`border-b px-4 py-4 ${guroSidebar.divider}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/guro_logo.ico"
              alt="GURO logo"
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
            />
            <div>
              <h1 className="text-lg font-black tracking-[0.16em]">GURO</h1>
              <p className={guroSidebar.brandCaption}>IEP MANAGEMENT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`btn btn-ghost btn-xs btn-square md:hidden ${guroSidebar.iconButton}`}
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
            className={`btn btn-sm ${guroSidebar.create}`}
          >
            <Plus size={16} />
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
                className={`${guroSidebar.link} ${
                  isActive ? guroSidebar.linkActive : guroSidebar.linkIdle
                }`}
                onClick={() => window.innerWidth < 768 && onClose()}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
                {isActive && (
                  <span className={guroSidebar.activeDot} aria-hidden="true" />
                )}
              </Link>
            );
          })}
      </nav>

      <div className={`border-t p-3 ${guroSidebar.divider}`}>
        <div className="flex items-center gap-2 rounded-xl p-1">
          <div className={guroSidebar.avatar}>{user?.fullName?.[0] || "U"}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.fullName || "User"}
            </p>
            <p className={`text-xs ${guroSidebar.meta}`}>
              {getRoleLabel(user)}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className={`btn btn-ghost btn-xs btn-square ${guroSidebar.iconButton}`}
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
