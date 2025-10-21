package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.transaction.Category;
import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.MpesaTransactionDTO;
import com.alberto.Spendee.sass.repository.CategoryRepository;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import com.alberto.Spendee.sass.service.MpesaStatementParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mpesa")
@RequiredArgsConstructor
@Slf4j
public class MpesaStatementController {

    private final MpesaStatementParserService parserService;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;

    @PostMapping("/upload-statement")
    public ResponseEntity<?> uploadStatement(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload"));
            }

            if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported"));
            }

            log.info("Processing M-Pesa statement upload for user: {}", user.getEmail());

            // Parse the statement
            List<MpesaTransactionDTO> mpesaTransactions = parserService.parseStatement(file);

            if (mpesaTransactions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No transactions found in the statement. Please check the file format."
                ));
            }

            // Get default category for M-Pesa transactions
            // Try to find or create an M-Pesa category
            Category defaultCategory = categoryRepository
                .findByUserOrIsDefaultTrue(user)
                .stream()
                .filter(c -> c.getName().equalsIgnoreCase("M-Pesa"))
                .findFirst()
                .orElse(null);

            // Convert and save transactions
            int savedCount = 0;
            int skippedCount = 0;
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;

            for (MpesaTransactionDTO mpesaTx : mpesaTransactions) {
                try {
                    // Check for duplicates based on transaction code and date
                    if (mpesaTx.getTransactionCode() != null && !mpesaTx.getTransactionCode().isEmpty()) {
                        boolean exists = transactionRepository.findByUserOrderByDateDesc(user).stream()
                            .anyMatch(t -> t.getDescription().contains(mpesaTx.getTransactionCode())
                                        && t.getDate().equals(mpesaTx.getDate()));

                        if (exists) {
                            skippedCount++;
                            continue;
                        }
                    }

                    // Create transaction entity
                    Transaction transaction = new Transaction();
                    transaction.setDescription(mpesaTx.getDescription());
                    transaction.setAmount(mpesaTx.getAmount());
                    transaction.setDate(mpesaTx.getDate());
                    transaction.setType(TransactionType.valueOf(mpesaTx.getType()));
                    transaction.setUser(user);
                    transaction.setCategory(defaultCategory);

                    transactionRepository.save(transaction);
                    savedCount++;

                    // Track totals
                    if (mpesaTx.getType().equals("INCOME")) {
                        totalIncome = totalIncome.add(mpesaTx.getAmount());
                    } else {
                        totalExpense = totalExpense.add(mpesaTx.getAmount());
                    }

                } catch (Exception e) {
                    log.error("Error saving transaction: {}", e.getMessage());
                    skippedCount++;
                }
            }

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("Successfully imported %d transactions", savedCount));
            response.put("totalTransactions", mpesaTransactions.size());
            response.put("savedTransactions", savedCount);
            response.put("skippedTransactions", skippedCount);
            response.put("totalIncome", totalIncome);
            response.put("totalExpense", totalExpense);

            log.info("M-Pesa statement processed: {} saved, {} skipped", savedCount, skippedCount);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing M-Pesa statement: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process statement: " + e.getMessage()));
        }
    }

    @GetMapping("/upload-info")
    public ResponseEntity<?> getUploadInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("maxFileSize", "10MB");
        info.put("supportedFormats", List.of("PDF"));
        info.put("instructions", List.of(
            "Download your M-Pesa statement from the Safaricom app",
            "Select the PDF file to upload",
            "We'll automatically extract and categorize your transactions",
            "Duplicate transactions will be skipped"
        ));
        return ResponseEntity.ok(info);
    }
}

