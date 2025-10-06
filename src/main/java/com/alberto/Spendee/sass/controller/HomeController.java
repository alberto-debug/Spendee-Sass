package com.alberto.Spendee.sass.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.alberto.Spendee.sass.config.ViewConfig;

@Controller
public class HomeController {

    @Autowired
    private ViewConfig viewConfig;

    @GetMapping("/")
    public String home() {
        return "redirect:/auth/login";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard(Model model) {
        viewConfig.configureView(model, "admin");
        return "dashboard/admin";
    }

    @GetMapping("/transactions")
    public String transactions(Model model) {
        viewConfig.configureView(model, "transactions");
        return "transactions";
    }

    @GetMapping("/categories")
    public String categories(Model model) {
        viewConfig.configureView(model, "categories");
        return "categories";
    }
}
