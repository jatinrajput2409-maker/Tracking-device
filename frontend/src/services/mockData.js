// Comprehensive Mock Data & Simulation Engine for GitHub Pages Static Deployment
const MOCK_STORAGE_KEY_MODULES = 'aegis_mock_modules_v2';
const MOCK_STORAGE_KEY_DEVICES = 'aegis_mock_devices';
const MOCK_STORAGE_KEY_LINKS = 'aegis_mock_links';
const MOCK_STORAGE_KEY_USERS = 'aegis_mock_users';
const MOCK_STORAGE_KEY_ORGS = 'aegis_mock_orgs';
const MOCK_STORAGE_KEY_CONSENTS = 'aegis_mock_consents';
const MOCK_STORAGE_KEY_AUDITS = 'aegis_mock_audits';

const ROUTE_MAP = {
  dashboard: '/dashboard',
  location: '/location',
  audio: '/audio',
  camera: '/camera',
  devices: '/devices',
  users: '/users',
  organizations: '/organizations',
  module_config: '/module-management',
  consent: '/consent',
  audit: '/audit-logs'
};

const INITIAL_MODULES = [
  { id: 'm-001', moduleKey: 'dashboard', name: 'Overview Dashboard', isEnabled: true, description: 'System telemetry, KPI charts, activity stream, and health metrics', icon: 'LayoutDashboard', route: '/dashboard' },
  { id: 'm-002', moduleKey: 'location', name: 'Live Location Tracking', isEnabled: true, description: 'Consensual real-time GPS positioning, breadcrumb paths, and geofencing', icon: 'MapPin', route: '/location' },
  { id: 'm-003', moduleKey: 'audio', name: 'Audio Sessions', isEnabled: true, description: 'WebRTC encrypted voice communication with explicit consent and status indicator', icon: 'Mic', route: '/audio' },
  { id: 'm-004', moduleKey: 'camera', name: 'Camera Sessions', isEnabled: true, description: 'Front/rear WebRTC camera feed streaming with clear active-session consent', icon: 'Camera', route: '/camera' },
  { id: 'm-005', moduleKey: 'devices', name: 'Device Management', isEnabled: true, description: 'Inspect authorized hardware, browsers, verification status, and revoke access', icon: 'Smartphone', route: '/devices' },
  { id: 'm-006', moduleKey: 'users', name: 'User Management', isEnabled: true, description: 'Directory of users, invitations, organization binding, and role assignment', icon: 'Users', route: '/users' },
  { id: 'm-007', moduleKey: 'organizations', name: 'Organizations', isEnabled: true, description: 'Multi-tenant organization structures, quota plans, and tier management', icon: 'Building2', route: '/organizations' },
  { id: 'm-008', moduleKey: 'module_config', name: 'Dynamic Modules', isEnabled: true, description: 'Runtime activation, role restrictions, and plan entitlement controls', icon: 'Cpu', route: '/module-management' },
  { id: 'm-009', moduleKey: 'consent', name: 'Consent Records', isEnabled: true, description: 'GDPR/CCPA immutable consent audit trail, purpose logging, and revocation history', icon: 'ShieldCheck', route: '/consent' },
  { id: 'm-010', moduleKey: 'audit', name: 'Audit Logs', isEnabled: true, description: 'Tamper-evident administrative activity logs, security alerts, and event history', icon: 'FileText', route: '/audit-logs' }
];

const INITIAL_DEVICES = [
  {
    id: 'dev-101',
    name: 'Field Patrol Unit Alpha (Pixel 8)',
    platform: 'Android 14 (ARM64)',
    browser: 'Chrome Mobile 122',
    ipAddress: '192.168.1.104',
    isOnline: true,
    gpsEnabled: true,
    audioEnabled: true,
    cameraEnabled: true,
    lastHeartbeat: new Date().toISOString()
  },
  {
    id: 'dev-102',
    name: 'Command Laptop (MacBook Pro M3)',
    platform: 'macOS Sonoma (Darwin)',
    browser: 'Chrome 122 (Desktop)',
    ipAddress: '192.168.1.10',
    isOnline: true,
    gpsEnabled: true,
    audioEnabled: false,
    cameraEnabled: false,
    lastHeartbeat: new Date(Date.now() - 45000).toISOString()
  },
  {
    id: 'dev-103',
    name: 'Emergency Dispatch Tablet (iPad Air)',
    platform: 'iPadOS 17',
    browser: 'Safari Mobile 17',
    ipAddress: '10.0.0.88',
    isOnline: false,
    gpsEnabled: true,
    audioEnabled: true,
    cameraEnabled: false,
    lastHeartbeat: new Date(Date.now() - 3600000).toISOString()
  }
];

