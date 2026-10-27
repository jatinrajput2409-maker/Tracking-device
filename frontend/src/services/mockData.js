// Mock Data & Simulation Engine for GitHub Pages Static Demo
const MOCK_STORAGE_KEY_MODULES = 'aegis_mock_modules';
const MOCK_STORAGE_KEY_DEVICES = 'aegis_mock_devices';
const MOCK_STORAGE_KEY_USERS = 'aegis_mock_users';
const MOCK_STORAGE_KEY_CONSENTS = 'aegis_mock_consents';
const MOCK_STORAGE_KEY_AUDITS = 'aegis_mock_audits';

const INITIAL_MODULES = [
  { id: '1', moduleKey: 'location', name: 'Live GPS Tracking', isEnabled: true, description: 'Real-time GPS beacon and consensual telemetry streaming', icon: 'Navigation' },
  { id: '2', moduleKey: 'audio', name: 'Microphone & Audio', isEnabled: true, description: 'Real-time Web Audio API waveform and audio bridge', icon: 'Mic' },
  { id: '3', moduleKey: 'camera', name: 'Camera & Video Feeds', isEnabled: true, description: 'Front and rear video streaming with lens toggle', icon: 'Camera' },
  { id: '4', moduleKey: 'devices', name: 'Device Fleet', isEnabled: true, description: 'Hardware beacons, OS fingerprinting, and remote revoke', icon: 'Smartphone' },
  { id: '5', moduleKey: 'users', name: 'User Management', isEnabled: true, description: 'RBAC organization members, roles, and status', icon: 'Users' },
  { id: '6', moduleKey: 'organizations', name: 'Organizations', isEnabled: true, description: 'Multi-tenant boundaries and subscription plans', icon: 'Building2' },
  { id: '7', moduleKey: 'module_config', name: 'Module Configuration', isEnabled: true, description: 'Dynamic runtime platform feature toggles', icon: 'Cpu' },
  { id: '8', moduleKey: 'consent', name: 'Consent Ledger', isEnabled: true, description: 'Cryptographic immutable user consent records', icon: 'ShieldCheck' },
  { id: '9', moduleKey: 'audit', name: 'Audit Logs', isEnabled: true, description: 'Tamper-evident administrative compliance trail', icon: 'FileText' }
];

const INITIAL_DEVICES = [
  {
    id: 'dev-1',
    name: 'Field Unit Alpha (Samsung S23)',
    platform: 'Android 14',
    browser: 'Chrome Mobile 122',
    ipAddress: '192.168.1.45',
    isOnline: true,
    gpsEnabled: true,
    audioEnabled: true,
    cameraEnabled: true,
    lastHeartbeat: new Date().toISOString()
  },
  {
    id: 'dev-2',
    name: 'Command Laptop (MacBook Pro M3)',
    platform: 'macOS Sonoma',
    browser: 'Chrome 122',
    ipAddress: '192.168.1.10',
    isOnline: true,
    gpsEnabled: true,
    audioEnabled: false,
    cameraEnabled: false,
    lastHeartbeat: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'dev-3',
    name: 'Dispatch Tablet (iPad Air)',
    platform: 'iPadOS 17',
    browser: 'Safari Mobile',
    ipAddress: '10.0.0.88',
    isOnline: false,
    gpsEnabled: true,
    audioEnabled: true,
    cameraEnabled: false,
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString()
  }
];

const INITIAL_USERS = [
  { id: 'usr-1', email: 'admin@monitoring.local', fullName: 'Super Administrator', role: 'ROLE_MASTER_ADMIN', status: 'ACTIVE', organizationName: 'Global HQ' },
  { id: 'usr-2', email: 'orgadmin@acme.local', fullName: 'Acme Org Admin', role: 'ROLE_ORG_ADMIN', status: 'ACTIVE', organizationName: 'Acme Operations' },
  { id: 'usr-3', email: 'operator@acme.local', fullName: 'Field Operator Jatin', role: 'ROLE_USER', status: 'ACTIVE', organizationName: 'Acme Operations' }
];

const INITIAL_CONSENTS = [
  { id: 'c-1', deviceName: 'Field Unit Alpha', capability: 'LOCATION', userEmail: 'operator@acme.local', status: 'GRANTED', grantedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'c-2', deviceName: 'Field Unit Alpha', capability: 'CAMERA', userEmail: 'operator@acme.local', status: 'GRANTED', grantedAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'c-3', deviceName: 'Command Laptop', capability: 'AUDIO', userEmail: 'admin@monitoring.local', status: 'REVOKED', grantedAt: new Date(Date.now() - 172800000).toISOString(), revokedAt: new Date(Date.now() - 86400000).toISOString() }
];

