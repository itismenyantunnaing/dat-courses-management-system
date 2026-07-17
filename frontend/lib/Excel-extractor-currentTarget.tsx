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
    dynamicHeaders?: { [key: string]: string };
}

// Base header names (without dynamic dates) - UPDATED ORDER
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
    "Want to sit JLPT exam",
    "If Yes, Which Level?",
    "Confidence Level to Pass Exam"
];

// Keywords for fuzzy matching - UPDATED with better Target keywords
const HEADER_KEYWORDS: { [key: string]: string[] } = {
    "Staff ID": ['staff id', 'staff', 'employee id', 'id'],
    "Name": ['name', 'employee name', 'full name'],
    "Email": ['email', 'mail', 'email address'],
    "Post": ['post', 'position', 'role'],
    "Team": ['team', 'group'],
    "Dept": ['dept', 'department', 'div', 'division'],
    "JLPT / NAT Test": ['jlpt / nat test', 'jlpt/nat test', 'jpt/nat test', 'exam type', 'test type'],
    "JLPT Highest Level (Certified)": ['jlpt highest level (certified)', 'highest level', 'certified', 'jlpt highest'],
    "Other Highest Japanese Level (Certified) if any": [
        'other highest japanese level (certified) if any',
        'other highest japanese level',
        'other japanese level',
        'other level',
        'other certified level',
        'additional japanese level'
    ],
    "Preferred Joining Group & Level": ['preferred joining group & level', 'preferred joining', 'joining group'],
    "Communication Level": ['communication level', 'comm level', 'current comm'],
    "Target 1 JLPT / NAT Test Level": [
        'target 1 jlpt',
        'target jlpt',
        'target level jlpt',
        'target 1 jlpt level',
        'target 1 nat test',
        'target 1 jlpt/nat',
        'target 1 jlpt/nat test'
    ],
    "Target 1 Communication Level": [
        'target 1 communication',
        'target communication',
        'target level communication',
        'target 1 comm'
    ],
    "Target 2 JLPT / NAT Test Level": [
        'target 2 jlpt',
        'target jlpt',
        'target level jlpt',
        'target 2 jlpt level',
        'target 2 nat test',
        'target 2 jlpt/nat',
        'target 2 jlpt/nat test'
    ],
    "Target 2 Communication Level": [
        'target 2 communication',
        'target communication',
        'target level communication',
        'target 2 comm'
    ],
    "Japanese Level (Current Learning)": ['japanese level (current learning)', 'current learning', 'learning level'],
    "Learning Method": [
        'learning method', 'study method', 'online/zoom', 'in-person', 'video record', 'mobile app', 'web',
        'learning', 'method', 'studying japanese', 'online zoom', 'in person', 'video', 'mobile', 'app'
    ],
    "Want to sit JLPT exam": ['want to sit jlpt exam', 'sit jlpt', 'exam', 'jlpt exam'],
    "If Yes, Which Level?": ['if yes, which level?', 'which level', 'exam level'],
    "Confidence Level to Pass Exam": ['confidence level to pass exam', 'confidence', 'confidence level']
};

// Helper to map JLPT/NAT values to match Enum
function normalizeJlptNatTest(value: string | null | undefined): string | null {
    if (!value) return null;

    const trimmed = value.trim();
    const upper = trimmed.toUpperCase();

    // Map to exact Enum values
    if (upper === 'JLPT') {
        return 'JLPT';
    } else if (upper === 'NAT' || upper === 'NAT_TEST') {
        return 'NAT';
    } else if (upper === 'TOPJ' || upper === 'TOP_J' || upper === 'TOP J' || upper === 'TOP-J') {
        return 'TopJ';
    } else if (upper === 'BJT') {
        return 'BJT';
    }

    // Return as-is if no mapping found
    return trimmed;
}

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
    const targetName = 'current_target_level';
    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim().replace(/[\s-]/g, '_');
        if (name === targetName || name.includes(targetName)) {
            return worksheet;
        }
    }

    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim();
        if (name.includes('current') || name.includes('target') || name.includes('jlpt') || name.includes('japanese')) {
            return worksheet;
        }
    }

    return workbook.worksheets[0] || null;
}

