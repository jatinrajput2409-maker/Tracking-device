package com.example.monitoring.invitations;

import com.example.monitoring.auth.dto.AuthResponse;
import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.invitations.dto.AcceptInviteRequest;
import com.example.monitoring.invitations.dto.InviteRequest;
import com.example.monitoring.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "User Onboarding & Invitations", description = "Endpoints for sending invitations, token verification, and accepting invitations")
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/users/invite")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "Send an expiring invitation link to onboard a new user")
    public ResponseEntity<ApiResponse<Invitation>> inviteUser(
            @Valid @RequestBody InviteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        Invitation invitation = invitationService.createInvitation(request, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Invitation created and dispatched", invitation));
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "List sent onboarding invitations")
    public ResponseEntity<ApiResponse<List<Invitation>>> getInvitations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<Invitation> list = invitationService.getInvitations(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/invitations/verify/{token}")
    @Operation(summary = "Verify an invitation token's validity before rendering onboarding form")
    public ResponseEntity<ApiResponse<Invitation>> verifyToken(@PathVariable String token) {
        Invitation invitation = invitationService.verifyToken(token);
        return ResponseEntity.ok(ApiResponse.ok("Invitation token is valid", invitation));
    }

    @PostMapping("/invitations/accept")
    @Operation(summary = "Accept an invitation, set password, and complete user onboarding profile")
    public ResponseEntity<ApiResponse<AuthResponse>> acceptInvitation(
            @Valid @RequestBody AcceptInviteRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        AuthResponse response = invitationService.acceptInvitation(request, ip);
        return ResponseEntity.ok(ApiResponse.ok("Onboarding completed successfully", response));
    }
}
