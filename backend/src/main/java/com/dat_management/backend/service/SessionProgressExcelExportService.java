package com.dat_management.backend.service;

import com.dat_management.backend.dto.AccumulativeSessionProgressDTO;
import com.dat_management.backend.dto.SessionProgressReportDTO;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds an .xlsx export with two sheets:
 * 1. "Session Progress" - individual session progress report
 * 2. "Accumulative Progress" - accumulative session progress report
 */
@Service
@RequiredArgsConstructor
public class SessionProgressExcelExportService {

    private final SessionProgressService sessionProgressService;
    private final AccumulativeSessionProgressService accumulativeSessionProgressService;

    private static final DateTimeFormatter DEADLINE_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy");

    // Session Progress headers
    private static final String[] SESSION_TOP_HEADERS = {
            "Session", "Session deadline", "Member Name",
            "JLPT Level", "", "Grammar Count", "", "Vocabulary Count", "",
            "Kanji Count", "", "Reading (min)", "", "Listening (min)", "",
            "% Complete", "Status"
    };

    private static final String[] SESSION_SUB_HEADERS = {
            "", "", "",
            "Certified", "Exam Target", "Current", "Target", "Current", "Target",
            "Current", "Target", "Current", "Target", "Current", "Target",
            "", ""
    };

    private static final int SESSION_COLUMN_COUNT = SESSION_TOP_HEADERS.length;

    // Accumulative Progress headers
    private static final String[] ACCUM_TOP_HEADERS = {
            "Session", "Session deadline", "Member Name",
            "JLPT Level", "", "Total Grammar Count", "", "Total Vocabulary Count", "",
            "Total Kanji Count", "", "Total Reading (min)", "", "Total Listening (min)", "",
            "% Complete", "", "Status"
    };

    private static final String[] ACCUM_SUB_HEADERS = {
            "", "", "",
            "Certified", "Exam Target", "Current", "Target", "Current", "Target",
            "Current", "Target", "Current", "Target", "Current", "Target",
            "Actual", "Target", ""
    };

    private static final int ACCUM_COLUMN_COUNT = ACCUM_TOP_HEADERS.length;

    /**
     * Export both session progress and accumulative progress to a single Excel file
     * with two sheets.
     */
    public ByteArrayInputStream exportAllProgressToExcel(Integer courseId) throws IOException {
        List<SessionProgressReportDTO> sessionReportList =
                sessionProgressService.getSessionProgressReportByCourseId(courseId);
        List<AccumulativeSessionProgressDTO> accumReportList =
                accumulativeSessionProgressService.getAccumulativeProgressByCourseId(courseId);

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Create Session Progress sheet
            Sheet sessionSheet = workbook.createSheet("Session Progress");
            buildSessionProgressSheet(sessionSheet, sessionReportList, workbook);

            // Create Accumulative Progress sheet
            Sheet accumSheet = workbook.createSheet("Accumulative Progress");
            buildAccumulativeProgressSheet(accumSheet, accumReportList, workbook);

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    /**
     * Build the Session Progress sheet
     */
    private void buildSessionProgressSheet(Sheet sheet, List<SessionProgressReportDTO> reportList,
                                            Workbook workbook) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle leftDataStyle = createDataStyle(workbook, HorizontalAlignment.LEFT);
        CellStyle centerDataStyle = createDataStyle(workbook, HorizontalAlignment.CENTER);

        buildSessionHeader(sheet, headerStyle);
        buildSessionDataRows(sheet, reportList, leftDataStyle, centerDataStyle);
        autoSizeColumns(sheet, SESSION_COLUMN_COUNT);
        sheet.createFreezePane(0, 2);
    }

    /**
     * Build the Accumulative Progress sheet
     */
    private void buildAccumulativeProgressSheet(Sheet sheet, List<AccumulativeSessionProgressDTO> reportList,
                                                 Workbook workbook) {
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle leftDataStyle = createDataStyle(workbook, HorizontalAlignment.LEFT);
        CellStyle centerDataStyle = createDataStyle(workbook, HorizontalAlignment.CENTER);

        buildAccumulativeHeader(sheet, headerStyle);
        buildAccumulativeDataRows(sheet, reportList, leftDataStyle, centerDataStyle);
        autoSizeColumns(sheet, ACCUM_COLUMN_COUNT);
        sheet.createFreezePane(0, 2);
    }

    // ==================== SESSION PROGRESS HEADER ====================

