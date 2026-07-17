// GroupEnrollmentUpdateDto.java
package com.dat_management.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupEnrollmentUpdateDto {
    private Integer enrollmentId;
    private Integer newGroupId;
    private Integer employeeId;
}