package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.transaction.Transaction;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.ReportDataDTO;
import com.alberto.Spendee.sass.dto.ReportFilterDTO;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;

    public ReportDataDTO generateReport(ReportFilterDTO filter, User user) {
        LocalDate startDate = filter.getStartDate() != null ? filter.getStartDate() : LocalDate.now().minusMonths(1);
        LocalDate endDate = filter.getEndDate() != null ? filter.getEndDate() : LocalDate.now();

        List<Transaction> transactions = transactionRepository.findByUserAndDateBetween(
            user,
            startDate,
            endDate
        );

        // Apply filters
        if (filter.getCategoryId() != null) {
            transactions = transactions.stream()
                .filter(t -> t.getCategory() != null && t.getCategory().getId().equals(filter.getCategoryId()))
                .collect(Collectors.toList());
        }

        if (filter.getReportType() != null && !filter.getReportType().equals("BOTH")) {
            transactions = transactions.stream()
                .filter(t -> t.getType().name().equals(filter.getReportType()))
                .collect(Collectors.toList());
        }

        // Calculate totals
        BigDecimal totalIncome = transactions.stream()
            .filter(t -> t.getType().name().equals("INCOME"))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
            .filter(t -> t.getType().name().equals("EXPENSE"))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netSavings = totalIncome.subtract(totalExpense);

        // Category breakdown
        Map<String, BigDecimal> categoryBreakdown = transactions.stream()
            .filter(t -> t.getCategory() != null)
            .collect(Collectors.groupingBy(
                t -> t.getCategory().getName(),
                Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
            ));

        // Time series data
        List<ReportDataDTO.TimeSeriesDataDTO> timeSeriesData = generateTimeSeriesData(
            transactions,
            startDate,
            endDate,
            filter.getGroupBy() != null ? filter.getGroupBy() : "DAILY"
        );

        // Transaction summaries
        List<ReportDataDTO.TransactionSummaryDTO> transactionSummaries = transactions.stream()
            .sorted(Comparator.comparing(Transaction::getDate).reversed())
            .map(t -> new ReportDataDTO.TransactionSummaryDTO(
                t.getDate(),
                t.getDescription(),
                t.getCategory() != null ? t.getCategory().getName() : "Uncategorized",
                t.getType().name(),
                t.getAmount()
            ))
            .collect(Collectors.toList());

        ReportDataDTO report = new ReportDataDTO();
        report.setStartDate(startDate);
        report.setEndDate(endDate);
        report.setTotalIncome(totalIncome);
        report.setTotalExpense(totalExpense);
        report.setNetSavings(netSavings);
        report.setTransactions(transactionSummaries);
        report.setCategoryBreakdown(categoryBreakdown);
        report.setTimeSeriesData(timeSeriesData);

        return report;
    }

    private List<ReportDataDTO.TimeSeriesDataDTO> generateTimeSeriesData(
            List<Transaction> transactions,
            LocalDate startDate,
            LocalDate endDate,
            String groupBy) {

        Map<String, ReportDataDTO.TimeSeriesDataDTO> dataMap = new LinkedHashMap<>();

        DateTimeFormatter formatter;
        switch (groupBy) {
            case "WEEKLY":
                formatter = DateTimeFormatter.ofPattern("'Week' w yyyy");
                break;
            case "MONTHLY":
                formatter = DateTimeFormatter.ofPattern("MMM yyyy");
                break;
            default: // DAILY
                formatter = DateTimeFormatter.ofPattern("MMM dd");
                break;
        }

        for (Transaction transaction : transactions) {
            String period = transaction.getDate().format(formatter);

            dataMap.putIfAbsent(period, new ReportDataDTO.TimeSeriesDataDTO(
                period, BigDecimal.ZERO, BigDecimal.ZERO
            ));

            ReportDataDTO.TimeSeriesDataDTO data = dataMap.get(period);
            if (transaction.getType().name().equals("INCOME")) {
                data.setIncome(data.getIncome().add(transaction.getAmount()));
            } else {
                data.setExpense(data.getExpense().add(transaction.getAmount()));
            }
        }

        return new ArrayList<>(dataMap.values());
    }
}

