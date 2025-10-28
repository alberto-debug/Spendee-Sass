package com.alberto.Spendee.sass.repository;

import com.alberto.Spendee.sass.domain.goal.Goal;
import com.alberto.Spendee.sass.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    
    List<Goal> findByUserOrderByCreatedAtDesc(User user);
    
    List<Goal> findByUserAndCompletedOrderByCreatedAtDesc(User user, Boolean completed);
    
    long countByUserAndCompleted(User user, Boolean completed);
}

