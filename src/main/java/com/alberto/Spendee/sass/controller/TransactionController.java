package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.TransactionDto;
import com.alberto.Spendee.sass.service.CategoryService;
import com.alberto.Spendee.sass.service.TransactionService;
import com.alberto.Spendee.sass.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(@RequestBody TransactionDto transactionDto,
                                                          @AuthenticationPrincipal User user) {
        Transaction transaction = transactionService.createTransaction(transactionDto, user);
        TransactionDto createdTransaction = transactionService.convertToDto(transaction);
        return ResponseEntity.ok(createdTransaction);
    }

    @GetMapping
    public ResponseEntity<List<TransactionDto>> getAllTransactions(@AuthenticationPrincipal User user) {
        List<TransactionDto> transactions = transactionService.getAllTransactionsByUser(user);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransaction(@PathVariable Long id,
                                                       @AuthenticationPrincipal User user) {
        Transaction transaction = transactionService.getTransactionByIdAndUser(id, user);
        return ResponseEntity.ok(transactionService.convertToDto(transaction));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionDto> updateTransaction(@PathVariable Long id,
                                                          @RequestBody TransactionDto transactionDto,
                                                          @AuthenticationPrincipal User user) {
        Transaction transaction = transactionService.updateTransaction(id, transactionDto, user);
        return ResponseEntity.ok(transactionService.convertToDto(transaction));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id,
                                                @AuthenticationPrincipal User user) {
        transactionService.deleteTransaction(id, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/monthly")
    public ResponseEntity<List<TransactionDto>> getMonthlyTransactions(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal User user) {

        LocalDate date;
        if (year != null && month != null) {
            date = LocalDate.of(year, month, 1);
        } else {
            date = LocalDate.now();
        }

        List<TransactionDto> transactions = transactionService.getTransactionsForMonth(user, date);
        return ResponseEntity.ok(transactions);
    }
}