    private void buildSessionHeader(Sheet sheet, CellStyle headerStyle) {
        Row row0 = sheet.createRow(0);
        Row row1 = sheet.createRow(1);

        for (int i = 0; i < SESSION_COLUMN_COUNT; i++) {
            Cell topCell = row0.createCell(i);
            topCell.setCellValue(SESSION_TOP_HEADERS[i]);
            topCell.setCellStyle(headerStyle);

            Cell subCell = row1.createCell(i);
            subCell.setCellValue(SESSION_SUB_HEADERS[i]);
            subCell.setCellStyle(headerStyle);
        }

        // Vertically merge the single-column headers
        int[] verticalMergeCols = {0, 1, 2, 15, 16};
        for (int col : verticalMergeCols) {
            sheet.addMergedRegion(new CellRangeAddress(0, 1, col, col));
        }

        // Horizontally merge the grouped headers
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 3, 4));   // JLPT Level
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 5, 6));   // Grammar Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 7, 8));   // Vocabulary Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 9, 10));  // Kanji Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 11, 12)); // Reading (min)
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 13, 14)); // Listening (min)
    }

    // ==================== SESSION PROGRESS DATA ====================

    private void buildSessionDataRows(Sheet sheet, List<SessionProgressReportDTO> reportList,
                                       CellStyle leftDataStyle, CellStyle centerDataStyle) {
        int rowIdx = 2;
        for (SessionProgressReportDTO report : reportList) {
            Row row = sheet.createRow(rowIdx++);
            int col = 0;

            createSessionCell(row, col++, report.getSessionNo(), centerDataStyle);
            createSessionCell(row, col++, formatDeadline(report.getSessionDeadline()), centerDataStyle);
            createSessionCell(row, col++, report.getMemberName(), leftDataStyle);
            createSessionCell(row, col++, report.getCertifiedLevel(), centerDataStyle);
            createSessionCell(row, col++, report.getExamTarget(), centerDataStyle);
            createSessionCell(row, col++, report.getCurrentGrammar(), centerDataStyle);
            createSessionCell(row, col++, report.getTargetGrammar(), centerDataStyle);
            createSessionCell(row, col++, report.getCurrentVocabulary(), centerDataStyle);
            createSessionCell(row, col++, report.getTargetVocabulary(), centerDataStyle);
            createSessionCell(row, col++, report.getCurrentKanji(), centerDataStyle);
            createSessionCell(row, col++, report.getTargetKanji(), centerDataStyle);
            createSessionCell(row, col++, report.getCurrentReadingMin(), centerDataStyle);
            createSessionCell(row, col++, report.getTargetReadingMin(), centerDataStyle);
            createSessionCell(row, col++, report.getCurrentListeningMin(), centerDataStyle);
            createSessionCell(row, col++, report.getTargetListeningMin(), centerDataStyle);
            createSessionCell(row, col++, formatSessionPercentage(report.getPercentageComplete()), centerDataStyle);
            createSessionCell(row, col, report.getStatus(), centerDataStyle);
        }
    }

    private String formatSessionPercentage(Double percentage) {
        return (percentage != null ? percentage : 0.0) + "%";
    }

    private void createSessionCell(Row row, int col, Object value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }

    // ==================== ACCUMULATIVE PROGRESS HEADER ====================

    private void buildAccumulativeHeader(Sheet sheet, CellStyle headerStyle) {
        Row row0 = sheet.createRow(0);
        Row row1 = sheet.createRow(1);

        for (int i = 0; i < ACCUM_COLUMN_COUNT; i++) {
            Cell topCell = row0.createCell(i);
            topCell.setCellValue(ACCUM_TOP_HEADERS[i]);
            topCell.setCellStyle(headerStyle);

            Cell subCell = row1.createCell(i);
            subCell.setCellValue(ACCUM_SUB_HEADERS[i]);
            subCell.setCellStyle(headerStyle);
        }

        // Vertically merge the single-column headers
        int[] verticalMergeCols = {0, 1, 2, 17};
        for (int col : verticalMergeCols) {
            sheet.addMergedRegion(new CellRangeAddress(0, 1, col, col));
        }

        // Horizontally merge the grouped headers
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 3, 4));   // JLPT Level
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 5, 6));   // Total Grammar Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 7, 8));   // Total Vocabulary Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 9, 10));  // Total Kanji Count
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 11, 12)); // Total Reading (min)
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 13, 14)); // Total Listening (min)
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 15, 16)); // % Complete
    }

    // ==================== ACCUMULATIVE PROGRESS DATA ====================

    private void buildAccumulativeDataRows(Sheet sheet, List<AccumulativeSessionProgressDTO> reportList,
                                            CellStyle leftDataStyle, CellStyle centerDataStyle) {
        int rowIdx = 2;
        for (AccumulativeSessionProgressDTO report : reportList) {
            Row row = sheet.createRow(rowIdx++);
            int col = 0;

            createAccumulativeCell(row, col++, report.getSessionNo(), centerDataStyle);
            createAccumulativeCell(row, col++, formatDeadline(report.getSessionDeadline()), centerDataStyle);
            createAccumulativeCell(row, col++, report.getMemberName(), leftDataStyle);
            createAccumulativeCell(row, col++, report.getCertifiedLevel(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getExamTarget(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getCurrentGrammar(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getTargetGrammar(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getCurrentVocabulary(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getTargetVocabulary(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getCurrentKanji(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getTargetKanji(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getCurrentReadingMin(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getTargetReadingMin(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getCurrentListeningMin(), centerDataStyle);
            createAccumulativeCell(row, col++, report.getTargetListeningMin(), centerDataStyle);
            createAccumulativeCell(row, col++, formatAccumulativePercentage(report.getActualPercentage()), centerDataStyle);
            createAccumulativeCell(row, col++, formatAccumulativePercentage(report.getTargetPercentage()), centerDataStyle);
            createAccumulativeCell(row, col, report.getStatus(), centerDataStyle);
        }
    }

    private String formatDeadline(LocalDateTime deadline) {
        return deadline != null ? deadline.format(DEADLINE_FORMATTER) : "-";
    }

    private String formatAccumulativePercentage(Double percentage) {
        return percentage != null ? (percentage + "%") : "-";
    }

    private void createAccumulativeCell(Row row, int col, Object value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value == null) {
            cell.setCellValue("-");
        } else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else {
            String text = value.toString();
            cell.setCellValue(text.isEmpty() ? "-" : text);
        }
        cell.setCellStyle(style);
    }

    // ==================== COMMON UTILITY METHODS ====================

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        setBorders(style);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook, HorizontalAlignment alignment) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(alignment);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        setBorders(style);
        return style;
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
        }

         sheet.setColumnWidth(0, 3000);
    }
}