package com.civicpulse.backend.controller;
import com.civicpulse.backend.dto.FeedbackRequest;
import com.civicpulse.backend.dto.FeedbackResponse;
import com.civicpulse.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor

public class FeedbackController {
    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackResponse> createFeedback(
            @Valid @RequestBody FeedbackRequest request, @RequestParam String username
    ){
        FeedbackResponse response = feedbackService.createFeedback(request, username);
        return ResponseEntity.ok(response);
    }
    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> getAllFeedback(){
        return ResponseEntity.ok(feedbackService.getAllFeedback());
    }
    @GetMapping("/involved")
    public ResponseEntity<List<FeedbackResponse>> getInvolvedFeedback(@RequestParam String username) {
        return ResponseEntity.ok(feedbackService.getInvolvedFeedback(username));
    }
    @GetMapping("/sector/{sector}")
    public ResponseEntity<List<FeedbackResponse>> getFeedbackBySector(@PathVariable String sector) {
        return ResponseEntity.ok(feedbackService.getFeedbackBySector(sector));
    }
    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponse> getFeedbackById(@PathVariable Long id){
        return ResponseEntity.ok(feedbackService.getFeedbackById(id));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<FeedbackResponse>> getNearby(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "5") Double radiusKm,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(feedbackService.getNearby(lat, lng, radiusKm, category));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<FeedbackResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(feedbackService.updateStatus(id, status));
    }
}
