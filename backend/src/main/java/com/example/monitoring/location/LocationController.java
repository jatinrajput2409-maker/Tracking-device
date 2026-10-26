package com.example.monitoring.location;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.location.dto.LocationUpdateRequest;
import com.example.monitoring.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/location")
@RequiredArgsConstructor
@Tag(name = "Location Tracking", description = "Endpoints for consensual live location sharing, telemetry streaming, and breadcrumbs")
public class LocationController {

    private final LocationService locationService;

    @PostMapping("/sessions")
    @Operation(summary = "Initiate an authorized live location-sharing session for a verified device")
    public ResponseEntity<ApiResponse<LocationSession>> startSession(
            @RequestParam String deviceId,
            @RequestParam(defaultValue = "false") boolean historyConsented,
            @RequestParam(defaultValue = "10") int intervalSeconds,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        LocationSession session = locationService.startSession(deviceId, historyConsented, intervalSeconds, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Location sharing session started", session));
    }

    @PostMapping("/sessions/{sessionToken}/updates")
    @Operation(summary = "Ingest real-time location coordinate update from device")
    public ResponseEntity<ApiResponse<LocationPoint>> updateLocation(
            @PathVariable String sessionToken,
            @Valid @RequestBody LocationUpdateRequest update,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        LocationPoint point = locationService.recordLocation(sessionToken, update, ip);
        return ResponseEntity.ok(ApiResponse.ok("Location updated", point));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get location session metadata and current status")
    public ResponseEntity<ApiResponse<LocationSession>> getSession(@PathVariable String id) {
        LocationSession session = locationService.getSessionById(id);
        return ResponseEntity.ok(ApiResponse.ok(session));
    }

    @GetMapping("/sessions/{id}/latest")
    @Operation(summary = "Get the latest recorded GPS telemetry coordinate")
    public ResponseEntity<ApiResponse<LocationPoint>> getLatestPoint(@PathVariable String id) {
        LocationPoint point = locationService.getLatestPoint(id);
        return ResponseEntity.ok(ApiResponse.ok(point));
    }

    @GetMapping("/sessions/{id}/history")
    @Operation(summary = "Get historical breadcrumb points (only if history consent was granted)")
    public ResponseEntity<ApiResponse<List<LocationPoint>>> getHistory(@PathVariable String id) {
        List<LocationPoint> points = locationService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(points));
    }

    @PostMapping("/sessions/{id}/stop")
    @Operation(summary = "Terminate location sharing session immediately")
    public ResponseEntity<ApiResponse<LocationSession>> stopSession(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        LocationSession stopped = locationService.stopSession(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Location sharing session stopped", stopped));
    }
}