const INITIAL_LINKS = [
  {
    id: 'lnk-01',
    token: 'tok-fleet-alpha-99',
    devicePresetName: 'Operator Tablet #4',
    locationRequested: true,
    audioRequested: false,
    cameraRequested: true,
    isClaimed: false,
    expiresAt: new Date(Date.now() + 86400000 * 6).toISOString()
  }
];

const INITIAL_USERS = [
  { id: 'usr-1', email: 'admin@monitoring.local', fullName: 'Master Platform Admin', role: 'ROLE_MASTER_ADMIN', status: 'ACTIVE', organizationName: 'Global Operations HQ' },
  { id: 'usr-2', email: 'orgadmin@acme.local', fullName: 'Acme Org Administrator', role: 'ROLE_ORG_ADMIN', status: 'ACTIVE', organizationName: 'Acme Operations Fleet' },
  { id: 'usr-3', email: 'operator@acme.local', fullName: 'Field Operator Jatin', role: 'ROLE_USER', status: 'ACTIVE', organizationName: 'Acme Operations Fleet' }
];

const INITIAL_ORGS = [
  { id: 'org-1', name: 'Global Operations HQ', slug: 'global-ops', subscriptionPlan: 'ENTERPRISE', maxDevices: 100, maxUsers: 200, status: 'ACTIVE', createdAt: new Date(Date.now() - 31536000000).toISOString() },
  { id: 'org-2', name: 'Acme Operations Fleet', slug: 'acme-ops', subscriptionPlan: 'PRO', maxDevices: 50, maxUsers: 50, status: 'ACTIVE', createdAt: new Date(Date.now() - 15536000000).toISOString() }
];

const INITIAL_CONSENTS = [
  { id: 'c-1', deviceName: 'Field Patrol Unit Alpha (Pixel 8)', capability: 'LOCATION', userEmail: 'operator@acme.local', status: 'GRANTED', grantedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'c-2', deviceName: 'Field Patrol Unit Alpha (Pixel 8)', capability: 'CAMERA', userEmail: 'operator@acme.local', status: 'GRANTED', grantedAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'c-3', deviceName: 'Command Laptop (MacBook Pro M3)', capability: 'AUDIO', userEmail: 'admin@monitoring.local', status: 'REVOKED', grantedAt: new Date(Date.now() - 172800000).toISOString(), revokedAt: new Date(Date.now() - 86400000).toISOString() }
];

const INITIAL_AUDITS = [
  { id: 'aud-1', action: 'SESSION_LOGIN', details: 'User admin@monitoring.local authenticated via JWT token', userEmail: 'admin@monitoring.local', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'aud-2', action: 'MODULE_TOGGLE', details: 'Master Admin enabled Dynamic Camera Module system-wide', userEmail: 'admin@monitoring.local', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'aud-3', action: 'DEVICE_REGISTER', details: 'New device enrolled with hardware beacon #dev-101', userEmail: 'operator@acme.local', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'aud-4', action: 'CONSENT_GRANTED', details: 'Explicit camera & location permission accepted by operator', userEmail: 'operator@acme.local', createdAt: new Date(Date.now() - 90000000).toISOString() }
];

