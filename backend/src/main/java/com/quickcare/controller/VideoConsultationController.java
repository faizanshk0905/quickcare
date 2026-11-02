package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.model.VideoConsultation;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.VideoConsultationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultations")
public class VideoConsultationController {

    @Autowired
    private VideoConsultationService consultationService;

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ApiResponse<VideoConsultation>> getByAppointment(@PathVariable String appointmentId) {
        VideoConsultation vc = consultationService.getConsultationByAppointment(appointmentId);
        return ResponseEntity.ok(ApiResponse.ok(vc));
    }

    @PostMapping("/{consultationId}/join")
    public ResponseEntity<ApiResponse<VideoConsultation>> joinConsultation(
            @PathVariable String consultationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        VideoConsultation vc = consultationService.authorizeAndJoin(consultationId, principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("Authorized to enter consultation room", vc));
    }

    @PutMapping("/{consultationId}/end")
    public ResponseEntity<ApiResponse<VideoConsultation>> endConsultation(
            @PathVariable String consultationId,
            @AuthenticationPrincipal UserPrincipal principal) {
        VideoConsultation vc = consultationService.endConsultation(consultationId, principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("Consultation session concluded", vc));
    }
}
