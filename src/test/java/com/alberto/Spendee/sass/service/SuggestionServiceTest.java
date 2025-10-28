package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.SuggestionDto;
import com.alberto.Spendee.sass.repository.TransactionRepository;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class SuggestionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SuggestionService suggestionService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
    }

    @Test
    void returnsGetStartedSuggestionWhenNoTransactions() {
        Mockito.when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        // Return empty lists for all date ranges
        Mockito.when(transactionRepository.findByUserAndDateBetween(eq(user), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        List<SuggestionDto> suggestions = suggestionService.getSuggestionsForUser("test@example.com");

        assertThat(suggestions).isNotEmpty();
        assertThat(suggestions.stream().map(SuggestionDto::getType))
                .anySatisfy(type -> assertThat(type).isEqualTo("GET_STARTED"));
    }
}

