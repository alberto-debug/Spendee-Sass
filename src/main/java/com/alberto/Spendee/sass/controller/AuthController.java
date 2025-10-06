package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.role.Role;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.*;
import com.alberto.Spendee.sass.infra.security.TokenService;
import com.alberto.Spendee.sass.repository.RoleRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import com.alberto.Spendee.sass.service.AuthService;
import com.alberto.Spendee.sass.service.ValidationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository repository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ValidationService validationService;

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody LoginRequestDTO body) {
        User user = this.repository.findByEmail(body.email()).orElseThrow(() -> new RuntimeException("User not found"));
        if (passwordEncoder.matches(body.password(), user.getPassword())) {
            String token = this.tokenService.generateToken(user);
            String userLogged = "User Logged Successfully";
            logger.info("{} Name: {}", userLogged, user.getFirstName());
            return ResponseEntity.ok(new ResponseDTO(userLogged, token));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/register")
    public ResponseEntity register(@RequestBody RegistrationDto body) {
        try {
            // Validate the email and password
            validationService.validateEmail(body.getEmail());
            validationService.validatePassword(body.getPassword());

            // Check if the user already exists
            if (repository.findByEmail(body.getEmail()).isPresent()) {
                logger.error("User already exists with email {}", body.getEmail());
                return ResponseEntity.status(409).body("User already exists with this email");
            }

            // fetch role from database
            Role userRole = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Default Role Not Found"));

            // Create a new user and save to the database, and add the user role to new users.
            User newUser = new User();
            newUser.setFirstName(body.getFirstName());
            newUser.setLastName(body.getLastName());
            newUser.setEmail(body.getEmail());
            newUser.setPassword(passwordEncoder.encode(body.getPassword()));
            newUser.getRoles().add(userRole);
            repository.save(newUser);

            // Generate and return the token
            String token = tokenService.generateToken(newUser);

            String successMessage = "User Registered Successfully";
            logger.info("{} Name: {}", successMessage, newUser.getFirstName());
            return ResponseEntity.ok(new ResponseDTO(successMessage, token));
        } catch (ValidationService.ValidationException e) {
            logger.error("Validation error: {}", e.getMessage());
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during user registration", e);
            return ResponseEntity.status(500).body("An unexpected error occurred");
        }
    }

    @PostMapping("/admin/promote/{userId}")
    public ResponseEntity<String> makeAdmin(@PathVariable Long userId) {
        try {
            boolean success = authService.makeUserAdmin(userId);
            return new ResponseEntity<>("User promoted to admin successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
