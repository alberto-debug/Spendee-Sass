package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.CreateSpendingLimitRequest;
import com.alberto.Spendee.sass.dto.ResponseDTO;
import com.alberto.Spendee.sass.dto.SpendingLimitDto;
import com.alberto.Spendee.sass.service.SpendingLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/spending-limits")
public class SpendingLimitController {

    @Autowired
    private SpendingLimitService spendingLimitService;

    @GetMapping
    public ResponseEntity<List<SpendingLimitDto>> getUserSpendingLimits() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<SpendingLimitDto> limits = spendingLimitService.getUserSpendingLimits(userEmail);
        return ResponseEntity.ok(limits);
    }

    @PostMapping
    public ResponseEntity<ResponseDTO<SpendingLimitDto>> createSpendingLimit(@RequestBody CreateSpendingLimitRequest request) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            SpendingLimitDto limit = spendingLimitService.createSpendingLimit(userEmail, request);
            return ResponseEntity.ok(new ResponseDTO<>("Spending limit created successfully", limit, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseDTO<>(e.getMessage(), null, false));
        }
    }

    @PutMapping("/{limitId}")
    public ResponseEntity<ResponseDTO<SpendingLimitDto>> updateSpendingLimit(
            @PathVariable Long limitId, 
            @RequestBody CreateSpendingLimitRequest request) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            SpendingLimitDto limit = spendingLimitService.updateSpendingLimit(limitId, userEmail, request);
            return ResponseEntity.ok(new ResponseDTO<>("Spending limit updated successfully", limit, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseDTO<>(e.getMessage(), null, false));
        }
    }

    @DeleteMapping("/{limitId}")
    public ResponseEntity<ResponseDTO<String>> deleteSpendingLimit(@PathVariable Long limitId) {
        try {
            String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
            spendingLimitService.deleteSpendingLimit(limitId, userEmail);
            return ResponseEntity.ok(new ResponseDTO<>("Spending limit deleted successfully", null, true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ResponseDTO<>(e.getMessage(), null, false));
        }
    }
}
