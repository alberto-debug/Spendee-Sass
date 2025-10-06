package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.config.ViewConfig;
import com.alberto.Spendee.sass.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/settings")
public class SettingsController {

    @Autowired
    private UserService userService;

    @Autowired
    private ViewConfig viewConfig;

    @GetMapping
    public String settingsPage(Model model) {
        viewConfig.configureView(model, "settings");
        return "settings";
    }

    @PostMapping("/api/user/update")
    @ResponseBody
    public Map<String, Object> updateUser(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam String email,
            @RequestParam(required = false) String password
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();
        boolean success = userService.updateUserInfo(currentEmail, firstName, lastName, email, password);
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        if (!success) {
            response.put("message", "Failed to update user info.");
        }
        return response;
    }
}
