import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { startTargetDeviceStream } from '../../services/peerBridge';
import {
  Smartphone,
  Shield,
  MapPin,
  Mic,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  PowerOff,
  Radio,
  Lock,
  Globe,
  Laptop
} from 'lucide-react';

export default function DeviceEnrollPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [linkInfo, setLinkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Device detection
  const [detectedPlatform, setDetectedPlatform] = useState('');
  const [detectedBrowser, setDetectedBrowser] = useState('');
  const [customDeviceName, setCustomDeviceName] = useState('');

  // Consent states
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentAudio, setConsentAudio] = useState(true);
  const [consentCamera, setConsentCamera] = useState(true);

  // Submission & Enrolled states
  const [submitting, setSubmitting] = useState(false);
  const [enrolledDevice, setEnrolledDevice] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    // 1. Detect hardware platform & browser
    const ua = navigator.userAgent;
    let platform = 'Desktop Device';
    let type = 'DESKTOP';

    if (/android/i.test(ua)) {
      platform = 'Android Smartphone';
      type = 'MOBILE_ANDROID';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      platform = 'Apple iOS Device';
      type = 'MOBILE_IOS';
    } else if (/Macintosh|Mac OS X/.test(ua)) {
      platform = 'Apple macOS';
      type = 'DESKTOP';
    } else if (/Windows/.test(ua)) {
      platform = 'Windows PC';
      type = 'DESKTOP';
    }

    let browser = 'Modern Browser';
    if (/Chrome/.test(ua) && !/Edge|OPR/.test(ua)) browser = 'Google Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Apple Safari';
    else if (/Firefox/.test(ua)) browser = 'Mozilla Firefox';
    else if (/Edg/.test(ua)) browser = 'Microsoft Edge';

    setDetectedPlatform(`${platform} · ${browser}`);
    setDetectedBrowser(browser);

    // 2. Fetch and verify link token
    const fetchLink = async () => {
      try {
        const res = await api.get(`/devices/enrollment-links/verify/${token}`);
        if (res.data?.success) {
          const data = res.data.data;
          setLinkInfo(data);
          setCustomDeviceName(data.deviceNamePreset || `${platform}`);
          setConsentLocation(true);
          setConsentAudio(true);
          setConsentCamera(true);
        }
      } catch (err) {
        setLoadError(err.response?.data?.message || 'Invalid, expired, or already used device link.');
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [token]);

  // Live Telemetry states after enrollment
  const [liveCoords, setLiveCoords] = useState(null);
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [watchId, setWatchId] = useState(null);

  const audioStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const peerStreamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (peerStreamRef.current) {
        peerStreamRef.current.destroy();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [watchId]);

  const startLiveAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioStreamRef.current = stream;
      setIsMicStreaming(true);

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.warn('Microphone permission not granted or hardware not available:', err);
    }
  };

  const handleClaimDevice = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);

    try {
      let initialLat = null;
      let initialLng = null;
      let initialAcc = null;

      // 1. Request real high-accuracy GPS location from device hardware
      if (consentLocation && 'geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          initialLat = pos.coords.latitude;
          initialLng = pos.coords.longitude;
          initialAcc = pos.coords.accuracy;
          setLiveCoords({
            lat: initialLat,
            lng: initialLng,
            accuracy: initialAcc
          });
        } catch (locErr) {
          console.warn('Geolocation prompt cancelled or unavailable:', locErr);
        }
      }

      // 2. Request microphone if audio consent is selected
      if (consentAudio && navigator.mediaDevices?.getUserMedia) {
        await startLiveAudioCapture();
      }

      // 3. Request camera if camera consent is selected
      if (consentCamera && navigator.mediaDevices?.getUserMedia) {
        try {
          let camStream;
          try {
            camStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
              audio: false
            });
          } catch (e1) {
            camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
          cameraStreamRef.current = camStream;
          setIsCameraStreaming(true);
        } catch (camErr) {
          console.warn('Camera access denied or hardware busy:', camErr);
        }
      }

      const payload = {
        customDeviceName: customDeviceName || 'Monitored Device',
        deviceType: /MOBILE/i.test(detectedPlatform) ? 'MOBILE_ANDROID' : 'BROWSER',
        platform: detectedPlatform,
        browser: detectedBrowser,
        consentLocation,
        consentAudio,
        consentCamera
      };

      const res = await api.post(`/devices/enrollment-links/verify/${token}/claim`, payload);
      if (res.data?.success) {
        setEnrolledDevice(res.data.data);

        // Start WebRTC P2P streaming to Admin Dashboard
        const peerHandle = startTargetDeviceStream(token, {
          deviceInfo: res.data.data,
          gpsCoords: initialLat ? { lat: initialLat, lng: initialLng, accuracy: initialAcc } : null,
          mediaStream: cameraStreamRef.current,
          onStatus: (st) => console.log('[TargetPhone] WebRTC P2P status:', st)
        });
        peerStreamRef.current = peerHandle;

        // Start continuous live GPS position watch
        if (consentLocation && 'geolocation' in navigator) {
          const wid = navigator.geolocation.watchPosition(
            (position) => {
              const updatedCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
              };
              setLiveCoords(updatedCoords);
              if (peerStreamRef.current) {
                peerStreamRef.current.sendGpsUpdate(updatedCoords);
              }
            },
            (err) => console.warn('WatchPosition error', err),
            { enableHighAccuracy: true, maximumAge: 10000 }
          );
          setWatchId(wid);
        }
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to authorize and enroll device.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Validating device authorization token...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border-rose-500/30">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Device Link Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{loadError}</p>
          <p className="text-[11px] text-slate-500">
            Please ask your administrator or system manager to generate a fresh pairing link.
          </p>
        </div>
      </div>
    );
  }

  // Enrolled Success View (Active Device Beacon)
  if (enrolledDevice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="relative inline-block mx-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/50 shadow-xl shadow-emerald-500/20">
              <CheckCircle className="w-10 h-10" />
            </div>
            <span className="absolute bottom-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              DEVICE AUTHORIZED &amp; CONNECTED
            </span>
            <h2 className="text-xl font-black text-white mt-3">
              {enrolledDevice.deviceName}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enrolled in <span className="text-cyan-400 font-semibold">{linkInfo?.organizationName}</span> fleet
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Endpoint ID:</span>
              <span className="font-mono text-[10px] text-slate-400">{enrolledDevice.id.slice(0, 8)}...</span>
            </div>
            
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/20">
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <MapPin className="w-3.5 h-3.5" /> Live GPS Telemetry:
                </span>
                <span className={enrolledDevice.locationPermissionGranted ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-slate-500'}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active
                </span>
              </div>
              {liveCoords ? (
                <div className="text-[11px] font-mono text-slate-300 flex flex-col gap-0.5 mt-1">
                  <div>Lat: <span className="text-white font-semibold">{liveCoords.lat?.toFixed(5)}</span> · Lng: <span className="text-white font-semibold">{liveCoords.lng?.toFixed(5)}</span></div>
                  <div className="text-[10px] text-cyan-300">Accuracy: ±{Math.round(liveCoords.accuracy || 0)}m (High Accuracy GPS)</div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 italic">Waiting for satellite/browser GPS lock...</div>
              )}
            </div>

            {enrolledDevice.audioPermissionGranted && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-500/20">
                <div className="flex items-center justify-between text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-purple-400">
                    <Mic className="w-3.5 h-3.5" /> Microphone Stream:
                  </span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-purple-400" />
                    {isMicStreaming ? 'Live Audio Connected' : 'Ready for Audio Session'}
                  </span>
                </div>
                {isMicStreaming && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Mic Input Level:</span>
                      <span className="font-mono text-purple-300">{micAudioLevel}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                        style={{ width: `${Math.max(4, micAudioLevel)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {enrolledDevice.cameraPermissionGranted && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/20">
                <div className="flex items-center justify-between text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <Camera className="w-3.5 h-3.5" /> Camera Stream:
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    {isCameraStreaming ? 'Transmitting Live Feed' : 'Ready'}
                  </span>
                </div>
                {isCameraStreaming && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 mt-2">
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => {
                        if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                          el.srcObject = cameraStreamRef.current;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-500/80 text-black text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Live Camera
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-snug">
            You can keep this browser window open or minimized. Features are active only when authorized sessions are initiated. You can disconnect or revoke access at any time.
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Refresh Device Beacon
          </button>
        </div>
      </div>
    );
  }

  // Pre-Enrollment Confirmation Form
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 mb-3 shadow-xl shadow-cyan-500/25 border border-cyan-400/30">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Connect &amp; Authorize Device
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Requested by <span className="text-cyan-400 font-semibold">{linkInfo?.creatorName}</span> for{' '}
            <span className="text-slate-200 font-semibold">{linkInfo?.organizationName}</span>
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Informed Consent Required:</span>
              Authorizing this device will enable the features selected below. Your browser will prompt for standard hardware permissions.
            </div>
          </div>

          {actionError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <form onSubmit={handleClaimDevice} className="space-y-4">
            {/* Device Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Device Name / Friendly Label
              </label>
              <input
                type="text"
                required
                value={customDeviceName}
                onChange={(e) => setCustomDeviceName(e.target.value)}
                placeholder="e.g. Driver Pixel 8, Field Inspector Tablet"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Detected Hardware Info */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Detected Hardware
              </span>
              <span className="text-slate-200 font-mono text-[11px] font-semibold">{detectedPlatform}</span>
            </div>

            {/* Requested Feature Grants */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-300 block">
                Features to Enable on This Device:
              </span>

              {/* Location Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={consentLocation}
                  onChange={(e) => setConsentLocation(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live GPS Location Sharing</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Transmits real-time coordinates only when a session is active. Never operates secretly.
                  </p>
                </div>
              </label>

              {/* Audio Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={consentAudio}
                  onChange={(e) => setConsentAudio(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Mic className="w-3.5 h-3.5 text-purple-400" />
                    <span>Microphone Voice Sessions</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Permits encrypted two-way WebRTC audio calls with active visual mic notification.
                  </p>
                </div>
              </label>

              {/* Camera Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={consentCamera}
                  onChange={(e) => setConsentCamera(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Front &amp; Rear Camera Feeds</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Allows streaming front or rear video. Camera LED illuminates automatically during streaming.
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authorize &amp; Connect This Device</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
