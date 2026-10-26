package com.example.monitoring.invitations;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.auth.dto.AuthResponse;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.invitations.dto.AcceptInviteRequest;
import com.example.monitoring.invitations.dto.InviteRequest;
import com.example.monitoring.modules.ModuleConfig;
import com.example.monitoring.modules.ModuleRepository;
import com.example.monitoring.organizations.Organization;
import com.example.monitoring.organizations.OrganizationMember;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.organizations.OrganizationRepository;
import com.example.monitoring.roles.Role;
import com.example.monitoring.roles.RoleRepository;
import com.example.monitoring.security.JwtTokenProvider;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final RoleRepository roleRepository;
    private final ModuleRepository moduleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Transactional
    public Invitation createInvitation(InviteRequest request, UserPrincipal currentUser, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A registered user with email " + request.getEmail() + " already exists.");
        }

        User inviter = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inviter not found"));

        Organization org = null;
        if (request.getOrganizationId() != null) {
            org = organizationRepository.findById(request.getOrganizationId()).orElse(null);
        } else {
            List<OrganizationMember> members = organizationMemberRepository.findByUserId(currentUser.getId());
            if (!members.isEmpty()) {
                org = members.get(0).getOrganization();
            }
        }

        String allowedModulesJson = request.getAllowedModules() != null ?
                String.join(",", request.getAllowedModules()) : null;

        Invitation invitation = Invitation.builder()
                .id(UUID.randomUUID().toString())
                .inviter(inviter)
                .organization(org)
                .email(request.getEmail())
                .token(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""))
                .role(request.getRole() != null ? request.getRole() : "ROLE_USER")
                .allowedModules(allowedModulesJson)
                .status("PENDING")
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();

        invitation = invitationRepository.save(invitation);

        auditService.logAction(inviter, "INVITATION_SENT", "Invitation", invitation.getId(),
                "Sent onboarding invite to " + invitation.getEmail() + " (Role=" + invitation.getRole() + ")", ipAddress);

        return invitation;
    }

    @Transactional(readOnly = true)
    public Invitation verifyToken(String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized invitation link."));

        if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
            throw new BadRequestException("This invitation has already been " + invitation.getStatus().toLowerCase() + ".");
        }

        if (invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new BadRequestException("This invitation link has expired. Please ask your administrator to re-invite you.");
        }

        return invitation;
    }

    @Transactional
    public AuthResponse acceptInvitation(AcceptInviteRequest request, String ipAddress) {
        Invitation invitation = verifyToken(request.getToken());

        Role role = roleRepository.findByName(invitation.getRole())
                .orElseThrow(() -> new BadRequestException("Role not found: " + invitation.getRole()));

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(invitation.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .status("ACTIVE")
                .emailVerified(true)
                .privacyPolicyAccepted(Boolean.TRUE.equals(request.getAcceptPrivacyPolicy()))
                .privacyPolicyAcceptedAt(Boolean.TRUE.equals(request.getAcceptPrivacyPolicy()) ? Instant.now() : null)
                .build();

        user = userRepository.save(user);

        // Associate with organization if specified
        if (invitation.getOrganization() != null) {
            organizationMemberRepository.save(OrganizationMember.builder()
                    .id(UUID.randomUUID().toString())
                    .organization(invitation.getOrganization())
                    .user(user)
                    .orgRole("ROLE_ORG_ADMIN".equals(role.getName()) ? "ORG_ADMIN" : "MEMBER")
                    .build());
        }

        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);

        auditService.logAction(user, "INVITATION_ACCEPTED", "User", user.getId(),
                "User completed onboarding via invite token", ipAddress);

        String accessToken = tokenProvider.generateTokenFromUserId(user.getId(), user.getEmail(), user.getRole().getName());
        String refreshToken = UUID.randomUUID().toString();

        List<String> enabledModules = moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc()
                .stream()
                .map(ModuleConfig::getModuleKey)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .organizationId(invitation.getOrganization() != null ? invitation.getOrganization().getId() : null)
                .organizationName(invitation.getOrganization() != null ? invitation.getOrganization().getName() : null)
                .enabledModules(enabledModules)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Invitation> getInvitations(UserPrincipal currentUser) {
        if ("ROLE_MASTER_ADMIN".equals(currentUser.getRoleName())) {
            return invitationRepository.findAll();
        }
        return invitationRepository.findByInviterIdOrderByCreatedAtDesc(currentUser.getId());
    }
}
