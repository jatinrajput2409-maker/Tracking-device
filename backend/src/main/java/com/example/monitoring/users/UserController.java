package com.example.monitoring.users;

import com.example.monitoring.common.response.ApiResponse;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Endpoints for user account provisioning, role updates, and lifecycle management")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "List users with pagination and sorting")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<UserDto> users = userService.getUsers(PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN') or #id == authentication.principal.id")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable String id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "Directly create a new user account")
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @RequestBody UserDto dto,
            @RequestParam(required = false) String initialPassword,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        UserDto created = userService.createUser(dto, initialPassword, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("User created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN') or #id == authentication.principal.id")
    @Operation(summary = "Update user details")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable String id,
            @RequestBody UserDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        UserDto updated = userService.updateUser(id, dto, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MASTER_ADMIN', 'ORG_ADMIN')")
    @Operation(summary = "Update user account status (ACTIVE, SUSPENDED)")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable String id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        UserDto updated = userService.updateUserStatus(id, status, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("User status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MASTER_ADMIN')")
    @Operation(summary = "Delete user account (Master Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        userService.deleteUser(id, currentUser, ip);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }
}
