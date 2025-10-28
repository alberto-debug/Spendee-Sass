package com.alberto.Spendee.sass.domain.goal;

import com.alberto.Spendee.sass.domain.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Goal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal targetAmount;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal currentAmount = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private LocalDate startDate = LocalDate.now();

    @Column
    private LocalDate deadline;
    
    @Column(nullable = false)
    private String icon = "piggy-bank";
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private Boolean completed = false;
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        // Auto-mark as completed if current amount >= target
        if (this.currentAmount.compareTo(this.targetAmount) >= 0) {
            this.completed = true;
        }
    }
    
    public double getProgressPercentage() {
        if (targetAmount.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return currentAmount.divide(targetAmount, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }
}

