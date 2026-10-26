package com.example.monitoring.consent;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsentRepository extends JpaRepository<ConsentRecord, String> {
    List<ConsentRecord> findByUserIdOrderByCreatedAtDesc(String userId);
    Page<ConsentRecord> findByUserId(String userId, Pageable pageable);
    long countByGrantedTrue();
    long countByRevokedAtIsNotNull();
}
