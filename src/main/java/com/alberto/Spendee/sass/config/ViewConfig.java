package com.alberto.Spendee.sass.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ui.Model;
import org.springframework.stereotype.Component;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.repository.UserRepository;

@Component
public class ViewConfig {

    @Autowired
    private UserRepository userRepository;

    public void configureView(Model model, String activePage) {
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

        // Add attributes needed by both the main template and fragments (navbar, sidebar)
        model.addAttribute("userFirstName", firstName);
        model.addAttribute("userLastName", lastName);
        model.addAttribute("userEmail", userEmail);
        model.addAttribute("userFullName", firstName + " " + lastName);
        model.addAttribute("activePage", activePage);

        // Add userPhotoUrl if photo exists
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user != null && user.getPhoto() != null && user.getPhoto().length > 0) {
            model.addAttribute("userPhotoUrl", "/api/user/photo");
        } else {
            model.addAttribute("userPhotoUrl", null);
        }
    }

}

