package com.quickcare.model;

import java.time.Instant;

public class Notification {
    private String notificationId;
    private String userId;
    private String title;
    private String message;
    private String type; // APPOINTMENT_BOOKED, APPOINTMENT_CONFIRMED, APPOINTMENT_REJECTED, APPOINTMENT_CANCELLED, REMINDER, PRESCRIPTION_ISSUED, DOCTOR_VERIFIED
    private boolean isRead;
    private String referenceId; // e.g. appointmentId or prescriptionId
    private Instant createdAt;

    public Notification() {
        this.createdAt = Instant.now();
        this.isRead = false;
    }

    public Notification(String notificationId, String userId, String title, String message, String type, String referenceId) {
        this();
        this.notificationId = notificationId;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.referenceId = referenceId;
    }

    public String getNotificationId() { return notificationId; }
    public void setNotificationId(String notificationId) { this.notificationId = notificationId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
