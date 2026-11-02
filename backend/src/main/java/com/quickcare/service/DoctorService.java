package com.quickcare.service;

import com.quickcare.dto.AvailabilityUpdateRequest;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.DoctorAvailability;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private FirestoreDatabaseService db;

    public List<Doctor> searchDoctors(String query, String specialization, Integer minExp, Double maxFee) {
        return db.findVerifiedDoctors().stream()
                .filter(d -> {
                    if (query != null && !query.trim().isEmpty()) {
                        String q = query.toLowerCase().trim();
                        boolean matchesName = d.getFullName() != null && d.getFullName().toLowerCase().contains(q);
                        boolean matchesSpec = d.getSpecialization() != null && d.getSpecialization().toLowerCase().contains(q);
                        if (!matchesName && !matchesSpec) return false;
                    }
                    if (specialization != null && !specialization.trim().isEmpty() && !"ALL".equalsIgnoreCase(specialization)) {
                        if (d.getSpecialization() == null || !d.getSpecialization().equalsIgnoreCase(specialization.trim())) {
                            return false;
                        }
                    }
                    if (minExp != null && d.getExperience() < minExp) {
                        return false;
                    }
                    if (maxFee != null && d.getConsultationFee() > maxFee) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    public Doctor getDoctorById(String doctorId) {
        return db.findDoctorById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));
    }

    public Doctor getDoctorByUid(String uid) {
        return db.findDoctorByUid(uid)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + uid));
    }

    public Doctor updateDoctorProfile(String doctorId, Doctor updated) {
        Doctor doc = getDoctorById(doctorId);
        if (updated.getFullName() != null) doc.setFullName(updated.getFullName());
        if (updated.getSpecialization() != null) doc.setSpecialization(updated.getSpecialization());
        if (updated.getQualification() != null) doc.setQualification(updated.getQualification());
        if (updated.getExperience() > 0) doc.setExperience(updated.getExperience());
        if (updated.getConsultationFee() > 0) doc.setConsultationFee(updated.getConsultationFee());
        if (updated.getAvailableDays() != null) doc.setAvailableDays(updated.getAvailableDays());
        if (updated.getWorkingHours() != null) doc.setWorkingHours(updated.getWorkingHours());
        if (updated.getBio() != null) doc.setBio(updated.getBio());
        if (updated.getClinicAddress() != null) doc.setClinicAddress(updated.getClinicAddress());
        if (updated.getProfileImage() != null) doc.setProfileImage(updated.getProfileImage());

        return db.saveDoctor(doc);
    }

    public List<Appointment> getDoctorAppointments(String doctorId) {
        return db.findAppointmentsByDoctorId(doctorId);
    }

    public DoctorAvailability getOrCreateAvailability(String doctorId, String date) {
        Optional<DoctorAvailability> existing = db.findAvailability(doctorId, date);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Generate default slots
        List<String> defaultSlots = Arrays.asList(
                "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
                "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
        );
        DoctorAvailability da = new DoctorAvailability(doctorId + "_" + date, doctorId, date, defaultSlots);
        Doctor doc = db.findDoctorById(doctorId).orElse(null);
        if (doc != null) {
            da.setWorkingHours(doc.getWorkingHours());
        }
        return db.saveAvailability(da);
    }

    public DoctorAvailability updateAvailability(AvailabilityUpdateRequest req) {
        DoctorAvailability da = getOrCreateAvailability(req.getDoctorId(), req.getDate());
        if (req.getAvailableSlots() != null) {
            da.setAvailableSlots(req.getAvailableSlots());
        }
        if (req.getWorkingHours() != null) {
            da.setWorkingHours(req.getWorkingHours());
        }
        return db.saveAvailability(da);
    }
}
