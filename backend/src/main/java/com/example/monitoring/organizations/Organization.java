package com.example.monitoring.organizations;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Builder.Default
    @Column(name = "subscription_plan", nullable = false, length = 50)
    private String subscriptionPlan = "FREE"; // FREE, PRO, ENTERPRISE

    @Builder.Default
    @Column(name = "max_devices", nullable = false)
    private Integer maxDevices = 5;

    @Builder.Default
    @Column(name = "max_users", nullable = false)
    private Integer maxUsers = 10;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // ACTIVE, SUSPENDED

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
