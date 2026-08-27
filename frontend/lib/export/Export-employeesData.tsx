// lib/export/Export-employeesData.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Employee } from '@/types/employee';

// ===== HELPER: Determine the correct data type =====
function getCellValue(value: any): any {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    
    const strValue = String(value).trim();
    if (strValue === '') {
        return null;
    }
    
    //  CASE 1: Date detection (MM/DD/YYYY, DD/MM/YYYY, etc.)
    const dateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    if (dateRegex.test(strValue)) {
        const date = new Date(strValue);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    //  CASE 2: Pure number (no leading zeros, no special characters)
    // Handles: 123, 123.45, -123, 123.45
    if (/^-?\d+(\.\d+)?$/.test(strValue) && !strValue.startsWith('0')) {
        const num = Number(strValue);
        if (!isNaN(num)) {
            return num;
        }
    }
    
    //  CASE 3: Staff ID format: 05-00003, 25-00004 (keep as text)
    if (/^\d{2}-\d{5}$/.test(strValue) || /^\d{2}-\d{3}$/.test(strValue)) {
        return strValue;
    }
    
    //  CASE 4: Div format: 000-001, 000-003 (keep as text)
    if (/^\d{3}-\d{3}$/.test(strValue)) {
        return strValue;
    }
    
    //  CASE 5: DoorLog numbers - pure numbers only, no leading zeros
    if (/^\d+$/.test(strValue) && !strValue.startsWith('0')) {
        const num = Number(strValue);
        if (!isNaN(num) && num > 0) {
            return num;
        }
    }
    
    //  CASE 6: DoorLog with leading zeros - keep as text
    if (/^0\d+$/.test(strValue)) {
        return strValue;
    }
    
    //  Default: return as text
    return strValue;
}

// ===== HELPER: Get appropriate Excel number format =====
function getExcelNumberFormat(field: string, value: any): string | undefined {
    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    
    const strValue = String(value).trim();
    
    // Staff ID: always text (has hyphens)
    if (field === 'staffId' || field === 'div') {
        return '@';
    }
    
    // DoorLog: number if pure number without leading zeros
    if (field === 'doorLog') {
        if (/^\d+$/.test(strValue) && !strValue.startsWith('0')) {
            return '0'; // Number format
        }
        return '@'; // Text format for leading zeros
    }
    
    // Status, Role, Name, Dept, Team: text
    if (['status', 'role', 'name', 'dept', 'team'].includes(field)) {
        return '@';
    }
    
    return undefined;
}

// ===== EXCEL EXPORT =====
export const exportEmployeesToExcel = async (
    employeeData: Employee[],
    options?: {
        fileName?: string;
        useTemplate?: boolean;
        templatePath?: string;
        columnMapping?: { [key: string]: string };
        columnWidths?: { [key: string]: number };
    }
): Promise<void> => {
    try {
        const {
            fileName = `Employees_${new Date().toISOString().split('T')[0]}.xlsx`,
            useTemplate = true,
            templatePath = '/templates/employee_template.xlsx',
            columnMapping,
            columnWidths
        } = options || {};

        let workbook: ExcelJS.Workbook;
        let worksheet: ExcelJS.Worksheet;

        // Column mapping: Excel column -> data field
        const defaultColumnMapping: { [key: string]: string } = {
            'B': 'div',        // Div (column B)
            'C': 'staffId',    // Staff ID (column C)
            'D': 'name',       // Name (column D)
            'E': 'doorLog',    // DoorLog (column E)
            'F': 'dept',       // Dept (column F)
            'G': 'team',       // Team (column G)
            'H': 'status',     // Status (column H)
            'I': 'role'        // Role (column I)
        };

        const finalMapping = columnMapping || defaultColumnMapping;

        if (useTemplate) {
            try {
                // Load template
                const templateResponse = await fetch(templatePath);
                if (!templateResponse.ok) {
                    console.warn('⚠️ Template not found, using fallback');
                    return exportEmployeesToExcel(employeeData, { ...options, useTemplate: false });
                }
                const templateBuffer = await templateResponse.arrayBuffer();

                const templateWorkbook = new ExcelJS.Workbook();
                await templateWorkbook.xlsx.load(templateBuffer);
                const templateWorksheet = templateWorkbook.getWorksheet(1);

                if (!templateWorksheet) {
                    throw new Error('Template worksheet not found');
                }

                // Create a NEW workbook
                workbook = new ExcelJS.Workbook();
                workbook.creator = 'Employee Management System';
                workbook.created = new Date();

                //  SET SHEET NAME TO "Employee_data"
                const sheetName = 'Employee_data';
                worksheet = workbook.addWorksheet(sheetName, {
                    properties: { tabColor: { argb: 'FF4472C4' } }
                });

                // ===== COPY COLUMN WIDTHS FROM TEMPLATE =====
                const columnCount = templateWorksheet.columns.length || 10;
                for (let colIndex = 1; colIndex <= columnCount; colIndex++) {
                    const col = templateWorksheet.getColumn(colIndex);
                    if (col.width) {
                        worksheet.getColumn(colIndex).width = col.width;
                    }
                }

                // ===== COPY ALL ROWS AND STYLES FROM TEMPLATE =====
                const rowCount = templateWorksheet.rowCount;

                for (let rowNum = 1; rowNum <= rowCount; rowNum++) {
                    const sourceRow = templateWorksheet.getRow(rowNum);
                    const targetRow = worksheet.getRow(rowNum);

                    if (sourceRow.height) {
                        targetRow.height = sourceRow.height;
                    }

                    sourceRow.eachCell((cell, colNumber) => {
                        const targetCell = targetRow.getCell(colNumber);
                        targetCell.value = cell.value;

                        if (cell.font) targetCell.font = { ...cell.font };
                        if (cell.fill) targetCell.fill = { ...cell.fill };
                        if (cell.alignment) targetCell.alignment = { ...cell.alignment };
                        if (cell.border) targetCell.border = { ...cell.border };
                        if (cell.numFmt) targetCell.numFmt = cell.numFmt;
                    });
                }

                // ===== COPY MERGED CELLS =====
                if (templateWorksheet.mergedCells) {
                    // @ts-ignore - mergedCells is not in the types but exists
                    const merges = templateWorksheet.mergedCells || [];
                    if (Array.isArray(merges)) {
                        merges.forEach((merge: any) => {
                            if (merge && merge.top && merge.left && merge.bottom && merge.right) {
                                try {
                                    worksheet.mergeCells(
                                        merge.top,
                                        merge.left,
                                        merge.bottom,
                                        merge.right
                                    );
                                } catch (e) {
                                    // Skip if merge fails
                                }
                            }
                        });
                    }
                }

                // ===== OVERRIDE WITH CUSTOM WIDTHS IF PROVIDED =====
                if (columnWidths) {
                    Object.entries(columnWidths).forEach(([col, width]) => {
                        const colIndex = col.charCodeAt(0) - 64;
                        worksheet.getColumn(colIndex).width = width;
                    });
                }

                // ===== FIND HEADER ROW =====
                let headerRowIndex = 0;
                let dataStartRow = 0;

                for (let rowNum = 1; rowNum <= Math.min(20, worksheet.rowCount); rowNum++) {
                    const row = worksheet.getRow(rowNum);
                    let headerCells = 0;

                    row.eachCell((cell) => {
                        const value = cell.value?.toString()?.toLowerCase()?.trim() || '';
                        const headerKeywords = ['sr.', 'sr', 'div', 'staff', 'id', 'name', 'doorlog', 'dept', 'team', 'status', 'role'];
                        if (headerKeywords.some(keyword => value.includes(keyword))) {
                            headerCells++;
                        }
                    });

                    if (headerCells >= 3) {
                        headerRowIndex = rowNum;
                        dataStartRow = rowNum + 1;
                        break;
                    }
                }

                // If no header found, use default
                if (headerRowIndex === 0) {
                    dataStartRow = 4;
                }

                // ===== CLEAR EXISTING DATA ROWS =====
                for (let rowNum = dataStartRow; rowNum <= 1000; rowNum++) {
                    const row = worksheet.getRow(rowNum);
                    let hasData = false;

                    row.eachCell((cell) => {
                        if (cell.value && cell.value.toString().trim()) {
                            hasData = true;
                        }
                    });

                    if (hasData) {
                        row.eachCell((cell) => {
                            cell.value = null;
                        });
                    }
                }

                // ===== INSERT DATA WITH SMART TYPE DETECTION =====
                employeeData.forEach((emp, index) => {
                    const rowNum = dataStartRow + index;
                    const row = worksheet.getRow(rowNum);

                    // Column A: Sr. (always number)
                    const srCell = row.getCell(1);
                    srCell.value = index + 1;
                    srCell.alignment = { horizontal: 'center', vertical: 'middle' };
                    srCell.font = { name: 'Arial', size: 10 };
                    srCell.numFmt = '0';

                    // Insert data with smart type detection
                    Object.entries(finalMapping).forEach(([column, field]) => {
                        const colIndex = column.charCodeAt(0) - 64;
                        const cell = row.getCell(colIndex);

                        // Get raw value
                        let rawValue = '';
                        switch (field) {
                            case 'div': rawValue = emp.div_name || ''; break;
                            case 'staffId': rawValue = emp.id || ''; break;
                            case 'name': rawValue = emp.name || ''; break;
                            case 'email': rawValue = emp.email || ''; break;
                            case 'doorLog': rawValue = emp.doorlog || ''; break;
                            case 'dept': rawValue = emp.dept_dat || ''; break;
                            case 'team': rawValue = emp.team || ''; break;
                            case 'status': rawValue = emp.status || ''; break;
                            case 'role': rawValue = emp.role || ''; break;
                            default: rawValue = (emp as any)[field] || '';
                        }

                        //  Determine correct type and format
                        const processedValue = getCellValue(rawValue);
                        const numberFormat = getExcelNumberFormat(field, rawValue);

                        // Set value with proper format
                        cell.value = processedValue;
                        if (numberFormat) {
                            cell.numFmt = numberFormat;
                        }

                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                        cell.font = { name: 'Arial', size: 10 };
                    });

                    row.height = 20;
                });


            } catch (error) {
                console.warn('⚠️ Template loading failed, using fallback:', error);
                return exportEmployeesToExcel(employeeData, { ...options, useTemplate: false });
            }

        } else {
            // ===== PROGRAMMATIC APPROACH =====
            workbook = new ExcelJS.Workbook();
            workbook.creator = 'Employee Management System';
            workbook.created = new Date();

            //  SET SHEET NAME TO "Employee_data"
            worksheet = workbook.addWorksheet('Employee_data', {
                properties: { tabColor: { argb: 'FF4472C4' } }
            });

            // Title row
            const titleRow = worksheet.getRow(1);
            const titleCell = titleRow.getCell(1);
            titleCell.value = 'User List';
            titleCell.font = { name: 'Arial', size: 16, bold: true };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells('A1:I1');

            // Subtitle row
            const subtitleRow = worksheet.getRow(2);
            const subtitleCell = subtitleRow.getCell(1);
            subtitleCell.value = 'InActive must be changed when Employee is Resigned.';
            subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF666666' } };
            subtitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
            worksheet.mergeCells('A2:I2');

            // Default widths if not provided
            const defaultWidths = {
                'A': 8, 'B': 15, 'C': 18, 'D': 30, 'E': 15, 'F': 35, 'G': 25, 'H': 15, 'I': 20
            };
            const widths = columnWidths || defaultWidths;

            // Headers
            const headers = [
                { key: 'sr', label: 'Sr.', width: widths['A'] || 8 },
                { key: 'div', label: 'Div', width: widths['B'] || 15 },
                { key: 'staffId', label: 'Staff ID', width: widths['C'] || 18 },
                { key: 'name', label: 'Name', width: widths['D'] || 30 },
                { key: 'doorLog', label: 'DoorLog', width: widths['E'] || 15 },
                { key: 'dept', label: 'Dept', width: widths['F'] || 35 },
                { key: 'team', label: 'Team', width: widths['G'] || 25 },
                { key: 'status', label: 'Status', width: widths['H'] || 15 },
                { key: 'role', label: 'Role', width: widths['I'] || 20 }
            ];

            const headerRow = worksheet.getRow(3);
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header.label;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 11 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
                worksheet.getColumn(index + 1).width = header.width;
            });
            headerRow.height = 25;

            // Data rows with smart type detection
            employeeData.forEach((emp, index) => {
                const rowNum = index + 4;
                const row = worksheet.getRow(rowNum);
                const isEven = index % 2 === 0;

                const rawData = [
                    { field: 'sr', value: index + 1 },
                    { field: 'div', value: emp.div_name || '' },
                    { field: 'staffId', value: emp.id || '' },
                    { field: 'name', value: emp.name || '' },
                    { field: 'doorLog', value: emp.doorlog || '' },
                    { field: 'dept', value: emp.dept_dat || '' },
                    { field: 'team', value: emp.team || '' },
                    { field: 'status', value: emp.status || '' },
                    { field: 'role', value: emp.role || '' }
                ];

                rawData.forEach((item, colIndex) => {
                    const cell = row.getCell(colIndex + 1);
                    
                    //  Smart type detection
                    if (item.field === 'sr') {
                        cell.value = item.value;
                        cell.numFmt = '0';
                    } else {
                        const processedValue = getCellValue(item.value);
                        const numberFormat = getExcelNumberFormat(item.field, item.value);
                        
                        cell.value = processedValue;
                        if (numberFormat) {
                            cell.numFmt = numberFormat;
                        }
                    }
                    
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    cell.font = { name: 'Arial', size: 10 };

                    if (isEven) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
                    }

                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                    };
                });

                row.height = 20;
            });

            worksheet.views = [{ state: 'frozen', ySplit: 3 }];
        }

        // Generate file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, fileName);


    } catch (error) {
        console.error('❌ Export error:', error);
        throw error;
    }
};

