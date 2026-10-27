import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ModuleContext = createContext(null);

export const ModuleProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [modules, setModules] = useState([]);
  const [allAdminModules, setAllAdminModules] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);

  const fetchModules = useCallback(async () => {
    if (!isAuthenticated) {
      setModules([]);
      return;
    }

    setIsLoadingModules(true);
    try {
      const res = await api.get('/modules');
      if (res.data?.success) {
        setModules(res.data.data || []);
      }

      // If Master Admin, also fetch the raw all-modules configuration list
      if (user?.role === 'ROLE_MASTER_ADMIN') {
        const adminRes = await api.get('/admin/modules');
        if (adminRes.data?.success) {
          setAllAdminModules(adminRes.data.data || []);
        }
      }
    } catch (err) {
      console.warn('Backend offline or static GitHub Pages preview - using demo modules fallback', err);
      // Fallback active modules for static demo preview
      const defaultModules = [
        { id: 'mod-0', moduleKey: 'dashboard', name: 'Overview Dashboard', isEnabled: true, icon: 'LayoutDashboard', route: '/dashboard' },
        { id: 'mod-1', moduleKey: 'location', name: 'Live GPS Tracking', isEnabled: true, icon: 'MapPin', route: '/location' },
        { id: 'mod-2', moduleKey: 'audio', name: 'Microphone & Audio', isEnabled: true, icon: 'Mic', route: '/audio' },
        { id: 'mod-3', moduleKey: 'camera', name: 'Camera & Video Feeds', isEnabled: true, icon: 'Camera', route: '/camera' },
        { id: 'mod-4', moduleKey: 'devices', name: 'Device Fleet', isEnabled: true, icon: 'Smartphone', route: '/devices' },
        { id: 'mod-5', moduleKey: 'users', name: 'User Management', isEnabled: true, icon: 'Users', route: '/users' },
        { id: 'mod-6', moduleKey: 'organizations', name: 'Organizations', isEnabled: true, icon: 'Building2', route: '/organizations' },
        { id: 'mod-7', moduleKey: 'module_config', name: 'Module Configuration', isEnabled: true, icon: 'Cpu', route: '/module-management' },
        { id: 'mod-8', moduleKey: 'consent', name: 'Consent Ledger', isEnabled: true, icon: 'ShieldCheck', route: '/consent' },
        { id: 'mod-9', moduleKey: 'audit', name: 'Audit Logs', isEnabled: true, icon: 'FileText', route: '/audit-logs' }
      ];
      setModules(defaultModules);
      if (user?.role === 'ROLE_MASTER_ADMIN') {
        setAllAdminModules(defaultModules);
      }
    } finally {
      setIsLoadingModules(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const isModuleEnabled = (moduleKey) => {
    return modules.some((m) => m.moduleKey === moduleKey && m.isEnabled);
  };

  const toggleModuleStatus = async (moduleId, enabled) => {
    const res = await api.patch(`/admin/modules/${moduleId}/status?enabled=${enabled}`);
    if (res.data?.success) {
      await fetchModules();
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to toggle module status');
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        allAdminModules,
        isLoadingModules,
        refreshModules: fetchModules,
        isModuleEnabled,
        toggleModuleStatus
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
};
