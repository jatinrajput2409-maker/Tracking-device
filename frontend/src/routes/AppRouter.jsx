import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModules } from '../contexts/ModuleContext';
import AppLayout from '../components/layout/AppLayout';

// Pages
import LoginPage from '../modules/auth/LoginPage';
import RegisterPage from '../modules/auth/RegisterPage';
import AcceptInvitePage from '../modules/auth/AcceptInvitePage';
import DashboardPage from '../modules/dashboard/DashboardPage';
import LocationPage from '../modules/location/LocationPage';
import AudioSessionPage from '../modules/audio/AudioSessionPage';
import CameraSessionPage from '../modules/camera/CameraSessionPage';
import DeviceManagementPage from '../modules/devices/DeviceManagementPage';
import DeviceEnrollPage from '../modules/devices/DeviceEnrollPage';
import UserManagementPage from '../modules/users/UserManagementPage';
import OrganizationPage from '../modules/organizations/OrganizationPage';
import ModuleConfigPage from '../modules/module-management/ModuleConfigPage';
import ConsentRecordsPage from '../modules/consent/ConsentRecordsPage';
import AuditLogsPage from '../modules/audit-logs/AuditLogsPage';
import { ShieldAlert } from 'lucide-react';

// Authentication Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-mono">
        Authenticating session bridge...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Dynamic Module Guard: Checks backend runtime module enablement
const DynamicModuleGuard = ({ moduleKey, children }) => {
  const { isModuleEnabled, isLoadingModules } = useModules();
  const { user } = useAuth();

  // Master Admin can view disabled modules for testing/management
  if (user?.role === 'ROLE_MASTER_ADMIN') {
    return children;
  }

  if (isLoadingModules) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-mono">
        Verifying module entitlement...
      </div>
    );
  }

  if (!isModuleEnabled(moduleKey)) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-amber-500/30 text-center max-w-lg mx-auto my-12">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-white mb-1">Module Offline</h2>
        <p className="text-xs text-slate-400 mb-4">
          This capability ({moduleKey}) has been dynamically deactivated by the platform administrator or is not included in your organization's subscription tier.
        </p>
      </div>
    );
  }

  return children;
};

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
        <Route path="/enroll-device/:token" element={<DeviceEnrollPage />} />

        {/* Protected Authenticated Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route
            path="location"
            element={
              <DynamicModuleGuard moduleKey="location">
                <LocationPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="audio"
            element={
              <DynamicModuleGuard moduleKey="audio">
                <AudioSessionPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="camera"
            element={
              <DynamicModuleGuard moduleKey="camera">
                <CameraSessionPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="devices"
            element={
              <DynamicModuleGuard moduleKey="devices">
                <DeviceManagementPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="users"
            element={
              <DynamicModuleGuard moduleKey="users">
                <UserManagementPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="organizations"
            element={
              <DynamicModuleGuard moduleKey="organizations">
                <OrganizationPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="module-management"
            element={
              <DynamicModuleGuard moduleKey="module_config">
                <ModuleConfigPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="consent"
            element={
              <DynamicModuleGuard moduleKey="consent">
                <ConsentRecordsPage />
              </DynamicModuleGuard>
            }
          />

          <Route
            path="audit-logs"
            element={
              <DynamicModuleGuard moduleKey="audit">
                <AuditLogsPage />
              </DynamicModuleGuard>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
