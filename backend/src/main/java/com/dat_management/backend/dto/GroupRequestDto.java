package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GroupRequestDto {

    private Integer id;
    
    @NotBlank(message = "group_name is required")
    @JsonProperty("group_name")
    private String groupName;

    private Integer capacity;

    @JsonProperty("group_status")
    private String groupStatus;

    // Sessions nested under this group
    private List<SessionDto> sessions;
}