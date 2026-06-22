package com.dat_management.backend.dto;

import com.dat_management.backend.entity.EmployeeJapaneseProfile.JapaneseExamType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EmployeeJapaneseProfileResponse {
   
    private Integer id;
    private String employee_id;
    private String jlptHighestLevel;
    private String otherJapaneseLevel;
    private String preferredLearningGroup;

    private String currentCommunicationLevel;

    private String target1JlptNatLevel;
    private String target1CommunicationLevel;

    private String target2JlptNatLevel;
    private String target2CommunicationLevel;

    private String currentLearningLevel;
    private String learningMethod;

    private Boolean wantToSitExam;
    private String examTargetLevel;
    private JapaneseExamType jlptNatTest;
    private String confidenceLevel;
    // private Short languageSkillLevel;

}
