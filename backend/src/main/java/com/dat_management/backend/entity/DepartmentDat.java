package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department_dat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "division_id", nullable = false)
    private Division division;

    @Column(nullable = false, unique = true)
    private String deptCode;

    @Column(nullable = false)
    private String deptName;

    private Boolean isDeleted = false;
}
