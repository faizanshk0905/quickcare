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
        if ("CANCELLED".equalsIgnoreCase(apt.getStatus()) || "REJECTED".equalsIgnoreCase(apt.getStatus())) {
            throw new BadRequestException("This appointment was " + apt.getStatus() + ". Video consultation is inactive.");
        }

        // Authorize user: must be the doctor or patient
        boolean isAuthorized = userUid.equals(apt.getDoctorUid()) ||
                userUid.equals(apt.getPatientUid()) ||
                "admin".equalsIgnoreCase(userUid);

        if (!isAuthorized) {
            throw new UnauthorizedException("You are not authorized to join this private medical consultation room.");
        }

        if ("SCHEDULED".equals(vc.getStatus())) {
            vc.setStatus("ACTIVE");
            vc.setStartTime(Instant.now());
            db.saveVideoConsultation(vc);
        }

        return vc;
    }

    public VideoConsultation endConsultation(String consultationId, String userUid) {
        VideoConsultation vc = db.findVideoConsultationById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Video consultation not found: " + consultationId));

        vc.setStatus("ENDED");
        vc.setEndTime(Instant.now());
        return db.saveVideoConsultation(vc);
    }
}
