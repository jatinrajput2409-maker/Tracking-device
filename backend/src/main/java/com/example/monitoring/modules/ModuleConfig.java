package com.example.monitoring.modules;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModuleConfig {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "module_key", nullable = false, unique = true, length = 50)
    private String moduleKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String icon;

    @Column(nullable = false, length = 100)
    private String route;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    @Builder.Default
    @Column(name = "required_subscription", nullable = false, length = 50)
    private String requiredSubscription = "FREE"; // FREE, PRO, ENTERPRISE

    @Builder.Default
    @Column(name = "min_role_level", nullable = false, length = 50)
    private String minRoleLevel = "ROLE_USER"; // ROLE_USER, ROLE_ORG_ADMIN, ROLE_MASTER_ADMIN

    @Builder.Default
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

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
