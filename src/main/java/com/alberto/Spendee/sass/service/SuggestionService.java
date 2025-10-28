package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.transaction.TransactionType;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.SuggestionDto;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SuggestionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

    public List<SuggestionDto> getSuggestionsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Define time windows
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);
        LocalDate curStart = currentMonth.atDay(1);
        LocalDate curEnd = currentMonth.atEndOfMonth();
        LocalDate prevStart = previousMonth.atDay(1);
        LocalDate prevEnd = previousMonth.atEndOfMonth();
        LocalDate last90Start = LocalDate.now().minusDays(90);

        // Fetch transactions
        List<Transaction> currentTx = transactionRepository.findByUserAndDateBetween(user, curStart, curEnd);
        List<Transaction> previousTx = transactionRepository.findByUserAndDateBetween(user, prevStart, prevEnd);
        List<Transaction> last90Tx = transactionRepository.findByUserAndDateBetween(user, last90Start, LocalDate.now());

        // Separate income and expense
        BigDecimal curIncome = sumByType(currentTx, TransactionType.INCOME);
        BigDecimal curExpense = sumByType(currentTx, TransactionType.EXPENSE);

        List<SuggestionDto> suggestions = new ArrayList<>();

        // 1) Overspending vs income
        if (curIncome.compareTo(ZERO) > 0) {
            if (curExpense.compareTo(curIncome) > 0) {
                BigDecimal diff = curExpense.subtract(curIncome);
                SuggestionDto s = new SuggestionDto("BUDGET", "Spending exceeds income",
                        "Your expenses this month exceed your income by " + fmt(diff) + ". Consider reducing discretionary spending or setting a category budget.");
                s.setConfidence(0.9);
                s.setPotentialMonthlySavings(diff);
                s.getMetrics().put("monthlyIncome", curIncome);
                s.getMetrics().put("monthlyExpenses", curExpense);
                suggestions.add(s);
            }
        } else if (curExpense.compareTo(new BigDecimal("100")) > 0) {
            SuggestionDto s = new SuggestionDto("BUDGET", "Set a monthly budget",
                    "We couldn't detect income this month, but you've spent " + fmt(curExpense) + ". Consider setting targets to keep spending in check.");
            s.setConfidence(0.6);
            s.getMetrics().put("monthlyExpenses", curExpense);
            suggestions.add(s);
        }

        // 2) Category spike vs previous month
        Map<String, BigDecimal> curByCategory = sumExpensesByCategory(currentTx);
        Map<String, BigDecimal> prevByCategory = sumExpensesByCategory(previousTx);
        for (Map.Entry<String, BigDecimal> e : curByCategory.entrySet()) {
            String cat = e.getKey();
            BigDecimal cur = e.getValue();
            BigDecimal prev = prevByCategory.getOrDefault(cat, ZERO);
            if (cur.compareTo(new BigDecimal("50")) >= 0) { // threshold for meaningful amount
                double pct = percentageChange(prev, cur);
                if (pct >= 40.0) { // spike
                    SuggestionDto s = new SuggestionDto("SPIKE", "Higher spend in " + cat,
                            String.format(Locale.US, "Spending in %s is up %.0f%% vs last month. Consider setting a limit or looking for savings.", cat, pct));
                    s.setCategoryName(cat);
                    s.setConfidence(Math.min(0.5 + pct / 200.0, 0.95));
                    s.getMetrics().put("current", cur);
                    s.getMetrics().put("previous", prev);
                    suggestions.add(s);
                }
            }
        }

        // 3) Dominant category share
        if (curExpense.compareTo(ZERO) > 0) {
            Map.Entry<String, BigDecimal> top = curByCategory.entrySet().stream()
                    .max(Map.Entry.comparingByValue()).orElse(null);
            if (top != null) {
                double share = top.getValue().divide(curExpense, 4, RoundingMode.HALF_UP).doubleValue() * 100.0;
                if (share >= 35.0 && top.getValue().compareTo(new BigDecimal("100")) >= 0) {
                    String cat = top.getKey();
                    SuggestionDto s = new SuggestionDto("OVERVIEW", cat + " dominates spending",
                            String.format(Locale.US, "%s accounts for %.0f%% of your expenses this month (%s). You may trim this category to boost savings.",
                                    cat, share, fmt(top.getValue())));
                    s.setCategoryName(cat);
                    s.setConfidence(0.7);
                    s.getMetrics().put("sharePercent", Math.round(share));
                    s.getMetrics().put("categoryTotal", top.getValue());
                    s.getMetrics().put("monthlyExpenses", curExpense);
                    suggestions.add(s);
                }
            }
        }

        // 4) Possible subscriptions (recurring similar descriptions)
        List<Transaction> last90Expenses = last90Tx.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .toList();
        Map<String, List<Transaction>> byNormDesc = last90Expenses.stream()
                .collect(Collectors.groupingBy(t -> normalizeDescription(t.getDescription())));
        for (Map.Entry<String, List<Transaction>> entry : byNormDesc.entrySet()) {
            List<Transaction> list = entry.getValue();
            // Require at least 3 occurrences across different weeks
            if (list.size() >= 3 && occurredInAtLeastKWeeks(list, 3)) {
                // Amount stability check
                BigDecimal avg = averageAmount(list);
                BigDecimal min = list.stream().map(Transaction::getAmount).min(Comparator.naturalOrder()).orElse(ZERO);
                BigDecimal max = list.stream().map(Transaction::getAmount).max(Comparator.naturalOrder()).orElse(ZERO);
                if (avg.compareTo(new BigDecimal("5")) >= 0) { // ignore noise
                    BigDecimal range = max.subtract(min);
                    if (range.compareTo(avg.multiply(new BigDecimal("0.2"))) <= 0) { // relatively stable
                        String label = prettifyDescription(entry.getKey());
                        SuggestionDto s = new SuggestionDto("SUBSCRIPTION", "Recurring payment: " + label,
                                "We detected a recurring expense (~" + fmt(avg) + ") for '" + label + "'. If it's not essential, consider canceling or switching to a cheaper plan.");
                        s.setConfidence(0.75);
                        s.setPotentialMonthlySavings(avg);
                        s.getMetrics().put("occurrences", list.size());
                        s.getMetrics().put("avgAmount", avg);
                        suggestions.add(s);
                    }
                }
            }
        }

        // 5) Uncategorized transactions
        long uncategorizedCount = currentTx.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> t.getCategory() == null)
                .count();
        if (uncategorizedCount >= 5 || (curExpense.compareTo(ZERO) > 0 && (double) uncategorizedCount / Math.max(1, currentTx.size()) > 0.2)) {
            SuggestionDto s = new SuggestionDto("HYGIENE", "Categorize your expenses",
                    "You have " + uncategorizedCount + " uncategorized expenses this month. Categorizing them improves reports and future suggestions.");
            s.setConfidence(0.6);
            s.getMetrics().put("uncategorizedCount", uncategorizedCount);
            suggestions.add(s);
        }

        // 6) If no transactions, nudge to start
        if (currentTx.isEmpty() && previousTx.isEmpty()) {
            SuggestionDto s = new SuggestionDto("GET_STARTED", "Start tracking",
                    "Add your first transactions to unlock personalized spending insights and suggestions.");
            s.setConfidence(0.8);
            suggestions.add(s);
        }

        // Rank and limit
        List<SuggestionDto> ranked = suggestions.stream()
                .sorted(Comparator.comparing(SuggestionDto::getConfidence, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .toList();

        // If still empty, add a gentle default
        if (ranked.isEmpty()) {
            SuggestionDto s = new SuggestionDto("INFO", "Looking good",
                    "No pressing insights this month. Keep tracking your spending to get more tailored suggestions.");
            s.setConfidence(0.5);
            ranked.add(s);
        }
        return ranked;
    }

    private BigDecimal sumByType(List<Transaction> tx, TransactionType type) {
        return tx.stream()
                .filter(t -> t.getType() == type)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private Map<String, BigDecimal> sumExpensesByCategory(List<Transaction> tx) {
        return tx.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() != null ? t.getCategory().getName() : "Uncategorized",
                        Collectors.mapping(Transaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
    }

    private double percentageChange(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        BigDecimal change = current.subtract(previous);
        return change.divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .doubleValue();
    }

    private static final Pattern DIGITS = Pattern.compile("\\d+");

    private String normalizeDescription(String desc) {
        if (desc == null) return "";
        String s = desc.toLowerCase(Locale.ROOT).trim();
        s = DIGITS.matcher(s).replaceAll(""); // remove numbers
        s = s.replaceAll("[\\p{Punct}]", " "); // punctuation to space
        s = s.replaceAll("\\s+", " ").trim();
        // keep first 4 tokens as signature
        String[] tokens = s.split(" ");
        int n = Math.min(tokens.length, 4);
        return Arrays.stream(tokens).limit(n).collect(Collectors.joining(" "));
    }

    private String prettifyDescription(String norm) {
        if (norm == null || norm.isBlank()) return "Recurring payment";
        // Capitalize words
        return Arrays.stream(norm.split(" "))
                .filter(t -> !t.isBlank())
                .map(t -> t.substring(0, 1).toUpperCase(Locale.ROOT) + (t.length() > 1 ? t.substring(1) : ""))
                .collect(Collectors.joining(" "));
    }

    private boolean occurredInAtLeastKWeeks(List<Transaction> list, int k) {
        Set<String> weeks = list.stream()
                .map(t -> YearMonth.from(t.getDate()) + ":" + t.getDate().get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()))
                .collect(Collectors.toSet());
        return weeks.size() >= k;
    }

    private BigDecimal averageAmount(List<Transaction> list) {
        if (list.isEmpty()) return ZERO;
        BigDecimal sum = list.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(new BigDecimal(list.size()), 2, RoundingMode.HALF_UP);
    }

    private String fmt(BigDecimal amount) {
        return "$" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
