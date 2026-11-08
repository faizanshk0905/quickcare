package com.quickcare.repository;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import com.quickcare.model.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@SuppressWarnings("null")
@Service
public class FirestoreDatabaseService {

    private static final Logger logger = LoggerFactory.getLogger(FirestoreDatabaseService.class);

    private final Firestore firestore;

    // Fast in-memory state mirrors Firestore collections
    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, Patient> patients = new ConcurrentHashMap<>();
    private final Map<String, Doctor> doctors = new ConcurrentHashMap<>();
    private final Map<String, Appointment> appointments = new ConcurrentHashMap<>();
    private final Map<String, DoctorAvailability> availabilities = new ConcurrentHashMap<>();
    private final Map<String, Prescription> prescriptions = new ConcurrentHashMap<>();
    private final Map<String, Notification> notifications = new ConcurrentHashMap<>();
    private final Map<String, Review> reviews = new ConcurrentHashMap<>();
    private final Map<String, VideoConsultation> videoConsultations = new ConcurrentHashMap<>();
    private final Map<String, AiConversation> aiConversations = new ConcurrentHashMap<>();
    // Server-side One Doctor - One Active Video Consultation Concurrency Lock (doctorId -> consultationId)
    private final Map<String, String> activeDoctorConsultationLocks = new ConcurrentHashMap<>();

    @Autowired
    public FirestoreDatabaseService(@Autowired(required = false) Firestore firestore) {
        this.firestore = firestore;
        if (firestore != null) {
            logger.info("FirestoreDatabaseService linked with active Cloud Firestore instance.");
        } else {
            logger.info("FirestoreDatabaseService running in fast standalone Firestore emulation mode.");
        }
    }

    @PostConstruct
    public void syncFromCloudFirestore() {
        if (firestore == null) {
            return;
        }
        try {
            logger.info("Initializing Cloud Firestore synchronization with cluster quickcare-hospital...");
            List<QueryDocumentSnapshot> docList = firestore.collection("doctors").get().get().getDocuments();
            int docCount = 0;
            for (QueryDocumentSnapshot snap : docList) {
                Doctor doc = parseDoctorSnapshot(snap);
                if (doc != null && doc.getDoctorId() != null) {
                    doctors.put(doc.getDoctorId(), doc);
                    docCount++;
                }
            }
            logger.info("Loaded {} doctor records directly from Cloud Firestore.", docCount);

            List<QueryDocumentSnapshot> userList = firestore.collection("users").get().get().getDocuments();
            int userCount = 0;
            for (QueryDocumentSnapshot snap : userList) {
                User u = parseUserSnapshot(snap);
                if (u != null && u.getUid() != null) {
                    users.put(u.getUid(), u);
                    userCount++;
                }
            }
            logger.info("Loaded {} user accounts directly from Cloud Firestore.", userCount);
        } catch (Exception e) {
            logger.warn("Cloud Firestore initial sync notice: {}", e.getMessage());
        }
    }

