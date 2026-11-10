package com.quickcare.service;

import com.quickcare.dto.AppointmentRequest;
import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.exception.UnauthorizedException;
import com.quickcare.model.*;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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

    @Autowired
    private GoogleMeetService googleMeetService;

    @Autowired
    private EmailService emailService;

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

        boolean isVideo = "VIDEO".equalsIgnoreCase(req.getConsultationType());

        // Working hours and break validation (enforced strictly for in-person/clinic visits)
        if (!isVideo) {
            LocalTime startTime = doctorService.parseTimeFlexible(doctor.getWorkingStartTime(), LocalTime.of(9, 0));
            LocalTime endTime = doctorService.parseTimeFlexible(doctor.getWorkingEndTime(), LocalTime.of(17, 0));
            LocalTime breakStart = doctorService.parseTimeFlexible(doctor.getBreakStartTime(), LocalTime.of(13, 0));
            LocalTime breakEnd = doctorService.parseTimeFlexible(doctor.getBreakEndTime(), LocalTime.of(14, 0));

            if (slotTime.isBefore(startTime) || slotTime.compareTo(endTime) >= 0) {
                throw new BadRequestException("Selected time slot is outside Dr. " + doctor.getFullName() + "'s clinic working hours (" + doctor.getWorkingHours() + "). For 24/7 care, select Video Consultation.");
            }

            if (slotTime.compareTo(breakStart) >= 0 && slotTime.compareTo(breakEnd) < 0) {
                throw new BadRequestException("Selected time slot falls during Dr. " + doctor.getFullName() + "'s scheduled clinic break (" + doctor.getBreakStartTime() + " - " + doctor.getBreakEndTime() + ").");
            }
        }

        // ATOMIC DOUBLE-BOOKING CONCURRENCY LOCK
        if (!db.tryReserveSlot(req.getDoctorId(), req.getAppointmentDate(), req.getAppointmentTime())) {
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
        String initialMeet = googleMeetService.getOrCreateGoogleMeetLink(apt);
        apt.setGoogleMeetLink(initialMeet);
        apt.setMeetingRoomId(initialMeet);

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

        saved.addAuditLog("APPOINTMENT_CREATED", patient.getEmail(), "Appointment booked for " + req.getAppointmentDate() + " at " + req.getAppointmentTime());
        db.saveAppointment(saved);

        // If booked less than 15 minutes before start time, trigger immediate confirmation prompt
        try {
            LocalDate aDate = LocalDate.parse(saved.getAppointmentDate());
            LocalTime aTime = doctorService.parseTimeFlexible(saved.getAppointmentTime(), null);
            if (aTime != null) {
                ZonedDateTime zdt = ZonedDateTime.of(aDate, aTime, zoneId);
                long minutesToStart = Duration.between(Instant.now(), zdt.toInstant()).toMinutes();
                if (minutesToStart <= 15 && minutesToStart >= -10) {
                    triggerConfirmationPrompt(saved);
                }
            }
        } catch (Exception ignored) {}

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
            apt.setApprovedAt(Instant.now());
            String meetUrl = googleMeetService.getOrCreateGoogleMeetLink(apt);
            apt.setGoogleMeetLink(meetUrl);
            apt.setMeetingRoomId(meetUrl);

            // Ensure WebRTC consultation room is ready
            videoService.createConsultationRoom(apt.getAppointmentId(), apt.getDoctorId(), apt.getPatientId(), meetUrl);

            notificationService.sendNotification(apt.getPatientUid(), "Video Consultation Approved",
                    "Dr. " + apt.getDoctorName() + " has approved your consultation on " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ". Google Meet link is ready: " + meetUrl,
                    "APPOINTMENT_CONFIRMED", apt.getAppointmentId());

            // Dispatch full approval email with meeting link and instructions to patient
            emailService.sendConsultationApprovalEmail(apt, meetUrl);
            apt.addAuditLog("CONSULTATION_APPROVED", apt.getDoctorName(), "Doctor approved consultation. Google Meet link: " + meetUrl);

        } else if ("REJECTED".equalsIgnoreCase(newStatus)) {
            apt.setRejectedAt(Instant.now());
            // Free slot
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

            notificationService.sendNotification(apt.getPatientUid(), "Appointment Request Declined",
                    "Dr. " + apt.getDoctorName() + " was unable to accept your appointment on " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ". Reason: " + (reason != null ? reason : "Doctor schedule emergency"),
                    "APPOINTMENT_REJECTED", apt.getAppointmentId());

            // Dispatch rejection notification email to patient
            emailService.sendConsultationRejectionEmail(apt, reason);
            apt.addAuditLog("CONSULTATION_REJECTED", apt.getDoctorName(), "Doctor declined consultation. Reason: " + reason);

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
        db.releaseSlotLock(doctorId, date, time);
        try {
            LocalDate aptDate = LocalDate.parse(date);
            ZoneId zoneId = ZoneId.of("Asia/Kolkata");
            LocalDate todayInZone = LocalDate.now(zoneId);

            // If appointment date is already in the past, never make it available again
            if (aptDate.isBefore(todayInZone)) {
                return;
            }

            // If appointment date is today, only free if the slot is still in the future
            if (aptDate.equals(todayInZone)) {
                LocalTime slotTime = doctorService.parseTimeFlexible(time, null);
                if (slotTime == null || !slotTime.isAfter(LocalTime.now(zoneId))) {
                    return;
                }
            }
        } catch (Exception ignored) {}

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

    public synchronized void triggerConfirmationPrompt(Appointment apt) {
        if (apt.isConfirmationPromptSent()) return;
        if ("CANCELLED".equalsIgnoreCase(apt.getStatus()) || "REJECTED".equalsIgnoreCase(apt.getStatus()) || "COMPLETED".equalsIgnoreCase(apt.getStatus()) || "DECLINED".equalsIgnoreCase(apt.getStatus())) {
            return;
        }

        apt.setConfirmationPromptSent(true);
        apt.setConfirmationPromptSentAt(Instant.now());
        apt.setConfirmationStatus("PENDING_CONFIRMATION");
        apt.setUpdatedAt(Instant.now());
        apt.addAuditLog("CONFIRMATION_PROMPT_SENT", "SYSTEM", "Automated 15-minute confirmation prompt dispatched to patient.");
        db.saveAppointment(apt);

        // Send confirmation notification to patient
        notificationService.sendNotification(apt.getPatientUid(), "Action Required: Confirm Appointment (15 Min)",
                "Your doctor appointment is scheduled in 15 minutes. Please confirm whether you are available for your consultation.",
                "CONFIRMATION_REQUEST", apt.getAppointmentId());
    }

    public synchronized Map<String, Object> confirmAvailability(String appointmentId, String userUid, String response) {
        Appointment apt = getAppointmentById(appointmentId);
        boolean isPatient = userUid.equals(apt.getPatientUid());
        boolean isAdmin = "admin".equalsIgnoreCase(userUid) || "admin_001".equalsIgnoreCase(userUid);

        if (!isPatient && !isAdmin) {
            throw new UnauthorizedException("Only the scheduled patient can confirm appointment availability.");
        }

        Map<String, Object> result = new HashMap<>();

        if ("YES".equalsIgnoreCase(response)) {
            apt.setConfirmationStatus("CONFIRMED");
            apt.setStatus("CONFIRMED");
            apt.setConfirmedAt(Instant.now());
            apt.setUpdatedAt(Instant.now());
            apt.addAuditLog("PATIENT_CONFIRMED_AVAILABLE", apt.getPatientEmail(), "Patient confirmed availability: YES, I AM AVAILABLE.");

            // Notify Admin
            notificationService.sendNotification("admin_001", "Appointment Confirmed by Patient",
                    "Patient " + apt.getPatientName() + " confirmed availability for consultation with Dr. " + apt.getDoctorName() + " on " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ".",
                    "APPOINTMENT_CONFIRMED", apt.getAppointmentId());

            // Notify Doctor
            notificationService.sendNotification(apt.getDoctorUid(), "Patient Confirmed Availability",
                    "Patient " + apt.getPatientName() + " is available and confirmed their appointment for " + apt.getAppointmentTime() + ".",
                    "APPOINTMENT_CONFIRMED", apt.getAppointmentId());

            db.saveAppointment(apt);

            result.put("message", "Your appointment is confirmed. Please be ready for your consultation.");
            result.put("status", "CONFIRMED");
            result.put("appointment", apt);
            return result;

        } else if ("NO".equalsIgnoreCase(response)) {
            apt.setConfirmationStatus("DECLINED");
            apt.setStatus("DECLINED");
            apt.setDeclinedAt(Instant.now());
            apt.setSlotReleased(true);
            apt.setSlotReleasedAt(Instant.now());
            apt.setSlotReleasedBy("PATIENT");
            apt.setCancellationReason("Patient unavailable (Selected NO on 15-minute confirmation prompt).");
            apt.setUpdatedAt(Instant.now());
            apt.addAuditLog("PATIENT_DECLINED", apt.getPatientEmail(), "Patient declined availability: NO, I AM NOT AVAILABLE. Slot released immediately.");

            // Immediately release appointment slot
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

            // Notify Admin
            notificationService.sendNotification("admin_001", "Patient Unavailable - Slot Released",
                    "Patient " + apt.getPatientName() + " declined appointment for " + apt.getAppointmentTime() + ". Slot has been released and made available to other patients.",
                    "APPOINTMENT_CANCELLED", apt.getAppointmentId());

            // Notify Doctor
            notificationService.sendNotification(apt.getDoctorUid(), "Patient Cancelled - Slot Released",
                    "Patient " + apt.getPatientName() + " is NOT AVAILABLE and declined consultation for " + apt.getAppointmentTime() + ". Slot has been released.",
                    "APPOINTMENT_CANCELLED", apt.getAppointmentId());

            db.saveAppointment(apt);

            result.put("message", "Your appointment has been cancelled successfully because you are unavailable.");
            result.put("status", "DECLINED");
            result.put("appointment", apt);
            return result;
        } else {
            throw new BadRequestException("Invalid response. Allowed values are 'YES' or 'NO'.");
        }
    }

    public synchronized Appointment adminReleaseSlot(String appointmentId, String adminUid) {
        Appointment apt = getAppointmentById(appointmentId);

        if (apt.isSlotReleased()) {
            throw new BadRequestException("This appointment slot is already released.");
        }

        if ("COMPLETED".equalsIgnoreCase(apt.getStatus())) {
            throw new BadRequestException("Cannot release an appointment that is already COMPLETED.");
        }

        // Release slot atomically
        freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());

        apt.setSlotReleased(true);
        apt.setSlotReleasedAt(Instant.now());
        apt.setSlotReleasedBy(adminUid != null ? adminUid : "ADMIN");
        apt.setConfirmationStatus("SLOT_RELEASED");
        apt.setStatus("CANCELLED");
        apt.setCancellationReason("Slot released by Administrator for reassignment.");
        apt.setUpdatedAt(Instant.now());
        apt.addAuditLog("ADMIN_RELEASE_SLOT", adminUid != null ? adminUid : "ADMIN", "Administrator released slot for public booking / reassignment.");

        Appointment saved = db.saveAppointment(apt);

        // Notify Doctor
        notificationService.sendNotification(apt.getDoctorUid(), "Slot Released by Admin",
                "Appointment slot for " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + " has been released by Admin.",
                "APPOINTMENT_CANCELLED", saved.getAppointmentId());

        // Notify Patient
        notificationService.sendNotification(apt.getPatientUid(), "Appointment Slot Released",
                "Your appointment slot for " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + " was released by Admin due to unconfirmed availability.",
                "APPOINTMENT_CANCELLED", saved.getAppointmentId());

        return saved;
    }

    public List<Appointment> getAllConfirmations() {
        return db.findAllAppointments();
    }

    public synchronized void dispatch15MinConfirmationPrompts() {
        List<Appointment> all = db.findAllAppointments();
        LocalDate today = LocalDate.now();

        for (Appointment apt : all) {
            if (apt.isConfirmationPromptSent()) continue;
            if ("CANCELLED".equalsIgnoreCase(apt.getStatus()) ||
                "REJECTED".equalsIgnoreCase(apt.getStatus()) ||
                "COMPLETED".equalsIgnoreCase(apt.getStatus()) ||
                "DECLINED".equalsIgnoreCase(apt.getStatus())) {
                continue;
            }

            if (!today.toString().equals(apt.getAppointmentDate())) {
                continue;
            }

            try {
                Doctor doc = db.findDoctorById(apt.getDoctorId()).orElse(null);
                String zone = (doc != null && doc.getTimezone() != null) ? doc.getTimezone() : "Asia/Kolkata";
                ZoneId zoneId;
                try {
                    zoneId = ZoneId.of(zone);
                } catch (Exception e) {
                    zoneId = ZoneId.of("Asia/Kolkata");
                }

                LocalDate aDate = LocalDate.parse(apt.getAppointmentDate());
                LocalTime aTime = doctorService.parseTimeFlexible(apt.getAppointmentTime(), null);
                if (aTime != null) {
                    ZonedDateTime zdt = ZonedDateTime.of(aDate, aTime, zoneId);
                    long minutesToStart = Duration.between(Instant.now(), zdt.toInstant()).toMinutes();

                    // Exactly 15 minutes before appointment (window: <= 15 and >= -5 mins)
                    if (minutesToStart <= 15 && minutesToStart >= -5) {
                        triggerConfirmationPrompt(apt);
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    public synchronized void checkResponseTimeouts(int timeoutMinutes) {
        List<Appointment> all = db.findAllAppointments();
        Instant now = Instant.now();

        for (Appointment apt : all) {
            if (apt.isConfirmationPromptSent() &&
                "PENDING_CONFIRMATION".equalsIgnoreCase(apt.getConfirmationStatus()) &&
                apt.getConfirmationPromptSentAt() != null) {

                long mins = Duration.between(apt.getConfirmationPromptSentAt(), now).toMinutes();
                if (mins >= timeoutMinutes) {
                    apt.setConfirmationStatus("NOT_RESPONDED");
                    apt.setNotRespondedAt(now);
                    apt.setUpdatedAt(now);
                    apt.addAuditLog("PATIENT_NOT_RESPONDED", "SYSTEM", "Patient did not respond within configured " + timeoutMinutes + " minute grace window.");
                    db.saveAppointment(apt);

                    // Notify Admin
                    notificationService.sendNotification("admin_001", "Action Needed: Patient Not Responded",
                            "Patient " + apt.getPatientName() + " has NOT RESPONDED to the 15-minute confirmation for slot " + apt.getAppointmentTime() + ". Slot is eligible for release.",
                            "NOT_RESPONDED", apt.getAppointmentId());

                    // Notify Doctor
                    notificationService.sendNotification(apt.getDoctorUid(), "Patient Confirmation Timeout",
                            "Patient " + apt.getPatientName() + " did not respond to the 15-minute confirmation prompt for " + apt.getAppointmentTime() + ".",
                            "NOT_RESPONDED", apt.getAppointmentId());
                }
            }
        }
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

        String meetUrl = googleMeetService.getOrCreateGoogleMeetLink(updated);
        updated.setGoogleMeetLink(meetUrl);
        updated.setMeetingRoomId(meetUrl);

        notificationService.sendNotification(apt.getPatientUid(), "Appointment Rescheduled",
                "Your appointment with Dr. " + apt.getDoctorName() + " has been rescheduled to " + newDate + " at " + newTime,
                "APPOINTMENT_CONFIRMED", updated.getAppointmentId());

        notificationService.sendNotification(apt.getDoctorUid(), "Appointment Rescheduled",
                "Patient " + apt.getPatientName() + " has rescheduled their appointment to " + newDate + " at " + newTime,
                "APPOINTMENT_CONFIRMED", updated.getAppointmentId());

        emailService.sendConsultationRescheduleEmail(updated, newDate, newTime, meetUrl);
        updated.addAuditLog("APPOINTMENT_RESCHEDULED", "USER", "Rescheduled to " + newDate + " at " + newTime + ". Meet link: " + meetUrl);
        return db.saveAppointment(updated);
    }

    public synchronized Appointment approveAndScheduleGoogleMeet(String appointmentId, String newDate, String newTime, String doctorNotes) {
        Appointment apt = getAppointmentById(appointmentId);

        if (newDate != null && !newDate.trim().isEmpty() && !newDate.equals(apt.getAppointmentDate())) {
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());
            apt.setAppointmentDate(newDate.trim());
        }
        if (newTime != null && !newTime.trim().isEmpty() && !newTime.equals(apt.getAppointmentTime())) {
            freeSlot(apt.getDoctorId(), apt.getAppointmentDate(), apt.getAppointmentTime());
            apt.setAppointmentTime(newTime.trim());
        }
        if (doctorNotes != null && !doctorNotes.trim().isEmpty()) {
            apt.setDoctorNotes(doctorNotes.trim());
        }

        apt.setStatus("CONFIRMED");
        apt.setApprovedAt(Instant.now());
        apt.setUpdatedAt(Instant.now());

        // Generate genuine Google Meet link
        String meetUrl = googleMeetService.getOrCreateGoogleMeetLink(apt);
        apt.setGoogleMeetLink(meetUrl);
        apt.setMeetingRoomId(meetUrl);

        // Ensure video consultation entity is created
        videoService.createConsultationRoom(apt.getAppointmentId(), apt.getDoctorId(), apt.getPatientId(), meetUrl);

        // Reserve doctor's slot if needed
        DoctorAvailability da = db.findAvailability(apt.getDoctorId(), apt.getAppointmentDate())
                .orElse(new DoctorAvailability(apt.getDoctorId() + "_" + apt.getAppointmentDate(), apt.getDoctorId(), apt.getAppointmentDate(), null));
        if (!da.getBookedSlots().contains(apt.getAppointmentTime())) {
            da.getBookedSlots().add(apt.getAppointmentTime());
            db.saveAvailability(da);
        }

        Appointment saved = db.saveAppointment(apt);

        // Dispatch In-App Notification
        notificationService.sendNotification(apt.getPatientUid(), "Video Consultation Approved",
                "Dr. " + apt.getDoctorName() + " has approved your video consultation for " + apt.getAppointmentDate() + " at " + apt.getAppointmentTime() + ". Google Meet: " + meetUrl,
                "APPOINTMENT_CONFIRMED", apt.getAppointmentId());

        // Dispatch Confirmation Email to Patient
        emailService.sendConsultationApprovalEmail(saved, meetUrl);
        saved.addAuditLog("CONSULTATION_APPROVED", apt.getDoctorName(), "Doctor approved video consultation with Google Meet: " + meetUrl);
        return db.saveAppointment(saved);
    }

    public Appointment updateMeetingLink(String appointmentId, String meetingLink) {
        Appointment apt = getAppointmentById(appointmentId);
        if (meetingLink != null && !meetingLink.trim().isEmpty()) {
            apt.setGoogleMeetLink(meetingLink.trim());
            apt.setMeetingRoomId(meetingLink.trim());
            apt.addAuditLog("MEETING_LINK_UPDATED", "Doctor", "Meeting link updated to: " + meetingLink);
            Appointment saved = db.saveAppointment(apt);
            if (apt.getPatientUid() != null) {
                try {
                    notificationService.sendNotification(apt.getPatientUid(), "Google Meet Link Updated",
                            "Dr. " + apt.getDoctorName() + " has shared the video meeting link: " + meetingLink,
                            "MEETING_LINK_UPDATED", apt.getAppointmentId());
                } catch (Exception e) {
                    // ignore notification error
                }
            }
            return saved;
        }
        return apt;
    }
}
