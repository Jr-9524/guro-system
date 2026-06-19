import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import {
  Activity,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  PersonStanding,
  Plus,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/students", "Students", PersonStanding],
  ["/iep/active", "IEPs", ClipboardList],
  ["/progress", "Progress", Activity],
  ["/reports", "Reports", FileBarChart],
  ["/settings", "Settings", Settings],
];

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isCurrentPath = (href) => {
    if (href === "/iep/active") {
      return location.pathname.startsWith("/iep/") || location.pathname === "/goals";
    }
    if (href === "/reports") return location.pathname.startsWith("/reports");
    return location.pathname === href;
  };

  return (
    <aside className="flex h-full flex-col border-r border-base-300 bg-base-100 text-base-content">
      <div className="border-b border-base-300 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-content shadow-sm">
              G
            </div>
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

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
        <button
          type="button"
          onClick={() => navigate("/iep/new")}
          className="btn btn-sm mb-4 w-full justify-start gap-2 rounded-xl border-0 bg-primary px-3 text-primary-content shadow-sm hover:brightness-90"
        >
          <Plus size={16} />
          Create IEP
        </button>

        {navItems.map(([href, label, Icon]) => {
          const isActive = isCurrentPath(href);

          return (
            <Link
              key={href}
              to={href}
              draggable={false}
              className={`flex select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary font-semibold text-primary-content shadow-sm"
                  : "text-base-content/70 hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => window.innerWidth < 768 && onClose()}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-base-300 p-3">
        <div className="flex items-center gap-2 rounded-xl p-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {user?.fullName?.[0] || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {user?.fullName || "User"}
            </p>
            <p className="text-xs capitalize text-base-content/50">
              {user?.role || "teacher"}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn btn-ghost btn-xs btn-square text-base-content/70"
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
