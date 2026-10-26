package com.example.monitoring.location;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationPointRepository extends JpaRepository<LocationPoint, String> {
    List<LocationPoint> findBySessionIdOrderByCapturedAtAsc(String sessionId);
    Optional<LocationPoint> findFirstBySessionIdOrderByCapturedAtDesc(String sessionId);
}
