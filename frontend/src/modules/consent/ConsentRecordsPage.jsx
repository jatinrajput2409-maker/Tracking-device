import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  ShieldCheck,
  PowerOff,
  Clock,
  Globe,
  Smartphone,
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function ConsentRecordsPage() {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConsents = async () => {
    try {
      const res = await api.get('/consents');
      if (res.data?.success) {
        setConsents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load consent records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const handleRevoke = async (id) => {
    if (window.confirm('Revoke this consent record? The hardware capability will immediately be blocked.')) {
      try {
        await api.delete(`/consents/${id}`);
        fetchConsents();
      } catch (err) {
        console.error('Failed to revoke consent', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>Informed Consent &amp; Privacy Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable, immutable records of explicit user permissions, hardware grants, and policy acceptances
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Capability / Purpose</th>
                <th className="p-4">Granted Status</th>
                <th className="p-4">Origin IP</th>
                <th className="p-4">Recorded At</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Loading consent audit records...
                  </td>
                </tr>
              ) : consents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No consent records found.
                  </td>
                </tr>
              ) : (
                consents.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-mono text-slate-300">
                      {c.user?.email || 'Authenticated User'}
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-white block">
                        {c.consentType}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-xs block">
                        {c.notes || 'Hardware access permission granted'}
                      </span>
                    </td>

                    <td className="p-4">
                      {c.granted && !c.revokedAt ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>ACTIVE GRANT</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>REVOKED</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {c.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      {c.granted && !c.revokedAt ? (
                        <button
                          onClick={() => handleRevoke(c.id)}
                          className="px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold text-[11px] transition"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
