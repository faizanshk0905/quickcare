package com.quickcare.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AiConversation {
    private String conversationId;
    private String patientId;
    private List<ChatMessage> messages = new ArrayList<>();
    private Instant createdAt;
    private Instant updatedAt;

    public AiConversation() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
