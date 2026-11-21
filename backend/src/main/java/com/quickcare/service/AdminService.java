package com.quickcare.service;

import com.quickcare.dto.DashboardStatsDto;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.Patient;
import com.quickcare.model.User;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        List<Patient> patients = db.findAllPatients();
        List<Doctor> doctors = db.findAllDoctors();
        List<Appointment> appointments = db.findAllAppointments();

        stats.setTotalPatients(patients.size());
        stats.setTotalDoctors(doctors.size());

        long verifiedDocs = doctors.stream().filter(d -> "VERIFIED".equalsIgnoreCase(d.getVerificationStatus())).count();
        long pendingDocs = doctors.stream().filter(d -> "PENDING".equalsIgnoreCase(d.getVerificationStatus())).count();

        stats.setVerifiedDoctors(verifiedDocs);
        stats.setPendingDoctorApprovals(pendingDocs);

        stats.setTotalAppointments(appointments.size());
        stats.setConfirmedAppointments(appointments.stream().filter(a -> "CONFIRMED".equalsIgnoreCase(a.getStatus())).count());
        stats.setCompletedAppointments(appointments.stream().filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus())).count());
        stats.setCancelledAppointments(appointments.stream().filter(a -> "CANCELLED".equalsIgnoreCase(a.getStatus())).count());
        stats.setPendingAppointments(appointments.stream().filter(a -> "PENDING".equalsIgnoreCase(a.getStatus())).count());

        String today = LocalDate.now().toString();
        stats.setTodayAppointments(appointments.stream().filter(a -> today.equals(a.getAppointmentDate())).count());

        // Specialization Breakdown
        Map<String, Long> specMap = doctors.stream()
                .filter(d -> d.getSpecialization() != null)
                .collect(Collectors.groupingBy(d -> d.getSpecialization(), Collectors.counting()));
        stats.setSpecializationStats(specMap);

        // Monthly appointments breakdown
        Map<String, Long> monthly = new HashMap<>();
        for (Appointment a : appointments) {
            if (a.getAppointmentDate() != null && a.getAppointmentDate().length() >= 7) {
                String monthKey = a.getAppointmentDate().substring(0, 7); // YYYY-MM
                monthly.put(monthKey, monthly.getOrDefault(monthKey, 0L) + 1L);
            }
        }
        stats.setMonthlyAppointments(monthly);

        return stats;
    }

    public Doctor syncDoctorFromFrontend(Map<String, Object> body) {
        String doctorId = body.getOrDefault("doctorId", "").toString();
        String uid      = body.getOrDefault("uid", doctorId).toString();

        // Check if already in Firestore (in-memory mirror)
        Doctor existing = db.findDoctorById(doctorId).orElse(null);
        if (existing == null) existing = db.findDoctorByUid(uid).orElse(null);

        Doctor doc = existing != null ? existing : new Doctor();
        if (doc.getDoctorId() == null || doc.getDoctorId().isEmpty()) doc.setDoctorId(doctorId);
        if (doc.getUid()      == null || doc.getUid().isEmpty())      doc.setUid(uid);

        if (body.get("fullName")   != null) doc.setFullName(body.get("fullName").toString());
        if (body.get("email")      != null) doc.setEmail(body.get("email").toString());
        if (body.get("phone")      != null) doc.setPhone(body.get("phone").toString());
        if (body.get("specialization") != null) doc.setSpecialization(body.get("specialization").toString());
        if (body.get("qualifications") != null) doc.setQualification(body.get("qualifications").toString());
        if (body.get("medicalRegistrationNumber") != null) doc.setMedicalRegistrationNumber(body.get("medicalRegistrationNumber").toString());
        if (body.get("city")           != null) doc.setClinicAddress(body.get("city").toString());
        if (body.get("clinicAddress")  != null) doc.setClinicAddress(body.get("clinicAddress").toString());
        if (body.get("bio")            != null) doc.setBio(body.get("bio").toString());
        if (body.get("profileImage")   != null) doc.setProfileImage(body.get("profileImage").toString());
        if (body.get("verificationStatus") != null) doc.setVerificationStatus(body.get("verificationStatus").toString());
        if (body.get("approvalStatus")     != null) doc.setApprovalStatus(body.get("approvalStatus").toString());
        if (body.get("rejectionReason")    != null) doc.setRejectionReason(body.get("rejectionReason").toString());
        if (body.get("consultationFee") instanceof Number) doc.setConsultationFee(((Number) body.get("consultationFee")).doubleValue());
        if (body.get("rating")          instanceof Number) doc.setRating(((Number) body.get("rating")).doubleValue());
        if (body.get("reviewCount")     instanceof Number) doc.setReviewCount(((Number) body.get("reviewCount")).intValue());
        if (body.get("slotDurationMinutes") instanceof Number) doc.setSlotDurationMinutes(((Number) body.get("slotDurationMinutes")).intValue());
        if (body.get("workingStartTime") != null) doc.setWorkingStartTime(body.get("workingStartTime").toString());
        if (body.get("workingEndTime")   != null) doc.setWorkingEndTime(body.get("workingEndTime").toString());
        doc.setVideoConsultationAvailable(true);

        Doctor savedDoctor = db.saveDoctor(doc);

        // Also save to 'users' collection in Firestore
        try {
            User user = db.findUserByUid(uid).orElse(null);
            if (user == null && doc.getEmail() != null) user = db.findUserByEmail(doc.getEmail()).orElse(null);
            if (user == null) user = new User();
            user.setUid(uid);
            user.setEmail(doc.getEmail());
            user.setFullName(doc.getFullName());
            user.setPhone(doc.getPhone());
            user.setRole("DOCTOR");
            user.setAccountStatus("VERIFIED".equalsIgnoreCase(doc.getVerificationStatus()) ? "ACTIVE" : "PENDING");
            user.setEmailVerified(true);
            db.saveUser(user);
        } catch (Exception e) {
            // ignore
        }

        return savedDoctor;
    }

    public Patient syncPatientFromFrontend(Map<String, Object> body) {
        String patientId = body.getOrDefault("patientId", "").toString();
        String uid       = body.getOrDefault("uid", patientId).toString();
        if (patientId.isEmpty()) patientId = "pat_" + uid;

        Patient pat = db.findPatientById(patientId).orElse(null);
        if (pat == null) pat = new Patient();

        if (pat.getPatientId() == null || pat.getPatientId().isEmpty()) pat.setPatientId(patientId);
        if (pat.getUid()       == null || pat.getUid().isEmpty())       pat.setUid(uid);

        if (body.get("fullName")    != null) pat.setFullName(body.get("fullName").toString());
        if (body.get("email")       != null) pat.setEmail(body.get("email").toString());
        if (body.get("phone")       != null) pat.setPhone(body.get("phone").toString());
        if (body.get("dateOfBirth") != null) pat.setDateOfBirth(body.get("dateOfBirth").toString());
        if (body.get("gender")      != null) pat.setGender(body.get("gender").toString());
        if (body.get("address")     != null) pat.setAddress(body.get("address").toString());
        if (body.get("profileImage") != null) pat.setProfileImage(body.get("profileImage").toString());
        if (body.get("age") instanceof Number) pat.setAge(((Number) body.get("age")).intValue());
        pat.setEmailVerified(true);

        Patient savedPatient = db.savePatient(pat);

        // Also save to 'users' collection in Firestore
        try {
            User user = db.findUserByUid(uid).orElse(null);
            if (user == null && pat.getEmail() != null) user = db.findUserByEmail(pat.getEmail()).orElse(null);
            if (user == null) user = new User();
            user.setUid(uid);
            user.setEmail(pat.getEmail());
            user.setFullName(pat.getFullName());
            user.setPhone(pat.getPhone());
            user.setRole("PATIENT");
            user.setAccountStatus("ACTIVE");
            user.setEmailVerified(true);
            db.saveUser(user);
        } catch (Exception e) {
            // ignore
        }

        return savedPatient;
    }

    public Doctor verifyDoctor(String doctorId, boolean approve, String feedback) {
        Doctor doctor = db.findDoctorById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        String newStatus = approve ? "VERIFIED" : "REJECTED";
        if ("PENDING".equalsIgnoreCase(feedback)) {
            newStatus = "PENDING";
        }
        doctor.setVerificationStatus(newStatus);
        doctor.setApprovalStatus(approve ? "APPROVED" : ("PENDING".equalsIgnoreCase(feedback) ? "PENDING" : "REJECTED"));
        if (!approve && feedback != null && !feedback.trim().isEmpty()) {
            doctor.setRejectionReason(feedback.trim());
        } else if (approve) {
            doctor.setRejectionReason(null);
        }
        Doctor saved = db.saveDoctor(doctor);

        // Update User account status as well
        final String targetStatus = newStatus;
        db.findUserByUid(doctor.getUid()).ifPresent(u -> {
            u.setAccountStatus("VERIFIED".equals(targetStatus) ? "ACTIVE" : ("PENDING".equals(targetStatus) ? "PENDING" : "INACTIVE"));
            db.saveUser(u);
        });

        // Send notification
        String msg = approve
                ? "Congratulations Dr. " + doctor.getFullName() + "! Your QuickCare credentials have been verified. You can now accept patient appointments."
                : "Your verification request could not be approved. Reason: " + (feedback != null ? feedback : "Document verification failed.");
        notificationService.sendNotification(doctor.getUid(), "Verification Status Update", msg, "DOCTOR_VERIFIED", doctorId);

        return saved;
    }

    public User updateUserStatus(String userId, String status) {
        User user = db.findUserByUid(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setAccountStatus(status.toUpperCase());
        return db.saveUser(user);
    }

    public List<Doctor> getAllDoctors() {
        return db.findAllDoctors();
    }

    public List<Patient> getAllPatients() {
        return db.findAllPatients();
    }

    public List<Appointment> getAllAppointments() {
        return db.findAllAppointments();
    }
}
