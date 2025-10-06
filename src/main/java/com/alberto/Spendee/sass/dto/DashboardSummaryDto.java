package com.alberto.Spendee.sass.dto;

import java.math.BigDecimal;

public class DashboardSummaryDto {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private double incomeChange;
    private double expenseChange;

    public DashboardSummaryDto(BigDecimal totalIncome, BigDecimal totalExpenses, double incomeChange, double expenseChange) {
        this.totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        this.totalExpenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
        this.incomeChange = incomeChange;
        this.expenseChange = expenseChange;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public double getIncomeChange() {
        return incomeChange;
    }

    public double getExpenseChange() {
        return expenseChange;
    }

    public BigDecimal getBalance() {
        return totalIncome.subtract(totalExpenses);
    }

    public double getMonthlyChange() {
        if (totalIncome.compareTo(BigDecimal.ZERO) == 0 && totalExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return incomeChange - expenseChange;
    }
}
