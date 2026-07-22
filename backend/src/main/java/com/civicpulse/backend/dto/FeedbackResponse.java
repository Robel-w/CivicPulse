package com.civicpulse.backend.dto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {
    private  Long id;
    private String title;
    private String category;
    private String description;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private String username;

    private String sector;
    private String imageUrl;
    private String status;

    private List<MessageResponse> messages;


}
