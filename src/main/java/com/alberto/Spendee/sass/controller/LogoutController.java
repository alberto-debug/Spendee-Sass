package com.alberto.Spendee.sass.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class LogoutController {

    @PostMapping("/api/auth/logout")
    public String apiLogout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        return performLogout(request, response, auth);
    }

    @GetMapping("/logout")
    public String webLogout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        return performLogout(request, response, auth);
    }

    private String performLogout(HttpServletRequest request, HttpServletResponse response, Authentication auth) {
        // Clear Spring Security context
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }

        // Invalidate session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Clear all authentication-related cookies
        clearCookie(response, "JSESSIONID");
        clearCookie(response, "jwt_token");
        clearCookie(response, "remember-me");

        // Add cache control headers to prevent caching of protected pages
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

        return "redirect:/auth/login?logout=true";
    }

    private void clearCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        cookie.setSecure(false); // Set to true in production with HTTPS
        response.addCookie(cookie);
    }
}
