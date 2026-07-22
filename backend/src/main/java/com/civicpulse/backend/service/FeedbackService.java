package com.civicpulse.backend.service;

import com.civicpulse.backend.dto.FeedbackRequest;
import com.civicpulse.backend.dto.FeedbackResponse;
import com.civicpulse.backend.dto.MessageResponse;
import com.civicpulse.backend.model.Feedback;
import com.civicpulse.backend.model.User;
import com.civicpulse.backend.repository.FeedbackRepository;
import com.civicpulse.backend.repository.UserRepository;
import com.civicpulse.backend.util.GeoUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${app.public-url:http://localhost:8080}")
    private String publicUrl;

    //Create new feedback

    public FeedbackResponse createFeedback(FeedbackRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new RuntimeException("Latitude/Longitude are required");
        }

        Feedback feedback = new Feedback();
        feedback.setTitle(request.getTitle());
        feedback.setCategory(request.getCategory());
        feedback.setSector(request.getSector());
        feedback.setDescription(request.getDescription());
        feedback.setLatitude(request.getLatitude());
        feedback.setLongitude(request.getLongitude());
        feedback.setUser(user);

        Feedback savedFeedback = feedbackRepository.save(feedback);

        // Notify admins assigned to this sector (async)
        notificationService.notifyAdminsInSector(
                savedFeedback.getSector(),
                "New issue reported in sector " + savedFeedback.getSector() + ": " + savedFeedback.getTitle(),
                savedFeedback.getId(),
                savedFeedback.getLatitude(),
                savedFeedback.getLongitude()
        );

        return convertToResponse(savedFeedback);
    }

    //Get all feedback with their messages (chat history)
    public List<FeedbackResponse> getAllFeedback() {
        return feedbackRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    //Get single feedback with full chat history
    public FeedbackResponse getFeedbackById(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));

        return convertToResponse(feedback);
    }

    public List<FeedbackResponse> getNearby(Double lat, Double lng, Double radiusKm, String category) {
        if (lat == null || lng == null) {
            throw new RuntimeException("lat/lng are required");
        }
        if (radiusKm == null || radiusKm <= 0) {
            radiusKm = 5.0;
        }

        double latDelta = radiusKm / 111.32;
        double lngDelta = radiusKm / (111.32 * Math.cos(Math.toRadians(lat)));
        double minLat = lat - latDelta;
        double maxLat = lat + latDelta;
        double minLng = lng - lngDelta;
        double maxLng = lng + lngDelta;

        List<Feedback> candidates = feedbackRepository.findByLatitudeBetweenAndLongitudeBetween(minLat, maxLat, minLng, maxLng);

        final double finalRadiusKm = radiusKm;
        return candidates.stream()
                .filter(f -> f.getLatitude() != null && f.getLongitude() != null)
                .filter(f -> GeoUtils.haversineKm(lat, lng, f.getLatitude(), f.getLongitude()) <= finalRadiusKm)
                .filter(f -> {
                    if (category == null || category.isBlank()) {
                        return true;
                    }
                    String fCat = f.getCategory();
                    String fSec = f.getSector();
                    return (fCat != null && fCat.equalsIgnoreCase(category)) || 
                           (fSec != null && fSec.equalsIgnoreCase(category));
                })
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public FeedbackResponse updateStatus(Long id, String status) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        feedback.setStatus(status.toUpperCase());
        return convertToResponse(feedbackRepository.save(feedback));
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<FeedbackResponse> getInvolvedFeedback(String username) {
        return feedbackRepository.findInvolvedFeedback(username).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    //Helper method to convert Entity → DTO (including messages)
    public List<FeedbackResponse> getFeedbackBySector(String sector) {
        return feedbackRepository.findBySector(sector).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    //Helper method to convert Entity → DTO (including messages)
    private FeedbackResponse convertToResponse(Feedback feedback) {
        // Convert messages from entity to MessageResponse DTO
        List<MessageResponse> messageResponses = feedback.getMessages().stream()
                .map(message -> new MessageResponse(
                        message.getId(),
                        message.getUser().getUsername(),   // sender
                        message.getContent(),
                        message.getTimestamp()
                ))
                .collect(Collectors.toList());

        String imageUrl = null;
        if (feedback.getAttachments() != null && !feedback.getAttachments().isEmpty()) {
            imageUrl = publicUrl + "/api/files/download/" + feedback.getAttachments().get(0).getId();
        }

        return new FeedbackResponse(
                feedback.getId(),
                feedback.getTitle(),
                feedback.getCategory(),
                feedback.getDescription(),
                feedback.getLatitude(),
                feedback.getLongitude(),
                feedback.getCreatedAt(),
                feedback.getUser().getUsername(),
                feedback.getSector(),
                imageUrl,
                feedback.getStatus(),
                messageResponses                     // ← Chat history
        );
    }
}