function debugRow(worksheet: ExcelJS.Worksheet, rowIndex: number, maxCols: number = 20): void {
    const row = worksheet.getRow(rowIndex);
    const values: string[] = [];
    for (let c = 1; c <= Math.min(maxCols, worksheet.columnCount); c++) {
        const val = getCellValue(row.getCell(c));
        values.push(val ? `"${val}"` : '(empty)');
    }
    console.log(`  Row ${rowIndex}: ${values.join(' | ')}`);
}

// COMPLETELY REWRITTEN findHeaders function
function findHeaders(worksheet: ExcelJS.Worksheet): {
    columnMap: { [key: string]: number };
    headerRow: number;
    allFoundHeaders: string[];
    columnPositions: { [key: string]: number[] };
    allHeaderValues: { [col: number]: string };
    dynamicHeaders: { [key: string]: string };
} {
    let columnMap: { [key: string]: number } = {};
    let columnPositions: { [key: string]: number[] } = {};
    const allHeaderValues: { [col: number]: string } = {};
    const dynamicHeaders: { [key: string]: string } = {};
    let headerRow = -1;
    let maxFoundCount = 0;
    let bestRowAllHeaders: string[] = [];

    console.log('🔍 Starting header detection...');

    // Debug first 5 rows
    console.log('🔍 DEBUG - Scanning header rows:');
    for (let rowIdx = 1; rowIdx <= Math.min(5, worksheet.rowCount); rowIdx++) {
        const row = worksheet.getRow(rowIdx);
        const values: string[] = [];
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const value = getCellValue(cell);
            if (value) {
                values.push(`[${colNumber}]="${value}"`);
            }
        });
        if (values.length > 0) {
            console.log(`Row ${rowIdx}: ${values.join(' | ')}`);
        }
    }

    // Scan rows for headers
    for (let rowIndex = 1; rowIndex <= Math.min(20, worksheet.rowCount); rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const currentColumnMap: { [key: string]: number } = {};
        const currentPositions: { [key: string]: number[] } = {};
        const currentFoundHeaders: string[] = [];
        let foundCount = 0;

        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const value = getCellValue(cell);
            if (!value) return;

            const lowerValue = value.toLowerCase().trim();
            currentFoundHeaders.push(value);
            allHeaderValues[colNumber] = value;

            // LOG: Found relevant headers
            if (lowerValue.includes('target') || lowerValue.includes('jlpt') || lowerValue.includes('communication')) {
                console.log(`🔍 Found relevant header at column ${colNumber}, row ${rowIndex}: "${value}"`);
            }

            // ===== TARGET 1 DETECTION =====
            
            // 1. Detect Target 1 Communication Level (with date)
            if (lowerValue.includes('target 1') && lowerValue.includes('communication')) {
                const headerKey = "Target 1 Communication Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 1 Communication Level at col ${colNumber}: "${value}"`);
                }
            }
            // Fallback: Detect "Target Level" with date for Target 1
            else if (lowerValue.includes('target level') && (lowerValue.includes('sep') || lowerValue.includes('2026'))) {
                // Check if this is for Target 1 (not Target 2)
                if (!lowerValue.includes('target 2') && !lowerValue.includes('mar')) {
                    const headerKey = "Target 1 Communication Level";
                    if (!currentColumnMap[headerKey]) {
                        currentColumnMap[headerKey] = colNumber;
                        foundCount++;
                        dynamicHeaders[headerKey] = value;
                        console.log(`✅ Detected Target 1 Communication Level (date) at col ${colNumber}: "${value}"`);
                    }
                }
            }

            // 2. Detect Target 1 JLPT/NAT Test Level
            if (lowerValue.includes('target 1') && (lowerValue.includes('jlpt') || lowerValue.includes('nat'))) {
                const headerKey = "Target 1 JLPT / NAT Test Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 1 JLPT/NAT Level at col ${colNumber}: "${value}"`);
                }
            }
            // Fallback: Detect "Target JLPT/NAT Level" with date for Target 1
            else if (lowerValue.includes('target') && (lowerValue.includes('jlpt') || lowerValue.includes('nat')) && 
                     (lowerValue.includes('sep') || lowerValue.includes('2026')) && !lowerValue.includes('target 2')) {
                const headerKey = "Target 1 JLPT / NAT Test Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 1 JLPT/NAT Level (date) at col ${colNumber}: "${value}"`);
                }
            }

            // ===== TARGET 2 DETECTION =====

            // 3. Detect Target 2 Communication Level (with date)
            if (lowerValue.includes('target 2') && lowerValue.includes('communication')) {
                const headerKey = "Target 2 Communication Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 2 Communication Level at col ${colNumber}: "${value}"`);
                }
            }
            // Fallback: Detect "Target Level" with date for Target 2
            else if (lowerValue.includes('target level') && (lowerValue.includes('mar') || lowerValue.includes('2027'))) {
                if (!lowerValue.includes('target 1') && !lowerValue.includes('sep')) {
                    const headerKey = "Target 2 Communication Level";
                    if (!currentColumnMap[headerKey]) {
                        currentColumnMap[headerKey] = colNumber;
                        foundCount++;
                        dynamicHeaders[headerKey] = value;
                        console.log(`✅ Detected Target 2 Communication Level (date) at col ${colNumber}: "${value}"`);
                    }
                }
            }

            // 4. Detect Target 2 JLPT/NAT Test Level
            if (lowerValue.includes('target 2') && (lowerValue.includes('jlpt') || lowerValue.includes('nat'))) {
                const headerKey = "Target 2 JLPT / NAT Test Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 2 JLPT/NAT Level at col ${colNumber}: "${value}"`);
                }
            }
            // Fallback: Detect "Target JLPT/NAT Level" with date for Target 2
            else if (lowerValue.includes('target') && (lowerValue.includes('jlpt') || lowerValue.includes('nat')) && 
                     (lowerValue.includes('mar') || lowerValue.includes('2027')) && !lowerValue.includes('target 1')) {
                const headerKey = "Target 2 JLPT / NAT Test Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Target 2 JLPT/NAT Level (date) at col ${colNumber}: "${value}"`);
                }
            }

            // ===== OTHER HEADERS =====

            // 5. Detect Current Communication Level
            if (lowerValue === 'communication level' || lowerValue === 'current communication level') {
                const headerKey = "Communication Level";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    console.log(`✅ Detected Current Communication Level at col ${colNumber}: "${value}"`);
                }
            }

            // 6. Detect JLPT / NAT Test (Type)
            if (lowerValue === 'jlpt / nat test' || lowerValue === 'jlpt/nat test' || 
                (lowerValue.includes('jlpt') && lowerValue.includes('test') && !lowerValue.includes('level'))) {
                const headerKey = "JLPT / NAT Test";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    console.log(`✅ Detected JLPT/NAT Test at col ${colNumber}: "${value}"`);
                }
            }

            // 7. Detect "Want to sit JLPT exam" with dynamic date
            if (lowerValue.includes('want to sit jlpt exam') ||
                (lowerValue.includes('jlpt exam') && lowerValue.includes('want'))) {

                // Extract date from "Want to sit JLPT exam on Jul 2026"
                let dateMatch = null;
                dateMatch = value.match(/on\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
                if (!dateMatch) {
                    dateMatch = value.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})\b/i);
                }

                if (dateMatch) {
                    const fullDate = dateMatch.length === 3 ? `${dateMatch[1]} ${dateMatch[2]}` : dateMatch[0];
                    dynamicHeaders['ExamDate'] = fullDate;
                }

                const headerKey = "Want to sit JLPT exam";
                if (!currentColumnMap[headerKey]) {
                    currentColumnMap[headerKey] = colNumber;
                    foundCount++;
                    dynamicHeaders[headerKey] = value;
                    console.log(`✅ Detected Want to sit JLPT exam at col ${colNumber}: "${value}"`);
                }
            }

            // 8. Detect standard headers using keywords (skip Target fields as they're handled above)
            for (const [headerName, keywords] of Object.entries(HEADER_KEYWORDS)) {
                if (currentColumnMap[headerName]) continue;
                if (headerName.includes('Target')) continue;
                
                if (keywords.some(keyword => lowerValue.includes(keyword.toLowerCase()))) {
                    currentColumnMap[headerName] = colNumber;
                    foundCount++;
                    console.log(`✅ Detected ${headerName} at col ${colNumber}: "${value}"`);
                    break;
                }
            }
        });

        // Track best row
        if (foundCount > maxFoundCount) {
            maxFoundCount = foundCount;
            headerRow = rowIndex;
            columnMap = currentColumnMap;
            columnPositions = currentPositions;
            bestRowAllHeaders = currentFoundHeaders;
        }
    }

    console.log(`📋 Found ${Object.keys(columnMap).length} headers at row ${headerRow}`);
    console.log('📋 Column map:', columnMap);

    return { columnMap, headerRow, allFoundHeaders: bestRowAllHeaders, columnPositions, allHeaderValues, dynamicHeaders };
}

