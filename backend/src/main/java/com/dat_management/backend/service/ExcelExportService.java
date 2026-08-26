package com.dat_management.backend.service;

import com.dat_management.backend.dto.EmployeeExportDto;
import com.dat_management.backend.entity.Employee;
import com.dat_management.backend.entity.EmployeeDevelopmentExperience;
import com.dat_management.backend.entity.EmployeeSkill;
import com.dat_management.backend.entity.Skill;
import com.dat_management.backend.entity.SkillCategory;
import com.dat_management.backend.entity.SkillSubCategory;
import com.dat_management.backend.repository.EmployeeDevelopmentExperienceRepository;
import com.dat_management.backend.repository.EmployeeRepository;
import com.dat_management.backend.repository.EmployeeSkillRepository;
import com.dat_management.backend.repository.EmployeeJapaneseProfileRepository;
import com.dat_management.backend.repository.ManagementScoreRepository;
import com.dat_management.backend.repository.SkillRepository;
import com.dat_management.backend.util.ExcelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExcelExportService {

    private static final String TEMPLATE_PATH =
        "templates/_DAT_ Skills Set_Translated (2).xlsx";

    private static final String TEMPLATE_MAIN_SHEET = "Sheet1";

    private static final int TEMPLATE_DATA_START_ROW = 9;

    private static final int TEMPLATE_SKILL_HEADER_ROW = 7;

    private static final int TEMPLATE_SKILL_START_COLUMN = 23;

    private final EmployeeRepository employeeRepository;

    private final EmployeeSkillRepository employeeSkillRepository;

    private final EmployeeDevelopmentExperienceRepository
        employeeDevelopmentExperienceRepository;

    private final ManagementScoreRepository managementScoreRepository;

    private final EmployeeJapaneseProfileRepository employeeJapaneseProfileRepository;

    private final SkillRepository skillRepository;

    private final JapaneseTranslateService japaneseDictionaryService;


    // ============================================================
    // PUBLIC EXPORT METHODS
    // ============================================================

    public ByteArrayInputStream exportAllEmployees() throws IOException {
        return exportAllEmployees("en");
    }


    public ByteArrayInputStream exportAllEmployees(
        String language
    ) throws IOException {

        log.info(
            "Starting Excel export for all employees, language={}",
            language
        );

        List<Employee> employees =
            employeeRepository.findByIsDeletedFalse();

        return exportEmployees(
            employees,
            "All Employees",
            language
        );
    }


    public ByteArrayInputStream exportEmployee(
        String employeeId
    ) throws IOException {

        return exportEmployee(employeeId, "en");
    }


    public ByteArrayInputStream exportEmployee(
        String employeeId,
        String language
    ) throws IOException {

        log.info(
            "Starting Excel export for employee: {}, language={}",
            employeeId,
            language
        );

        Employee employee =
            employeeRepository.findById(employeeId)
                .orElseThrow(
                    () -> new RuntimeException(
                        "Employee not found: " + employeeId
                    )
                );

        return exportEmployees(
            List.of(employee),
            "Employee_" + employeeId,
            language
        );
    }


    public ByteArrayInputStream exportEmployeesByDepartment(
        Integer departmentDirId
    ) throws IOException {

        return exportEmployeesByDepartment(
            departmentDirId,
            "en"
        );
    }


    public ByteArrayInputStream exportEmployeesByDepartment(
        Integer departmentDirId,
        String language
    ) throws IOException {

        log.info(
            "Starting Excel export for department: {}, language={}",
            departmentDirId,
            language
        );

        List<Employee> employees =
            employeeRepository.findByDepartmentDirId(
                departmentDirId
            );

        return exportEmployees(
            employees,
            "Department_" + departmentDirId,
            language
        );
    }


    public ByteArrayInputStream exportEmployeesByTeam(
        Integer teamId
    ) throws IOException {

        return exportEmployeesByTeam(teamId, "en");
    }


    public ByteArrayInputStream exportEmployeesByTeam(
        Integer teamId,
        String language
    ) throws IOException {

        log.info(
            "Starting Excel export for team: {}, language={}",
            teamId,
            language
        );

        List<Employee> employees =
            employeeRepository.findByTeamId(teamId);

        return exportEmployees(
            employees,
            "Team_" + teamId,
            language
        );
    }


    // ============================================================
    // TEMPLATE EXPORT
    // ============================================================

    public ByteArrayInputStream exportTemplate()
        throws IOException {

        log.info("Starting Excel template export");

        try (
            InputStream templateStream =
                new ClassPathResource(
                    TEMPLATE_PATH
                ).getInputStream();

            Workbook workbook =
                WorkbookFactory.create(templateStream)
        ) {

            Sheet employeeSheet =
                workbook.getSheet(TEMPLATE_MAIN_SHEET);

            if (employeeSheet == null) {
                throw new IOException(
                    "Template sheet not found: "
                        + TEMPLATE_MAIN_SHEET
                );
            }

            Row skillHeaderRow =
                employeeSheet.getRow(
                    TEMPLATE_SKILL_HEADER_ROW
                );

            prepareSkillColumns(
                employeeSheet,
                skillHeaderRow
            );

            clearExistingDataRows(
                employeeSheet,
                TEMPLATE_DATA_START_ROW
            );

            ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

            workbook.write(outputStream);

            return new ByteArrayInputStream(
                outputStream.toByteArray()
            );
        }
    }


    // ============================================================
    // IMPORTANT FIX:
    // exportEmployees NOW HAS LANGUAGE PARAMETER
    // ============================================================

    private ByteArrayInputStream exportEmployees(
        List<Employee> employees,
        String fileName,
        String language
    ) throws IOException {

        List<EmployeeExportDto> exportDtos =
            new ArrayList<>();

        if (employees == null) {
            employees = Collections.emptyList();
        }

        for (Employee employee : employees) {

            if (employee == null) {
                continue;
            }

            try {

                exportDtos.add(
                    convertToExportDto(employee)
                );

            } catch (Exception e) {

                log.error(
                    "Error converting employee {}: {}",
                    employee.getId(),
                    e.getMessage(),
                    e
                );
            }
        }

        // IMPORTANT:
        // language is passed here.
        return writeToExcel(
            exportDtos,
            fileName,
            language
        );
    }


    // ============================================================
    // DTO CONVERSION
    // ============================================================

    private EmployeeExportDto convertToExportDto(
        Employee employee
    ) {

        EmployeeExportDto.EmployeeExportDtoBuilder builder =
            EmployeeExportDto.builder()
                .id(employee.getId())
                .name(employee.getName())
                .rank(employee.getPosition());

        if (employee.getDepartmentDir() != null) {

            builder.departmentDirName(
                employee.getDepartmentDir()
                    .getDeptName()
            );
        }

        if (employee.getTeam() != null) {

            builder.teamName(
                employee.getTeam()
                    .getTeamName()
            );
        }

        builder.isCorePersonnel(
            Boolean.TRUE.equals(
                employee.getIsCorePersonnel()
            )
                ? "Yes"
                : "No"
        );

        builder.hasJapanBusinessTrip(
            Boolean.TRUE.equals(
                employee.getHasJapanBusinessTrip()
            )
                ? "Yes"
                : "No"
        );


        managementScoreRepository
            .findByEmployeeId(employee.getId())
            .ifPresent(score -> {

                builder.managementExperienceLevel(
                    String.valueOf(
                        score.getManagementExperienceLevel()
                    )
                );

                builder.qcdScore(
                    String.valueOf(
                        score.getQcdScore()
                    )
                );

                builder.reportConsultScore(
                    String.valueOf(
                        score.getReportConsultScore()
                    )
                );

                builder.educationScore(
                    String.valueOf(
                        score.getEducationScore()
                    )
                );

                builder.totalLevel(
                    String.valueOf(
                        score.getTotalLevel()
                    )
                );
            });


        employeeJapaneseProfileRepository
            .findByEmployeeId(employee.getId())
            .ifPresent(profile -> {
                builder.languageLevel(
                    profile.getLanguageSkillLevel() == null
                        ? ""
                        : String.valueOf(profile.getLanguageSkillLevel())
                );
                builder.jlptLevel(
                    profile.getJlptHighestLevel() == null
                        ? ""
                        : profile.getJlptHighestLevel()
                );
            });

        builder.developmentExperiences(
            getDevelopmentExperiences(employee)
        );

        builder.technicalSkills(
            getTechnicalSkills(employee)
        );

        return builder.build();
    }


    // ============================================================
    // DEVELOPMENT EXPERIENCES
    // ============================================================

    private Map<
        String,
        List<EmployeeExportDto.ProcessExport>
    > getDevelopmentExperiences(
        Employee employee
    ) {

        Map<
            String,
            List<EmployeeExportDto.ProcessExport>
        > result =
            new LinkedHashMap<>();

        List<EmployeeDevelopmentExperience> experiences =
            employeeDevelopmentExperienceRepository
                .findByEmployeeId(employee.getId());

        for (
            EmployeeDevelopmentExperience exp
            : experiences
        ) {

            String systemType =
                normalizeDevelopmentType(
                    exp.getDevelopmentType() != null
                        ? exp.getDevelopmentType()
                            .getDevelopmentTypeName()
                        : null
                );

            String yearsOfExperience =
                exp.getYearsOfExperience() != null
                    ? exp.getYearsOfExperience().toString()
                    : "";

            String processName =
                exp.getProcessName();

            if (
                !looksNumeric(yearsOfExperience)
                    && looksNumeric(processName)
            ) {

                String swappedYears =
                    processName;

                processName =
                    yearsOfExperience;

                yearsOfExperience =
                    swappedYears;
            }

            EmployeeExportDto.ProcessExport processExport =
                EmployeeExportDto.ProcessExport.builder()
                    .systemName(
                        exp.getDevelopmentType() != null
                            ? exp.getDevelopmentType()
                                .getDevelopmentTypeName()
                            : ""
                    )
                    .processName(processName)
                    .yearsOfExperience(
                        yearsOfExperience.isBlank()
                            ? "0"
                            : yearsOfExperience
                    )
                    .hostDistributed("")
                    .onlineBatch("")
                    .build();

            result
                .computeIfAbsent(
                    systemType,
                    k -> new ArrayList<>()
                )
                .add(processExport);
        }

        return result;
    }


    // ============================================================
    // TECHNICAL SKILLS
    // ============================================================

    private List<EmployeeExportDto.SkillExport>
    getTechnicalSkills(Employee employee) {

        List<EmployeeExportDto.SkillExport> result =
            new ArrayList<>();

        List<EmployeeSkill> employeeSkills =
            employeeSkillRepository
                .findByEmployeeId(employee.getId());

        for (EmployeeSkill empSkill : employeeSkills) {

            if (empSkill == null) {
                continue;
            }

            Skill skill =
                empSkill.getSkill();

            if (skill == null) {
                continue;
            }

            SkillSubCategory subCategory =
                skill.getSubCategory();

            SkillCategory category =
                subCategory != null
                    ? subCategory.getCategory()
                    : null;

            String yearsOfExperience =
                empSkill.getYearsOfExperience() != null
                    ? empSkill.getYearsOfExperience().toString()
                    : "";

            String experienceType =
                empSkill.getExperienceLevel();

            if (
                !looksNumeric(yearsOfExperience)
                    && looksNumeric(experienceType)
            ) {

                String swappedYears =
                    experienceType;

                experienceType =
                    yearsOfExperience;

                yearsOfExperience =
                    swappedYears;
            }

            EmployeeExportDto.SkillExport skillExport =
                EmployeeExportDto.SkillExport.builder()
                    .skillName(
                        skill.getSkillName()
                    )
                    .subCategory(
                        subCategory != null
                            ? subCategory
                                .getSubCategoryName()
                            : ""
                    )
                    .category(
                        category != null
                            ? category.getCategoryName()
                            : ""
                    )
                    .yearsOfExperience(
                        yearsOfExperience.isBlank()
                            ? "0"
                            : yearsOfExperience
                    )
                    .experienceType(
                        experienceType
                    )
                    .position("")
                    .numberOfManagers("")
                    .build();

            result.add(skillExport);
        }

        return result;
    }


    // ============================================================
    // IMPORTANT FIX:
    // writeToExcel ACCEPTS LANGUAGE
    // ============================================================

    private ByteArrayInputStream writeToExcel(
        List<EmployeeExportDto> dtos,
        String fileName,
        String language
    ) throws IOException {

        try (
            InputStream templateStream =
                new ClassPathResource(
                    TEMPLATE_PATH
                ).getInputStream();

            Workbook workbook =
                WorkbookFactory.create(templateStream)
        ) {

            Sheet employeeSheet =
                workbook.getSheet(
                    TEMPLATE_MAIN_SHEET
                );

            if (employeeSheet == null) {

                throw new IOException(
                    "Template sheet not found: "
                        + TEMPLATE_MAIN_SHEET
                );
            }

            Row skillHeaderRow =
                employeeSheet.getRow(
                    TEMPLATE_SKILL_HEADER_ROW
                );

            Map<String, Integer> skillColumnMap =
                prepareSkillColumns(
                    employeeSheet,
                    skillHeaderRow
                );

            populateTemplateSheet(
                employeeSheet,
                dtos,
                skillColumnMap
            );

            /*
             * IMPORTANT:
             * The workbook structure is built in English.
             * Translation happens only after all headers/data
             * have been created.
             */
            if (isJapanese(language)) {

                translateWorkbookToJapanese(
                    workbook
                );
            }

            ByteArrayOutputStream outputStream =
                new ByteArrayOutputStream();

            workbook.write(outputStream);

            return new ByteArrayInputStream(
                outputStream.toByteArray()
            );
        }
    }


    // ============================================================
    // POPULATE TEMPLATE
    // ============================================================

    private void populateTemplateSheet(
        Sheet sheet,
        List<EmployeeExportDto> dtos,
        Map<String, Integer> skillColumnMap
    ) {

        Row templateRow =
            sheet.getRow(
                TEMPLATE_DATA_START_ROW
            );

        if (templateRow == null) {

            throw new IllegalStateException(
                "Template data row not found at index "
                    + (TEMPLATE_DATA_START_ROW + 1)
            );
        }

        clearExistingDataRows(
            sheet,
            TEMPLATE_DATA_START_ROW
        );

        int rowIndex =
            TEMPLATE_DATA_START_ROW;

        if (dtos == null) {
            return;
        }

        for (EmployeeExportDto dto : dtos) {

            if (dto == null) {
                continue;
            }

            Row row =
                sheet.getRow(rowIndex);

            if (row == null) {
                row = sheet.createRow(rowIndex);
            }

            fillTemplateRow(
                row,
                templateRow,
                dto,
                skillColumnMap
            );

            rowIndex++;
        }
    }


    private void clearExistingDataRows(
        Sheet sheet,
        int startRow
    ) {

        int lastRow =
            sheet.getLastRowNum();

        for (
            int rowIndex = startRow;
            rowIndex <= lastRow;
            rowIndex++
        ) {

            Row row =
                sheet.getRow(rowIndex);

            if (row == null) {
                continue;
            }

            short lastCell =
                row.getLastCellNum();

            if (lastCell < 0) {
                continue;
            }

            for (
                int cellIndex = 0;
                cellIndex < lastCell;
                cellIndex++
            ) {

                Cell cell =
                    row.getCell(cellIndex);

                if (cell != null) {
                    cell.setBlank();
                }
            }
        }
    }


    private void fillTemplateRow(
        Row row,
        Row templateRow,
        EmployeeExportDto dto,
        Map<String, Integer> skillColumnMap
    ) {

        setTemplateCell(
            row,
            templateRow,
            1,
            dto.getTeamName()
        );

        setTemplateCell(
            row,
            templateRow,
            2,
            dto.getId()
        );

        setTemplateCell(
            row,
            templateRow,
            3,
            dto.getName()
        );

        setTemplateCell(
            row,
            templateRow,
            4,
            dto.getDepartmentDirName()
        );

        setTemplateCell(
            row,
            templateRow,
            5,
            dto.getRank()
        );

        setTemplateCell(
            row,
            templateRow,
            6,
            dto.getIsCorePersonnel()
        );

        setTemplateCell(
            row,
            templateRow,
            7,
            dto.getHasJapanBusinessTrip()
        );

        setTemplateCell(
            row,
            templateRow,
            8,
            dto.getManagementExperienceLevel()
        );

        setTemplateCell(
            row,
            templateRow,
            9,
            dto.getQcdScore()
        );

        setTemplateCell(
            row,
            templateRow,
            10,
            dto.getReportConsultScore()
        );

        setTemplateCell(
            row,
            templateRow,
            11,
            dto.getEducationScore()
        );

        setTemplateCell(
            row,
            templateRow,
            12,
            dto.getTotalLevel()
        );

        setTemplateCell(
            row,
            templateRow,
            13,
            dto.getLanguageLevel()
        );

        setTemplateCell(
            row,
            templateRow,
            14,
            dto.getJlptLevel()
        );


        Map<String, DevelopmentSummary>
            developmentSummary =
                summarizeDevelopmentExperiences(dto);


        /*
         * NOTE:
         * Development data starts after the JLPT/NAT column.
         */

        setTemplateCell(
            row,
            templateRow,
            15,
            developmentSummary
                .getOrDefault(
                    "Host/Online",
                    DevelopmentSummary.empty()
                ).years
        );

        setTemplateCell(
            row,
            templateRow,
            16,
            developmentSummary
                .getOrDefault(
                    "Host/Online",
                    DevelopmentSummary.empty()
                ).processes
        );

        setTemplateCell(
            row,
            templateRow,
            17,
            developmentSummary
                .getOrDefault(
                    "Host/Batch",
                    DevelopmentSummary.empty()
                ).years
        );

        setTemplateCell(
            row,
            templateRow,
            18,
            developmentSummary
                .getOrDefault(
                    "Host/Batch",
                    DevelopmentSummary.empty()
                ).processes
        );

        setTemplateCell(
            row,
            templateRow,
            19,
            developmentSummary
                .getOrDefault(
                    "Decentralized/Online",
                    DevelopmentSummary.empty()
                ).years
        );

        setTemplateCell(
            row,
            templateRow,
            20,
            developmentSummary
                .getOrDefault(
                    "Decentralized/Online",
                    DevelopmentSummary.empty()
                ).processes
        );

        setTemplateCell(
            row,
            templateRow,
            21,
            developmentSummary
                .getOrDefault(
                    "Distributed/Batch",
                    DevelopmentSummary.empty()
                ).years
        );

        setTemplateCell(
            row,
            templateRow,
            22,
            developmentSummary
                .getOrDefault(
                    "Distributed/Batch",
                    DevelopmentSummary.empty()
                ).processes
        );


        Map<String, SkillSummary>
            skillSummary =
                summarizeSkills(dto);

        for (
            Map.Entry<String, SkillSummary> entry
            : skillSummary.entrySet()
        ) {

            Integer yearColumn =
                skillColumnMap.get(
                    entry.getKey()
                );

            if (yearColumn == null) {

                log.debug(
                    "Skipping skill '{}' because the template "
                        + "does not define a matching column",
                    entry.getKey()
                );

                continue;
            }

            SkillSummary summary =
                entry.getValue();

            setTemplateCell(
                row,
                templateRow,
                yearColumn,
                summary.years
            );

            setTemplateCell(
                row,
                templateRow,
                yearColumn + 1,
                summary.experienceType
            );
        }
    }


    private void setTemplateCell(
        Row row,
        Row templateRow,
        int columnIndex,
        Object value
    ) {

        Cell templateCell =
            templateRow.getCell(columnIndex);

        CellStyle style =
            templateCell != null
                ? templateCell.getCellStyle()
                : null;

        ExcelHelper.createCell(
            row,
            columnIndex,
            value,
            style
        );
    }


    // ============================================================
    // DEVELOPMENT SUMMARY
    // ============================================================

    private Map<String, DevelopmentSummary>
    summarizeDevelopmentExperiences(
        EmployeeExportDto dto
    ) {

        Map<String, DevelopmentSummary>
            summary =
                new LinkedHashMap<>();

        if (
            dto.getDevelopmentExperiences() == null
        ) {
            return summary;
        }

        for (
            Map.Entry<
                String,
                List<EmployeeExportDto.ProcessExport>
            > entry
            : dto.getDevelopmentExperiences()
                .entrySet()
        ) {

            List<EmployeeExportDto.ProcessExport>
                experiences =
                    entry.getValue();

            if (
                experiences == null
                    || experiences.isEmpty()
            ) {
                continue;
            }

            BigDecimal years =
                BigDecimal.ZERO;

            List<String> processes =
                new ArrayList<>();

            for (
                EmployeeExportDto.ProcessExport experience
                : experiences
            ) {

                if (
                    experience.getYearsOfExperience() != null
                        && !experience
                            .getYearsOfExperience()
                            .isBlank()
                ) {

                    try {

                        years =
                            years.add(
                                new BigDecimal(
                                    experience
                                        .getYearsOfExperience()
                                        .trim()
                                )
                            );

                    } catch (
                        NumberFormatException ignored
                    ) {
                        // Ignore invalid values.
                    }
                }

                if (
                    experience.getProcessName() != null
                        && !experience
                            .getProcessName()
                            .isBlank()
                ) {

                    processes.add(
                        experience
                            .getProcessName()
                            .trim()
                    );
                }
            }

            summary.put(
                normalizeDevelopmentType(
                    entry.getKey()
                ),
                new DevelopmentSummary(
                    formatYears(years),
                    joinUnique(processes)
                )
            );
        }

        return summary;
    }


    // ============================================================
    // SKILL SUMMARY
    // ============================================================

    private Map<String, SkillSummary>
    summarizeSkills(
        EmployeeExportDto dto
    ) {

        Map<String, SkillSummary>
            summary =
                new LinkedHashMap<>();

        if (
            dto.getTechnicalSkills() == null
        ) {
            return summary;
        }

        for (
            EmployeeExportDto.SkillExport skill
            : dto.getTechnicalSkills()
        ) {

            if (
                skill == null
                    || skill.getSkillName() == null
                    || skill.getSkillName().isBlank()
            ) {
                continue;
            }

            String key =
                buildSkillKey(
                    skill.getCategory(),
                    skill.getSubCategory(),
                    skill.getSkillName()
                );

            BigDecimal years =
                BigDecimal.ZERO;

            if (
                skill.getYearsOfExperience() != null
                    && !skill
                        .getYearsOfExperience()
                        .isBlank()
            ) {

                try {

                    years =
                        new BigDecimal(
                            skill
                                .getYearsOfExperience()
                                .trim()
                        );

                } catch (
                    NumberFormatException ignored
                ) {
                    // Keep zero.
                }
            }

            SkillSummary existing =
                summary.get(key);

            if (
                existing == null
                    || years.compareTo(
                        existing.yearsAsNumber
                    ) > 0
            ) {

                summary.put(
                    key,
                    new SkillSummary(
                        formatYears(years),
                        skill.getExperienceType()
                    )
                );
            }
        }

        return summary;
    }


    private String formatYears(
        BigDecimal years
    ) {

        if (years == null) {
            return null;
        }

        return years
            .stripTrailingZeros()
            .toPlainString();
    }


    private String joinUnique(
        List<String> values
    ) {

        if (
            values == null
                || values.isEmpty()
        ) {
            return null;
        }

        return values.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isBlank())
            .distinct()
            .collect(Collectors.joining(", "));
    }


    // ============================================================
    // SKILL COLUMN PREPARATION
    // ============================================================

    private Map<String, Integer>
    prepareSkillColumns(
        Sheet sheet,
        Row skillHeaderRow
    ) {

        Map<String, Integer> skillColumns =
            buildSkillColumnMap(
                sheet,
                skillHeaderRow
            );

        List<Skill> activeSkills =
            new ArrayList<>(
                skillRepository.findByIsActiveTrue()
            );

        activeSkills.sort(
            Comparator
                .comparing(
                    (Skill skill) ->
                        normalizeHierarchyName(
                            getCategoryName(skill)
                        )
                )
                .thenComparing(
                    skill ->
                        normalizeHierarchyName(
                            getSubCategoryName(skill)
                        )
                )
                .thenComparing(
                    Skill::getId,
                    Comparator.nullsLast(
                        Integer::compareTo
                    )
                )
        );

        for (Skill skill : activeSkills) {

            if (
                skill == null
                    || skill.getSkillName() == null
                    || skill.getSkillName().isBlank()
            ) {
                continue;
            }

            String category =
                normalizeHierarchyName(
                    getCategoryName(skill)
                );

            String subCategory =
                normalizeHierarchyName(
                    getSubCategoryName(skill)
                );

            String skillKey =
                buildSkillKey(
                    category,
                    subCategory,
                    skill.getSkillName()
                );

            if (
                skillColumns.containsKey(skillKey)
            ) {
                continue;
            }

            int insertionColumn =
                findSkillInsertionColumn(
                    sheet,
                    category,
                    subCategory
                );

            insertSkillColumns(
                sheet,
                insertionColumn,
                skill.getSkillName(),
                category,
                subCategory
            );

            skillColumns.replaceAll(
                (key, column) ->
                    column >= insertionColumn
                        ? column + 2
                        : column
            );

            skillColumns.put(
                skillKey,
                insertionColumn
            );
        }

        return skillColumns;
    }


    // ============================================================
    // BUILD SKILL MAP
    // ============================================================

    private Map<String, Integer>
    buildSkillColumnMap(
        Sheet sheet,
        Row skillHeaderRow
    ) {

        Map<String, Integer> skillColumns =
            new LinkedHashMap<>();

        if (skillHeaderRow == null) {
            return skillColumns;
        }

        Map<String, List<Skill>>
            databaseSkillsByName =
                new HashMap<>();

        for (
            Skill skill
            : skillRepository.findByIsActiveTrue()
        ) {

            if (
                skill == null
                    || skill.getSkillName() == null
                    || skill.getSkillName().isBlank()
            ) {
                continue;
            }

            databaseSkillsByName
                .computeIfAbsent(
                    normalizeSkillName(
                        skill.getSkillName()
                    ),
                    key -> new ArrayList<>()
                )
                .add(skill);
        }


        TemplateHierarchy current =
            new TemplateHierarchy("", "");

        CellRangeAddress previousCategoryMerge =
            null;

        CellRangeAddress previousSubCategoryMerge =
            null;

        int lastColumn =
            getLastUsedColumn(sheet);


        for (
            int columnIndex =
                TEMPLATE_SKILL_START_COLUMN;
            columnIndex <= lastColumn;
            columnIndex++
        ) {

            CellRangeAddress categoryMerge =
                findMergedRegion(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    columnIndex
                );


            if (
                !sameMerge(
                    categoryMerge,
                    previousCategoryMerge
                )
            ) {

                if (categoryMerge == null) {

                    current =
                        new TemplateHierarchy(
                            "",
                            current.subCategory
                        );

                } else if (
                    isStandaloneSubCategoryMerge(
                        categoryMerge
                    )
                ) {

                    current =
                        new TemplateHierarchy(
                            "",
                            normalizeHierarchyName(
                                getMergedHeaderValue(
                                    sheet,
                                    TEMPLATE_SKILL_HEADER_ROW - 2,
                                    categoryMerge
                                        .getFirstColumn()
                                )
                            )
                        );

                } else {

                    String category =
                        normalizeHierarchyName(
                            getMergedHeaderValue(
                                sheet,
                                TEMPLATE_SKILL_HEADER_ROW - 2,
                                categoryMerge
                                    .getFirstColumn()
                            )
                        );

                    current =
                        new TemplateHierarchy(
                            category,
                            ""
                        );
                }

                previousCategoryMerge =
                    categoryMerge;

                previousSubCategoryMerge =
                    null;
            }


            CellRangeAddress subCategoryMerge =
                findMergedRegion(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 1,
                    columnIndex
                );


            if (
                !sameMerge(
                    subCategoryMerge,
                    previousSubCategoryMerge
                )
                    && subCategoryMerge != null
                    && !isStandaloneSubCategoryMerge(
                        subCategoryMerge
                    )
            ) {

                String subCategory =
                    normalizeHierarchyName(
                        getMergedHeaderValue(
                            sheet,
                            TEMPLATE_SKILL_HEADER_ROW - 1,
                            subCategoryMerge
                                .getFirstColumn()
                        )
                    );

                current =
                    new TemplateHierarchy(
                        current.category,
                        subCategory
                    );
            }


            String directSubCategory =
                ExcelHelper.getCellValueAsString(
                    getCell(
                        sheet,
                        TEMPLATE_SKILL_HEADER_ROW - 1,
                        columnIndex
                    )
                );


            if (
                directSubCategory != null
                    && !directSubCategory.isBlank()
            ) {

                current =
                    new TemplateHierarchy(
                        current.category,
                        normalizeHierarchyName(
                            directSubCategory
                        )
                    );
            }


            previousSubCategoryMerge =
                subCategoryMerge;


            String skillName =
                ExcelHelper.getCellValueAsString(
                    skillHeaderRow.getCell(
                        columnIndex
                    )
                );


            if (
                skillName == null
                    || skillName.isBlank()
            ) {

                CellRangeAddress verticalMerge =
                    findMergedRegion(
                        sheet,
                        TEMPLATE_SKILL_HEADER_ROW - 1,
                        columnIndex
                    );

                if (
                    verticalMerge != null
                        && verticalMerge.getFirstRow()
                            == TEMPLATE_SKILL_HEADER_ROW - 1
                        && verticalMerge.getLastRow()
                            == TEMPLATE_SKILL_HEADER_ROW
                ) {

                    skillName =
                        ExcelHelper.getCellValueAsString(
                            getCell(
                                sheet,
                                verticalMerge.getFirstRow(),
                                verticalMerge
                                    .getFirstColumn()
                            )
                        );
                }
            }


            if (
                skillName == null
                    || skillName.isBlank()
            ) {
                continue;
            }


            String normalizedSkillName =
                normalizeSkillName(
                    skillName
                );

            List<Skill> databaseMatches =
                databaseSkillsByName.getOrDefault(
                    normalizedSkillName,
                    Collections.emptyList()
                );


            String key;


            if (databaseMatches.size() == 1) {

                Skill databaseSkill =
                    databaseMatches.get(0);

                key =
                    buildSkillKey(
                        normalizeHierarchyName(
                            getCategoryName(
                                databaseSkill
                            )
                        ),
                        normalizeHierarchyName(
                            getSubCategoryName(
                                databaseSkill
                            )
                        ),
                        databaseSkill.getSkillName()
                    );

            } else {

                key =
                    buildSkillKey(
                        current.category,
                        current.subCategory,
                        skillName
                    );


           if (databaseMatches.size() > 1) {
    final String currentCategory = current.category;
    final String currentSubCategory = current.subCategory;

    Skill hierarchyMatch = databaseMatches.stream()
        .filter(databaseSkill ->
            normalizeHierarchyName(getCategoryName(databaseSkill))
                .equals(currentCategory)
            && normalizeHierarchyName(getSubCategoryName(databaseSkill))
                .equals(currentSubCategory))
        .findFirst()
        .orElse(null);

    if (hierarchyMatch != null) {
        key = buildSkillKey(
            normalizeHierarchyName(getCategoryName(hierarchyMatch)),
            normalizeHierarchyName(getSubCategoryName(hierarchyMatch)),
            hierarchyMatch.getSkillName()
        );
    }
}
            }


            skillColumns.putIfAbsent(
                key,
                columnIndex
            );
        }

        return skillColumns;
    }


    // ============================================================
    // MERGE / HIERARCHY HELPERS
    // ============================================================

    private Cell getCell(
        Sheet sheet,
        int rowIndex,
        int columnIndex
    ) {

        Row row =
            sheet.getRow(rowIndex);

        return row == null
            ? null
            : row.getCell(columnIndex);
    }


    private boolean sameMerge(
        CellRangeAddress a,
        CellRangeAddress b
    ) {

        if (a == null || b == null) {
            return a == b;
        }

        return a.getFirstRow() == b.getFirstRow()
            && a.getLastRow() == b.getLastRow()
            && a.getFirstColumn() == b.getFirstColumn()
            && a.getLastColumn() == b.getLastColumn();
    }


    private boolean isStandaloneSubCategoryMerge(
        CellRangeAddress merge
    ) {

        return merge != null
            && merge.getFirstRow()
                == TEMPLATE_SKILL_HEADER_ROW - 2
            && merge.getLastRow()
                == TEMPLATE_SKILL_HEADER_ROW - 1;
    }


    private String getCategoryName(
        Skill skill
    ) {

        if (
            skill == null
                || skill.getSubCategory() == null
                || skill.getSubCategory()
                    .getCategory() == null
        ) {
            return null;
        }

        return skill
            .getSubCategory()
            .getCategory()
            .getCategoryName();
    }


    private String getSubCategoryName(
        Skill skill
    ) {

        if (
            skill == null
                || skill.getSubCategory() == null
        ) {
            return null;
        }

        return skill
            .getSubCategory()
            .getSubCategoryName();
    }


    private boolean isEmptyHierarchyValue(
        String value
    ) {

        if (
            value == null
                || value.isBlank()
        ) {
            return true;
        }

        String normalized =
            value.trim();

        return normalized.matches(
            "(?i)^empty-\\d+$"
        )
            || "uncategorized"
                .equalsIgnoreCase(normalized)
            || "general"
                .equalsIgnoreCase(normalized);
    }


    private String normalizeHierarchyName(
        String value
    ) {

        if (
            isEmptyHierarchyValue(value)
        ) {
            return "";
        }

        return normalizeSkillName(value)
            .replaceFirst("^\\*+", "")
            .trim();
    }


    private String buildSkillKey(
        String category,
        String subCategory,
        String skill
    ) {

        return normalizeHierarchyName(category)
            + "\u001F"
            + normalizeHierarchyName(subCategory)
            + "\u001F"
            + normalizeSkillName(skill);
    }


    // ============================================================
    // INSERT SKILL COLUMNS
    // ============================================================

    private int findSkillInsertionColumn(
        Sheet sheet,
        String targetCategory,
        String targetSubCategory
    ) {

        int lastColumn =
            getLastUsedColumn(sheet);

        int lastMatchingSkillEnd =
            -1;

        TemplateHierarchy current =
            new TemplateHierarchy("", "");

        CellRangeAddress previousCategoryMerge =
            null;

        CellRangeAddress previousSubCategoryMerge =
            null;


        for (
            int columnIndex =
                TEMPLATE_SKILL_START_COLUMN;
            columnIndex <= lastColumn;
            columnIndex++
        ) {

            CellRangeAddress categoryMerge =
                findMergedRegion(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    columnIndex
                );


            if (
                !sameMerge(
                    categoryMerge,
                    previousCategoryMerge
                )
            ) {

                if (categoryMerge == null) {

                    current =
                        new TemplateHierarchy(
                            "",
                            current.subCategory
                        );

                } else if (
                    isStandaloneSubCategoryMerge(
                        categoryMerge
                    )
                ) {

                    current =
                        new TemplateHierarchy(
                            "",
                            normalizeHierarchyName(
                                getMergedHeaderValue(
                                    sheet,
                                    TEMPLATE_SKILL_HEADER_ROW - 2,
                                    categoryMerge
                                        .getFirstColumn()
                                )
                            )
                        );

                } else {

                    current =
                        new TemplateHierarchy(
                            normalizeHierarchyName(
                                getMergedHeaderValue(
                                    sheet,
                                    TEMPLATE_SKILL_HEADER_ROW - 2,
                                    categoryMerge
                                        .getFirstColumn()
                                )
                            ),
                            ""
                        );
                }

                previousCategoryMerge =
                    categoryMerge;

                previousSubCategoryMerge =
                    null;
            }


            CellRangeAddress subCategoryMerge =
                findMergedRegion(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 1,
                    columnIndex
                );


            if (
                !sameMerge(
                    subCategoryMerge,
                    previousSubCategoryMerge
                )
                    && subCategoryMerge != null
                    && !isStandaloneSubCategoryMerge(
                        subCategoryMerge
                    )
            ) {

                current =
                    new TemplateHierarchy(
                        current.category,
                        normalizeHierarchyName(
                            getMergedHeaderValue(
                                sheet,
                                TEMPLATE_SKILL_HEADER_ROW - 1,
                                subCategoryMerge
                                    .getFirstColumn()
                            )
                        )
                    );
            }


            previousSubCategoryMerge =
                subCategoryMerge;


            String skillName =
                ExcelHelper.getCellValueAsString(
                    getCell(
                        sheet,
                        TEMPLATE_SKILL_HEADER_ROW,
                        columnIndex
                    )
                );


            if (
                skillName == null
                    || skillName.isBlank()
            ) {
                continue;
            }


            boolean hierarchyMatches =
                targetCategory.equals(
                    current.category
                )
                && targetSubCategory.equals(
                    current.subCategory
                );


            if (hierarchyMatches) {

                lastMatchingSkillEnd =
                    Math.max(
                        lastMatchingSkillEnd,
                        columnIndex + 1
                    );
            }
        }


        if (
            lastMatchingSkillEnd
                >= TEMPLATE_SKILL_START_COLUMN
        ) {

            return lastMatchingSkillEnd + 1;
        }


        int headerEnd =
            findMatchingHierarchyHeaderEnd(
                sheet,
                targetCategory,
                targetSubCategory
            );


        if (
            headerEnd
                >= TEMPLATE_SKILL_START_COLUMN
        ) {

            return headerEnd + 1;
        }


        return getSkillAreaEnd(sheet) + 1;
    }


    private int findMatchingHierarchyHeaderEnd(
        Sheet sheet,
        String targetCategory,
        String targetSubCategory
    ) {

        int end = -1;

        for (
            CellRangeAddress merge
            : sheet.getMergedRegions()
        ) {

            if (
                merge.getFirstColumn()
                    < TEMPLATE_SKILL_START_COLUMN
            ) {
                continue;
            }

            String value =
                normalizeHierarchyName(
                    getMergedHeaderValue(
                        sheet,
                        merge.getFirstRow(),
                        merge.getFirstColumn()
                    )
                );


            if (
                isStandaloneSubCategoryMerge(
                    merge
                )
                    && !targetSubCategory.isEmpty()
                    && targetSubCategory.equals(
                        value
                    )
                    && targetCategory.isEmpty()
            ) {

                end =
                    Math.max(
                        end,
                        merge.getLastColumn()
                    );
            }


            if (
                merge.getFirstRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 1
                    && merge.getLastRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 1
                    && !targetSubCategory.isEmpty()
                    && targetSubCategory.equals(value)
            ) {

                end =
                    Math.max(
                        end,
                        merge.getLastColumn()
                    );
            }


            if (
                merge.getFirstRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 2
                    && merge.getLastRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 2
                    && !targetCategory.isEmpty()
                    && targetCategory.equals(value)
            ) {

                end =
                    Math.max(
                        end,
                        merge.getLastColumn()
                    );
            }
        }

        return end;
    }


    private void insertSkillColumns(
        Sheet sheet,
        int insertionColumn,
        String skillName,
        String targetCategory,
        String targetSubCategory
    ) {

        int oldLastColumn =
            getLastUsedColumn(sheet);

        if (
            insertionColumn
                < TEMPLATE_SKILL_START_COLUMN
        ) {
            insertionColumn =
                TEMPLATE_SKILL_START_COLUMN;
        }


        Map<Integer, Integer> oldWidths =
            new HashMap<>();

        Map<Integer, Boolean> oldHidden =
            new HashMap<>();


        for (
            int column = insertionColumn;
            column <= oldLastColumn;
            column++
        ) {

            oldWidths.put(
                column,
                sheet.getColumnWidth(column)
            );

            oldHidden.put(
                column,
                sheet.isColumnHidden(column)
            );
        }


        List<CellRangeAddress> originalMerges =
            new ArrayList<>(
                sheet.getMergedRegions()
            );


        for (
            int i =
                sheet.getNumMergedRegions() - 1;
            i >= 0;
            i--
        ) {

            sheet.removeMergedRegion(i);
        }


        if (
            insertionColumn <= oldLastColumn
        ) {

            sheet.shiftColumns(
                insertionColumn,
                oldLastColumn,
                2
            );
        }


        for (
            CellRangeAddress original
            : originalMerges
        ) {

            int first =
                original.getFirstColumn();

            int last =
                original.getLastColumn();


            if (
                first >= insertionColumn
            ) {

                first += 2;
                last += 2;

            } else if (
                last >= insertionColumn
            ) {

                if (
                    original.getLastRow()
                        < TEMPLATE_SKILL_HEADER_ROW
                ) {

                    last += 2;

                } else {

                    throw new IllegalStateException(
                        "Insertion column "
                            + insertionColumn
                            + " crosses skill merge "
                            + original.formatAsString()
                    );
                }
            }


            if (
                isTargetHierarchyMerge(
                    sheet,
                    original,
                    targetCategory,
                    targetSubCategory
                )
                    && original.getFirstColumn()
                        < insertionColumn
            ) {

                last =
                    Math.max(
                        last,
                        insertionColumn + 1
                    );
            }


            addMergedRegionChecked(
                sheet,
                new CellRangeAddress(
                    original.getFirstRow(),
                    original.getLastRow(),
                    first,
                    last
                )
            );
        }


        int sourceLeft =
            insertionColumn - 2;

        int sourceRight =
            insertionColumn - 1;


        if (
            sourceLeft
                >= TEMPLATE_SKILL_START_COLUMN
        ) {

            copyColumnStyleAndWidth(
                sheet,
                sourceLeft,
                insertionColumn
            );

            copyColumnStyleAndWidth(
                sheet,
                sourceRight,
                insertionColumn + 1
            );

            copyEntireColumnCellStyles(
                sheet,
                sourceLeft,
                insertionColumn
            );

            copyEntireColumnCellStyles(
                sheet,
                sourceRight,
                insertionColumn + 1
            );

        } else if (
            insertionColumn + 2
                <= oldLastColumn + 2
        ) {

            copyColumnStyleAndWidth(
                sheet,
                insertionColumn + 2,
                insertionColumn
            );

            copyColumnStyleAndWidth(
                sheet,
                insertionColumn + 3,
                insertionColumn + 1
            );

            copyEntireColumnCellStyles(
                sheet,
                insertionColumn + 2,
                insertionColumn
            );

            copyEntireColumnCellStyles(
                sheet,
                insertionColumn + 3,
                insertionColumn + 1
            );
        }


        for (
            Map.Entry<Integer, Integer> entry
            : oldWidths.entrySet()
        ) {

            int oldColumn =
                entry.getKey();

            int newColumn =
                oldColumn + 2;

            if (
                newColumn
                    <= oldLastColumn + 2
            ) {

                sheet.setColumnWidth(
                    newColumn,
                    entry.getValue()
                );

                sheet.setColumnHidden(
                    newColumn,
                    oldHidden.getOrDefault(
                        oldColumn,
                        false
                    )
                );
            }
        }


        Row skillHeaderRow =
            getOrCreateRow(
                sheet,
                TEMPLATE_SKILL_HEADER_ROW
            );

        Row skillSubHeaderRow =
            getOrCreateRow(
                sheet,
                TEMPLATE_SKILL_HEADER_ROW + 1
            );


        Cell skillCell =
            getOrCreateCell(
                skillHeaderRow,
                insertionColumn
            );

        skillCell.setCellValue(
            skillName
        );

        getOrCreateCell(
            skillHeaderRow,
            insertionColumn + 1
        );


        Cell yearsCell =
            getOrCreateCell(
                skillSubHeaderRow,
                insertionColumn
            );

        yearsCell.setCellValue(
            "Years"
        );


        Cell experienceCell =
            getOrCreateCell(
                skillSubHeaderRow,
                insertionColumn + 1
            );

        experienceCell.setCellValue(
            "experience"
        );


        addMergedRegionChecked(
            sheet,
            new CellRangeAddress(
                TEMPLATE_SKILL_HEADER_ROW,
                TEMPLATE_SKILL_HEADER_ROW,
                insertionColumn,
                insertionColumn + 1
            )
        );


        addMissingHierarchyHeaders(
            sheet,
            insertionColumn,
            targetCategory,
            targetSubCategory
        );
    }


    // ============================================================
    // HIERARCHY HEADER HELPERS
    // ============================================================

    private void addMissingHierarchyHeaders(
        Sheet sheet,
        int insertionColumn,
        String targetCategory,
        String targetSubCategory
    ) {

        boolean hasCategory =
            !normalizeHierarchyName(
                targetCategory
            ).isEmpty();

        boolean hasSubCategory =
            !normalizeHierarchyName(
                targetSubCategory
            ).isEmpty();


        if (
            !hasCategory
                && !hasSubCategory
        ) {
            return;
        }


        boolean categoryExists =
            hasCategory
                && hasHierarchyHeader(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    targetCategory
                );


        boolean subCategoryExists =
            hasSubCategory
                && hasHierarchyHeader(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 1,
                    TEMPLATE_SKILL_HEADER_ROW - 1,
                    targetSubCategory
                );


        if (
            hasCategory
                && !categoryExists
        ) {

            Row categoryRow =
                getOrCreateRow(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 2
                );

            Cell categoryCell =
                getOrCreateCell(
                    categoryRow,
                    insertionColumn
                );

            categoryCell.setCellValue(
                targetCategory
            );


            addMergedRegionChecked(
                sheet,
                new CellRangeAddress(
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    TEMPLATE_SKILL_HEADER_ROW - 2,
                    insertionColumn,
                    insertionColumn + 1
                )
            );
        }


        if (
            hasSubCategory
                && !subCategoryExists
        ) {

            Row subCategoryRow =
                getOrCreateRow(
                    sheet,
                    TEMPLATE_SKILL_HEADER_ROW - 1
                );

            Cell subCategoryCell =
                getOrCreateCell(
                    subCategoryRow,
                    insertionColumn
                );

            subCategoryCell.setCellValue(
                targetSubCategory
            );


            if (!hasCategory) {

                addMergedRegionChecked(
                    sheet,
                    new CellRangeAddress(
                        TEMPLATE_SKILL_HEADER_ROW - 2,
                        TEMPLATE_SKILL_HEADER_ROW - 1,
                        insertionColumn,
                        insertionColumn + 1
                    )
                );

            } else {

                addMergedRegionChecked(
                    sheet,
                    new CellRangeAddress(
                        TEMPLATE_SKILL_HEADER_ROW - 1,
                        TEMPLATE_SKILL_HEADER_ROW - 1,
                        insertionColumn,
                        insertionColumn + 1
                    )
                );
            }
        }
    }


    private boolean hasHierarchyHeader(
        Sheet sheet,
        int firstRow,
        int lastRow,
        String expectedName
    ) {

        String expected =
            normalizeHierarchyName(
                expectedName
            );

        if (expected.isEmpty()) {
            return false;
        }


        for (
            CellRangeAddress merge
            : sheet.getMergedRegions()
        ) {

            if (
                merge.getFirstColumn()
                    < TEMPLATE_SKILL_START_COLUMN
            ) {
                continue;
            }


            boolean exactRows =
                merge.getFirstRow()
                    == firstRow
                    && merge.getLastRow()
                    == lastRow;


            boolean standaloneSubCategory =
                isStandaloneSubCategoryMerge(
                    merge
                )
                    && firstRow
                        == TEMPLATE_SKILL_HEADER_ROW - 1
                    && lastRow
                        == TEMPLATE_SKILL_HEADER_ROW - 1;


            if (
                !exactRows
                    && !standaloneSubCategory
            ) {
                continue;
            }


            String actual =
                normalizeHierarchyName(
                    getMergedHeaderValue(
                        sheet,
                        merge.getFirstRow(),
                        merge.getFirstColumn()
                    )
                );


            if (
                expected.equals(actual)
            ) {
                return true;
            }
        }

        return false;
    }


    private boolean isTargetHierarchyMerge(
        Sheet sheet,
        CellRangeAddress merge,
        String targetCategory,
        String targetSubCategory
    ) {

        boolean categoryOnly =
            merge.getFirstRow()
                == TEMPLATE_SKILL_HEADER_ROW - 2
                && merge.getLastRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 2;


        boolean subCategoryOnly =
            merge.getFirstRow()
                == TEMPLATE_SKILL_HEADER_ROW - 1
                && merge.getLastRow()
                    == TEMPLATE_SKILL_HEADER_ROW - 1;


        boolean standaloneSubCategory =
            isStandaloneSubCategoryMerge(
                merge
            );


        if (
            standaloneSubCategory
                || subCategoryOnly
        ) {

            if (
                targetSubCategory.isEmpty()
            ) {
                return false;
            }

            String value =
                normalizeHierarchyName(
                    getMergedHeaderValue(
                        sheet,
                        merge.getFirstRow(),
                        merge.getFirstColumn()
                    )
                );

            return targetSubCategory.equals(
                value
            );
        }


        if (
            categoryOnly
                && !targetCategory.isEmpty()
        ) {

            String value =
                normalizeHierarchyName(
                    getMergedHeaderValue(
                        sheet,
                        merge.getFirstRow(),
                        merge.getFirstColumn()
                    )
                );

            return targetCategory.equals(
                value
            );
        }

        return false;
    }


    // ============================================================
    // CELL / COLUMN HELPERS
    // ============================================================

    private void copyEntireColumnCellStyles(
        Sheet sheet,
        int sourceColumn,
        int targetColumn
    ) {

        if (
            sourceColumn < 0
                || targetColumn < 0
        ) {
            return;
        }


        for (
            int rowIndex = 0;
            rowIndex <= sheet.getLastRowNum();
            rowIndex++
        ) {

            Row row =
                sheet.getRow(rowIndex);

            if (row == null) {
                continue;
            }


            Cell source =
                row.getCell(sourceColumn);

            if (source == null) {
                continue;
            }


            Cell target =
                getOrCreateCell(
                    row,
                    targetColumn
                );

            target.setCellStyle(
                source.getCellStyle()
            );
        }
    }


    private void addMergedRegionChecked(
        Sheet sheet,
        CellRangeAddress candidate
    ) {

        for (
            CellRangeAddress existing
            : sheet.getMergedRegions()
        ) {

            if (
                candidate.intersects(existing)
            ) {

                throw new IllegalStateException(
                    "Merged-region overlap while "
                        + "inserting skill: "
                        + candidate.formatAsString()
                        + " overlaps "
                        + existing.formatAsString()
                );
            }
        }

        sheet.addMergedRegion(candidate);
    }


    private int getSkillAreaEnd(
        Sheet sheet
    ) {

        return Math.max(
            TEMPLATE_SKILL_START_COLUMN - 1,
            getLastUsedColumn(sheet)
        );
    }


    private CellRangeAddress findMergedRegion(
        Sheet sheet,
        int rowIndex,
        int columnIndex
    ) {

        for (
            CellRangeAddress merged
            : sheet.getMergedRegions()
        ) {

            if (
                merged.getFirstRow()
                    <= rowIndex
                    && rowIndex
                    <= merged.getLastRow()
                    && merged.getFirstColumn()
                        <= columnIndex
                    && columnIndex
                        <= merged.getLastColumn()
            ) {

                return merged;
            }
        }

        return null;
    }


    private int getLastUsedColumn(
        Sheet sheet
    ) {

        int lastColumn =
            TEMPLATE_SKILL_START_COLUMN - 1;


        for (
            int rowIndex = 0;
            rowIndex <= TEMPLATE_DATA_START_ROW;
            rowIndex++
        ) {

            Row row =
                sheet.getRow(rowIndex);

            if (
                row != null
                    && row.getLastCellNum() > 0
            ) {

                lastColumn =
                    Math.max(
                        lastColumn,
                        row.getLastCellNum() - 1
                    );
            }
        }

        return lastColumn;
    }


    private String getMergedHeaderValue(
        Sheet sheet,
        int rowIndex,
        int columnIndex
    ) {

        Row row =
            sheet.getRow(rowIndex);

        if (row == null) {
            return null;
        }


        Cell directCell =
            row.getCell(columnIndex);

        String directValue =
            ExcelHelper.getCellValueAsString(
                directCell
            );


        if (
            directValue != null
                && !directValue.isBlank()
        ) {

            return directValue;
        }


        for (
            CellRangeAddress merged
            : sheet.getMergedRegions()
        ) {

            if (
                merged.getFirstRow()
                    <= rowIndex
                    && rowIndex
                        <= merged.getLastRow()
                    && merged.getFirstColumn()
                        <= columnIndex
                    && columnIndex
                        <= merged.getLastColumn()
            ) {

                Row topRow =
                    sheet.getRow(
                        merged.getFirstRow()
                    );

                Cell topLeft =
                    topRow != null
                        ? topRow.getCell(
                            merged.getFirstColumn()
                        )
                        : null;

                return ExcelHelper.getCellValueAsString(
                    topLeft
                );
            }
        }

        return null;
    }


    private void copyColumnStyleAndWidth(
        Sheet sheet,
        int sourceColumn,
        int targetColumn
    ) {

        if (sourceColumn < 0) {
            return;
        }

        sheet.setColumnWidth(
            targetColumn,
            sheet.getColumnWidth(
                sourceColumn
            )
        );

        sheet.setColumnHidden(
            targetColumn,
            sheet.isColumnHidden(
                sourceColumn
            )
        );
    }


    private Row getOrCreateRow(
        Sheet sheet,
        int rowIndex
    ) {

        Row row =
            sheet.getRow(rowIndex);

        return row != null
            ? row
            : sheet.createRow(rowIndex);
    }


    private Cell getOrCreateCell(
        Row row,
        int columnIndex
    ) {

        Cell cell =
            row.getCell(columnIndex);

        return cell != null
            ? cell
            : row.createCell(columnIndex);
    }


    // ============================================================
    // NORMALIZATION
    // ============================================================

    private String normalizeSkillName(
        String value
    ) {

        if (value == null) {
            return null;
        }

        return value
            .trim()
            .replace('\u00A0', ' ')
            .replaceAll("\\s+", " ")
            .toLowerCase(Locale.ROOT);
    }


    private boolean looksNumeric(
        String value
    ) {

        if (value == null) {
            return false;
        }

        String trimmed =
            value.trim();

        if (trimmed.isEmpty()) {
            return false;
        }

        try {

            new BigDecimal(trimmed);

            return true;

        } catch (NumberFormatException ex) {

            return false;
        }
    }


    private String normalizeDevelopmentType(
        String value
    ) {

        if (value == null) {
            return "Unknown";
        }

        String normalized =
            value.trim()
                .toLowerCase(Locale.ROOT)
                .replace('-', ' ')
                .replace('_', ' ')
                .replaceAll("\\s+", " ");


        if (
            normalized.contains("host")
                && normalized.contains("online")
        ) {
            return "Host/Online";
        }


        if (
            normalized.contains("host")
                && normalized.contains("batch")
        ) {
            return "Host/Batch";
        }


        if (
            normalized.contains("decentralized")
                && normalized.contains("online")
        ) {
            return "Decentralized/Online";
        }


        if (
            normalized.contains("distributed")
                && normalized.contains("batch")
        ) {
            return "Distributed/Batch";
        }


        return value.trim();
    }


    // ============================================================
    // JAPANESE TRANSLATION
    // ============================================================

    private boolean isJapanese(
        String language
    ) {

        return language != null
            && (
                "ja".equalsIgnoreCase(language)
                    || "jp".equalsIgnoreCase(language)
                    || "japanese".equalsIgnoreCase(language)
            );
    }


    private void translateWorkbookToJapanese(
        Workbook workbook
    ) {

        Map<String, String> dictionary =
            japaneseDictionaryService.getDictionary();

        if (
            dictionary == null
                || dictionary.isEmpty()
        ) {

            log.warn(
                "Japanese dictionary is empty; "
                    + "exporting English text unchanged."
            );

            return;
        }


        for (
            Sheet sheet
            : workbook
        ) {

            for (
                Row row
                : sheet
            ) {

                for (
                    Cell cell
                    : row
                ) {

                    if (
                        cell.getCellType()
                            != CellType.STRING
                    ) {
                        continue;
                    }


                    String original =
                        cell.getStringCellValue();

                    String translated =
                        japaneseDictionaryService.translate(
                            original,
                            dictionary
                        );


                    if (
                        !Objects.equals(
                            original,
                            translated
                        )
                    ) {

                        cell.setCellValue(
                            translated
                        );
                    }
                }
            }
        }
    }


    // ============================================================
    // INNER CLASSES
    // ============================================================

    private static final class TemplateHierarchy {

        private final String category;

        private final String subCategory;


        private TemplateHierarchy(
            String category,
            String subCategory
        ) {

            this.category =
                category;

            this.subCategory =
                subCategory;
        }
    }


    private static final class DevelopmentSummary {

        private final String years;

        private final String processes;


        private DevelopmentSummary(
            String years,
            String processes
        ) {

            this.years =
                years;

            this.processes =
                processes;
        }


        private static DevelopmentSummary empty() {

            return new DevelopmentSummary(
                null,
                null
            );
        }
    }


    private static final class SkillSummary {

        private final String years;

        private final String experienceType;

        private final BigDecimal yearsAsNumber;


        private SkillSummary(
            String years,
            String experienceType
        ) {

            this.years =
                years;

            this.experienceType =
                experienceType;

            this.yearsAsNumber =
                years != null
                    ? new BigDecimal(years)
                    : BigDecimal.ZERO;
        }
    }
}