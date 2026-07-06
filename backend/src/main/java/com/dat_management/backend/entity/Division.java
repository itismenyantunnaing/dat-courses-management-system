package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "divisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Division {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String divisionName;

    private Boolean isDeleted = false;
}
