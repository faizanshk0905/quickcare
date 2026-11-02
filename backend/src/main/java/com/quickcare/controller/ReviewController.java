package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.model.Review;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Reviews", description = "Doctor review and rating endpoints")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // ── Submit a review ────────────────────────────────────────────────────────

    @Operation(summary = "Submit a review for a completed appointment")
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<Review>> submitReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewRequest request) {

        Review review = reviewService.submitReview(
                principal.getUid(),
                request.appointmentId(),
                request.rating(),
                request.feedback()
        );
        return ResponseEntity.ok(ApiResponse.ok("Review submitted successfully", review));
    }

    // ── Get reviews for a doctor (public) ─────────────────────────────────────

    @Operation(summary = "Get all reviews for a doctor")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<Review>>> getDoctorReviews(@PathVariable String doctorId) {
        List<Review> reviews = reviewService.getDoctorReviews(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Doctor reviews retrieved", reviews));
    }

    // ── Get doctor rating summary (public) ─────────────────────────────────────

    @Operation(summary = "Get average rating and review count for a doctor")
    @GetMapping("/doctor/{doctorId}/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDoctorRatingSummary(@PathVariable String doctorId) {
        double avg = reviewService.getDoctorAverageRating(doctorId);
        int count = reviewService.getDoctorReviewCount(doctorId);
        return ResponseEntity.ok(ApiResponse.ok("Rating summary retrieved",
                Map.of("averageRating", avg, "totalReviews", count, "doctorId", doctorId)));
    }

    // ── Get reviews by patient ─────────────────────────────────────────────────

    @Operation(summary = "Get all reviews submitted by the logged-in patient")
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<List<Review>>> getMyReviews(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Review> reviews = reviewService.getPatientReviews(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("Your reviews retrieved", reviews));
    }

    // ── Admin: delete a review ─────────────────────────────────────────────────

    @Operation(summary = "Admin: Delete a review")
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable String reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok(ApiResponse.ok("Review deleted", null));
    }

    // ── Inner record: request body ─────────────────────────────────────────────

    public record ReviewRequest(
            @NotBlank String appointmentId,
            @Min(1) @Max(5) double rating,
            String feedback
    ) {}
}
