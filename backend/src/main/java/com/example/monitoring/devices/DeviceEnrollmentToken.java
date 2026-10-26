package com.example.monitoring.devices;

import com.example.monitoring.organizations.Organization;
import com.example.monitoring.users.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "device_enrollment_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceEnrollmentToken {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "device_name_preset", length = 100)
    private String deviceNamePreset;

    @Builder.Default
    @Column(name = "request_location", nullable = false)
    private Boolean requestLocation = true;

    @Builder.Default
    @Column(name = "request_audio", nullable = false)
    private Boolean requestAudio = false;

    @Builder.Default
    @Column(name = "request_camera", nullable = false)
    private Boolean requestCamera = false;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, ENROLLED, EXPIRED, REVOKED

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolled_device_id")
    private Device enrolledDevice;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
