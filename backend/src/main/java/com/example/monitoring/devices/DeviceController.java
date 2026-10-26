package com.example.monitoring.devices;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.devices.dto.ClaimEnrollmentLinkRequest;
import com.example.monitoring.devices.dto.CreateEnrollmentLinkRequest;
import com.example.monitoring.devices.dto.DeviceRegistrationRequest;
import com.example.monitoring.devices.dto.EnrollmentLinkDto;
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
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
@Tag(name = "Devices", description = "Endpoints for device registration, remote link enrollment, permission toggling, and telemetry heartbeat")
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping
    @Operation(summary = "Get list of authorized devices for current user or all devices (Admin)")
    public ResponseEntity<ApiResponse<List<Device>>> getDevices(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Device> devices = deviceService.getDevicesForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(devices));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed device record by ID")
    public ResponseEntity<ApiResponse<Device>> getDeviceById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Device device = deviceService.getDeviceById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(device));
    }

    @PostMapping("/register")
    @Operation(summary = "Register current browser or client hardware as authorized device")
    public ResponseEntity<ApiResponse<Device>> registerDevice(
            @Valid @RequestBody DeviceRegistrationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        Device registered = deviceService.registerDevice(request, currentUser, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Device registered and verified successfully", registered));
    }

    // =========================================================================
    // Device Pairing & Remote Enrollment Links
    // =========================================================================

    @PostMapping("/enrollment-links")
    @Operation(summary = "Generate a sharable pairing link to enroll a remote device and enable features")
    public ResponseEntity<ApiResponse<EnrollmentLinkDto>> createEnrollmentLink(
            @RequestBody CreateEnrollmentLinkRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        EnrollmentLinkDto link = deviceService.createEnrollmentLink(request, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Device enrollment link generated successfully", link));
    }

    @GetMapping("/enrollment-links")
    @Operation(summary = "List active device pairing links created by current user")
    public ResponseEntity<ApiResponse<List<EnrollmentLinkDto>>> getEnrollmentLinks(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<EnrollmentLinkDto> list = deviceService.getEnrollmentLinksForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @DeleteMapping("/enrollment-links/{id}")
    @Operation(summary = "Revoke an active device pairing link")
    public ResponseEntity<ApiResponse<Void>> revokeEnrollmentLink(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        deviceService.revokeEnrollmentLink(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Device pairing link revoked", null));
    }

    @GetMapping("/enrollment-links/verify/{token}")
    @Operation(summary = "Public verification endpoint for target device when opening enrollment link")
    public ResponseEntity<ApiResponse<EnrollmentLinkDto>> verifyEnrollmentLink(@PathVariable String token) {
        EnrollmentLinkDto link = deviceService.getEnrollmentLink(token);
        return ResponseEntity.ok(ApiResponse.ok("Pairing link is valid", link));
    }

    @PostMapping("/enrollment-links/verify/{token}/claim")
    @Operation(summary = "Public endpoint to activate device monitoring features and enroll hardware from the target device")
    public ResponseEntity<ApiResponse<Device>> claimEnrollmentLink(
            @PathVariable String token,
            @RequestBody ClaimEnrollmentLinkRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        Device device = deviceService.claimEnrollmentLink(token, request, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Device successfully enrolled and features activated!", device));
    }

    @PutMapping("/{id}/permissions")
    @Operation(summary = "Update device-level hardware permissions (location, audio, camera)")
    public ResponseEntity<ApiResponse<Device>> updatePermissions(
            @PathVariable String id,
            @RequestParam boolean location,
            @RequestParam boolean audio,
            @RequestParam boolean camera,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        Device updated = deviceService.updatePermissions(id, location, audio, camera, currentUser, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Device permissions updated successfully", updated));
    }

    @PatchMapping("/{id}/revoke")
    @Operation(summary = "Immediately revoke device authorization and terminate active sessions")
    public ResponseEntity<ApiResponse<Device>> revokeDevice(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        Device revoked = deviceService.revokeDevice(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Device access revoked successfully", revoked));
    }

    @PostMapping("/{id}/heartbeat")
    @Operation(summary = "Send client heartbeat to maintain online status")
    public ResponseEntity<ApiResponse<Void>> heartbeat(@PathVariable String id) {
        deviceService.heartbeat(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently remove a registered device")
    public ResponseEntity<ApiResponse<Void>> deleteDevice(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        deviceService.deleteDevice(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Device deleted successfully", null));
    }
}
