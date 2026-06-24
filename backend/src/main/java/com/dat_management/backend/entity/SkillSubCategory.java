package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skill_sub_categories",
    uniqueConstraints = @UniqueConstraint(columnNames = {
        "category_id", "sub_category_name"
    })
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SkillSubCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private SkillCategory category;

    @Column(unique = true)
    private String subCategoryName;

    private Boolean isActive = true;
}
