package com.example.monitoring;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("dev")
class MonitoringPlatformApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring context, JPA repositories, SecurityFilterChain, and H2 database load correctly
    }
}
