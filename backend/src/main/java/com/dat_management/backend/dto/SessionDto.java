package com.dat_management.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionDto {

    private Integer id;

    @JsonProperty("session_no")
    private Short sessionNo;

    @JsonProperty("session_date")
    private LocalDate sessionDate;

    @JsonProperty("start_time")
    private LocalTime startTime;

    @JsonProperty("end_time")
    private LocalTime endTime;

    @JsonProperty("session_status")
    private String sessionStatus;
}