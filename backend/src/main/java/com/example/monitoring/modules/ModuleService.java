package com.example.monitoring.modules;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final UserModuleAccessRepository userModuleAccessRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ModuleConfig> getAllModules() {
        return moduleRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<ModuleConfig> getEnabledModulesForUser(UserPrincipal userPrincipal) {
        List<ModuleConfig> allEnabled = moduleRepository.findByIsEnabledTrueOrderByDisplayOrderAsc();

        if (userPrincipal == null) {
            return allEnabled;
        }

        // If master admin, gets all enabled modules
        if ("ROLE_MASTER_ADMIN".equals(userPrincipal.getRoleName())) {
            return allEnabled;
        }

        // Check specific overrides if any
        Map<String, Boolean> overrides = userModuleAccessRepository.findByUserId(userPrincipal.getId())
                .stream()
                .collect(Collectors.toMap(uma -> uma.getModule().getId(), UserModuleAccess::getIsEnabled));

        return allEnabled.stream()
                .filter(m -> {
                    // check role hierarchy
                    if ("ROLE_USER".equals(userPrincipal.getRoleName()) && "ROLE_MASTER_ADMIN".equals(m.getMinRoleLevel())) {
                        return false;
                    }
                    if ("ROLE_USER".equals(userPrincipal.getRoleName()) && "ROLE_ORG_ADMIN".equals(m.getMinRoleLevel())) {
                        return false;
                    }
                    if ("ROLE_ORG_ADMIN".equals(userPrincipal.getRoleName()) && "ROLE_MASTER_ADMIN".equals(m.getMinRoleLevel())) {
                        return false;
                    }
                    // check individual user overrides
                    return overrides.getOrDefault(m.getId(), true);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ModuleConfig toggleModuleStatus(String moduleId, boolean enabled, UserPrincipal currentUser, String ipAddress) {
        ModuleConfig module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        module.setIsEnabled(enabled);
        module = moduleRepository.save(module);

        User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(
                user,
                "MODULE_TOGGLED",
                "ModuleConfig",
                moduleId,
                "Module '" + module.getName() + "' set to enabled=" + enabled,
                ipAddress
        );

        return module;
    }

    @Transactional
    public ModuleConfig updateModule(String moduleId, ModuleConfig updated, UserPrincipal currentUser, String ipAddress) {
        ModuleConfig existing = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setIcon(updated.getIcon());
        existing.setRoute(updated.getRoute());
        existing.setIsEnabled(updated.getIsEnabled());
        existing.setRequiredSubscription(updated.getRequiredSubscription());
        existing.setMinRoleLevel(updated.getMinRoleLevel());
        existing.setDisplayOrder(updated.getDisplayOrder());

        existing = moduleRepository.save(existing);

        User user = currentUser != null ? userRepository.findById(currentUser.getId()).orElse(null) : null;
        auditService.logAction(
                user,
                "MODULE_UPDATED",
                "ModuleConfig",
                moduleId,
                "Updated configuration for module '" + existing.getName() + "'",
                ipAddress
        );

        return existing;
    }
}
