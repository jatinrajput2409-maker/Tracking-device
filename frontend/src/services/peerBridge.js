import { Peer } from 'peerjs';

// Global singleton registry for active remote streams and telemetry
const globalState = {
  activeAdminPeer: null,
  activeDevicePeer: null,
  activeAdminConn: null,
  activeRemoteStream: null,
  latestTelemetry: null,
  latestDevice: null,
  listeners: new Set()
};

export function subscribeToRemoteUpdates(callback) {
  globalState.listeners.add(callback);
  // Immediately notify with current state if available
  if (globalState.latestDevice || globalState.latestTelemetry || globalState.activeRemoteStream) {
    callback({
      device: globalState.latestDevice,
      telemetry: globalState.latestTelemetry,
      stream: globalState.activeRemoteStream
    });
  }
  return () => {
    globalState.listeners.delete(callback);
  };
}

function notifyListeners() {
  const payload = {
    device: globalState.latestDevice,
    telemetry: globalState.latestTelemetry,
    stream: globalState.activeRemoteStream
  };
  globalState.listeners.forEach((cb) => {
    try {
      cb(payload);
    } catch (e) {
      console.warn('Listener error in peerBridge', e);
    }
  });
}

/**
 * Admin Side: Listen for connections from the target mobile phone
 */
export function startAdminPeerListener(token, onUpdate) {
  if (!token) return null;

  // Clean up any existing admin peer
  if (globalState.activeAdminPeer && !globalState.activeAdminPeer.destroyed) {
    try {
      globalState.activeAdminPeer.destroy();
    } catch (e) {}
  }

  const cleanToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
  const adminPeerId = `aegis-adm-${cleanToken}`;

  console.log('[PeerBridge] Initializing Admin Peer Listener with ID:', adminPeerId);

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

  peer.on('open', (id) => {
    console.log('[PeerBridge] Admin Peer open and listening:', id);
  });

  // Listen for incoming Data Channel (GPS & Device Info)
  peer.on('connection', (conn) => {
    console.log('[PeerBridge] Target device connected via data channel:', conn.peer);
    globalState.activeAdminConn = conn;

    conn.on('data', (msg) => {
      console.log('[PeerBridge] Received from target device:', msg);

      if (msg.type === 'DEVICE_JOINED') {
        globalState.latestDevice = msg.payload;
        // Also update local mock devices storage so other pages find it
        try {
          const stored = JSON.parse(localStorage.getItem('aegis_mock_devices') || '[]');
          const exists = stored.find((d) => d.id === msg.payload.id);
          if (!exists) {
            localStorage.setItem('aegis_mock_devices', JSON.stringify([msg.payload, ...stored]));
          }
        } catch (e) {}
        notifyListeners();
        if (onUpdate) onUpdate({ type: 'DEVICE_JOINED', data: msg.payload });
      }

      if (msg.type === 'GPS_UPDATE') {
        globalState.latestTelemetry = msg.payload;
        try {
          localStorage.setItem('aegis_latest_gps', JSON.stringify(msg.payload));
        } catch (e) {}
        notifyListeners();
        if (onUpdate) onUpdate({ type: 'GPS_UPDATE', data: msg.payload });
      }
    });

    conn.on('close', () => {
      console.log('[PeerBridge] Target device data connection closed');
    });
  });

  // Listen for incoming WebRTC Media Call (Camera & Microphone stream from phone)
  peer.on('call', (call) => {
    console.log('[PeerBridge] Receiving live media call from target phone:', call.peer);
    // Answer without sending admin stream back (one-way surveillance/monitoring feed)
    call.answer();

    call.on('stream', (remoteStream) => {
      console.log('[PeerBridge] Received remote live camera/audio stream!', remoteStream);
      globalState.activeRemoteStream = remoteStream;
      notifyListeners();
      if (onUpdate) onUpdate({ type: 'STREAM_CONNECTED', stream: remoteStream });
    });

    call.on('close', () => {
      console.log('[PeerBridge] Remote media call closed');
      globalState.activeRemoteStream = null;
      notifyListeners();
    });
  });

  peer.on('error', (err) => {
    console.warn('[PeerBridge] Admin peer error:', err.type, err.message);
  });

  return peer;
}

/**
 * Target Mobile Device Side: Connect to Admin and stream GPS + Camera
 */
export function startTargetDeviceStream(token, { deviceInfo, gpsCoords, mediaStream, onStatus }) {
  if (!token) return null;

  const cleanToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);
  const targetAdminId = `aegis-adm-${cleanToken}`;
  const devicePeerId = `aegis-dev-${cleanToken}-${Math.floor(Math.random() * 1000)}`;

  console.log('[PeerBridge] Target phone initializing Peer ID:', devicePeerId);

  const peer = new Peer(devicePeerId, {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  });

  globalState.activeDevicePeer = peer;

  peer.on('open', (id) => {
    console.log('[PeerBridge] Device peer open, attempting connection to admin:', targetAdminId);
    if (onStatus) onStatus('CONNECTING_TO_ADMIN');

    // 1. Establish Data Channel connection
    const conn = peer.connect(targetAdminId, { reliable: true });

    conn.on('open', () => {
      console.log('[PeerBridge] Connected to Admin Dashboard successfully!');
      if (onStatus) onStatus('CONNECTED_TO_ADMIN');

      // Send initial device registration payload
      conn.send({
        type: 'DEVICE_JOINED',
        payload: {
          ...deviceInfo,
          isOnline: true,
          peerId: id,
          connectedAt: new Date().toISOString()
        }
      });

      // Send initial GPS if available
      if (gpsCoords) {
        conn.send({
          type: 'GPS_UPDATE',
          payload: {
            ...gpsCoords,
            timestamp: new Date().toISOString()
          }
        });
      }
    });

    // Save active connection for continuous GPS pushes
    peer._activeConn = conn;

    // 2. If camera/mic media stream is active, initiate WebRTC video call to Admin
    if (mediaStream) {
      console.log('[PeerBridge] Calling admin with live camera media stream...');
      const call = peer.call(targetAdminId, mediaStream);
      peer._activeCall = call;
    }
  });

  peer.on('error', (err) => {
    console.warn('[PeerBridge] Device peer error:', err.type, err.message);
    if (onStatus) onStatus('CONNECTION_ERROR');
  });

  return {
    peer,
    sendGpsUpdate: (coords) => {
      if (peer._activeConn && peer._activeConn.open) {
        peer._activeConn.send({
          type: 'GPS_UPDATE',
          payload: {
            ...coords,
            timestamp: new Date().toISOString()
          }
        });
      }
    },
    sendMediaStream: (stream) => {
      if (peer && !peer.destroyed) {
        console.log('[PeerBridge] Initiating live media call with updated stream...');
        const call = peer.call(targetAdminId, stream);
        peer._activeCall = call;
      }
    },
    destroy: () => {
      try {
        peer.destroy();
      } catch (e) {}
    }
  };
}

export function getLatestRemoteState() {
  return {
    device: globalState.latestDevice,
    telemetry: globalState.latestTelemetry,
    stream: globalState.activeRemoteStream
  };
}
