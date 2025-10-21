package com.alberto.Spendee.sass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDataDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netSavings;
    private List<TransactionSummaryDTO> transactions;
    private Map<String, BigDecimal> categoryBreakdown;
    private List<TimeSeriesDataDTO> timeSeriesData;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionSummaryDTO {
        private LocalDate date;
        private String description;
        private String category;
        private String type;
        private BigDecimal amount;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSeriesDataDTO {
        private String period;
        private BigDecimal income;
        private BigDecimal expense;
    }
}

