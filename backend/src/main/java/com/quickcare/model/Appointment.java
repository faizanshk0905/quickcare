package com.quickcare.model;

import java.time.Instant;

public class Appointment {
    private String appointmentId;
    private String patientId;
    private String patientUid;
    private String doctorId;
    private String doctorUid;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String doctorName;
    private String doctorSpecialization;
    private String appointmentDate; // YYYY-MM-DD
    private String appointmentTime; // e.g. "10:00 AM"
    private String consultationType; // IN_PERSON, VIDEO
    private String reason;
    private String status; // PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED
    private String cancellationReason;
    private double consultationFee;
    private String meetingRoomId;
    private String googleMeetLink;
    private String videoConsultationLink;
    private boolean videoLinkSent = false;
    private Instant videoLinkSentAt;
    private String videoLinkSentBy;
    private String videoConsultationStatus = "WAITING_FOR_LINK"; // WAITING_FOR_LINK, LINK_SENT, COMPLETED
    private String doctorNotes;
    private Instant approvedAt;
    private Instant rejectedAt;
    private boolean patientCheckedIn = false;
    private Instant checkedInAt;
    private boolean admitted = false;
    private Instant admittedAt;
    private Instant consultationStartedAt;
    private Instant consultationEndedAt;

    // 15-Minute Confirmation & Slot Reallocation System
    private String confirmationStatus; // PENDING_CONFIRMATION, CONFIRMED, DECLINED, NOT_RESPONDED, SLOT_RELEASED
    private boolean confirmationPromptSent = false;
    private Instant confirmationPromptSentAt;
    private Instant confirmedAt;
    private Instant declinedAt;
    private Instant notRespondedAt;
    private boolean slotReleased = false;
    private Instant slotReleasedAt;
    private String slotReleasedBy;
    private java.util.List<java.util.Map<String, Object>> auditLogs = new java.util.ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;

    public Appointment() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = "PENDING";
        this.consultationType = "VIDEO";
    }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientUid() { return patientUid; }
    public void setPatientUid(String patientUid) { this.patientUid = patientUid; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDoctorUid() { return doctorUid; }
    public void setDoctorUid(String doctorUid) { this.doctorUid = doctorUid; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }

    public String getConsultationType() { return consultationType; }
    public void setConsultationType(String consultationType) { this.consultationType = consultationType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double consultationFee) { this.consultationFee = consultationFee; }

    public String getMeetingRoomId() { return meetingRoomId; }
    public void setMeetingRoomId(String meetingRoomId) { this.meetingRoomId = meetingRoomId; }

    public String getGoogleMeetLink() { return googleMeetLink; }
    public void setGoogleMeetLink(String googleMeetLink) { this.googleMeetLink = googleMeetLink; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }

    public boolean isPatientCheckedIn() { return patientCheckedIn; }
    public void setPatientCheckedIn(boolean patientCheckedIn) { this.patientCheckedIn = patientCheckedIn; }

    public Instant getCheckedInAt() { return checkedInAt; }
    public void setCheckedInAt(Instant checkedInAt) { this.checkedInAt = checkedInAt; }

    public boolean isAdmitted() { return admitted; }
    public void setAdmitted(boolean admitted) { this.admitted = admitted; }

    public Instant getAdmittedAt() { return admittedAt; }
    public void setAdmittedAt(Instant admittedAt) { this.admittedAt = admittedAt; }

    public Instant getConsultationStartedAt() { return consultationStartedAt; }
    public void setConsultationStartedAt(Instant consultationStartedAt) { this.consultationStartedAt = consultationStartedAt; }

    public Instant getConsultationEndedAt() { return consultationEndedAt; }
    public void setConsultationEndedAt(Instant consultationEndedAt) { this.consultationEndedAt = consultationEndedAt; }

    public String getConfirmationStatus() { return confirmationStatus; }
    public void setConfirmationStatus(String confirmationStatus) { this.confirmationStatus = confirmationStatus; }

    public boolean isConfirmationPromptSent() { return confirmationPromptSent; }
    public void setConfirmationPromptSent(boolean confirmationPromptSent) { this.confirmationPromptSent = confirmationPromptSent; }

    public Instant getConfirmationPromptSentAt() { return confirmationPromptSentAt; }
    public void setConfirmationPromptSentAt(Instant confirmationPromptSentAt) { this.confirmationPromptSentAt = confirmationPromptSentAt; }

    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public Instant getDeclinedAt() { return declinedAt; }
    public void setDeclinedAt(Instant declinedAt) { this.declinedAt = declinedAt; }

    public Instant getNotRespondedAt() { return notRespondedAt; }
    public void setNotRespondedAt(Instant notRespondedAt) { this.notRespondedAt = notRespondedAt; }

    public boolean isSlotReleased() { return slotReleased; }
    public void setSlotReleased(boolean slotReleased) { this.slotReleased = slotReleased; }

    public Instant getSlotReleasedAt() { return slotReleasedAt; }
    public void setSlotReleasedAt(Instant slotReleasedAt) { this.slotReleasedAt = slotReleasedAt; }

    public String getSlotReleasedBy() { return slotReleasedBy; }
    public void setSlotReleasedBy(String slotReleasedBy) { this.slotReleasedBy = slotReleasedBy; }

    public java.util.List<java.util.Map<String, Object>> getAuditLogs() { return auditLogs; }
    public void setAuditLogs(java.util.List<java.util.Map<String, Object>> auditLogs) {
        this.auditLogs = auditLogs != null ? auditLogs : new java.util.ArrayList<>();
    }

    public void addAuditLog(String action, String performedBy, String details) {
        if (this.auditLogs == null) {
            this.auditLogs = new java.util.ArrayList<>();
        }
        java.util.Map<String, Object> log = new java.util.HashMap<>();
        log.put("action", action);
        log.put("performedBy", performedBy);
        log.put("details", details);
        log.put("timestamp", Instant.now().toString());
        this.auditLogs.add(log);
    }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getVideoConsultationLink() { return videoConsultationLink; }
    public void setVideoConsultationLink(String videoConsultationLink) { this.videoConsultationLink = videoConsultationLink; }

    public boolean isVideoLinkSent() { return videoLinkSent; }
    public void setVideoLinkSent(boolean videoLinkSent) { this.videoLinkSent = videoLinkSent; }

    public Instant getVideoLinkSentAt() { return videoLinkSentAt; }
    public void setVideoLinkSentAt(Instant videoLinkSentAt) { this.videoLinkSentAt = videoLinkSentAt; }

    public String getVideoLinkSentBy() { return videoLinkSentBy; }
    public void setVideoLinkSentBy(String videoLinkSentBy) { this.videoLinkSentBy = videoLinkSentBy; }

    public String getVideoConsultationStatus() { return videoConsultationStatus; }
    public void setVideoConsultationStatus(String videoConsultationStatus) { this.videoConsultationStatus = videoConsultationStatus; }
}
