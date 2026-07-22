package com.civicpulse.backend.config;

import com.civicpulse.backend.model.User;
import com.civicpulse.backend.model.UserRole;
import com.civicpulse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Seed default regular user
        if (userRepository.findByUsername("user").isEmpty() && userRepository.findByEmail("user@civicpulse.org").isEmpty()) {
            User user = new User();
            user.setUsername("user");
            user.setEmail("user@civicpulse.org");
            user.setPassword("password123");
            user.setRole(UserRole.USER);
            user.setLatitude(9.03);
            user.setLongitude(38.74);
            userRepository.save(user);
        } else {
            userRepository.findByUsername("user").ifPresent(u -> {
                if (u.getLatitude() == null || Math.abs(u.getLatitude() - 40.7128) < 0.01) {
                    u.setLatitude(9.03);
                    u.setLongitude(38.74);
                    userRepository.save(u);
                }
            });
        }

        // Seed default admin for electricity sector
        if (userRepository.findByUsername("admin_elec").isEmpty() && userRepository.findByEmail("elec@civicpulse.org").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin_elec");
            admin.setEmail("elec@civicpulse.org");
            admin.setPassword("admin123");
            admin.setRole(UserRole.ADMIN);
            admin.setSector("electricity");
            admin.setLatitude(9.02);
            admin.setLongitude(38.75);
            userRepository.save(admin);
        } else {
            userRepository.findByUsername("admin_elec").ifPresent(u -> {
                if (u.getLatitude() == null || Math.abs(u.getLatitude() - 40.7306) < 0.01) {
                    u.setLatitude(9.02);
                    u.setLongitude(38.75);
                    userRepository.save(u);
                }
            });
        }

        // Seed default admin for transport sector
        if (userRepository.findByUsername("admin_trans").isEmpty() && userRepository.findByEmail("trans@civicpulse.org").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin_trans");
            admin.setEmail("trans@civicpulse.org");
            admin.setPassword("admin123");
            admin.setRole(UserRole.ADMIN);
            admin.setSector("transport");
            admin.setLatitude(9.04);
            admin.setLongitude(38.73);
            userRepository.save(admin);
        } else {
            userRepository.findByUsername("admin_trans").ifPresent(u -> {
                if (u.getLatitude() == null || Math.abs(u.getLatitude() - 40.7484) < 0.01) {
                    u.setLatitude(9.04);
                    u.setLongitude(38.73);
                    userRepository.save(u);
                }
            });
        }
    }
}
