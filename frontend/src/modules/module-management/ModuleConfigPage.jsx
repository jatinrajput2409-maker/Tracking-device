import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useModules } from '../../contexts/ModuleContext';
import {
  Cpu,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function ModuleConfigPage() {
  const { refreshModules } = useModules();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminModules = async () => {
    try {
      const res = await api.get('/admin/modules');
      if (res.data?.success) {
        setModules(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin module config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminModules();
  }, []);

  const handleToggle = async (module) => {
    setTogglingId(module.id);
    setError('');
    setSuccess('');

    try {
      const nextState = !module.isEnabled;
      const res = await api.patch(`/admin/modules/${module.id}/status?enabled=${nextState}`);
      if (res.data?.success) {
        setSuccess(`Module '${module.name}' is now ${nextState ? 'ENABLED' : 'DISABLED'} system-wide.`);
        await fetchAdminModules();
        await refreshModules(); // Update sidebar immediately
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle module.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <span>Dynamic Module &amp; Feature Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Master Admin control plane: enable or disable features at runtime without modifying frontend code
        </p>
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Runtime Dynamic Feature Flipping:</span>
          Toggling a module here immediately takes effect across all tenant sessions, navigation menus, and backend API authorization guards. Disabled modules cannot be accessed via direct URL routing.
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-500">
            Loading module configurations...
          </div>
        ) : (
          modules.map((m) => (
            <div
              key={m.id}
              className={`glass-panel p-6 rounded-3xl border transition-all ${
                m.isEnabled
                  ? 'border-slate-800 hover:border-cyan-500/40'
                  : 'border-slate-800/40 bg-slate-950/40 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono text-xs font-bold border ${
                    m.isEnabled
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {m.icon?.slice(0, 3) || 'MOD'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{m.name}</h3>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Route: <span className="text-cyan-400">{m.route}</span> · Key: {m.moduleKey}
                    </div>
                  </div>
                </div>

                {/* Big Toggle Switch Button */}
                <button
                  onClick={() => handleToggle(m)}
                  disabled={togglingId === m.id}
                  className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition ${
                    m.isEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                  title={m.isEnabled ? 'Disable Module' : 'Enable Module'}
                >
                  {togglingId === m.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  ) : m.isEnabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-500" />
                  )}
                  <span>{m.isEnabled ? 'ACTIVE' : 'OFFLINE'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {m.description}
              </p>

              {/* Badges Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Min Role:</span>
                  <span className="text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {m.minRoleLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Required Tier:</span>
                  <span className="text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {m.requiredSubscription}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
