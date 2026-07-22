package com.civicpulse.backend.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    @NotBlank(message = "Username is Required!")
    @Size(min = 3, max = 50, message = "username must be between 3 to 50")
    private String username;

    @NotBlank(message = "Email is required!")
    @Email(message = "please provide a valid email")
    private String email;

    @NotBlank(message = "Password is Required!")
    @Size(min = 5, message = "password must be atleast 5 characters")
    private String password;

    private String role;
    private String sector;
    private Double latitude;
    private Double longitude;
}
