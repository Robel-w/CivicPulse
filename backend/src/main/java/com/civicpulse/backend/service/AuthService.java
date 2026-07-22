package com.civicpulse.backend.service;

import com.civicpulse.backend.dto.LoginRequest;
import com.civicpulse.backend.dto.RegisterRequest;
import com.civicpulse.backend.model.User;
import com.civicpulse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor

public class AuthService {
    private final UserRepository userRepository;
    public String register(RegisterRequest request){
        if (userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email already registered!");
        }
        if(userRepository.existsByUsername(request.getUsername())){
            throw new RuntimeException("username already taken");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());

        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(com.civicpulse.backend.model.UserRole.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(com.civicpulse.backend.model.UserRole.USER);
            }
        } else {
            user.setRole(com.civicpulse.backend.model.UserRole.USER);
        }

        user.setSector(request.getSector());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());

        userRepository.save(user);
        return "User registered Successfully!";
    }
    public com.civicpulse.backend.dto.AuthResponse login(LoginRequest request){
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if(userOpt.isEmpty()){
            throw new RuntimeException("Invalid Email or password!");
        }
        User user = userOpt.get();
        if(!user.getPassword().equals(request.getPassword())){
            throw new RuntimeException("Invalid password!");
        }
        return new com.civicpulse.backend.dto.AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getSector(),
                user.getLatitude(),
                user.getLongitude(),
                user.getProfilePicture()
        );
    }
}
