package com.alberto.Spendee.sass.service;

import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class ValidationService {

    private static final String EMAIL_REGEX = "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    public void validateEmail(String email) throws ValidationException {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email cannot be empty");
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("Invalid email format");
        }
    }

    public void validatePassword(String password) throws ValidationException {
        if (password == null || password.trim().isEmpty()) {
            throw new ValidationException("Password cannot be empty");
        }

        if (password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters long");
        }

        // Check if password contains at least one uppercase letter
        if (!Pattern.compile("[A-Z]").matcher(password).find()) {
            throw new ValidationException("Password must contain at least one uppercase letter");
        }

        // Check if password contains at least one digit
        if (!Pattern.compile("\\d").matcher(password).find()) {
            throw new ValidationException("Password must contain at least one digit");
        }
    }

    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }
}
