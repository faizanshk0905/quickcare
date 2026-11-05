package com.quickcare.service;

import com.quickcare.model.Appointment;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@EnableScheduling
public class ReminderSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(ReminderSchedulerService.class);

    @Autowired
    private FirestoreDatabaseService db;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AppointmentService appointmentService;

    // Track notified appointment IDs to prevent duplicate reminders
    private final Set<String> remindedAppointments = new HashSet<>();

    // Process 15-Minute Appointment Confirmations & Slot Timeouts every 30 seconds
    @Scheduled(fixedRate = 30000)
    public void process15MinuteConfirmationsAndReallocations() {
        try {
            // 1. Dispatch 15-min confirmation prompts to eligible patients
            appointmentService.dispatch15MinConfirmationPrompts();

            // 2. Check for response timeout (default 5 min grace window) and flag NOT_RESPONDED
            appointmentService.checkResponseTimeouts(5);
        } catch (Exception e) {
            logger.error("Error running 15-minute confirmation scheduler: {}", e.getMessage());
        }
    }

    // Run every 10 minutes to dispatch intelligent reminders
    @Scheduled(fixedRate = 600000)
    public void dispatchAppointmentReminders() {
        String today = LocalDate.now().toString();
        List<Appointment> todayAppointments = db.findAllAppointments();

        for (Appointment apt : todayAppointments) {
            if ("CONFIRMED".equalsIgnoreCase(apt.getStatus()) &&
                today.equals(apt.getAppointmentDate()) &&
                !remindedAppointments.contains(apt.getAppointmentId())) {

                logger.info("Dispatching scheduled reminder for appointment: {}", apt.getAppointmentId());

                // Notify Patient
                notificationService.sendNotification(apt.getPatientUid(), "Upcoming Appointment Reminder",
                        "Friendly reminder: You have a consultation with Dr. " + apt.getDoctorName() + " today at " + apt.getAppointmentTime() + ". Be ready to join the video room.",
                        "REMINDER", apt.getAppointmentId());

                // Notify Doctor
                notificationService.sendNotification(apt.getDoctorUid(), "Upcoming Patient Appointment Reminder",
                        "Scheduled reminder: Consultation with patient " + apt.getPatientName() + " today at " + apt.getAppointmentTime() + ".",
                        "REMINDER", apt.getAppointmentId());

                remindedAppointments.add(apt.getAppointmentId());
            }
        }
    }
}
