package com.quickcare.dto;

import java.util.List;

public class AvailabilityUpdateRequest {
    private String doctorId;
    private String date; // YYYY-MM-DD
    private List<String> availableSlots;
    private String workingHours;

    public AvailabilityUpdateRequest() {}

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(List<String> availableSlots) { this.availableSlots = availableSlots; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }
}
