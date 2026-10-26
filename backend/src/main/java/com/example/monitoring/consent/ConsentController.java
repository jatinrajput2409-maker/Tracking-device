package com.example.monitoring.consent;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/consents")
@RequiredArgsConstructor
@Tag(name = "Consent Management", description = "Endpoints for auditable GDPR/CCPA user consent granting, query, and revocation")
public class ConsentController {

    private final ConsentService consentService;

    @GetMapping
    @Operation(summary = "Get list of recorded user consent entries")
    public ResponseEntity<ApiResponse<List<ConsentRecord>>> getConsents(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConsentRecord> consents = consentService.getUserConsents(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(consents));
    }

    @PostMapping
    @Operation(summary = "Record informed explicit consent for a device capability or policy")
    public ResponseEntity<ApiResponse<ConsentRecord>> grantConsent(
            @RequestParam String consentType,
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String userAgent = servletRequest.getHeader("User-Agent");
        ConsentRecord record = consentService.grantConsent(consentType, deviceId, notes, currentUser, ip, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Consent record preserved", record));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke prior consent immediately")
    public ResponseEntity<ApiResponse<ConsentRecord>> revokeConsent(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        ConsentRecord revoked = consentService.revokeConsent(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Consent revoked", revoked));
    }
}
