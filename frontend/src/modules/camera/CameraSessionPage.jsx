import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { subscribeToRemoteUpdates } from '../../services/peerBridge';
import {
  Camera,
  Video,
  VideoOff,
  SwitchCamera,
  Shield,
  PhoneOff,
  AlertCircle,
  Clock,
  Sparkles,
  Maximize2
} from 'lucide-react';

export default function CameraSessionPage() {
  const [inSession, setInSession] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (rear)
  const [session, setSession] = useState(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentToRecord, setConsentToRecord] = useState(false);
  const [videoStopped, setVideoStopped] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [error, setError] = useState('');

  // Remote device stream state from target phone
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteCameraFrame, setRemoteCameraFrame] = useState(null);
  const [remoteDevice, setRemoteDevice] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Subscribe to live remote stream from target phone
  useEffect(() => {
    const unsub = subscribeToRemoteUpdates(({ stream, device, cameraFrame }) => {
      if (stream) {
        setRemoteStream(stream);
        setInSession(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
      if (cameraFrame) {
        setRemoteCameraFrame(cameraFrame);
        setInSession(true);
      }
      if (device) {
        setRemoteDevice(device);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, inSession]);

  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartSession = async (mode = facingMode) => {
    setConsentModalOpen(false);
    setError('');

    try {
      // 1. Create Media Session on Backend
      const sessionType = mode === 'user' ? 'VIDEO_FRONT' : 'VIDEO_REAR';
      const res = await api.post('/media/sessions', {
        sessionType,
        consentToRecord
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to initialize video session');
      }

      const mediaSession = res.data.data;
      setSession(mediaSession);

      // 2. Request user media with specified facingMode
      const constraints = {
        audio: true,
        video: {
          facingMode: mode === 'user' ? 'user' : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Confirm consent on backend
      await api.post(`/media/sessions/${mediaSession.id}/consent`);

      setInSession(true);
      setVideoStopped(false);
      setSessionDuration(0);
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      stopStreams();
      setError(err.message || 'Camera hardware access was denied or is not supported.');
    }
  };

  const handleSwitchCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (inSession) {
      stopStreams();
      await handleStartSession(nextMode);
    }
  };

  const handleToggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = videoStopped;
      });
      setVideoStopped(!videoStopped);
    }
  };

  const handleEndSession = async () => {
    stopStreams();
    if (session) {
      try {
        await api.post(`/media/sessions/${session.id}/terminate`);
      } catch (e) {
        console.warn('Error terminating media session', e);
      }
    }
    setInSession(false);
    setSession(null);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Camera className="w-6 h-6 text-cyan-400" />
          <span>Consensual Front &amp; Rear Camera Sessions</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Encrypted WebRTC live camera streams with front/rear lens switching and participant consent
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Strict Consent &amp; Privacy Rule:</span>
          Cameras cannot be activated silently. A visible live indicator is required by the browser. Video streams are not stored on disk by default. Continuous background streaming requires native application permissions.
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Video Stage */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        {/* Top Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${inSession ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-xs font-bold text-white">
              {inSession ? `STREAM ACTIVE · ${facingMode === 'user' ? 'FRONT CAMERA' : 'REAR CAMERA'}` : 'CAMERA STANDBY'}
            </span>
            {inSession && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 ml-2">
                {formatTime(sessionDuration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSwitchCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              title="Switch Lens (Front / Rear)"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{facingMode === 'user' ? 'Switch to Rear' : 'Switch to Front'}</span>
            </button>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="w-full aspect-video bg-black/90 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
          {remoteCameraFrame && !remoteStream ? (
            <img
              src={remoteCameraFrame}
              alt="Remote Live Phone Camera"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                inSession && !videoStopped ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                inSession && !videoStopped ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {inSession && !videoStopped && (
            <div className="absolute top-3 left-3 bg-emerald-500/90 text-black text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
              {remoteStream ? 'WebRTC HD Stream' : remoteCameraFrame ? 'Remote Phone Camera (MQTT Live)' : 'Local Camera'}
            </div>
          )}

          {/* Standby Placeholder */}
          {(!inSession || videoStopped) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                {videoStopped ? <VideoOff className="w-8 h-8 text-amber-400" /> : <Camera className="w-8 h-8" />}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {videoStopped ? 'Video Stream Paused' : 'Camera Feed Ready'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {videoStopped
                  ? 'Your video is muted. Audio is still active.'
                  : 'Start an authorized front or rear camera session with explicit browser permission.'}
              </p>

              {!inSession && (
                <button
                  onClick={() => setConsentModalOpen(true)}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2 transition"
                >
                  <Video className="w-4 h-4" />
                  <span>Start Camera Session</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Call Action Bar */}
        {inSession && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={handleToggleVideo}
              className={`p-3 rounded-full border transition ${
                videoStopped
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={videoStopped ? 'Resume Video' : 'Stop Video'}
            >
              {videoStopped ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button
              onClick={handleSwitchCamera}
              className="p-3 rounded-full bg-slate-800 border border-slate-700 text-cyan-400 hover:bg-slate-700 transition"
              title="Flip Front/Rear Lens"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndSession}
              className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
              title="Terminate Camera Session"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Pre-Session Consent Modal */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <Camera className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Camera Informed Consent</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This session will request access to your device's camera ({facingMode === 'user' ? 'Front' : 'Rear'}). The camera active light will illuminate on your device during streaming.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToRecord}
                  onChange={(e) => setConsentToRecord(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                />
                <span className="font-semibold">Consent to Video Recording (Optional)</span>
              </label>
              <p className="text-[10px] text-slate-400 pl-6 leading-snug">
                Sessions are peer-to-peer and not stored by default.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConsentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartSession(facingMode)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 shadow-md transition"
              >
                Allow &amp; Connect Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
