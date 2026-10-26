package com.example.monitoring.devices.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceRegistrationRequest {
    @NotBlank(message = "Device name is required")
    private String deviceName;

    private String deviceType; // BROWSER, MOBILE_ANDROID, MOBILE_IOS, DESKTOP
    private String platform;
    private String browser;
    private Boolean locationPermission;
    private Boolean audioPermission;
    private Boolean cameraPermission;
}
