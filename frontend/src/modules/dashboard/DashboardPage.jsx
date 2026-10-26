import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Smartphone,
  MapPin,
  Mic,
  Video,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 15 seconds for live dashboard updates
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading telemetry analytics...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Platform Users',
      value: stats?.totalUsers || 0,
      sub: `${stats?.activeUsers || 0} currently active`,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      badge: '+12% this week'
    },
    {
      label: 'Registered Hardware',
      value: stats?.registeredDevices || 0,
      sub: `${stats?.onlineDevices || 0} online beacons`,
      icon: Smartphone,
      color: 'from-cyan-500 to-teal-600',
      badge: 'Protected'
    },
    {
      label: 'Live Location Sessions',
      value: stats?.activeLocationSessions || 0,
      sub: 'Consensual GPS stream',
      icon: MapPin,
      color: 'from-emerald-500 to-green-600',
      badge: 'Active Now'
    },
    {
      label: 'Encrypted Media Calls',
      value: (stats?.activeAudioSessions || 0) + (stats?.activeVideoSessions || 0),
      sub: `${stats?.activeAudioSessions || 0} audio · ${stats?.activeVideoSessions || 0} video`,
      icon: Video,
      color: 'from-purple-500 to-pink-600',
      badge: 'WebRTC P2P'
    }
  ];

  const pieData = [
    { name: 'Active Consents', value: stats?.consentsGranted || 8, color: '#06b6d4' },
    { name: 'Revoked Consents', value: stats?.consentsRevoked || 2, color: '#f43f5e' },
    { name: 'Pending Invites', value: stats?.pendingInvitations || 1, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Title & Refresh Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Master Telemetry &amp; Operations Dashboard</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time consensual device monitoring, dynamic module health, and compliance metrics
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="glass-card p-5 rounded-2xl relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {kpi.badge}
                </span>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">{kpi.value}</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{kpi.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Weekly Telemetry &amp; Location Sessions
              </h2>
              <p className="text-[11px] text-slate-400">Total verified sessions and coordinate updates</p>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono border border-emerald-500/20">
              +18.4% WoW
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.timelineActivity || []}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorLocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="locations" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" name="Location pings" />
                <Area type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLocs)" name="Active Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consent Compliance Distribution (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Consent Compliance Ratio
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Cryptographically audited permissions
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                Active Consent Records
              </span>
              <span className="font-bold text-white">{stats?.consentsGranted || 0}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Revoked Explicitly
              </span>
              <span className="font-bold text-white">{stats?.consentsRevoked || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Module Health & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Health Status */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Dynamic Module Operational Status
            </h2>
            <span className="text-[11px] text-slate-400">Master Config</span>
          </div>

          <div className="space-y-2.5">
            {stats?.moduleUsage?.slice(0, 6).map((mod, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${mod.enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'}`} />
                  <div>
                    <div className="font-semibold text-slate-200">{mod.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">key: {mod.key}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                    mod.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {mod.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit & Compliance Trail */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Security &amp; Audit Trail
            </h2>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              IMMUTABLE
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {stats?.recentActivity?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No recent activity records found.
              </div>
            ) : (
              stats?.recentActivity?.slice(0, 7).map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-cyan-300 border border-slate-700 shrink-0">
                      {act.action}
                    </span>
                    <span className="text-slate-300 truncate">{act.details}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
