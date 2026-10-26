package com.example.monitoring.organizations;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Organizations", description = "Endpoints for managing multi-tenant organizations, quotas, and subscriptions")
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/admin/organizations")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Get list of all organizations (Master Admin)")
    public ResponseEntity<ApiResponse<List<Organization>>> getAllOrganizations() {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getAllOrganizations()));
    }

    @GetMapping("/organizations/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "Get organization details by ID")
    public ResponseEntity<ApiResponse<Organization>> getOrganizationById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getOrganizationById(id)));
    }

    @PostMapping("/admin/organizations")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Create a new organization")
    public ResponseEntity<ApiResponse<Organization>> createOrganization(
            @RequestBody Organization org,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        Organization created = organizationService.createOrganization(org, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Organization created successfully", created));
    }

    @PutMapping("/admin/organizations/{id}")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Update organization settings, tier, and quotas")
    public ResponseEntity<ApiResponse<Organization>> updateOrganization(
            @PathVariable String id,
            @RequestBody Organization org,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        Organization updated = organizationService.updateOrganization(id, org, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Organization updated successfully", updated));
    }

    @GetMapping("/organizations/{id}/members")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "Get members of an organization")
    public ResponseEntity<ApiResponse<List<OrganizationMember>>> getOrganizationMembers(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(organizationService.getMembers(id)));
    }
}
