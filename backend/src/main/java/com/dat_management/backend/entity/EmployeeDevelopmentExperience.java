package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(
    name = "employee_development_experiences",
    uniqueConstraints = @UniqueConstraint(columnNames = {
        "employee_id", "development_type_id", "process_name"
    })
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDevelopmentExperience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "development_type_id", nullable = false)
    private DevelopmentType developmentType;

    @Column(columnDefinition = "TEXT")
    private String processName;

    @Column(precision = 4, scale = 1)
    private BigDecimal yearsOfExperience;
}
