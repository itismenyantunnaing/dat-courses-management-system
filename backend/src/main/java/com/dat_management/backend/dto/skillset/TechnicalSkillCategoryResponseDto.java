package com.dat_management.backend.dto.skillset;

import lombok.Data;
import java.util.List;

@Data
public class TechnicalSkillCategoryResponseDto {
    private Integer id;
    private String categoryName;
    private List<SkillSubCategoryResponseDto> skillSubCategories;
}