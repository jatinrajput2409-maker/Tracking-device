package com.example.monitoring.devices;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.example.monitoring.users.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "registered_devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Device {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User user;

    @Column(name = "device_name", nullable = false, length = 100)
    private String deviceName;

    @Builder.Default
    @Column(name = "device_type", nullable = false, length = 50)
    private String deviceType = "BROWSER"; // BROWSER, MOBILE_ANDROID, MOBILE_IOS, DESKTOP

    @Column(length = 100)
    private String platform;

    @Column(length = 100)
    private String browser;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "VERIFIED"; // VERIFIED, PENDING_VERIFICATION, REVOKED

    @Builder.Default
    @Column(name = "is_online", nullable = false)
    private Boolean isOnline = false;

    @Builder.Default
    @Column(name = "location_permission_granted", nullable = false)
    private Boolean locationPermissionGranted = false;

    @Builder.Default
    @Column(name = "audio_permission_granted", nullable = false)
    private Boolean audioPermissionGranted = false;

    @Builder.Default
    @Column(name = "camera_permission_granted", nullable = false)
    private Boolean cameraPermissionGranted = false;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Builder.Default
    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
