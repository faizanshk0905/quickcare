package com.quickcare.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.quickcare.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
        return Optional.ofNullable(users.get(uid));
    }

    public Optional<User> findUserByEmail(String email) {
        return users.values().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email.trim()))
                .findFirst();
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
        return Optional.ofNullable(doctors.get(doctorId));
    }

    public Optional<Doctor> findDoctorByUid(String uid) {
        return doctors.values().stream().filter(d -> uid.equals(d.getUid())).findFirst();
    }

    public List<Doctor> findAllDoctors() {
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
                !"NO_SHOW".equalsIgnoreCase(a.getStatus())
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
