package com.alberto.Spendee.sass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportFilterDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String reportType; // INCOME, EXPENSE, BOTH
    private Long categoryId;
    private String groupBy; // DAILY, WEEKLY, MONTHLY, CATEGORY
}

