package com.civicpulse.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String sector;
    private Double latitude;
    private Double longitude;
    private String profilePicture;
}
