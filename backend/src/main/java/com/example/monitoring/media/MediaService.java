package com.example.monitoring.media;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.consent.ConsentRecord;
import com.example.monitoring.consent.ConsentRepository;
import com.example.monitoring.devices.Device;
import com.example.monitoring.devices.DeviceRepository;
import com.example.monitoring.media.dto.MediaSessionRequest;
import com.example.monitoring.media.dto.SignalingMessage;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaSessionRepository mediaSessionRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final ConsentRepository consentRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuditService auditService;

    @Transactional
    public MediaSession createSession(MediaSessionRequest request, UserPrincipal currentUser, String ipAddress, String userAgent) {
        User initiator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getId()));

        Device targetDevice = null;
        if (request.getTargetDeviceId() != null) {
            targetDevice = deviceRepository.findById(request.getTargetDeviceId()).orElse(null);
        }

        MediaSession session = MediaSession.builder()
                .id(UUID.randomUUID().toString())
                .initiator(initiator)
                .targetDevice(targetDevice)
                .sessionType(request.getSessionType().toUpperCase())
                .sessionToken(UUID.randomUUID().toString())
                .status("PENDING_CONSENT")
                .isRecordingConsented(Boolean.TRUE.equals(request.getConsentToRecord()))
                .expiresAt(Instant.now().plus(2, ChronoUnit.HOURS))
                .build();

        session = mediaSessionRepository.save(session);

        // Record informed consent
        consentRepository.save(ConsentRecord.builder()
                .id(UUID.randomUUID().toString())
                .user(initiator)
                .device(targetDevice)
                .consentType(request.getSessionType().startsWith("VIDEO") ? "CAMERA_ACCESS" : "AUDIO_ACCESS")
                .granted(true)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .notes("Explicit user consent given to start " + request.getSessionType() + " session")
                .build());

        auditService.logAction(initiator, "MEDIA_SESSION_CREATED", "MediaSession", session.getId(),
                "Initiated " + session.getSessionType() + " session (Recording=" + session.getIsRecordingConsented() + ")", ipAddress);

        return session;
    }

    @Transactional
    public MediaSession confirmConsent(String sessionId, UserPrincipal currentUser, String ipAddress) {
        MediaSession session = mediaSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Media session not found: " + sessionId));

        session.setStatus("CONNECTED");
        session.setStartedAt(Instant.now());
        session = mediaSessionRepository.save(session);

        User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(user, "MEDIA_CONSENT_CONFIRMED", "MediaSession", session.getId(),
                "Participant confirmed explicit hardware consent for " + session.getSessionType(), ipAddress);

        try {
            messagingTemplate.convertAndSend("/topic/media/" + sessionId,
                    SignalingMessage.builder().type("participant-joined").senderId(currentUser != null ? currentUser.getId() : "guest").build());
        } catch (Exception ignored) {}

        return session;
    }

    public void processSignaling(String sessionId, SignalingMessage message) {
        log.debug("Broadcasting WebRTC signaling for session {}: type={}", sessionId, message.getType());
        messagingTemplate.convertAndSend("/topic/media/" + sessionId, message);
    }

    @Transactional
    public MediaSession terminateSession(String sessionId, UserPrincipal currentUser, String ipAddress) {
        MediaSession session = mediaSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Media session not found: " + sessionId));

        session.setStatus("TERMINATED");
        session.setEndedAt(Instant.now());
        session = mediaSessionRepository.save(session);

        User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(user, "MEDIA_SESSION_TERMINATED", "MediaSession", session.getId(),
                "Terminated " + session.getSessionType() + " session", ipAddress);

        try {
            messagingTemplate.convertAndSend("/topic/media/" + sessionId,
                    SignalingMessage.builder().type("terminated").senderId(currentUser != null ? currentUser.getId() : "system").build());
        } catch (Exception ignored) {}

        return session;
    }

    @Transactional(readOnly = true)
    public MediaSession getSession(String sessionId) {
        return mediaSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Media session not found: " + sessionId));
    }
}
