package com.dat_management.backend.dto.skillset;

import lombok.Data;
import java.util.List;

@Data
public class SkillSubCategoryResponseDto {
    private Integer id;
    private String subCategoryName;
    private List<SkillResponseDto> skills;
}