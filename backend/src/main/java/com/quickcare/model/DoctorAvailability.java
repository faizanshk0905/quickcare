package com.quickcare.model;

import java.util.ArrayList;
import java.util.List;

public class DoctorAvailability {
    private String availabilityId;
    private String doctorId;
    private String date; // YYYY-MM-DD
    private List<String> availableSlots = new ArrayList<>();
    private List<String> bookedSlots = new ArrayList<>();
    private String workingHours;

    public DoctorAvailability() {}

    public DoctorAvailability(String availabilityId, String doctorId, String date, List<String> availableSlots) {
        this.availabilityId = availabilityId;
        this.doctorId = doctorId;
        this.date = date;
        this.availableSlots = availableSlots != null ? availableSlots : new ArrayList<>();
        this.bookedSlots = new ArrayList<>();
    }

    public String getAvailabilityId() { return availabilityId; }
    public void setAvailabilityId(String availabilityId) { this.availabilityId = availabilityId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(List<String> availableSlots) { this.availableSlots = availableSlots; }

    public List<String> getBookedSlots() { return bookedSlots; }
    public void setBookedSlots(List<String> bookedSlots) { this.bookedSlots = bookedSlots; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }
}
