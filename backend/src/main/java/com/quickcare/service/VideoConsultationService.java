package com.quickcare.service;

import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.exception.UnauthorizedException;
import com.quickcare.model.Appointment;
import com.quickcare.model.VideoConsultation;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class VideoConsultationService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    public VideoConsultation createConsultationRoom(String appointmentId, String doctorId, String patientId, String roomRef) {
        Optional<VideoConsultation> existing = db.findVideoConsultationByAppointmentId(appointmentId);
        if (existing.isPresent()) {
            return existing.get();
        }

        VideoConsultation vc = new VideoConsultation();
        vc.setConsultationId("vc_" + UUID.randomUUID().toString().substring(0, 8));
        vc.setAppointmentId(appointmentId);
        vc.setDoctorId(doctorId);
        vc.setPatientId(patientId);
        vc.setMeetingReference(roomRef != null ? roomRef : "quickcare-meeting-" + UUID.randomUUID().toString().substring(0, 8));
        vc.setStatus("SCHEDULED");

        return db.saveVideoConsultation(vc);
    }

    public VideoConsultation getConsultationByAppointment(String appointmentId) {
        return db.findVideoConsultationByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    Appointment apt = db.findAppointmentById(appointmentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));
                    return createConsultationRoom(appointmentId, apt.getDoctorId(), apt.getPatientId(), apt.getMeetingRoomId());
                });
    }

    public VideoConsultation authorizeAndJoin(String consultationId, String userUid) {
        VideoConsultation vc = db.findVideoConsultationById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found: " + consultationId));

        Appointment apt = db.findAppointmentById(vc.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated appointment not found"));

        // Validate appointment status
        if ("CANCELLED".equalsIgnoreCase(apt.getStatus()) || "REJECTED".equalsIgnoreCase(apt.getStatus()) || "NO_SHOW".equalsIgnoreCase(apt.getStatus())) {
            throw new BadRequestException("This appointment was " + apt.getStatus() + ". Video consultation is inactive.");
        }

        // Authorize user: must be the doctor or patient
        boolean isDoctor = userUid.equals(apt.getDoctorUid());
        boolean isPatient = userUid.equals(apt.getPatientUid());
        boolean isAdmin = "admin".equalsIgnoreCase(userUid);

        if (!isDoctor && !isPatient && !isAdmin) {
            throw new UnauthorizedException("You are not authorized to join this private medical consultation room.");
        }

        // ONE DOCTOR - ONE ACTIVE CONSULTATION CONCURRENCY LOCK
        if (isDoctor) {
            String activeConsultationId = db.getActiveDoctorConsultationId(apt.getDoctorId());
            if (activeConsultationId != null && !activeConsultationId.equals(consultationId)) {
                throw new BadRequestException("You already have an active consultation in progress with another patient. You must conclude that session before starting another.");
            }
            db.acquireDoctorConsultationLock(apt.getDoctorId(), consultationId);
        }

        // PATIENT ADMISSION VALIDATION (Must be admitted by doctor)
        if (isPatient && !apt.isAdmitted()) {
            throw new BadRequestException("You are in the virtual waiting room. Please wait until Dr. " + apt.getDoctorName() + " admits you to the consultation.");
        }

        if ("SCHEDULED".equals(vc.getStatus())) {
            vc.setStatus("ACTIVE");
            vc.setStartTime(Instant.now());
            if (apt.getConsultationStartedAt() == null) {
                apt.setConsultationStartedAt(Instant.now());
                db.saveAppointment(apt);
            }
            db.saveVideoConsultation(vc);
        }

        return vc;
    }

    public VideoConsultation endConsultation(String consultationId, String userUid) {
        VideoConsultation vc = db.findVideoConsultationById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found: " + consultationId));

        Appointment apt = db.findAppointmentById(vc.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated appointment not found"));

        vc.setStatus("ENDED");
        vc.setEndTime(Instant.now());
        db.saveVideoConsultation(vc);

        // Mark appointment as COMPLETED
        apt.setStatus("COMPLETED");
        apt.setConsultationEndedAt(Instant.now());
        apt.setUpdatedAt(Instant.now());
        db.saveAppointment(apt);

        // RELEASE DOCTOR ACTIVE CONSULTATION LOCK
        db.releaseDoctorConsultationLock(apt.getDoctorId(), consultationId);

        // NOTIFY NEXT ELIGIBLE PATIENT IN WAITING QUEUE
        List<Appointment> waitingList = db.findWaitingAppointmentsByDoctor(apt.getDoctorId(), apt.getAppointmentDate());
        if (!waitingList.isEmpty()) {
            Appointment nextPatient = waitingList.get(0);
            notificationService.sendNotification(nextPatient.getPatientUid(), "Doctor is Available",
                    "Dr. " + apt.getDoctorName() + " has concluded their previous consultation. You are next in queue!",
                    "DOCTOR_AVAILABLE", nextPatient.getAppointmentId());

            notificationService.sendNotification(apt.getDoctorUid(), "Next Patient Waiting",
                    "Patient " + nextPatient.getPatientName() + " is ready in Position 1. You may admit them now.",
                    "NEXT_PATIENT_READY", nextPatient.getAppointmentId());
        }

        return vc;
    }
}
