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
    private boolean patientCheckedIn = false;
    private Instant checkedInAt;
    private boolean admitted = false;
    private Instant admittedAt;
    private Instant consultationStartedAt;
    private Instant consultationEndedAt;
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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
