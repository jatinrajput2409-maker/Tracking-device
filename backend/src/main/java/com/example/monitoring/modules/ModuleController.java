package com.example.monitoring.modules;

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
@Tag(name = "Dynamic Modules", description = "Endpoints for dynamic module discovery, configuration, and runtime toggling")
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping("/modules")
    @Operation(summary = "Get dynamically enabled modules available to current user")
    public ResponseEntity<ApiResponse<List<ModuleConfig>>> getMyModules(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ModuleConfig> modules = moduleService.getEnabledModulesForUser(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(modules));
    }

    @GetMapping("/admin/modules")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Get all platform modules (Master Admin)")
    public ResponseEntity<ApiResponse<List<ModuleConfig>>> getAllAdminModules() {
        List<ModuleConfig> modules = moduleService.getAllModules();
        return ResponseEntity.ok(ApiResponse.ok(modules));
    }

    @PatchMapping("/admin/modules/{id}/status")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Toggle module enabled/disabled state system-wide")
    public ResponseEntity<ApiResponse<ModuleConfig>> toggleModuleStatus(
            @PathVariable String id,
            @RequestParam boolean enabled,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        ModuleConfig updated = moduleService.toggleModuleStatus(id, enabled, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Module status updated successfully", updated));
    }

    @PutMapping("/admin/modules/{id}")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Update module definition, role requirements, and subscription plan")
    public ResponseEntity<ApiResponse<ModuleConfig>> updateModule(
            @PathVariable String id,
            @RequestBody ModuleConfig moduleConfig,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        ModuleConfig updated = moduleService.updateModule(id, moduleConfig, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("Module configuration updated successfully", updated));
    }
}
