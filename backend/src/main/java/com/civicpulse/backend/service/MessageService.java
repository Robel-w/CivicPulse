package com.civicpulse.backend.service;

import com.civicpulse.backend.model.Feedback;
import com.civicpulse.backend.model.Message;
import com.civicpulse.backend.model.User;
import com.civicpulse.backend.repository.FeedbackRepository;
import com.civicpulse.backend.repository.MessageRepository;
import com.civicpulse.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;

    public Message saveMessage(Long feedbackId, String username, String content){
        User user = userRepository.findByUsername(username).orElseThrow(()->new RuntimeException("User not Found!"));
        Feedback feedback = feedbackRepository.findById(feedbackId).orElseThrow(()-> new RuntimeException("feedback not found!"));

        Message message = new Message();
        message.setContent(content);
        message.setUser(user);
        message.setFeedback(feedback);

        return messageRepository.save(message);
    }
}
