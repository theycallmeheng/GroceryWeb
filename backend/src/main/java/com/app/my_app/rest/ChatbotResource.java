package com.app.my_app.rest;

import com.app.my_app.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotResource {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/ask")
    public Map<String, Object> askBot(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        return chatbotService.processMessage(message != null ? message : "");
    }
}
