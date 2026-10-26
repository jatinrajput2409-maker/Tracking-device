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
      console.error('Failed to fetch dynamic modules', err);
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
