package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "target_terms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TargetTerm {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private LocalDate target1Date;

    @Column(nullable = false)
    private LocalDate target2Date;

    @Column(nullable =false)
    private LocalDate examDate;
    private Boolean isActive = true;

      public boolean isTarget1DatePassed() {
        LocalDate today = LocalDate.now();
        return today.isAfter(target1Date) || today.isEqual(target1Date);
    }

    // Method to check if target2 date has passed
    public boolean isTarget2DatePassed() {
        LocalDate today = LocalDate.now();
        return today.isAfter(target2Date) || today.isEqual(target2Date);
    }
}
