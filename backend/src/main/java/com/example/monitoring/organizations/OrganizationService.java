package com.example.monitoring.organizations;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.BadRequestException;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Organization getOrganizationById(String id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with id: " + id));
    }

    @Transactional
    public Organization createOrganization(Organization org, UserPrincipal currentUser, String ipAddress) {
        if (organizationRepository.existsBySlug(org.getSlug())) {
            throw new BadRequestException("Organization slug already exists: " + org.getSlug());
        }

        org.setId(UUID.randomUUID().toString());
        Organization saved = organizationRepository.save(org);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "ORG_CREATED", "Organization", saved.getId(), "Created organization " + saved.getName(), ipAddress);

        return saved;
    }

    @Transactional
    public Organization updateOrganization(String id, Organization updated, UserPrincipal currentUser, String ipAddress) {
        Organization existing = getOrganizationById(id);
        existing.setName(updated.getName());
        existing.setSubscriptionPlan(updated.getSubscriptionPlan());
        existing.setMaxDevices(updated.getMaxDevices());
        existing.setMaxUsers(updated.getMaxUsers());
        existing.setStatus(updated.getStatus());

        existing = organizationRepository.save(existing);

        User admin = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(admin, "ORG_UPDATED", "Organization", existing.getId(), "Updated organization " + existing.getName(), ipAddress);

        return existing;
    }

    @Transactional(readOnly = true)
    public List<OrganizationMember> getMembers(String orgId) {
        return organizationMemberRepository.findByOrganizationId(orgId);
    }
}
