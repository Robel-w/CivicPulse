package com.civicpulse.backend.service;

import com.civicpulse.backend.model.Notification;
import com.civicpulse.backend.model.User;
import com.civicpulse.backend.model.UserRole;
import com.civicpulse.backend.repository.NotificationRepository;
import com.civicpulse.backend.repository.UserRepository;
import com.civicpulse.backend.util.GeoUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Async
    public void sendNotification(Long userId, String message, String type, Long relatedEntityId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Broadcast to WebSocket topic
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, saved);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Async
    public void notifyAdminsInSector(String sector, String message, Long feedbackId, Double issueLat, Double issueLng) {
        if (sector == null || sector.isBlank()) return;

        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            if (sector.equalsIgnoreCase(admin.getSector())) {
                if (admin.getLatitude() != null && admin.getLongitude() != null && issueLat != null && issueLng != null) {
                    double dist = GeoUtils.haversineKm(admin.getLatitude(), admin.getLongitude(), issueLat, issueLng);
                    if (dist > 15.0) {
                        continue; // Skip admin outside the 15km area
                    }
                }
                sendNotification(admin.getId(), message, "NEW_FEEDBACK_IN_SECTOR", feedbackId);
            }
        }
    }
}
