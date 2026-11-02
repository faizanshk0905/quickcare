package com.quickcare.controller;

import com.quickcare.dto.AiChatRequest;
import com.quickcare.dto.AiChatResponse;
import com.quickcare.dto.ApiResponse;
import com.quickcare.service.AiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest req) {
        AiChatResponse response = aiService.processMessage(req);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
