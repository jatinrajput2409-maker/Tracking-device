package com.example.monitoring.devices;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.common.exception.UnauthorizedException;
import com.example.monitoring.consent.ConsentRecord;
import com.example.monitoring.consent.ConsentRepository;
import com.example.monitoring.devices.dto.ClaimEnrollmentLinkRequest;
import com.example.monitoring.devices.dto.CreateEnrollmentLinkRequest;
import com.example.monitoring.devices.dto.DeviceRegistrationRequest;
import com.example.monitoring.devices.dto.EnrollmentLinkDto;
import com.example.monitoring.organizations.Organization;
import com.example.monitoring.organizations.OrganizationMember;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeviceEnrollmentTokenRepository enrollmentTokenRepository;
    private final UserRepository userRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ConsentRepository consentRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Device> getDevicesForUser(UserPrincipal currentUser) {
        if ("ROLE_MASTER_ADMIN".equals(currentUser.getRoleName())) {
            return deviceRepository.findAll();
        }
        return deviceRepository.findByUserId(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Page<Device> getAllDevices(Pageable pageable) {
        return deviceRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Device getDeviceById(String id, UserPrincipal currentUser) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found with id: " + id));

        if (!"ROLE_MASTER_ADMIN".equals(currentUser.getRoleName()) &&
                !device.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Unauthorized access to this device record.");
        }

        return device;
    }

    @Transactional
    public Device registerDevice(DeviceRegistrationRequest request, UserPrincipal currentUser, String ipAddress, String userAgent) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        Device device = Device.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .deviceName(request.getDeviceName())
                .deviceType(request.getDeviceType() != null ? request.getDeviceType() : "BROWSER")
                .platform(request.getPlatform())
                .browser(request.getBrowser())
                .ipAddress(ipAddress)
                .status("VERIFIED")
                .isOnline(true)
                .locationPermissionGranted(Boolean.TRUE.equals(request.getLocationPermission()))
                .audioPermissionGranted(Boolean.TRUE.equals(request.getAudioPermission()))
                .cameraPermissionGranted(Boolean.TRUE.equals(request.getCameraPermission()))
                .lastActiveAt(Instant.now())
                .build();

        device = deviceRepository.save(device);

        // Record consent logs if permissions granted
        if (Boolean.TRUE.equals(request.getLocationPermission())) {
            logConsent(user, device, "LOCATION_SHARING", true, ipAddress, userAgent);
        }
        if (Boolean.TRUE.equals(request.getAudioPermission())) {
            logConsent(user, device, "AUDIO_ACCESS", true, ipAddress, userAgent);
        }
        if (Boolean.TRUE.equals(request.getCameraPermission())) {
            logConsent(user, device, "CAMERA_ACCESS", true, ipAddress, userAgent);
        }

        auditService.logAction(user, "DEVICE_REGISTERED", "Device", device.getId(),
                "Registered device '" + device.getDeviceName() + "' (" + device.getPlatform() + ")", ipAddress);

        return device;
    }

    // =========================================================================
    // Device Pairing & Remote Enrollment Links
    // =========================================================================

    @Transactional
    public EnrollmentLinkDto createEnrollmentLink(CreateEnrollmentLinkRequest request, UserPrincipal currentUser, String ipAddress) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getId()));

        List<OrganizationMember> members = organizationMemberRepository.findByUserId(user.getId());
        Organization org = members.isEmpty() ? null : members.get(0).getOrganization();

        int hours = request.getExpirationHours() != null && request.getExpirationHours() > 0
                ? request.getExpirationHours() : 24;

        String token = "dev-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        DeviceEnrollmentToken enrollmentToken = DeviceEnrollmentToken.builder()
                .id(UUID.randomUUID().toString())
                .createdBy(user)
                .organization(org)
                .token(token)
                .deviceNamePreset(request.getDeviceNamePreset() != null && !request.getDeviceNamePreset().isBlank()
                        ? request.getDeviceNamePreset() : "Field Monitored Endpoint")
                .requestLocation(request.getRequestLocation() != null ? request.getRequestLocation() : true)
                .requestAudio(request.getRequestAudio() != null ? request.getRequestAudio() : false)
                .requestCamera(request.getRequestCamera() != null ? request.getRequestCamera() : false)
                .status("PENDING")
                .expiresAt(Instant.now().plus(hours, ChronoUnit.HOURS))
                .build();

        enrollmentToken = enrollmentTokenRepository.save(enrollmentToken);

        auditService.logAction(user, "DEVICE_LINK_GENERATED", "DeviceEnrollmentToken", enrollmentToken.getId(),
                "Generated device enrollment link for '" + enrollmentToken.getDeviceNamePreset() + "'", ipAddress);

        return mapToEnrollmentDto(enrollmentToken);
    }

    @Transactional(readOnly = true)
    public EnrollmentLinkDto getEnrollmentLink(String token) {
        DeviceEnrollmentToken enrollmentToken = enrollmentTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized device pairing link."));

        if (!"PENDING".equalsIgnoreCase(enrollmentToken.getStatus())) {
            throw new BadRequestException("This device pairing link has already been " + enrollmentToken.getStatus().toLowerCase() + ".");
        }

        if (enrollmentToken.getExpiresAt().isBefore(Instant.now())) {
            enrollmentToken.setStatus("EXPIRED");
            enrollmentTokenRepository.save(enrollmentToken);
            throw new BadRequestException("This device pairing link has expired. Please ask the administrator to generate a new link.");
        }

        return mapToEnrollmentDto(enrollmentToken);
    }

    @Transactional
    public Device claimEnrollmentLink(String token, ClaimEnrollmentLinkRequest request, String ipAddress, String userAgent) {
        DeviceEnrollmentToken enrollmentToken = enrollmentTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized device pairing link."));

        if (!"PENDING".equalsIgnoreCase(enrollmentToken.getStatus())) {
            throw new BadRequestException("This link has already been used or expired.");
        }

        if (enrollmentToken.getExpiresAt().isBefore(Instant.now())) {
            enrollmentToken.setStatus("EXPIRED");
            enrollmentTokenRepository.save(enrollmentToken);
            throw new BadRequestException("This device enrollment link has expired.");
        }

        User owner = enrollmentToken.getCreatedBy();

        String deviceName = request.getCustomDeviceName() != null && !request.getCustomDeviceName().isBlank()
                ? request.getCustomDeviceName() : enrollmentToken.getDeviceNamePreset();

        boolean loc = Boolean.TRUE.equals(request.getConsentLocation());
        boolean audio = Boolean.TRUE.equals(request.getConsentAudio());
        boolean camera = Boolean.TRUE.equals(request.getConsentCamera());

        Device device = Device.builder()
                .id(UUID.randomUUID().toString())
                .user(owner)
                .deviceName(deviceName)
                .deviceType(request.getDeviceType() != null ? request.getDeviceType() : "BROWSER")
                .platform(request.getPlatform() != null ? request.getPlatform() : "Unknown Platform")
                .browser(request.getBrowser() != null ? request.getBrowser() : "Browser")
                .ipAddress(ipAddress)
                .status("VERIFIED")
                .isOnline(true)
                .locationPermissionGranted(loc)
                .audioPermissionGranted(audio)
                .cameraPermissionGranted(camera)
                .lastActiveAt(Instant.now())
                .build();

        device = deviceRepository.save(device);

        // Mark enrollment token as ENROLLED
        enrollmentToken.setStatus("ENROLLED");
        enrollmentToken.setEnrolledDevice(device);
        enrollmentTokenRepository.save(enrollmentToken);

        // Record individual auditable consents
        if (loc) {
            logConsent(owner, device, "LOCATION_SHARING", true, ipAddress, userAgent);
        }
        if (audio) {
            logConsent(owner, device, "AUDIO_ACCESS", true, ipAddress, userAgent);
        }
        if (camera) {
            logConsent(owner, device, "CAMERA_ACCESS", true, ipAddress, userAgent);
        }

        auditService.logAction(owner, "DEVICE_ENROLLED_VIA_LINK", "Device", device.getId(),
                "Device '" + device.getDeviceName() + "' enrolled and verified via remote link", ipAddress);

        return device;
    }

    @Transactional(readOnly = true)
    public List<EnrollmentLinkDto> getEnrollmentLinksForUser(UserPrincipal currentUser) {
        return enrollmentTokenRepository.findByCreatedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::mapToEnrollmentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void revokeEnrollmentLink(String id, UserPrincipal currentUser, String ipAddress) {
        DeviceEnrollmentToken enrollmentToken = enrollmentTokenRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found"));

        enrollmentToken.setStatus("REVOKED");
        enrollmentTokenRepository.save(enrollmentToken);

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        auditService.logAction(user, "DEVICE_LINK_REVOKED", "DeviceEnrollmentToken", id, "Revoked pairing link", ipAddress);
    }

    private EnrollmentLinkDto mapToEnrollmentDto(DeviceEnrollmentToken t) {
        return EnrollmentLinkDto.builder()
                .id(t.getId())
                .token(t.getToken())
                .deviceNamePreset(t.getDeviceNamePreset())
                .requestLocation(t.getRequestLocation())
                .requestAudio(t.getRequestAudio())
                .requestCamera(t.getRequestCamera())
                .status(t.getStatus())
                .expiresAt(t.getExpiresAt())
                .organizationName(t.getOrganization() != null ? t.getOrganization().getName() : "Platform Tenant")
                .creatorName(t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : "Administrator")
                .enrolledDeviceId(t.getEnrolledDevice() != null ? t.getEnrolledDevice().getId() : null)
                .build();
    }

    @Transactional
    public Device updatePermissions(String id, boolean location, boolean audio, boolean camera,
                                     UserPrincipal currentUser, String ipAddress, String userAgent) {
        Device device = getDeviceById(id, currentUser);
        User user = device.getUser();

        device.setLocationPermissionGranted(location);
        device.setAudioPermissionGranted(audio);
        device.setCameraPermissionGranted(camera);
        device.setLastActiveAt(Instant.now());

        device = deviceRepository.save(device);

        logConsent(user, device, "LOCATION_SHARING", location, ipAddress, userAgent);
        logConsent(user, device, "AUDIO_ACCESS", audio, ipAddress, userAgent);
        logConsent(user, device, "CAMERA_ACCESS", camera, ipAddress, userAgent);

        auditService.logAction(user, "DEVICE_PERMISSIONS_UPDATED", "Device", device.getId(),
                String.format("Permissions updated: loc=%s, audio=%s, cam=%s", location, audio, camera), ipAddress);

        return device;
    }

    @Transactional
    public Device revokeDevice(String id, UserPrincipal currentUser, String ipAddress) {
        Device device = getDeviceById(id, currentUser);
        device.setStatus("REVOKED");
        device.setIsOnline(false);
        device.setLocationPermissionGranted(false);
        device.setAudioPermissionGranted(false);
        device.setCameraPermissionGranted(false);

        device = deviceRepository.save(device);

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        auditService.logAction(user, "DEVICE_REVOKED", "Device", device.getId(),
                "Revoked access for device '" + device.getDeviceName() + "'", ipAddress);

        return device;
    }

    @Transactional
    public void deleteDevice(String id, UserPrincipal currentUser, String ipAddress) {
        Device device = getDeviceById(id, currentUser);
        deviceRepository.delete(device);

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        auditService.logAction(user, "DEVICE_DELETED", "Device", id,
                "Deleted device '" + device.getDeviceName() + "'", ipAddress);
    }

    @Transactional
    public void heartbeat(String id) {
        deviceRepository.findById(id).ifPresent(d -> {
            d.setIsOnline(true);
            d.setLastActiveAt(Instant.now());
            deviceRepository.save(d);
        });
    }

    private void logConsent(User user, Device device, String type, boolean granted, String ip, String ua) {
        consentRepository.save(ConsentRecord.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .device(device)
                .consentType(type)
                .granted(granted)
                .ipAddress(ip)
                .userAgent(ua)
                .notes(granted ? "Permission granted during device configuration" : "Permission explicitly revoked by user")
                .revokedAt(!granted ? Instant.now() : null)
                .build());
    }
}
