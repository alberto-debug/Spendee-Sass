package com.alberto.Spendee.sass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MpesaTransactionDTO {
    private LocalDate date;
    private String description;
    private BigDecimal amount;
    private String type; // INCOME or EXPENSE
    private String transactionCode;
    private String details;
}

