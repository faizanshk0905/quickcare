package com.quickcare.service;

import com.quickcare.exception.BadRequestException;
import com.quickcare.exception.ResourceNotFoundException;
import com.quickcare.model.Appointment;
import com.quickcare.model.Patient;
import com.quickcare.model.Review;
import com.quickcare.repository.FirestoreDatabaseService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ReviewService {

    private final FirestoreDatabaseService db;

    public ReviewService(FirestoreDatabaseService db) {
        this.db = db;
    }

    /**
     * Submit a review for a completed appointment.
     * One review per appointment; patient must be owner.
     */
    public Review submitReview(String patientUid, String appointmentId,
                               double rating, String feedback) {
        // Validate rating
        if (rating < 1.0 || rating > 5.0) {
            throw new BadRequestException("Rating must be between 1.0 and 5.0");
        }

        // Load appointment
        Appointment appointment = db.findAppointmentById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found: " + appointmentId));

        // Find patient
        Patient patient = db.findPatientByUid(patientUid).orElse(null);

        // Check ownership
        boolean isOwner = (patient != null && patient.getPatientId() != null && patient.getPatientId().equals(appointment.getPatientId()))
                || patientUid.equals(appointment.getPatientUid());
        if (!isOwner) {
            throw new BadRequestException("You can only review your own appointments");
        }

        // Only completed appointments can be reviewed
        if (!"COMPLETED".equalsIgnoreCase(appointment.getStatus())) {
            throw new BadRequestException("You can only review completed appointments");
        }

        // Check for duplicate review
        List<Review> existing = db.findReviewsByAppointmentId(appointmentId);
        if (!existing.isEmpty()) {
            throw new BadRequestException("You have already submitted a review for this appointment");
        }

        // Build review
        Review review = new Review();
        review.setReviewId("rev_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10));
        review.setAppointmentId(appointmentId);
        review.setPatientId(patient != null ? patient.getPatientId() : patientUid);
        review.setPatientName(appointment.getPatientName());
        review.setDoctorId(appointment.getDoctorId());
        review.setRating(rating);
        review.setFeedback(feedback != null ? feedback.trim() : "");
        review.setCreatedAt(Instant.now());

        db.saveReview(review);

        // Update doctor's average rating in their profile
        updateDoctorRating(appointment.getDoctorId());

        return review;
    }

    /**
     * Get all reviews for a specific doctor.
     */
    public List<Review> getDoctorReviews(String doctorId) {
        return db.findReviewsByDoctorId(doctorId);
    }

    /**
     * Get the average rating for a doctor.
     */
    public double getDoctorAverageRating(String doctorId) {
        List<Review> reviews = db.findReviewsByDoctorId(doctorId);
        if (reviews.isEmpty()) return 0.0;
        return reviews.stream()
                .mapToDouble(r -> r.getRating())
                .average()
                .orElse(0.0);
    }

    /**
     * Get review count for a doctor.
     */
    public int getDoctorReviewCount(String doctorId) {
        return db.findReviewsByDoctorId(doctorId).size();
    }

    /**
     * Get all reviews submitted by a patient.
     */
    public List<Review> getPatientReviews(String patientUid) {
        Patient patient = db.findPatientByUid(patientUid).orElse(null);
        String patientId = patient != null ? patient.getPatientId() : patientUid;
        return db.findReviewsByPatientId(patientId);
    }

    /**
     * Admin: delete a review (e.g., abusive content).
     */
    public void deleteReview(String reviewId) {
        Review review = db.findReviewById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found: " + reviewId));
        db.deleteReview(reviewId);
        updateDoctorRating(review.getDoctorId());
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    private void updateDoctorRating(String doctorId) {
        double avgRating = Math.round(getDoctorAverageRating(doctorId) * 10.0) / 10.0;
        int totalReviews = getDoctorReviewCount(doctorId);
        db.updateDoctorRatingStats(doctorId, avgRating, totalReviews);
    }
}
