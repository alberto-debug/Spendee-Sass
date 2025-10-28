package com.alberto.Spendee.sass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalDto {
    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private LocalDate startDate;
    private LocalDate deadline;
    private String icon;
    private LocalDateTime createdAt;
    private Boolean completed;
    private Double progressPercentage;
    private BigDecimal remainingAmount;
    private Integer daysRemaining;
}

