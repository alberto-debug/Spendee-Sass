package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.dto.MpesaTransactionDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class MpesaStatementParserService {

    // Date formats commonly used in M-Pesa statements
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("d/M/yyyy"),
        DateTimeFormatter.ofPattern("dd MMM yyyy")
    };

    // Keywords that indicate income transactions
    private static final String[] INCOME_KEYWORDS = {
        "received", "deposit", "credited", "customer paid", "reversal",
        "refund", "airtime purchase", "received from"
    };

    // Keywords that indicate expense transactions
    private static final String[] EXPENSE_KEYWORDS = {
        "paid", "sent", "debited", "withdraw", "bought", "purchase",
        "bill payment", "paybill", "till number", "buy goods"
    };

    /**
     * Parse M-Pesa statement PDF and extract transactions
     */
    public List<MpesaTransactionDTO> parseStatement(MultipartFile file) throws IOException {
        List<MpesaTransactionDTO> transactions = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            log.info("Parsing M-Pesa statement with {} pages", document.getNumberOfPages());

            transactions = extractTransactions(text);

            log.info("Extracted {} transactions from M-Pesa statement", transactions.size());
        } catch (Exception e) {
            log.error("Error parsing M-Pesa statement: {}", e.getMessage(), e);
            throw new IOException("Failed to parse M-Pesa statement: " + e.getMessage());
        }

        return transactions;
    }

    /**
     * Extract transactions from the PDF text content
     */
    private List<MpesaTransactionDTO> extractTransactions(String text) {
        List<MpesaTransactionDTO> transactions = new ArrayList<>();

        // Split text into lines
        String[] lines = text.split("\n");

        boolean inSummarySection = false;
        LocalDate statementDate = LocalDate.now(); // Default to today

        // First, try to extract the statement date
        for (String line : lines) {
            if (line.contains("Date of Statement:")) {
                statementDate = extractStatementDate(line);
                log.info("Found statement date: {}", statementDate);
                break;
            }
        }

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();

            // Skip empty lines
            if (line.isEmpty()) {
                continue;
            }

            // Detect when we reach the SUMMARY section
            if (line.contains("SUMMARY")) {
                inSummarySection = true;
                log.info("Found SUMMARY section");
                continue;
            }

            // Stop processing when we reach DETAILED STATEMENT
            if (line.contains("DETAILED STATEMENT")) {
                log.info("Reached DETAILED STATEMENT, stopping summary parsing");
                break;
            }

            // Skip header lines
            if (isHeaderLine(line) || line.contains("TRANSACTION TYPE")) {
                continue;
            }

            // Only process lines in the summary section
            if (!inSummarySection) {
                continue;
            }

            try {
                List<MpesaTransactionDTO> lineTransactions = parseSummaryLineMultiple(line, statementDate);
                if (lineTransactions != null && !lineTransactions.isEmpty()) {
                    transactions.addAll(lineTransactions);
                    for (MpesaTransactionDTO tx : lineTransactions) {
                        log.debug("Parsed summary transaction: {} - {} - {}",
                            tx.getDescription(), tx.getType(), tx.getAmount());
                    }
                }
            } catch (Exception e) {
                log.debug("Could not parse summary line: {} - Error: {}", line, e.getMessage());
            }
        }

        log.info("Total transactions parsed from summary: {}", transactions.size());
        return transactions;
    }

    /**
     * Extract statement date from the header
     */
    private LocalDate extractStatementDate(String line) {
        try {
            // Format: "Date of Statement:     21st 10 2025"
            String dateStr = line.substring(line.indexOf(":") + 1).trim();
            // Remove ordinal indicators (st, nd, rd, th)
            dateStr = dateStr.replaceAll("(\\d+)(st|nd|rd|th)", "$1");
            // Parse format like "21 10 2025"
            String[] parts = dateStr.split("\\s+");
            if (parts.length >= 3) {
                int day = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                int year = Integer.parseInt(parts[2]);
                return LocalDate.of(year, month, day);
            }
        } catch (Exception e) {
            log.debug("Could not parse statement date from: {}", line);
        }
        return LocalDate.now();
    }

    /**
     * Parse a line from the SUMMARY section and return multiple transactions (income and expense)
     * Format: Transaction Type | Paid In | Paid Out
     * Example: Send Money | 4,630.00 | 157.00
     */
    private List<MpesaTransactionDTO> parseSummaryLineMultiple(String line, LocalDate date) {
        List<MpesaTransactionDTO> transactions = new ArrayList<>();

        log.debug("Attempting to parse summary line: '{}'", line);

        // Skip TOTAL line as it's just a sum
        if (line.toUpperCase().startsWith("TOTAL")) {
            log.debug("Skipping TOTAL line");
            return transactions;
        }

        // Try multiple splitting strategies
        String[] parts = null;

        // Strategy 1: Split by pipe
        if (line.contains("|")) {
            parts = line.split("\\|");
            log.debug("Split by pipe: {} parts", parts.length);
        }

        // Strategy 2: Split by tab characters
        if (parts == null || parts.length < 2) {
            parts = line.split("\\t+");
            if (parts.length >= 2) {
                log.debug("Split by tab: {} parts", parts.length);
            }
        }

        // Strategy 3: Split by multiple spaces (2 or more)
        if (parts == null || parts.length < 2) {
            parts = line.split("\\s{2,}");
            log.debug("Split by spaces: {} parts", parts.length);
        }

        if (parts == null || parts.length < 2) {
            log.debug("Could not split line into enough parts");
            return transactions;
        }

        String transactionType = parts[0].trim();

        // Skip if transaction type is empty or looks like a header
        if (transactionType.isEmpty() ||
            transactionType.equalsIgnoreCase("TRANSACTION TYPE") ||
            transactionType.toLowerCase().contains("paid in") ||
            transactionType.toLowerCase().contains("paid out")) {
            log.debug("Skipping header or empty transaction type: '{}'", transactionType);
            return transactions;
        }

        log.debug("Transaction type: '{}', Parts count: {}", transactionType, parts.length);

        // Parse Paid In amount (income)
        if (parts.length > 1) {
            String paidInStr = parts[1].trim();
            log.debug("Paid In string: '{}'", paidInStr);
            BigDecimal paidIn = parseAmount(paidInStr);

            if (paidIn != null && paidIn.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Creating INCOME transaction: {} - Amount: {}", transactionType, paidIn);
                transactions.add(new MpesaTransactionDTO(
                    date,
                    transactionType + " (Received)",
                    paidIn,
                    "INCOME",
                    "",
                    line
                ));
            }
        }

        // Parse Paid Out amount (expense)
        if (parts.length > 2) {
            String paidOutStr = parts[2].trim();
            log.debug("Paid Out string: '{}'", paidOutStr);
            BigDecimal paidOut = parseAmount(paidOutStr);

            if (paidOut != null && paidOut.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Creating EXPENSE transaction: {} - Amount: {}", transactionType, paidOut);
                transactions.add(new MpesaTransactionDTO(
                    date,
                    transactionType + " (Sent)",
                    paidOut,
                    "EXPENSE",
                    "",
                    line
                ));
            }
        }

        if (transactions.isEmpty()) {
            log.debug("No valid amounts found in line");
        }

        return transactions;
    }

    /**
     * Parse a line from the SUMMARY section
     * Format: Transaction Type | Paid In | Paid Out
     * Example: Send Money | 4,630.00 | 157.00
     */
    private MpesaTransactionDTO parseSummaryLine(String line, LocalDate date) {
        log.debug("Attempting to parse summary line: '{}'", line);

        // Skip TOTAL line as it's just a sum
        if (line.toUpperCase().startsWith("TOTAL")) {
            log.debug("Skipping TOTAL line");
            return null;
        }

        // Try multiple splitting strategies
        String[] parts = null;

        // Strategy 1: Split by pipe
        if (line.contains("|")) {
            parts = line.split("\\|");
            log.debug("Split by pipe: {} parts", parts.length);
        }

        // Strategy 2: Split by tab characters
        if (parts == null || parts.length < 2) {
            parts = line.split("\\t+");
            if (parts.length >= 2) {
                log.debug("Split by tab: {} parts", parts.length);
            }
        }

        // Strategy 3: Split by multiple spaces (2 or more)
        if (parts == null || parts.length < 2) {
            parts = line.split("\\s{2,}");
            log.debug("Split by spaces: {} parts", parts.length);
        }

        if (parts == null || parts.length < 2) {
            log.debug("Could not split line into enough parts");
            return null;
        }

        String transactionType = parts[0].trim();

        // Skip if transaction type is empty or looks like a header
        if (transactionType.isEmpty() ||
            transactionType.equalsIgnoreCase("TRANSACTION TYPE") ||
            transactionType.toLowerCase().contains("paid in") ||
            transactionType.toLowerCase().contains("paid out")) {
            log.debug("Skipping header or empty transaction type: '{}'", transactionType);
            return null;
        }

        log.debug("Transaction type: '{}', Parts count: {}", transactionType, parts.length);

        // Try to create both income and expense transactions from this line
        List<MpesaTransactionDTO> transactionsFromLine = new ArrayList<>();

        // Parse Paid In amount (income)
        if (parts.length > 1) {
            String paidInStr = parts[1].trim();
            log.debug("Paid In string: '{}'", paidInStr);
            BigDecimal paidIn = parseAmount(paidInStr);

            if (paidIn != null && paidIn.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Creating INCOME transaction: {} - Amount: {}", transactionType, paidIn);
                // Return the income transaction
                return new MpesaTransactionDTO(
                    date,
                    transactionType + " (Received)",
                    paidIn,
                    "INCOME",
                    "",
                    line
                );
            }
        }

        // Parse Paid Out amount (expense)
        if (parts.length > 2) {
            String paidOutStr = parts[2].trim();
            log.debug("Paid Out string: '{}'", paidOutStr);
            BigDecimal paidOut = parseAmount(paidOutStr);

            if (paidOut != null && paidOut.compareTo(BigDecimal.ZERO) > 0) {
                log.info("Creating EXPENSE transaction: {} - Amount: {}", transactionType, paidOut);
                // Return the expense transaction
                return new MpesaTransactionDTO(
                    date,
                    transactionType + " (Sent)",
                    paidOut,
                    "EXPENSE",
                    "",
                    line
                );
            }
        }

        log.debug("No valid amounts found in line");
        return null;
    }

    /**
     * Parse a line from the detailed statement section
     * Format: Receipt | Completion Time | Details | Transaction Status | Paid In | Withdraw | Balance
     */
    private MpesaTransactionDTO parseDetailedStatementLine(String line) {
        // Split by pipe or multiple spaces (3 or more)
        String[] parts = line.split("\\|");

        // If no pipes found, try splitting by multiple spaces
        if (parts.length < 5) {
            parts = line.split("\\s{3,}");
        }

        if (parts.length < 5) {
            return null;
        }

        String receiptNo = parts[0].trim();
        String completionTime = parts[1].trim();
        String details = parts.length > 2 ? parts[2].trim() : "";
        String status = parts.length > 3 ? parts[3].trim() : "";

        // Only process COMPLETED transactions
        if (!status.equalsIgnoreCase("COMPLETED")) {
            return null;
        }

        // Parse date from completion time
        LocalDate date = parseDateFromCompletionTime(completionTime);
        if (date == null) {
            return null;
        }

        // Parse amounts from Paid In and Withdraw columns
        BigDecimal amount = null;
        String type = null;

        if (parts.length > 4) {
            String paidIn = parts[4].trim();
            BigDecimal paidInAmount = parseAmount(paidIn);

            if (paidInAmount != null && paidInAmount.compareTo(BigDecimal.ZERO) > 0) {
                amount = paidInAmount;
                type = "INCOME";
            }
        }

        if (parts.length > 5 && amount == null) {
            String withdraw = parts[5].trim();
            BigDecimal withdrawAmount = parseAmount(withdraw);

            if (withdrawAmount != null && withdrawAmount.compareTo(BigDecimal.ZERO) > 0) {
                amount = withdrawAmount;
                type = "EXPENSE";
            }
        }

        // If still no amount found, try to extract from details
        if (amount == null) {
            amount = extractAmountFromDetails(details);
            if (amount != null) {
                type = determineTypeFromDescription(details);
            }
        }

        if (date != null && amount != null && type != null && !details.isEmpty()) {
            return new MpesaTransactionDTO(date, details, amount, type, receiptNo, line);
        }

        return null;
    }

    /**
     * Parse date from completion time string
     */
    private LocalDate parseDateFromCompletionTime(String completionTime) {
        if (completionTime == null || completionTime.trim().isEmpty()) {
            return null;
        }

        try {
            // Format: yyyy-MM-dd HH:mm:ss
            String datePart = completionTime.trim().split("\\s+")[0];
            return LocalDate.parse(datePart, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        } catch (Exception e) {
            // Try other formats
            for (DateTimeFormatter formatter : DATE_FORMATTERS) {
                try {
                    return LocalDate.parse(completionTime.trim().split("\\s+")[0], formatter);
                } catch (Exception ex) {
                    // Continue to next formatter
                }
            }
            log.debug("Could not parse date from: {}", completionTime);
            return null;
        }
    }

    /**
     * Extract amount from transaction details if not in separate column
     */
    private BigDecimal extractAmountFromDetails(String details) {
        // Look for patterns like "Ksh 350.00" or "350.00" in the details
        String[] words = details.split("\\s+");
        for (String word : words) {
            BigDecimal amount = parseAmount(word);
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                return amount;
            }
        }
        return null;
    }

    /**
     * Parse a single transaction line
     */
    private MpesaTransactionDTO parseTransactionLine(String line, String[] allLines, int currentIndex) {
        // Try multiple parsing strategies

        // Strategy 1: Tab or pipe-separated values
        MpesaTransactionDTO transaction = parseTabularFormat(line);
        if (transaction != null) {
            return transaction;
        }

        // Strategy 2: Space-separated with amount detection
        transaction = parseSpaceSeparatedFormat(line);
        if (transaction != null) {
            return transaction;
        }

        // Strategy 3: Multi-line transaction (description spans multiple lines)
        if (currentIndex + 1 < allLines.length) {
            transaction = parseMultiLineFormat(line, allLines[currentIndex + 1]);
            if (transaction != null) {
                return transaction;
            }
        }

        return null;
    }

    /**
     * Parse tabular format (separated by tabs or pipes)
     */
    private MpesaTransactionDTO parseTabularFormat(String line) {
        // Split by tab, pipe, or multiple spaces
        String[] parts = line.split("\\t+|\\|+|\\s{3,}");

        if (parts.length < 3) {
            return null;
        }

        LocalDate date = parseDate(parts[0]);
        if (date == null) {
            return null;
        }

        String description = parts[1].trim();
        BigDecimal amount = null;
        String type = null;
        String receiptNo = "";

        // Look for amount in the remaining parts
        for (int i = 2; i < parts.length; i++) {
            BigDecimal parsedAmount = parseAmount(parts[i]);
            if (parsedAmount != null && parsedAmount.compareTo(BigDecimal.ZERO) > 0) {
                amount = parsedAmount;

                // Determine type based on column position or keywords
                if (i == 2 || parts[i].toLowerCase().contains("paid in") ||
                    parts[i].toLowerCase().contains("received")) {
                    type = "INCOME";
                } else if (i == 3 || parts[i].toLowerCase().contains("withdrawn") ||
                           parts[i].toLowerCase().contains("paid out")) {
                    type = "EXPENSE";
                }

                // Try to find receipt number
                if (i + 2 < parts.length) {
                    receiptNo = parts[i + 2].trim();
                }
                break;
            }
        }

        // If type not determined from position, use keywords from description
        if (type == null && amount != null) {
            type = determineTypeFromDescription(description);
        }

        if (date != null && amount != null && type != null) {
            return new MpesaTransactionDTO(date, description, amount, type, receiptNo, line);
        }

        return null;
    }

    /**
     * Parse space-separated format
     */
    private MpesaTransactionDTO parseSpaceSeparatedFormat(String line) {
        LocalDate date = null;
        BigDecimal amount = null;
        StringBuilder descriptionBuilder = new StringBuilder();
        String receiptNo = "";

        String[] parts = line.split("\\s+");

        // Look for date at the beginning
        for (int i = 0; i < Math.min(3, parts.length); i++) {
            date = parseDate(parts[i]);
            if (date != null) {
                // Collect description and amount from remaining parts
                boolean foundAmount = false;
                for (int j = i + 1; j < parts.length; j++) {
                    BigDecimal parsedAmount = parseAmount(parts[j]);
                    if (parsedAmount != null && parsedAmount.compareTo(BigDecimal.ZERO) > 0) {
                        amount = parsedAmount;
                        foundAmount = true;
                        // Check if next part is receipt number (usually alphanumeric)
                        if (j + 1 < parts.length && parts[j + 1].matches("[A-Z0-9]{8,}")) {
                            receiptNo = parts[j + 1];
                        }
                        break;
                    } else if (!foundAmount) {
                        if (descriptionBuilder.length() > 0) {
                            descriptionBuilder.append(" ");
                        }
                        descriptionBuilder.append(parts[j]);
                    }
                }
                break;
            }
        }

        String description = descriptionBuilder.toString().trim();

        if (date != null && amount != null && !description.isEmpty()) {
            String type = determineTypeFromDescription(description);
            return new MpesaTransactionDTO(date, description, amount, type, receiptNo, line);
        }

        return null;
    }

    /**
     * Parse multi-line format where description spans multiple lines
     */
    private MpesaTransactionDTO parseMultiLineFormat(String line1, String line2) {
        LocalDate date = parseDate(line1.split("\\s+")[0]);
        if (date == null) {
            return null;
        }

        // Combine lines and try to parse
        String combined = line1 + " " + line2;
        return parseSpaceSeparatedFormat(combined);
    }

    /**
     * Determine transaction type from description keywords
     */
    private String determineTypeFromDescription(String description) {
        String lowerDesc = description.toLowerCase();

        // Check for income keywords
        for (String keyword : INCOME_KEYWORDS) {
            if (lowerDesc.contains(keyword)) {
                return "INCOME";
            }
        }

        // Check for expense keywords
        for (String keyword : EXPENSE_KEYWORDS) {
            if (lowerDesc.contains(keyword)) {
                return "EXPENSE";
            }
        }

        // Default to expense if unclear
        return "EXPENSE";
    }

    /**
     * Parse date from string using multiple formats
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }

        dateStr = dateStr.trim().replaceAll("[^0-9/\\-.]", "");

        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(dateStr, formatter);
            } catch (Exception e) {
                // Try next formatter
            }
        }

        return null;
    }

    /**
     * Parse amount from string
     */
    private BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.trim().isEmpty()) {
            return null;
        }

        try {
            // Remove currency symbols, commas, and whitespace
            String cleaned = amountStr.replaceAll("[^0-9.]", "");
            if (cleaned.isEmpty()) {
                return null;
            }
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Check if line is a header line
     */
    private boolean isHeaderLine(String line) {
        String lower = line.toLowerCase();
        return lower.contains("receipt") ||
               lower.contains("completion time") ||
               lower.contains("transaction status") ||
               lower.contains("paid in") ||
               lower.contains("withdraw") ||
               lower.contains("balance") ||
               lower.contains("mpesa") ||
               lower.contains("customer name") ||
               lower.contains("mobile number") ||
               lower.contains("statement period") ||
               lower.contains("summary") ||
               lower.contains("transaction type") ||
               lower.contains("paid out") ||
               lower.contains("total") ||
               lower.matches("^[\\s|]+$"); // Lines with only pipes and spaces
    }
}

