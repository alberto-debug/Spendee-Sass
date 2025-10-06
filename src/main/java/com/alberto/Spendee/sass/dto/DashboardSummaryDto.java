package com.alberto.Spendee.sass.dto;

import java.math.BigDecimal;

public class DashboardSummaryDto {
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private double incomeChange;
    private double expenseChange;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyExpenses;

    public DashboardSummaryDto(BigDecimal totalIncome, BigDecimal totalExpenses,
                              double incomeChange, double expenseChange,
                              BigDecimal monthlyIncome, BigDecimal monthlyExpenses) {
        this.totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        this.totalExpenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
        this.incomeChange = incomeChange;
        this.expenseChange = expenseChange;
        this.monthlyIncome = monthlyIncome != null ? monthlyIncome : BigDecimal.ZERO;
        this.monthlyExpenses = monthlyExpenses != null ? monthlyExpenses : BigDecimal.ZERO;
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

    public BigDecimal getMonthlyIncome() {
        return monthlyIncome;
    }

    public BigDecimal getMonthlyExpenses() {
        return monthlyExpenses;
    }

    public BigDecimal getTotalBalance() {
        return totalIncome.subtract(totalExpenses);
    }

    public BigDecimal getMonthlyBalance() {
        return monthlyIncome.subtract(monthlyExpenses);
    }

    public double getMonthlyChange() {
        if (monthlyIncome.compareTo(BigDecimal.ZERO) == 0 && monthlyExpenses.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return incomeChange - expenseChange;
    }
}
