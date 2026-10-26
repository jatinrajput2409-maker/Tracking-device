package com.example.monitoring.devices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentLinkDto {
    private String id;
    private String token;
    private String deviceNamePreset;
    private Boolean requestLocation;
    private Boolean requestAudio;
    private Boolean requestCamera;
    private String status;
    private Instant expiresAt;
    private String organizationName;
    private String creatorName;
    private String enrolledDeviceId;
}
