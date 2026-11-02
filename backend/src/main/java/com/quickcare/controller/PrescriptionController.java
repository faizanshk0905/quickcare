package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.PrescriptionRequest;
import com.quickcare.model.Doctor;
import com.quickcare.model.Patient;
import com.quickcare.model.Prescription;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.DoctorService;
import com.quickcare.service.PatientService;
import com.quickcare.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    @Autowired
    private PrescriptionService prescriptionService;

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private PatientService patientService;

    @PostMapping
    public ResponseEntity<ApiResponse<Prescription>> createPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PrescriptionRequest req) {
        Prescription rx = prescriptionService.createPrescription(principal.getUid(), req);
        return ResponseEntity.ok(ApiResponse.ok("Prescription created and signed successfully", rx));
    }

    @GetMapping("/{prescriptionId}")
    public ResponseEntity<ApiResponse<Prescription>> getPrescription(@PathVariable String prescriptionId) {
        Prescription rx = prescriptionService.getPrescriptionById(prescriptionId);
        return ResponseEntity.ok(ApiResponse.ok(rx));
    }

    @GetMapping("/patient")
    public ResponseEntity<ApiResponse<List<Prescription>>> getPatientPrescriptions(
            @AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.getPatientByUid(principal.getUid());
        List<Prescription> list = prescriptionService.getPrescriptionsByPatient(patient.getPatientId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/doctor")
    public ResponseEntity<ApiResponse<List<Prescription>>> getDoctorPrescriptions(
            @AuthenticationPrincipal UserPrincipal principal) {
        Doctor doctor = doctorService.getDoctorByUid(principal.getUid());
        List<Prescription> list = prescriptionService.getPrescriptionsByDoctor(doctor.getDoctorId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
