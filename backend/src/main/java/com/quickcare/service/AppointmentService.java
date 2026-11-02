package com.quickcare.service;

import com.quickcare.dto.AppointmentRequest;
import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.*;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AppointmentService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private VideoConsultationService videoService;

    public synchronized Appointment bookAppointment(String patientUid, AppointmentRequest req) {
        // Validate patient
        Patient patient = db.findPatientByUid(patientUid)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for uid: " + patientUid));

        // Validate doctor
        Doctor doctor = db.findDoctorById(req.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + req.getDoctorId()));

        if (!"VERIFIED".equalsIgnoreCase(doctor.getVerificationStatus())) {
            throw new BadRequestException("Doctor is not yet verified for consultations.");
        }

        // ATOMIC DOUBLE-BOOKING CHECK
        if (db.isSlotBooked(req.getDoctorId(), req.getAppointmentDate(), req.getAppointmentTime())) {
            throw new BadRequestException("This time slot (" + req.getAppointmentTime() + ") on " + req.getAppointmentDate() + " is already booked. Please choose another time slot.");
        }

        Appointment apt = new Appointment();
        apt.setAppointmentId("apt_" + UUID.randomUUID().toString().substring(0, 8));
        apt.setPatientId(patient.getPatientId());
        apt.setPatientUid(patient.getUid());
        apt.setPatientName(patient.getFullName());
        apt.setPatientEmail(patient.getEmail());
        apt.setPatientPhone(patient.getPhone());
        apt.setDoctorId(doctor.getDoctorId());
        apt.setDoctorUid(doctor.getUid());
        apt.setDoctorName(doctor.getFullName());
        apt.setDoctorSpecialization(doctor.getSpecialization());
        apt.setAppointmentDate(req.getAppointmentDate());
        apt.setAppointmentTime(req.getAppointmentTime());
        apt.setConsultationType(req.getConsultationType() != null ? req.getConsultationType() : "VIDEO");
        apt.setReason(req.getReason());
        apt.setStatus("PENDING");
        apt.setConsultationFee(doctor.getConsultationFee());
        apt.setMeetingRoomId("quickcare-room-" + UUID.randomUUID().toString().substring(0, 8));

        Appointment saved = db.saveAppointment(apt);

        // Update DoctorAvailability bookedSlots
        DoctorAvailability da = db.findAvailability(doctor.getDoctorId(), req.getAppointmentDate())
                .orElse(new DoctorAvailability(doctor.getDoctorId() + "_" + req.getAppointmentDate(),
                        doctor.getDoctorId(), req.getAppointmentDate(), null));
        if (!da.getBookedSlots().contains(req.getAppointmentTime())) {
            da.getBookedSlots().add(req.getAppointmentTime());
            db.saveAvailability(da);
        }

        // Notify Doctor
        notificationService.sendNotification(doctor.getUid(), "New Appointment Request",
                "Patient " + patient.getFullName() + " requested an appointment on " + req.getAppointmentDate() + " at " + req.getAppointmentTime(),
                "APPOINTMENT_BOOKED", saved.getAppointmentId());

        // Notify Patient
        notificationService.sendNotification(patient.getUid(), "Appointment Submitted",
                "Your appointment request with Dr. " + doctor.getFullName() + " for " + req.getAppointmentDate() + " at " + req.getAppointmentTime() + " has been submitted.",
                "APPOINTMENT_BOOKED", saved.getAppointmentId());

        return saved;
    }

    public Appointment getAppointmentById(String id) {
        return db.findAppointmentById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + id));
    }

    public List<Appointment> getAppointmentsForPatient(String patientId) {
        return db.findAppointmentsByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsForDoctor(String doctorId) {
        return db.findAppointmentsByDoctorId(doctorId);
    }

    public List<Appointment> getAllAppointments() {
        return db.findAllAppointments();
    }

    public synchronized Appointment updateStatus(String appointmentId, String newStatus, String reason) {
        Appointment apt = getAppointmentById(appointmentId);
        String oldStatus = apt.getStatus();
        apt.setStatus(newStatus.toUpperCase());
        apt.setUpdatedAt(Instant.now());

        if (reason != null && !reason.trim().isEmpty()) {
            apt.setCancellationReason(reason);
        }

        if ("CONFIRMED".equalsIgnoreCase(newStatus)) {
            // Ensure WebRTC consultation room is ready
            videoService.createConsultationRoom(apt.getAppointmentId(), apt.getDoctorId(), apt.getPatientId(), apt.getMeetingRoomId());

            notificationService.sendNotification(apt.getPatientUid(), "Appointment Confirmed",
                    "Dr. " + apt.getDoctorName() + " has confirmed your appointment on " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ". Video consultation link is ready.",
                    "APPOINTMENT_CONFIRMED", apt.getAppointmentId());

        } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
            // Free slot
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

            notificationService.sendNotification(apt.getPatientUid(), "Appointment Declined",
                    "Dr. " + apt.getDoctorName() + " was unable to accept your appointment on " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ". Please reschedule or choose another slot.",
                    "APPOINTMENT_REJECTED", apt.getAppointmentId());

        } else if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            // Free slot
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

            notificationService.sendNotification(apt.getDoctorUid(), "Appointment Cancelled",
                    "Appointment with " + apt.getPatientName() + " on " + apt.getAppointmentDate() + " has been cancelled.",
                    "APPOINTMENT_CANCELLED", apt.getAppointmentId());

            notificationService.sendNotification(apt.getPatientUid(), "Appointment Cancelled",
                    "Your appointment with Dr. " + apt.getDoctorName() + " on " + apt.getAppointmentDate() + " has been cancelled.",
                    "APPOINTMENT_CANCELLED", apt.getAppointmentId());

        } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            notificationService.sendNotification(apt.getPatientUid(), "Consultation Completed",
                    "Your consultation with Dr. " + apt.getDoctorName() + " is marked as completed. You can view your digital prescription in your dashboard.",
                    "CONSULTATION_COMPLETED", apt.getAppointmentId());
        }

        return db.saveAppointment(apt);
    }

    private void freeSlot(String doctorId, String date, String time) {
        db.findAvailability(doctorId, date).ifPresent(da -> {
            da.getBookedSlots().remove(time);
            db.saveAvailability(da);
        });
    }

    public synchronized Appointment reschedule(String appointmentId, String newDate, String newTime) {
        Appointment apt = getAppointmentById(appointmentId);

        if (db.isSlotBooked(apt.getDoctorId(), newDate, newTime)) {
            throw new BadRequestException("Slot " + newTime + " on " + newDate + " is unavailable. Please select another slot.");
        }

        // Free old slot
        freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

        // Book new slot
        apt.setAppointmentDate(newDate);
        apt.setAppointmentTime(newTime);
        apt.setStatus("CONFIRMED");
        apt.setUpdatedAt(Instant.now());

        db.findAvailability(apt.getDoctorId(), newDate).ifPresent(da -> {
            if (!da.getBookedSlots().contains(newTime)) {
                da.getBookedSlots().add(newTime);
                db.saveAvailability(da);
            }
        });

        Appointment updated = db.saveAppointment(apt);

        notificationService.sendNotification(apt.getPatientUid(), "Appointment Rescheduled",
                "Your appointment with Dr. " + apt.getDoctorName() + " has been rescheduled to " + newDate + " at " + newTime,
                "APPOINTMENT_CONFIRMED", updated.getAppointmentId());

        notificationService.sendNotification(apt.getDoctorUid(), "Appointment Rescheduled",
                "Patient " + apt.getPatientName() + " has rescheduled their appointment to " + newDate + " at " + newTime,
                "APPOINTMENT_CONFIRMED", updated.getAppointmentId());

        return updated;
    }
}
