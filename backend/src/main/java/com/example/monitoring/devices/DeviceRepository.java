package com.example.monitoring.devices;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    List<Device> findByUserId(String userId);
    Page<Device> findByUserId(String userId, Pageable pageable);
    Optional<Device> findByIdAndUserId(String id, String userId);
    long countByStatus(String status);
    long countByIsOnlineTrue();
}
