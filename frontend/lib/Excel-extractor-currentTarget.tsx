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
    "Communication Level",
    "JLPT / NAT Test Level",
    "Communication Level",
    "JLPT / NAT Test Level",
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
    "JLPT / NAT Test": ['jlpt / nat test', 'jlpt/nat test', 'jpt/nat test', 'exam type', 'test type'],
    "JLPT Highest Level (Certified)": ['jlpt highest level (certified)', 'highest level', 'certified', 'jlpt highest'],
    "Other Highest Japanese Level (Certified) if any": [
        'other highest japanese level (certified) if any',
        'other highest japanese level',
        'other japanese level',
        'other level',
        'other highest level',
        'other certified level',
        'other japanese certified',
        'additional japanese level',
        'second japanese level',
        'other jlpt level',
        'other nat level',
        'other topj level',
        'other bjt level',
        'other language level'
    ],
    "Preferred Joining Group & Level": ['preferred joining group & level', 'preferred joining', 'joining group'],
    "Communication Level": ['communication level', 'comm level', 'current comm'],
    "Target 1 Communication Level": ['communication level', 'target 1', 'sep-2026'],
    "Target 1 JLPT / NAT Test Level": ['jlpt / nat test level', 'jlpt/nat test level', 'jlpt level', 'nat level', 'target 1 jlpt'],
    "Target 2 Communication Level": ['communication level', 'target 2', 'mar-2027'],
    "Target 2 JLPT / NAT Test Level": ['jlpt / nat test level', 'jlpt/nat test level', 'jlpt level', 'nat level', 'target 2 jlpt'],
    "Japanese Level (Current Learning)": ['japanese level (current learning)', 'current learning', 'learning level'],
    "If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)": [
        'learning method', 'study method', 'online/zoom', 'in-person', 'video record', 'mobile app', 'web',
        'learning', 'method', 'studying japanese', 'online zoom', 'in person', 'video', 'mobile', 'app'
    ],
    "Want to sit JLPT exam on Jul 2026": ['want to sit jlpt exam on jul 2026', 'sit jlpt', 'exam jul 2026'],
    "If Yes, Which Level?": ['if yes, which level?', 'which level', 'exam level'],
    "Confidence Level to Pass Exam": ['confidence level to pass exam', 'confidence', 'confidence level']
};

