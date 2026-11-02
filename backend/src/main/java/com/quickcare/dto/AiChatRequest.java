package com.quickcare.dto;

import jakarta.validation.constraints.NotBlank;

public class AiChatRequest {
    @NotBlank(message = "Message cannot be empty")
    private String message;
    private String language = "en"; // en, hi, mr
    private String conversationId;

    public AiChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
}
