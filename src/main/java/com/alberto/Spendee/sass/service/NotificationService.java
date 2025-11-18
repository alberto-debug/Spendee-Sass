package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.notification.Notification;
import com.alberto.Spendee.sass.domain.notification.NotificationType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.NotificationDto;
import com.alberto.Spendee.sass.repository.NotificationRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    public void createNotification(String userEmail, String title, String message, NotificationType type) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }

    public void createSpendingLimitNotification(String userEmail, String categoryName, 
                                              String limitAmount, String currentSpent, 
                                              boolean isExceeded) {
        String title;
        String message;
        NotificationType type;

        if (isExceeded) {
            title = "Spending Limit Exceeded!";
            message = String.format("You've exceeded your spending limit for %s. " +
                    "Limit: %s, Current spending: %s", 
                    categoryName != null ? categoryName : "total spending", 
                    limitAmount, currentSpent);
            type = NotificationType.SPENDING_LIMIT_EXCEEDED;
        } else {
            title = "Spending Limit Warning";
            message = String.format("You're approaching your spending limit for %s. " +
                    "Limit: %s, Current spending: %s", 
                    categoryName != null ? categoryName : "total spending", 
                    limitAmount, currentSpent);
            type = NotificationType.SPENDING_LIMIT_WARNING;
        }

        createNotification(userEmail, title, message, type);
    }

    public List<NotificationDto> getUserNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NotificationDto> getUnreadNotifications(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Long getUnreadNotificationCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return notificationRepository.countUnreadNotificationsByUser(user);
    }

    public void markNotificationAsRead(Long notificationId, String userEmail) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void markAllNotificationsAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Notification> unreadNotifications = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    private NotificationDto convertToDto(Notification notification) {
        NotificationDto dto = new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getIsRead(),
                notification.getCreatedAt()
        );
        dto.setRelatedEntityId(notification.getRelatedEntityId());
        dto.setRelatedEntityType(notification.getRelatedEntityType());
        return dto;
    }
}
