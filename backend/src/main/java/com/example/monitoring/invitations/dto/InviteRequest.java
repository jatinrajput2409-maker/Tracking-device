package com.example.monitoring.invitations.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteRequest {
    @NotBlank(message = "Invitee email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    private String role; // ROLE_USER, ROLE_ORG_ADMIN
    private String organizationId;
    private List<String> allowedModules;
}
