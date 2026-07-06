package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(
    name = "employee_skills",
    uniqueConstraints = @UniqueConstraint(columnNames = {
        "employee_id", "skill_id"
    })
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(precision = 4, scale = 2)
    private BigDecimal yearsOfExperience;

    private String experienceLevel;
}
