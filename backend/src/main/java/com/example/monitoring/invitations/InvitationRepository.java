package com.example.monitoring.invitations;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, String> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByInviterIdOrderByCreatedAtDesc(String inviterId);
    List<Invitation> findByEmail(String email);
    long countByStatus(String status);
}
