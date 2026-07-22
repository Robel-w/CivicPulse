package com.civicpulse.backend.service;

import com.civicpulse.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CleanupTask {

    private static final Logger log = LoggerFactory.getLogger(CleanupTask.class);
    private static final int RETENTION_DAYS = 30;

    private final NotificationRepository notificationRepository;

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldReadNotifications() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        int deleted = notificationRepository.deleteByIsReadTrueAndCreatedAtBefore(cutoff);
        log.info("Cleanup removed {} read notifications older than {} days", deleted, RETENTION_DAYS);
    }
}
