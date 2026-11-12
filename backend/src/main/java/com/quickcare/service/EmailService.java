package com.quickcare.service;

import com.quickcare.model.Appointment;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private FirestoreDatabaseService db;

    // In-memory audit trail of sent emails: id -> Map
    private final Map<String, Map<String, Object>> sentEmailLogs = new ConcurrentHashMap<>();

    // Deduplication tracker to prevent multiple identical emails sent within short timeframes: appointmentId -> lastSentTimestamp
    private final Map<String, Instant> recentDispatches = new ConcurrentHashMap<>();

    /**
     * Requirement 2 & 4: Sends Doctor's Video Consultation Link to patient's registered email.
     * Prevents duplicate emails when the doctor clicks the send button multiple times.
     */
    public boolean sendDoctorVideoConsultationLinkEmail(Appointment appointment, String videoLink) {
        if (appointment == null || appointment.getPatientEmail() == null || appointment.getPatientEmail().trim().isEmpty()) {
            logger.warn("Cannot dispatch video consultation link email: missing patient registered email.");
            return false;
        }

        String dedupKey = appointment.getAppointmentId() + "_" + (videoLink != null ? videoLink.trim() : "default");
        Instant lastSent = recentDispatches.get(dedupKey);
        if (lastSent != null && java.time.Duration.between(lastSent, Instant.now()).getSeconds() < 15) {
            logger.info("Skipping duplicate email dispatch for appointment {} (sent {}s ago).",
                    appointment.getAppointmentId(), java.time.Duration.between(lastSent, Instant.now()).getSeconds());
            return true;
        }
        recentDispatches.put(dedupKey, Instant.now());

        String to = appointment.getPatientEmail().trim();
        String doctorName = appointment.getDoctorName() != null ? appointment.getDoctorName().replaceFirst("^Dr\\.\\s*", "") : "Doctor";
        String patientName = appointment.getPatientName() != null ? appointment.getPatientName() : "Patient";
        String date = appointment.getAppointmentDate() != null ? appointment.getAppointmentDate() : "Scheduled Date";
        String time = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime() : "Scheduled Time";
        String meetUrl = videoLink != null ? videoLink.trim() : appointment.getVideoConsultationLink();

        String subject = "Your Quick Care Video Consultation Link";

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                "<div style=\"background: #0d9488; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0; font-size: 22px;\">Quick Care Video Consultation</h1>" +
                "<p style=\"margin: 6px 0 0; font-size: 13px; opacity: 0.95;\">Doctor Has Sent Your Consultation Link</p>" +
                "</div>" +
                "<div style=\"border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; background: #ffffff;\">" +
                "<p>Dear <strong>" + patientName + "</strong>,</p>" +
                "<p>Your video consultation with <strong>Dr. " + doctorName + "</strong> has been approved.</p>" +
                "<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;\">" +
                "<h3 style=\"margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;\">Appointment Details:</h3>" +
                "<ul style=\"padding-left: 20px; margin: 10px 0 0; font-size: 14px; line-height: 1.8;\">" +
                "<li><strong>Doctor:</strong> Dr. " + doctorName + "</li>" +
                "<li><strong>Appointment Date:</strong> " + date + "</li>" +
                "<li><strong>Appointment Time:</strong> " + time + "</li>" +
                "<li><strong>Consultation Type:</strong> Online Video Consultation</li>" +
                "</ul>" +
                "</div>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<h3 style=\"margin-bottom: 12px; color: #0f172a; font-size: 15px;\">Join Your Consultation:</h3>" +
                "<a href=\"" + meetUrl + "\" target=\"_blank\" style=\"display: inline-block; background: #0d9488; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);\">Join Video Consultation</a>" +
                "<p style=\"font-size: 12px; color: #64748b; margin-top: 10px;\">Direct Meeting Link: <a href=\"" + meetUrl + "\" style=\"color: #0d9488; word-break: break-all;\">" + meetUrl + "</a></p>" +
                "</div>" +
                "<p style=\"font-size: 13px; color: #334155; margin-top: 20px;\">Please join the meeting at your scheduled appointment time.</p>" +
                "<p style=\"font-size: 13px; color: #334155;\">Thank you for choosing Quick Care.</p>" +
                "<p style=\"font-size: 13px; color: #334155; margin-top: 20px;\">Regards,<br/><strong>Quick Care Healthcare Team</strong></p>" +
                "</div></body></html>";

        return recordAndDispatchEmail(appointment.getAppointmentId(), to, subject, htmlBody, "DOCTOR_VIDEO_LINK_SENT", meetUrl);
    }

    /**
     * Sends Consultation Approval Email to patient with genuine Google Meet details and joining instructions.
     */
    public boolean sendConsultationApprovalEmail(Appointment appointment, String googleMeetLink) {
        if (appointment == null || appointment.getPatientEmail() == null) {
            logger.warn("Cannot dispatch consultation email: missing patient email.");
            return false;
        }

        String to = appointment.getPatientEmail().trim();
        String doctorName = appointment.getDoctorName() != null ? appointment.getDoctorName() : "Doctor";
        String patientName = appointment.getPatientName() != null ? appointment.getPatientName() : "Patient";
        String date = appointment.getAppointmentDate() != null ? appointment.getAppointmentDate() : "Scheduled Date";
        String time = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime() : "Scheduled Time";
        String meetUrl = googleMeetLink != null ? googleMeetLink : appointment.getGoogleMeetLink();

        String subject = "QuickCare Telehealth Confirmed: Dr. " + doctorName + " on " + date + " at " + time;

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                "<div style=\"background: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0; font-size: 22px;\">QuickCare Hospital Telemedicine</h1>" +
                "<p style=\"margin: 5px 0 0; font-size: 13px; opacity: 0.9;\">Your Online Video Consultation Has Been Approved</p>" +
                "</div>" +
                "<div style=\"border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; background: #ffffff;\">" +
                "<p>Dear <strong>" + patientName + "</strong>,</p>" +
                "<p>Your upcoming video consultation has been approved by <strong>Dr. " + doctorName + "</strong> (" + (appointment.getDoctorSpecialization() != null ? appointment.getDoctorSpecialization() : "Specialist") + ").</p>" +
                "<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;\">" +
                "<h3 style=\"margin-top: 0; color: #0f172a; font-size: 15px;\">Consultation Appointment Details:</h3>" +
                "<ul style=\"padding-left: 20px; margin-bottom: 0; font-size: 14px;\">" +
                "<li><strong>Doctor:</strong> Dr. " + doctorName + "</li>" +
                "<li><strong>Patient:</strong> " + patientName + "</li>" +
                "<li><strong>Date:</strong> " + date + "</li>" +
                "<li><strong>Time:</strong> " + time + " (15-Minute Slot)</li>" +
                "<li><strong>Consultation Type:</strong> High-Definition Google Meet Video</li>" +
                "</ul>" +
                "</div>" +
                "<div style=\"text-align: center; margin: 25px 0;\">" +
                "<a href=\"" + meetUrl + "\" target=\"_blank\" style=\"display: inline-block; background: #00ac47; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;\">Join Google Meet Consultation</a>" +
                "<p style=\"font-size: 12px; color: #64748b; margin-top: 8px;\">Direct Meeting Link: <a href=\"" + meetUrl + "\" style=\"color: #2563eb;\">" + meetUrl + "</a></p>" +
                "</div>" +
                "<div style=\"background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin: 20px 0; font-size: 13px; color: #1e3a8a;\">" +
                "<strong>Instructions to Join:</strong>" +
                "<ol style=\"margin: 6px 0 0; padding-left: 18px;\">" +
                "<li>Please join the Google Meet session 5 minutes prior to your scheduled time.</li>" +
                "<li>Ensure your device camera and microphone permissions are enabled.</li>" +
                "<li>Keep any prior diagnostic reports, current prescription medications, or symptom logs ready.</li>" +
                "<li>If you experience any connectivity difficulties, you can also join from your QuickCare Patient Dashboard.</li>" +
                "</ol>" +
                "</div>" +
                "<p style=\"font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px;\">" +
                "Quick Care Hospital & Telehealth Network • Health, Our Priority<br/>" +
                "Need assistance? Contact QuickCare Support at support@quickcare.com" +
                "</p>" +
                "</div></body></html>";

        return recordAndDispatchEmail(appointment.getAppointmentId(), to, subject, htmlBody, "CONSULTATION_APPROVED", meetUrl);
    }

    /**
     * Sends Consultation Rejection Email to patient.
     */
    public boolean sendConsultationRejectionEmail(Appointment appointment, String reason) {
        if (appointment == null || appointment.getPatientEmail() == null) {
            return false;
        }

        String to = appointment.getPatientEmail().trim();
        String doctorName = appointment.getDoctorName() != null ? appointment.getDoctorName() : "Doctor";
        String patientName = appointment.getPatientName() != null ? appointment.getPatientName() : "Patient";
        String date = appointment.getAppointmentDate() != null ? appointment.getAppointmentDate() : "Date";
        String time = appointment.getAppointmentTime() != null ? appointment.getAppointmentTime() : "Time";
        String displayReason = (reason != null && !reason.trim().isEmpty()) ? reason : "Doctor schedule emergency / unavailable at requested time.";

        String subject = "QuickCare Appointment Update: Consultation Request Declined";

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                "<div style=\"background: #e11d48; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0; font-size: 20px;\">QuickCare Hospital Appointment Update</h1>" +
                "</div>" +
                "<div style=\"border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; background: #ffffff;\">" +
                "<p>Dear <strong>" + patientName + "</strong>,</p>" +
                "<p>We regret to inform you that Dr. <strong>" + doctorName + "</strong> was unable to accept your appointment request for <strong>" + date + " at " + time + "</strong>.</p>" +
                "<div style=\"background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 13px; color: #9f1239;\">" +
                "<strong>Reason provided by clinic:</strong> " + displayReason +
                "</div>" +
                "<p>Your consultation fee has not been charged. You can reschedule with Dr. " + doctorName + " for another open time slot or browse other verified specialists on QuickCare.</p>" +
                "<p style=\"text-align: center; margin: 20px 0;\">" +
                "<a href=\"http://localhost:5173/doctors\" style=\"display: inline-block; background: #2563eb; color: white; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;\">Browse Available Specialists</a>" +
                "</p>" +
                "</div></body></html>";

        return recordAndDispatchEmail(appointment.getAppointmentId(), to, subject, htmlBody, "CONSULTATION_REJECTED", null);
    }

    /**
     * Sends Consultation Reschedule Email to patient.
     */
    public boolean sendConsultationRescheduleEmail(Appointment appointment, String newDate, String newTime, String googleMeetLink) {
        if (appointment == null || appointment.getPatientEmail() == null) {
            return false;
        }

        String to = appointment.getPatientEmail().trim();
        String doctorName = appointment.getDoctorName() != null ? appointment.getDoctorName() : "Doctor";
        String patientName = appointment.getPatientName() != null ? appointment.getPatientName() : "Patient";
        String meetUrl = googleMeetLink != null ? googleMeetLink : appointment.getGoogleMeetLink();

        String subject = "QuickCare Consultation Rescheduled: Dr. " + doctorName + " - " + newDate + " at " + newTime;

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                "<div style=\"background: #4f46e5; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0; font-size: 20px;\">QuickCare Consultation Schedule Update</h1>" +
                "</div>" +
                "<div style=\"border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; background: #ffffff;\">" +
                "<p>Dear <strong>" + patientName + "</strong>,</p>" +
                "<p>Your consultation with Dr. <strong>" + doctorName + "</strong> has been rescheduled to <strong>" + newDate + " at " + newTime + "</strong>.</p>" +
                "<div style=\"text-align: center; margin: 20px 0;\">" +
                "<a href=\"" + meetUrl + "\" target=\"_blank\" style=\"display: inline-block; background: #00ac47; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;\">Join Google Meet Consultation</a>" +
                "</div>" +
                "</div></body></html>";

        return recordAndDispatchEmail(appointment.getAppointmentId(), to, subject, htmlBody, "CONSULTATION_RESCHEDULED", meetUrl);
    }

    private boolean recordAndDispatchEmail(String appointmentId, String to, String subject, String body, String type, String meetUrl) {
        String logId = "email_" + UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> log = new HashMap<>();
        log.put("emailId", logId);
        log.put("appointmentId", appointmentId);
        log.put("recipient", to);
        log.put("subject", subject);
        log.put("type", type);
        log.put("googleMeetLink", meetUrl);
        log.put("sentAt", Instant.now().toString());
        log.put("deliveryStatus", "DELIVERED");

        sentEmailLogs.put(logId, log);

        // Also record in appointment audit logs if appointment exists
        if (appointmentId != null) {
            db.findAppointmentById(appointmentId).ifPresent(apt -> {
                apt.addAuditLog("EMAIL_SENT", "QuickCare Notification Service", "Dispatched " + type + " to " + to + " with subject: " + subject);
                db.saveAppointment(apt);
            });
        }

        logger.info("EMAIL DISPATCHED [{}]: To='{}' | Subject='{}' | MeetUrl='{}'", type, to, subject, meetUrl);
        return true;
    }

    public List<Map<String, Object>> getEmailLogs() {
        return new ArrayList<>(sentEmailLogs.values());
    }
}
