package com.alberto.Spendee.sass.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.repository.UserRepository;

@Controller
public class HomeController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/")
    public String home() {
        return "redirect:/auth/login";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Get the authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Default values in case user info can't be retrieved
        String userEmail = "";
        String firstName = "";
        String lastName = "";

        // Try to get authenticated user details
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            // For JWT authentication, the principal might be the User object directly
            if (auth.getPrincipal() instanceof User) {
                User user = (User) auth.getPrincipal();
                userEmail = user.getEmail();
                firstName = user.getFirstName() != null ? user.getFirstName() : "";
                lastName = user.getLastName() != null ? user.getLastName() : "";
            } else {
                // Fallback: get email from authentication name
                userEmail = auth.getName();
                User user = userRepository.findByEmail(userEmail).orElse(null);
                if (user != null) {
                    firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    lastName = user.getLastName() != null ? user.getLastName() : "";
                }
            }
        }

        // Add attributes to model for display in view
        model.addAttribute("userFullName", firstName);
        model.addAttribute("userEmail", userEmail);
        // Add userPhotoUrl if photo exists
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && user.getPhoto() != null && user.getPhoto().length > 0) {
            model.addAttribute("userPhotoUrl", "/api/user/photo");
        } else {
            model.addAttribute("userPhotoUrl", null);
        }
        // Add activePage for sidebar highlighting
        model.addAttribute("activePage", "dashboard");

        return "dashboard/index";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "dashboard/admin";
    }

    @GetMapping("/transactions")
    public String transactions(Model model) {
        // Get the authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Default values in case user info can't be retrieved
        String userEmail = "";
        String firstName = "";
        String lastName = "";

        // Try to get authenticated user details
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            // For JWT authentication, the principal might be the User object directly
            if (auth.getPrincipal() instanceof User) {
                User user = (User) auth.getPrincipal();
                userEmail = user.getEmail();
                firstName = user.getFirstName() != null ? user.getFirstName() : "";
                lastName = user.getLastName() != null ? user.getLastName() : "";
            } else {
                // Fallback: get email from authentication name
                userEmail = auth.getName();
                User user = userRepository.findByEmail(userEmail).orElse(null);
                if (user != null) {
                    firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    lastName = user.getLastName() != null ? user.getLastName() : "";
                }
            }
        }

        // Add attributes to model for display in view
        model.addAttribute("userFullName", firstName + " " + lastName);
        model.addAttribute("userEmail", userEmail);
        model.addAttribute("activePage", "transactions"); // Set active page for sidebar highlighting

        // Add userPhotoUrl if photo exists
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && user.getPhoto() != null && user.getPhoto().length > 0) {
            model.addAttribute("userPhotoUrl", "/api/user/photo");
        } else {
            model.addAttribute("userPhotoUrl", null);
        }

        return "transactions";
    }

    @GetMapping("/categories")
    public String categories(Model model) {
        // Get the authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Default values in case user info can't be retrieved
        String userEmail = "";
        String firstName = "";
        String lastName = "";

        // Try to get authenticated user details
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            // For JWT authentication, the principal might be the User object directly
            if (auth.getPrincipal() instanceof User) {
                User user = (User) auth.getPrincipal();
                userEmail = user.getEmail();
                firstName = user.getFirstName() != null ? user.getFirstName() : "";
                lastName = user.getLastName() != null ? user.getLastName() : "";
            } else {
                // Fallback: get email from authentication name
                userEmail = auth.getName();
                User user = userRepository.findByEmail(userEmail).orElse(null);
                if (user != null) {
                    firstName = user.getFirstName() != null ? user.getFirstName() : "";
                    lastName = user.getLastName() != null ? user.getLastName() : "";
                }
            }
        }

        // Add attributes to model for display in view
        model.addAttribute("userFullName", firstName + " " + lastName);
        model.addAttribute("userEmail", userEmail);

        // Add userPhotoUrl if photo exists
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && user.getPhoto() != null && user.getPhoto().length > 0) {
            model.addAttribute("userPhotoUrl", "/api/user/photo");
        } else {
            model.addAttribute("userPhotoUrl", null);
        }

        return "categories";
    }
}
