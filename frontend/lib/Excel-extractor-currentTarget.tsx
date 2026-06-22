// lib/Excel-extractor-currentTarget.tsx

import ExcelJS from "exceljs";

export interface CurrentTargetRow {
    [key: string]: string;
}

export interface CurrentTargetExtractionResult {
    success: boolean;
    headers: string[];
    data: CurrentTargetRow[];
    error?: string;
}

// Exact header names from the UI table
const HEADER_NAMES = [
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
    "Target 1 JLPT / NAT Test Level",
    "Target 1 Communication Level",
    "Target 2 JLPT / NAT Test Level",
    "Target 2 Communication Level",
    "Japanese Level (Current Learning)",
    "Learning Method",
    "Want to sit JLPT exam on Jul 2026",
    "If Yes, Which Level?",
    "Confidence Level to Pass Exam"
];

// Keywords for fuzzy matching
const HEADER_KEYWORDS: { [key: string]: string[] } = {
    "Staff ID": ['staff id', 'staff', 'employee id', 'id'],
    "Name": ['name', 'employee name', 'full name'],
    "Email": ['email', 'mail', 'email address'],
    "Post": ['post', 'position', 'role'],
    "Team": ['team', 'group'],
    "Dept": ['dept', 'department', 'div', 'division'],
    "JLPT / NAT Test": ['jlpt / nat test', 'jlpt/nat test', 'jlpt test', 'exam type'],
    "JLPT Highest Level (Certified)": ['jlpt highest level', 'highest jlpt', 'certified level', 'highest level'],
    "Other Highest Japanese Level (Certified) if any": ['other highest japanese level', 'other japanese level', 'other level'],
    "Preferred Joining Group & Level": ['preferred joining group', 'joining group', 'preferred group'],
    "Communication Level": ['communication level', 'comm level', 'current comm'],
    "Target 1 JLPT / NAT Test Level": ['target 1 jlpt', 'target1 jlpt', 'target 1 level'],
    "Target 1 Communication Level": ['target 1 communication', 'target1 communication', 'target 1 comm'],
    "Target 2 JLPT / NAT Test Level": ['target 2 jlpt', 'target2 jlpt', 'target 2 level'],
    "Target 2 Communication Level": ['target 2 communication', 'target2 communication', 'target 2 comm'],
    "Japanese Level (Current Learning)": ['current learning level', 'current learning', 'learning level'],
    "Learning Method": ['learning method', 'study method', 'how to learn'],
    "Want to sit JLPT exam on Jul 2026": ['want to sit jlpt', 'sit jlpt exam', 'exam jul 2026'],
    "If Yes, Which Level?": ['which level', 'exam target level', 'target exam level'],
    "Confidence Level to Pass Exam": ['confidence level', 'confidence', 'pass exam confidence']
};

function getCellValue(cell: ExcelJS.Cell): string {
    const value = cell.value;
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    if (value instanceof Date) return value.toISOString().split('T')[0];

    if (typeof value === "object") {
        if ("result" in value) {
            const result = value.result;
            if (result === null || result === undefined) return "";
            if (typeof result === "string") return result.trim();
            if (typeof result === "number") return result.toString();
            return String(result);
        }
        if ("richText" in value && Array.isArray(value.richText)) {
            return value.richText.map((rt: any) => rt.text || "").join("").trim();
        }
        if ("text" in value && value.text) {
            return String(value.text).trim();
        }
        if ("error" in value) {
            return "";
        }
    }
    return "";
}

function findCurrentTargetSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null {
    // 1. Try to find the specific sheet name provided by user
    const targetName = 'current_target_level';
    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim().replace(/[\s-]/g, '_');
        if (name === targetName || name.includes(targetName)) {
            console.log(`✅ Found target sheet: "${worksheet.name}"`);
            return worksheet;
        }
    }

    // 2. Try fuzzy matching
    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim();
        if (name.includes('current') || name.includes('target') || name.includes('jlpt') || name.includes('japanese')) {
            console.log(`📋 Found sheet (fuzzy): "${worksheet.name}"`);
            return worksheet;
        }
    }
    
    return workbook.worksheets[0] || null;
}