export async function extractCurrentTargetDataFromExcel(file: File): Promise<CurrentTargetExtractionResult> {
    try {
        console.log('🚀 Starting Excel extraction...');
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

        console.log('📄 Worksheet found:', worksheet.name);

        const { columnMap, headerRow, allFoundHeaders, columnPositions, allHeaderValues, dynamicHeaders } = findHeaders(worksheet);

        let dataStartRow = -1;
        const staffIdCol = columnMap["Staff ID"] || 3;

        for (let r = headerRow + 1; r <= Math.min(headerRow + 50, worksheet.rowCount); r++) {
            const row = worksheet.getRow(r);
            const staffId = getCellValue(row.getCell(staffIdCol));

            if (/^\d{2}-\d{3,5}$/.test(staffId) || (staffId && staffId.length >= 5 && staffId.includes('-'))) {
                dataStartRow = r;
                break;
            }
        }

        if (dataStartRow === -1) {
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
                    break;
                }
            }
        }

        if (dataStartRow === -1) {
            dataStartRow = headerRow + 1;
        }

        console.log('📍 Data starts at row:', dataStartRow);

        const data: CurrentTargetRow[] = [];

        // Build fullColumnMap from detected headers
        const fullColumnMap: { [key: string]: number } = {};

        // Map all detected columns
        for (const [key, value] of Object.entries(columnMap)) {
            fullColumnMap[key] = value;
        }

        // For any missing headers, try to find them by scanning all header values
        const missingHeaders = HEADER_NAMES.filter(h => !fullColumnMap[h]);
        console.log('🔍 Missing headers:', missingHeaders);

        // If we're missing Target fields, try to find them by position relative to other fields
        if (!fullColumnMap["Target 1 JLPT / NAT Test Level"] || !fullColumnMap["Target 1 Communication Level"] ||
            !fullColumnMap["Target 2 JLPT / NAT Test Level"] || !fullColumnMap["Target 2 Communication Level"]) {
            
            console.log('⚠️ Some Target fields missing, attempting position-based detection...');
            
            // If we have Communication Level and other fields, Target fields are usually after them
            const commLevelCol = fullColumnMap["Communication Level"];
            if (commLevelCol) {
                // Target 1 JLPT/NAT is usually 1-2 columns after Communication Level
                if (!fullColumnMap["Target 1 JLPT / NAT Test Level"]) {
                    fullColumnMap["Target 1 JLPT / NAT Test Level"] = commLevelCol + 1;
                    console.log(`🔧 Assigned Target 1 JLPT/NAT to column ${commLevelCol + 1} (relative to Communication Level)`);
                }
                // Target 1 Communication is usually 2 columns after Communication Level
                if (!fullColumnMap["Target 1 Communication Level"]) {
                    fullColumnMap["Target 1 Communication Level"] = commLevelCol + 2;
                    console.log(`🔧 Assigned Target 1 Communication to column ${commLevelCol + 2} (relative to Communication Level)`);
                }
                // Target 2 JLPT/NAT is usually 3 columns after Communication Level
                if (!fullColumnMap["Target 2 JLPT / NAT Test Level"]) {
                    fullColumnMap["Target 2 JLPT / NAT Test Level"] = commLevelCol + 3;
                    console.log(`🔧 Assigned Target 2 JLPT/NAT to column ${commLevelCol + 3} (relative to Communication Level)`);
                }
                // Target 2 Communication is usually 4 columns after Communication Level
                if (!fullColumnMap["Target 2 Communication Level"]) {
                    fullColumnMap["Target 2 Communication Level"] = commLevelCol + 4;
                    console.log(`🔧 Assigned Target 2 Communication to column ${commLevelCol + 4} (relative to Communication Level)`);
                }
            }
        }

        // Set any remaining missing headers with fallback
        const fallbackColumns: { [key: string]: number } = {
            "Staff ID": 3,
            "Name": 4,
            "Email": 5,
            "Post": 6,
            "Team": 7,
            "Dept": 8,
            "JLPT / NAT Test": 9,
            "JLPT Highest Level (Certified)": 10,
            "Other Highest Japanese Level (Certified) if any": 11,
            "Preferred Joining Group & Level": 12,
            "Communication Level": 13,
            "Target 1 JLPT / NAT Test Level": 14,
            "Target 1 Communication Level": 15,
            "Target 2 JLPT / NAT Test Level": 16,
            "Target 2 Communication Level": 17,
            "Japanese Level (Current Learning)": 18,
            "Learning Method": 19,
            "Want to sit JLPT exam": 20,
            "If Yes, Which Level?": 21,
            "Confidence Level to Pass Exam": 22
        };

        for (const header of HEADER_NAMES) {
            if (!fullColumnMap[header] && fallbackColumns[header]) {
                fullColumnMap[header] = fallbackColumns[header];
                console.log(`🔧 Using fallback column ${fallbackColumns[header]} for "${header}"`);
            }
        }

        console.log('📋 Final column map:', fullColumnMap);
        console.log('📋 Dynamic headers captured:', dynamicHeaders);

        for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r);
            const rowData: CurrentTargetRow = {};
            let hasAnyData = false;

            for (const [headerName, col] of Object.entries(fullColumnMap)) {
                const value = getCellValue(row.getCell(col));
                rowData[headerName] = value;
                if (value) hasAnyData = true;
            }

            // Add dynamic header information as metadata
            if (Object.keys(dynamicHeaders).length > 0) {
                rowData['_dynamicHeaders'] = JSON.stringify(dynamicHeaders);
            }

            // Clean up Staff ID
            if (rowData["Staff ID"]) {
                rowData["Staff ID"] = rowData["Staff ID"].replace(/[^0-9-]/g, '');
            }

            if (hasAnyData) {
                data.push(rowData);
            }
        }

        console.log(`📊 Extracted ${data.length} records`);

        // Log first record's dynamic headers if available
        if (data.length > 0 && data[0]['_dynamicHeaders']) {
            console.log('📅 FIRST RECORD DYNAMIC HEADERS:', JSON.parse(data[0]['_dynamicHeaders']));
        }

        return {
            success: true,
            headers: Object.keys(fullColumnMap),
            data: data,
            dynamicHeaders: dynamicHeaders
        };

    } catch (err) {
        console.error('❌ Error during extraction:', err);
        return {
            success: false,
            headers: [],
            data: [],
            error: err instanceof Error ? err.message : "An unexpected parsing error occurred"
        };
    }
}

