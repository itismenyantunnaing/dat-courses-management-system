package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "skills",
    uniqueConstraints = @UniqueConstraint(columnNames = {
        "sub_category_id", "skill_name"
    })
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "sub_category_id", nullable = false)
    private SkillSubCategory subCategory;

    @Column(nullable = false)
    private String skillName;

    private Boolean isActive = true;
}
