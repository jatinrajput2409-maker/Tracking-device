package com.example.monitoring.dashboard;

import com.example.monitoring.audit.AuditLog;
import com.example.monitoring.audit.AuditLogRepository;
import com.example.monitoring.consent.ConsentRepository;
import com.example.monitoring.dashboard.dto.DashboardStatsDto;
import com.example.monitoring.devices.DeviceRepository;
import com.example.monitoring.invitations.InvitationRepository;
import com.example.monitoring.location.LocationSessionRepository;
import com.example.monitoring.media.MediaSessionRepository;
import com.example.monitoring.modules.ModuleConfig;
import com.example.monitoring.modules.ModuleRepository;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final InvitationRepository invitationRepository;
    private final LocationSessionRepository locationSessionRepository;
    private final MediaSessionRepository mediaSessionRepository;
    private final ConsentRepository consentRepository;
    private final ModuleRepository moduleRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long pendingInvites = invitationRepository.countByStatus("PENDING");
        long regDevices = deviceRepository.count();
        long onlineDevs = deviceRepository.countByIsOnlineTrue();
        long activeLocationSessions = locationSessionRepository.countByStatus("ACTIVE");
        long activeAudioSessions = mediaSessionRepository.countBySessionTypeAndStatus("AUDIO", "CONNECTED");
        long activeVideoSessions = mediaSessionRepository.countBySessionTypeAndStatus("VIDEO_FRONT", "CONNECTED")
                + mediaSessionRepository.countBySessionTypeAndStatus("VIDEO_REAR", "CONNECTED");
        long consentsGranted = consentRepository.countByGrantedTrue();
        long consentsRevoked = consentRepository.countByRevokedAtIsNotNull();
        List<AuditLog> recent = auditLogRepository.findTop20ByOrderByCreatedAtDesc();

        // Synthetic module usage counts for visualization
        List<ModuleConfig> modules = moduleRepository.findAllByOrderByDisplayOrderAsc();
        List<Map<String, Object>> moduleUsage = new ArrayList<>();
        int base = 85;
        for (ModuleConfig m : modules) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", m.getName());
            item.put("key", m.getModuleKey());
            item.put("enabled", m.getIsEnabled());
            item.put("usageCount", m.getIsEnabled() ? Math.max(12, base) : 0);
            moduleUsage.add(item);
            base -= 7;
        }

        // Timeline activity for area chart
        List<Map<String, Object>> timeline = List.of(
                Map.of("day", "Mon", "sessions", 24, "locations", 142, "events", 89),
                Map.of("day", "Tue", "sessions", 35, "locations", 210, "events", 134),
                Map.of("day", "Wed", "sessions", 28, "locations", 185, "events", 112),
                Map.of("day", "Thu", "sessions", 42, "locations", 260, "events", 175),
                Map.of("day", "Fri", "sessions", 51, "locations", 320, "events", 210),
                Map.of("day", "Sat", "sessions", 19, "locations", 95, "events", 64),
                Map.of("day", "Sun", "sessions", 22, "locations", 110, "events", 72)
        );

        return DashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .pendingInvitations(pendingInvites)
                .registeredDevices(regDevices)
                .onlineDevices(onlineDevs)
                .activeLocationSessions(activeLocationSessions)
                .activeAudioSessions(activeAudioSessions)
                .activeVideoSessions(activeVideoSessions)
                .consentsGranted(consentsGranted)
                .consentsRevoked(consentsRevoked)
                .recentActivity(recent)
                .moduleUsage(moduleUsage)
                .timelineActivity(timeline)
                .build();
    }
}
