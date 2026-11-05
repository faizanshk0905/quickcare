package com.quickcare.service;

import com.quickcare.dto.AppointmentRequest;
import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.exception.UnauthorizedException;
import com.quickcare.model.*;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class AppointmentService {

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private VideoConsultationService videoService;

    @Autowired
    private DoctorService doctorService;

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

        // Timezone validation
        String zoneName = doctor.getTimezone() != null && !doctor.getTimezone().trim().isEmpty()
                ? doctor.getTimezone().trim() : "Asia/Kolkata";
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(zoneName);
        } catch (Exception e) {
            zoneId = ZoneId.of("Asia/Kolkata");
        }

        LocalDate reqDate;
        try {
            reqDate = LocalDate.parse(req.getAppointmentDate());
        } catch (Exception e) {
            throw new BadRequestException("Invalid appointment date format. Use YYYY-MM-DD.");
        }

        LocalDate todayInZone = LocalDate.now(zoneId);
        if (reqDate.isBefore(todayInZone)) {
            throw new BadRequestException("Cannot book an appointment slot in the past.");
        }

        // Check doctor holidays
        if (doctor.getHolidays() != null && doctor.getHolidays().contains(req.getAppointmentDate())) {
            throw new BadRequestException("Dr. " + doctor.getFullName() + " is on scheduled leave/holiday on " + req.getAppointmentDate() + ". Please select another date.");
        }

        // Check working days
        List<String> workingDays = doctor.getAvailableDays();
        if (workingDays != null && !workingDays.isEmpty()) {
            String dayName = reqDate.getDayOfWeek().name();
            boolean isWorkingDay = workingDays.stream()
                    .anyMatch(d -> d.equalsIgnoreCase(dayName) ||
                            (dayName.length() >= 3 && d.toUpperCase().startsWith(dayName.substring(0, 3))));
            if (!isWorkingDay) {
                throw new BadRequestException("Dr. " + doctor.getFullName() + " does not consult on " + dayName.toLowerCase() + "s. Please choose a working day.");
            }
        }

        // Validate time slot and check if in past for today
        LocalTime slotTime = doctorService.parseTimeFlexible(req.getAppointmentTime(), null);
        if (slotTime == null) {
            throw new BadRequestException("Invalid time slot format: " + req.getAppointmentTime());
        }

        if (reqDate.equals(todayInZone)) {
            LocalTime nowInZone = LocalTime.now(zoneId);
            if (!slotTime.isAfter(nowInZone)) {
                throw new BadRequestException("Cannot book an appointment slot in the past. This time has already passed.");
            }
        }

        // Working hours and break validation
        LocalTime startTime = doctorService.parseTimeFlexible(doctor.getWorkingStartTime(), LocalTime.of(9, 0));
        LocalTime endTime = doctorService.parseTimeFlexible(doctor.getWorkingEndTime(), LocalTime.of(17, 0));
        LocalTime breakStart = doctorService.parseTimeFlexible(doctor.getBreakStartTime(), LocalTime.of(13, 0));
        LocalTime breakEnd = doctorService.parseTimeFlexible(doctor.getBreakEndTime(), LocalTime.of(14, 0));

        if (slotTime.isBefore(startTime) || slotTime.compareTo(endTime) >= 0) {
            throw new BadRequestException("Selected time slot is outside Dr. " + doctor.getFullName() + "'s working hours (" + doctor.getWorkingHours() + ").");
        }

        if (slotTime.compareTo(breakStart) >= 0 && slotTime.compareTo(breakEnd) < 0) {
            throw new BadRequestException("Selected time slot falls during Dr. " + doctor.getFullName() + "'s scheduled break (" + doctor.getBreakStartTime() + " - " + doctor.getBreakEndTime() + ").");
        }

        // ATOMIC DOUBLE-BOOKING CHECK
        if (db.isSlotBooked(req.getDoctorId(), req.getAppointmentDate(), req.getAppointmentTime())) {
            throw new BadRequestException("This appointment slot has just been booked. Please select another slot.");
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

        } else if ("NO_SHOW".equalsIgnoreCase(newStatus)) {
            // Free slot
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

            notificationService.sendNotification(apt.getPatientUid(), "Appointment Marked No-Show",
                    "Your appointment with Dr. " + apt.getDoctorName() + " on " + apt.getAppointmentDate() + " was marked as no-show.",
                    "APPOINTMENT_NO_SHOW", apt.getAppointmentId());

        } else if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            // End video consultation and release lock if active
            db.findVideoConsultationByAppointmentId(appointmentId).ifPresent(vc -> {
                if ("ACTIVE".equalsIgnoreCase(vc.getStatus())) {
                    vc.setStatus("ENDED");
                    vc.setEndTime(Instant.now());
                    db.saveVideoConsultation(vc);
                    db.releaseDoctorConsultationLock(apt.getDoctorId(), vc.getConsultationId());
                }
            });

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

    public synchronized Appointment checkInPatient(String appointmentId, String userUid) {
        Appointment apt = getAppointmentById(appointmentId);
        if (!userUid.equals(apt.getPatientUid()) && !"admin".equalsIgnoreCase(userUid)) {
            throw new UnauthorizedException("Only the scheduled patient can check into this appointment.");
        }

        if (!"CONFIRMED".equalsIgnoreCase(apt.getStatus())) {
            throw new BadRequestException("Only confirmed appointments can check into the waiting room. Current status: " + apt.getStatus());
        }

        apt.setPatientCheckedIn(true);
        if (apt.getCheckedInAt() == null) {
            apt.setCheckedInAt(Instant.now());
        }
        apt.setUpdatedAt(Instant.now());
        Appointment saved = db.saveAppointment(apt);

        notificationService.sendNotification(apt.getDoctorUid(), "Patient In Waiting Room",
                "Patient " + apt.getPatientName() + " has checked into your virtual waiting room.",
                "PATIENT_CHECKED_IN", apt.getAppointmentId());

        return saved;
    }

    public synchronized Appointment admitPatient(String appointmentId, String doctorUid) {
        Appointment apt = getAppointmentById(appointmentId);
        if (!doctorUid.equals(apt.getDoctorUid()) && !"admin".equalsIgnoreCase(doctorUid)) {
            throw new UnauthorizedException("Only the assigned doctor can admit patients into the consultation.");
        }

        if (!apt.isPatientCheckedIn()) {
            throw new BadRequestException("Patient has not checked into the virtual waiting room yet.");
        }

        VideoConsultation vc = videoService.getConsultationByAppointment(appointmentId);

        // One Doctor - One Active Consultation Check
        String activeSession = db.getActiveDoctorConsultationId(apt.getDoctorId());
        if (activeSession != null && !activeSession.equals(vc.getConsultationId())) {
            throw new BadRequestException("You already have an active video consultation in progress with another patient. You must conclude that consultation before admitting another patient.");
        }

        // Acquire active consultation lock
        boolean acquired = db.acquireDoctorConsultationLock(apt.getDoctorId(), vc.getConsultationId());
        if (!acquired) {
            throw new BadRequestException("Could not acquire doctor active consultation lock. Another consultation is currently active.");
        }

        apt.setAdmitted(true);
        apt.setAdmittedAt(Instant.now());
        apt.setConsultationStartedAt(Instant.now());
        apt.setUpdatedAt(Instant.now());

        vc.setStatus("ACTIVE");
        vc.setStartTime(Instant.now());
        db.saveVideoConsultation(vc);

        Appointment saved = db.saveAppointment(apt);

        notificationService.sendNotification(apt.getPatientUid(), "Doctor Admitted You",
                "Dr. " + apt.getDoctorName() + " has admitted you to the consultation room. You can now enter the video call.",
                "PATIENT_ADMITTED", apt.getAppointmentId());

        return saved;
    }

    public Map<String, Object> getWaitingRoomStatus(String appointmentId, String userUid) {
        Appointment apt = getAppointmentById(appointmentId);
        boolean isDoctor = userUid.equals(apt.getDoctorUid()) || "admin".equalsIgnoreCase(userUid);
        boolean isPatient = userUid.equals(apt.getPatientUid());

        if (!isDoctor && !isPatient) {
            throw new UnauthorizedException("You are not authorized to view this waiting room.");
        }

        boolean isBusy = db.isDoctorCurrentlyInConsultation(apt.getDoctorId());
        int queuePos = db.calculateQueuePosition(appointmentId);

        Map<String, Object> status = new HashMap<>();
        status.put("appointmentId", apt.getAppointmentId());
        status.put("patientId", apt.getPatientId());
        status.put("patientName", apt.getPatientName());
        status.put("doctorId", apt.getDoctorId());
        status.put("doctorName", apt.getDoctorName());
        status.put("appointmentDate", apt.getAppointmentDate());
        status.put("appointmentTime", apt.getAppointmentTime());
        status.put("patientCheckedIn", apt.isPatientCheckedIn());
        status.put("checkedInAt", apt.getCheckedInAt());
        status.put("admitted", apt.isAdmitted());
        status.put("admittedAt", apt.getAdmittedAt());
        status.put("queuePosition", queuePos);
        status.put("doctorStatus", isBusy ? "BUSY" : "AVAILABLE");
        status.put("doctorBusyReason", isBusy
                ? "Doctor is currently consulting another patient. Please wait."
                : "Doctor is available and will admit you shortly.");
        // Expose meetingRoomId only if admitted or doctor
        status.put("meetingRoomId", (apt.isAdmitted() || isDoctor) ? apt.getMeetingRoomId() : null);
        status.put("appointmentStatus", apt.getStatus());

        return status;
    }

    public List<Appointment> getWaitingQueueForDoctor(String doctorUid) {
        Doctor doc = db.findDoctorByUid(doctorUid)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for uid: " + doctorUid));
        return db.findWaitingAppointmentsByDoctor(doc.getDoctorId(), LocalDate.now().toString());
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
