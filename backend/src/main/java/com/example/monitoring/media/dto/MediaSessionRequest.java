package com.example.monitoring.media.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaSessionRequest {
    @NotBlank(message = "Session type is required (AUDIO, VIDEO_FRONT, VIDEO_REAR)")
    private String sessionType; // AUDIO, VIDEO_FRONT, VIDEO_REAR

    private String targetDeviceId;
    private Boolean consentToRecord;
}
