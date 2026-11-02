package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.AvailabilityUpdateRequest;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.DoctorAvailability;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Doctor>>> searchDoctors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) Double maxFee) {
        List<Doctor> list = doctorService.searchDoctors(query, specialization, minExperience, maxFee);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<ApiResponse<Doctor>> getDoctor(@PathVariable String doctorId) {
        Doctor doctor = doctorService.getDoctorById(doctorId);
        return ResponseEntity.ok(ApiResponse.ok(doctor));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Doctor>> getMyDoctorProfile(@AuthenticationPrincipal UserPrincipal principal) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(doctor));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Doctor>> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                             @RequestBody Doctor updated) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        Doctor saved = doctorService.updateDoctorProfile(doctor.getDoctorId(), updated);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", saved));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<Appointment>>> getDoctorAppointments(@AuthenticationPrincipal UserPrincipal principal) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        List<Appointment> list = doctorService.getDoctorAppointments(doctor.getDoctorId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{doctorId}/availability")
    public ResponseEntity<ApiResponse<DoctorAvailability>> getAvailability(
            @PathVariable String doctorId,
            @RequestParam String date) {
        DoctorAvailability da = doctorService.getOrCreateAvailability(doctorId, date);
        return ResponseEntity.ok(ApiResponse.ok(da));
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse<DoctorAvailability>> updateAvailability(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AvailabilityUpdateRequest req) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        req.setDoctorId(doctor.getDoctorId());
        DoctorAvailability updated = doctorService.updateAvailability(req);
        return ResponseEntity.ok(ApiResponse.ok("Availability updated successfully", updated));
    }
}
