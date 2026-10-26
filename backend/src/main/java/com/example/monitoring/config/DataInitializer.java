package com.example.monitoring.config;

import com.example.monitoring.devices.Device;
import com.example.monitoring.devices.DeviceRepository;
import com.example.monitoring.modules.ModuleConfig;
import com.example.monitoring.modules.ModuleRepository;
import com.example.monitoring.organizations.Organization;
import com.example.monitoring.organizations.OrganizationMember;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.organizations.OrganizationRepository;
import com.example.monitoring.roles.Role;
import com.example.monitoring.roles.RoleRepository;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ModuleRepository moduleRepository;
    private final DeviceRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing system seed data if not present...");

        // 1. Seed Roles
        Role adminRole = roleRepository.findByName("ROLE_MASTER_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .id("r-1001")
                        .name("ROLE_MASTER_ADMIN")
                        .description("Master Administrator with unrestricted platform-wide privileges")
                        .build()));

        Role orgAdminRole = roleRepository.findByName("ROLE_ORG_ADMIN").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .id("r-1002")
                        .name("ROLE_ORG_ADMIN")
                        .description("Organization Administrator managing scoped tenant members and devices")
                        .build()));

        Role userRole = roleRepository.findByName("ROLE_USER").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .id("r-1003")
                        .name("ROLE_USER")
                        .description("Standard User with self-device management and authorized module access")
                        .build()));

        // 2. Seed Dynamic Modules
        seedModule("dashboard", "Overview Dashboard", "System telemetry, KPI charts, activity stream, and health metrics", "LayoutDashboard", "/dashboard", true, "FREE", "ROLE_USER", 1);
        seedModule("location", "Live Location Tracking", "Consensual real-time GPS positioning, breadcrumb paths, and geofencing", "MapPin", "/location", true, "FREE", "ROLE_USER", 2);
        seedModule("audio", "Audio Sessions", "WebRTC encrypted voice communication with explicit consent and status indicator", "Mic", "/audio", true, "PRO", "ROLE_USER", 3);
        seedModule("camera", "Camera Sessions", "Front/rear WebRTC camera feed streaming with clear active-session consent", "Camera", "/camera", true, "PRO", "ROLE_USER", 4);
        seedModule("devices", "Device Management", "Inspect authorized hardware, browsers, verification status, and revoke access", "Smartphone", "/devices", true, "FREE", "ROLE_USER", 5);
        seedModule("users", "User Management", "Directory of users, invitations, organization binding, and role assignment", "Users", "/users", true, "FREE", "ROLE_ORG_ADMIN", 6);
        seedModule("organizations", "Organizations", "Multi-tenant organization structures, quota plans, and tier management", "Building2", "/organizations", true, "FREE", "ROLE_MASTER_ADMIN", 7);
        seedModule("module_config", "Dynamic Modules", "Runtime activation, role restrictions, and plan entitlement controls", "Cpu", "/module-management", true, "FREE", "ROLE_MASTER_ADMIN", 8);
        seedModule("consent", "Consent Records", "GDPR/CCPA immutable consent audit trail, purpose logging, and revocation history", "ShieldCheck", "/consent", true, "FREE", "ROLE_USER", 9);
        seedModule("audit", "Audit Logs", "Tamper-evident administrative activity logs, security alerts, and event history", "FileText", "/audit-logs", true, "FREE", "ROLE_ORG_ADMIN", 10);

        // 3. Seed Organization
        Organization demoOrg = organizationRepository.findBySlug("acme-global").orElseGet(() ->
                organizationRepository.save(Organization.builder()
                        .id("org-001")
                        .name("Acme Global Operations")
                        .slug("acme-global")
                        .subscriptionPlan("ENTERPRISE")
                        .maxDevices(50)
                        .maxUsers(100)
                        .status("ACTIVE")
                        .build()));

        // 4. Seed Master Admin User
        User masterAdmin = userRepository.findByEmail("admin@monitoring.local").orElseGet(() ->
                userRepository.save(User.builder()
                        .id("u-001")
                        .email("admin@monitoring.local")
                        .passwordHash(passwordEncoder.encode("Admin@123456"))
                        .firstName("Master")
                        .lastName("Administrator")
                        .phoneNumber("+15550100")
                        .role(adminRole)
                        .status("ACTIVE")
                        .emailVerified(true)
                        .privacyPolicyAccepted(true)
                        .privacyPolicyAcceptedAt(Instant.now())
                        .build()));

        // 5. Seed Org Admin User
        User orgAdmin = userRepository.findByEmail("orgadmin@acme.local").orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .id("u-002")
                    .email("orgadmin@acme.local")
                    .passwordHash(passwordEncoder.encode("OrgAdmin@123456"))
                    .firstName("Sarah")
                    .lastName("Connor")
                    .phoneNumber("+15550101")
                    .role(orgAdminRole)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .privacyPolicyAccepted(true)
                    .privacyPolicyAcceptedAt(Instant.now())
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .id(UUID.randomUUID().toString())
                    .organization(demoOrg)
                    .user(u)
                    .orgRole("ORG_ADMIN")
                    .build());
            return u;
        });

        // 6. Seed Standard Field User
        User standardUser = userRepository.findByEmail("operator@acme.local").orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .id("u-003")
                    .email("operator@acme.local")
                    .passwordHash(passwordEncoder.encode("User@123456"))
                    .firstName("Alex")
                    .lastName("Mercer")
                    .phoneNumber("+15550102")
                    .role(userRole)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .privacyPolicyAccepted(true)
                    .privacyPolicyAcceptedAt(Instant.now())
                    .build());

            organizationMemberRepository.save(OrganizationMember.builder()
                    .id(UUID.randomUUID().toString())
                    .organization(demoOrg)
                    .user(u)
                    .orgRole("MEMBER")
                    .build());
            return u;
        });

        // 7. Seed Sample Devices
        if (deviceRepository.count() == 0) {
            deviceRepository.save(Device.builder()
                    .id("dev-001")
                    .user(masterAdmin)
                    .deviceName("Admin Workstation (Chrome Windows)")
                    .deviceType("DESKTOP")
                    .platform("Windows 11 Pro")
                    .browser("Chrome 122.0.0")
                    .ipAddress("192.168.1.100")
                    .status("VERIFIED")
                    .isOnline(true)
                    .locationPermissionGranted(true)
                    .audioPermissionGranted(true)
                    .cameraPermissionGranted(true)
                    .lastActiveAt(Instant.now())
                    .build());

            deviceRepository.save(Device.builder()
                    .id("dev-002")
                    .user(standardUser)
                    .deviceName("Field Inspector Pixel 8")
                    .deviceType("MOBILE_ANDROID")
                    .platform("Android 14")
                    .browser("Chrome Mobile")
                    .ipAddress("172.56.21.84")
                    .status("VERIFIED")
                    .isOnline(true)
                    .locationPermissionGranted(true)
                    .audioPermissionGranted(false)
                    .cameraPermissionGranted(true)
                    .lastActiveAt(Instant.now())
                    .build());
        }

        log.info("Seed data initialization complete.");
    }

    private void seedModule(String key, String name, String desc, String icon, String route,
                            boolean enabled, String sub, String minRole, int order) {
        if (moduleRepository.findByModuleKey(key).isEmpty()) {
            moduleRepository.save(ModuleConfig.builder()
                    .id("m-" + key)
                    .moduleKey(key)
                    .name(name)
                    .description(desc)
                    .icon(icon)
                    .route(route)
                    .isEnabled(enabled)
                    .requiredSubscription(sub)
                    .minRoleLevel(minRole)
                    .displayOrder(order)
                    .build());
        }
    }
}
