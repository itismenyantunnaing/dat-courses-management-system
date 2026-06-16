package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "development_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DevelopmentType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String developmentTypeName;

    private Boolean isActive = true;
}
