package com.civicpulse.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequest {
    @NotBlank(message = "Title is required! ")
    private String title;

    @NotBlank(message = "Category is required! ")
    private String category;

    @NotBlank(message = "Description is required!")
    private String description;

    // Required for map-based flows
    private Double latitude;
    private Double longitude;

    private String sector;
}
