import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Activity,
  Shield,
  Clock,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs?page=0&size=50');
      if (res.data?.success) {
        setLogs(res.data.data.content || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    !filterAction || l.action.toLowerCase().includes(filterAction.toLowerCase()) ||
    (l.userEmail && l.userEmail.toLowerCase().includes(filterAction.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-cyan-400" />
          <span>System Audit &amp; Administrative Logs</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tamper-evident operational log records for administrative compliance, authentication events, and device operations
        </p>
      </div>

      {/* Filter */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            placeholder="Filter by action or actor email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing: <span className="text-white font-bold">{filteredLogs.length}</span> Records
        </div>
      </div>

      {/* Log Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Event Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 border border-slate-700">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300 font-mono text-[11px]">
                      {log.userEmail || 'System Service'}
                    </td>

                    <td className="p-4 text-slate-400">
                      <span className="text-white font-semibold">{log.targetEntity}</span>
                      {log.targetId && (
                        <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[120px]">
                          {log.targetId}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-300 max-w-sm truncate">
                      {log.details}
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
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
