package com.alberto.Spendee.sass.repository;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserOrderByDateDesc(User user);

    @Query("SELECT t FROM Transaction t WHERE t.user = ?1 AND t.date BETWEEN ?2 AND ?3 ORDER BY t.date DESC")
    List<Transaction> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);

    List<Transaction> findTop10ByUserOrderByDateDesc(User user);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = ?1 AND t.type = ?2")
    BigDecimal sumAmountByUserAndType(User user, TransactionType type);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = ?1 AND t.type = ?2 AND t.date BETWEEN ?3 AND ?4")
    BigDecimal sumAmountByUserAndTypeAndDateBetween(User user, TransactionType type, LocalDate startDate, LocalDate endDate);

    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);

    List<Transaction> findByUserAndCategoryAndDateBetweenAndType(User user, Category category, LocalDate startDate, LocalDate endDate, TransactionType type);

    List<Transaction> findByUserAndDateBetweenAndType(User user, LocalDate startDate, LocalDate endDate, TransactionType type);
}
