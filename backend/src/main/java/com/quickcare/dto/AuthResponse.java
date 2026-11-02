package com.quickcare.dto;

import com.quickcare.model.User;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private User user;
    private String role;
    private String profileId; // patientId or doctorId
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, User user, String profileId, String message) {
        this.token = token;
        this.user = user;
        this.role = user != null ? user.getRole() : null;
        this.profileId = profileId;
        this.message = message;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
