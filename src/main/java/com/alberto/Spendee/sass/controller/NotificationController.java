package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.NotificationDto;
import com.alberto.Spendee.sass.dto.ResponseDTO;
import com.alberto.Spendee.sass.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getUserNotifications() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NotificationDto> notifications = notificationService.getUserNotifications(userEmail);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<NotificationDto> notifications = notificationService.getUnreadNotifications(userEmail);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadNotificationCount() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        Long count = notificationService.getUnreadNotificationCount(userEmail);
        return ResponseEntity.ok(count);
    }

    @PostMapping("/{notificationId}/mark-read")
    public ResponseEntity<ResponseDTO<String>> markNotificationAsRead(@PathVariable Long notificationId) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            notificationService.markNotificationAsRead(notificationId, userEmail);
            return ResponseEntity.ok(new ResponseDTO<>("Notification marked as read", null, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseDTO<>(e.getMessage(), null, false));
        }
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<ResponseDTO<String>> markAllNotificationsAsRead() {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            notificationService.markAllNotificationsAsRead(userEmail);
            return ResponseEntity.ok(new ResponseDTO<>("All notifications marked as read", null, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseDTO<>(e.getMessage(), null, false));
        }
    }
}
