package com.example.monitoring.location;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.devices.Device;
import com.example.monitoring.devices.DeviceRepository;
import com.example.monitoring.location.dto.LocationUpdateRequest;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationSessionRepository sessionRepository;
    private final LocationPointRepository pointRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;

    @Transactional
    public LocationSession startSession(String deviceId, boolean historyConsented, int intervalSeconds,
                                        UserPrincipal currentUser, String ipAddress) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Device not found: " + deviceId));

        if (!Boolean.TRUE.equals(device.getLocationPermissionGranted())) {
            throw new BadRequestException("Device owner has not granted location permission. Sharing cannot start.");
        }

        // Close any existing active sessions on this device
        List<LocationSession> active = sessionRepository.findByDeviceIdAndStatus(deviceId, "ACTIVE");
        for (LocationSession s : active) {
            s.setStatus("COMPLETED");
            s.setEndedAt(Instant.now());
            sessionRepository.save(s);
        }

        User user = userRepository.findById(currentUser.getId()).orElse(device.getUser());

        LocationSession session = LocationSession.builder()
                .id(UUID.randomUUID().toString())
                .device(device)
                .user(user)
                .sessionToken(UUID.randomUUID().toString())
                .status("ACTIVE")
                .historyCollectionConsented(historyConsented)
                .updateIntervalSeconds(Math.max(3, intervalSeconds))
                .startedAt(Instant.now())
                .expiresAt(Instant.now().plus(4, ChronoUnit.HOURS))
                .build();

        session = sessionRepository.save(session);

        auditService.logAction(user, "LOCATION_SESSION_STARTED", "LocationSession", session.getId(),
                "Started location sharing for device '" + device.getDeviceName() + "' (History=" + historyConsented + ")", ipAddress);

        return session;
    }

    @Transactional
    public LocationPoint recordLocation(String sessionToken, LocationUpdateRequest update, String ipAddress) {
        LocationSession session = sessionRepository.findBySessionToken(sessionToken)
                .orElseThrow(() -> new ResourceNotFoundException("Active location session not found for token."));

        if (!"ACTIVE".equals(session.getStatus()) || session.getExpiresAt().isBefore(Instant.now())) {
            session.setStatus("EXPIRED");
            session.setEndedAt(Instant.now());
            sessionRepository.save(session);
            throw new BadRequestException("Location session has expired or been terminated.");
        }

        LocationPoint point = LocationPoint.builder()
                .id(UUID.randomUUID().toString())
                .session(session)
                .latitude(update.getLatitude())
                .longitude(update.getLongitude())
                .accuracy(update.getAccuracy())
                .altitude(update.getAltitude())
                .speed(update.getSpeed())
                .heading(update.getHeading())
                .batteryLevel(update.getBatteryLevel())
                .capturedAt(Instant.now())
                .build();

        if (Boolean.TRUE.equals(session.getHistoryCollectionConsented())) {
            point = pointRepository.save(point);
        }

        // Update device active status
        Device device = session.getDevice();
        device.setIsOnline(true);
        device.setLastActiveAt(Instant.now());
        deviceRepository.save(device);

        // Broadcast real-time location via WebSocket to all authorized subscribers
        try {
            messagingTemplate.convertAndSend("/topic/location/" + session.getId(), point);
            messagingTemplate.convertAndSend("/topic/location/device/" + device.getId(), point);
        } catch (Exception e) {
            log.warn("Could not broadcast location via WebSocket: {}", e.getMessage());
        }

        return point;
    }

    @Transactional(readOnly = true)
    public LocationSession getSessionById(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
    }

    @Transactional(readOnly = true)
    public List<LocationPoint> getHistory(String sessionId) {
        LocationSession session = getSessionById(sessionId);
        if (!Boolean.TRUE.equals(session.getHistoryCollectionConsented())) {
            throw new BadRequestException("History collection was not consented to for this tracking session.");
        }
        return pointRepository.findBySessionIdOrderByCapturedAtAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public LocationPoint getLatestPoint(String sessionId) {
        return pointRepository.findFirstBySessionIdOrderByCapturedAtDesc(sessionId).orElse(null);
    }

    @Transactional
    public LocationSession stopSession(String sessionId, UserPrincipal currentUser, String ipAddress) {
        LocationSession session = getSessionById(sessionId);
        session.setStatus("REVOKED");
        session.setEndedAt(Instant.now());
        session = sessionRepository.save(session);

        User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(user, "LOCATION_SESSION_STOPPED", "LocationSession", session.getId(),
                "Terminated location sharing session", ipAddress);

        try {
            messagingTemplate.convertAndSend("/topic/location/" + sessionId + "/status", "REVOKED");
        } catch (Exception ignored) {}

        return session;
    }
}
