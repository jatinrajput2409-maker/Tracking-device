package com.example.monitoring.modules;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserModuleAccessRepository extends JpaRepository<UserModuleAccess, String> {
    List<UserModuleAccess> findByUserId(String userId);
    Optional<UserModuleAccess> findByUserIdAndModuleId(String userId, String moduleId);
    void deleteByUserIdAndModuleId(String userId, String moduleId);
}
