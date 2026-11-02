package com.quickcare.controller;

import com.quickcare.dto.ApiResponse;
import com.quickcare.model.Notification;
import com.quickcare.security.UserPrincipal;
import com.quickcare.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> list = notificationService.getNotificationsForUser(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable String notificationId) {
        Notification n = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.ok("Marked as read", n));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read", "Success"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal.getUid());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("unreadCount", count)));
    }
}
