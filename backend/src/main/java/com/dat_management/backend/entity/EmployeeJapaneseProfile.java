package com.dat_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_japanese_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeJapaneseProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    private String jlptHighestLevel;
    private String otherJapaneseLevel;
    private String currentLearningLevel;

    private Boolean wantToSitExam;
    private String examTargetLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "JLPT_NATTest")
    private JapaneseExamType jlptNatTest;

    private String currentCommunicationLevel;
    private String learningMethod;
    private String preferredLearningGroup;
    private String confidenceLevel;
    private Short languageSkillLevel;

    private String target1JlptNatLevel;
    private String target1CommunicationLevel;

    private String target2JlptNatLevel;
    private String target2CommunicationLevel;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    private void updateTimestamp() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum JapaneseExamType {
        JLPT,
        NAT_TEST,
        TOP_J,
        BJT
    }
}
