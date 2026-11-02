package com.quickcare.model;

import java.time.Instant;

public class ChatMessage {
    private String sender; // USER, ASSISTANT, SYSTEM
    private String content;
    private Instant timestamp;
    private String suggestedSpecialization;
    private boolean isEmergency;

    public ChatMessage() {
        this.timestamp = Instant.now();
    }

    public ChatMessage(String sender, String content) {
        this();
        this.sender = sender;
        this.content = content;
    }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getSuggestedSpecialization() { return suggestedSpecialization; }
    public void setSuggestedSpecialization(String suggestedSpecialization) { this.suggestedSpecialization = suggestedSpecialization; }

    public boolean isEmergency() { return isEmergency; }
    public void setEmergency(boolean emergency) { isEmergency = emergency; }
}
