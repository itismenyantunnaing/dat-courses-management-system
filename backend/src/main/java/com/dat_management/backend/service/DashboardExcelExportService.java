// ExcelExportService.java - Fixed with proper column offsets
package com.dat_management.backend.service;

import com.dat_management.backend.dto.JapaneseDashboardDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class DashboardExcelExportService {

    public byte[] generateExcel(JapaneseDashboardDTO data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Dashboard");
            int rowNum = 0;

            // 1. By Department - columns 0-7
            rowNum = createDepartmentSection(sheet, data, rowNum);
            rowNum += 2;

            // 2. By Team - columns 0-15  
            rowNum = createTeamSection(sheet, data, rowNum);
            rowNum += 2;

            // 3. Team's Communication Improvement - columns 0-24 (1 + 8*3)
            rowNum = createTeamCommunicationSection(sheet, data, rowNum);
            rowNum += 2;

            // 4. Communication Capability - columns 0-3
            rowNum = createCommunicationCapabilitySection(sheet, data, rowNum);
            rowNum += 2;

            // 5. No Certified Members - columns 0-3
            rowNum = createNoCertSection(sheet, data, rowNum);

            // Set fixed column widths
            setColumnWidths(sheet);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

   private void setColumnWidths(Sheet sheet) {
    int numWidth = 2500;
    int deptWidth = 10000;

    // Set widths for all columns up to the maximum needed (0-56)
    // But these widths should be set based on the actual content needs
    
    // Columns 0-7: Used by Department section and as first columns in other sections
    sheet.setColumnWidth(0, deptWidth);  // Department/Team/Level column
    for (int i = 1; i <= 7; i++) {
        sheet.setColumnWidth(i, numWidth);
    }
    
    // Columns 8-15: Used by Team section
    for (int i = 8; i <= 15; i++) {
        sheet.setColumnWidth(i, numWidth);
    }
    
    // Columns 16-24: Used by Team Communication section
    for (int i = 16; i <= 24; i++) {
        sheet.setColumnWidth(i, numWidth);
    }
    
    // Columns 25-52: Used by Communication Capability and No Certified Members sections
    // These sections only use columns 0-3, but we set widths for consistency
    for (int i = 25; i <= 52; i++) {
        sheet.setColumnWidth(i, numWidth);
    }
    
    // Columns 53-56: Additional columns if needed
    for (int i = 53; i <= 56; i++) {
        sheet.setColumnWidth(i, numWidth);
    }
}

    private int createDepartmentSection(Sheet sheet, JapaneseDashboardDTO data, int rowNum) {
        CellStyle titleStyle = createTitleStyle(sheet.getWorkbook());
        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());
        CellStyle numberStyle = createNumberStyle(sheet.getWorkbook());
        CellStyle totalStyle = createTotalStyle(sheet.getWorkbook());

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("By Department");
        titleRow.getCell(0).setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 0, 7));

        rowNum++;

        // Header Row 1
        Row headerRow1 = sheet.createRow(rowNum++);
        headerRow1.setHeight((short) 500);
        headerRow1.createCell(0).setCellValue("Department");
        headerRow1.getCell(0).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum, 0, 0));
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 5));
        Cell certifiedCell = headerRow1.createCell(1);
        certifiedCell.setCellValue("Certified");
        certifiedCell.setCellStyle(headerStyle);
        
        headerRow1.createCell(6).setCellValue("Not Certified");
        headerRow1.getCell(6).setCellStyle(headerStyle);
        headerRow1.createCell(7).setCellValue("Total");
        headerRow1.getCell(7).setCellStyle(headerStyle);

        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum, 7, 7));
        // Header Row 2
        Row headerRow2 = sheet.createRow(rowNum++);
        headerRow2.setHeight((short) 400);
        headerRow2.createCell(0).setCellValue("");
        headerRow2.getCell(0).setCellStyle(headerStyle);
        headerRow2.createCell(1).setCellValue("N1");
        headerRow2.getCell(1).setCellStyle(headerStyle);
        headerRow2.createCell(2).setCellValue("N2");
        headerRow2.getCell(2).setCellStyle(headerStyle);
        headerRow2.createCell(3).setCellValue("N3");
        headerRow2.getCell(3).setCellStyle(headerStyle);
        headerRow2.createCell(4).setCellValue("N4");
        headerRow2.getCell(4).setCellStyle(headerStyle);
        headerRow2.createCell(5).setCellValue("N5");
        headerRow2.getCell(5).setCellStyle(headerStyle);
        headerRow2.createCell(6).setCellValue("None");
        headerRow2.getCell(6).setCellStyle(headerStyle);
        headerRow2.createCell(7).setCellValue("");
        headerRow2.getCell(7).setCellStyle(headerStyle);

        // Data
        int totalN1 = 0, totalN2 = 0, totalN3 = 0, totalN4 = 0, totalN5 = 0, totalNone = 0, totalTotal = 0;

        for (JapaneseDashboardDTO.DeptCertifiedRow dept : data.getByDepartment()) {
            if ("Grand Total".equals(dept.getDepartment())) continue;
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(dept.getDepartment());
            row.createCell(1).setCellValue(dept.getN1());
            row.createCell(2).setCellValue(dept.getN2());
            row.createCell(3).setCellValue(dept.getN3());
            row.createCell(4).setCellValue(dept.getN4());
            row.createCell(5).setCellValue(dept.getN5());
            row.createCell(6).setCellValue(dept.getNone());
            row.createCell(7).setCellValue(dept.getTotal());

            totalN1 += dept.getN1();
            totalN2 += dept.getN2();
            totalN3 += dept.getN3();
            totalN4 += dept.getN4();
            totalN5 += dept.getN5();
            totalNone += dept.getNone();
            totalTotal += dept.getTotal();
        }

        // Grand Total
        Row totalRow = sheet.createRow(rowNum++);
        totalRow.createCell(0).setCellValue("Grand Total");
        totalRow.createCell(1).setCellValue(totalN1);
        totalRow.createCell(2).setCellValue(totalN2);
        totalRow.createCell(3).setCellValue(totalN3);
        totalRow.createCell(4).setCellValue(totalN4);
        totalRow.createCell(5).setCellValue(totalN5);
        totalRow.createCell(6).setCellValue(totalNone);
        totalRow.createCell(7).setCellValue(totalTotal);

        for (int i = 1; i <= 7; i++) {
            totalRow.getCell(i).setCellStyle(totalStyle);
        }

        int certified = totalN1 + totalN2 + totalN3 + totalN4 + totalN5;
        double rate = totalTotal > 0 ? (double) certified / totalTotal * 100 : 0;
        Row rateRow = sheet.createRow(rowNum++);
        rateRow.createCell(0).setCellValue("Certification Rate:");
        rateRow.createCell(1).setCellValue(String.format("%.1f%%", rate));

        return rowNum;
    }

    private int createTeamSection(Sheet sheet, JapaneseDashboardDTO data, int rowNum) {
        CellStyle titleStyle = createTitleStyle(sheet.getWorkbook());
        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());
        CellStyle numberStyle = createNumberStyle(sheet.getWorkbook());
        CellStyle totalStyle = createTotalStyle(sheet.getWorkbook());

        String target1 = data.getTarget1Date() != null ? data.getTarget1Date() : "Sep-2026";
        String target2 = data.getTarget2Date() != null ? data.getTarget2Date() : "Mar-2027";

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("By Team");
        titleRow.getCell(0).setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 0, 15));

        rowNum++;
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum, 0, 0));
        // Header Row 1
        Row headerRow1 = sheet.createRow(rowNum++);
        headerRow1.setHeight((short) 500);
        headerRow1.createCell(0).setCellValue("Team");
        headerRow1.getCell(0).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, 5));
        headerRow1.createCell(1).setCellValue("Current");
        headerRow1.getCell(1).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 6, 10));
        headerRow1.createCell(6).setCellValue(target1);
        headerRow1.getCell(6).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 11, 15));
        headerRow1.createCell(11).setCellValue(target2);
        headerRow1.getCell(11).setCellStyle(headerStyle);

        // Header Row 2
        Row headerRow2 = sheet.createRow(rowNum++);
        headerRow2.setHeight((short) 400);
        String[] subHeaders = {"", "N1", "N2", "N3", "N4", "N5", "N1", "N2", "N3", "N4", "N5", "N1", "N2", "N3", "N4", "N5"};
        for (int i = 0; i < subHeaders.length; i++) {
            Cell cell = headerRow2.createCell(i);
            cell.setCellValue(subHeaders[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data
        int[] totalCurrent = new int[5];
        int[] totalTarget1 = new int[5];
        int[] totalTarget2 = new int[5];

        for (JapaneseDashboardDTO.TeamLevelRow team : data.getByTeam()) {
            if ("Grand Total".equals(team.getTeam())) continue;
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(team.getTeam());

            int col = 1;
            if (team.getCurrent() != null) {
                row.createCell(col++).setCellValue(team.getCurrent().getN1());
                row.createCell(col++).setCellValue(team.getCurrent().getN2());
                row.createCell(col++).setCellValue(team.getCurrent().getN3());
                row.createCell(col++).setCellValue(team.getCurrent().getN4());
                row.createCell(col++).setCellValue(team.getCurrent().getN5());
                totalCurrent[0] += team.getCurrent().getN1();
                totalCurrent[1] += team.getCurrent().getN2();
                totalCurrent[2] += team.getCurrent().getN3();
                totalCurrent[3] += team.getCurrent().getN4();
                totalCurrent[4] += team.getCurrent().getN5();
            }
            if (team.getTarget1() != null) {
                row.createCell(col++).setCellValue(team.getTarget1().getN1());
                row.createCell(col++).setCellValue(team.getTarget1().getN2());
                row.createCell(col++).setCellValue(team.getTarget1().getN3());
                row.createCell(col++).setCellValue(team.getTarget1().getN4());
                row.createCell(col++).setCellValue(team.getTarget1().getN5());
                totalTarget1[0] += team.getTarget1().getN1();
                totalTarget1[1] += team.getTarget1().getN2();
                totalTarget1[2] += team.getTarget1().getN3();
                totalTarget1[3] += team.getTarget1().getN4();
                totalTarget1[4] += team.getTarget1().getN5();
            }
            if (team.getTarget2() != null) {
                row.createCell(col++).setCellValue(team.getTarget2().getN1());
                row.createCell(col++).setCellValue(team.getTarget2().getN2());
                row.createCell(col++).setCellValue(team.getTarget2().getN3());
                row.createCell(col++).setCellValue(team.getTarget2().getN4());
                row.createCell(col++).setCellValue(team.getTarget2().getN5());
                totalTarget2[0] += team.getTarget2().getN1();
                totalTarget2[1] += team.getTarget2().getN2();
                totalTarget2[2] += team.getTarget2().getN3();
                totalTarget2[3] += team.getTarget2().getN4();
                totalTarget2[4] += team.getTarget2().getN5();
            }
        }

        // Grand Total
        Row grandTotalRow = sheet.createRow(rowNum++);
        grandTotalRow.createCell(0).setCellValue("Grand Total");
        int col = 1;
        for (int i = 0; i < 5; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalCurrent[i]);
        }
        for (int i = 0; i < 5; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalTarget1[i]);
        }
        for (int i = 0; i < 5; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalTarget2[i]);
        }
        for (int i = 1; i <= 15; i++) {
            grandTotalRow.getCell(i).setCellStyle(totalStyle);
        }

        return rowNum;
    }

    private int createTeamCommunicationSection(Sheet sheet, JapaneseDashboardDTO data, int rowNum) {
        CellStyle titleStyle = createTitleStyle(sheet.getWorkbook());
        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());
        CellStyle numberStyle = createNumberStyle(sheet.getWorkbook());
        CellStyle totalStyle = createTotalStyle(sheet.getWorkbook());

        if (data.getByTeamComm().isEmpty()) return rowNum;

        String target1 = data.getTarget1Date() != null ? data.getTarget1Date() : "Sep-2026";
        String target2 = data.getTarget2Date() != null ? data.getTarget2Date() : "Mar-2027";

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("Team's Communication Improvement");
        titleRow.getCell(0).setCellStyle(titleStyle);

        rowNum++;

        // Fixed 8 communication levels
        String[] fullLevelKeys = {
            "Level 0 | None",
            "Level 1 | G1:Email writing-Chat with DIR and QA/bug/issues reporting using simple words",
            "Level 1 | G2:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool",
            "Level 1 | G3:Email writing-Chat with DIR, QA/bug/issues reporting, Understand requirements/documents with the supports from interpretation tool, Basic & Internal team daily conversation using simple words",
            "Level 2 | G1:Email reading/writing/MS team chat, Daily team conversation",
            "Level 2 | G2:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese",
            "Level 2 | G3:Email reading/writing/MS team chat, Daily team conversation, Understand/prepare the documents/requirements in Japanese, can Participate/discuss with Japanese Customers",
            "Level 3 | Lead Meeting with DIR/Japanese clients, Handle negotiations, Write formal proposal"
        };
        
        String[] shortLevelKeys = {"Level 0", "Level 1 | G1", "Level 1 | G2", "Level 1 | G3", "Level 2 | G1", "Level 2 | G2", "Level 2 | G3", "Level 3"};
        int levelCount = 8;

        // Header Row 1
        Row headerRow1 = sheet.createRow(rowNum++);
        headerRow1.setHeight((short) 500);
        headerRow1.createCell(0).setCellValue("Team");
        headerRow1.getCell(0).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 1, levelCount));
        headerRow1.createCell(1).setCellValue("Current");
        headerRow1.getCell(1).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, levelCount + 1, levelCount * 2));
        headerRow1.createCell(levelCount + 1).setCellValue(target1);
        headerRow1.getCell(levelCount + 1).setCellStyle(headerStyle);
        
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, levelCount * 2 + 1, levelCount * 3));
        headerRow1.createCell(levelCount * 2 + 1).setCellValue(target2);
        headerRow1.getCell(levelCount * 2 + 1).setCellStyle(headerStyle);

        // Header Row 2
        Row headerRow2 = sheet.createRow(rowNum++);
        headerRow2.setHeight((short) 400);
        headerRow2.createCell(0).setCellValue("");
        headerRow2.getCell(0).setCellStyle(headerStyle);
        
        for (int i = 0; i < levelCount; i++) {
            Cell cell = headerRow2.createCell(i + 1);
            cell.setCellValue(shortLevelKeys[i]);
            cell.setCellStyle(headerStyle);
        }
        for (int i = 0; i < levelCount; i++) {
            Cell cell = headerRow2.createCell(levelCount + 1 + i);
            cell.setCellValue(shortLevelKeys[i]);
            cell.setCellStyle(headerStyle);
        }
        for (int i = 0; i < levelCount; i++) {
            Cell cell = headerRow2.createCell(levelCount * 2 + 1 + i);
            cell.setCellValue(shortLevelKeys[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data
        int[] totalCurrent = new int[levelCount];
        int[] totalTarget1 = new int[levelCount];
        int[] totalTarget2 = new int[levelCount];

        for (JapaneseDashboardDTO.TeamCommRow teamComm : data.getByTeamComm()) {
            if ("Grand Total".equals(teamComm.getTeam())) continue;
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(teamComm.getTeam());

            int col = 1;
            for (int i = 0; i < levelCount; i++) {
                int val = teamComm.getCurrent() != null ? teamComm.getCurrent().getOrDefault(fullLevelKeys[i], 0) : 0;
                row.createCell(col++).setCellValue(val);
                totalCurrent[i] += val;
            }
            for (int i = 0; i < levelCount; i++) {
                int val = teamComm.getTarget1() != null ? teamComm.getTarget1().getOrDefault(fullLevelKeys[i], 0) : 0;
                row.createCell(col++).setCellValue(val);
                totalTarget1[i] += val;
            }
            for (int i = 0; i < levelCount; i++) {
                int val = teamComm.getTarget2() != null ? teamComm.getTarget2().getOrDefault(fullLevelKeys[i], 0) : 0;
                row.createCell(col++).setCellValue(val);
                totalTarget2[i] += val;
            }
        }

        // Grand Total
        Row grandTotalRow = sheet.createRow(rowNum++);
        grandTotalRow.createCell(0).setCellValue("Grand Total");
        int col = 1;
        for (int i = 0; i < levelCount; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalCurrent[i]);
        }
        for (int i = 0; i < levelCount; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalTarget1[i]);
        }
        for (int i = 0; i < levelCount; i++) {
            grandTotalRow.createCell(col++).setCellValue(totalTarget2[i]);
        }
        for (int i = 1; i < col; i++) {
            grandTotalRow.getCell(i).setCellStyle(totalStyle);
        }

        return rowNum;
    }


    private int createCommunicationCapabilitySection(Sheet sheet, JapaneseDashboardDTO data, int rowNum) {
        CellStyle titleStyle = createTitleStyle(sheet.getWorkbook());
        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());
        CellStyle numberStyle = createNumberStyle(sheet.getWorkbook());
        CellStyle totalStyle = createTotalStyle(sheet.getWorkbook());
        CellStyle wrapStyle = createWrapStyle(sheet.getWorkbook());

        String target1 = data.getTarget1Date() != null ? data.getTarget1Date() : "Sep-2026";
        String target2 = data.getTarget2Date() != null ? data.getTarget2Date() : "Mar-2027";

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("Communication Capability");
        titleRow.getCell(0).setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 0, 3));

        rowNum++;

        // Header
        Row headerRow = sheet.createRow(rowNum++);
        headerRow.setHeight((short) 500);
        headerRow.createCell(0).setCellValue("Level");
        headerRow.getCell(0).setCellStyle(headerStyle);
        headerRow.createCell(1).setCellValue("Current");
        headerRow.getCell(1).setCellStyle(headerStyle);
        headerRow.createCell(2).setCellValue(target1);
        headerRow.getCell(2).setCellStyle(headerStyle);
        headerRow.createCell(3).setCellValue(target2);
        headerRow.getCell(3).setCellStyle(headerStyle);

        // Data with wrapped text
        int totalCurrent = 0, totalTarget1 = 0, totalTarget2 = 0;
        for (JapaneseDashboardDTO.CommCapabilityRow comm : data.getCommCapability()) {
            Row row = sheet.createRow(rowNum++);
            row.setHeight((short) -1);

            Cell levelCell = row.createCell(0);
            levelCell.setCellValue(comm.getLevel());
            levelCell.setCellStyle(wrapStyle);

            row.createCell(1).setCellValue(comm.getCurrent());
            row.createCell(2).setCellValue(comm.getTarget1());
            row.createCell(3).setCellValue(comm.getTarget2());

            row.getCell(1).setCellStyle(numberStyle);
            row.getCell(2).setCellStyle(numberStyle);
            row.getCell(3).setCellStyle(numberStyle);

            totalCurrent += comm.getCurrent();
            totalTarget1 += comm.getTarget1();
            totalTarget2 += comm.getTarget2();
        }

        // Total
        Row totalRow = sheet.createRow(rowNum++);
        totalRow.createCell(0).setCellValue("Total");
        totalRow.createCell(1).setCellValue(totalCurrent);
        totalRow.createCell(2).setCellValue(totalTarget1);
        totalRow.createCell(3).setCellValue(totalTarget2);
        for (int i = 1; i <= 3; i++) {
            totalRow.getCell(i).setCellStyle(totalStyle);
        }

        return rowNum;
    }

    private int createNoCertSection(Sheet sheet, JapaneseDashboardDTO data, int rowNum) {
        CellStyle titleStyle = createTitleStyle(sheet.getWorkbook());
        CellStyle headerStyle = createHeaderStyle(sheet.getWorkbook());
        CellStyle numberStyle = createNumberStyle(sheet.getWorkbook());
        CellStyle totalStyle = createTotalStyle(sheet.getWorkbook());

        String target1 = data.getTarget1Date() != null ? data.getTarget1Date() : "Sep-2026";
        String target2 = data.getTarget2Date() != null ? data.getTarget2Date() : "Mar-2027";

        // Title
        Row titleRow = sheet.createRow(rowNum++);
        titleRow.createCell(0).setCellValue("No Certified Members");
        titleRow.getCell(0).setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum - 1, rowNum - 1, 0, 3));

        rowNum++;

        // Header
        Row headerRow = sheet.createRow(rowNum++);
        headerRow.setHeight((short) 500);
        headerRow.createCell(0).setCellValue("Team");
        headerRow.getCell(0).setCellStyle(headerStyle);
        headerRow.createCell(1).setCellValue("Current");
        headerRow.getCell(1).setCellStyle(headerStyle);
        headerRow.createCell(2).setCellValue(target1);
        headerRow.getCell(2).setCellStyle(headerStyle);
        headerRow.createCell(3).setCellValue(target2);
        headerRow.getCell(3).setCellStyle(headerStyle);

        // Data
        int totalCurrent = 0, totalTarget1 = 0, totalTarget2 = 0;
        for (JapaneseDashboardDTO.NoCertMemberRow member : data.getNoCertMembers()) {
            if ("Grand Total".equals(member.getTeam())) continue;
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(member.getTeam());
            row.createCell(1).setCellValue(member.getCurrent());
            row.createCell(2).setCellValue(member.getTarget1());
            row.createCell(3).setCellValue(member.getTarget2());
            totalCurrent += member.getCurrent();
            totalTarget1 += member.getTarget1();
            totalTarget2 += member.getTarget2();
        }

        // Grand Total
        Row totalRow = sheet.createRow(rowNum++);
        totalRow.createCell(0).setCellValue("Grand Total");
        totalRow.createCell(1).setCellValue(totalCurrent);
        totalRow.createCell(2).setCellValue(totalTarget1);
        totalRow.createCell(3).setCellValue(totalTarget2);
        for (int i = 1; i <= 3; i++) {
            totalRow.getCell(i).setCellStyle(totalStyle);
        }

        return rowNum;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }


    private CellStyle createTotalStyle(Workbook workbook) {
        CellStyle style = createNumberStyle(workbook);
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private CellStyle createWrapStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setWrapText(true);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
}