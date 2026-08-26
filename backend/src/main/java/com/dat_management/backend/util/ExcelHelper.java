// ExcelHelper.java
package com.dat_management.backend.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class ExcelHelper {
    
    // Constants for sheet names
    public static final String SHEET_EMPLOYEES = "Employees";
    public static final String SHEET_TECHNICAL = "②Technical ability";
    public static final String SHEET_DEVELOPMENT = "Development Experiences";
    
    // Header definitions
    public static final String[] EMPLOYEE_HEADERS = {
        "ID", "Name", "Department", "Team", "Rank", "Core Personnel", "Business Trip to Japan",
        "Management Experience Level", "QCD Score", "Report/Consult Score", "Education Score", "Total Level",
        "Language Level", "JLPT/NAT Level"
    };
    
    public static final String[] DEVELOPMENT_HEADERS = {
        "System Type", "System Name", "Host/Distributed", "Online/Batch", "Years of Experience", "Process Name"
    };
    
    public static final String[] TECHNICAL_SKILL_HEADERS = {
        "Skill Name", "Category", "Sub Category", "Years of Experience", "Experience Type", "Position", "Number of Managers"
    };
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    public static boolean isValidExcelFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }
        return contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
               contentType.equals("application/vnd.ms-excel") ||
               file.getOriginalFilename() != null && file.getOriginalFilename().endsWith(".xlsx");
    }
    
    public static Workbook getWorkbook(MultipartFile file) throws IOException {
        return new XSSFWorkbook(file.getInputStream());
    }
    
    public static String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double value = cell.getNumericCellValue();
                if (value == (long) value) {
                    return String.valueOf((long) value);
                }
                return String.valueOf(value);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (IllegalStateException e) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BLANK:
                return null;
            default:
                return null;
        }
    }
    
    public static Double getCellValueAsDouble(Cell cell) {
        if (cell == null) return null;
        
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    return cell.getNumericCellValue();
                case STRING:
                    String value = cell.getStringCellValue().trim();
                    if (value.isEmpty()) return null;
                    return Double.parseDouble(value);
                case FORMULA:
                    try {
                        return cell.getNumericCellValue();
                    } catch (Exception e) {
                        return null;
                    }
                default:
                    return null;
            }
        } catch (NumberFormatException e) {
            return null;
        }
    }
    
    public static Integer getCellValueAsInteger(Cell cell) {
        Double value = getCellValueAsDouble(cell);
        return value != null ? value.intValue() : null;
    }
    
    public static BigDecimal getCellValueAsBigDecimal(Cell cell) {
        Double value = getCellValueAsDouble(cell);
        return value != null ? BigDecimal.valueOf(value) : null;
    }
    
    public static Boolean getCellValueAsBoolean(Cell cell) {
        if (cell == null) return false;
        
        switch (cell.getCellType()) {
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case STRING:
                String value = cell.getStringCellValue().trim().toLowerCase();
                return "true".equals(value) || "yes".equals(value) || "1".equals(value) || "y".equals(value);
            case NUMERIC:
                return cell.getNumericCellValue() != 0;
            default:
                return false;
        }
    }
    
    public static void createCell(Row row, int columnIndex, Object value, CellStyle style) {
        Cell cell = row.createCell(columnIndex);
        if (value != null) {
            if (value instanceof String) {
                cell.setCellValue((String) value);
            } else if (value instanceof Number) {
                cell.setCellValue(((Number) value).doubleValue());
            } else if (value instanceof Boolean) {
                cell.setCellValue((Boolean) value);
            } else if (value instanceof LocalDate) {
                cell.setCellValue(((LocalDate) value).format(DATE_FORMATTER));
            } else if (value instanceof BigDecimal) {
                cell.setCellValue(((BigDecimal) value).doubleValue());
            } else {
                cell.setCellValue(value.toString());
            }
        }
        if (style != null) {
            cell.setCellStyle(style);
        }
    }
    
    public static CellStyle getHeaderCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
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
    
    public static CellStyle getDataCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }
    
    public static CellStyle getNumericCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("#,##0.0"));
        return style;
    }
    
    public static void autoSizeColumns(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            int width = sheet.getColumnWidth(i);
            if (width < 3000) {
                sheet.setColumnWidth(i, 3000);
            } else if (width > 15000) {
                sheet.setColumnWidth(i, 15000);
            }
        }
    }
    
    public static Map<String, Integer> createHeaderMap(Row headerRow) {
        Map<String, Integer> columnMap = new LinkedHashMap<>();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            if (cell != null) {
                String header = getCellValueAsString(cell);
                if (header != null && !header.isEmpty()) {
                    String rawHeader = header.trim();
                    columnMap.put(rawHeader, i);
                    columnMap.put(normalizeHeader(rawHeader), i);
                }
            }
        }
        return columnMap;
    }

    public static String normalizeHeader(String header) {
        if (header == null) {
            return null;
        }
        return header.trim()
            .replace('\u00A0', ' ')
            .replaceAll("\\s+", " ")
            .toLowerCase(Locale.ROOT);
    }
    
    public static boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(cell);
                if (value != null && !value.isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }
}
