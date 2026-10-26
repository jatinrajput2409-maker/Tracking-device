-- ==============================================================================
-- Flyway Database Migration: V2 Seed Data
-- ==============================================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
('r-1001', 'ROLE_MASTER_ADMIN', 'Master Administrator with unrestricted platform-wide privileges'),
('r-1002', 'ROLE_ORG_ADMIN', 'Organization Administrator managing scoped tenant members and devices'),
('r-1003', 'ROLE_USER', 'Standard User with self-device management and authorized module access')
ON CONFLICT (id) DO NOTHING;

-- Dynamic Modules Configuration
INSERT INTO modules (id, module_key, name, description, icon, route, is_enabled, required_subscription, min_role_level, display_order) VALUES
('m-001', 'dashboard', 'Overview Dashboard', 'System telemetry, KPI charts, activity stream, and health metrics', 'LayoutDashboard', '/dashboard', true, 'FREE', 'ROLE_USER', 1),
('m-002', 'location', 'Live Location Tracking', 'Consensual real-time GPS positioning, breadcrumb paths, and geofencing', 'MapPin', '/location', true, 'FREE', 'ROLE_USER', 2),
('m-003', 'audio', 'Audio Sessions', 'WebRTC encrypted voice communication with explicit consent and status indicator', 'Mic', '/audio', true, 'PRO', 'ROLE_USER', 3),
('m-004', 'camera', 'Camera Sessions', 'Front/rear WebRTC camera feed streaming with clear active-session consent', 'Camera', '/camera', true, 'PRO', 'ROLE_USER', 4),
('m-005', 'devices', 'Device Management', 'Inspect authorized hardware, browsers, verification status, and revoke access', 'Smartphone', '/devices', true, 'FREE', 'ROLE_USER', 5),
('m-006', 'users', 'User Management', 'Directory of users, invitations, organization binding, and role assignment', 'Users', '/users', true, 'FREE', 'ROLE_ORG_ADMIN', 6),
('m-007', 'organizations', 'Organizations', 'Multi-tenant organization structures, quota plans, and tier management', 'Building2', '/organizations', true, 'FREE', 'ROLE_MASTER_ADMIN', 7),
('m-008', 'module_config', 'Dynamic Modules', 'Runtime activation, role restrictions, and plan entitlement controls', 'Cpu', '/module-management', true, 'FREE', 'ROLE_MASTER_ADMIN', 8),
('m-009', 'consent', 'Consent Records', 'GDPR/CCPA immutable consent audit trail, purpose logging, and revocation history', 'ShieldCheck', '/consent', true, 'FREE', 'ROLE_USER', 9),
('m-010', 'audit', 'Audit Logs', 'Tamper-evident administrative activity logs, security alerts, and event history', 'FileText', '/audit-logs', true, 'FREE', 'ROLE_ORG_ADMIN', 10)
ON CONFLICT (id) DO NOTHING;

-- Default Master Admin User (Password: Admin@123456 -> $2a$10$w8k2rV4Xz7m7122hMlhjceN9f/Y3y4.QpW4q.u43.3d1209355746 or standard BCrypt)
-- BCrypt for Admin@123456: $2a$10$e8wF5i87iB8R7R.0G4u88.hE79W63uYk9xK.oY8t7g0E7pX0i.Zq.
-- Note: In DataInitializer, we also check and re-encode if needed to guarantee instant login.
INSERT INTO users (id, email, password_hash, first_name, last_name, phone_number, role_id, status, email_verified, privacy_policy_accepted) VALUES
('u-001', 'admin@monitoring.local', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00GDNZ.QXNXmyW', 'Master', 'Administrator', '+15550100', 'r-1001', 'ACTIVE', true, true)
ON CONFLICT (id) DO NOTHING;

-- Default Demo Organization
INSERT INTO organizations (id, name, slug, subscription_plan, max_devices, max_users, status) VALUES
('org-001', 'Acme Global Operations', 'acme-global', 'ENTERPRISE', 50, 100, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
