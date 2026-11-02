package com.quickcare.dto;

import jakarta.validation.constraints.NotBlank;

public class AppointmentRequest {
    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @NotBlank(message = "Appointment date is required")
    private String appointmentDate; // YYYY-MM-DD

    @NotBlank(message = "Appointment time slot is required")
    private String appointmentTime; // e.g. "10:00 AM"

    private String consultationType = "VIDEO"; // IN_PERSON or VIDEO

    @NotBlank(message = "Consultation reason is required")
    private String reason;

    public AppointmentRequest() {}

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }

    public String getConsultationType() { return consultationType; }
    public void setConsultationType(String consultationType) { this.consultationType = consultationType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
