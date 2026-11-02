package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.DashboardStatsDto;
import com.quickcare.model.Appointment;
import com.quickcare.model.Doctor;
import com.quickcare.model.Patient;
import com.quickcare.model.User;
import com.quickcare.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getDashboardStats() {
        DashboardStatsDto stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok("Admin statistics retrieved", stats));
    }

    @GetMapping("/doctors")
    public ResponseEntity<ApiResponse<List<Doctor>>> getAllDoctors() {
        List<Doctor> list = adminService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/patients")
    public ResponseEntity<ApiResponse<List<Patient>>> getAllPatients() {
        List<Patient> list = adminService.getAllPatients();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse<List<Appointment>>> getAllAppointments() {
        List<Appointment> list = adminService.getAllAppointments();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/doctors/{doctorId}/verify")
    public ResponseEntity<ApiResponse<Doctor>> verifyDoctor(
            @PathVariable String doctorId,
            @RequestBody Map<String, Object> body) {
        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        String feedback = (String) body.get("feedback");
        Doctor doctor = adminService.verifyDoctor(doctorId, approve, feedback);
        return ResponseEntity.ok(ApiResponse.ok("Doctor verification status updated", doctor));
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        User user = adminService.updateUserStatus(userId, status);
        return ResponseEntity.ok(ApiResponse.ok("User status updated to " + status, user));
    }
}