// ===== CSV EXPORT =====
export const exportEmployeesToCSV = async (
    employeeData: Employee[],
    fileName?: string
): Promise<void> => {
    try {
        const headers = ['Sr.', 'Div', 'Staff ID', 'Name', 'DoorLog', 'Dept', 'Team', 'Status', 'Role'];

        let csvContent = '\uFEFF' + headers.join(',') + '\n';
        employeeData.forEach((emp, index) => {
            const row = [
                index + 1,
                emp.div_name || '',
                emp.id || '',
                emp.name || '',
                emp.doorlog || '',
                emp.dept_dat || '',
                emp.team || '',
                emp.status || '',
                emp.role || ''
            ].map(value => {
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const defaultFileName = fileName || `Employees_${new Date().toISOString().split('T')[0]}.csv`;
        saveAs(blob, defaultFileName);

    } catch (error) {
        console.error('❌ CSV export error:', error);
        throw error;
    }
};

// ===== PDF EXPORT =====
export const exportEmployeesToPDF = async (
    employeeData: Employee[],
    fileName?: string
): Promise<void> => {
    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('User List', pageWidth / 2, 15, { align: 'center' });

        // Subtitle
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('InActive must be changed when Employee is Resigned.', 14, 22);

        // Reset color
        doc.setTextColor(0);

        // Table
        const headers = [
            ['Sr.', 'Div', 'Staff ID', 'Name', 'DoorLog', 'Dept', 'Team', 'Status', 'Role']
        ];

        const rows = employeeData.map((emp, index) => [
            (index + 1).toString(),
            emp.div_name || '',
            emp.id || '',
            emp.name || '',
            emp.doorlog || '',
            emp.dept_dat || '',
            emp.team || '',
            emp.status || '',
            emp.role || ''
        ]);

        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 30,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [68, 114, 196], textColor: [255, 255, 255], fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 12 },
                1: { cellWidth: 18 },
                2: { cellWidth: 20 },
                3: { cellWidth: 28 },
                4: { cellWidth: 18 },
                5: { cellWidth: 30 },
                6: { cellWidth: 22 },
                7: { cellWidth: 15 },
                8: { cellWidth: 20 }
            },
            margin: { top: 30, bottom: 20 }
        });

        const defaultFileName = fileName || `Employees_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(defaultFileName);

    } catch (error) {
        console.error('❌ PDF export error:', error);
        throw error;
    }
};