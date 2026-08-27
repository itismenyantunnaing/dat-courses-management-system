// lib/export/Export-currentTargetData.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

    // Text fields
    if (['status', 'role', 'name', 'dept', 'team', 'email', 'post', 'jlptNatTest',
        'jlptHighestLevel', 'otherJapaneseLevel', 'preferredLearningGroup',
        'currentCommunicationLevel', 'target1JlptNatLevel', 'target1CommunicationLevel',
        'target2JlptNatLevel', 'target2CommunicationLevel', 'currentLearningLevel',
        'learningMethod', 'examTargetLevel', 'confidenceLevel'].includes(field)) {
        return '@';
    }

    // Boolean values: handle as text
    if (field === 'wantToSitExam') {
        return '@';
    }

    return undefined;
}

// ===== FORMAT DATE HELPER =====
function formatGroupDate(date: any): string {
    if (!date) return "TBD";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "TBD";
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

// ===== EXCEL EXPORT USING TEMPLATE =====
export const exportCurrentTargetToExcel = async (
    employeeJapaneseLevel_Data: any[],
    employee_data: any[],
    targetDates_Data: any[],
    options?: {
        fileName?: string;
        templatePath?: string;
        columnWidths?: { [key: string]: number };
    }
): Promise<void> => {
    try {
        const {
            fileName = `CurrentTarget_${new Date().toISOString().split('T')[0]}.xlsx`,
            templatePath = '/templates/current_target_template.xlsx',
            columnWidths
        } = options || {};

        if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
            throw new Error('No current target data to export');
        }

        // Create employee map for lookups
        const employeeMap = new Map();
        employee_data.forEach((emp: any) => {
            employeeMap.set(emp.id, emp);
        });

        // Load template
        const templateResponse = await fetch(templatePath);
        if (!templateResponse.ok) {
            throw new Error(`Template not found at ${templatePath}`);
        }
        const templateBuffer = await templateResponse.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(templateBuffer);
        const worksheet = workbook.getWorksheet(1);

        if (!worksheet) {
            throw new Error('Template worksheet not found');
        }

        // Get target dates for dynamic content
        const targetDate = targetDates_Data?.[0] || null;
        const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
        const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
        const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

        // Update dynamic dates in template headers (if needed)
        // You can search and replace specific cells if your template has placeholders

        // Define column mapping based on your template structure
        // Column A: empty, B: Sr., C: Staff ID, D: Name, E: Email, F: Post, G: Team, H: Dept, I: JLPT/NAT Test
        // J: JLPT Highest Level, K: Other Japanese Level, L: Preferred Group, M: Communication Level
        // N: Target 1 JLPT, O: Target 1 Comm, P: Target 2 JLPT, Q: Target 2 Comm
        // R: Learning Level, S: Learning Method, T: Want to sit exam, U: Exam Level, V: Confidence
        
        const columnMapping = [
            { key: 'sr', col: 2 },           // Column B
            { key: 'staffId', col: 3 },      // Column C
            { key: 'name', col: 4 },         // Column D
            { key: 'email', col: 5 },        // Column E
            { key: 'post', col: 6 },         // Column F
            { key: 'team', col: 7 },         // Column G
            { key: 'dept', col: 8 },         // Column H
            { key: 'jlptNatTest', col: 9 },  // Column I
            { key: 'jlptHighestLevel', col: 10 },  // Column J
            { key: 'otherJapaneseLevel', col: 11 }, // Column K
            { key: 'preferredLearningGroup', col: 12 }, // Column L
            { key: 'currentCommunicationLevel', col: 13 }, // Column M
            { key: 'target1JlptNatLevel', col: 14 }, // Column N
            { key: 'target1CommunicationLevel', col: 15 }, // Column O
            { key: 'target2JlptNatLevel', col: 16 }, // Column P
            { key: 'target2CommunicationLevel', col: 17 }, // Column Q
            { key: 'currentLearningLevel', col: 18 }, // Column R
            { key: 'learningMethod', col: 19 }, // Column S
            { key: 'wantToSitExam', col: 20 }, // Column T
            { key: 'examTargetLevel', col: 21 }, // Column U
            { key: 'confidenceLevel', col: 22 } // Column V
        ];

        // Find where data should start (look for first empty row after headers)
        let dataStartRow = 0;
        for (let rowNum = 1; rowNum <= 20; rowNum++) {
            const row = worksheet.getRow(rowNum);
            let hasData = false;
            row.eachCell((cell) => {
                if (cell.value && cell.value.toString().trim()) {
                    hasData = true;
                }
            });
            // If row is empty and we're past row 4 (headers), this is where data starts
            if (!hasData && rowNum > 4) {
                dataStartRow = rowNum;
                break;
            }
        }

        // If no empty row found, use row 5
        if (dataStartRow === 0) {
            dataStartRow = 5;
        }

        // Clear existing data rows (from dataStartRow to 1000)
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

        // Insert data with smart type detection
        employeeJapaneseLevel_Data.forEach((profile: any, index: number) => {
            const rowNum = dataStartRow + index;
            const row = worksheet.getRow(rowNum);
            const employee = employeeMap.get(profile.employee_id || profile.employeeId);

            // Build row data
            const rowData: { [key: string]: any } = {
                sr: index + 1,
                staffId: employee?.id || profile.employee_id || profile.employeeId || '',
                name: employee?.name || '',
                email: employee?.email || '',
                post: employee?.position || employee?.post || '',
                team: employee?.team || '',
                dept: employee?.dept_dat || '',
                jlptNatTest: profile.jlptNatTest || '',
                jlptHighestLevel: profile.jlptHighestLevel || '',
                otherJapaneseLevel: profile.otherJapaneseLevel || '',
                preferredLearningGroup: profile.preferredLearningGroup || '',
                currentCommunicationLevel: profile.currentCommunicationLevel || '',
                target1JlptNatLevel: profile.target1JlptNatLevel || '',
                target1CommunicationLevel: profile.target1CommunicationLevel || '',
                target2JlptNatLevel: profile.target2JlptNatLevel || '',
                target2CommunicationLevel: profile.target2CommunicationLevel || '',
                currentLearningLevel: profile.currentLearningLevel || '',
                learningMethod: profile.learningMethod || '',
                wantToSitExam: profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
                examTargetLevel: profile.examTargetLevel || '',
                confidenceLevel: profile.confidenceLevel || ''
            };

            // Set each cell based on column mapping
            columnMapping.forEach(({ key, col }) => {
                const cell = row.getCell(col);
                const value = rowData[key];

                if (key === 'sr') {
                    cell.value = value;
                    cell.numFmt = '0';
                } else {
                    const processedValue = getCellValue(value);
                    const numberFormat = getExcelNumberFormat(key, value);

                    cell.value = processedValue;
                    if (numberFormat) {
                        cell.numFmt = numberFormat;
                    }
                }

                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.font = { name: 'Arial', size: 10 };
            });

            row.height = 20;
        });

        // Override with custom widths if provided
        if (columnWidths) {
            Object.entries(columnWidths).forEach(([col, width]) => {
                const colIndex = col.charCodeAt(0) - 64;
                worksheet.getColumn(colIndex).width = width;
            });
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
export const exportCurrentTargetToCSV = async (
    employeeJapaneseLevel_Data: any[],
    employee_data: any[],
    targetDates_Data: any[],
    fileName?: string
): Promise<void> => {
    try {
        if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
            throw new Error('No current target data to export');
        }

        const employeeMap = new Map();
        employee_data.forEach((emp: any) => {
            employeeMap.set(emp.id, emp);
        });

        const targetDate = targetDates_Data?.[0] || null;
        const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
        const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
        const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

        // Build headers (CSV doesn't need empty column)
        const headers = [
            'Sr',
            'Staff ID',
            'Name',
            'Email',
            'Post',
            'Team',
            'Dept',
            'JLPT / NAT Test',
            'JLPT Highest Level (Certified)',
            'Other Highest Japanese Level (Certified) if any',
            'Preferred Joining Group & Level',
            'Communication Level',
            `Target Level to be on ${target1Date}: JLPT / NAT Test Level`,
            `Target Level to be on ${target1Date}: Communication Level`,
            `Target Level to be on ${target2Date}: JLPT / NAT Test Level`,
            `Target Level to be on ${target2Date}: Communication Level`,
            'Japanese Level (Current Learning)',
            'Learning Method',
            `Want to sit JLPT exam on ${examDateStr}`,
            'If Yes, Which Level?',
            'Confidence Level to Pass Exam'
        ];

        let csvContent = '\uFEFF' + headers.join(',') + '\n';

        employeeJapaneseLevel_Data.forEach((profile: any, index: number) => {
            const employee = employeeMap.get(profile.employee_id || profile.employeeId);

            const row = [
                index + 1,
                employee?.id || profile.employee_id || profile.employeeId || '',
                employee?.name || '',
                employee?.email || '',
                employee?.position || employee?.post || '',
                employee?.team || '',
                employee?.dept_dat || '',
                profile.jlptNatTest || '',
                profile.jlptHighestLevel || '',
                profile.otherJapaneseLevel || '',
                profile.preferredLearningGroup || '',
                profile.currentCommunicationLevel || '',
                profile.target1JlptNatLevel || '',
                profile.target1CommunicationLevel || '',
                profile.target2JlptNatLevel || '',
                profile.target2CommunicationLevel || '',
                profile.currentLearningLevel || '',
                profile.learningMethod || '',
                profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
                profile.examTargetLevel || '',
                profile.confidenceLevel || '',
            ].map(value => {
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });

            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const defaultFileName = fileName || `CurrentTarget_${new Date().toISOString().split('T')[0]}.csv`;
        saveAs(blob, defaultFileName);

    } catch (error) {
        console.error('❌ CSV export error:', error);
        throw error;
    }
};

// ===== PDF EXPORT =====
export const exportCurrentTargetToPDF = async (
    employeeJapaneseLevel_Data: any[],
    employee_data: any[],
    targetDates_Data: any[],
    fileName?: string
): Promise<void> => {
    try {
        if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
            throw new Error('No current target data to export');
        }

        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const employeeMap = new Map();
        employee_data.forEach((emp: any) => {
            employeeMap.set(emp.id, emp);
        });

        const targetDate = targetDates_Data?.[0] || null;
        const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
        const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
        const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Existing Japanese Certified and Target Certified Level, Communication level', pageWidth / 2, 15, { align: 'center' });

        // Subtitle
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${employeeJapaneseLevel_Data.length}`, 14, 22);

        // Reset color
        doc.setTextColor(0);

        // Define columns (no empty column in PDF)
        const allColumns = [
            "Sr",
            "Staff ID",
            "Name",
            "Email",
            "Post",
            "Team",
            "Dept",
            "JLPT / NAT Test",
            "JLPT Highest Level (Certified)",
            "Other Highest Japanese Level (Certified) if any",
            "Preferred Joining Group & Level",
            "Communication Level",
            `Target Level to be on ${target1Date}: JLPT / NAT Test Level`,
            `Target Level to be on ${target1Date}: Communication Level`,
            `Target Level to be on ${target2Date}: JLPT / NAT Test Level`,
            `Target Level to be on ${target2Date}: Communication Level`,
            "Japanese Level (Current Learning)",
            "Learning Method",
            `Want to sit JLPT exam on ${examDateStr}`,
            "If Yes, Which Level?",
            "Confidence Level to Pass Exam"
        ];

        // Data rows
        const rows = employeeJapaneseLevel_Data.map((profile: any, index: number) => {
            const employee = employeeMap.get(profile.employee_id || profile.employeeId);
            return [
                (index + 1).toString(),
                employee?.id || profile.employee_id || profile.employeeId || '',
                employee?.name || '',
                employee?.email || '',
                employee?.position || employee?.post || '',
                employee?.team || '',
                employee?.dept_dat || '',
                profile.jlptNatTest || '',
                profile.jlptHighestLevel || '',
                profile.otherJapaneseLevel || '',
                profile.preferredLearningGroup || '',
                profile.currentCommunicationLevel || '',
                profile.target1JlptNatLevel || '',
                profile.target1CommunicationLevel || '',
                profile.target2JlptNatLevel || '',
                profile.target2CommunicationLevel || '',
                profile.currentLearningLevel || '',
                profile.learningMethod || '',
                profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
                profile.examTargetLevel || '',
                profile.confidenceLevel || '',
            ];
        });

        autoTable(doc, {
            head: [allColumns],
            body: rows,
            startY: 30,
            theme: 'striped',
            headStyles: {
                fillColor: [68, 114, 196],
                textColor: [255, 255, 255],
                fontSize: 7,
                halign: 'center'
            },
            styles: {
                fontSize: 6,
                cellPadding: 1.5,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 10 },   // Sr
                1: { cellWidth: 22 },   // Staff ID
                2: { cellWidth: 30 },   // Name
                3: { cellWidth: 30 },   // Email
                4: { cellWidth: 18 },   // Post
                5: { cellWidth: 18 },   // Team
                6: { cellWidth: 18 },   // Dept
                7: { cellWidth: 20 },   // JLPT Test
                8: { cellWidth: 25 },   // Highest Level
                9: { cellWidth: 28 },   // Other Level
                10: { cellWidth: 22 },  // Preferred Group
                11: { cellWidth: 20 },  // Comm Level
                12: { cellWidth: 22 },  // Target 1 JLPT
                13: { cellWidth: 22 },  // Target 1 Comm
                14: { cellWidth: 22 },  // Target 2 JLPT
                15: { cellWidth: 22 },  // Target 2 Comm
                16: { cellWidth: 22 },  // Learning Level
                17: { cellWidth: 30 },  // Method (wider)
                18: { cellWidth: 22 },  // Sit exam
                19: { cellWidth: 18 },  // Level
                20: { cellWidth: 20 }   // Confidence
            },
            margin: { top: 30, bottom: 20 },
            didDrawPage: function (data) {
                const pageCount = doc.internal.pages.length - 1;
                const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                doc.setFontSize(8);
                doc.text(
                    `Page ${pageNumber} of ${pageCount}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });

        const defaultFileName = fileName || `CurrentTarget_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(defaultFileName);

    } catch (error) {
        console.error('❌ PDF export error:', error);
        throw error;
    }
};