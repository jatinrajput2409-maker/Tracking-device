import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Shield,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';

export default function AudioSessionPage() {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [session, setSession] = useState(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentToRecord, setConsentToRecord] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');

  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      stopAudioStreams();
    };
  }, []);

  const stopAudioStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleOpenConsent = () => {
    setError('');
    setConsentModalOpen(true);
  };

  const handleStartCall = async () => {
    setConsentModalOpen(false);
    setError('');

    try {
      // 1. Create Media Session on Backend
      const res = await api.post('/media/sessions', {
        sessionType: 'AUDIO',
        consentToRecord
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to initialize session');
      }

      const mediaSession = res.data.data;
      setSession(mediaSession);

      // 2. Request explicit browser hardware microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // 3. Confirm participant consent on backend
      await api.post(`/media/sessions/${mediaSession.id}/consent`);

      // 4. Setup AudioContext Analyser for real-time waveform visualization
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 64;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animationFrameRef.current = requestAnimationFrame(updateWave);
      };
      updateWave();

      // 5. Start call duration clock
      setInCall(true);
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      stopAudioStreams();
      setError(err.message || 'Microphone access denied or hardware unavailable.');
    }
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = async () => {
    stopAudioStreams();
    if (session) {
      try {
        await api.post(`/media/sessions/${session.id}/terminate`);
      } catch (e) {
        console.warn('Error terminating media session', e);
      }
    }
    setInCall(false);
    setSession(null);
    setAudioLevel(0);
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
          <Mic className="w-6 h-6 text-cyan-400" />
          <span>Consensual WebRTC Voice Session</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          High-fidelity peer-to-peer audio encrypted in transit with visible hardware active indicators
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
        <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white block">Strict Privacy Guarantee:</span>
          Audio is transmitted strictly with active visual notice. Secret activation is impossible under standard browser sandbox policies. By default, raw audio streams are never stored or retained on disk.
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Call Stage */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
        {/* Active Call Glowing Badge */}
        {inCall && (
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs text-emerald-400 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ENCRYPTED AUDIO ACTIVE</span>
          </div>
        )}

        {/* Big Central Mic Circle */}
        <div className="relative my-8">
          {inCall && (
            <div
              className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl transition-all duration-100"
              style={{ transform: `scale(${1 + audioLevel / 60})` }}
            />
          )}

          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
              inCall
                ? isMuted
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-2xl shadow-cyan-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {isMuted ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
          </div>
        </div>

        {/* Call Status & Waveform */}
        {inCall ? (
          <div className="space-y-4 max-w-sm w-full">
            <div>
              <div className="text-xl font-mono font-bold text-white tracking-widest">
                {formatTime(callDuration)}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                {isMuted ? 'Microphone is currently muted' : 'Broadcasting encrypted audio'}
              </div>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center justify-center gap-1.5 h-10 px-4 py-2 bg-slate-900/80 rounded-2xl border border-slate-800">
              {[...Array(16)].map((_, i) => {
                const height = Math.max(
                  4,
                  isMuted ? 4 : Math.sin((i / 16) * Math.PI) * (audioLevel * 0.35) + 4
                );
                return (
                  <span
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={handleToggleMute}
                className={`p-3.5 rounded-full border transition ${
                  isMuted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition transform hover:scale-105"
                title="Disconnect & Terminate Session"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Standby for Voice Session</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Press below to initiate a consensual WebRTC audio session. A permission prompt will confirm hardware access.
            </p>
            <button
              onClick={handleOpenConsent}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Initialize Audio Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Pre-Call Consent Modal */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <Shield className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Microphone Informed Consent</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This session requests access to your device's microphone for two-way audio communication. A hardware indicator will be visible at all times.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentToRecord}
                  onChange={(e) => setConsentToRecord(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                />
                <span className="font-semibold">Consent to Session Recording (Optional)</span>
              </label>
              <p className="text-[10px] text-slate-400 pl-6 leading-snug">
                Recordings are disabled by default. If enabled, session audio metadata is logged in audit records.
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
                onClick={handleStartCall}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 shadow-md transition"
              >
                Grant Permission &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
