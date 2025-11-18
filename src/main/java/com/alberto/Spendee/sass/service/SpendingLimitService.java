package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.spendinglimit.LimitPeriod;
import com.alberto.Spendee.sass.domain.spendinglimit.SpendingLimit;
import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.CreateSpendingLimitRequest;
import com.alberto.Spendee.sass.dto.SpendingLimitDto;
import com.alberto.Spendee.sass.repository.CategoryRepository;
import com.alberto.Spendee.sass.repository.SpendingLimitRepository;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class SpendingLimitService {

    @Autowired
    private SpendingLimitRepository spendingLimitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NotificationService notificationService;

    public SpendingLimitDto createSpendingLimit(String userEmail, CreateSpendingLimitRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        // Check if limit already exists for this category/user combination
        Optional<SpendingLimit> existingLimit;
        if (category != null) {
            existingLimit = spendingLimitRepository.findByUserAndCategoryAndIsActiveTrue(user, category);
        } else {
            existingLimit = spendingLimitRepository.findGlobalLimitByUser(user);
        }

        if (existingLimit.isPresent()) {
            throw new RuntimeException("Spending limit already exists for this category");
        }

        SpendingLimit spendingLimit = new SpendingLimit(user, category, request.getLimitAmount(), request.getPeriod());
        spendingLimit.setNotificationThreshold(request.getNotificationThreshold());

        // Calculate current spending for the period
        BigDecimal currentSpent = calculateCurrentSpending(user, category, request.getPeriod());
        spendingLimit.setCurrentSpent(currentSpent);

        spendingLimit = spendingLimitRepository.save(spendingLimit);

        // Check if already at threshold
        if (spendingLimit.isThresholdExceeded() && !spendingLimit.isLimitExceeded()) {
            notificationService.createSpendingLimitNotification(
                    userEmail,
                    category != null ? category.getName() : null,
                    formatAmount(spendingLimit.getLimitAmount()),
                    formatAmount(currentSpent),
                    false
            );
        } else if (spendingLimit.isLimitExceeded()) {
            notificationService.createSpendingLimitNotification(
                    userEmail,
                    category != null ? category.getName() : null,
                    formatAmount(spendingLimit.getLimitAmount()),
                    formatAmount(currentSpent),
                    true
            );
        }

        return convertToDto(spendingLimit);
    }

    public List<SpendingLimitDto> getUserSpendingLimits(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SpendingLimit> limits = spendingLimitRepository.findByUserAndIsActiveTrue(user);
        
        // Update current spending for each limit
        for (SpendingLimit limit : limits) {
            BigDecimal currentSpent = calculateCurrentSpending(user, limit.getCategory(), limit.getPeriod());
            limit.setCurrentSpent(currentSpent);
        }
        spendingLimitRepository.saveAll(limits);

        return limits.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public SpendingLimitDto updateSpendingLimit(Long limitId, String userEmail, CreateSpendingLimitRequest request) {
        SpendingLimit limit = spendingLimitRepository.findById(limitId)
                .orElseThrow(() -> new RuntimeException("Spending limit not found"));

        if (!limit.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to spending limit");
        }

        limit.setLimitAmount(request.getLimitAmount());
        limit.setPeriod(request.getPeriod());
        limit.setNotificationThreshold(request.getNotificationThreshold());

        // Recalculate current spending for the new period
        BigDecimal currentSpent = calculateCurrentSpending(limit.getUser(), limit.getCategory(), request.getPeriod());
        limit.setCurrentSpent(currentSpent);

        limit = spendingLimitRepository.save(limit);
        return convertToDto(limit);
    }

    public void deleteSpendingLimit(Long limitId, String userEmail) {
        SpendingLimit limit = spendingLimitRepository.findById(limitId)
                .orElseThrow(() -> new RuntimeException("Spending limit not found"));

        if (!limit.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to spending limit");
        }

        limit.setIsActive(false);
        spendingLimitRepository.save(limit);
    }

    public void checkSpendingLimitsAfterTransaction(String userEmail, Transaction transaction) {
        if (transaction.getType() != TransactionType.EXPENSE) {
            return;
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SpendingLimit> limits = spendingLimitRepository.findByUserAndIsActiveTrue(user);
        
        for (SpendingLimit limit : limits) {
            // Check if this limit applies to the transaction
            if (limit.getCategory() != null && !limit.getCategory().equals(transaction.getCategory())) {
                continue;
            }

            BigDecimal previousSpent = limit.getCurrentSpent();
            BigDecimal newSpent = calculateCurrentSpending(user, limit.getCategory(), limit.getPeriod());
            limit.setCurrentSpent(newSpent);

            boolean wasAtThreshold = previousSpent.compareTo(limit.getLimitAmount().multiply(limit.getNotificationThreshold())) >= 0;
            boolean wasExceeded = previousSpent.compareTo(limit.getLimitAmount()) > 0;

            // Send notifications for new threshold breaches
            if (!wasAtThreshold && limit.isThresholdExceeded() && !limit.isLimitExceeded()) {
                notificationService.createSpendingLimitNotification(
                        userEmail,
                        limit.getCategory() != null ? limit.getCategory().getName() : null,
                        formatAmount(limit.getLimitAmount()),
                        formatAmount(newSpent),
                        false
                );
            } else if (!wasExceeded && limit.isLimitExceeded()) {
                notificationService.createSpendingLimitNotification(
                        userEmail,
                        limit.getCategory() != null ? limit.getCategory().getName() : null,
                        formatAmount(limit.getLimitAmount()),
                        formatAmount(newSpent),
                        true
                );
            }
        }

        spendingLimitRepository.saveAll(limits);
    }

    private BigDecimal calculateCurrentSpending(User user, Category category, LimitPeriod period) {
        LocalDate startDate = getStartDateForPeriod(period);
        LocalDate endDate = LocalDate.now();

        List<Transaction> transactions;
        if (category != null) {
            transactions = transactionRepository.findByUserAndCategoryAndDateBetweenAndType(
                    user, category, startDate, endDate, TransactionType.EXPENSE);
        } else {
            transactions = transactionRepository.findByUserAndDateBetweenAndType(
                    user, startDate, endDate, TransactionType.EXPENSE);
        }

        return transactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private LocalDate getStartDateForPeriod(LimitPeriod period) {
        LocalDate now = LocalDate.now();
        return switch (period) {
            case DAILY -> now;
            case WEEKLY -> now.with(java.time.DayOfWeek.MONDAY);
            case MONTHLY -> YearMonth.from(now).atDay(1);
            case YEARLY -> LocalDate.of(now.getYear(), 1, 1);
        };
    }

    private String formatAmount(BigDecimal amount) {
        return "$" + amount.setScale(2, BigDecimal.ROUND_HALF_UP).toPlainString();
    }

    private SpendingLimitDto convertToDto(SpendingLimit limit) {
        return new SpendingLimitDto(
                limit.getId(),
                limit.getCategory() != null ? limit.getCategory().getId() : null,
                limit.getCategory() != null ? limit.getCategory().getName() : "Total Spending",
                limit.getLimitAmount(),
                limit.getCurrentSpent(),
                limit.getPeriod(),
                limit.getNotificationThreshold(),
                limit.getIsActive()
        );
    }
}
