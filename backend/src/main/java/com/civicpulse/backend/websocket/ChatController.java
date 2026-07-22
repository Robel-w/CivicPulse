package com.civicpulse.backend.websocket;

import com.civicpulse.backend.model.Message;
import com.civicpulse.backend.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final MessageService messageService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.civicpulse.backend.service.NotificationService notificationService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage){
        // Save to database
        Message savedMessage = messageService.saveMessage(
                chatMessage.getFeedbackId(),
                chatMessage.getSender(),
                chatMessage.getContent()
        );

        ChatMessage responseMessage = new ChatMessage(
                savedMessage.getFeedback().getId(),
                savedMessage.getUser().getUsername(),
                savedMessage.getContent()
        );

        // Broadcast to specific feedback room
        messagingTemplate.convertAndSend("/topic/feedback/" + chatMessage.getFeedbackId(), responseMessage);

        // Trigger a notification (Async) for the feedback owner
        notificationService.sendNotification(
            savedMessage.getFeedback().getUser().getId(),
            "New message in your feedback: " + savedMessage.getFeedback().getTitle(),
            "NEW_MESSAGE",
            savedMessage.getFeedback().getId()
        );
    }
}