    public Doctor parseDoctorSnapshot(DocumentSnapshot snap) {
        if (snap == null || !snap.exists()) return null;
        try {
            Map<String, Object> data = snap.getData();
            if (data == null) return null;

            Doctor doctor = new Doctor();
            doctor.setDoctorId(snap.getId());
            if (data.get("doctorId") != null) doctor.setDoctorId(String.valueOf(data.get("doctorId")));
            if (data.get("uid") != null) doctor.setUid(String.valueOf(data.get("uid")));
            if (data.get("fullName") != null) doctor.setFullName(String.valueOf(data.get("fullName")));
            if (data.get("email") != null) doctor.setEmail(String.valueOf(data.get("email")));
            if (data.get("phone") != null) doctor.setPhone(String.valueOf(data.get("phone")));
            if (data.get("specialization") != null) doctor.setSpecialization(String.valueOf(data.get("specialization")));
            if (data.get("qualification") != null) doctor.setQualification(String.valueOf(data.get("qualification")));
            if (data.get("experience") instanceof Number) {
                doctor.setExperience(((Number) data.get("experience")).intValue());
            }
            if (data.get("medicalRegistrationNumber") != null) {
                doctor.setMedicalRegistrationNumber(String.valueOf(data.get("medicalRegistrationNumber")));
            }
            if (data.get("consultationFee") instanceof Number) {
                doctor.setConsultationFee(((Number) data.get("consultationFee")).doubleValue());
            }
            if (data.get("workingHours") != null) doctor.setWorkingHours(String.valueOf(data.get("workingHours")));
            if (data.get("workingStartTime") != null) doctor.setWorkingStartTime(String.valueOf(data.get("workingStartTime")));
            if (data.get("workingEndTime") != null) doctor.setWorkingEndTime(String.valueOf(data.get("workingEndTime")));
            if (data.get("breakStartTime") != null) doctor.setBreakStartTime(String.valueOf(data.get("breakStartTime")));
            if (data.get("breakEndTime") != null) doctor.setBreakEndTime(String.valueOf(data.get("breakEndTime")));
            if (data.get("slotDurationMinutes") instanceof Number) {
                doctor.setSlotDurationMinutes(((Number) data.get("slotDurationMinutes")).intValue());
            }
            if (data.get("timezone") != null) doctor.setTimezone(String.valueOf(data.get("timezone")));
            if (data.get("verificationStatus") != null) doctor.setVerificationStatus(String.valueOf(data.get("verificationStatus")));
            if (data.get("profileImage") != null) doctor.setProfileImage(String.valueOf(data.get("profileImage")));
            if (data.get("gender") != null) doctor.setGender(String.valueOf(data.get("gender")));
            if (data.get("rating") instanceof Number) {
                doctor.setRating(((Number) data.get("rating")).doubleValue());
            }
            if (data.get("reviewCount") instanceof Number) {
                doctor.setReviewCount(((Number) data.get("reviewCount")).intValue());
            }
            if (data.get("bio") != null) doctor.setBio(String.valueOf(data.get("bio")));
            if (data.get("clinicAddress") != null) doctor.setClinicAddress(String.valueOf(data.get("clinicAddress")));

            if (data.get("availableDays") instanceof List) {
                List<?> days = (List<?>) data.get("availableDays");
                List<String> list = new ArrayList<>();
                for (Object o : days) if (o != null) list.add(o.toString());
                doctor.setAvailableDays(list);
            }
            if (data.get("holidays") instanceof List) {
                List<?> hols = (List<?>) data.get("holidays");
                List<String> list = new ArrayList<>();
                for (Object o : hols) if (o != null) list.add(o.toString());
                doctor.setHolidays(list);
            }

            Object ca = data.get("createdAt");
            if (ca instanceof Timestamp) {
                doctor.setCreatedAt(((Timestamp) ca).toSqlTimestamp().toInstant());
            } else if (ca instanceof Map) {
                Map<?, ?> map = (Map<?, ?>) ca;
                Object es = map.get("epochSecond");
                Object nano = map.get("nano");
                if (es instanceof Number) {
                    long sec = ((Number) es).longValue();
                    long n = nano instanceof Number ? ((Number) nano).longValue() : 0L;
                    doctor.setCreatedAt(Instant.ofEpochSecond(sec, n));
                }
            } else if (ca instanceof String) {
                try {
                    doctor.setCreatedAt(Instant.parse((String) ca));
                } catch (Exception ignored) {}
            }

            return doctor;
        } catch (Exception e) {
            logger.warn("Error parsing doctor snapshot {}: {}", snap.getId(), e.getMessage());
            return null;
        }
    }

    public User parseUserSnapshot(DocumentSnapshot snap) {
        if (snap == null || !snap.exists()) return null;
        try {
            Map<String, Object> data = snap.getData();
            if (data == null) return null;

            User user = new User();
            user.setUid(snap.getId());
            if (data.get("uid") != null) user.setUid(String.valueOf(data.get("uid")));
            if (data.get("fullName") != null) user.setFullName(String.valueOf(data.get("fullName")));
            if (data.get("email") != null) user.setEmail(String.valueOf(data.get("email")));
            if (data.get("phone") != null) user.setPhone(String.valueOf(data.get("phone")));
            if (data.get("role") != null) user.setRole(String.valueOf(data.get("role")));
            if (data.get("accountStatus") != null) user.setAccountStatus(String.valueOf(data.get("accountStatus")));
            if (data.get("profileImage") != null) user.setProfileImage(String.valueOf(data.get("profileImage")));
            if (data.get("password") != null) user.setPassword(String.valueOf(data.get("password")));
            return user;
        } catch (Exception e) {
            logger.warn("Error parsing user snapshot {}: {}", snap.getId(), e.getMessage());
            return null;
        }
    }

