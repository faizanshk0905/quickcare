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
import java.util.List;

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
                "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
        );

        createDoctor(
                "usr_doc_02", "Dr. Rajesh Kulkarni", "rajesh.kulkarni@quickcare.com", "+91 98200 55443",
                "doc_002", "Dermatology", "MBBS, DVD, MD (Dermatology)", 10,
                "MCI-DERM-44512", 600.0, "VERIFIED", 4.8, 94,
                "Consultant Dermatologist & Trichologist focusing on clinical dermatology, eczema, psoriasis, and cosmetic dermatology.",
                "Skin & Glow Clinic, Pune",
                "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400"
        );

        createDoctor(
                "usr_doc_03", "Dr. Ananya Roy", "ananya.roy@quickcare.com", "+91 98200 66554",
                "doc_003", "Pediatrics", "MBBS, DCH, DNB (Pediatrics)", 8,
                "MCI-PED-77891", 500.0, "VERIFIED", 4.95, 162,
                "Compassionate Pediatrician dedicated to neonatal care, child growth monitoring, vaccination, and adolescent care.",
                "Little Sprouts Children Hospital, Delhi",
                "https://images.unsplash.com/photo-1594824813583-43efb8e23528?auto=format&fit=crop&q=80&w=400"
        );

        createDoctor(
                "usr_doc_04", "Dr. Vikram Joshi", "vikram.joshi@quickcare.com", "+91 98200 77665",
                "doc_004", "Orthopedics", "MBBS, MS (Orthopedics), MCh (Ortho)", 16,
                "MCI-ORTHO-11923", 900.0, "VERIFIED", 4.75, 87,
                "Chief Orthopedic & Joint Replacement Surgeon with extensive experience in sports injuries, spine care, and arthroscopy.",
                "Metro Joint & Spine Hospital, Bengaluru",
                "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400"
        );

        createDoctor(
                "usr_doc_05", "Dr. Meera Nambiar", "meera.nambiar@quickcare.com", "+91 98200 88776",
                "doc_005", "Neurology", "MBBS, MD (Medicine), DM (Neurology)", 12,
                "MCI-NEUR-66524", 850.0, "VERIFIED", 4.85, 110,
                "Senior Neurologist treating headaches, stroke, epilepsy, and neuromuscular conditions with modern neuro-diagnostics.",
                "NeuroCare Super Speciality Center, Chennai",
                "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400"
        );

        // 4. PENDING DOCTOR (for admin approval demonstration)
        createDoctor(
                "usr_doc_06", "Dr. Siddharth Verma", "siddharth.verma@quickcare.com", "+91 98200 99887",
                "doc_006", "General Physician", "MBBS, MD (Internal Medicine)", 5,
                "MCI-GEN-33419", 400.0, "PENDING", 4.5, 0,
                "Primary care physician focusing on family medicine, diabetic management, hypertension, and preventive health screenings.",
                "Verma Clinic, Hyderabad",
                "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400"
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
        apt1.setConsultationFee(800.0);
        apt1.setMeetingRoomId("quickcare-room-apt101");
        db.saveAppointment(apt1);

        Appointment apt2 = new Appointment();
        apt2.setAppointmentId("apt_102");
        apt2.setPatientId("pat_001");
        apt2.setPatientUid(patUser1.getUid());
        apt2.setPatientName(patUser1.getFullName());
        apt2.setPatientEmail(patUser1.getEmail());
        apt2.setPatientPhone(patUser1.getPhone());
        apt2.setDoctorId("doc_002");
        apt2.setDoctorUid("usr_doc_02");
        apt2.setDoctorName("Dr. Rajesh Kulkarni");
        apt2.setDoctorSpecialization("Dermatology");
        apt2.setAppointmentDate(today.plusDays(2).toString());
        apt2.setAppointmentTime("02:30 PM");
        apt2.setConsultationType("VIDEO");
        apt2.setReason("Red itchy patches on arms for 2 weeks, worsening in heat.");
        apt2.setStatus("PENDING");
        apt2.setConsultationFee(600.0);
        apt2.setMeetingRoomId("quickcare-room-apt102");
        db.saveAppointment(apt2);

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

        logger.info("QuickCare sample healthcare data seeded successfully!");
    }

    private void createDoctor(String uid, String name, String email, String phone,
                              String docId, String spec, String qual, int exp,
                              String regNo, double fee, String status, double rating, int reviews,
                              String bio, String clinic, String img) {
        User u = new User(uid, name, email, phone, "DOCTOR");
        u.setPassword(passwordEncoder.encode("doctor123"));
        u.setAccountStatus("VERIFIED".equals(status) ? "ACTIVE" : "PENDING");
        u.setProfileImage(img);
        db.saveUser(u);

        Doctor d = new Doctor();
        d.setDoctorId(docId);
        d.setUid(uid);
        d.setFullName(name);
        d.setEmail(email);
        d.setPhone(phone);
        d.setSpecialization(spec);
        d.setQualification(qual);
        d.setExperience(exp);
        d.setMedicalRegistrationNumber(regNo);
        d.setConsultationFee(fee);
        d.setVerificationStatus(status);
        d.setRating(rating);
        d.setReviewCount(reviews);
        d.setBio(bio);
        d.setClinicAddress(clinic);
        d.setProfileImage(img);
        d.setWorkingHours("09:00 AM - 05:00 PM");
        d.setAvailableDays(Arrays.asList("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"));
        db.saveDoctor(d);

        // Populate availability for next 7 days
        List<String> slots = Arrays.asList(
                "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
                "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"
        );
        LocalDate start = LocalDate.now();
        for (int i = 0; i < 7; i++) {
            DoctorAvailability da = new DoctorAvailability(
                    d.getDoctorId() + "_" + start.plusDays(i),
                    d.getDoctorId(),
                    start.plusDays(i).toString(),
                    slots
            );
            da.setWorkingHours(d.getWorkingHours());
            db.saveAvailability(da);
        }
    }
}
