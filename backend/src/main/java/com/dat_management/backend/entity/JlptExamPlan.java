package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "jlpt_exam_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JlptExamPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String examName;

    private String examLevel;

    @Column(nullable = false)
    private LocalDate examDate;

    private LocalDate registrationDeadline;
    private Boolean isActive = true;
}
