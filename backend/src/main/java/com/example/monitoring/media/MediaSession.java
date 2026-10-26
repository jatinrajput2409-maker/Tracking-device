package com.example.monitoring.media;

import com.example.monitoring.devices.Device;
import com.example.monitoring.users.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "media_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MediaSession {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_device_id")
    private Device targetDevice;

    @Column(name = "session_type", nullable = false, length = 30)
    private String sessionType; // AUDIO, VIDEO_FRONT, VIDEO_REAR

    @Column(name = "session_token", nullable = false, unique = true)
    private String sessionToken;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING_CONSENT"; // PENDING_CONSENT, CONNECTED, TERMINATED, EXPIRED

    @Builder.Default
    @Column(name = "is_recording_consented", nullable = false)
    private Boolean isRecordingConsented = false;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
