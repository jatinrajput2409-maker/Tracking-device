import React from 'react';
import { NavLink } from 'react-router-dom';
import { useModules } from '../../contexts/ModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Mic,
  Camera,
  Smartphone,
  Users,
  Building2,
  Cpu,
  ShieldCheck,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  MapPin,
  Navigation: MapPin,
  Mic,
  Camera,
  Smartphone,
  Users,
  Building2,
  Cpu,
  ShieldCheck,
  FileText,
  Activity
};

const ROUTE_MAP = {
  dashboard: '/dashboard',
  location: '/location',
  audio: '/audio',
  camera: '/camera',
  devices: '/devices',
  users: '/users',
  organizations: '/organizations',
  module_config: '/module-management',
  consent: '/consent',
  audit: '/audit-logs'
};

export default function Sidebar({ isCollapsed, onToggle }) {
  const { modules, isLoadingModules } = useModules();
  const { user } = useAuth();

  return (
    <aside
      className={`bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 relative z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  Aegis<span className="text-cyan-400">Monitor</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Platform Console
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Dynamic Navigation Links */}
        <div className="p-3 space-y-1">
          <div className={`text-[10px] uppercase font-bold text-slate-500 px-3 py-2 ${isCollapsed ? 'text-center' : ''}`}>
            {isCollapsed ? '•••' : 'Active Modules'}
          </div>

          {isLoadingModules ? (
            <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
              Loading modules...
            </div>
          ) : (
            modules.map((m) => {
              const IconComponent = ICON_MAP[m.icon] || ICON_MAP[m.moduleKey] || Layers;
              const targetRoute = m.route || ROUTE_MAP[m.moduleKey] || `/${m.moduleKey}`;
              return (
                <NavLink
                  key={m.id || m.moduleKey}
                  to={targetRoute}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                  title={isCollapsed ? m.name : undefined}
                >
                  <IconComponent className="w-4 h-4 shrink-0 text-cyan-400/90" />
                  {!isCollapsed && <span className="truncate">{m.name}</span>}
                </NavLink>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Tenant Info Card */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-950/40 border text-slate-400 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-300">Plan Tier</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40">
              ENTERPRISE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            All consent records are cryptographically verified and immutable.
          </p>
        </div>
      )}
    </aside>
  );
}
