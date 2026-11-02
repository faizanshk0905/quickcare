package com.quickcare.model;

import java.time.Instant;

public class User {
    private String uid;
    private String fullName;
    private String email;
    private String phone;
    private String role; // ADMIN, DOCTOR, PATIENT
    private String profileImage;
    private String accountStatus; // ACTIVE, PENDING, INACTIVE
    private String preferredLanguage; // en, hi, mr
    private String password; // hashed if local
    private Instant createdAt;

    public User() {
        this.createdAt = Instant.now();
        this.accountStatus = "ACTIVE";
        this.preferredLanguage = "en";
    }

    public User(String uid, String fullName, String email, String phone, String role) {
        this();
        this.uid = uid;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
