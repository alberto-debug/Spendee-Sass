package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.DashboardSummaryDto;
import com.alberto.Spendee.sass.dto.TransactionDto;
import com.alberto.Spendee.sass.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getDashboardSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        DashboardSummaryDto summary = transactionService.getDashboardSummary(userEmail);
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/transactions")
    public ResponseEntity<List<TransactionDto>> getAllTransactions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        List<TransactionDto> transactions = transactionService.getAllTransactions(userEmail);
        return ResponseEntity.ok(transactions);
    }
    
    @PostMapping("/transactions")
    public ResponseEntity<TransactionDto> createTransaction(@RequestBody TransactionDto transactionDto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        
        TransactionDto createdTransaction = transactionService.createTransaction(transactionDto, userEmail);
        return ResponseEntity.ok(createdTransaction);
    }
}
