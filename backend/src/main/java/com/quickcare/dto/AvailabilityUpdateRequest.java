package com.quickcare.dto;

import java.util.List;

public class AvailabilityUpdateRequest {
    private String doctorId;
    private String date; // YYYY-MM-DD
    private List<String> availableSlots;
    private String workingHours;
    private List<String> workingDays;
    private String workingStartTime;
    private String workingEndTime;
    private String breakStartTime;
    private String breakEndTime;
    private Integer slotDurationMinutes;
    private List<String> holidays;
    private String timezone;

    public AvailabilityUpdateRequest() {}

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(List<String> availableSlots) { this.availableSlots = availableSlots; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public List<String> getWorkingDays() { return workingDays; }
    public void setWorkingDays(List<String> workingDays) { this.workingDays = workingDays; }

    public String getWorkingStartTime() { return workingStartTime; }
    public void setWorkingStartTime(String workingStartTime) { this.workingStartTime = workingStartTime; }

    public String getWorkingEndTime() { return workingEndTime; }
    public void setWorkingEndTime(String workingEndTime) { this.workingEndTime = workingEndTime; }

    public String getBreakStartTime() { return breakStartTime; }
    public void setBreakStartTime(String breakStartTime) { this.breakStartTime = breakStartTime; }

    public String getBreakEndTime() { return breakEndTime; }
    public void setBreakEndTime(String breakEndTime) { this.breakEndTime = breakEndTime; }

    public Integer getSlotDurationMinutes() { return slotDurationMinutes; }
    public void setSlotDurationMinutes(Integer slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }

    public List<String> getHolidays() { return holidays; }
    public void setHolidays(List<String> holidays) { this.holidays = holidays; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
}
