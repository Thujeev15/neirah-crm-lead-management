
package com.neirah.backend.controller;

import com.neirah.backend.dto.UserSummaryResponse;
import com.neirah.backend.entity.Role;
import com.neirah.backend.entity.User;
import com.neirah.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/sales-reps")
    @PreAuthorize("hasRole('MANAGER')")
    public List<UserSummaryResponse> getSalesReps() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == Role.SALES_REP)
                .map(UserSummaryResponse::from)
                .toList();
    }

    @PutMapping("/reset-password/{email}")
    @PreAuthorize("hasRole('MANAGER')")
    @Transactional
    public Map<String, String> resetSalesRepPassword(
            @PathVariable String email,
            @RequestBody Map<String, String> request
    ) {
        String normalizedEmail = email.trim().toLowerCase();
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters"
            );
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        if (user.getRole() != Role.SALES_REP) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only Sales Rep passwords can be reset here"
            );
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return Map.of("message", "Sales Rep password reset successfully");
    }
}
