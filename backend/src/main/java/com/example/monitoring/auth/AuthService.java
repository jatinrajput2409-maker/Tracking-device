package com.example.monitoring.auth;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.auth.dto.AuthResponse;
import com.example.monitoring.auth.dto.LoginRequest;
import com.example.monitoring.auth.dto.RefreshTokenRequest;
import com.example.monitoring.auth.dto.RegisterRequest;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.UnauthorizedException;
import com.example.monitoring.modules.ModuleConfig;
import com.example.monitoring.modules.ModuleRepository;
import com.example.monitoring.organizations.Organization;
import com.example.monitoring.organizations.OrganizationMember;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.organizations.OrganizationRepository;
import com.example.monitoring.roles.Role;
import com.example.monitoring.roles.RoleRepository;
import com.example.monitoring.security.JwtTokenProvider;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ModuleRepository moduleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User record not found"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UnauthorizedException("Your account is currently " + user.getStatus() + ". Please contact administrator.");
        }

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshTokenString = UUID.randomUUID().toString();

        // Save refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .token(refreshTokenString)
                .expiresAt(Instant.now().plusMillis(tokenProvider.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        // Fetch user's organization
        List<OrganizationMember> members = organizationMemberRepository.findByUserId(user.getId());
        String orgId = null;
        String orgName = null;
        if (!members.isEmpty()) {
            Organization org = members.get(0).getOrganization();
            orgId = org.getId();
            orgName = org.getName();
        }

        // Fetch enabled modules
        List<String> enabledModules = moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc()
                .stream()
                .map(ModuleConfig::getModuleKey)
                .collect(Collectors.toList());

        auditService.logAction(user, "USER_LOGIN", "User", user.getId(), "User logged in successfully", ipAddress);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenString)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .organizationId(orgId)
                .organizationName(orgName)
                .enabledModules(enabledModules)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new BadRequestException("Default user role not configured"));

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(userRole)
                .status("ACTIVE")
                .emailVerified(true)
                .privacyPolicyAccepted(Boolean.TRUE.equals(request.getAcceptPrivacyPolicy()))
                .privacyPolicyAcceptedAt(Boolean.TRUE.equals(request.getAcceptPrivacyPolicy()) ? Instant.now() : null)
                .build();

        user = userRepository.save(user);

        // Create organization if provided
        String orgId = null;
        String orgName = null;
        if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            String slug = request.getOrganizationName().toLowerCase().replaceAll("[^a-z0-9]", "-");
            Organization org = Organization.builder()
                    .id(UUID.randomUUID().toString())
                    .name(request.getOrganizationName())
                    .slug(slug + "-" + UUID.randomUUID().toString().substring(0, 6))
                    .subscriptionPlan("FREE")
                    .maxDevices(5)
                    .maxUsers(10)
                    .status("ACTIVE")
                    .build();
            org = organizationRepository.save(org);

            organizationMemberRepository.save(OrganizationMember.builder()
                    .id(UUID.randomUUID().toString())
                    .organization(org)
                    .user(user)
                    .orgRole("ORG_ADMIN")
                    .build());

            orgId = org.getId();
            orgName = org.getName();
        }

        String accessToken = tokenProvider.generateTokenFromUserId(user.getId(), user.getEmail(), user.getRole().getName());
        String refreshTokenString = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .token(refreshTokenString)
                .expiresAt(Instant.now().plusMillis(tokenProvider.getRefreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        List<String> enabledModules = moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc()
                .stream()
                .map(ModuleConfig::getModuleKey)
                .collect(Collectors.toList());

        auditService.logAction(user, "USER_REGISTER", "User", user.getId(), "New user account registered", ipAddress);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenString)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .organizationId(orgId)
                .organizationName(orgName)
                .enabledModules(enabledModules)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.getRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token has expired or been revoked. Please sign in again.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = tokenProvider.generateTokenFromUserId(user.getId(), user.getEmail(), user.getRole().getName());

        List<OrganizationMember> members = organizationMemberRepository.findByUserId(user.getId());
        String orgId = members.isEmpty() ? null : members.get(0).getOrganization().getId();
        String orgName = members.isEmpty() ? null : members.get(0).getOrganization().getName();

        List<String> enabledModules = moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc()
                .stream()
                .map(ModuleConfig::getModuleKey)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .organizationId(orgId)
                .organizationName(orgName)
                .enabledModules(enabledModules)
                .build();
    }

    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
