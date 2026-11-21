package com.quickcare.config;

import com.quickcare.model.*;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Optional;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataLoader.class);

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Seeding QuickCare initial demo healthcare data...");

        // 1. ADMIN USER
        User admin = new User("admin_001", "Chief Medical Administrator", "admin@quickcare.com", "+91 98765 43210", "ADMIN");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setAccountStatus("ACTIVE");
        db.saveUser(admin);

        // 2. DEMO PATIENT
        User patUser1 = new User("usr_pat_01", "Aarav Sharma", "patient@quickcare.com", "+91 98220 12345", "PATIENT");
        patUser1.setPassword(passwordEncoder.encode("patient123"));
        patUser1.setAccountStatus("ACTIVE");
        db.saveUser(patUser1);

        Patient patient1 = new Patient();
        patient1.setPatientId("pat_001");
        patient1.setUid(patUser1.getUid());
        patient1.setFullName(patUser1.getFullName());
        patient1.setEmail(patUser1.getEmail());
        patient1.setPhone(patUser1.getPhone());
        patient1.setDateOfBirth("1996-05-14");
        patient1.setGender("Male");
        patient1.setAddress("42 Blossom Heights, Pune, Maharashtra");
        db.savePatient(patient1);

        // 3. TOP VERIFIED DOCTORS
        createDoctor(
                "usr_doc_01", "Dr. Priya Deshmukh", "priya.deshmukh@quickcare.com", "+91 98200 44332",
                "doc_001", "Cardiology", "MBBS, MD (Medicine), DM (Cardiology)", 14,
                "MCI-CARD-88741", 800.0, "VERIFIED", 4.9, 128,
                "Senior Cardiologist specializing in preventive heart health, coronary artery disease, and cardiac rehabilitation.",
                "Apex Heart Institute, Mumbai",
                "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400",
                "Female"
        );

        createDoctor(
                "usr_doc_02", "Dr. Rajesh Kulkarni", "rajesh.kulkarni@quickcare.com", "+91 98200 55443",
                "doc_002", "Dermatology", "MBBS, DVD, MD (Dermatology)", 10,
                "MCI-DERM-44512", 600.0, "VERIFIED", 4.8, 94,
                "Consultant Dermatologist & Trichologist focusing on clinical dermatology, eczema, psoriasis, and cosmetic dermatology.",
                "Skin & Glow Clinic, Pune",
                "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
                "Male"
        );

        createDoctor(
                "usr_doc_03", "Dr. Ananya Roy", "ananya.roy@quickcare.com", "+91 98200 66554",
                "doc_003", "Pediatrics", "MBBS, DCH, DNB (Pediatrics)", 8,
                "MCI-PED-77891", 500.0, "VERIFIED", 4.95, 162,
                "Compassionate Pediatrician dedicated to neonatal care, child growth monitoring, vaccination, and adolescent care.",
                "Little Sprouts Children Hospital, Delhi",
                "https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400",
                "Female"
        );

        createDoctor(
                "usr_doc_04", "Dr. Vikram Joshi", "vikram.joshi@quickcare.com", "+91 98200 77665",
                "doc_004", "Orthopedics", "MBBS, MS (Orthopedics), MCh (Ortho)", 16,
                "MCI-ORTHO-11923", 900.0, "VERIFIED", 4.75, 87,
                "Chief Orthopedic & Joint Replacement Surgeon with extensive experience in sports injuries, spine care, and arthroscopy.",
                "Metro Joint & Spine Hospital, Bengaluru",
                "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400",
                "Male"
        );

        // Note: Quick Care does NOT currently have a Neurologist, Oncologist, or Gastroenterologist on staff.
        // If a patient asks for a specialist in these fields, the system correctly and strictly informs them.

        // 4. PENDING DOCTORS (for admin approval demonstration)
        createDoctor(
                "usr_doc_06", "Dr. Siddharth Verma", "siddharth.verma@quickcare.com", "+91 98200 99887",
                "doc_006", "General Physician", "MBBS, MD (Internal Medicine)", 5,
                "MCI-GEN-33419", 400.0, "PENDING", 4.5, 0,
                "Primary care physician focusing on family medicine, diabetic management, hypertension, and preventive health screenings.",
                "Verma Clinic, Hyderabad",
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400",
                "Male"
        );

        // 4b. REGISTERED DOCTORS IN SATARA
        createDoctor(
                "usr_doc_vivek", "Dr. Vivek Shelar", "vivek.shelar@quickcare.com", "+91 98200 88776",
                "doc_vivek_shelar", "Orthopedics", "MBBS, MS (Orthopedics)", 12,
                "MCI-ORTHO-78421", 500.0, "VERIFIED", 4.9, 96,
                "Chief Consultant Orthopedic Surgeon at Shelar Hospital, Satara specializing in joint replacement, sports injury rehabilitation, and spine care.",
                "Shelar Hospital, Radhika Road, Satara",
                "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
                "Male"
        );

        createDoctor(
                "usr_b320c9f9", "Dr.Prasad Kadam", "prasadkadam123@gmail.com", "8766949419",
                "doc_f3852f3d", "Cardiology", "MBBS, MD", 12,
                "MCI-123", 500.0, "VERIFIED", 4.8, 42,
                "Experienced Senior Cardiologist at Kadam Hospital specializing in comprehensive cardiovascular care and clinical cardiology.",
                "Kadam Multi-Speciality Hospital, Powai Naka, Satara",
                "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
                "Male"
        );

        // 5. SAMPLE APPOINTMENTS
        LocalDate today = LocalDate.now();
        Appointment apt1 = new Appointment();
        apt1.setAppointmentId("apt_101");
        apt1.setPatientId("pat_001");
        apt1.setPatientUid(patUser1.getUid());
        apt1.setPatientName(patUser1.getFullName());
        apt1.setPatientEmail(patUser1.getEmail());
        apt1.setPatientPhone(patUser1.getPhone());
        apt1.setDoctorId("doc_001");
        apt1.setDoctorUid("usr_doc_01");
        apt1.setDoctorName("Dr. Priya Deshmukh");
        apt1.setDoctorSpecialization("Cardiology");
        apt1.setAppointmentDate(today.toString());
        apt1.setAppointmentTime("10:00 AM");
        apt1.setConsultationType("VIDEO");
        apt1.setReason("Follow-up on recent lipid profile report and occasional chest heaviness after exertion.");
        apt1.setStatus("CONFIRMED");
        apt1.setConfirmationStatus("CONFIRMED");
        apt1.setConfirmationPromptSent(true);
        apt1.setConfirmationPromptSentAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(15)));
        apt1.setConfirmedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(12)));
        apt1.addAuditLog("CONFIRMATION_PROMPT_SENT", "SYSTEM", "15-minute confirmation prompt dispatched to patient.");
        apt1.addAuditLog("PATIENT_CONFIRMED_AVAILABLE", patUser1.getEmail(), "Patient confirmed availability: YES, I AM AVAILABLE.");
        apt1.setConsultationFee(800.0);
        apt1.setMeetingRoomId("quickcare-room-apt101");
        apt1.setGoogleMeetLink("https://meet.google.com/qck-card-hms");
        apt1.setDoctorNotes("Please keep your latest ECG, Echo reports, and blood pressure log handy for the consultation.");
        apt1.setApprovedAt(java.time.Instant.now().minus(java.time.Duration.ofHours(2)));
        db.saveAppointment(apt1);

        // Sample Appointment 2: Patient B - NOT_RESPONDED
        Appointment apt2 = new Appointment();
        apt2.setAppointmentId("apt_102");
        apt2.setPatientId("pat_002");
        apt2.setPatientUid("usr_pat_02");
        apt2.setPatientName("Rohan Patel");
        apt2.setPatientEmail("rohan.patel@example.com");
        apt2.setPatientPhone("+91 98330 22334");
        apt2.setDoctorId("doc_001");
        apt2.setDoctorUid("usr_doc_01");
        apt2.setDoctorName("Dr. Priya Deshmukh");
        apt2.setDoctorSpecialization("Cardiology");
        apt2.setAppointmentDate(today.toString());
        apt2.setAppointmentTime("10:15 AM");
        apt2.setConsultationType("VIDEO");
        apt2.setReason("Chest tightness and shortness of breath upon climbing stairs.");
        apt2.setStatus("PENDING");
        apt2.setConfirmationStatus("NOT_RESPONDED");
        apt2.setConfirmationPromptSent(true);
        apt2.setConfirmationPromptSentAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(20)));
        apt2.setNotRespondedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(15)));
        apt2.addAuditLog("CONFIRMATION_PROMPT_SENT", "SYSTEM", "15-minute confirmation prompt dispatched.");
        apt2.addAuditLog("PATIENT_NOT_RESPONDED", "SYSTEM", "Patient did not respond within configured grace period.");
        apt2.setConsultationFee(800.0);
        apt2.setMeetingRoomId("quickcare-room-apt102");
        db.saveAppointment(apt2);

        // Sample Appointment 3: Patient C - DECLINED
        Appointment apt3 = new Appointment();
        apt3.setAppointmentId("apt_103");
        apt3.setPatientId("pat_003");
        apt3.setPatientUid("usr_pat_03");
        apt3.setPatientName("Sneha Rao");
        apt3.setPatientEmail("sneha.rao@example.com");
        apt3.setPatientPhone("+91 98440 33445");
        apt3.setDoctorId("doc_001");
        apt3.setDoctorUid("usr_doc_01");
        apt3.setDoctorName("Dr. Priya Deshmukh");
        apt3.setDoctorSpecialization("Cardiology");
        apt3.setAppointmentDate(today.toString());
        apt3.setAppointmentTime("10:30 AM");
        apt3.setConsultationType("VIDEO");
        apt3.setReason("Routine hypertension check-up.");
        apt3.setStatus("DECLINED");
        apt3.setConfirmationStatus("DECLINED");
        apt3.setConfirmationPromptSent(true);
        apt3.setConfirmationPromptSentAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(25)));
        apt3.setDeclinedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(22)));
        apt3.setSlotReleased(true);
        apt3.setSlotReleasedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(22)));
        apt3.setSlotReleasedBy("PATIENT");
        apt3.setCancellationReason("Patient unavailable (Selected NO).");
        apt3.addAuditLog("CONFIRMATION_PROMPT_SENT", "SYSTEM", "15-minute confirmation prompt dispatched.");
        apt3.addAuditLog("PATIENT_DECLINED", "sneha.rao@example.com", "Patient selected NO. Slot released immediately.");
        apt3.setConsultationFee(800.0);
        apt3.setMeetingRoomId("quickcare-room-apt103");
        db.saveAppointment(apt3);

        // 6. SAMPLE DIGITAL PRESCRIPTION
        Prescription rx1 = new Prescription();
        rx1.setPrescriptionId("rx_101");
        rx1.setAppointmentId("apt_101");
        rx1.setPatientId("pat_001");
        rx1.setPatientName(patUser1.getFullName());
        rx1.setDoctorId("doc_001");
        rx1.setDoctorName("Dr. Priya Deshmukh");
        rx1.setDoctorSpecialization("Cardiology");
        rx1.setDoctorQualification("MBBS, MD (Medicine), DM (Cardiology)");
        rx1.setClinicDetails("Apex Heart Institute, Mumbai");
        rx1.setConsultationDate(today.minusDays(7).toString());
        rx1.setDiagnosis("Mild Hyperlipidemia & Exertional Tachycardia");
        rx1.setMedicines(Arrays.asList(
                new MedicineItem("Atorvastatin", "10mg", "0-0-1 (Night)", "30 days", "Take after dinner with water"),
                new MedicineItem("Metoprolol Succinate", "25mg", "1-0-0 (Morning)", "15 days", "Take post breakfast"),
                new MedicineItem("CoQ10 Supplement", "100mg", "1-0-0 (Morning)", "30 days", "Nutritional cardiovascular support")
        ));
        rx1.setInstructions("Engage in 30 minutes of brisk walking 5 days a week. Reduce fried food and sodium intake. Recheck lipid profile in 4 weeks.");
        rx1.setAdditionalNotes("Emergency helpline: Apex Heart Institute Casualty 022-26543210");
        rx1.setPrescriptionPdfUrl("/api/prescriptions/rx_101/pdf");
        db.savePrescription(rx1);

        // 7. SAMPLE NOTIFICATIONS
        Notification n1 = new Notification("notif_01", patUser1.getUid(), "Appointment Confirmed",
                "Your consultation with Dr. Priya Deshmukh today at 10:00 AM is confirmed. Video link is ready.", "APPOINTMENT_CONFIRMED", "apt_101");
        db.saveNotification(n1);

        Notification n2 = new Notification("notif_02", patUser1.getUid(), "Prescription Issued",
                "Dr. Priya Deshmukh has issued your digital prescription for Mild Hyperlipidemia.", "PRESCRIPTION_ISSUED", "rx_101");
        db.saveNotification(n2);

        // Demo Doctor standard login alias
        User docDemoLogin = new User("usr_doc_01", "Dr. Priya Deshmukh", "doctor@quickcare.com", "+91 98200 44332", "DOCTOR");
        docDemoLogin.setPassword(passwordEncoder.encode("doctor123"));
        docDemoLogin.setAccountStatus("ACTIVE");
        db.saveUser(docDemoLogin);

        logger.info("QuickCare sample healthcare data seeded successfully!");
    }

    private void createDoctor(String uid, String name, String email, String phone,
                              String docId, String spec, String qual, int exp,
                              String regNo, double fee, String status, double rating, int reviews,
                              String bio, String clinic, String img, String gender) {
        User u = db.findUserByUid(uid).orElse(new User(uid, name, email, phone, "DOCTOR"));
        u.setPassword(passwordEncoder.encode("doctor123"));
        if (u.getAccountStatus() == null) {
            u.setAccountStatus("VERIFIED".equals(status) ? "ACTIVE" : "PENDING");
        }
        if (u.getProfileImage() == null) {
            u.setProfileImage(img);
        }
        db.saveUser(u);

        // Check if doctor profile already exists in DB (or synced from Cloud Firestore)
        Optional<Doctor> existingDocOpt = db.findDoctorById(docId).or(() -> db.findDoctorByUid(uid));
        Doctor d = existingDocOpt.orElse(new Doctor());
        d.setDoctorId(docId);
        d.setUid(uid);
        if (d.getFullName() == null || d.getFullName().trim().isEmpty()) d.setFullName(name);
        if (d.getEmail() == null || d.getEmail().trim().isEmpty()) d.setEmail(email);
        if (d.getPhone() == null || d.getPhone().trim().isEmpty()) d.setPhone(phone);
        if (d.getGender() == null || d.getGender().trim().isEmpty()) d.setGender(gender);
        if (d.getSpecialization() == null || d.getSpecialization().trim().isEmpty()) d.setSpecialization(spec);
        if (d.getQualification() == null || d.getQualification().trim().isEmpty()) d.setQualification(qual);
        if (d.getExperience() <= 0) d.setExperience(exp);
        if (d.getMedicalRegistrationNumber() == null || d.getMedicalRegistrationNumber().trim().isEmpty()) d.setMedicalRegistrationNumber(regNo);
        if (d.getConsultationFee() <= 0) d.setConsultationFee(fee);
        if (d.getVerificationStatus() == null || d.getVerificationStatus().trim().isEmpty()) d.setVerificationStatus(status);
        if (d.getRating() <= 0) d.setRating(rating);
        if (d.getReviewCount() <= 0) d.setReviewCount(reviews);
        if (d.getBio() == null || d.getBio().trim().isEmpty()) d.setBio(bio);
        if (d.getClinicAddress() == null || d.getClinicAddress().trim().isEmpty()) d.setClinicAddress(clinic);
        if (d.getProfileImage() == null || d.getProfileImage().trim().isEmpty()) d.setProfileImage(img);

        // DO NOT overwrite doctor's custom schedule if already configured!
        if (d.getWorkingHours() == null || d.getWorkingHours().trim().isEmpty()) {
            d.setWorkingHours("09:00 AM - 05:00 PM");
        }
        if (d.getWorkingStartTime() == null || d.getWorkingStartTime().trim().isEmpty()) {
            d.setWorkingStartTime("09:00 AM");
        }
        if (d.getWorkingEndTime() == null || d.getWorkingEndTime().trim().isEmpty()) {
            d.setWorkingEndTime("05:00 PM");
        }
        if (d.getBreakStartTime() == null || d.getBreakStartTime().trim().isEmpty()) {
            d.setBreakStartTime("01:00 PM");
        }
        if (d.getBreakEndTime() == null || d.getBreakEndTime().trim().isEmpty()) {
            d.setBreakEndTime("02:00 PM");
        }
        if (d.getSlotDurationMinutes() <= 0) {
            d.setSlotDurationMinutes(15);
        }
        if (d.getTimezone() == null || d.getTimezone().trim().isEmpty()) {
            d.setTimezone("Asia/Kolkata");
        }
        if (d.getOnlineStatus() == null || d.getOnlineStatus().trim().isEmpty()) {
            d.setOnlineStatus("AVAILABLE_FOR_VIDEO");
        }
        d.setVideoConsultationAvailable(true);
        if (d.getAvailableDays() == null || d.getAvailableDays().isEmpty()) {
            d.setAvailableDays(Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"));
        }
        db.saveDoctor(d);

        // Populate 15-minute availability slots only if not already configured for future dates
        LocalDate start = LocalDate.now();
        for (int i = 0; i < 7; i++) {
            String dateStr = start.plusDays(i).toString();
            if (db.findAvailability(d.getDoctorId(), dateStr).isEmpty()) {
                DoctorAvailability da = new DoctorAvailability(
                        d.getDoctorId() + "_" + dateStr,
                        d.getDoctorId(),
                        dateStr,
                        new java.util.ArrayList<>()
                );
                da.setWorkingHours(d.getWorkingHours());
                da.setSlotDurationMinutes(d.getSlotDurationMinutes() > 0 ? d.getSlotDurationMinutes() : 15);
                db.saveAvailability(da);
            }
        }
    }
}
