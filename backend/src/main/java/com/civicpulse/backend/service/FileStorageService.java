package com.civicpulse.backend.service;

import com.civicpulse.backend.model.Attachment;
import com.civicpulse.backend.model.Feedback;
import com.civicpulse.backend.repository.AttachmentRepository;
import com.civicpulse.backend.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class FileStorageService {

    private final AttachmentRepository attachmentRepository;
    private final FeedbackRepository feedbackRepository;

    public FileStorageService(AttachmentRepository attachmentRepository, FeedbackRepository feedbackRepository) {
        this.attachmentRepository = attachmentRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public Attachment storeFile(MultipartFile file, Long feedbackId) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        if (fileName.contains("..")) {
            throw new RuntimeException("Sorry! Filename contains invalid path sequence " + fileName);
        }

        Feedback feedback = null;
        if (feedbackId != null) {
            feedback = feedbackRepository.findById(feedbackId)
                    .orElseThrow(() -> new RuntimeException("Feedback not found"));
        }

        Attachment attachment = Attachment.builder()
                .fileName(fileName)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .data(file.getBytes())
                .feedback(feedback)
                .build();

        return attachmentRepository.save(attachment);
    }

    public Attachment getFile(Long fileId) {
        return attachmentRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
    }

    public List<Attachment> getFilesByFeedback(Long feedbackId) {
        return attachmentRepository.findByFeedbackId(feedbackId);
    }
}
