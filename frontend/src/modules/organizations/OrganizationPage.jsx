import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Plus,
  Shield,
  Smartphone,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('PRO');
  const [maxDevices, setMaxDevices] = useState(25);
  const [maxUsers, setMaxUsers] = useState(50);
  const [error, setError] = useState('');

  const fetchOrgs = async () => {
    try {
      const res = await api.get('/admin/organizations');
      if (res.data?.success) {
        setOrgs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/admin/organizations', {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        subscriptionPlan: plan,
        maxDevices: Number(maxDevices),
        maxUsers: Number(maxUsers),
        status: 'ACTIVE'
      });

      if (res.data?.success) {
        setModalOpen(false);
        setName('');
        setSlug('');
        fetchOrgs();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-cyan-400" />
            <span>Multi-Tenant Organizations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enterprise tenant boundaries, hardware quotas, and plan tiers
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Tenant</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-500">
            Loading organizations...
          </div>
        ) : (
          orgs.map((org) => (
            <div
              key={org.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-cyan-500/40 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{org.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">slug: {org.slug}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  org.subscriptionPlan === 'ENTERPRISE'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                }`}>
                  {org.subscriptionPlan}
                </span>
              </div>

              <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    Device Quota
                  </span>
                  <span className="text-white font-bold">{org.maxDevices} endpoints</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    User Quota
                  </span>
                  <span className="text-white font-bold">{org.maxUsers} seats</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tenant Status</span>
                  <span className="text-emerald-400 font-semibold">{org.status}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Created: {new Date(org.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provision Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <Building2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Provision New Tenant</h3>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Organization Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="Apex Defense Corp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Unique Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="apex-defense"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription Plan</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="FREE">Free Tier (5 Devices)</option>
                  <option value="PRO">Pro Tier (25 Devices)</option>
                  <option value="ENTERPRISE">Enterprise Tier (100+ Devices)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Devices</label>
                  <input
                    type="number"
                    min="1"
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Users</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 shadow-md transition"
                >
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