function findHeaders(worksheet: ExcelJS.Worksheet): {
    columnMap: { [key: string]: number };
    headerRow: number;
    allFoundHeaders: string[];
} {
    let columnMap: { [key: string]: number } = {};
    let headerRow = -1;
    let maxFoundCount = 0;
    let bestRowAllHeaders: string[] = [];

    // Search for header row in the first 20 rows
    for (let rowIndex = 1; rowIndex <= Math.min(20, worksheet.rowCount); rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const currentColumnMap: { [key: string]: number } = {};
        const currentFoundHeaders: string[] = [];
        let foundCount = 0;

        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const value = getCellValue(cell);
            if (!value) return;

            const lowerValue = value.toLowerCase().trim();
            currentFoundHeaders.push(value); // Keep track of all potential headers in this row

            // Try exact or partial match with HEADER_NAMES
            for (const headerName of HEADER_NAMES) {
                const lowerHeader = headerName.toLowerCase();
                if (lowerValue === lowerHeader || lowerValue.includes(lowerHeader) || lowerHeader.includes(lowerValue)) {
                    if (!currentColumnMap[headerName]) {
                        currentColumnMap[headerName] = colNumber;
                        foundCount++;
                    }
                    break;
                }
            }

            // If not found in HEADER_NAMES, try keywords
            if (!Object.values(currentColumnMap).includes(colNumber)) {
                for (const [headerName, keywords] of Object.entries(HEADER_KEYWORDS)) {
                    if (keywords.some(keyword => lowerValue.includes(keyword.toLowerCase()))) {
                        if (!currentColumnMap[headerName]) {
                            currentColumnMap[headerName] = colNumber;
                            foundCount++;
                        }
                        break;
                    }
                }
            }
        });

        // If this row has more matches than previous ones, it's a better candidate
        if (foundCount > maxFoundCount) {
            maxFoundCount = foundCount;
            headerRow = rowIndex;
            columnMap = currentColumnMap;
            bestRowAllHeaders = currentFoundHeaders;
        }

        // If we found a lot of headers, we can probably stop
        if (foundCount >= 10) {
            break;
        }
    }

    if (headerRow !== -1) {
        console.log(`📍 Header row detected at row ${headerRow} (found ${maxFoundCount} known headers)`);
        console.log(`📊 Detected headers:`, Object.keys(columnMap));
    } else {
        console.warn('❌ Could not find a clear header row');
    }

    return { columnMap, headerRow, allFoundHeaders: bestRowAllHeaders };
}

export async function extractCurrentTargetDataFromExcel(file: File): Promise<CurrentTargetExtractionResult> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const worksheet = findCurrentTargetSheet(workbook);
        if (!worksheet) {
            return {
                success: false,
                headers: [],
                data: [],
                error: "No sheet with Current Target data found"
            };
        }

        console.log(`📋 Using sheet: "${worksheet.name}"`);
        console.log(`📋 Total rows: ${worksheet.rowCount}, Columns: ${worksheet.columnCount}`);

        const { columnMap, headerRow, allFoundHeaders } = findHeaders(worksheet);
        console.log(`📋 Header row: ${headerRow}`);

        // Find data start row
        let dataStartRow = -1;
        const staffIdCol = columnMap["Staff ID"] || 1; // Try column 1 if Staff ID not mapped

        // Look for rows with Staff ID pattern
        for (let r = headerRow + 1; r <= Math.min(headerRow + 50, worksheet.rowCount); r++) {
            const row = worksheet.getRow(r);
            const staffId = getCellValue(row.getCell(staffIdCol));

            // Check if this row has a valid Staff ID (allowing for some flexibility)
            if (/^\d{2}-\d{3,5}$/.test(staffId) || (staffId && staffId.length >= 5 && staffId.includes('-'))) {
                dataStartRow = r;
                console.log(`📍 Data starts at row ${dataStartRow} (found Staff ID: ${staffId})`);
                break;
            }
        }

        // If no pattern found, try to find rows with data in multiple columns
        if (dataStartRow === -1) {
            console.log('🔍 No Staff ID pattern found, looking for rows with data...');
            for (let r = headerRow + 1; r <= Math.min(headerRow + 30, worksheet.rowCount); r++) {
                const row = worksheet.getRow(r);
                let dataCount = 0;

                for (let c = 1; c <= Math.min(30, worksheet.columnCount); c++) {
                    if (getCellValue(row.getCell(c))) {
                        dataCount++;
                    }
                }

                if (dataCount >= 3) {
                    dataStartRow = r;
                    console.log(`📍 Data starts at row ${dataStartRow} (found ${dataCount} data points)`);
                    break;
                }
            }
        }

        // If still no data row, use a default
        if (dataStartRow === -1) {
            dataStartRow = headerRow + 1;
            console.log(`📍 Using default data start row: ${dataStartRow}`);
        }

        // Extract data
        const data: CurrentTargetRow[] = [];
        
        // Create a mapping of all columns in the header row for "all fields" extraction
        const fullColumnMap: { [key: string]: number } = {};
        const headerRowObj = worksheet.getRow(headerRow);
        headerRowObj.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const val = getCellValue(cell);
            if (val) {
                fullColumnMap[val] = colNumber;
            }
        });

        for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r);
            const rowData: CurrentTargetRow = {};
            let hasAnyData = false;

            // Extract using the full column map (all fields)
            for (const [headerName, col] of Object.entries(fullColumnMap)) {
                const value = getCellValue(row.getCell(col));
                rowData[headerName] = value;
                if (value) hasAnyData = true;
            }

            // Also ensure our standard HEADER_NAMES are mapped correctly even if they have different names in Excel
            for (const [standardName, col] of Object.entries(columnMap)) {
                if (!rowData[standardName]) {
                    rowData[standardName] = getCellValue(row.getCell(col));
                }
            }

            // Clean up Staff ID if it exists
            const staffIdKey = Object.keys(rowData).find(k => k.toLowerCase().includes('staff id') || k.toLowerCase() === 'staff');
            if (staffIdKey && rowData[staffIdKey]) {
                rowData["Staff ID"] = rowData[staffIdKey].replace(/[^0-9-]/g, '');
            }

            // Only add if we have some data
            if (hasAnyData) {
                data.push(rowData);
            }
        }

        console.log(`✅ Extracted ${data.length} records`);
        if (data.length > 0) {
            console.log('📋 Sample record (keys):', Object.keys(data[0]));
        }

        return {
            success: true,
            headers: Object.keys(fullColumnMap),
            data: data
        };

    } catch (err) {
        console.error("Extraction error:", err);
        return {
            success: false,
            headers: [],
            data: [],
            error: err instanceof Error ? err.message : "An unexpected parsing error occurred"
        };
    }
}

