package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.config.ViewConfig;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportViewController {

    private final CategoryService categoryService;
    private final ViewConfig viewConfig;

    @GetMapping
    public String reportsPage(@AuthenticationPrincipal User user, Model model) {
        // Configure common view attributes (userFullName, userEmail, activePage, etc.)
        viewConfig.configureView(model, "reports");

        // Add categories for the filter dropdown
        model.addAttribute("categories", categoryService.getCategoriesByUser(user.getEmail()));

        return "reports";
    }
}

