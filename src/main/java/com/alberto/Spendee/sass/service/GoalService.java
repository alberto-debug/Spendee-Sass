package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.goal.Goal;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.CreateGoalRequest;
import com.alberto.Spendee.sass.dto.GoalDto;
import com.alberto.Spendee.sass.repository.GoalRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GoalService {
    
    @Autowired
    private GoalRepository goalRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public GoalDto createGoal(String userEmail, CreateGoalRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setCurrentAmount(BigDecimal.ZERO); // Always start at zero
        goal.setStartDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now());
        goal.setDeadline(request.getDeadline());
        goal.setIcon(request.getIcon() != null ? request.getIcon() : "piggy-bank");
        
        Goal savedGoal = goalRepository.save(goal);
        return convertToDto(savedGoal);
    }
    
    @Transactional(readOnly = true)
    public List<GoalDto> getUserGoals(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Goal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        return goals.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public GoalDto getGoalById(String userEmail, Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to goal");
        }
        
        return convertToDto(goal);
    }
    
    @Transactional
    public GoalDto updateGoalProgress(String userEmail, Long goalId, BigDecimal amount) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to goal");
        }
        
        goal.setCurrentAmount(goal.getCurrentAmount().add(amount));
        Goal updatedGoal = goalRepository.save(goal);
        return convertToDto(updatedGoal);
    }
    
    @Transactional
    public GoalDto updateGoal(String userEmail, Long goalId, CreateGoalRequest request) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to goal");
        }
        
        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        // currentAmount is not updated here - only through updateGoalProgress
        goal.setStartDate(request.getStartDate());
        goal.setDeadline(request.getDeadline());
        goal.setIcon(request.getIcon());
        
        Goal updatedGoal = goalRepository.save(goal);
        return convertToDto(updatedGoal);
    }
    
    @Transactional
    public void deleteGoal(String userEmail, Long goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new RuntimeException("Goal not found"));
        
        if (!goal.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to goal");
        }
        
        goalRepository.delete(goal);
    }
    
    public GoalDto convertToDto(Goal goal) {
        GoalDto dto = new GoalDto();
        dto.setId(goal.getId());
        dto.setName(goal.getName());
        dto.setTargetAmount(goal.getTargetAmount());
        dto.setStartDate(goal.getStartDate());
        dto.setCurrentAmount(goal.getCurrentAmount());
        dto.setDeadline(goal.getDeadline());
        dto.setIcon(goal.getIcon());
        dto.setCreatedAt(goal.getCreatedAt());
        dto.setCompleted(goal.getCompleted());
        dto.setProgressPercentage(goal.getProgressPercentage());
        dto.setRemainingAmount(goal.getTargetAmount().subtract(goal.getCurrentAmount()));
        
        if (goal.getDeadline() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline());
            dto.setDaysRemaining((int) days);
        }
        
        return dto;
    }
}