export function validateCurrentTargetData(data: CurrentTargetRow[]): {
    valid: CurrentTargetRow[];
    invalid: { data: CurrentTargetRow; errors: string[] }[];
} {
    const valid: CurrentTargetRow[] = [];
    const invalid: { data: CurrentTargetRow; errors: string[] }[] = [];
    const existingStaffIds = new Set<string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const errors: string[] = [];
        const staffId = row["Staff ID"]?.trim() || '';

        if (!staffId) {
            errors.push(`Row ${i + 1}: Staff ID is required`);
        } else if (existingStaffIds.has(staffId)) {
            errors.push(`Row ${i + 1}: Duplicate Staff ID "${staffId}"`);
        } else {
            existingStaffIds.add(staffId);
        }

        const jlptFields = [
            "JLPT Highest Level (Certified)",
            "Target 1 JLPT / NAT Test Level",
            "Target 2 JLPT / NAT Test Level",
            "Japanese Level (Current Learning)",
            "If Yes, Which Level?"
        ];
        const validJlptLevels = ['N1', 'N2', 'N3', 'N4', 'N5', ''];

        jlptFields.forEach(field => {
            const value = row[field]?.trim() || '';
            if (value && !validJlptLevels.includes(value)) {
                errors.push(`Invalid JLPT level "${value}" for "${field}". Must be N1-N5`);
            }
        });

        const wantToSit = row["Want to sit JLPT exam on Jul 2026"]?.trim()?.toLowerCase() || '';
        if (wantToSit && !['yes', 'no', 'y', 'n'].includes(wantToSit)) {
            errors.push(`Invalid value for "Want to sit exam". Must be Yes or No`);
        }

        const confidence = row["Confidence Level to Pass Exam"]?.trim()?.toLowerCase() || '';
        if (confidence && !['high', 'medium', 'low'].includes(confidence)) {
            errors.push(`Invalid confidence level "${row["Confidence Level to Pass Exam"]}". Must be High, Medium, or Low`);
        }

        const examType = row["JLPT / NAT Test"]?.trim()?.toUpperCase() || '';
        if (examType && !['JLPT', 'NAT_TEST', 'TOP_J', 'BJT'].includes(examType)) {
            errors.push(`Invalid exam type "${row["JLPT / NAT Test"]}". Must be JLPT, NAT_TEST, TOP_J, or BJT`);
        }

        if (errors.length === 0) {
            valid.push(row);
        } else {
            invalid.push({ data: row, errors });
        }
    }

    console.log(`✅ Validation: ${valid.length} valid, ${invalid.length} invalid`);
    return { valid, invalid };
}

export function transformToApiFormat(data: CurrentTargetRow[]): any[] {
    return data.map((row) => {
        const wantToSit = row["Want to sit JLPT exam on Jul 2026"]?.trim()?.toLowerCase() || '';
        const wantToSitBool = wantToSit === 'yes' || wantToSit === 'y';

        // Map UI field names to Backend DTO field names
        return {
            employeeId: row["Staff ID"]?.trim() || '',
            jlptNatTest: row["JLPT / NAT Test"]?.trim() || null,
            jlptHighestLevel: row["JLPT Highest Level (Certified)"]?.trim() || null,
            otherJapaneseLevel: row["Other Highest Japanese Level (Certified) if any"]?.trim() || null,
            preferredLearningGroup: row["Preferred Joining Group & Level"]?.trim() || null,
            currentCommunicationLevel: row["Communication Level"]?.trim() || null,
            target1JlptNatLevel: row["Target 1 JLPT / NAT Test Level"]?.trim() || null,
            target1CommunicationLevel: row["Target 1 Communication Level"]?.trim() || null,
            target2JlptNatLevel: row["Target 2 JLPT / NAT Test Level"]?.trim() || null,
            target2CommunicationLevel: row["Target 2 Communication Level"]?.trim() || null,
            currentLearningLevel: row["Japanese Level (Current Learning)"]?.trim() || null,
            learningMethod: row["Learning Method"]?.trim() || null,
            wantToSitExam: wantToSitBool,
            examTargetLevel: row["If Yes, Which Level?"]?.trim() || null,
            confidenceLevel: row["Confidence Level to Pass Exam"]?.trim() || null,
        };
    });
}

export const getCurrentTargetSheetNames = async (file: File): Promise<string[]> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        return workbook.worksheets.map(ws => ws.name);
    } catch (error) {
        console.error('❌ Error getting sheet names:', error);
        throw error;
    }
};