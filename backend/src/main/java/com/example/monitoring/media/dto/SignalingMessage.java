package com.example.monitoring.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalingMessage {
    private String type; // offer, answer, ice-candidate, participant-joined, participant-left, terminated
    private String senderId;
    private String targetId;
    private Object payload; // SDP string or ICE candidate JSON
}
