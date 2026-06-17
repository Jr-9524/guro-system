// src/components/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import QuickSearch from "./QuickSearch";
import ThemeSwitcher from "../common/ThemeSwitcher";
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
        transition-all duration-300 border-r border-base-300
        ${isSidebarOpen ? "w-60" : "w-0"}
      `}
      >
        {isSidebarOpen && <Sidebar onClose={() => setIsSidebarOpen(false)} />}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 border-b border-base-300 flex items-center justify-between px-4 bg-base-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="btn btn-ghost btn-sm btn-square"
            >
              <Menu />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn btn-ghost btn-sm gap-2 p-4"
            >
              <Search />
              Search
            </button>
            <ThemeSwitcher />
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full min-h-full px-6 py-6 lg:px-8">
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
