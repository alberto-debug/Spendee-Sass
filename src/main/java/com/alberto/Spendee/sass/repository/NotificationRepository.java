package com.alberto.Spendee.sass.repository;

import com.alberto.Spendee.sass.domain.notification.Notification;
import com.alberto.Spendee.sass.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    Long countUnreadNotificationsByUser(@Param("user") User user);
    
    @Query("SELECT n FROM Notification n WHERE n.user = :user ORDER BY n.createdAt DESC LIMIT :limit")
    List<Notification> findRecentNotificationsByUser(@Param("user") User user, @Param("limit") int limit);
}
