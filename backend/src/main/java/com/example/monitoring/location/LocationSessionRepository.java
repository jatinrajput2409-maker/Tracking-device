package com.example.monitoring.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationSessionRepository extends JpaRepository<LocationSession, String> {
    Optional<LocationSession> findBySessionToken(String sessionToken);
    List<LocationSession> findByUserIdOrderByStartedAtDesc(String userId);
    List<LocationSession> findByDeviceIdAndStatus(String deviceId, String status);
    long countByStatus(String status);
}
