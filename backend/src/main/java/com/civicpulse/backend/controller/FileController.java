package com.civicpulse.backend.controller;

import com.civicpulse.backend.model.Attachment;
import com.civicpulse.backend.service.FileStorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file,
                                                          @RequestParam(value = "feedbackId", required = false) Long feedbackId) {
        try {
            Attachment attachment = fileStorageService.storeFile(file, feedbackId);
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/download/")
                    .path(attachment.getId().toString())
                    .toUriString();

            Map<String, String> response = new HashMap<>();
            response.put("fileName", attachment.getFileName());
            response.put("fileDownloadUri", fileDownloadUri);
            response.put("fileType", file.getContentType());
            response.put("size", String.valueOf(file.getSize()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        Attachment attachment = fileStorageService.getFile(fileId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(new ByteArrayResource(attachment.getData()));
    }

    @GetMapping("/feedback/{feedbackId}")
    public ResponseEntity<List<Map<String, Object>>> getFilesByFeedback(@PathVariable Long feedbackId) {
        List<Attachment> attachments = fileStorageService.getFilesByFeedback(feedbackId);
        List<Map<String, Object>> response = attachments.stream().map(attachment -> {
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/download/")
                    .path(attachment.getId().toString())
                    .toUriString();

            Map<String, Object> map = new HashMap<>();
            map.put("id", attachment.getId());
            map.put("fileName", attachment.getFileName());
            map.put("fileDownloadUri", fileDownloadUri);
            map.put("fileType", attachment.getFileType());
            map.put("size", attachment.getFileSize());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
