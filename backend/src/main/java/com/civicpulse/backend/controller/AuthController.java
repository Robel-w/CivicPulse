package com.civicpulse.backend.controller;

import com.civicpulse.backend.dto.LoginRequest;
import com.civicpulse.backend.dto.RegisterRequest;
import com.civicpulse.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register (@Valid @RequestBody RegisterRequest request){
        String message = authService.register(request);
        return ResponseEntity.ok(message);
    }
    @PostMapping("/login")
    public ResponseEntity<com.civicpulse.backend.dto.AuthResponse> login(@Valid @RequestBody LoginRequest request){
        com.civicpulse.backend.dto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

}