const INITIAL_AUDITS = [
  { id: 'aud-1', action: 'SESSION_LOGIN', details: 'User admin@monitoring.local authenticated via JWT', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'aud-2', action: 'MODULE_TOGGLE', details: 'Master Admin enabled Dynamic Camera Module system-wide', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'aud-3', action: 'DEVICE_REGISTER', details: 'New device enrolled with hardware beacon #dev-1', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'aud-4', action: 'CONSENT_GRANTED', details: 'Explicit camera & location permission accepted by operator', createdAt: new Date(Date.now() - 90000000).toISOString() }
];

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    // ignore
  }
}

export function handleMockRequest(url, method = 'GET', data = null) {
  const cleanUrl = url.replace(/^\/api\/v1/, '').split('?')[0];

  // Auth: Login
  if (cleanUrl === '/auth/login' && method.toUpperCase() === 'POST') {
    const email = data?.email || 'admin@monitoring.local';
    const isMaster = email.includes('admin@monitoring');
    const isOrg = email.includes('orgadmin');
    const role = isMaster ? 'ROLE_MASTER_ADMIN' : isOrg ? 'ROLE_ORG_ADMIN' : 'ROLE_USER';
    const fullName = isMaster ? 'Master Administrator' : isOrg ? 'Tenant Org Admin' : 'Field Operator Jatin';

    return {
      success: true,
      data: {
        accessToken: 'mock-jwt-token-ghpages-' + Date.now(),
        refreshToken: 'mock-refresh-token-ghpages-' + Date.now(),
        userId: 'usr-' + (isMaster ? '1' : isOrg ? '2' : '3'),
        email,
        fullName,
        role,
        organizationId: 'org-1',
        organizationName: 'Aegis Sentinel Global',
        activeSessionCount: 3,
        isDemoMode: true
      }
    };
  }

  // Auth: /auth/me
  if (cleanUrl === '/auth/me') {
    const user = getStored('monitoring_user', {
      userId: 'usr-1',
      email: 'admin@monitoring.local',
      fullName: 'Master Administrator',
      role: 'ROLE_MASTER_ADMIN',
      organizationId: 'org-1',
      organizationName: 'Aegis Sentinel Global'
    });
    return { success: true, data: user };
  }

  // Auth: Register
  if (cleanUrl === '/auth/register' && method.toUpperCase() === 'POST') {
    return {
      success: true,
      data: {
        accessToken: 'mock-jwt-token-ghpages-' + Date.now(),
        refreshToken: 'mock-refresh-token-ghpages-' + Date.now(),
        userId: 'usr-new-' + Date.now(),
        email: data?.adminEmail || 'new@company.com',
        fullName: data?.adminFullName || 'New Admin',
        role: 'ROLE_ORG_ADMIN',
        organizationId: 'org-new',
        organizationName: data?.organizationName || 'New Company Corp',
        isDemoMode: true
      }
    };
  }

  // Modules: List
  if (cleanUrl === '/modules' || cleanUrl === '/admin/modules') {
    const modules = getStored(MOCK_STORAGE_KEY_MODULES, INITIAL_MODULES);
    return { success: true, data: modules };
  }

  // Modules: Toggle status
  if (cleanUrl.match(/\/admin\/modules\/.*\/status/)) {
    const modules = getStored(MOCK_STORAGE_KEY_MODULES, INITIAL_MODULES);
    const id = cleanUrl.split('/')[3];
    const isEnabled = url.includes('enabled=true');
    const updated = modules.map((m) => (m.id === id || m.moduleKey === id ? { ...m, isEnabled } : m));
    setStored(MOCK_STORAGE_KEY_MODULES, updated);
    return { success: true, data: updated };
  }

  // Dashboard Stats
  if (cleanUrl === '/dashboard/stats') {
    return {
      success: true,
      data: {
        totalUsers: 148,
        activeUsers: 94,
        registeredDevices: 68,
        onlineDevices: 45,
        activeLocationSessions: 18,
        activeAudioSessions: 3,
        activeVideoSessions: 2,
        consentsGranted: 62,
        consentsRevoked: 5,
        pendingInvitations: 3,
        timelineActivity: [
          { day: 'Mon', sessions: 14, locations: 180 },
          { day: 'Tue', sessions: 22, locations: 290 },
          { day: 'Wed', sessions: 19, locations: 240 },
          { day: 'Thu', sessions: 35, locations: 420 },
          { day: 'Fri', sessions: 42, locations: 560 },
          { day: 'Sat', sessions: 28, locations: 340 },
          { day: 'Sun', sessions: 38, locations: 490 }
        ],
        moduleUsage: getStored(MOCK_STORAGE_KEY_MODULES, INITIAL_MODULES).map((m) => ({
          name: m.name,
          key: m.moduleKey,
          enabled: m.isEnabled
        })),
        recentActivity: getStored(MOCK_STORAGE_KEY_AUDITS, INITIAL_AUDITS)
      }
    };
  }

  // Devices
  if (cleanUrl === '/devices') {
    const devices = getStored(MOCK_STORAGE_KEY_DEVICES, INITIAL_DEVICES);
    if (method.toUpperCase() === 'POST') {
      const newDev = {
        id: 'dev-' + Date.now(),
        name: data?.name || 'Local Browser Device',
        platform: data?.platform || navigator.userAgent,
        browser: 'Browser Client',
        ipAddress: '127.0.0.1 (Local)',
        isOnline: true,
        gpsEnabled: true,
        audioEnabled: true,
        cameraEnabled: true,
        lastHeartbeat: new Date().toISOString()
      };
      const updated = [newDev, ...devices];
      setStored(MOCK_STORAGE_KEY_DEVICES, updated);
      return { success: true, data: newDev };
    }
    return { success: true, data: devices };
  }

  if (cleanUrl.match(/\/devices\/.*\/revoke/)) {
    const devices = getStored(MOCK_STORAGE_KEY_DEVICES, INITIAL_DEVICES);
    const id = cleanUrl.split('/')[2];
    const updated = devices.filter((d) => d.id !== id);
    setStored(MOCK_STORAGE_KEY_DEVICES, updated);
    return { success: true, data: { message: 'Device revoked' } };
  }

  // Location sessions
  if (cleanUrl === '/location/sessions') {
    return {
      success: true,
      data: {
        id: 'session-' + Date.now(),
        sessionToken: 'token-' + Math.random().toString(36).substring(7),
        status: 'ACTIVE',
        startedAt: new Date().toISOString()
      }
    };
  }

  if (cleanUrl.match(/\/location\/sessions\/.*\/history/)) {
    return {
      success: true,
      data: [
        { latitude: 28.6139, longitude: 77.2090, accuracy: 8.5, speed: 2.1, batteryLevel: 88, recordedAt: new Date(Date.now() - 300000).toISOString() },
        { latitude: 28.6145, longitude: 77.2105, accuracy: 7.2, speed: 4.8, batteryLevel: 87, recordedAt: new Date(Date.now() - 240000).toISOString() },
        { latitude: 28.6152, longitude: 77.2120, accuracy: 6.8, speed: 5.2, batteryLevel: 87, recordedAt: new Date(Date.now() - 180000).toISOString() },
        { latitude: 28.6160, longitude: 77.2135, accuracy: 5.5, speed: 6.1, batteryLevel: 86, recordedAt: new Date(Date.now() - 120000).toISOString() },
        { latitude: 28.6171, longitude: 77.2150, accuracy: 5.1, speed: 3.4, batteryLevel: 85, recordedAt: new Date(Date.now() - 60000).toISOString() }
      ]
    };
  }

  if (cleanUrl.match(/\/location\/sessions\/.*\/latest/)) {
    return {
      success: true,
      data: {
        latitude: 28.6171,
        longitude: 77.2150,
        accuracy: 5.1,
        speed: 3.4,
        batteryLevel: 85,
        recordedAt: new Date().toISOString()
      }
    };
  }

  // Users & Organizations
  if (cleanUrl === '/users') {
    return { success: true, data: getStored(MOCK_STORAGE_KEY_USERS, INITIAL_USERS) };
  }

  if (cleanUrl === '/organizations') {
    return {
      success: true,
      data: [
        { id: 'org-1', name: 'Aegis Sentinel Global', tier: 'ENTERPRISE', maxDevices: 100, activeMembers: 12, createdAt: new Date(Date.now() - 31536000000).toISOString() },
        { id: 'org-2', name: 'Acme Operations Fleet', tier: 'PRO', maxDevices: 50, activeMembers: 8, createdAt: new Date(Date.now() - 15536000000).toISOString() }
      ]
    };
  }

  // Consents & Audits
  if (cleanUrl === '/consents') {
    return { success: true, data: getStored(MOCK_STORAGE_KEY_CONSENTS, INITIAL_CONSENTS) };
  }

  if (cleanUrl === '/admin/audit-logs') {
    return { success: true, data: getStored(MOCK_STORAGE_KEY_AUDITS, INITIAL_AUDITS) };
  }

  // Generic success response
  return { success: true, data: {} };
}
