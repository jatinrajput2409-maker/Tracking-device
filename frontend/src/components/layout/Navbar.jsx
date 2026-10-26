import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Bell,
  LogOut,
  Shield,
  Activity,
  Radio,
  Video,
  Mic,
  ChevronRight,
  User as UserIcon,
  Building
} from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_MASTER_ADMIN':
        return { label: 'MASTER ADMIN', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'ROLE_ORG_ADMIN':
        return { label: 'ORG ADMIN', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      default:
        return { label: 'STANDARD USER', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Organization context & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition md:hidden"
          title="Toggle Navigation"
        >
          <Activity className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300">
            <Building className="w-3.5 h-3.5 text-cyan-400" />
            {user?.organizationName || 'Master Platform Tenant'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-300 font-mono">v1.0.0-PROD</span>
        </div>
      </div>

      {/* Right: Telemetry Indicators & Profile */}
      <div className="flex items-center gap-4">
        {/* System Active Sessions Indicators */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Auth Bridge Active</span>
          </div>
        </div>

        {/* User Role Tag */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
          {roleInfo.label}
        </span>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-cyan-500/20">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.fullName || user?.email}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {user?.email}
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
