package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.AppointmentRequest;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.Patient;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.AppointmentService;
import com.quickcare.service.DoctorService;
import com.quickcare.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private PatientService patientService;

    @Autowired
    private DoctorService doctorService;

    @PostMapping
    public ResponseEntity<ApiResponse<Appointment>> bookAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AppointmentRequest req) {
        Appointment apt = appointmentService.bookAppointment(principal.getUid(), req);
        return ResponseEntity.ok(ApiResponse.ok("Appointment requested successfully", apt));
    }

    @GetMapping("/{appointmentId}")
    public ResponseEntity<ApiResponse<Appointment>> getAppointment(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Appointment apt = appointmentService.getAppointmentById(appointmentId);
        boolean isDoctorOrAdmin = principal != null && (
            "DOCTOR".equalsIgnoreCase(principal.getRole()) ||
            "ADMIN".equalsIgnoreCase(principal.getRole()) ||
            (principal.getUid() != null && principal.getUid().equals(apt.getDoctorUid())) ||
            "admin".equalsIgnoreCase(principal.getUid())
        );
        if ("VIDEO".equalsIgnoreCase(apt.getConsultationType()) && !apt.isVideoLinkSent() && !isDoctorOrAdmin) {
            apt.setGoogleMeetLink(null);
            apt.setVideoConsultationLink(null);
            apt.setMeetingRoomId(null);
        }
        return ResponseEntity.ok(ApiResponse.ok(apt));
    }

    @GetMapping("/patient")
    public ResponseEntity<ApiResponse<List<Appointment>>> getPatientAppointments(
            @AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.getPatientByUid(principal.getUid());
        List<Appointment> list = appointmentService.getAppointmentsForPatient(patient.getPatientId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/doctor")
    public ResponseEntity<ApiResponse<List<Appointment>>> getDoctorAppointments(
            @AuthenticationPrincipal UserPrincipal principal) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        List<Appointment> list = appointmentService.getAppointmentsForDoctor(doctor.getDoctorId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/{appointmentId}/status")
    public ResponseEntity<ApiResponse<Appointment>> updateStatus(
            @PathVariable String appointmentId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String reason = body.get("reason");
        Appointment updated = appointmentService.updateStatus(appointmentId, status, reason);
        return ResponseEntity.ok(ApiResponse.ok("Appointment status updated to " + status, updated));
    }

    @PostMapping("/{appointmentId}/approve")
    public ResponseEntity<ApiResponse<Appointment>> approveAppointment(
            @PathVariable String appointmentId,
            @RequestBody(required = false) Map<String, String> body) {
        String newDate = body != null ? body.get("date") : null;
        String newTime = body != null ? body.get("time") : null;
        String notes = body != null ? body.get("notes") : null;
        Appointment updated = appointmentService.approveAndScheduleGoogleMeet(appointmentId, newDate, newTime, notes);
        return ResponseEntity.ok(ApiResponse.ok("Video consultation approved. Google Meet link generated and dispatched to patient.", updated));
    }

    @PostMapping("/{appointmentId}/reject")
    public ResponseEntity<ApiResponse<Appointment>> rejectAppointment(
            @PathVariable String appointmentId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Doctor unavailable at requested time.";
        Appointment updated = appointmentService.updateStatus(appointmentId, "REJECTED", reason);
        return ResponseEntity.ok(ApiResponse.ok("Appointment request declined. Patient notified via in-app alert and email.", updated));
    }

    @GetMapping("/{appointmentId}/google-meet")
    public ResponseEntity<ApiResponse<Map<String, String>>> getGoogleMeetDetails(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Appointment apt = appointmentService.getAppointmentById(appointmentId);
        boolean isDoctorOrAdmin = principal != null && (
            "DOCTOR".equalsIgnoreCase(principal.getRole()) ||
            "ADMIN".equalsIgnoreCase(principal.getRole()) ||
            (principal.getUid() != null && principal.getUid().equals(apt.getDoctorUid())) ||
            "admin".equalsIgnoreCase(principal.getUid())
        );

        Map<String, String> details = new HashMap<>();
        details.put("appointmentId", apt.getAppointmentId());
        details.put("doctorName", apt.getDoctorName());
        details.put("patientName", apt.getPatientName());
        details.put("patientEmail", apt.getPatientEmail());
        details.put("appointmentDate", apt.getAppointmentDate());
        details.put("appointmentTime", apt.getAppointmentTime());
        details.put("status", apt.getStatus());
        details.put("videoConsultationStatus", apt.getVideoConsultationStatus());
        details.put("videoLinkSent", String.valueOf(apt.isVideoLinkSent()));

        if ("VIDEO".equalsIgnoreCase(apt.getConsultationType()) && !apt.isVideoLinkSent() && !isDoctorOrAdmin) {
            // Patient cannot see the meeting link before doctor sends it
            details.put("googleMeetLink", null);
            details.put("videoConsultationLink", null);
            details.put("message", "Waiting for Doctor to Send Link");
        } else {
            String meetLink = apt.getVideoConsultationLink();
            if (meetLink == null || meetLink.isEmpty()) {
                meetLink = apt.getGoogleMeetLink();
            }
            if (meetLink == null || meetLink.isEmpty()) {
                meetLink = apt.getMeetingRoomId();
            }
            details.put("googleMeetLink", meetLink);
            details.put("videoConsultationLink", meetLink);
        }
        return ResponseEntity.ok(ApiResponse.ok(details));
    }

    @PostMapping("/{appointmentId}/send-video-link")
    public ResponseEntity<ApiResponse<Appointment>> sendVideoConsultationLink(
            @PathVariable String appointmentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String videoLink = body != null ? body.get("videoConsultationLink") : null;
        if (videoLink == null || videoLink.trim().isEmpty()) {
            videoLink = body != null ? body.get("videoLink") : null;
        }
        if (videoLink == null || videoLink.trim().isEmpty()) {
            videoLink = body != null ? body.get("googleMeetLink") : null;
        }
        Appointment updated = appointmentService.sendDoctorVideoConsultationLink(
                appointmentId, videoLink, principal != null ? principal.getUid() : null);
        return ResponseEntity.ok(ApiResponse.ok("Video consultation link sent to patient registered email successfully", updated));
    }

    @PutMapping("/{appointmentId}/meeting-link")
    public ResponseEntity<ApiResponse<Appointment>> updateMeetingLink(
            @PathVariable String appointmentId,
            @RequestBody Map<String, String> body) {
        String link = body != null ? body.get("googleMeetLink") : null;
        Appointment updated = appointmentService.updateMeetingLink(appointmentId, link);
        return ResponseEntity.ok(ApiResponse.ok("Meeting link updated successfully", updated));
    }

    @PutMapping("/{appointmentId}/reschedule")
    public ResponseEntity<ApiResponse<Appointment>> reschedule(
            @PathVariable String appointmentId,
            @RequestBody Map<String, String> body) {
        String newDate = body.get("date");
        String newTime = body.get("time");
        Appointment updated = appointmentService.reschedule(appointmentId, newDate, newTime);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully", updated));
    }

    @PostMapping("/{appointmentId}/check-in")
    public ResponseEntity<ApiResponse<Appointment>> checkInPatient(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Appointment apt = appointmentService.checkInPatient(appointmentId, principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("Checked into waiting room successfully", apt));
    }

    @PostMapping("/{appointmentId}/admit")
    public ResponseEntity<ApiResponse<Appointment>> admitPatient(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Appointment apt = appointmentService.admitPatient(appointmentId, principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("Patient admitted to consultation", apt));
    }

    @GetMapping("/{appointmentId}/waiting-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWaitingRoomStatus(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> status = appointmentService.getWaitingRoomStatus(appointmentId, principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/doctor/waiting-queue")
    public ResponseEntity<ApiResponse<List<Appointment>>> getDoctorWaitingQueue(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Appointment> queue = appointmentService.getWaitingQueueForDoctor(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(queue));
    }

    @PostMapping("/{appointmentId}/confirm-availability")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmAvailability(
            @PathVariable String appointmentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        String response = body.get("response");
        Map<String, Object> result = appointmentService.confirmAvailability(appointmentId, principal.getUid(), response);
        return ResponseEntity.ok(ApiResponse.ok((String) result.get("message"), result));
    }

    @PostMapping("/{appointmentId}/admin/release-slot")
    public ResponseEntity<ApiResponse<Appointment>> adminReleaseSlot(
            @PathVariable String appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        Appointment apt = appointmentService.adminReleaseSlot(appointmentId, principal.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Appointment slot released successfully by Administrator", apt));
    }

    @GetMapping("/admin/confirmations")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAdminConfirmations(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Appointment> list = appointmentService.getAllConfirmations();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{appointmentId}/audit-logs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAuditLogs(
            @PathVariable String appointmentId) {
        Appointment apt = appointmentService.getAppointmentById(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok(apt.getAuditLogs()));
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<ApiResponse<Appointment>> cancelAppointment(
            @PathVariable String appointmentId,
            @RequestParam(required = false) String reason) {
        Appointment cancelled = appointmentService.updateStatus(appointmentId, "CANCELLED", reason);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled", cancelled));
    }
}
