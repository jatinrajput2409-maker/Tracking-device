package com.example.monitoring.modules;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleRepository extends JpaRepository<ModuleConfig, String> {
    Optional<ModuleConfig> findByModuleKey(String moduleKey);
    List<ModuleConfig> findAllByOrderByDisplayOrderAsc();
    List<ModuleConfig> findByIsEnabledTrueOrderByDisplayOrderAsc();
}
