package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.role.Role;
import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.RegistrationDto;
import com.alberto.Spendee.sass.repository.RoleRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final ValidationService validationService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            ValidationService validationService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.validationService = validationService;
    }

    @Transactional
    public User register(RegistrationDto registrationDto) {
        // Validate input
        validationService.validateEmail(registrationDto.getEmail());
        validationService.validatePassword(registrationDto.getPassword());

        // Check if user already exists
        if (userRepository.findByEmail(registrationDto.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists with email: " + registrationDto.getEmail());
        }

        // Get default user role
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default user role not found"));

        // Create new user
        User user = new User();
        user.setFirstName(registrationDto.getFirstName());
        user.setLastName(registrationDto.getLastName());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.getRoles().add(userRole);

        // Save and return the user
        return userRepository.save(user);
    }

    @Transactional
    public boolean makeUserAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("Admin role not found"));
        if (!user.getRoles().contains(adminRole)) {
            user.getRoles().add(adminRole);
            userRepository.save(user);
            return true;
        }
        return false;
    }
}
