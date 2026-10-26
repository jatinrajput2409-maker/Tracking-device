import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Smartphone,
  Laptop,
  CheckCircle,
  AlertTriangle,
  Shield,
  Plus,
  Trash2,
  PowerOff,
  Clock,
  Radio,
  MapPin,
  Mic,
  Camera,
  RefreshCw,
  Globe,
  Share2,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Send,
  Sparkles
} from 'lucide-react';

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Register Current Device Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [permissions, setPermissions] = useState({
    location: true,
    audio: false,
    camera: false
  });

  // Generate Device Link Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkPresetName, setLinkPresetName] = useState('');
  const [linkRequestedLocation, setLinkRequestedLocation] = useState(true);
  const [linkRequestedAudio, setLinkRequestedAudio] = useState(false);
  const [linkRequestedCamera, setLinkRequestedCamera] = useState(false);
  const [generatedLinkData, setGeneratedLinkData] = useState(null);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState('');

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      if (res.data?.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load devices', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await api.get('/devices/enrollment-links');
      if (res.data?.success) {
        setLinks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load enrollment links', err);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchLinks();
    const interval = setInterval(() => {
      fetchDevices();
      fetchLinks();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api.post('/devices/register', {
        deviceName: newDeviceName || `${navigator.platform} Browser`,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'MOBILE_ANDROID' : 'DESKTOP',
        platform: navigator.platform,
        browser: navigator.userAgent.split(' ')[0],
        locationPermission: permissions.location,
        audioPermission: permissions.audio,
        cameraPermission: permissions.camera
      });

      if (res.data?.success) {
        setRegisterModalOpen(false);
        setNewDeviceName('');
        fetchDevices();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register device.');
    }
  };

  const handleCreateEnrollmentLink = async (e) => {
    e.preventDefault();
    setError('');
    setGeneratedLinkData(null);
    setCopied(false);

    try {
      const res = await api.post('/devices/enrollment-links', {
        deviceNamePreset: linkPresetName || 'Remote Mobile Unit',
        requestLocation: linkRequestedLocation,
        requestAudio: linkRequestedAudio,
        requestCamera: linkRequestedCamera,
        expirationHours: 24
      });

      if (res.data?.success) {
        setGeneratedLinkData(res.data.data);
        fetchLinks();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate device enrollment link.');
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${window.location.origin}/enroll-device/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeLink = async (id) => {
    try {
      await api.delete(`/devices/enrollment-links/${id}`);
      fetchLinks();
    } catch (err) {
      console.error('Failed to revoke pairing link', err);
    }
  };

  const handleTogglePermission = async (device, permType) => {
    const updatedLoc = permType === 'location' ? !device.locationPermissionGranted : device.locationPermissionGranted;
    const updatedAudio = permType === 'audio' ? !device.audioPermissionGranted : device.audioPermissionGranted;
    const updatedCam = permType === 'camera' ? !device.cameraPermissionGranted : device.cameraPermissionGranted;

    try {
      await api.put(`/devices/${device.id}/permissions?location=${updatedLoc}&audio=${updatedAudio}&camera=${updatedCam}`);
      fetchDevices();
    } catch (err) {
      console.error('Failed to update permission', err);
    }
  };

  const handleRevokeDevice = async (id) => {
    if (window.confirm('Are you sure you want to revoke authorization for this device? Active tracking will stop immediately.')) {
      try {
        await api.patch(`/devices/${id}/revoke`);
        fetchDevices();
      } catch (err) {
        console.error('Failed to revoke device', err);
      }
    }
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Permanently remove this device registration?')) {
      try {
        await api.delete(`/devices/${id}`);
        fetchDevices();
      } catch (err) {
        console.error('Failed to delete device', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-cyan-400" />
            <span>Authorized Device Fleet &amp; Pairing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enrolled endpoints, generate device pairing links, and inspect hardware permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Generate Link Button */}
          <button
            onClick={() => {
              setLinkModalOpen(true);
              setGeneratedLinkData(null);
              setError('');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Generate Device Link</span>
          </button>

          {/* Register Current Device Button */}
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll This Browser</span>
          </button>
        </div>
      </div>

      {/* Feature Link Explainer Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Remote Device Enrollment Links:</span>
          Generate a secure link and send it via WhatsApp, SMS, or Email to any phone, tablet, or laptop. As soon as the target device opens the link and clicks <span className="text-cyan-400 font-semibold">Authorize</span>, its GPS location, audio, and camera capabilities will be automatically connected and verified here!
        </div>
      </div>

      {/* Active Device Fleet Grid */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          Enrolled Active Endpoints ({devices.length})
        </h2>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center border-slate-800">
            <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Devices Connected Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Generate a device pairing link and send it to the phone or laptop you want to monitor, or enroll this current browser.
            </p>
            <button
              onClick={() => setLinkModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold inline-flex items-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Create First Device Link</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`glass-panel p-6 rounded-3xl border transition-all ${
                  device.status === 'REVOKED'
                    ? 'border-rose-500/20 opacity-60'
                    : 'border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                {/* Device Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
                      {device.deviceType === 'DESKTOP' ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white truncate max-w-[150px]">
                        {device.deviceName}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {device.platform || 'Unknown OS'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      device.status === 'VERIFIED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                {/* Status details */}
                <div className="space-y-2 py-3 border-y border-slate-800/80 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Network Beacon</span>
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <span className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {device.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Last Active</span>
                    <span className="text-slate-200 font-mono">
                      {device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Origin IP</span>
                    <span className="text-slate-200 font-mono text-[10px]">{device.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>

                {/* Hardware Permission Badges / Toggles */}
                <div className="pt-4 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Consent Capabilities
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <button
                      onClick={() => handleTogglePermission(device, 'location')}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        device.locationPermissionGranted
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                      title="Toggle Location Permission"
                    >
                      <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>GPS</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermission(device, 'audio')}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        device.audioPermissionGranted
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                      title="Toggle Audio Permission"
                    >
                      <Mic className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>Audio</span>
                    </button>

                    <button
                      onClick={() => handleTogglePermission(device, 'camera')}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        device.cameraPermissionGranted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                      title="Toggle Camera Permission"
                    >
                      <Camera className="w-3.5 h-3.5 mx-auto mb-0.5" />
                      <span>Camera</span>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 mt-2">
                  {device.status !== 'REVOKED' ? (
                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Revoke Access</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Access Terminated</span>
                  )}

                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Remove Device"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pairing Links Section */}
      {links.length > 0 && (
        <div className="pt-6 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            Generated Pairing &amp; Enrollment Links ({links.length})
          </h2>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Preset Label</th>
                    <th className="p-4">Link URL</th>
                    <th className="p-4">Requested Grants</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Expires</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 font-bold text-white">
                        {link.deviceNamePreset}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-cyan-300">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{window.location.origin}/enroll-device/{link.token}</span>
                          <button
                            onClick={() => handleCopyLink(link.token)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Copy Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          {link.requestLocation && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">GPS</span>
                          )}
                          {link.requestAudio && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Audio</span>
                          )}
                          {link.requestCamera && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Camera</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          link.status === 'ENROLLED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : link.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          {link.status}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {new Date(link.expiresAt).toLocaleString()}
                      </td>

                      <td className="p-4 text-right">
                        {link.status === 'PENDING' && (
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Generate Device Link Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <Share2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Generate Device Pairing Link</h3>
            </div>

            <p className="text-xs text-slate-300">
              Create a link to send to a mobile phone or remote computer. Once opened, clicking <span className="text-cyan-400 font-semibold">Authorize</span> automatically connects that device into this monitoring platform.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {generatedLinkData ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Device Link Ready to Share!</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Send this link to the target device (valid for 24 hours):
                </p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">{window.location.origin}/enroll-device/{generatedLinkData.token}</span>
                  <button
                    onClick={() => handleCopyLink(generatedLinkData.token)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopyLink(generatedLinkData.token)}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition"
                  >
                    {copied ? 'Copied to Clipboard!' : 'Copy Device Link'}
                  </button>
                  <a
                    href={`/enroll-device/${generatedLinkData.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Preview</span>
                  </a>
                </div>

                <button
                  onClick={() => setLinkModalOpen(false)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateEnrollmentLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Device Label / Purpose
                  </label>
                  <input
                    type="text"
                    required
                    value={linkPresetName}
                    onChange={(e) => setLinkPresetName(e.target.value)}
                    placeholder="e.g. Field Driver Android, Delivery Van #3 Tablet"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <span className="font-semibold text-slate-200 block mb-1">Features to Request:</span>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkRequestedLocation}
                      onChange={(e) => setLinkRequestedLocation(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                    />
                    <span>Live GPS Location Sharing</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkRequestedAudio}
                      onChange={(e) => setLinkRequestedAudio(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                    />
                    <span>Audio / Voice Calling Sessions</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkRequestedCamera}
                      onChange={(e) => setLinkRequestedCamera(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                    />
                    <span>Front &amp; Rear Camera Sessions</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 shadow-md transition"
                  >
                    Generate Sharable Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Register Current Browser Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <Laptop className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Enroll This Current Browser</h3>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  required
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Primary Workstation (Chrome)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 shadow-md transition"
                >
                  Enroll Current Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
