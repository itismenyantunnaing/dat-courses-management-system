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
    "Communication Level",                    // Current - Communication
    "Communication Level",                    // Target 1 - Communication (Sep-2026)
    "JLPT / NAT Test Level",                  // Target 1 - JLPT/NAT (Sep-2026)
    "Communication Level",                    // Target 2 - Communication (Mar-2027)
    "JLPT / NAT Test Level",                  // Target 2 - JLPT/NAT (Mar-2027)
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
    "JLPT / NAT Test": ['jlpt / nat test', 'jlpt/nat test', 'jlpt test', 'exam type', 'jpt/nat test'],
    "JLPT Highest Level (Certified)": ['jlpt highest level (certified)', 'highest level', 'certified', 'jlpt highest'],
    "Other Highest Japanese Level (Certified) if any": ['other highest japanese level (certified) if any', 'other japanese level'],
    "Preferred Joining Group & Level": ['preferred joining group & level', 'preferred joining', 'joining group'],

    // Column 1: Current - Communication Level
    "Communication Level": ['communication level', 'comm level', 'current comm'],

    // Column 2: Target 1 - Communication Level (Sep-2026)
    "Target 1 Communication Level": ['communication level', 'target 1', 'sep-2026'],

    // Column 3: Target 1 - JLPT / NAT Test Level (Sep-2026)
    "Target 1 JLPT / NAT Test Level": ['jlpt / nat test level', 'jlpt level', 'nat level', 'target 1 jlpt', 'sep-2026 jlpt'],

    // Column 4: Target 2 - Communication Level (Mar-2027)
    "Target 2 Communication Level": ['communication level', 'target 2', 'mar-2027'],

    // Column 5: Target 2 - JLPT / NAT Test Level (Mar-2027)
    "Target 2 JLPT / NAT Test Level": ['jlpt / nat test level', 'jlpt level', 'nat level', 'target 2 jlpt', 'mar-2027 jlpt'],

    "Japanese Level (Current Learning)": ['japanese level (current learning)', 'current learning', 'learning level'],
    "If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)": [
        'learning method',
        'study method',
        'online/zoom',
        'in-person',
        'video record',
        'mobile app',
        'web',
        'learning',
        'method',
        'studying japanese',
        'online zoom',
        'in person',
        'video',
        'mobile',
        'app'
    ],
    "Want to sit JLPT exam on Jul 2026": ['want to sit jlpt exam on jul 2026', 'sit jlpt', 'exam jul 2026'],
    "If Yes, Which Level?": ['if yes, which level?', 'which level', 'exam level'],
    "Confidence Level to Pass Exam": ['confidence level to pass exam', 'confidence', 'confidence level']
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
    const targetName = 'current_target_level';
    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim().replace(/[\s-]/g, '_');
        if (name === targetName || name.includes(targetName)) {
            console.log(`✅ Found target sheet: "${worksheet.name}"`);
            return worksheet;
        }
    }

    for (const worksheet of workbook.worksheets) {
        const name = worksheet.name.toLowerCase().trim();
        if (name.includes('current') || name.includes('target') || name.includes('jlpt') || name.includes('japanese')) {
            console.log(`📋 Found sheet (fuzzy): "${worksheet.name}"`);
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

function findHeaders(worksheet: ExcelJS.Worksheet): {
    columnMap: { [key: string]: number };
    headerRow: number;
    allFoundHeaders: string[];
    columnPositions: { [key: string]: number[] };
    allHeaderValues: { [col: number]: string };
} {
    let columnMap: { [key: string]: number } = {};
    let columnPositions: { [key: string]: number[] } = {};
    const allHeaderValues: { [col: number]: string } = {};
    let headerRow = -1;
    let maxFoundCount = 0;
    let bestRowAllHeaders: string[] = [];

    console.log('🔍 Searching for header row...');

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

            // SPECIAL: Direct detection for Learning Method
            if (lowerValue.includes('learning method') || 
                lowerValue.includes('studying japanese') ||
                lowerValue.includes('online/zoom') ||
                lowerValue.includes('in-person') ||
                lowerValue.includes('video record') ||
                lowerValue.includes('mobile app')) {
                console.log(`  Row ${rowIndex}: Found Learning Method: "${value}" at column ${colNumber}`);
                if (!currentColumnMap["Learning Method"]) {
                    currentColumnMap["Learning Method"] = colNumber;
                    foundCount++;
                }
                if (!currentPositions["Learning Method"]) {
                    currentPositions["Learning Method"] = [];
                }
                if (!currentPositions["Learning Method"].includes(colNumber)) {
                    currentPositions["Learning Method"].push(colNumber);
                }
            }

            // SPECIAL: Direct detection for JLPT/NAT
            if (lowerValue.includes('jlpt') || lowerValue.includes('nat') || lowerValue.includes('jpt')) {
                console.log(`  Row ${rowIndex}: Found JLPT/NAT related: "${value}" at column ${colNumber}`);
                if (!currentColumnMap["JLPT / NAT Test Level"]) {
                    currentColumnMap["JLPT / NAT Test Level"] = colNumber;
                    foundCount++;
                }
                if (!currentPositions["JLPT / NAT Test Level"]) {
                    currentPositions["JLPT / NAT Test Level"] = [];
                }
                if (!currentPositions["JLPT / NAT Test Level"].includes(colNumber)) {
                    currentPositions["JLPT / NAT Test Level"].push(colNumber);
                }
            }

            // SPECIAL: Direct detection for Communication Level
            if (lowerValue.includes('communication') || lowerValue.includes('comm')) {
                console.log(`  Row ${rowIndex}: Found Communication: "${value}" at column ${colNumber}`);
                if (!currentColumnMap["Communication Level"]) {
                    currentColumnMap["Communication Level"] = colNumber;
                    foundCount++;
                }
                if (!currentPositions["Communication Level"]) {
                    currentPositions["Communication Level"] = [];
                }
                if (!currentPositions["Communication Level"].includes(colNumber)) {
                    currentPositions["Communication Level"].push(colNumber);
                }
            }

            // Try exact or partial match with HEADER_NAMES
            for (const headerName of HEADER_NAMES) {
                const lowerHeader = headerName.toLowerCase();
                if (lowerValue === lowerHeader || lowerValue.includes(lowerHeader) || lowerHeader.includes(lowerValue)) {
                    if (!currentColumnMap[headerName]) {
                        currentColumnMap[headerName] = colNumber;
                        foundCount++;
                    }
                    if (!currentPositions[headerName]) {
                        currentPositions[headerName] = [];
                    }
                    if (!currentPositions[headerName].includes(colNumber)) {
                        currentPositions[headerName].push(colNumber);
                    }
                    console.log(`  Row ${rowIndex}: Found "${headerName}" at column ${colNumber}`);
                    break;
                }
            }

            // If not found, try keywords
            if (!Object.values(currentColumnMap).includes(colNumber)) {
                for (const [headerName, keywords] of Object.entries(HEADER_KEYWORDS)) {
                    if (keywords.some(keyword => lowerValue.includes(keyword.toLowerCase()))) {
                        if (!currentColumnMap[headerName]) {
                            currentColumnMap[headerName] = colNumber;
                            foundCount++;
                        }
                        if (!currentPositions[headerName]) {
                            currentPositions[headerName] = [];
                        }
                        if (!currentPositions[headerName].includes(colNumber)) {
                            currentPositions[headerName].push(colNumber);
                        }
                        console.log(`  Row ${rowIndex}: Found "${headerName}" via keyword at column ${colNumber}`);
                        break;
                    }
                }
            }
        });

        if (foundCount > maxFoundCount) {
            maxFoundCount = foundCount;
            headerRow = rowIndex;
            columnMap = currentColumnMap;
            columnPositions = currentPositions;
            bestRowAllHeaders = currentFoundHeaders;
        }

        if (foundCount >= 6) {
            console.log(`  ✅ Found ${foundCount} headers at row ${rowIndex}, stopping search`);
            break;
        }
    }

    console.log(`📍 Header row detected at row ${headerRow} (found ${maxFoundCount} known headers)`);
    console.log(`📊 Detected headers:`, Object.keys(columnMap));
    console.log(`📊 Column positions:`, columnPositions);

    return { columnMap, headerRow, allFoundHeaders: bestRowAllHeaders, columnPositions, allHeaderValues };
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

        console.log(`📋 Using sheet: "${worksheet.name}"`);
        console.log(`📋 Total rows: ${worksheet.rowCount}, Columns: ${worksheet.columnCount}`);

        const { columnMap, headerRow, allFoundHeaders, columnPositions, allHeaderValues } = findHeaders(worksheet);
        console.log(`📋 Header row: ${headerRow}`);

        let dataStartRow = -1;
        const staffIdCol = columnMap["Staff ID"] || 1;

        for (let r = headerRow + 1; r <= Math.min(headerRow + 50, worksheet.rowCount); r++) {
            const row = worksheet.getRow(r);
            const staffId = getCellValue(row.getCell(staffIdCol));

            if (/^\d{2}-\d{3,5}$/.test(staffId) || (staffId && staffId.length >= 5 && staffId.includes('-'))) {
                dataStartRow = r;
                console.log(`📍 Data starts at row ${dataStartRow} (found Staff ID: ${staffId})`);
                break;
            }
        }

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

        if (dataStartRow === -1) {
            dataStartRow = headerRow + 1;
            console.log(`📍 Using default data start row: ${dataStartRow}`);
        }

        const data: CurrentTargetRow[] = [];

        // Build fullColumnMap
        const fullColumnMap: { [key: string]: number } = {};

        // Map columns based on their positions
        // Communication Level appears 3 times: Current, Target 1, Target 2
        if (columnPositions['Communication Level']) {
            const positions = columnPositions['Communication Level'];
            if (positions.length >= 1) {
                fullColumnMap['Communication Level'] = positions[0];  // Current
                console.log(`✅ Mapped Current Communication Level to column ${positions[0]}`);
            }
            if (positions.length >= 2) {
                fullColumnMap['Target 1 Communication Level'] = positions[1];  // Target 1
                console.log(`✅ Mapped Target 1 Communication Level to column ${positions[1]}`);
            }
            if (positions.length >= 3) {
                fullColumnMap['Target 2 Communication Level'] = positions[2];  // Target 2
                console.log(`✅ Mapped Target 2 Communication Level to column ${positions[2]}`);
            }
        }

        // JLPT / NAT Test Level appears 2 times: Target 1, Target 2
        if (columnPositions['JLPT / NAT Test Level']) {
            const positions = columnPositions['JLPT / NAT Test Level'];
            if (positions.length >= 1) {
                fullColumnMap['Target 1 JLPT / NAT Test Level'] = positions[0];  // Target 1
                console.log(`✅ Mapped Target 1 JLPT/NAT Test Level to column ${positions[0]}`);
            }
            if (positions.length >= 2) {
                fullColumnMap['Target 2 JLPT / NAT Test Level'] = positions[1];  // Target 2
                console.log(`✅ Mapped Target 2 JLPT/NAT Test Level to column ${positions[1]}`);
            }
        }

        // Also add any other headers from columnMap
        for (const [key, value] of Object.entries(columnMap)) {
            if (!fullColumnMap[key] && !key.includes('Communication Level') && !key.includes('JLPT / NAT Test Level')) {
                fullColumnMap[key] = value;
            }
        }

        console.log('📋 Final column mapping:', fullColumnMap);

        for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r);
            const rowData: CurrentTargetRow = {};
            let hasAnyData = false;

            // Extract using the mapped columns
            for (const [headerName, col] of Object.entries(fullColumnMap)) {
                const value = getCellValue(row.getCell(col));
                rowData[headerName] = value;
                if (value) hasAnyData = true;
            }

            // Clean up Staff ID
            const staffIdKey = Object.keys(rowData).find(k =>
                k.toLowerCase().includes('staff id') ||
                k.toLowerCase() === 'staff' ||
                k.toLowerCase().includes('id')
            );
            if (staffIdKey && rowData[staffIdKey]) {
                rowData["Staff ID"] = rowData[staffIdKey].replace(/[^0-9-]/g, '');
            }

            // Try to find Name
            const nameKey = Object.keys(rowData).find(k =>
                k.toLowerCase().includes('name') ||
                k.toLowerCase().includes('employee')
            );
            if (nameKey && rowData[nameKey]) {
                rowData["Name"] = rowData[nameKey];
            }

            if (hasAnyData) {
                data.push(rowData);
            }
        }

        console.log(`✅ Extracted ${data.length} records`);
        if (data.length > 0) {
            console.log('📋 Sample record (keys):', Object.keys(data[0]));
            console.log('📋 Sample record:', data[0]);
        }
        logExtractedData(data, Object.keys(fullColumnMap));
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

    console.log('\n📝 ALL EXTRACTED RECORDS:');
    console.log('-'.repeat(80));

    data.forEach((record, index) => {
        console.log(`\n🔹 Record #${index + 1}:`);
        Object.entries(record).forEach(([key, value]) => {
            console.log(`  ${key}: ${value || '(empty)'}`);
        });
        console.log('-'.repeat(40));
    });

    console.log('\n📊 TABLE VIEW:');
    console.table(data);

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

    console.log(`✅ Validation: ${valid.length} valid, ${invalid.length} invalid`);
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

    console.log(`✅ Employee validation: ${valid.length} valid, ${invalid.length} invalid`);
    return { valid, invalid };
}

export function transformToApiFormat(data: CurrentTargetRow[]): any[] {
    return data.map((row) => {
        const wantToSit = row["Want to sit JLPT exam on Jul 2026"]?.trim()?.toLowerCase() || '';
        const wantToSitBool = wantToSit === 'yes' || wantToSit === 'y';

        // Try both the shortened and full header names
        const learningMethod = 
            row["Learning Method"]?.trim() ||
            row["If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)"]?.trim() ||
            null;

        return {
            employeeId: row["Staff ID"]?.trim() || '',
            jlptNatTest: row["JLPT / NAT Test"]?.trim() || null,
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