// src/components/layout/Layout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Breadcrumb from "./Breadcrumb";
import QuickSearch from "./QuickSearch";
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
    <div className="flex h-screen overflow-hidden bg-base-200">
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
              className="btn btn-ghost btn-sm gap-2 rounded-xl px-3"
            >
              <Search />
              Search
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-base-200">
          <div className="mx-auto min-h-full w-full max-w-[1600px] px-5 py-6 lg:px-8 lg:py-8">
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
