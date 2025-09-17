package com.alberto.Spendee.sass.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        
        if (status != null) {
            Integer statusCode = Integer.valueOf(status.toString());
            
            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                return "redirect:/auth/login";
            } else if (statusCode == HttpStatus.FORBIDDEN.value()) {
                return "redirect:/auth/login?error=access_denied";
            } else if (statusCode == HttpStatus.UNAUTHORIZED.value()) {
                return "redirect:/auth/login?error=unauthorized";
            }
        }
        
        return "redirect:/auth/login?error=general";
    }
}
