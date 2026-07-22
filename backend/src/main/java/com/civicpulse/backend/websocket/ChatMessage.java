package com.civicpulse.backend.websocket;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long feedbackId;
    private String sender;
    private String content;
    private LocalDateTime timestamp;

    public ChatMessage(Long feedbackId, String sender, String content) {
        this.feedbackId = feedbackId;
        this.sender = sender;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

}
