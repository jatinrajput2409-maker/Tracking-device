package com.example.monitoring.auth;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.auth.dto.AuthResponse;
import com.example.monitoring.auth.dto.LoginRequest;
import com.example.monitoring.modules.ModuleConfig;
import com.example.monitoring.modules.ModuleRepository;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.organizations.OrganizationRepository;
import com.example.monitoring.roles.Role;
import com.example.monitoring.roles.RoleRepository;
import com.example.monitoring.security.JwtTokenProvider;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role sampleRole;

    @BeforeEach
    void setUp() {
        sampleRole = Role.builder()
                .id("r-1001")
                .name("ROLE_MASTER_ADMIN")
                .build();

        sampleUser = User.builder()
                .id("u-001")
                .email("admin@monitoring.local")
                .passwordHash("hashedPass")
                .firstName("Master")
                .lastName("Admin")
                .role(sampleRole)
                .status("ACTIVE")
                .build();
    }

    @Test
    void testSuccessfulLogin() {
        LoginRequest req = new LoginRequest("admin@monitoring.local", "Admin@123456");
        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = UserPrincipal.create(sampleUser);
        when(auth.getPrincipal()).thenReturn(principal);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userRepository.findByEmail("admin@monitoring.local"))
                .thenReturn(Optional.of(sampleUser));
        when(tokenProvider.generateAccessToken(auth)).thenReturn("sample-jwt-token");
        when(tokenProvider.getRefreshExpirationMs()).thenReturn(604800000L);
        when(moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc()).thenReturn(List.of(
                ModuleConfig.builder().moduleKey("dashboard").build()
        ));

        AuthResponse resp = authService.login(req, "127.0.0.1");

        assertNotNull(resp);
        assertEquals("sample-jwt-token", resp.getAccessToken());
        assertEquals("admin@monitoring.local", resp.getEmail());
        assertEquals("ROLE_MASTER_ADMIN", resp.getRole());
        assertTrue(resp.getEnabledModules().contains("dashboard"));
        verify(auditService, times(1)).logAction(any(), eq("USER_LOGIN"), any(), any(), any(), any());
    }
}
