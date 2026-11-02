package com.quickcare.dto;

import com.quickcare.model.Doctor;
import java.util.List;

public class AiChatResponse {
    private String reply;
    private String suggestedSpecialization;
    private List<Doctor> recommendedDoctors;
    private boolean emergency;
    private String emergencyDisclaimer;
    private String conversationId;

    public AiChatResponse() {}

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public String getSuggestedSpecialization() { return suggestedSpecialization; }
    public void setSuggestedSpecialization(String suggestedSpecialization) { this.suggestedSpecialization = suggestedSpecialization; }

    public List<Doctor> getRecommendedDoctors() { return recommendedDoctors; }
    public void setRecommendedDoctors(List<Doctor> recommendedDoctors) { this.recommendedDoctors = recommendedDoctors; }

    public boolean isEmergency() { return emergency; }
    public void setEmergency(boolean emergency) { this.emergency = emergency; }

    public String getEmergencyDisclaimer() { return emergencyDisclaimer; }
    public void setEmergencyDisclaimer(String emergencyDisclaimer) { this.emergencyDisclaimer = emergencyDisclaimer; }

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }
}
