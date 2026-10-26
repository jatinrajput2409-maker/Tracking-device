package com.example.monitoring.dashboard.dto;

import com.example.monitoring.audit.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalUsers;
    private long activeUsers;
    private long pendingInvitations;
    private long registeredDevices;
    private long onlineDevices;
    private long activeLocationSessions;
    private long activeAudioSessions;
    private long activeVideoSessions;
    private long consentsGranted;
    private long consentsRevoked;
    private List<AuditLog> recentActivity;
    private List<Map<String, Object>> moduleUsage;
    private List<Map<String, Object>> timelineActivity;
}
