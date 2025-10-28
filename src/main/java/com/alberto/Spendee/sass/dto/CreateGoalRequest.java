package com.alberto.Spendee.sass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGoalRequest {
    private String name;
    private BigDecimal targetAmount;
    private LocalDate startDate;
    private LocalDate deadline;
    private String icon;
}

