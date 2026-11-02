package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.model.Appointment;
import com.quickcare.model.Patient;
import com.quickcare.model.Prescription;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Patient>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.getPatientByUid(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(patient));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Patient>> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                             @RequestBody Patient updated) {
        Patient patient = patientService.updatePatientProfile(principal.getUid(), updated);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", patient));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAppointments(@AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.getPatientByUid(principal.getUid());
        List<Appointment> list = patientService.getPatientAppointments(patient.getPatientId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/prescriptions")
    public ResponseEntity<ApiResponse<List<Prescription>>> getPrescriptions(@AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.getPatientByUid(principal.getUid());
        List<Prescription> list = patientService.getPatientPrescriptions(patient.getPatientId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
