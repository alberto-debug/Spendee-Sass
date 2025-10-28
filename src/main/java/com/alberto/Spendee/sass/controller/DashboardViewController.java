package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.config.ViewConfig;
import com.alberto.Spendee.sass.service.TransactionService;
import com.alberto.Spendee.sass.dto.DashboardSummaryDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardViewController {

    @Autowired
    private ViewConfig viewConfig;

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();

        // Configure common view attributes
        viewConfig.configureView(model, "dashboard");

        // Get dashboard data
        DashboardSummaryDto dashboardSummary = transactionService.getDashboardSummary(userEmail);
        var recentTransactions = transactionService.getRecentTransactions(userEmail, 10); // Get last 10 transactions

        // Add data to the model
        model.addAttribute("totalIncome", dashboardSummary.getTotalIncome());
        model.addAttribute("totalExpenses", dashboardSummary.getTotalExpenses());
        model.addAttribute("recentTransactions", recentTransactions);

        // Add trend indicators
        model.addAttribute("incomeChange", dashboardSummary.getIncomeChange());
        model.addAttribute("expenseChange", dashboardSummary.getExpenseChange());
        model.addAttribute("monthlyBalance", dashboardSummary.getTotalIncome().subtract(dashboardSummary.getTotalExpenses()));

        return "dashboard/index";
    }
}
