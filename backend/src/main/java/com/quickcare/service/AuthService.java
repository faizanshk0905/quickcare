package com.quickcare.service;

import com.quickcare.dto.AuthRequest;
import com.quickcare.dto.AuthResponse;
import com.quickcare.dto.RegisterRequest;
import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.UnauthorizedException;
import com.quickcare.model.Doctor;
import com.quickcare.model.DoctorAvailability;
import com.quickcare.model.Patient;
import com.quickcare.model.User;
import com.quickcare.repository.FirestoreDatabaseService;
import com.quickcare.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationService notificationService;

    public AuthResponse register(RegisterRequest req) {
        // Enforce security rule: Public cannot register as ADMIN
        String requestedRole = req.getRole() != null ? req.getRole().toUpperCase() : "PATIENT";
        if ("ADMIN".equals(requestedRole)) {
            throw new BadRequestException("Public registration as ADMIN is not permitted.");
        }

        // Check if email already registered
        if (db.findUserByEmail(req.getEmail()).isPresent()) {
            throw new BadRequestException("An account with this email already exists.");
        }

        String uid = "usr_" + UUID.randomUUID().toString().substring(0, 8);
        User user = new User(uid, req.getFullName(), req.getEmail(), req.getPhone(), requestedRole);
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        String profileId = null;

        if ("DOCTOR".equals(requestedRole)) {
            user.setAccountStatus("PENDING"); // Doctors require admin verification

            Doctor doctor = new Doctor();
            doctor.setDoctorId("doc_" + UUID.randomUUID().toString().substring(0, 8));
            doctor.setUid(uid);
            doctor.setFullName(req.getFullName());
            doctor.setEmail(req.getEmail());
            doctor.setPhone(req.getPhone());
            doctor.setSpecialization(req.getSpecialization() != null ? req.getSpecialization() : "General Physician");
            doctor.setQualification(req.getQualification() != null ? req.getQualification() : "MBBS");
            doctor.setExperience(req.getExperience() != null ? req.getExperience() : 2);
            doctor.setMedicalRegistrationNumber(req.getMedicalRegistrationNumber() != null ? req.getMedicalRegistrationNumber() : "MCI-" + System.currentTimeMillis() % 100000);
            doctor.setConsultationFee(req.getConsultationFee() != null ? req.getConsultationFee() : 500.0);
            doctor.setWorkingHours(req.getWorkingHours() != null ? req.getWorkingHours() : "09:00 AM - 05:00 PM");
            doctor.setClinicAddress(req.getClinicAddress() != null ? req.getClinicAddress() : "QuickCare Medical Center");
            doctor.setBio(req.getBio() != null ? req.getBio() : "Experienced healthcare specialist committed to compassionate patient care.");
            doctor.setVerificationStatus("PENDING");

            List<String> days = req.getAvailableDays() != null && !req.getAvailableDays().isEmpty()
                    ? req.getAvailableDays()
                    : Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
            doctor.setAvailableDays(days);

            db.saveDoctor(doctor);
            profileId = doctor.getDoctorId();

            // Initialize availability for next 7 days
            List<String> standardSlots = Arrays.asList(
                    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
                    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
            );
            LocalDate today = LocalDate.now();
            for (int i = 0; i < 7; i++) {
                DoctorAvailability da = new DoctorAvailability(
                        doctor.getDoctorId() + "_" + today.plusDays(i),
                        doctor.getDoctorId(),
                        today.plusDays(i).toString(),
                        standardSlots
                );
                da.setWorkingHours(doctor.getWorkingHours());
                db.saveAvailability(da);
            }

            // Notification to admin
            notificationService.sendNotification("admin", "New Doctor Registration",
                    "Dr. " + doctor.getFullName() + " has submitted their profile for verification.", "DOCTOR_VERIFIED", doctor.getDoctorId());

        } else {
            // Patient registration
            user.setAccountStatus("ACTIVE");

            Patient patient = new Patient();
            patient.setPatientId("pat_" + UUID.randomUUID().toString().substring(0, 8));
            patient.setUid(uid);
            patient.setFullName(req.getFullName());
            patient.setEmail(req.getEmail());
            patient.setPhone(req.getPhone());
            patient.setDateOfBirth(req.getDateOfBirth() != null ? req.getDateOfBirth() : "1995-01-01");
            patient.setGender(req.getGender() != null ? req.getGender() : "Not specified");
            patient.setAddress(req.getAddress() != null ? req.getAddress() : "City Center");

            db.savePatient(patient);
            profileId = patient.getPatientId();

            notificationService.sendNotification(uid, "Welcome to QUICK CARE",
                    "Hello " + req.getFullName() + ", your account is ready. You can now search top specialists and book appointments.", "SYSTEM", null);
        }

        db.saveUser(user);

        String token = jwtUtil.generateToken(user.getUid(), user.getEmail(), user.getRole(), user.getFullName());
        String msg = "DOCTOR".equals(requestedRole)
                ? "Doctor registration submitted successfully. Your account is pending admin verification."
                : "Registration successful. Welcome to QuickCare!";

        return new AuthResponse(token, user, profileId, msg);
    }

    public AuthResponse login(AuthRequest req) {
        Optional<User> userOpt = db.findUserByEmail(req.getEmail());
        if (userOpt.isEmpty()) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        User user = userOpt.get();
        if (user.getPassword() != null && !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if ("INACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            throw new UnauthorizedException("Your account has been deactivated. Please contact administrator.");
        }

        String profileId = null;
        if ("DOCTOR".equalsIgnoreCase(user.getRole())) {
            Optional<Doctor> doc = db.findDoctorByUid(user.getUid());
            if (doc.isPresent()) {
                profileId = doc.get().getDoctorId();
            }
        } else if ("PATIENT".equalsIgnoreCase(user.getRole())) {
            Optional<Patient> pat = db.findPatientByUid(user.getUid());
            if (pat.isPresent()) {
                profileId = pat.get().getPatientId();
            }
        }

        String token = jwtUtil.generateToken(user.getUid(), user.getEmail(), user.getRole(), user.getFullName());
        return new AuthResponse(token, user, profileId, "Login successful.");
    }

    public User getProfile(String uid) {
        return db.findUserByUid(uid)
                .orElseThrow(() -> new UnauthorizedException("User profile not found."));
    }

    public void updatePassword(String email, String newPassword) {
        User user = db.findUserByEmail(email)
                .orElseThrow(() -> new BadRequestException("No user found with email " + email));
        user.setPassword(passwordEncoder.encode(newPassword));
        db.saveUser(user);
    }
}
