package com.example.monitoring.media;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaSessionRepository extends JpaRepository<MediaSession, String> {
    Optional<MediaSession> findBySessionToken(String sessionToken);
    List<MediaSession> findByInitiatorIdOrderByCreatedAtDesc(String initiatorId);
    long countByStatus(String status);
    long countBySessionTypeAndStatus(String sessionType, String status);
}
