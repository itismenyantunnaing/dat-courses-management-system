package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryDto {

    private Integer id;

    @JsonProperty("course_category_name")
    private String courseCategoryName;

    @JsonProperty("course_type")
    private String courseType;

    @JsonProperty("is_deleted")
    private Boolean isDeleted;
}