export function logExtractedData(data: CurrentTargetRow[], headers: string[]): void {
    console.log('='.repeat(80));
    console.log('📊 EXTRACTED CURRENT TARGET DATA REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 Total Records: ${data.length}`);
    console.log(`📋 Total Headers: ${headers.length}`);

    console.log('\n📋 HEADER LIST:');
    headers.forEach((header, index) => {
        console.log(`  ${index + 1}. ${header}`);
    });

    // Check for dynamic headers in first record
    if (data.length > 0 && data[0]['_dynamicHeaders']) {
        console.log('\n📅 DYNAMIC HEADERS DETECTED:');
        try {
            const dynamicHeaders = JSON.parse(data[0]['_dynamicHeaders']);
            Object.entries(dynamicHeaders).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
        } catch (e) {
            // Ignore parsing errors
        }
    }

    console.log('\n📝 ALL EXTRACTED RECORDS:');
    console.log('-'.repeat(80));

    data.forEach((record, index) => {
        console.log(`\n🔹 Record #${index + 1}:`);
        Object.entries(record).forEach(([key, value]) => {
            if (key !== '_dynamicHeaders') {
                console.log(`  ${key}: ${value || '(empty)'}`);
            }
        });
        console.log('-'.repeat(40));
    });

    console.log('\n📊 TABLE VIEW:');
    console.table(data.map(record => {
        const { _dynamicHeaders, ...rest } = record;
        return rest;
    }));

    console.log('\n📋 STAFF ID SUMMARY:');
    data.forEach(record => {
        const staffId = record['Staff ID'] || 'N/A';
        const name = record['Name'] || 'No Name';
        const jlpt = record['JLPT / NAT Test'] || 'Not specified';
        console.log(`  ${staffId} | ${name} | JLPT: ${jlpt}`);
    });

    console.log('\n' + '='.repeat(80));
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

        if (errors.length === 0) {
            valid.push(row);
        } else {
            invalid.push({ data: row, errors });
        }
    }

    return { valid, invalid };
}

