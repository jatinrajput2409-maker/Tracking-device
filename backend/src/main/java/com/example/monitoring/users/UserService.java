package com.example.monitoring.users;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.organizations.OrganizationMember;
import com.example.monitoring.organizations.OrganizationMemberRepository;
import com.example.monitoring.roles.Role;
import com.example.monitoring.roles.RoleRepository;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    @Transactional
    public UserDto createUser(UserDto dto, String initialPassword, UserPrincipal currentUser, String ipAddress) {
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new BadRequestException("Email address is already in use.");
        }

        Role role = roleRepository.findByName(dto.getRole() != null ? dto.getRole() : "ROLE_USER")
                .orElseThrow(() -> new BadRequestException("Role not found: " + dto.getRole()));

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(initialPassword != null ? initialPassword : "Password@123"))
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .phoneNumber(dto.getPhoneNumber())
                .role(role)
                .status("ACTIVE")
                .emailVerified(true)
                .privacyPolicyAccepted(true)
                .privacyPolicyAcceptedAt(Instant.now())
                .build();

        user = userRepository.save(user);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "USER_CREATED", "User", user.getId(), "Created user " + user.getEmail(), ipAddress);

        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUser(String id, UserDto dto, UserPrincipal currentUser, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setPhoneNumber(dto.getPhoneNumber());

        if (dto.getRole() != null) {
            Role role = roleRepository.findByName(dto.getRole())
                    .orElseThrow(() -> new BadRequestException("Role not found: " + dto.getRole()));
            user.setRole(role);
        }

        user = userRepository.save(user);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "USER_UPDATED", "User", user.getId(), "Updated profile for " + user.getEmail(), ipAddress);

        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUserStatus(String id, String status, UserPrincipal currentUser, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setStatus(status.toUpperCase());
        user = userRepository.save(user);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "USER_STATUS_CHANGED", "User", user.getId(), "Set status to " + status + " for " + user.getEmail(), ipAddress);

        return mapToDto(user);
    }

    @Transactional
    public void deleteUser(String id, UserPrincipal currentUser, String ipAddress) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        userRepository.delete(user);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "USER_DELETED", "User", id, "Deleted user " + user.getEmail(), ipAddress);
    }

    public UserDto mapToDto(User user) {
        List<OrganizationMember> members = organizationMemberRepository.findByUserId(user.getId());
        String orgName = members.isEmpty() ? null : members.get(0).getOrganization().getName();

        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole() != null ? user.getRole().getName() : "ROLE_USER")
                .status(user.getStatus())
                .emailVerified(user.getEmailVerified())
                .privacyPolicyAccepted(user.getPrivacyPolicyAccepted())
                .createdAt(user.getCreatedAt())
                .organizationName(orgName)
                .build();
    }
}
