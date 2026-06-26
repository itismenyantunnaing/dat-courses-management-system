package com.dat_management.backend.dto;

import lombok.Data;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
public class JapaneseDashboardDTO {

    private List<DeptCertifiedRow> byDepartment;
    private List<TeamLevelRow> byTeam;
    private List<TeamCommRow> byTeamComm;
    private List<CommCapabilityRow> commCapability;
    private List<NoCertMemberRow> noCertMembers;
    private String target1Date;
    private String target2Date;

    // ── Section 1: By Department (DepartmentDat) ──
    @Data
    public static class DeptCertifiedRow {
        private Integer id;
        private String department;
        private int n1, n2, n3, n4, n5, none, total;
    }

    // ── Section 2: By Team JLPT levels ──
    @Data
    public static class JlptLevelCounts {
        private int N1, N2, N3, N4, N5;
    }

    @Data
    public static class TeamLevelRow {
        private Integer deptId;
        private String team;
        private JlptLevelCounts current = new JlptLevelCounts();
        private JlptLevelCounts target1 = new JlptLevelCounts();
        private JlptLevelCounts target2 = new JlptLevelCounts();
    }

    // ── Section 3: By Team Communication ──
    @Data
    public static class CommLevelCounts {
        private Map<String, Integer> levels = new LinkedHashMap<>();
    }

    @Data
    public static class TeamCommRow {
        private String team;
        private Map<String, Integer> current = new LinkedHashMap<>();
        private Map<String, Integer> target1 = new LinkedHashMap<>();
        private Map<String, Integer> target2 = new LinkedHashMap<>();
    }

    // ── Section 4: Communication Capability totals ──
    @Data
    public static class CommCapabilityRow {
        private String level;
        private int current, target1, target2;
    }

    // ── Section 5: No Cert Members per Team ──
    @Data
    public static class NoCertMemberRow {
        private String team;
        private int current, target1, target2;
    }
}