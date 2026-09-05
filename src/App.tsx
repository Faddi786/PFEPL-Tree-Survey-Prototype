import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import LoginPage from "./pages/LoginPage";
import MapWorkbenchPage from "./pages/MapWorkbenchPage";
import NilamMobilePage from "./pages/NilamMobilePage";
import NilAiPage from "./pages/NilAiPage";
import AdminPage from "./pages/AdminPage";
import ReportsPage from "./pages/ReportsPage";
import DatabaseExplorerPage from "./pages/DatabaseExplorerPage";
import AuditLogPage from "./pages/workflows/AuditLogPage";
import MoreToolsPage from "./pages/MoreToolsPage";
import PatrolMonitoringPage from "./pages/PatrolMonitoringPage";
import ToolsPage from "./pages/ToolsPage";
import QrMeasurePage from "./pages/workflows/QrMeasurePage";
import NotFoundPage from "./pages/NotFoundPage";
import { ensureDemoSession, isAuthenticated } from "./lib/auth";

ensureDemoSession();

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  ensureDemoSession();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MapWorkbenchPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/database"
        element={
          <ProtectedRoute>
            <DatabaseExplorerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile"
        element={
          <ProtectedRoute>
            <NilamMobilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyst"
        element={
          <ProtectedRoute>
            <NilAiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nil-ai"
        element={<Navigate to="/analyst" replace />}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patrol"
        element={
          <ProtectedRoute>
            <PatrolMonitoringPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools"
        element={
          <ProtectedRoute>
            <ToolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/more-tools"
        element={
          <ProtectedRoute>
            <MoreToolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tools/spatial"
        element={
          <ProtectedRoute>
            <MoreToolsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/audit-log"
        element={
          <ProtectedRoute>
            <AuditLogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/qr-measure"
        element={
          <ProtectedRoute>
            <QrMeasurePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/tree-ai-survey"
        element={<Navigate to="/workflows/qr-measure" replace />}
      />
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