    // USERS
    public User saveUser(User user) {
        if (user.getUid() == null) {
            user.setUid(UUID.randomUUID().toString());
        }
        users.put(user.getUid(), user);
        if (firestore != null) {
            try {
                firestore.collection("users").document(user.getUid()).set(user, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on user: {}", e.getMessage());
            }
        }
        return user;
    }

    public Optional<User> findUserByUid(String uid) {
        if (uid == null) return Optional.empty();
        User u = users.get(uid);
        if (u != null) {
            return Optional.of(u);
        }
        if (firestore != null) {
            try {
                DocumentSnapshot snap = firestore.collection("users").document(uid).get().get();
                User parsed = parseUserSnapshot(snap);
                if (parsed != null) {
                    users.put(parsed.getUid(), parsed);
                    return Optional.of(parsed);
                }
            } catch (Exception e) {
                logger.warn("Firestore findUserByUid({}) lookup: {}", uid, e.getMessage());
            }
        }
        return Optional.empty();
    }

    public Optional<User> findUserByEmail(String email) {
        if (email == null) return Optional.empty();
        Optional<User> inMemory = users.values().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email.trim()))
                .findFirst();
        if (inMemory.isPresent()) {
            return inMemory;
        }
        if (firestore != null) {
            try {
                List<QueryDocumentSnapshot> list = firestore.collection("users")
                        .whereEqualTo("email", email.trim().toLowerCase())
                        .get().get().getDocuments();
                if (!list.isEmpty()) {
                    User parsed = parseUserSnapshot(list.get(0));
                    if (parsed != null) {
                        users.put(parsed.getUid(), parsed);
                        return Optional.of(parsed);
                    }
                }
            } catch (Exception e) {
                logger.warn("Firestore findUserByEmail({}) lookup: {}", email, e.getMessage());
            }
        }
        return Optional.empty();
    }

    public List<User> findAllUsers() {
        return new ArrayList<>(users.values());
    }

    // PATIENTS
    public Patient savePatient(Patient patient) {
        if (patient.getPatientId() == null) {
            patient.setPatientId("pat_" + UUID.randomUUID().toString().substring(0, 8));
        }
        patients.put(patient.getPatientId(), patient);
        if (firestore != null) {
            try {
                firestore.collection("patients").document(patient.getPatientId()).set(patient, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on patient: {}", e.getMessage());
            }
        }
        return patient;
    }

    public Optional<Patient> findPatientById(String patientId) {
        return Optional.ofNullable(patients.get(patientId));
    }

    public Optional<Patient> findPatientByUid(String uid) {
        return patients.values().stream().filter(p -> uid.equals(p.getUid())).findFirst();
    }

    public List<Patient> findAllPatients() {
        return new ArrayList<>(patients.values());
    }

    // DOCTORS
    public Doctor saveDoctor(Doctor doctor) {
        if (doctor.getDoctorId() == null) {
            doctor.setDoctorId("doc_" + UUID.randomUUID().toString().substring(0, 8));
        }
        doctors.put(doctor.getDoctorId(), doctor);
        if (firestore != null) {
            try {
                firestore.collection("doctors").document(doctor.getDoctorId()).set(doctor, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on doctor: {}", e.getMessage());
            }
        }
        return doctor;
    }

    public Optional<Doctor> findDoctorById(String doctorId) {
        if (doctorId == null) return Optional.empty();
        Doctor doc = doctors.get(doctorId);
        if (doc != null) {
            return Optional.of(doc);
        }
        if (firestore != null) {
            try {
                DocumentSnapshot snap = firestore.collection("doctors").document(doctorId).get().get();
                Doctor parsed = parseDoctorSnapshot(snap);
                if (parsed != null) {
                    doctors.put(parsed.getDoctorId(), parsed);
                    return Optional.of(parsed);
                }
            } catch (Exception e) {
                logger.warn("Firestore findDoctorById({}) lookup: {}", doctorId, e.getMessage());
            }
        }
        return Optional.empty();
    }

    public Optional<Doctor> findDoctorByUid(String uid) {
        if (uid == null) return Optional.empty();
        Optional<Doctor> inMemory = doctors.values().stream().filter(d -> uid.equals(d.getUid())).findFirst();
        if (inMemory.isPresent()) {
            return inMemory;
        }
        if (firestore != null) {
            try {
                List<QueryDocumentSnapshot> list = firestore.collection("doctors").whereEqualTo("uid", uid).get().get().getDocuments();
                if (!list.isEmpty()) {
                    Doctor parsed = parseDoctorSnapshot(list.get(0));
                    if (parsed != null) {
                        doctors.put(parsed.getDoctorId(), parsed);
                        return Optional.of(parsed);
                    }
                }
            } catch (Exception e) {
                logger.warn("Firestore findDoctorByUid({}) lookup: {}", uid, e.getMessage());
            }
        }
        return Optional.empty();
    }

    public List<Doctor> findAllDoctors() {
        if (firestore != null) {
            try {
                List<QueryDocumentSnapshot> docList = firestore.collection("doctors").get().get().getDocuments();
                for (QueryDocumentSnapshot snap : docList) {
                    Doctor doc = parseDoctorSnapshot(snap);
                    if (doc != null && doc.getDoctorId() != null) {
                        doctors.put(doc.getDoctorId(), doc);
                    }
                }
            } catch (Exception e) {
                logger.warn("Firestore findAllDoctors query: {}", e.getMessage());
            }
        }
        return new ArrayList<>(doctors.values());
    }

    public List<Doctor> findVerifiedDoctors() {
        return doctors.values().stream()
                .filter(d -> "VERIFIED".equalsIgnoreCase(d.getVerificationStatus()))
                .collect(Collectors.toList());
    }

    // APPOINTMENTS
    public synchronized Appointment saveAppointment(Appointment appointment) {
        if (appointment.getAppointmentId() == null) {
            appointment.setAppointmentId("apt_" + UUID.randomUUID().toString().substring(0, 8));
        }
        appointments.put(appointment.getAppointmentId(), appointment);
        if (firestore != null) {
            try {
                firestore.collection("appointments").document(appointment.getAppointmentId()).set(appointment, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on appointment: {}", e.getMessage());
            }
        }
        return appointment;
    }

    public Optional<Appointment> findAppointmentById(String id) {
        return Optional.ofNullable(appointments.get(id));
    }

    public List<Appointment> findAllAppointments() {
        return new ArrayList<>(appointments.values());
    }

    public List<Appointment> findAppointmentsByPatientId(String patientId) {
        return appointments.values().stream()
                .filter(a -> patientId.equals(a.getPatientId()))
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<Appointment> findAppointmentsByDoctorId(String doctorId) {
        return appointments.values().stream()
                .filter(a -> doctorId.equals(a.getDoctorId()))
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ATOMIC DOUBLE-BOOKING CHECK
    public synchronized boolean isSlotBooked(String doctorId, String date, String time) {
        return appointments.values().stream().anyMatch(a ->
                doctorId.equals(a.getDoctorId()) &&
                date.equals(a.getAppointmentDate()) &&
                time.equalsIgnoreCase(a.getAppointmentTime()) &&
                !"CANCELLED".equalsIgnoreCase(a.getStatus()) &&
                !"REJECTED".equalsIgnoreCase(a.getStatus()) &&
                !"DECLINED".equalsIgnoreCase(a.getStatus()) &&
                !"NO_SHOW".equalsIgnoreCase(a.getStatus()) &&
                !a.isSlotReleased()
        );
    }

    // AVAILABILITY
    public DoctorAvailability saveAvailability(DoctorAvailability availability) {
        String key = availability.getDoctorId() + "_" + availability.getDate();
        if (availability.getAvailabilityId() == null) {
            availability.setAvailabilityId(key);
        }
        availabilities.put(key, availability);
        if (firestore != null) {
            try {
                firestore.collection("doctorAvailability").document(availability.getAvailabilityId()).set(availability, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on availability: {}", e.getMessage());
            }
        }
        return availability;
    }

    public Optional<DoctorAvailability> findAvailability(String doctorId, String date) {
        return Optional.ofNullable(availabilities.get(doctorId + "_" + date));
    }

    public List<DoctorAvailability> findAvailabilitiesByDoctor(String doctorId) {
        return availabilities.values().stream()
                .filter(a -> doctorId.equals(a.getDoctorId()))
                .collect(Collectors.toList());
    }

    // PRESCRIPTIONS
    public Prescription savePrescription(Prescription prescription) {
        if (prescription.getPrescriptionId() == null) {
            prescription.setPrescriptionId("rx_" + UUID.randomUUID().toString().substring(0, 8));
        }
        prescriptions.put(prescription.getPrescriptionId(), prescription);
        if (firestore != null) {
            try {
                firestore.collection("prescriptions").document(prescription.getPrescriptionId()).set(prescription, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on prescription: {}", e.getMessage());
            }
        }
        return prescription;
    }

    public Optional<Prescription> findPrescriptionById(String id) {
        return Optional.ofNullable(prescriptions.get(id));
    }

    public List<Prescription> findPrescriptionsByPatientId(String patientId) {
        return prescriptions.values().stream()
                .filter(p -> patientId.equals(p.getPatientId()))
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<Prescription> findPrescriptionsByDoctorId(String doctorId) {
        return prescriptions.values().stream()
                .filter(p -> doctorId.equals(p.getDoctorId()))
                .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<Prescription> findAllPrescriptions() {
        return new ArrayList<>(prescriptions.values());
    }

    // NOTIFICATIONS
    public Notification saveNotification(Notification notification) {
        if (notification.getNotificationId() == null) {
            notification.setNotificationId("notif_" + UUID.randomUUID().toString().substring(0, 8));
        }
        notifications.put(notification.getNotificationId(), notification);
        if (firestore != null) {
            try {
                firestore.collection("notifications").document(notification.getNotificationId()).set(notification, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on notification: {}", e.getMessage());
            }
        }
        return notification;
    }

    public List<Notification> findNotificationsByUserId(String userId) {
        return notifications.values().stream()
                .filter(n -> userId.equals(n.getUserId()))
                .sorted((n1, n2) -> n2.getCreatedAt().compareTo(n1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public Optional<Notification> findNotificationById(String id) {
        return Optional.ofNullable(notifications.get(id));
    }

    // REVIEWS
    public Review saveReview(Review review) {
        if (review.getReviewId() == null) {
            review.setReviewId("rev_" + UUID.randomUUID().toString().substring(0, 8));
        }
        reviews.put(review.getReviewId(), review);
        if (firestore != null) {
            try {
                firestore.collection("reviews").document(review.getReviewId()).set(review, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on review: {}", e.getMessage());
            }
        }
        return review;
    }

    public Optional<Review> findReviewById(String reviewId) {
        return Optional.ofNullable(reviews.get(reviewId));
    }

    public List<Review> findReviewsByDoctorId(String doctorId) {
        return reviews.values().stream()
                .filter(r -> doctorId.equals(r.getDoctorId()))
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public List<Review> findReviewsByAppointmentId(String appointmentId) {
        return reviews.values().stream()
                .filter(r -> appointmentId.equals(r.getAppointmentId()))
                .collect(Collectors.toList());
    }

    public List<Review> findReviewsByPatientId(String patientId) {
        return reviews.values().stream()
                .filter(r -> patientId.equals(r.getPatientId()))
                .sorted((r1, r2) -> r2.getCreatedAt().compareTo(r1.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public void deleteReview(String reviewId) {
        reviews.remove(reviewId);
        if (firestore != null) {
            try {
                firestore.collection("reviews").document(reviewId).delete();
            } catch (Exception e) {
                logger.error("Firestore sync error deleting review: {}", e.getMessage());
            }
        }
    }

    public void updateDoctorRatingStats(String doctorId, double avgRating, int totalReviews) {
        Doctor doctor = doctors.get(doctorId);
        if (doctor != null) {
            doctor.setRating(avgRating);
            doctor.setReviewCount(totalReviews);
            saveDoctor(doctor);
        }
    }

    // VIDEO CONSULTATIONS
    public VideoConsultation saveVideoConsultation(VideoConsultation consultation) {
        if (consultation.getConsultationId() == null) {
            consultation.setConsultationId("call_" + UUID.randomUUID().toString().substring(0, 8));
        }
        videoConsultations.put(consultation.getConsultationId(), consultation);
        if (firestore != null) {
            try {
                firestore.collection("videoConsultations").document(consultation.getConsultationId()).set(consultation, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on video consultation: {}", e.getMessage());
            }
        }
        return consultation;
    }

    public Optional<VideoConsultation> findVideoConsultationById(String id) {
        return Optional.ofNullable(videoConsultations.get(id));
    }

    public Optional<VideoConsultation> findVideoConsultationByAppointmentId(String appointmentId) {
        return videoConsultations.values().stream()
                .filter(c -> appointmentId.equals(c.getAppointmentId()))
                .findFirst();
    }

    // SERVER-SIDE ACTIVE CONSULTATION CONCURRENCY LOCK (ONE DOCTOR - ONE ACTIVE VIDEO CONSULTATION)
    public synchronized boolean acquireDoctorConsultationLock(String doctorId, String consultationId) {
        String existingConsultationId = activeDoctorConsultationLocks.get(doctorId);
        if (existingConsultationId != null && !existingConsultationId.equals(consultationId)) {
            // Verify if existing consultation is still ACTIVE in DB
            VideoConsultation existingVc = videoConsultations.get(existingConsultationId);
            if (existingVc != null && "ACTIVE".equalsIgnoreCase(existingVc.getStatus())) {
                logger.warn("Lock collision: Doctor {} is already in ACTIVE consultation {}", doctorId, existingConsultationId);
                return false;
            }
        }
        activeDoctorConsultationLocks.put(doctorId, consultationId);
        logger.info("Active consultation lock granted to doctor {} for session {}", doctorId, consultationId);
        return true;
    }

    public synchronized void releaseDoctorConsultationLock(String doctorId, String consultationId) {
        String existing = activeDoctorConsultationLocks.get(doctorId);
        if (existing != null && (consultationId == null || existing.equals(consultationId))) {
            activeDoctorConsultationLocks.remove(doctorId);
            logger.info("Released active consultation lock for doctor {} (session: {})", doctorId, consultationId);
        }
    }

    public synchronized boolean isDoctorCurrentlyInConsultation(String doctorId) {
        String existing = activeDoctorConsultationLocks.get(doctorId);
        if (existing == null) return false;
        VideoConsultation vc = videoConsultations.get(existing);
        if (vc != null && "ACTIVE".equalsIgnoreCase(vc.getStatus())) {
            return true;
        }
        // Lock was stale
        activeDoctorConsultationLocks.remove(doctorId);
        return false;
    }

    public synchronized String getActiveDoctorConsultationId(String doctorId) {
        String existing = activeDoctorConsultationLocks.get(doctorId);
        if (existing == null) return null;
        VideoConsultation vc = videoConsultations.get(existing);
        if (vc != null && "ACTIVE".equalsIgnoreCase(vc.getStatus())) {
            return existing;
        }
        activeDoctorConsultationLocks.remove(doctorId);
        return null;
    }

    // PATIENT WAITING ROOM & QUEUE MANAGEMENT
    public List<Appointment> findWaitingAppointmentsByDoctor(String doctorId, String date) {
        return appointments.values().stream()
                .filter(a -> doctorId.equals(a.getDoctorId()) &&
                        (date == null || date.equals(a.getAppointmentDate())) &&
                        a.isPatientCheckedIn() &&
                        !a.isAdmitted() &&
                        !"COMPLETED".equalsIgnoreCase(a.getStatus()) &&
                        !"CANCELLED".equalsIgnoreCase(a.getStatus()) &&
                        !"REJECTED".equalsIgnoreCase(a.getStatus()) &&
                        !"NO_SHOW".equalsIgnoreCase(a.getStatus()))
                .sorted((a1, a2) -> {
                    if (a1.getCheckedInAt() != null && a2.getCheckedInAt() != null) {
                        return a1.getCheckedInAt().compareTo(a2.getCheckedInAt());
                    }
                    return a1.getCreatedAt().compareTo(a2.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    public int calculateQueuePosition(String appointmentId) {
        Appointment apt = appointments.get(appointmentId);
        if (apt == null || !apt.isPatientCheckedIn() || apt.isAdmitted()) {
            return 0; // Not waiting
        }
        List<Appointment> queue = findWaitingAppointmentsByDoctor(apt.getDoctorId(), apt.getAppointmentDate());
        for (int i = 0; i < queue.size(); i++) {
            if (appointmentId.equals(queue.get(i).getAppointmentId())) {
                return i + 1; // 1-based position (Position 1, Position 2...)
            }
        }
        return 0;
    }

    // AI CONVERSATIONS
    public AiConversation saveAiConversation(AiConversation conversation) {
        if (conversation.getConversationId() == null) {
            conversation.setConversationId("ai_" + UUID.randomUUID().toString().substring(0, 8));
        }
        aiConversations.put(conversation.getConversationId(), conversation);
        if (firestore != null) {
            try {
                firestore.collection("aiConversations").document(conversation.getConversationId()).set(conversation, SetOptions.merge());
            } catch (Exception e) {
                logger.error("Firestore sync error on AI conversation: {}", e.getMessage());
            }
        }
        return conversation;
    }

    public Optional<AiConversation> findAiConversationById(String id) {
        return Optional.ofNullable(aiConversations.get(id));
    }
}
