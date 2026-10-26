package com.example.monitoring.consent;

import com.example.monitoring.audit.AuditService;
import com.example.monitoring.common.exception.ResourceNotFoundException;
import com.example.monitoring.devices.Device;
import com.example.monitoring.devices.DeviceRepository;
import com.example.monitoring.security.UserPrincipal;
import com.example.monitoring.users.User;
import com.example.monitoring.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ConsentRecord> getUserConsents(UserPrincipal currentUser) {
        if ("ROLE_MASTER_ADMIN".equals(currentUser.getRoleName())) {
            return consentRepository.findAll();
        }
        return consentRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }

    @Transactional(readOnly = true)
    public Page<ConsentRecord> getAllConsents(Pageable pageable) {
        return consentRepository.findAll(pageable);
    }

    @Transactional
    public ConsentRecord grantConsent(String consentType, String deviceId, String notes,
                                      UserPrincipal currentUser, String ipAddress, String userAgent) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Device device = null;
        if (deviceId != null) {
            device = deviceRepository.findById(deviceId).orElse(null);
        }

        ConsentRecord record = ConsentRecord.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .device(device)
                .consentType(consentType.toUpperCase())
                .granted(true)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .notes(notes)
                .build();

        record = consentRepository.save(record);

        auditService.logAction(user, "CONSENT_RECORDED", "ConsentRecord", record.getId(),
                "Explicit consent granted for " + record.getConsentType(), ipAddress);

        return record;
    }

    @Transactional
    public ConsentRecord revokeConsent(String id, UserPrincipal currentUser, String ipAddress) {
        ConsentRecord record = consentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent record not found: " + id));

        record.setGranted(false);
        record.setRevokedAt(Instant.now());
        record = consentRepository.save(record);

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        auditService.logAction(user, "CONSENT_REVOKED", "ConsentRecord", record.getId(),
                "Explicit consent revoked for " + record.getConsentType(), ipAddress);

        return record;
    }
}
