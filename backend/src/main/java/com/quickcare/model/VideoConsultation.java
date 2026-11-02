package com.quickcare.model;

import java.time.Instant;

public class VideoConsultation {
    private String consultationId;
    private String appointmentId;
    private String doctorId;
    private String patientId;
    private String meetingReference; // WebRTC room identifier
    private String status; // SCHEDULED, ACTIVE, ENDED
    private Instant startTime;
    private Instant endTime;
    private Instant createdAt;

    public VideoConsultation() {
        this.createdAt = Instant.now();
        this.status = "SCHEDULED";
    }

    public String getConsultationId() { return consultationId; }
    public void setConsultationId(String consultationId) { this.consultationId = consultationId; }

    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getMeetingReference() { return meetingReference; }
    public void setMeetingReference(String meetingReference) { this.meetingReference = meetingReference; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
