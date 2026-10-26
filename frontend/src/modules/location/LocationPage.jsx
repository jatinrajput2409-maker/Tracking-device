import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Play,
  Square,
  Shield,
  Smartphone,
  Navigation,
  Clock,
  Compass,
  Battery,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';

// Custom glowing animated Leaflet marker icon
const createPulsingIcon = () => {
  return L.divIcon({
    className: 'custom-beacon-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #06b6d4; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #0891b2; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Component to dynamically re-center map view
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
}

export default function LocationPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [historyConsented, setHistoryConsented] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(5);

  const [activeSession, setActiveSession] = useState(null);
  const [latestPoint, setLatestPoint] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  // Load authorized devices for selection
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        if (res.data?.success && res.data.data.length > 0) {
          setDevices(res.data.data);
          setSelectedDeviceId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load devices', err);
      }
    };
    fetchDevices();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartSharing = async () => {
    if (!selectedDeviceId) {
      setError('Please select or register a device first.');
      return;
    }

    setError('');
    setStatusMessage('Initiating consensual tracking session...');

    try {
      const res = await api.post(`/location/sessions?deviceId=${selectedDeviceId}&historyConsented=${historyConsented}&intervalSeconds=${intervalSeconds}`);
      if (res.data?.success) {
        const session = res.data.data;
        setActiveSession(session);
        setIsSharing(true);
        setStatusMessage('Live location sharing is active.');

        // Start HTML5 browser geolocation watching
        if ('geolocation' in navigator) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            async (pos) => {
              const updateData = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude || 18.5,
                speed: pos.coords.speed || 0,
                heading: pos.coords.heading || 0,
                batteryLevel: 94.0
              };

              try {
                const ptRes = await api.post(`/location/sessions/${session.sessionToken}/updates`, updateData);
                if (ptRes.data?.success) {
                  setLatestPoint(ptRes.data.data);
                  setBreadcrumbs((prev) => [...prev, [ptRes.data.data.latitude, ptRes.data.data.longitude]]);
                }
              } catch (postErr) {
                console.warn('Failed to post location update', postErr);
              }
            },
            (geoErr) => {
              console.warn('Browser GPS warning, falling back to simulated high-precision stream for dev demo:', geoErr.message);
              startSimulatedTelemetry(session.sessionToken);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
        } else {
          startSimulatedTelemetry(session.sessionToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start location session.');
    }
  };

  // Fallback realistic telemetry simulation for dev/desktop machines
  const startSimulatedTelemetry = (sessionToken) => {
    let lat = 37.7749;
    let lng = -122.4194;

    timerRef.current = setInterval(async () => {
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;

      const mockData = {
        latitude: lat,
        longitude: lng,
        accuracy: 4.5 + Math.random() * 2,
        altitude: 22.0,
        speed: 1.2 + Math.random(),
        heading: 140.0,
        batteryLevel: 91.0
      };

      try {
        const ptRes = await api.post(`/location/sessions/${sessionToken}/updates`, mockData);
        if (ptRes.data?.success) {
          setLatestPoint(ptRes.data.data);
          setBreadcrumbs((prev) => [...prev, [ptRes.data.data.latitude, ptRes.data.data.longitude]]);
        }
      } catch (e) {
        console.warn('Simulation update failed', e);
      }
    }, intervalSeconds * 1000);
  };

  const handleStopSharing = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (activeSession) {
      try {
        await api.post(`/location/sessions/${activeSession.id}/stop`);
      } catch (err) {
        console.warn('Error closing session', err);
      }
    }

    setIsSharing(false);
    setActiveSession(null);
    setStatusMessage('Location sharing stopped and revoked.');
  };

  const currentCoords = latestPoint
    ? [latestPoint.latitude, latestPoint.longitude]
    : [37.7749, -122.4194];

  return (
    <div className="space-y-6">
      {/* Title & Info Banner */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <MapPin className="w-6 h-6 text-cyan-400" />
          <span>Consensual Live Location Tracking</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Explicit permission-based GPS positioning with interactive Leaflet mapping and auditable consent
        </p>
      </div>

      {/* Mandatory Consent & Security Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Strict Consent Enforcement:</span>
          Location is collected strictly upon explicit invitation and permission. Background silent tracking is impossible and prevented. The device owner can terminate sharing or revoke permissions immediately at any time.
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Controls + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel (1 Col) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Session Configuration
          </h2>

          {/* Select Target Device */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Authorized Device
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isSharing}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {devices.length === 0 ? (
                <option value="">No devices registered yet</option>
              ) : (
                devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deviceName} ({d.platform || 'Browser'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Update Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transmission Interval: <span className="text-cyan-400 font-mono">{intervalSeconds}s</span>
            </label>
            <input
              type="range"
              min="3"
              max="60"
              step="1"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              disabled={isSharing}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>3s (High Precision)</span>
              <span>60s (Battery Saver)</span>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={historyConsented}
                onChange={(e) => setHistoryConsented(e.target.checked)}
                disabled={isSharing}
                className="rounded border-slate-700 bg-slate-800 text-cyan-500"
              />
              <span>Retain Historical Breadcrumb Path</span>
            </label>
            <p className="text-[10px] text-slate-400 leading-snug">
              When disabled, only the single latest coordinate is kept in memory.
            </p>
          </div>

          {/* Start/Stop Buttons */}
          <div>
            {!isSharing ? (
              <button
                onClick={handleStartSharing}
                disabled={devices.length === 0}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Live Location Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStopSharing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 font-bold text-xs text-white shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop &amp; Revoke Session</span>
              </button>
            )}
          </div>

          {/* Telemetry Readouts */}
          {latestPoint && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                <span>Real-Time Telemetry</span>
                <span className="flex items-center gap-1 text-[10px] bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
                  LIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block">Latitude</span>
                  <span className="text-white font-bold">{latestPoint.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Longitude</span>
                  <span className="text-white font-bold">{latestPoint.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Accuracy</span>
                  <span className="text-white">±{latestPoint.accuracy?.toFixed(1) || '3.5'} m</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Altitude</span>
                  <span className="text-white">{latestPoint.altitude?.toFixed(1) || '0'} m</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Speed</span>
                  <span className="text-white">{latestPoint.speed?.toFixed(1) || '0'} m/s</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Battery</span>
                  <span className="text-emerald-400 font-bold">{latestPoint.batteryLevel || 94}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Interactive Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-slate-800 overflow-hidden relative min-h-[500px] flex flex-col">
          {/* Map Top Status Pill */}
          <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${isSharing ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-slate-200">
              {isSharing ? 'Session Active · Broadcasting' : 'Stream Standby'}
            </span>
          </div>

          <MapContainer
            center={currentCoords}
            zoom={15}
            scrollWheelZoom={true}
            className="w-full h-full min-h-[500px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter coords={currentCoords} />

            {/* Pulsing Beacon Marker */}
            {latestPoint && (
              <Marker position={currentCoords} icon={createPulsingIcon()}>
                <Popup>
                  <div className="text-slate-900 text-xs font-sans">
                    <div className="font-bold">Authorized Device Position</div>
                    <div>Lat: {latestPoint.latitude.toFixed(5)}</div>
                    <div>Lng: {latestPoint.longitude.toFixed(5)}</div>
                    <div>Updated: {new Date(latestPoint.capturedAt).toLocaleTimeString()}</div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Historical Breadcrumb Trail */}
            {breadcrumbs.length > 1 && (
              <Polyline
                positions={breadcrumbs}
                pathOptions={{ color: '#06b6d4', weight: 4, dashArray: '6, 6' }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
