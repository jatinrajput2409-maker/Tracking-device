package com.example.monitoring.devices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEnrollmentLinkRequest {
    private String deviceNamePreset;
    private Boolean requestLocation;
    private Boolean requestAudio;
    private Boolean requestCamera;
    private Integer expirationHours;
}
