package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.goal.Goal;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.CreateGoalRequest;
import com.alberto.Spendee.sass.dto.GoalDto;
import com.alberto.Spendee.sass.repository.GoalRepository;
import com.alberto.Spendee.sass.repository.TransactionRepository;
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

    @Autowired
    private TransactionRepository transactionRepository;

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

    /**
     * Calculate user's current balance from transactions
     */
    private BigDecimal calculateUserBalance(User user) {
        BigDecimal totalIncome = transactionRepository.sumAmountByUserAndType(user, TransactionType.INCOME);
        BigDecimal totalExpenses = transactionRepository.sumAmountByUserAndType(user, TransactionType.EXPENSE);

        totalIncome = (totalIncome != null) ? totalIncome : BigDecimal.ZERO;
        totalExpenses = (totalExpenses != null) ? totalExpenses : BigDecimal.ZERO;

        return totalIncome.subtract(totalExpenses);
    }

    public GoalDto convertToDto(Goal goal) {
        GoalDto dto = new GoalDto();
        dto.setId(goal.getId());
        dto.setName(goal.getName());
        dto.setTargetAmount(goal.getTargetAmount());
        dto.setStartDate(goal.getStartDate());

        // Use actual user balance as current amount
        BigDecimal userBalance = calculateUserBalance(goal.getUser());
        dto.setCurrentAmount(userBalance);

        dto.setDeadline(goal.getDeadline());
        dto.setIcon(goal.getIcon());
        dto.setCreatedAt(goal.getCreatedAt());

        // Check if goal is completed based on actual balance
        boolean isCompleted = userBalance.compareTo(goal.getTargetAmount()) >= 0;
        dto.setCompleted(isCompleted);

        // Calculate progress percentage based on actual balance
        double progressPercentage = 0.0;
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progressPercentage = userBalance.divide(goal.getTargetAmount(), 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        dto.setProgressPercentage(progressPercentage);

        dto.setRemainingAmount(goal.getTargetAmount().subtract(userBalance));

        if (goal.getDeadline() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), goal.getDeadline());
            dto.setDaysRemaining((int) days);
        }

        return dto;
    }
}