// ✅ Helper to map JLPT/NAT values to match Enum
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

            // Direct detection for Learning Method
            if (lowerValue.includes('learning method') ||
                lowerValue.includes('studying japanese') ||
                lowerValue.includes('online/zoom') ||
                lowerValue.includes('in-person') ||
                lowerValue.includes('video record') ||
                lowerValue.includes('mobile app')) {
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

            // 🔧 FIX: Detect JLPT / NAT Test (TYPE) - Column 9
            // Only match if it's exactly "JLPT / NAT Test" or similar without "Level"
            const isTestType = 
                lowerValue === 'jlpt / nat test' ||
                lowerValue === 'jlpt/nat test' ||
                lowerValue === 'jpt/nat test' ||
                (lowerValue.includes('jlpt') && lowerValue.includes('test') && !lowerValue.includes('level')) ||
                (lowerValue.includes('nat') && lowerValue.includes('test') && !lowerValue.includes('level'));
            
            if (isTestType) {
                if (!currentColumnMap["JLPT / NAT Test"]) {
                    currentColumnMap["JLPT / NAT Test"] = colNumber;
                    foundCount++;
                }
                if (!currentPositions["JLPT / NAT Test"]) {
                    currentPositions["JLPT / NAT Test"] = [];
                }
                if (!currentPositions["JLPT / NAT Test"].includes(colNumber)) {
                    currentPositions["JLPT / NAT Test"].push(colNumber);
                }
            }

            // 🔧 FIX: Detect JLPT / NAT Test Level - ONLY columns 14 and 16
            // Map by exact column position since we know the Excel structure
            if (colNumber === 14 || colNumber === 16) {
                // These are the Target 1 and Target 2 JLPT/NAT Test Level columns
                if (colNumber === 14) {
                    if (!currentColumnMap["Target 1 JLPT / NAT Test Level"]) {
                        currentColumnMap["Target 1 JLPT / NAT Test Level"] = colNumber;
                        foundCount++;
                    }
                    if (!currentPositions["Target 1 JLPT / NAT Test Level"]) {
                        currentPositions["Target 1 JLPT / NAT Test Level"] = [];
                    }
                    if (!currentPositions["Target 1 JLPT / NAT Test Level"].includes(colNumber)) {
                        currentPositions["Target 1 JLPT / NAT Test Level"].push(colNumber);
                    }
                } else if (colNumber === 16) {
                    if (!currentColumnMap["Target 2 JLPT / NAT Test Level"]) {
                        currentColumnMap["Target 2 JLPT / NAT Test Level"] = colNumber;
                        foundCount++;
                    }
                    if (!currentPositions["Target 2 JLPT / NAT Test Level"]) {
                        currentPositions["Target 2 JLPT / NAT Test Level"] = [];
                    }
                    if (!currentPositions["Target 2 JLPT / NAT Test Level"].includes(colNumber)) {
                        currentPositions["Target 2 JLPT / NAT Test Level"].push(colNumber);
                    }
                }
            }

            // Direct detection for Communication Level
            if (lowerValue.includes('communication') || lowerValue.includes('comm')) {
                // Map by column position
                if (colNumber === 13) {
                    // Current Communication Level
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
                } else if (colNumber === 15) {
                    // Target 1 Communication Level
                    if (!currentColumnMap["Target 1 Communication Level"]) {
                        currentColumnMap["Target 1 Communication Level"] = colNumber;
                        foundCount++;
                    }
                    if (!currentPositions["Target 1 Communication Level"]) {
                        currentPositions["Target 1 Communication Level"] = [];
                    }
                    if (!currentPositions["Target 1 Communication Level"].includes(colNumber)) {
                        currentPositions["Target 1 Communication Level"].push(colNumber);
                    }
                } else if (colNumber === 17) {
                    // Target 2 Communication Level
                    if (!currentColumnMap["Target 2 Communication Level"]) {
                        currentColumnMap["Target 2 Communication Level"] = colNumber;
                        foundCount++;
                    }
                    if (!currentPositions["Target 2 Communication Level"]) {
                        currentPositions["Target 2 Communication Level"] = [];
                    }
                    if (!currentPositions["Target 2 Communication Level"].includes(colNumber)) {
                        currentPositions["Target 2 Communication Level"].push(colNumber);
                    }
                }
            }

            // Try exact or partial match with HEADER_NAMES
            for (const headerName of HEADER_NAMES) {
                const lowerHeader = headerName.toLowerCase();
                if (lowerValue === lowerHeader || lowerValue.includes(lowerHeader) || lowerHeader.includes(lowerValue)) {
                    // Skip if already matched by specific detection
                    if (headerName === "JLPT / NAT Test" && currentColumnMap["JLPT / NAT Test"]) continue;
                    if (headerName === "Target 1 JLPT / NAT Test Level" && currentColumnMap["Target 1 JLPT / NAT Test Level"]) continue;
                    if (headerName === "Target 2 JLPT / NAT Test Level" && currentColumnMap["Target 2 JLPT / NAT Test Level"]) continue;
                    if (headerName === "Communication Level" && currentColumnMap["Communication Level"]) continue;
                    if (headerName === "Target 1 Communication Level" && currentColumnMap["Target 1 Communication Level"]) continue;
                    if (headerName === "Target 2 Communication Level" && currentColumnMap["Target 2 Communication Level"]) continue;
                    
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
                    break;
                }
            }

            // If not found, try keywords
            if (!Object.values(currentColumnMap).includes(colNumber)) {
                for (const [headerName, keywords] of Object.entries(HEADER_KEYWORDS)) {
                    // Skip if already matched
                    if (currentColumnMap[headerName]) continue;
                    
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
            break;
        }
    }

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

        const { columnMap, headerRow, allFoundHeaders, columnPositions, allHeaderValues } = findHeaders(worksheet);

        console.log('🔍 Found column map:', columnMap);

        let dataStartRow = -1;
        const staffIdCol = columnMap["Staff ID"] || 3; // Column 3 is Staff ID

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

        const data: CurrentTargetRow[] = [];

        // 🔧 FIX: Build fullColumnMap with direct column mappings
        const fullColumnMap: { [key: string]: number } = {};

        // Direct mapping based on Excel structure
        // Staff ID is column 3
        fullColumnMap["Staff ID"] = columnMap["Staff ID"] || 3;
        
        // Name is column 4
        fullColumnMap["Name"] = columnMap["Name"] || 4;
        
        // Email is column 5
        fullColumnMap["Email"] = columnMap["Email"] || 5;
        
        // Post is column 6
        fullColumnMap["Post"] = columnMap["Post"] || 6;
        
        // Team is column 7
        fullColumnMap["Team"] = columnMap["Team"] || 7;
        
        // Dept is column 8
        fullColumnMap["Dept"] = columnMap["Dept"] || 8;
        
        // JLPT / NAT Test is column 9 (TEST TYPE)
        fullColumnMap["JLPT / NAT Test"] = columnMap["JLPT / NAT Test"] || 9;
        
        // JLPT Highest Level (Certified) is column 10
        fullColumnMap["JLPT Highest Level (Certified)"] = columnMap["JLPT Highest Level (Certified)"] || 10;
        
        // Other Highest Japanese Level (Certified) if any is column 11
        fullColumnMap["Other Highest Japanese Level (Certified) if any"] = columnMap["Other Highest Japanese Level (Certified) if any"] || 11;
        
        // Preferred Joining Group & Level is column 12
        fullColumnMap["Preferred Joining Group & Level"] = columnMap["Preferred Joining Group & Level"] || 12;
        
        // Communication Level (Current) is column 13
        fullColumnMap["Communication Level"] = columnMap["Communication Level"] || 13;
        
        // Target 1 JLPT / NAT Test Level is column 14
        fullColumnMap["Target 1 JLPT / NAT Test Level"] = columnMap["Target 1 JLPT / NAT Test Level"] || 14;
        
        // Target 1 Communication Level is column 15
        fullColumnMap["Target 1 Communication Level"] = columnMap["Target 1 Communication Level"] || 15;
        
        // Target 2 JLPT / NAT Test Level is column 16
        fullColumnMap["Target 2 JLPT / NAT Test Level"] = columnMap["Target 2 JLPT / NAT Test Level"] || 16;
        
        // Target 2 Communication Level is column 17
        fullColumnMap["Target 2 Communication Level"] = columnMap["Target 2 Communication Level"] || 17;
        
        // Japanese Level (Current Learning) is column 18
        fullColumnMap["Japanese Level (Current Learning)"] = columnMap["Japanese Level (Current Learning)"] || 18;
        
        // Learning Method is column 19
        fullColumnMap["Learning Method"] = columnMap["Learning Method"] || 19;
        
        // Want to sit JLPT exam on Jul 2026 is column 20
        fullColumnMap["Want to sit JLPT exam on Jul 2026"] = columnMap["Want to sit JLPT exam on Jul 2026"] || 20;
        
        // If Yes, Which Level? is column 21
        fullColumnMap["If Yes, Which Level?"] = columnMap["If Yes, Which Level?"] || 21;
        
        // Confidence Level to Pass Exam is column 22
        fullColumnMap["Confidence Level to Pass Exam"] = columnMap["Confidence Level to Pass Exam"] || 22;

        console.log('📋 Final column map:', fullColumnMap);

        for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
            const row = worksheet.getRow(r);
            const rowData: CurrentTargetRow = {};
            let hasAnyData = false;

            for (const [headerName, col] of Object.entries(fullColumnMap)) {
                const value = getCellValue(row.getCell(col));
                rowData[headerName] = value;
                if (value) hasAnyData = true;
            }

            // Clean up Staff ID
            if (rowData["Staff ID"]) {
                rowData["Staff ID"] = rowData["Staff ID"].replace(/[^0-9-]/g, '');
            }

            if (hasAnyData) {
                data.push(rowData);
            }
        }

        return {
            success: true,
            headers: Object.keys(fullColumnMap),
            data: data
        };

    } catch (err) {
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
        const wantToSit = row["Want to sit JLPT exam on Jul 2026"]?.trim()?.toLowerCase() || '';
        const wantToSitBool = wantToSit === 'yes' || wantToSit === 'y';

        const learningMethod =
            row["Learning Method"]?.trim() ||
            row["If you are studying Japanese, Learning Method (Online/Zoom, In-person, Video Record, Mobile App or Web)"]?.trim() ||
            null;

        // ✅ Normalize JLPT/NAT Test value to match Enum (this is the TEST TYPE)
        const jlptNatTest = normalizeJlptNatTest(row["JLPT / NAT Test"]);

        return {
            employeeId: row["Staff ID"]?.trim() || '',
            jlptNatTest: jlptNatTest,  // ← TEST TYPE (JLPT, NAT, TopJ, BJT)
            jlptHighestLevel: row["JLPT Highest Level (Certified)"]?.trim() || null,
            otherJapaneseLevel: row["Other Highest Japanese Level (Certified) if any"]?.trim() || null,
            preferredLearningGroup: row["Preferred Joining Group & Level"]?.trim() || null,
            currentCommunicationLevel: row["Communication Level"]?.trim() || null,
            target1CommunicationLevel: row["Target 1 Communication Level"]?.trim() || null,
            target1JlptNatLevel: row["Target 1 JLPT / NAT Test Level"]?.trim() || null,  // ← TEST LEVEL (N1, N2, etc.)
            target2CommunicationLevel: row["Target 2 Communication Level"]?.trim() || null,
            target2JlptNatLevel: row["Target 2 JLPT / NAT Test Level"]?.trim() || null,  // ← TEST LEVEL (N1, N2, etc.)
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