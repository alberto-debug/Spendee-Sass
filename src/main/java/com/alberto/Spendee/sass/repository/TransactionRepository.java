package com.alberto.Spendee.sass.repository;

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
    
    List<Transaction> findByUserAndTypeOrderByDateDesc(User user, TransactionType type);
    
    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);
    
    List<Transaction> findByUserAndTypeAndDateBetweenOrderByDateDesc(
            User user, TransactionType type, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = ?1 AND t.type = ?2 AND t.date BETWEEN ?3 AND ?4")
    BigDecimal sumAmountByUserAndTypeAndDateBetween(
            User user, TransactionType type, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user = ?1")
    Long countTransactionsByUser(User user);
}
