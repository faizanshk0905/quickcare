package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.AuthRequest;
import com.quickcare.dto.AuthResponse;
import com.quickcare.dto.RegisterRequest;
import com.quickcare.model.User;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.AuthService;
import com.quickcare.service.CertificateStorageService;
import com.quickcare.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private CertificateStorageService certificateStorageService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /**
     * Requirement 1: Send a 6-digit OTP to the patient's or doctor's email.
     */
    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String role = body != null ? body.get("role") : "PATIENT";
        String fullName = body != null ? body.get("fullName") : null;
        Map<String, Object> result = otpService.sendOtp(email, role, fullName);
        return ResponseEntity.ok(ApiResponse.ok("Verification OTP sent to " + email, result));
    }

    /**
     * Requirement 1: Verify the 6-digit OTP entered by the user.
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String otp = body != null ? body.get("otp") : null;
        boolean verified = otpService.verifyOtp(email, otp);
        Map<String, Object> res = Map.of(
                "email", email != null ? email.trim().toLowerCase() : "",
                "emailVerified", verified,
                "verifiedAt", java.time.Instant.now().toString()
        );
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully! You can now proceed with registration.", res));
    }

    /**
     * Requirement 1: Resend OTP with rate limiting.
     */
    @PostMapping("/otp/resend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String role = body != null ? body.get("role") : "PATIENT";
        String fullName = body != null ? body.get("fullName") : null;
        Map<String, Object> result = otpService.resendOtp(email, role, fullName);
        return ResponseEntity.ok(ApiResponse.ok("A fresh 6-digit verification code has been sent.", result));
    }

    /**
     * Requirement 3: Doctor Qualification Certificate upload during registration.
     * Supports standard Multipart file upload.
     */
    @PostMapping(value = "/upload-certificate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadCertificateMultipart(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "doctorUid", required = false) String doctorUid) {
        Map<String, Object> result = certificateStorageService.storeCertificate(file, doctorUid);
        return ResponseEntity.ok(ApiResponse.ok("Medical qualification certificate uploaded successfully.", result));
    }

    /**
     * Requirement 3: Doctor Qualification Certificate upload via JSON / Base64.
     */
    @PostMapping(value = "/upload-certificate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadCertificateJson(
            @RequestBody Map<String, String> body) {
        String base64Data = body.get("data");
        String filename = body.get("fileName");
        String contentType = body.get("contentType");
        String doctorUid = body.get("doctorUid");
        Map<String, Object> result = certificateStorageService.storeCertificateBase64(base64Data, filename, contentType, doctorUid);
        return ResponseEntity.ok(ApiResponse.ok("Medical qualification certificate uploaded successfully.", result));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthenticated"));
        }
        User user = authService.getProfile(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved", user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            newPassword = "Pass" + UUID_SIMPLE();
        }
        authService.updatePassword(email, newPassword);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. New temporary password: " + newPassword, newPassword));
    }

    private String UUID_SIMPLE() {
        return String.valueOf((int) (Math.random() * 900000 + 100000));
    }
}
