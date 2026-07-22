package com.civicpulse.backend.controller;

import com.civicpulse.backend.dto.AuthResponse;
import com.civicpulse.backend.dto.ProfileUpdateRequest;
import com.civicpulse.backend.model.User;
import com.civicpulse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/profile/{username}")
    public ResponseEntity<AuthResponse> getProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));
        
        AuthResponse response = new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getSector(),
                user.getLatitude(),
                user.getLongitude(),
                user.getProfilePicture()
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile/{username}")
    public ResponseEntity<AuthResponse> updateProfile(@PathVariable String username, @RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(request.getPassword());
        }
        if (request.getLatitude() != null) {
            user.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            user.setLongitude(request.getLongitude());
        }
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }

        User updatedUser = userRepository.save(user);

        AuthResponse response = new AuthResponse(
                updatedUser.getId(),
                updatedUser.getUsername(),
                updatedUser.getEmail(),
                updatedUser.getRole().name(),
                updatedUser.getSector(),
                updatedUser.getLatitude(),
                updatedUser.getLongitude(),
                updatedUser.getProfilePicture()
        );
        return ResponseEntity.ok(response);
    }
}
