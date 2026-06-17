// src/components/layout/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import {
  LayoutDashboard,
  Bell,
  History,
  Search,
  Settings,
  PersonStanding,
  ClipboardList,
  Calendar,
  CircleCheck,
  Notebook,
  Archive,
  Activity,
  ChartNoAxesCombined,
  ClipboardPen,
  ChartColumnIncreasing,
  LogOut,
  Plus,
  X,
} from "lucide-react";

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [isStudentsOpen, setIsStudentsOpen] = useState(true);
  const [isIEPsOpen, setIsIEPsOpen] = useState(true);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const menuItem = (href, label, icon, isActive = false) => (
    <Link
      to={href}
      draggable={false}
      className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
      transition-colors group select-none
      ${
        isActive || location.pathname === href
          ? "bg-base-200 font-medium"
          : "hover:bg-base-200"
      }
    `}
      onClick={() => {
        if (window.innerWidth < 768) onClose();
      }}
    >
      <span className="text-base pointer-events-none">{icon}</span>
      <span className="flex-1">{label}</span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
      )}
    </Link>
  );

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Workspace Header */}
      <div className="p-3 border-b border-base-300">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-bold text-lg">GURO</h1>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-square md:hidden"
          >
            <X size={16} />
          </button>
        </div>
        <div className="text-xs opacity-70">IEP Management</div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Quick Actions */}
        <button
          onClick={() => navigate("/iep/new")}
          className="btn btn-sm border border-base-300 w-full justify-start gap-2 mb-2 px-2.5 "
        >
          <Plus size={16} />
          New IEP
        </button>

        {/* Main Navigation */}
        <div className="space-y-0.5">
          {menuItem("/dashboard", "Dashboard", <LayoutDashboard />)}
          {menuItem("/reminders", "Reminders", <Bell />)}
          {menuItem("/activity", "Activity", <History />)}
          {menuItem("/search", "Search", <Search />)}
          {menuItem("/settings", "Settings", <Settings />)}
        </div>

        <div className="divider my-2"></div>

        {/* Students Section */}
        <div>
          <button
            onClick={() => setIsStudentsOpen(!isStudentsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100"
          >
            <span>Students</span>
            <span>{isStudentsOpen ? "▾" : "▸"}</span>
          </button>

          {isStudentsOpen && (
            <div className="space-y-0.5">
              {menuItem("/students", "All Students", <PersonStanding />)}
              {/* {menuItem(
                "/students?view=board",
                "Board View",
                <ClipboardList />,
              )} */}
              {menuItem("/students?view=calendar", "Calendar", <Calendar />)}

              {/* Recent Students (Favorites)
              {recentStudents.map((student) => (
                <Link
                  key={student.id}
                  to={`/students/${student.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm hover:bg-base-200 transition-colors"
                >
                  <div className="avatar placeholder">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-5 h-5">
                      <span className="text-xs">{student.firstName?.[0]}</span>
                    </div>
                  </div>
                  <span className="truncate">
                    {student.firstName} {student.lastName}
                  </span>
                </Link>
              ))} */}
            </div>
          )}
        </div>

        <div className="divider my-2"></div>

        {/* IEPs Section */}
        <div>
          <button
            onClick={() => setIsIEPsOpen(!isIEPsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100"
          >
            <span>IEPs</span>
            <span>{isIEPsOpen ? "▾" : "▸"}</span>
          </button>

          {isIEPsOpen && (
            <div className="space-y-0.5">
              {menuItem("/iep/new", "Quick IEP Writing", <ClipboardList />)}
              {menuItem("/goals", "Goal Bank", <ClipboardPen />)}
              {menuItem("/progress", "Progress Monitoring", <Activity />)}
              {menuItem("/iep/active", "Active IEPs", <CircleCheck />)}
              {menuItem("/iep/drafts", "Drafts", <Notebook />)}
              {menuItem("/iep/archive", "Archive", <Archive />)}
            </div>
          )}
        </div>

        <div className="divider my-2"></div>

        {/* Reports Section */}
        <div>
          <button
            onClick={() => setIsReportsOpen(!isReportsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100"
          >
            <span>Reports</span>
            <span>{isReportsOpen ? "▾" : "▸"}</span>
          </button>

          {isReportsOpen && (
            <div className="space-y-0.5">
              {menuItem(
                "/reports/progress",
                "Progress Reports",
                <ChartNoAxesCombined />,
              )}
              {menuItem("/reports/compliance", "Compliance", <ClipboardPen />)}
              {menuItem(
                "/reports/analytics",
                "Analytics",
                <ChartColumnIncreasing />,
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-base-300">
        <div className="flex items-center gap-2">
          <div className="avatar placeholder">
            <div className="bg-base-300 text-base-content rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-sm">{user?.fullName?.[0]}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs opacity-60">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-xs btn-square"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
