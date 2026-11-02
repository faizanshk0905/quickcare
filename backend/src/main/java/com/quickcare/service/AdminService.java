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
                .collect(Collectors.groupingBy(Doctor::getSpecialization, Collectors.counting()));
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

    public Doctor verifyDoctor(String doctorId, boolean approve, String feedback) {
        Doctor doctor = db.findDoctorById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + doctorId));

        String newStatus = approve ? "VERIFIED" : "REJECTED";
        doctor.setVerificationStatus(newStatus);
        Doctor saved = db.saveDoctor(doctor);

        // Update User account status as well
        db.findUserByUid(doctor.getUid()).ifPresent(u -> {
            u.setAccountStatus(approve ? "ACTIVE" : "INACTIVE");
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
