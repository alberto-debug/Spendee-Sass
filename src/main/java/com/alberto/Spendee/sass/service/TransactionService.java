package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.DashboardSummaryDto;
import com.alberto.Spendee.sass.dto.TransactionDto;
import com.alberto.Spendee.sass.repository.CategoryRepository;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategoryService categoryService;

    /**
     * Get dashboard summary data for a user
     */
    public DashboardSummaryDto getDashboardSummary(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get current month date range
        YearMonth currentMonth = YearMonth.now();
        LocalDate firstDay = currentMonth.atDay(1);
        LocalDate lastDay = currentMonth.atEndOfMonth();
        
        // Calculate monthly totals
        BigDecimal monthlyExpenses = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, firstDay, lastDay) != null ? 
                transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, TransactionType.EXPENSE, firstDay, lastDay) :
                BigDecimal.ZERO;

        BigDecimal monthlyIncome = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, TransactionType.INCOME, firstDay, lastDay) != null ?
                transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, TransactionType.INCOME, firstDay, lastDay) :
                BigDecimal.ZERO;

        // Calculate previous month totals
        YearMonth previousMonth = currentMonth.minusMonths(1);
        LocalDate previousFirstDay = previousMonth.atDay(1);
        LocalDate previousLastDay = previousMonth.atEndOfMonth();

        BigDecimal previousMonthlyExpenses = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, previousFirstDay, previousLastDay) != null ?
                transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, TransactionType.EXPENSE, previousFirstDay, previousLastDay) :
                BigDecimal.ZERO;

        BigDecimal previousMonthlyIncome = transactionRepository.sumAmountByUserAndTypeAndDateBetween(
                user, TransactionType.INCOME, previousFirstDay, previousLastDay) != null ?
                transactionRepository.sumAmountByUserAndTypeAndDateBetween(user, TransactionType.INCOME, previousFirstDay, previousLastDay) :
                BigDecimal.ZERO;

        // Calculate month-over-month changes
        double expenseChange = calculatePercentageChange(previousMonthlyExpenses, monthlyExpenses);
        double incomeChange = calculatePercentageChange(previousMonthlyIncome, monthlyIncome);

        return new DashboardSummaryDto(
                monthlyIncome,
                monthlyExpenses,
                incomeChange,
                expenseChange
        );
    }
    
    /**
     * Create a new transaction
     */
    public TransactionDto createTransaction(TransactionDto transactionDto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create transaction without requiring a category
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setDate(transactionDto.getDate());
        transaction.setAmount(transactionDto.getAmount());
        transaction.setDescription(transactionDto.getDescription());
        transaction.setType(transactionDto.getType());
        
        // Only set category if it exists
        if (transactionDto.getCategoryId() != null) {
            try {
                Category category = categoryRepository.findById(transactionDto.getCategoryId())
                    .orElse(null);
                transaction.setCategory(category);
            } catch (Exception e) {
                // Ignore category errors - category is optional
            }
        }

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        return convertToDto(savedTransaction);
    }
    
    /**
     * Get all transactions for a user
     */
    public List<TransactionDto> getAllTransactions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user);
        
        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a transaction by ID for a user
     */
    public void deleteTransactionById(Long id, String userEmail) {
        Transaction transaction = transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
        if (!transaction.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized to delete this transaction");
        }
        transactionRepository.deleteById(id);
    }

    /**
     * Get recent transactions for a user
     */
    public List<TransactionDto> getRecentTransactions(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return transactionRepository.findByUserOrderByDateDesc(user)
                .stream()
                .limit(limit)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private double calculatePercentageChange(BigDecimal oldValue, BigDecimal newValue) {
        if (oldValue.equals(BigDecimal.ZERO)) {
            return newValue.equals(BigDecimal.ZERO) ? 0.0 : 100.0;
        }
        return newValue.subtract(oldValue)
                .multiply(BigDecimal.valueOf(100))
                .divide(oldValue.abs(), 2, BigDecimal.ROUND_HALF_UP)
                .doubleValue();
    }

    /**
     * Convert Transaction entity to TransactionDto
     */
    private TransactionDto convertToDto(Transaction transaction) {
        Long categoryId = null;
        String categoryName = "Uncategorized";

        if (transaction.getCategory() != null) {
            categoryId = transaction.getCategory().getId();
            categoryName = transaction.getCategory().getName();
        }

        return new TransactionDto(
                transaction.getId(),
                categoryId,
                categoryName,
                transaction.getDate(),
                transaction.getAmount(),
                transaction.getDescription(),
                transaction.getType()
        );
    }
}
