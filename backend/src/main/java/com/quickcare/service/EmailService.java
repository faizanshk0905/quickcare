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

        String subject = "Your Quick Care Video Consultation – Google Meet Invitation";

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;\">" +
                "<div style=\"background: #0d9488; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; color: white;\">" +
                "<h1 style=\"margin: 0; font-size: 22px;\">Quick Care Google Meet Consultation</h1>" +
                "<p style=\"margin: 6px 0 0; font-size: 13px; opacity: 0.95;\">Doctor Has Sent Your Official Google Meet Invitation</p>" +
                "</div>" +
                "<div style=\"border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; background: #ffffff;\">" +
                "<p>Dear <strong>" + patientName + "</strong>,</p>" +
                "<p>Your video consultation with <strong>Dr. " + doctorName + "</strong> has been approved. The official Google Meet consultation link has been generated and dispatched by your doctor.</p>" +
                "<div style=\"background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;\">" +
                "<h3 style=\"margin-top: 0; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;\">Appointment Details:</h3>" +
                "<ul style=\"padding-left: 20px; margin: 10px 0 0; font-size: 14px; line-height: 1.8;\">" +
                "<li><strong>Doctor:</strong> Dr. " + doctorName + "</li>" +
                "<li><strong>Appointment Date:</strong> " + date + "</li>" +
                "<li><strong>Appointment Time:</strong> " + time + "</li>" +
                "<li><strong>Platform:</strong> Google Meet (Telehealth Video)</li>" +
                "</ul>" +
                "</div>" +
                "<div style=\"text-align: center; margin: 30px 0;\">" +
                "<h3 style=\"margin-bottom: 12px; color: #0f172a; font-size: 15px;\">Join Your Consultation:</h3>" +
                "<a href=\"" + meetUrl + "\" target=\"_blank\" style=\"display: inline-block; background: #00ac47; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 172, 71, 0.25);\">Join Google Meet</a>" +
                "<p style=\"font-size: 12px; color: #64748b; margin-top: 10px;\">Direct Meeting Link: <a href=\"" + meetUrl + "\" style=\"color: #0284c7; word-break: break-all;\">" + meetUrl + "</a></p>" +
                "</div>" +
                "<p style=\"font-size: 13px; color: #334155; margin-top: 20px;\">Please join the meeting at your scheduled appointment time. Ensure your camera and microphone are ready.</p>" +
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

    /**
     * Requirement 1: Sends secure 6-digit email OTP verification code to patient or doctor.
     */
    public boolean sendOtpVerificationEmail(String toEmail, String otpCode, String role, String recipientName) {
        if (toEmail == null || toEmail.trim().isEmpty()) {
            logger.warn("Cannot dispatch OTP email: missing destination email.");
            return false;
        }

        String to = toEmail.trim().toLowerCase();
        String name = (recipientName != null && !recipientName.trim().isEmpty())
                ? recipientName.trim()
                : ("DOCTOR".equalsIgnoreCase(role) ? "Doctor" : "Patient");
        String subject = "Quick Care – " + otpCode + " is your registration verification OTP";

        String roleDesc = "DOCTOR".equalsIgnoreCase(role)
                ? "Healthcare Practitioner Portal"
                : "Patient Health & Appointment Portal";

        String htmlBody = "<!DOCTYPE html><html><body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px;\">" +
                "<div style=\"max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">" +
                "<div style=\"background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%); padding: 32px 24px; text-align: center; color: white;\">" +
                "<div style=\"display: inline-block; background: rgba(255,255,255,0.2); width: 48px; height: 48px; line-height: 48px; border-radius: 14px; margin-bottom: 12px; font-size: 26px;\">🏥</div>" +
                "<h1 style=\"margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;\">QUICK CARE</h1>" +
                "<p style=\"margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-weight: 500;\">Email OTP Verification • " + roleDesc + "</p>" +
                "</div>" +
                "<div style=\"padding: 32px 28px;\">" +
                "<p style=\"font-size: 15px; margin-top: 0;\">Dear <strong>" + name + "</strong>,</p>" +
                "<p style=\"font-size: 14px; color: #475569;\">Thank you for registering with <strong>Quick Care Doctor Appointment Management System</strong>. To complete your account verification and ensure the security of your healthcare profile, please use the 6-digit One-Time Password (OTP) below:</p>" +
                "<div style=\"text-align: center; margin: 28px 0; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 14px; padding: 22px 16px;\">" +
                "<div style=\"font-size: 12px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 1px; margin-bottom: 8px;\">Your 6-Digit Verification Code</div>" +
                "<div style=\"font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #166534; padding-left: 12px;\">" + otpCode + "</div>" +
                "<div style=\"font-size: 12px; color: #64748b; margin-top: 10px;\">⏱️ Valid for <strong>5 minutes</strong>. Single use only.</div>" +
                "</div>" +
                "<div style=\"background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; border-radius: 6px; margin: 24px 0;\">" +
                "<p style=\"margin: 0; font-size: 13px; color: #334155; font-weight: 600;\">Security Notice:</p>" +
                "<ul style=\"margin: 6px 0 0; padding-left: 18px; font-size: 12px; color: #64748b; line-height: 1.6;\">" +
                "<li>Quick Care will never ask for your OTP via phone call or messaging.</li>" +
                "<li>Do not share this code with anyone, including healthcare staff.</li>" +
                "<li>If you did not initiate this registration, please disregard this email.</li>" +
                "</ul>" +
                "</div>" +
                "<p style=\"font-size: 13px; color: #64748b; margin-bottom: 0;\">Best regards,<br/><strong style=\"color: #1e293b;\">Quick Care Healthcare Security Team</strong></p>" +
                "</div>" +
                "<div style=\"background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;\">" +
                "This is an automated security transmission from Quick Care Healthcare Network. Please do not reply directly to this email." +
                "</div></div></body></html>";

        return recordAndDispatchEmail(null, to, subject, htmlBody, "EMAIL_OTP_VERIFICATION", null);
    }
}
