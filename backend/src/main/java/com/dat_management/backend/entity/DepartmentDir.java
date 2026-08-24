package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department_dir")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDir {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false,unique = true)
    private String deptName;

    private Boolean isDeleted = false;
}
