package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "management_scores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ManagementScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    private Short managementExperienceLevel;
    private Short qcdScore;
    private Short reportConsultScore;
    private Short educationScore;
    private Float totalLevel;
}
