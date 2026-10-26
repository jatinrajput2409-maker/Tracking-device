package com.example.monitoring.media;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.media.dto.MediaSessionRequest;
import com.example.monitoring.media.dto.SignalingMessage;
import com.example.monitoring.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media Sessions", description = "Endpoints for WebRTC audio calls, front/rear camera streaming, and real-time signaling")
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/sessions")
    @Operation(summary = "Initiate an authorized audio or front/rear camera media session")
    public ResponseEntity<ApiResponse<MediaSession>> createSession(
            @Valid @RequestBody MediaSessionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        MediaSession session = mediaService.createSession(request, currentUser, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Media session created and awaiting explicit consent", session));
    }

    @PostMapping("/sessions/{id}/consent")
    @Operation(summary = "Confirm explicit participant hardware consent before opening audio/video streams")
    public ResponseEntity<ApiResponse<MediaSession>> confirmConsent(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        MediaSession session = mediaService.confirmConsent(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Consent confirmed; session connected", session));
    }

    @PostMapping("/sessions/{id}/signaling")
    @Operation(summary = "Relay WebRTC SDP offer, answer, or ICE candidate payload")
    public ResponseEntity<ApiResponse<Void>> relaySignaling(
            @PathVariable String id,
            @RequestBody SignalingMessage message) {
        mediaService.processSignaling(id, message);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/sessions/{id}/terminate")
    @Operation(summary = "Terminate active media session and close hardware streams")
    public ResponseEntity<ApiResponse<MediaSession>> terminateSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        MediaSession session = mediaService.terminateSession(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Media session terminated", session));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Inspect media session status")
    public ResponseEntity<ApiResponse<MediaSession>> getSession(@PathVariable String id) {
        MediaSession session = mediaService.getSession(id);
        return ResponseEntity.ok(ApiResponse.ok(session));
    }
}
