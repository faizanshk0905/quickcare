package com.quickcare.service;

import com.quickcare.model.Notification;
import com.quickcare.repository.FirestoreDatabaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private FirestoreDatabaseService db;

    public Notification sendNotification(String userId, String title, String message, String type, String referenceId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setRead(false);

        db.saveNotification(notification);
        logger.info("Notification dispatched to [{}]: {} - {}", userId, title, message);
        return notification;
    }

    public List<Notification> getNotificationsForUser(String userId) {
        return db.findNotificationsByUserId(userId);
    }

    public Notification markAsRead(String notificationId) {
        Optional<Notification> notifOpt = db.findNotificationById(notificationId);
        if (notifOpt.isPresent()) {
            Notification n = notifOpt.get();
            n.setRead(true);
            return db.saveNotification(n);
        }
        return null;
    }

    public void markAllAsRead(String userId) {
        List<Notification> list = db.findNotificationsByUserId(userId);
        for (Notification n : list) {
            n.setRead(true);
            db.saveNotification(n);
        }
    }

    public long getUnreadCount(String userId) {
        return db.findNotificationsByUserId(userId).stream()
                .filter(n -> !n.isRead())
                .count();
    }
}
