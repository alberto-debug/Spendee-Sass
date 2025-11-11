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
            "refund", "received from", "funds received"
    };

    // Keywords that indicate expense transactions
    private static final String[] EXPENSE_KEYWORDS = {
            "paid", "sent", "debited", "withdraw", "withdrawn", "bought", "purchase",
            "bill payment", "paybill", "till number", "buy goods", "airtime purchase",
            "charge", "fee"
    };

    /**
     * Parse M-Pesa statement PDF and extract transactions
     */
    public List<MpesaTransactionDTO> parseStatement(MultipartFile file) throws IOException {
        List<MpesaTransactionDTO> transactions = new ArrayList<>();

        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            // Important: keep table columns in order
            stripper.setSortByPosition(true);

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

        String[] lines = text.split("\n");

        boolean inSummarySection = false;
        boolean inDetailedSection = false;
        int summaryCount = 0;
        int detailedCount = 0;

        LocalDate statementDate = LocalDate.now(); // Default to today

        // Try to extract the statement date first
        for (String line : lines) {
            if (line.contains("Date of Statement:")) {
                statementDate = extractStatementDate(line);
                log.info("Found statement date: {}", statementDate);
                break;
            }
        }

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;

            // Section switches
            if (line.contains("SUMMARY")) {
                inSummarySection = true;
                inDetailedSection = false;
                log.info("Found SUMMARY section");
                continue;
            }
            if (line.contains("DETAILED STATEMENT")) {
                inSummarySection = false;
                inDetailedSection = true;
                log.info("Found DETAILED STATEMENT section");
                continue;
            }

            // Skip header lines
            if (isHeaderLine(line)) {
                continue;
            }

            try {
                if (inSummarySection) {
                    List<MpesaTransactionDTO> lineTx = parseSummaryLineMultiple(line, statementDate);
                    if (lineTx != null && !lineTx.isEmpty()) {
                        transactions.addAll(lineTx);
                        summaryCount += lineTx.size();
                        if (log.isDebugEnabled()) {
                            for (MpesaTransactionDTO tx : lineTx) {
                                log.debug("Parsed summary transaction: {} - {} - {}",
                                        tx.getDescription(), tx.getType(), tx.getAmount());
                            }
                        }
                    }
                } else if (inDetailedSection) {
                    // Parse detailed section - for now, focus on summary only
                    log.debug("Skipping detailed section line: {}", line);
                }
            } catch (Exception e) {
                log.debug("Could not parse line: {} - Error: {}", line, e.getMessage());
            }
        }

        log.info("Total transactions parsed from summary: {}", summaryCount);
        log.info("Total transactions parsed from detailed: {}", detailedCount);
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

        // Skip header lines and TOTAL line
        if (line.toUpperCase().contains("TRANSACTION TYPE") ||
            line.toUpperCase().contains("PAID IN") ||
            line.toUpperCase().contains("PAID OUT") ||
            line.toUpperCase().startsWith("TOTAL")) {
            log.debug("Skipping header or TOTAL line: '{}'", line);
            return transactions;
        }

        // Clean the line - replace multiple spaces with single space and split
        String cleanLine = line.replaceAll("\\s+", " ").trim();

        // Try to split by common patterns found in M-Pesa statements
        String[] parts;

        // First try splitting by multiple spaces (common in table format)
        if (cleanLine.matches(".*\\s{2,}.*")) {
            parts = cleanLine.split("\\s{2,}");
        } else {
            // Fallback to single space split
            parts = cleanLine.split("\\s+");
        }

        log.debug("Clean line: '{}', Parts: {} -> [{}]", cleanLine, parts.length, String.join(" | ", parts));

        if (parts.length < 3) {
            log.debug("Line doesn't have enough parts (need at least 3: type, paid_in, paid_out), got {}", parts.length);
            return transactions;
        }

        // Extract transaction type and amounts
        String transactionType;
        String paidInStr;
        String paidOutStr;

        if (parts.length == 3) {
            // Simple case: Type PaidIn PaidOut
            transactionType = parts[0];
            paidInStr = parts[1];
            paidOutStr = parts[2];
        } else {
            // Complex case: Need to find the numeric values at the end
            // Find the last two numeric-looking parts
            int numericCount = 0;
            int firstNumericIndex = -1;

            for (int i = parts.length - 1; i >= 0; i--) {
                if (isNumeric(parts[i])) {
                    numericCount++;
                    if (numericCount == 2) {
                        firstNumericIndex = i;
                        break;
                    }
                }
            }

            if (firstNumericIndex > 0 && parts.length > firstNumericIndex + 1) {
                // Build transaction type from parts before the numeric values
                StringBuilder typeBuilder = new StringBuilder();
                for (int i = 0; i < firstNumericIndex; i++) {
                    if (typeBuilder.length() > 0) typeBuilder.append(" ");
                    typeBuilder.append(parts[i]);
                }
                transactionType = typeBuilder.toString();
                paidInStr = parts[firstNumericIndex];
                paidOutStr = parts[firstNumericIndex + 1];
            } else {
                log.debug("Could not identify transaction type and amounts in line");
                return transactions;
            }
        }

        transactionType = transactionType.trim();

        if (transactionType.isEmpty()) {
            log.debug("Could not extract transaction type from line");
            return transactions;
        }

        log.debug("Extracted - Type: '{}', Paid In: '{}', Paid Out: '{}'", transactionType, paidInStr, paidOutStr);

        // Parse Paid In amount (income)
        BigDecimal paidIn = parseAmount(paidInStr);
        if (paidIn != null && paidIn.compareTo(BigDecimal.ZERO) > 0) {
            log.info("Creating INCOME transaction: {} - Amount: {}", transactionType, paidIn);
            transactions.add(new MpesaTransactionDTO(
                    date,
                    transactionType + " (Received)",
                    paidIn,
                    "INCOME",
                    "",
                    "Summary: " + transactionType
            ));
        }

        // Parse Paid Out amount (expense)
        BigDecimal paidOut = parseAmount(paidOutStr);
        if (paidOut != null && paidOut.compareTo(BigDecimal.ZERO) > 0) {
            log.info("Creating EXPENSE transaction: {} - Amount: {}", transactionType, paidOut);
            transactions.add(new MpesaTransactionDTO(
                    date,
                    transactionType + " (Sent)",
                    paidOut,
                    "EXPENSE",
                    "",
                    "Summary: " + transactionType
            ));
        }

        if (transactions.isEmpty()) {
            log.debug("No valid amounts found in line: '{}'", line);
        } else {
            log.info("Parsed {} transactions from summary line: '{}'", transactions.size(), transactionType);
        }

        return transactions;
    }

    /**
     * Check if a string looks numeric (for amount detection)
     */
    private boolean isNumeric(String str) {
        if (str == null || str.trim().isEmpty()) return false;
        // Remove common currency symbols and formatting
        String cleaned = str.replaceAll("[Ksh,\\s]", "");
        try {
            Double.parseDouble(cleaned);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Parse amount string and return BigDecimal
     */
    private BigDecimal parseAmount(String amountStr) {
        if (amountStr == null || amountStr.trim().isEmpty()) {
            return null;
        }

        try {
            // Handle "0.00" case specifically
            if (amountStr.trim().equals("0.00") || amountStr.trim().equals("0")) {
                return BigDecimal.ZERO;
            }

            // Remove currency symbols (Ksh, KES, etc.), commas, and whitespace
            // Keep only digits and decimal point
            String cleaned = amountStr.replaceAll("[^0-9.]", "");

            if (cleaned.isEmpty() || cleaned.equals(".")) {
                log.debug("No valid numeric content in amount string: '{}'", amountStr);
                return null;
            }

            // Handle multiple decimal points (keep only the last one)
            int lastDotIndex = cleaned.lastIndexOf('.');
            if (lastDotIndex > 0) {
                String beforeDot = cleaned.substring(0, lastDotIndex).replaceAll("\\.", "");
                String afterDot = cleaned.substring(lastDotIndex);
                cleaned = beforeDot + afterDot;
            }

            BigDecimal result = new BigDecimal(cleaned);
            log.debug("Parsed amount '{}' -> {}", amountStr, result);
            return result;

        } catch (NumberFormatException e) {
            log.debug("Could not parse amount: '{}' - {}", amountStr, e.getMessage());
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
