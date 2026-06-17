// src/App.jsx
import React, { useEffect, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./stores/authStore";
import themeStore from "./stores/themeStore";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Lazy load pages
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AppLayout = React.lazy(() => import("./components/layout/AppLayout"));
const StudentList = React.lazy(() => import("./pages/StudentList"));
const IEPBuilder = React.lazy(() => import("./pages/IEPBuilder"));
const IEPList = React.lazy(() => import("./pages/IEPList"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Settings = React.lazy(() => import("./pages/Settings"));
const GoalBank = React.lazy(() => import("./pages/GoalBank"));
const ProgressMonitoring = React.lazy(() => import("./pages/ProgressMonitoring"));
const Reminders = React.lazy(() => import("./pages/Reminders"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const ActivityLog = React.lazy(() => import("./pages/ActivityLog"));

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initTheme } = themeStore();

  useEffect(() => {
    checkAuth();
    initTheme();
  }, [checkAuth, initTheme]);

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Student routes */}
            <Route path="students" element={<StudentList />} />
            <Route path="students/:id" element={<StudentList />} />

            {/* IEP filtered views */}
            <Route path="iep/active" element={<IEPList view="active" />} />
            <Route path="iep/drafts" element={<IEPList view="drafts" />} />
            <Route path="iep/archive" element={<IEPList view="archive" />} />

            {/* IEP routes */}
            <Route path="iep/new" element={<IEPBuilder />} />
            <Route path="iep/:id/edit" element={<IEPBuilder />} />
            <Route path="iep/:id" element={<IEPBuilder />} />

            {/* Progress & Reports */}
            <Route
              path="progress"
              element={<ProgressMonitoring />}
            />
            <Route path="reports" element={<Reports view="overview" />} />
            <Route
              path="reports/progress"
              element={<Reports view="progress" />}
            />
            <Route
              path="reports/compliance"
              element={<Reports view="compliance" />}
            />
            <Route
              path="reports/analytics"
              element={<Reports view="analytics" />}
            />

            {/* Other */}
            <Route path="search" element={<SearchPage />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="activity" element={<ActivityLog />} />
            <Route path="goals" element={<GoalBank />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
    </HashRouter>
  );
}

export default App;
