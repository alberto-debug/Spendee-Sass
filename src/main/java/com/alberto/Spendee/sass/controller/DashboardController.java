package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.DashboardSummaryDto;
import com.alberto.Spendee.sass.dto.TransactionDto;
import com.alberto.Spendee.sass.service.SpendingLimitService;
import com.alberto.Spendee.sass.service.TransactionService;
import com.alberto.Spendee.sass.domain.transaction.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private SpendingLimitService spendingLimitService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        DashboardSummaryDto summary = transactionService.getDashboardSummary(userEmail);

        // Add spending limits to the summary
        summary.setSpendingLimits(spendingLimitService.getUserSpendingLimits(userEmail));

        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/recent-transactions")
    public ResponseEntity<List<TransactionDto>> getRecentTransactions() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Transaction> transactions = transactionService.getRecentTransactions(userEmail, 10);
        return ResponseEntity.ok(transactions.stream()
            .map(transactionService::convertToDto)
            .collect(Collectors.toList()));
    }
}