function getStored(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    const parsed = JSON.parse(val);
    // If it's modules, ensure every module has a route
    if (key === MOCK_STORAGE_KEY_MODULES && Array.isArray(parsed)) {
      return parsed.map((m) => ({
        ...m,
        route: m.route || ROUTE_MAP[m.moduleKey] || `/${m.moduleKey}`
      }));
    }
    return parsed;
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
    const fullName = isMaster ? 'Master Platform Admin' : isOrg ? 'Acme Org Administrator' : 'Field Operator Jatin';

    return {
      success: true,
      data: {
        accessToken: 'mock-jwt-token-ghpages-' + Date.now(),
        refreshToken: 'mock-refresh-token-ghpages-' + Date.now(),
        userId: 'usr-' + (isMaster ? '1' : isOrg ? '2' : '3'),
        email,
        fullName,
        role,
        organizationId: isMaster ? 'org-1' : 'org-2',
        organizationName: isMaster ? 'Global Operations HQ' : 'Acme Operations Fleet',
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
      fullName: 'Master Platform Admin',
      role: 'ROLE_MASTER_ADMIN',
      organizationId: 'org-1',
      organizationName: 'Global Operations HQ'
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
        fullName: data?.adminFullName || 'New Administrator',
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

  // Devices & Enrollment Links
  if (cleanUrl === '/devices/enrollment-links') {
    const links = getStored(MOCK_STORAGE_KEY_LINKS, INITIAL_LINKS);
    if (method.toUpperCase() === 'POST') {
      const newLink = {
        id: 'lnk-' + Date.now(),
        token: 'tok-' + Math.random().toString(36).substring(2, 10),
        devicePresetName: data?.devicePresetName || 'Mobile Operator Device',
        locationRequested: data?.locationRequested !== false,
        audioRequested: !!data?.audioRequested,
        cameraRequested: !!data?.cameraRequested,
        isClaimed: false,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
      };
      const updated = [newLink, ...links];
      setStored(MOCK_STORAGE_KEY_LINKS, updated);
      return { success: true, data: newLink };
    }
    return { success: true, data: links };
  }

  // Enrollment Link Verification (Public, no login needed)
  if (cleanUrl.match(/\/devices\/enrollment-links\/verify\/[^\/]+$/) && method.toUpperCase() === 'GET') {
    const parts = cleanUrl.split('/');
    const token = parts[parts.length - 1];
    const links = getStored(MOCK_STORAGE_KEY_LINKS, INITIAL_LINKS);
    const found = links.find((l) => l.token === token) || {
      id: 'lnk-' + token,
      token,
      devicePresetName: 'Remote Mobile Device',
      locationRequested: true,
      audioRequested: true,
      cameraRequested: true
    };
    return {
      success: true,
      data: {
        id: found.id,
        token: found.token,
        deviceNamePreset: found.devicePresetName || 'Remote Mobile Device',
        requestLocation: found.locationRequested !== false,
        requestAudio: !!found.audioRequested,
        requestCamera: !!found.cameraRequested,
        organizationName: 'Global Operations Fleet'
      }
    };
  }

  // Enrollment Link Claim (Authorized by user, hardware beacon registered)
  if (cleanUrl.match(/\/devices\/enrollment-links\/verify\/.*\/claim/) && method.toUpperCase() === 'POST') {
    const devices = getStored(MOCK_STORAGE_KEY_DEVICES, INITIAL_DEVICES);
    const newDevice = {
      id: 'dev-' + Date.now(),
      deviceName: data?.customDeviceName || 'Remote Mobile Device',
      name: data?.customDeviceName || 'Remote Mobile Device',
      platform: data?.platform || 'Smartphone',
      browser: data?.browser || 'Mobile Browser',
      ipAddress: '192.168.1.188 (Remote Mobile)',
      isOnline: true,
      gpsEnabled: data?.consentLocation !== false,
      locationPermissionGranted: data?.consentLocation !== false,
      audioEnabled: !!data?.consentAudio,
      audioPermissionGranted: !!data?.consentAudio,
      cameraEnabled: !!data?.consentCamera,
      cameraPermissionGranted: !!data?.consentCamera,
      lastHeartbeat: new Date().toISOString()
    };
    const updated = [newDevice, ...devices];
    setStored(MOCK_STORAGE_KEY_DEVICES, updated);
    return {
      success: true,
      data: newDevice
    };
  }

  if (cleanUrl === '/devices') {
    const devices = getStored(MOCK_STORAGE_KEY_DEVICES, INITIAL_DEVICES);
    if (method.toUpperCase() === 'POST') {
      const newDev = {
        id: 'dev-' + Date.now(),
        name: data?.name || 'Local Browser Device',
        platform: data?.platform || navigator.userAgent,
        browser: 'Chrome / WebKit',
        ipAddress: '127.0.0.1 (Local)',
        isOnline: true,
        gpsEnabled: data?.gpsEnabled !== false,
        audioEnabled: !!data?.audioEnabled,
        cameraEnabled: !!data?.cameraEnabled,
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

  if (cleanUrl.match(/\/devices\/.*\/permissions/)) {
    const devices = getStored(MOCK_STORAGE_KEY_DEVICES, INITIAL_DEVICES);
    const id = cleanUrl.split('/')[2];
    const updated = devices.map((d) => (d.id === id ? { ...d, ...data } : d));
    setStored(MOCK_STORAGE_KEY_DEVICES, updated);
    return { success: true, data: { message: 'Permissions updated' } };
  }

  // Location Sessions & Telemetry
  if (cleanUrl === '/location/sessions') {
    return {
      success: true,
      data: {
        id: 'loc-sess-' + Date.now(),
        sessionToken: 'token-' + Math.random().toString(36).substring(7),
        status: 'ACTIVE',
        startedAt: new Date().toISOString()
      }
    };
  }

  if (cleanUrl.match(/\/location\/sessions\/.*\/updates/)) {
    return {
      success: true,
      data: {
        latitude: data?.latitude || 28.6139,
        longitude: data?.longitude || 77.2090,
        accuracy: data?.accuracy || 4.2,
        altitude: data?.altitude || 21.0,
        speed: data?.speed || 2.4,
        heading: data?.heading || 120.0,
        batteryLevel: data?.batteryLevel || 92.0,
        recordedAt: new Date().toISOString()
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

  if (cleanUrl.match(/\/location\/sessions\/.*\/stop/)) {
    return { success: true, data: { message: 'Session stopped' } };
  }

  // Media Sessions (Audio & Camera)
  if (cleanUrl === '/media/sessions') {
    return {
      success: true,
      data: {
        id: 'media-' + Date.now(),
        sessionType: data?.sessionType || 'AUDIO',
        status: 'INITIALIZED',
        createdAt: new Date().toISOString()
      }
    };
  }

  if (cleanUrl.match(/\/media\/sessions\/.*\/consent/)) {
    return { success: true, data: { message: 'Consent acknowledged' } };
  }

  if (cleanUrl.match(/\/media\/sessions\/.*\/terminate/)) {
    return { success: true, data: { message: 'Media session terminated' } };
  }

  if (cleanUrl.match(/\/media\/sessions\/.*\/signaling/)) {
    return { success: true, data: { message: 'Signal relayed' } };
  }

  // Users Management
  if (cleanUrl === '/users') {
    const users = getStored(MOCK_STORAGE_KEY_USERS, INITIAL_USERS);
    return {
      success: true,
      data: {
        content: users,
        totalElements: users.length,
        totalPages: 1,
        page: 0
      }
    };
  }

  if (cleanUrl === '/users/invite' && method.toUpperCase() === 'POST') {
    const users = getStored(MOCK_STORAGE_KEY_USERS, INITIAL_USERS);
    const newInvited = {
      id: 'usr-' + Date.now(),
      email: data?.email || 'newuser@acme.local',
      fullName: 'Invited Operator',
      role: data?.role || 'ROLE_USER',
      status: 'INVITED',
      organizationName: 'Acme Operations Fleet'
    };
    const updated = [...users, newInvited];
    setStored(MOCK_STORAGE_KEY_USERS, updated);
    return {
      success: true,
      data: {
        token: 'inv-tok-' + Math.random().toString(36).substring(2, 12),
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
      }
    };
  }

  // Organizations
  if (cleanUrl === '/organizations' || cleanUrl === '/admin/organizations') {
    const orgs = getStored(MOCK_STORAGE_KEY_ORGS, INITIAL_ORGS);
    if (method.toUpperCase() === 'POST') {
      const newOrg = {
        id: 'org-' + Date.now(),
        name: data?.name || 'New Enterprise Org',
        slug: data?.slug || 'new-org',
        subscriptionPlan: data?.subscriptionPlan || 'PRO',
        maxDevices: Number(data?.maxDevices || 25),
        maxUsers: Number(data?.maxUsers || 50),
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      };
      const updated = [...orgs, newOrg];
      setStored(MOCK_STORAGE_KEY_ORGS, updated);
      return { success: true, data: newOrg };
    }
    return { success: true, data: orgs };
  }

  // Consents
  if (cleanUrl === '/consents') {
    const consents = getStored(MOCK_STORAGE_KEY_CONSENTS, INITIAL_CONSENTS);
    return { success: true, data: consents };
  }

  if (cleanUrl.match(/\/consents\/.*/)) {
    const consents = getStored(MOCK_STORAGE_KEY_CONSENTS, INITIAL_CONSENTS);
    const id = cleanUrl.split('/')[2];
    const updated = consents.filter((c) => c.id !== id);
    setStored(MOCK_STORAGE_KEY_CONSENTS, updated);
    return { success: true, data: { message: 'Consent revoked' } };
  }

  // Audit Logs
  if (cleanUrl === '/admin/audit-logs') {
    const audits = getStored(MOCK_STORAGE_KEY_AUDITS, INITIAL_AUDITS);
    return {
      success: true,
      data: {
        content: audits,
        totalElements: audits.length,
        totalPages: 1,
        page: 0
      }
    };
  }

  // Generic fallback
  return { success: true, data: {} };
}
