package com.example.monitoring.devices.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimEnrollmentLinkRequest {
    private String customDeviceName;
    private String deviceType; // BROWSER, MOBILE_ANDROID, MOBILE_IOS, DESKTOP
    private String platform;
    private String browser;
    private Boolean consentLocation;
    private Boolean consentAudio;
    private Boolean consentCamera;
}
