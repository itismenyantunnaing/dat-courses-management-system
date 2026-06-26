package com.dat_management.backend.service;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import com.dat_management.backend.dto.JapaneseDashboardDTO.*;
import com.dat_management.backend.entity.EmployeeJapaneseProfile;
import com.dat_management.backend.entity.TargetTerm;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.TargetTermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JapaneseDashboardService {

    private final EmployeeJapaneseProfileRepository profileRepository;
    private final TargetTermRepository targetTermRepository;

    private static final List<String> COMM_FULL_LABELS = List.of(
            "Level 0 | None",
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words",
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool",
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words",
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation",
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese",
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, can Participate/discuss with Japanese Customers",
            "Level 3 | Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal");

    public JapaneseDashboardDTO buildDashboard() {
        List<EmployeeJapaneseProfile> profiles = profileRepository.findAllWithEmployee();

        TargetTerm targetTerm = targetTermRepository.findByIsActiveTrue()
                .stream().findFirst().orElse(null);

        JapaneseDashboardDTO dto = new JapaneseDashboardDTO();

        if (targetTerm != null) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM-yyyy");
            dto.setTarget1Date(targetTerm.getTarget1Date().format(fmt));
            dto.setTarget2Date(targetTerm.getTarget2Date().format(fmt));
        }

        dto.setByDepartment(buildByCertifiedDept(profiles));
        dto.setByTeam(buildByTeam(profiles));
        dto.setByTeamComm(buildByTeamComm(profiles));
        dto.setCommCapability(buildCommCapability(profiles));
        dto.setNoCertMembers(buildNoCertMembers(profiles));

        return dto;
    }

    // ── Section 1: By Department ─────────────────────────────────────────────
    private List<DeptCertifiedRow> buildByCertifiedDept(List<EmployeeJapaneseProfile> profiles) {
        Map<String, Integer> deptIdMap = new HashMap<>();
        Map<String, DeptCertifiedRow> map = new LinkedHashMap<>();

        for (EmployeeJapaneseProfile p : profiles) {
            String dept = deptDatName(p);
            Integer deptId = getDepartmentId(p);
            deptIdMap.putIfAbsent(dept, deptId);

            DeptCertifiedRow row = map.computeIfAbsent(dept, k -> {
                DeptCertifiedRow r = new DeptCertifiedRow();
                r.setDepartment(k);
                r.setId(deptIdMap.get(k));
                return r;
            });
            
            String level = getCertificationLevel(p);
            switch (level) {
                case "N1" -> row.setN1(row.getN1() + 1);
                case "N2" -> row.setN2(row.getN2() + 1);
                case "N3" -> row.setN3(row.getN3() + 1);
                case "N4" -> row.setN4(row.getN4() + 1);
                case "N5" -> row.setN5(row.getN5() + 1);
                default -> {
                    // Count ONLY explicit "None" values
                    if (isExplicitlyNone(p.getJlptHighestLevel())) {
                        row.setNone(row.getNone() + 1);
                    }
                    // null, empty, invalid values are IGNORED (not counted)
                }
            }
            row.setTotal(row.getTotal() + 1);
        }

        DeptCertifiedRow total = new DeptCertifiedRow();
        total.setId(null);
        total.setDepartment("Grand Total");
        map.values().forEach(r -> {
            total.setN1(total.getN1() + r.getN1());
            total.setN2(total.getN2() + r.getN2());
            total.setN3(total.getN3() + r.getN3());
            total.setN4(total.getN4() + r.getN4());
            total.setN5(total.getN5() + r.getN5());
            total.setNone(total.getNone() + r.getNone());
            total.setTotal(total.getTotal() + r.getTotal());
        });

        List<DeptCertifiedRow> result = new ArrayList<>(map.values());
        result.add(total);
        return result;
    }

    // ── Section 2: By Team JLPT ──────────────────────────────────────────────
    private List<TeamLevelRow> buildByTeam(List<EmployeeJapaneseProfile> profiles) {
        Map<String, TeamLevelRow> map = new LinkedHashMap<>();

        for (EmployeeJapaneseProfile p : profiles) {
            String team = teamName(p);
            if (team.isEmpty())
                continue;

            Integer deptId = getDepartmentId(p);

            TeamLevelRow row = map.computeIfAbsent(team, k -> {
                TeamLevelRow r = new TeamLevelRow();
                r.setTeam(k);
                r.setDeptId(deptId);
                return r;
            });
            
            String currentLevel = getCertificationLevel(p);
            incrJlptCounts(row.getCurrent(), currentLevel);
            incrJlptCounts(row.getTarget1(), getCertificationLevel(p.getTarget1JlptNatLevel()));
            incrJlptCounts(row.getTarget2(), getCertificationLevel(p.getTarget2JlptNatLevel()));
        }

        TeamLevelRow total = new TeamLevelRow();
        total.setTeam("Grand Total");
        total.setDeptId(null);
        map.values().forEach(r -> sumJlptCounts(total, r));

        List<TeamLevelRow> result = new ArrayList<>(map.values());
        result.add(total);
        return result;
    }

    // ── Section 3: By Team Communication ─────────────────────────────────────
    private List<TeamCommRow> buildByTeamComm(List<EmployeeJapaneseProfile> profiles) {
        Map<String, TeamCommRow> map = new LinkedHashMap<>();

        for (EmployeeJapaneseProfile p : profiles) {
            String team = teamName(p);
            if (team.isEmpty())
                continue;
            TeamCommRow row = map.computeIfAbsent(team, k -> {
                TeamCommRow r = new TeamCommRow();
                r.setTeam(k);
                initCommMap(r.getCurrent());
                initCommMap(r.getTarget1());
                initCommMap(r.getTarget2());
                return r;
            });
            incrCommMap(row.getCurrent(), p.getCurrentCommunicationLevel());
            incrCommMap(row.getTarget1(), p.getTarget1CommunicationLevel());
            incrCommMap(row.getTarget2(), p.getTarget2CommunicationLevel());
        }

        TeamCommRow total = new TeamCommRow();
        total.setTeam("Grand Total");
        initCommMap(total.getCurrent());
        initCommMap(total.getTarget1());
        initCommMap(total.getTarget2());
        map.values().forEach(r -> sumCommRow(total, r));

        List<TeamCommRow> result = new ArrayList<>(map.values());
        result.add(total);
        return result;
    }

    // ── Section 4: Communication Capability totals ───────────────────────────
    private List<CommCapabilityRow> buildCommCapability(List<EmployeeJapaneseProfile> profiles) {
        Map<String, int[]> counts = new LinkedHashMap<>();
        COMM_FULL_LABELS.forEach(lbl -> counts.put(lbl, new int[3]));

        for (EmployeeJapaneseProfile p : profiles) {
            String cur = matchCommLabel(p.getCurrentCommunicationLevel());
            String t1 = matchCommLabel(p.getTarget1CommunicationLevel());
            String t2 = matchCommLabel(p.getTarget2CommunicationLevel());
            if (!cur.isEmpty())
                counts.get(cur)[0]++;
            if (!t1.isEmpty())
                counts.get(t1)[1]++;
            if (!t2.isEmpty())
                counts.get(t2)[2]++;
        }

        return counts.entrySet().stream().map(e -> {
            CommCapabilityRow r = new CommCapabilityRow();
            r.setLevel(e.getKey());
            r.setCurrent(e.getValue()[0]);
            r.setTarget1(e.getValue()[1]);
            r.setTarget2(e.getValue()[2]);
            return r;
        }).collect(Collectors.toList());
    }

    // ── Section 5: No Certified Members per Team ─────────────────────────────
    private List<NoCertMemberRow> buildNoCertMembers(List<EmployeeJapaneseProfile> profiles) {
    Map<String, NoCertMemberRow> map = new LinkedHashMap<>();

    for (EmployeeJapaneseProfile p : profiles) {
        String team = teamName(p);
        if (team.isEmpty())
            continue;
        
        NoCertMemberRow row = map.computeIfAbsent(team, k -> {
            NoCertMemberRow r = new NoCertMemberRow();
            r.setTeam(k);
            return r;
        });
        
        // Count ONLY explicit "None" values
        boolean notCertified = isExplicitlyNone(p.getJlptHighestLevel());
        
        if (notCertified) {
            row.setCurrent(row.getCurrent() + 1);
        }
        
        // Count target1 if it's "None" (no certification target)
        if (isExplicitlyNone(p.getTarget1JlptNatLevel())) {
            row.setTarget1(row.getTarget1() + 1);
        }
        
        // Count target2 if it's "None" (no certification target)
        if (isExplicitlyNone(p.getTarget2JlptNatLevel())) {
            row.setTarget2(row.getTarget2() + 1);
        }
    }

        NoCertMemberRow total = new NoCertMemberRow();
        total.setTeam("Grand Total");
        map.values().forEach(r -> {
            total.setCurrent(total.getCurrent() + r.getCurrent());
            total.setTarget1(total.getTarget1() + r.getTarget1());
            total.setTarget2(total.getTarget2() + r.getTarget2());
        });

        List<NoCertMemberRow> result = new ArrayList<>(map.values());
        result.add(total);
        return result;
    }

    // ── JLPT increment / sum helpers ─────────────────────────────────────────

    private void incrJlptCounts(JlptLevelCounts counts, String level) {
        if (level == null || level.isEmpty()) return;
        
        switch (level) {
            case "N1" -> counts.setN1(counts.getN1() + 1);
            case "N2" -> counts.setN2(counts.getN2() + 1);
            case "N3" -> counts.setN3(counts.getN3() + 1);
            case "N4" -> counts.setN4(counts.getN4() + 1);
            case "N5" -> counts.setN5(counts.getN5() + 1);
        }
    }

    private void sumJlptCounts(TeamLevelRow t, TeamLevelRow r) {
        t.getCurrent().setN1(t.getCurrent().getN1() + r.getCurrent().getN1());
        t.getCurrent().setN2(t.getCurrent().getN2() + r.getCurrent().getN2());
        t.getCurrent().setN3(t.getCurrent().getN3() + r.getCurrent().getN3());
        t.getCurrent().setN4(t.getCurrent().getN4() + r.getCurrent().getN4());
        t.getCurrent().setN5(t.getCurrent().getN5() + r.getCurrent().getN5());
        t.getTarget1().setN1(t.getTarget1().getN1() + r.getTarget1().getN1());
        t.getTarget1().setN2(t.getTarget1().getN2() + r.getTarget1().getN2());
        t.getTarget1().setN3(t.getTarget1().getN3() + r.getTarget1().getN3());
        t.getTarget1().setN4(t.getTarget1().getN4() + r.getTarget1().getN4());
        t.getTarget1().setN5(t.getTarget1().getN5() + r.getTarget1().getN5());
        t.getTarget2().setN1(t.getTarget2().getN1() + r.getTarget2().getN1());
        t.getTarget2().setN2(t.getTarget2().getN2() + r.getTarget2().getN2());
        t.getTarget2().setN3(t.getTarget2().getN3() + r.getTarget2().getN3());
        t.getTarget2().setN4(t.getTarget2().getN4() + r.getTarget2().getN4());
        t.getTarget2().setN5(t.getTarget2().getN5() + r.getTarget2().getN5());
    }

    // ── Communication map helpers ────────────────────────────────────────────

    private void initCommMap(Map<String, Integer> map) {
        for (String label : COMM_FULL_LABELS) {
            map.put(label, 0);
        }
    }

    private void incrCommMap(Map<String, Integer> map, String rawLevel) {
        String label = matchCommLabel(rawLevel);
        if (!label.isEmpty()) {
            map.merge(label, 1, Integer::sum);
        }
    }

    private void sumCommRow(TeamCommRow t, TeamCommRow r) {
        for (String label : COMM_FULL_LABELS) {
            t.getCurrent().merge(label, r.getCurrent().getOrDefault(label, 0), Integer::sum);
            t.getTarget1().merge(label, r.getTarget1().getOrDefault(label, 0), Integer::sum);
            t.getTarget2().merge(label, r.getTarget2().getOrDefault(label, 0), Integer::sum);
        }
    }

    // ── Communication matching helpers ──────────────────────────────────────

    private int commBucket(String raw) {
        if (raw == null || raw.isBlank())
            return -1;
        String r = raw.toLowerCase();
        if (r.contains("level 0") || r.contains("none"))
            return 0;
        if (r.contains("level 1") && r.contains("g1"))
            return 1;
        if (r.contains("level 1") && r.contains("g2"))
            return 2;
        if (r.contains("level 1") && r.contains("g3"))
            return 3;
        if (r.contains("level 2") && r.contains("g1"))
            return 4;
        if (r.contains("level 2") && r.contains("g2"))
            return 5;
        if (r.contains("level 2") && r.contains("g3"))
            return 6;
        if (r.contains("level 3"))
            return 7;
        return -1;
    }

    private String matchCommLabel(String raw) {
        int b = commBucket(raw);
        return b >= 0 ? COMM_FULL_LABELS.get(b) : "";
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    private String getCertificationLevel(EmployeeJapaneseProfile p) {
        return getCertificationLevel(p.getJlptHighestLevel());
    }

    private String getCertificationLevel(String val) {
        if (val == null || val.isBlank()) return "";
        String v = val.trim().toUpperCase();
        if (v.equals("NONE")) return "";
        return v.matches("N[1-5]") ? v : "";
    }

    private boolean isExplicitlyNone(String val) {
        if (val == null) return false;
        return val.trim().equalsIgnoreCase("None");
    }

    private String teamName(EmployeeJapaneseProfile p) {
        return p.getEmployee().getTeam() != null
                ? p.getEmployee().getTeam().getTeamName()
                : "";
    }

    private String deptDatName(EmployeeJapaneseProfile p) {
        if (p.getEmployee().getTeam() != null
                && p.getEmployee().getTeam().getDepartmentDat() != null) {
            return p.getEmployee().getTeam().getDepartmentDat().getDeptName();
        }
        return "Unknown";
    }

    private Integer getDepartmentId(EmployeeJapaneseProfile p) {
        if (p.getEmployee() != null
                && p.getEmployee().getTeam() != null
                && p.getEmployee().getTeam().getDepartmentDat() != null) {
            return p.getEmployee().getTeam().getDepartmentDat().getId();
        }
        return null;
    }
}