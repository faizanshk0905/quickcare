package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.dto.AuthRequest;
import com.quickcare.dto.AuthResponse;
import com.quickcare.dto.RegisterRequest;
import com.quickcare.model.User;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

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
