package com.quickcare.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Doctor {
    private String doctorId;
    private String uid;
    private String fullName;
    private String email;
    private String phone;
    private String specialization;
    private String qualification;
    private int experience; // years
    private String medicalRegistrationNumber;
    private double consultationFee;
    private List<String> availableDays = new ArrayList<>();
    private String workingHours; // e.g. "09:00 AM - 05:00 PM"
    private String workingStartTime = "09:00 AM";
    private String workingEndTime = "05:00 PM";
    private String breakStartTime = "01:00 PM";
    private String breakEndTime = "02:00 PM";
    private int slotDurationMinutes = 15;
    private String timezone = "Asia/Kolkata";
    private List<String> holidays = new ArrayList<>();
    private String activeConsultationId;
    private String onlineStatus = "AVAILABLE_FOR_VIDEO"; // ONLINE, AVAILABLE_FOR_VIDEO, BUSY, OFFLINE
    private boolean videoConsultationAvailable = true;
    private String verificationStatus; // PENDING, VERIFIED, REJECTED
    private String profileImage;
    private String gender; // Male, Female, Other
    private double rating;
    private int reviewCount;
    private String bio;
    private String clinicAddress;
    private Instant createdAt;

    public Doctor() {
        this.createdAt = Instant.now();
        this.verificationStatus = "PENDING";
        this.rating = 4.8;
        this.reviewCount = 0;
    }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public int getExperience() { return experience; }
    public void setExperience(int experience) { this.experience = experience; }

    public String getMedicalRegistrationNumber() { return medicalRegistrationNumber; }
    public void setMedicalRegistrationNumber(String medicalRegistrationNumber) { this.medicalRegistrationNumber = medicalRegistrationNumber; }

    public double getConsultationFee() { return consultationFee; }
    public void setConsultationFee(double consultationFee) { this.consultationFee = consultationFee; }

    public List<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(List<String> availableDays) { this.availableDays = availableDays; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public String getWorkingStartTime() { return workingStartTime; }
    public void setWorkingStartTime(String workingStartTime) { this.workingStartTime = workingStartTime; }

    public String getWorkingEndTime() { return workingEndTime; }
    public void setWorkingEndTime(String workingEndTime) { this.workingEndTime = workingEndTime; }

    public String getBreakStartTime() { return breakStartTime; }
    public void setBreakStartTime(String breakStartTime) { this.breakStartTime = breakStartTime; }

    public String getBreakEndTime() { return breakEndTime; }
    public void setBreakEndTime(String breakEndTime) { this.breakEndTime = breakEndTime; }

    public int getSlotDurationMinutes() { return slotDurationMinutes; }
    public void setSlotDurationMinutes(int slotDurationMinutes) { this.slotDurationMinutes = slotDurationMinutes; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public List<String> getHolidays() { return holidays; }
    public void setHolidays(List<String> holidays) { this.holidays = holidays != null ? holidays : new ArrayList<>(); }

    public String getActiveConsultationId() { return activeConsultationId; }
    public void setActiveConsultationId(String activeConsultationId) { this.activeConsultationId = activeConsultationId; }

    public String getOnlineStatus() { return onlineStatus != null ? onlineStatus : "AVAILABLE_FOR_VIDEO"; }
    public void setOnlineStatus(String onlineStatus) { this.onlineStatus = onlineStatus; }

    public boolean isVideoConsultationAvailable() { return videoConsultationAvailable; }
    public void setVideoConsultationAvailable(boolean videoConsultationAvailable) { this.videoConsultationAvailable = videoConsultationAvailable; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
