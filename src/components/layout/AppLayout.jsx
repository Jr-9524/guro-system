// src/components/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import QuickSearch from "./QuickSearch";
import IconButton from "../common/IconButton";
import { guroPage } from "../../styles/guroStyles";
import { Menu, Search } from "lucide-react";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyboard = (e) => {
      // Cmd/Ctrl + K = Quick Search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Cmd/Ctrl + \ = Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isSidebarOpen]);

  return (
    <div className={guroPage.shell}>
      {/* Sidebar */}
      <div
        className={`
        shrink-0 overflow-hidden transition-all duration-300
        ${isSidebarOpen ? "w-64" : "w-0"}
      `}
      >
        {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}
      </div>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-base-300 bg-base-100 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <IconButton
              icon={Menu}
              label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              icon={Search}
              label="Search (Ctrl+K)"
              tooltipPosition="left"
              onClick={() => setIsSearchOpen(true)}
            />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className={guroPage.content}>
          <div className={guroPage.container}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Quick Search Modal */}
      <QuickSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
