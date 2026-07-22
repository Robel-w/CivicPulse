package com.civicpulse.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String username;
    private String email;
    private String password;
    private Double latitude;
    private Double longitude;
    private String profilePicture;
}
