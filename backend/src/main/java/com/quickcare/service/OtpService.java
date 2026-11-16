package com.quickcare.service;

import com.quickcare.exception.BadRequestException;
import com.quickcare.model.User;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 45;
    private static final int MAX_ATTEMPTS = 5;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FirestoreDatabaseService db;

    private final SecureRandom secureRandom = new SecureRandom();

    public static class OtpRecord {
        private String email;
        private String saltHex;
        private String otpHash; // Salted SHA-256 hash. Plaintext OTP is NEVER stored.
        private Instant createdAt;
        private Instant expiresAt;
        private Instant lastSentAt;
        private int attempts;
        private boolean verified;
        private Instant verifiedAt;
        private String role;

        public OtpRecord(String email, String saltHex, String otpHash, String role) {
            this.email = email;
            this.saltHex = saltHex;
            this.otpHash = otpHash;
            this.role = role;
            this.createdAt = Instant.now();
            this.lastSentAt = this.createdAt;
            this.expiresAt = this.createdAt.plus(Duration.ofMinutes(OTP_EXPIRY_MINUTES));
            this.attempts = 0;
            this.verified = false;
        }

        public String getEmail() { return email; }
        public String getSaltHex() { return saltHex; }
        public String getOtpHash() { return otpHash; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
        public Instant getLastSentAt() { return lastSentAt; }
        public void setLastSentAt(Instant lastSentAt) { this.lastSentAt = lastSentAt; }
        public int getAttempts() { return attempts; }
        public void setAttempts(int attempts) { this.attempts = attempts; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public Instant getVerifiedAt() { return verifiedAt; }
        public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
        public String getRole() { return role; }
    }

    // In-memory store: normalized email -> OtpRecord
    private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();

    /**
     * Generates a cryptographically random 6-digit OTP, securely hashes it,
     * stores only the salted hash, and delivers the OTP to user's email.
     */
    public Map<String, Object> sendOtp(String email, String role, String fullName) {
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            throw new BadRequestException("Please provide a valid email address.");
        }

        String normEmail = email.trim().toLowerCase();
        OtpRecord existing = otpStore.get(normEmail);

        // Rate limit: check resend cooldown
        if (existing != null && existing.getLastSentAt() != null) {
            long elapsed = Duration.between(existing.getLastSentAt(), Instant.now()).getSeconds();
            if (elapsed < RESEND_COOLDOWN_SECONDS) {
                long waitTime = RESEND_COOLDOWN_SECONDS - elapsed;
                throw new BadRequestException("Please wait " + waitTime + " seconds before requesting another verification code.");
            }
        }

        // Generate cryptographic 6-digit OTP
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(codeInt);

        // Generate 16-byte salt
        byte[] salt = new byte[16];
        secureRandom.nextBytes(salt);
        String saltHex = HexFormat.of().formatHex(salt);

        // Hash OTP with salt using SHA-256
        String otpHash = hashOtp(otp, saltHex);

        OtpRecord record = new OtpRecord(normEmail, saltHex, otpHash, role != null ? role.toUpperCase() : "PATIENT");
        otpStore.put(normEmail, record);

        // Deliver email via EmailService
        boolean dispatched = emailService.sendOtpVerificationEmail(normEmail, otp, role, fullName);

        logger.info("Secure OTP generated and dispatched for email '{}' [Role: {}, Dispatched: {}]",
                normEmail, role, dispatched);

        Map<String, Object> response = new HashMap<>();
        response.put("email", normEmail);
        response.put("sent", dispatched);
        response.put("expiresInSeconds", OTP_EXPIRY_MINUTES * 60);
        response.put("resendCooldownSeconds", RESEND_COOLDOWN_SECONDS);
        response.put("message", "A 6-digit OTP verification code has been dispatched to " + normEmail);

        return response;
    }

    /**
     * Resends OTP, enforcing rate limiting.
     */
    public Map<String, Object> resendOtp(String email, String role, String fullName) {
        return sendOtp(email, role, fullName);
    }

    /**
     * Verifies the 6-digit OTP against the stored salted hash using constant-time comparison.
     */
    public boolean verifyOtp(String email, String otp) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email address is required.");
        }
        if (otp == null || otp.trim().length() != 6) {
            throw new BadRequestException("OTP must be exactly 6 numeric digits.");
        }

        String normEmail = email.trim().toLowerCase();
        String cleanOtp = otp.trim();

        OtpRecord record = otpStore.get(normEmail);
        if (record == null) {
            throw new BadRequestException("No active OTP request found for " + normEmail + ". Please request a verification code.");
        }

        // Check expiration (5 minutes)
        if (Instant.now().isAfter(record.getExpiresAt())) {
            otpStore.remove(normEmail);
            throw new BadRequestException("This verification code has expired (valid for 5 minutes). Please request a new OTP.");
        }

        // Check attempts limit
        if (record.getAttempts() >= MAX_ATTEMPTS) {
            otpStore.remove(normEmail);
            throw new BadRequestException("Maximum verification attempts exceeded. For your security, please request a new OTP.");
        }

        // Hash candidate OTP with stored salt
        String candidateHash = hashOtp(cleanOtp, record.getSaltHex());

        // Constant-time comparison
        boolean matches = MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                record.getOtpHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            record.setAttempts(record.getAttempts() + 1);
            int remaining = MAX_ATTEMPTS - record.getAttempts();
            if (remaining <= 0) {
                otpStore.remove(normEmail);
                throw new BadRequestException("Incorrect OTP. Maximum attempts reached. Please request a new code.");
            }
            throw new BadRequestException("Incorrect OTP code. " + remaining + " attempt" + (remaining > 1 ? "s" : "") + " remaining.");
        }

        // Success: mark email as verified
        record.setVerified(true);
        record.setVerifiedAt(Instant.now());

        // Also if user already exists in DB, update their emailVerified status
        Optional<User> existingUser = db.findUserByEmail(normEmail);
        existingUser.ifPresent(u -> {
            u.setEmailVerified(true);
            db.saveUser(u);
        });

        logger.info("Email verification successful for '{}'", normEmail);
        return true;
    }

    /**
     * Checks whether an email address has successfully passed OTP verification.
     */
    public boolean isEmailVerified(String email) {
        if (email == null) return false;
        String normEmail = email.trim().toLowerCase();

        OtpRecord record = otpStore.get(normEmail);
        if (record != null && record.isVerified() && record.getVerifiedAt() != null) {
            // Valid if verified within the last 2 hours
            long hours = Duration.between(record.getVerifiedAt(), Instant.now()).toHours();
            if (hours < 2) {
                return true;
            }
        }

        // Check persistent user database
        Optional<User> userOpt = db.findUserByEmail(normEmail);
        return userOpt.isPresent() && userOpt.get().isEmailVerified();
    }

    /**
     * Manually mark an email as verified (e.g. for existing verified accounts or tests).
     */
    public void markEmailVerified(String email) {
        if (email == null) return;
        String normEmail = email.trim().toLowerCase();
        OtpRecord record = otpStore.computeIfAbsent(normEmail, e -> new OtpRecord(e, "manual", "manual", "PATIENT"));
        record.setVerified(true);
        record.setVerifiedAt(Instant.now());
    }

    private String hashOtp(String otp, String saltHex) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            String input = otp + ":" + saltHex;
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
