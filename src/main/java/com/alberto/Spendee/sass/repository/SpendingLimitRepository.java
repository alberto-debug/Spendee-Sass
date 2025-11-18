package com.alberto.Spendee.sass.repository;

import com.alberto.Spendee.sass.domain.spendinglimit.SpendingLimit;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.domain.transaction.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpendingLimitRepository extends JpaRepository<SpendingLimit, Long> {
    
    List<SpendingLimit> findByUserAndIsActiveTrue(User user);
    
    Optional<SpendingLimit> findByUserAndCategoryAndIsActiveTrue(User user, Category category);
    
    @Query("SELECT sl FROM SpendingLimit sl WHERE sl.user = :user AND sl.category IS NULL AND sl.isActive = true")
    Optional<SpendingLimit> findGlobalLimitByUser(@Param("user") User user);
    
    @Query("SELECT sl FROM SpendingLimit sl WHERE sl.isActive = true AND sl.currentSpent >= (sl.limitAmount * sl.notificationThreshold)")
    List<SpendingLimit> findLimitsNearThreshold();
    
    @Query("SELECT sl FROM SpendingLimit sl WHERE sl.isActive = true AND sl.currentSpent >= sl.limitAmount")
    List<SpendingLimit> findExceededLimits();
}
