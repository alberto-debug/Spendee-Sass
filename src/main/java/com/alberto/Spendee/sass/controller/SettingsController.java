package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/settings")
public class SettingsController {

    @Autowired
    private UserService userService;

    @GetMapping
    public String settingsPage(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userService.findByEmail(email);

        // Set user information for the template
        String fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName()
                : (user != null) ? user.getFirstName() + " " + user.getLastName() : "User";

        String firstName = (user != null && user.getFirstName() != null) ? user.getFirstName() : "User";
        String userEmail = (user != null && user.getEmail() != null) ? user.getEmail() : "";

        // Add attributes needed by both the main template and fragments (navbar, sidebar)
        model.addAttribute("userFullName", fullName);
        model.addAttribute("userFirstName", firstName);
        model.addAttribute("userEmail", userEmail);
        model.addAttribute("activePage", "settings"); // For sidebar highlighting
        model.addAttribute("userPhotoUrl", "/api/user/photo"); // For user photo in sidebar

        return "settings";
    }

    @PostMapping("/api/user/update")
    @ResponseBody
    public Map<String, Object> updateUser(
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam(required = false) String password
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();
        boolean success = userService.updateUserInfo(currentEmail, fullName, email, password);
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        if (!success) {
            response.put("message", "Failed to update user info.");
        }
        return response;
    }
}
