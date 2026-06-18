package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Holiday {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private LocalDate holidayDate;

    @Column(nullable = false)
    private String holidayName;

    @Column(nullable = false)
    private boolean isDeleted = false;
}
