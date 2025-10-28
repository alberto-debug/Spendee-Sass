package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.dto.SuggestionDto;
import com.alberto.Spendee.sass.service.SuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/suggestions")
public class SuggestionsController {

    @Autowired
    private SuggestionService suggestionService;

    @GetMapping
    public ResponseEntity<List<SuggestionDto>> getSuggestions() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        List<SuggestionDto> suggestions = suggestionService.getSuggestionsForUser(userEmail);
        return ResponseEntity.ok(suggestions);
    }
}

