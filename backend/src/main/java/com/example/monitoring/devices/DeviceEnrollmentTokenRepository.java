package com.example.monitoring.devices;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceEnrollmentTokenRepository extends JpaRepository<DeviceEnrollmentToken, String> {
    Optional<DeviceEnrollmentToken> findByToken(String token);
    List<DeviceEnrollmentToken> findByCreatedByIdOrderByCreatedAtDesc(String userId);
}
