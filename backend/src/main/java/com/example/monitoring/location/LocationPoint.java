package com.example.monitoring.location;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "location_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationPoint {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private LocationSession session;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double accuracy;
    private Double altitude;
    private Double speed;
    private Double heading;

    @Column(name = "battery_level")
    private Double batteryLevel;

    @Builder.Default
    @Column(name = "captured_at", nullable = false, updatable = false)
    private Instant capturedAt = Instant.now();
}
