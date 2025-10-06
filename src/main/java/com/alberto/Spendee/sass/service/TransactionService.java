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
        
        // Calculate all-time totals
        BigDecimal totalExpenses = transactionRepository.sumAmountByUserAndType(
                user, TransactionType.EXPENSE) != null ?
                transactionRepository.sumAmountByUserAndType(user, TransactionType.EXPENSE) :
                BigDecimal.ZERO;

        BigDecimal totalIncome = transactionRepository.sumAmountByUserAndType(
                user, TransactionType.INCOME) != null ?
                transactionRepository.sumAmountByUserAndType(user, TransactionType.INCOME) :
                BigDecimal.ZERO;

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
                totalIncome,        // Changed from monthlyIncome to totalIncome
                totalExpenses,      // Changed from monthlyExpenses to totalExpenses
                incomeChange,
                expenseChange,
                monthlyIncome,      // Added monthly figures
                monthlyExpenses     // Added monthly figures
        );
    }
    
    /**
     * Create a new transaction
     */
    public Transaction createTransaction(TransactionDto transactionDto, User user) {
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setDate(transactionDto.getDate());
        transaction.setAmount(transactionDto.getAmount());
        transaction.setDescription(transactionDto.getDescription());
        transaction.setType(transactionDto.getType());
        
        // Only set category if categoryId is provided
        if (transactionDto.getCategoryId() != null) {
            Category category = categoryRepository.findById(transactionDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
            // Verify category belongs to user
            if (!category.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Category doesn't belong to user");
            }
            transaction.setCategory(category);
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Get all transactions for a user
     */
    public List<TransactionDto> getAllTransactionsByUser(User user) {
        List<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user);
        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get a specific transaction by ID and user
     */
    public Transaction getTransactionByIdAndUser(Long id, User user) {
        return transactionRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    /**
     * Update an existing transaction
     */
    public Transaction updateTransaction(Long id, TransactionDto transactionDto, User user) {
        Transaction transaction = getTransactionByIdAndUser(id, user);

        transaction.setDate(transactionDto.getDate());
        transaction.setAmount(transactionDto.getAmount());
        transaction.setDescription(transactionDto.getDescription());
        transaction.setType(transactionDto.getType());

        // Update category if provided, remove if null
        if (transactionDto.getCategoryId() != null) {
            Category category = categoryRepository.findById(transactionDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
            if (!category.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Category doesn't belong to user");
            }
            transaction.setCategory(category);
        } else {
            transaction.setCategory(null);
        }

        return transactionRepository.save(transaction);
    }

    public List<Transaction> getTransactionsByUser(User user) {
        return transactionRepository.findByUserOrderByDateDesc(user);
    }

    public List<Transaction> getRecentTransactions(String email, int limit) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return transactionRepository.findByUserOrderByDateDesc(user)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Delete a transaction
     */
    public void deleteTransaction(Long id, User user) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this transaction");
        }

        transactionRepository.delete(transaction);
    }

    /**
     * Get transactions for a specific month
     */
    public List<TransactionDto> getTransactionsForMonth(User user, LocalDate date) {
        LocalDate startDate = date.withDayOfMonth(1);
        LocalDate endDate = date.withDayOfMonth(date.lengthOfMonth());

        List<Transaction> transactions = transactionRepository
            .findByUserAndDateBetweenOrderByDateDesc(user, startDate, endDate);

        return transactions.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert Transaction entity to DTO
     */
    public TransactionDto convertToDto(Transaction transaction) {
        return new TransactionDto(
            transaction.getId(),
            transaction.getCategory() != null ? transaction.getCategory().getId() : null,
            transaction.getCategory() != null ? transaction.getCategory().getName() : null,
            transaction.getDate(),
            transaction.getAmount(),
            transaction.getDescription(),
            transaction.getType()
        );
    }

    private double calculatePercentageChange(BigDecimal previous, BigDecimal current) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) == 0 ? 0 : 100;
        }
        return current.subtract(previous)
                .divide(previous, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}
