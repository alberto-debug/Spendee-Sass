package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.config.ViewConfig;
import com.alberto.Spendee.sass.service.TransactionService;
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
        var dashboardSummary = transactionService.getDashboardSummary(userEmail);
        var recentTransactions = transactionService.getRecentTransactions(userEmail, 5); // Get last 5 transactions

        // Add data to the model
        model.addAttribute("totalIncome", dashboardSummary.getTotalIncome());
        model.addAttribute("totalExpenses", dashboardSummary.getTotalExpenses());
        model.addAttribute("recentTransactions", recentTransactions);
        model.addAttribute("monthlyChange", dashboardSummary.getMonthlyChange());
        
        return "dashboard/index";
    }
}