export function validateCurrentTargetDataWithEmployees(
    data: CurrentTargetRow[],
    existingEmployeeIds: Set<string>
): {
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
        } else if (existingEmployeeIds.size > 0 && !existingEmployeeIds.has(staffId)) {
            errors.push(`Row ${i + 1}: Employee "${staffId}" does NOT exist in the system. Please create this employee first.`);
        } else {
            existingStaffIds.add(staffId);
        }

        if (errors.length === 0) {
            valid.push(row);
        } else {
            invalid.push({ data: row, errors });
        }
    }

    return { valid, invalid };
}

export function transformToApiFormat(data: CurrentTargetRow[]): any[] {
    return data.map((row) => {
        const wantToSit = row["Want to sit JLPT exam"]?.trim()?.toLowerCase() || '';
        const wantToSitBool = wantToSit === 'yes' || wantToSit === 'y';

        const learningMethod =
            row["Learning Method"]?.trim() ||
            row["If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)"]?.trim() ||
            null;

        // Normalize JLPT/NAT Test value to match Enum (TEST TYPE)
        const jlptNatTest = normalizeJlptNatTest(row["JLPT / NAT Test"]);

        // Extract exam date from dynamic headers if available
        let examDate = null;
        if (row['_dynamicHeaders']) {
            try {
                const dynamicHeaders = JSON.parse(row['_dynamicHeaders']);
                if (dynamicHeaders['ExamDate']) {
                    examDate = dynamicHeaders['ExamDate'];
                    console.log('📅 Exam Date extracted in transform:', examDate);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        return {
            employeeId: row["Staff ID"]?.trim() || '',
            jlptNatTest: jlptNatTest,
            jlptHighestLevel: row["JLPT Highest Level (Certified)"]?.trim() || null,
            otherJapaneseLevel: row["Other Highest Japanese Level (Certified) if any"]?.trim() || null,
            preferredLearningGroup: row["Preferred Joining Group & Level"]?.trim() || null,
            currentCommunicationLevel: row["Communication Level"]?.trim() || null,
            target1CommunicationLevel: row["Target 1 Communication Level"]?.trim() || null,
            target1JlptNatLevel: row["Target 1 JLPT / NAT Test Level"]?.trim() || null,
            target2CommunicationLevel: row["Target 2 Communication Level"]?.trim() || null,
            target2JlptNatLevel: row["Target 2 JLPT / NAT Test Level"]?.trim() || null,
            currentLearningLevel: row["Japanese Level (Current Learning)"]?.trim() || null,
            learningMethod: learningMethod,
            wantToSitExam: wantToSitBool,
            examTargetLevel: row["If Yes, Which Level?"]?.trim() || null,
            confidenceLevel: row["Confidence Level to Pass Exam"]?.trim() || null,
            examDate: examDate,
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