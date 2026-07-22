package com.civicpulse.backend.repository;

import com.civicpulse.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    int deleteByIsReadTrueAndCreatedAtBefore(LocalDateTime cutoff);
}
