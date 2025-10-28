package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.CreateGoalRequest;
import com.alberto.Spendee.sass.dto.GoalDto;
import com.alberto.Spendee.sass.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    
    @Autowired
    private GoalService goalService;
    
    @GetMapping
    public ResponseEntity<List<GoalDto>> getUserGoals() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<GoalDto> goals = goalService.getUserGoals(userEmail);
        return ResponseEntity.ok(goals);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GoalDto> getGoal(@PathVariable Long id) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        GoalDto goal = goalService.getGoalById(userEmail, id);
        return ResponseEntity.ok(goal);
    }
    
    @PostMapping
    public ResponseEntity<GoalDto> createGoal(@RequestBody CreateGoalRequest request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        GoalDto goal = goalService.createGoal(userEmail, request);
        return ResponseEntity.ok(goal);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GoalDto> updateGoal(@PathVariable Long id, @RequestBody CreateGoalRequest request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        GoalDto goal = goalService.updateGoal(userEmail, id, request);
        return ResponseEntity.ok(goal);
    }
    
    @PatchMapping("/{id}/progress")
    public ResponseEntity<GoalDto> updateProgress(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        BigDecimal amount = body.get("amount");
        GoalDto goal = goalService.updateGoalProgress(userEmail, id, amount);
        return ResponseEntity.ok(goal);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        goalService.deleteGoal(userEmail, id);
        return ResponseEntity.noContent().build();
    }
}

