import ExcelJS from 'exceljs';

export interface EmployeeExcelData {
    staffId: string;
    name: string;
    div: string;
    doorLog: string;
    dept: string;
    team: string;
    status: string;
    role: string;
    position: string;
    [key: string]: string;
}

// Pre-compiled header keywords for faster matching
const HEADER_KEYWORDS: { [key: string]: string[] } = {
    div: ['div', 'division', 'department'],
    staffId: ['staff id', 'staffid', 'employee id', 'emp id', 'id'],
    name: ['name', 'employee name', 'full name', 'staff name'],
    doorLog: ['doorlog', 'door log', 'door', 'log'],
    dept: ['dept', 'department', 'dept.', 'department name'],
    team: ['team', 'team name', 'group'],
    status: ['status', 'employee status', 'active status'],
    role: ['role', 'job role', 'job title'],
    position: ['position', 'designation']
};

// Cache for header matching to avoid repeated processing
const headerMatchCache = new Map<string, string>();

/**
 * Optimized: Find header row in a single pass
 */
const findHeaderRowOptimized = (worksheet: ExcelJS.Worksheet): {
    headerRowIndex: number;
    columnMap: { [key: string]: number };
} => {
    // Pre-allocate column map
    const columnMap: { [key: string]: number } = {};
    
    // Check only first 5 rows (reduced from 10)
    const maxRowsToCheck = Math.min(5, worksheet.rowCount);
    
    for (let rowIndex = 1; rowIndex <= maxRowsToCheck; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowValues: string[] = [];
        let hasData = false;
        
        // Optimized: Process cells in batch
        row.eachCell((cell, colNumber) => {
            if (colNumber > 20) return; // Limit columns to check
            const value = cell.text || cell.value?.toString() || '';
            if (value.trim()) {
                rowValues[colNumber - 1] = value.trim();
                hasData = true;
            }
        });
        
        if (!hasData) continue;
        
        // Check for headers in this row
        let headerFound = false;
        const fieldKeys = Object.keys(HEADER_KEYWORDS);
        
        for (let colIndex = 0; colIndex < rowValues.length; colIndex++) {
            const value = rowValues[colIndex];
            if (!value) continue;
            
            const lowerValue = value.toLowerCase().trim();
            
            // Check cache first
            let matchedField = headerMatchCache.get(lowerValue);
            
            if (!matchedField) {
                // Check each field's keywords
                for (const field of fieldKeys) {
                    const keywords = HEADER_KEYWORDS[field];
                    if (keywords.some(keyword => lowerValue.includes(keyword))) {
                        matchedField = field;
                        headerMatchCache.set(lowerValue, field);
                        break;
                    }
                }
            }
            
            if (matchedField) {
                columnMap[matchedField] = colIndex + 1;
                headerFound = true;
            }
        }
        
        if (headerFound) {
            return { headerRowIndex: rowIndex, columnMap };
        }
    }
    
    // Fallback: auto-detect columns
    return autoDetectColumns(worksheet);
};

/**
 * Optimized: Auto-detect columns
 */
const autoDetectColumns = (worksheet: ExcelJS.Worksheet): {
    headerRowIndex: number;
    columnMap: { [key: string]: number };
} => {
    const columnMap: { [key: string]: number } = {};
    const fieldNames = Object.keys(HEADER_KEYWORDS);
    
    // Find first row with substantial data
    for (let rowIndex = 1; rowIndex <= 3; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        let dataCount = 0;
        
        row.eachCell((cell) => {
            const value = cell.text || cell.value?.toString() || '';
            if (value.trim()) dataCount++;
        });
        
        if (dataCount >= 3) {
            // Auto-assign columns
            fieldNames.forEach((field, index) => {
                if (index < dataCount) {
                    columnMap[field] = index + 1;
                }
            });
            return { headerRowIndex: rowIndex - 1, columnMap };
        }
    }
    
    // Final fallback
    fieldNames.forEach((field, index) => {
        columnMap[field] = index + 1;
    });
    
    return { headerRowIndex: 1, columnMap };
};

/**
 * Optimized: Extract employee data from Excel
 */
export const extractEmployeeDataFromExcel = async (
    file: File
): Promise<EmployeeExcelData[]> => {
    const startTime = performance.now();
    
    try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        
        // Find the Employee sheet
        const worksheet = findEmployeeSheetOptimized(workbook);
        if (!worksheet) {
            throw new Error('No Employee sheet found in the Excel file');
        }
        
        // Find header row and column mapping
        const { headerRowIndex, columnMap } = findHeaderRowOptimized(worksheet);
        
        // Optimized data extraction
        const extractedData = extractDataOptimized(worksheet, headerRowIndex, columnMap);
        
        return extractedData;
        
    } catch (error) {
        console.error('❌ Employee extraction error:', error);
        throw error;
    }
};

/**
 * Optimized: Find employee sheet
 */
const findEmployeeSheetOptimized = (workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null => {
    const sheets = workbook.worksheets;
    
    // Pre-compile sheet names for faster checking
    for (const sheet of sheets) {
        const name = sheet.name.toLowerCase();
        if (name.includes('employee') || 
            name.includes('staff') || 
            name.includes('personnel')) {
            return sheet;
        }
    }
    
    return null;
};

/**
 * Optimized: Extract data from worksheet
 */
const extractDataOptimized = (
    worksheet: ExcelJS.Worksheet,
    headerRowIndex: number,
    columnMap: { [key: string]: number }
): EmployeeExcelData[] => {
    const startTime = performance.now();
    const extractedData: EmployeeExcelData[] = [];
    
    // Get field names from column map
    const fields = Object.keys(columnMap);
    const colIndices = fields.map(field => columnMap[field]);
    
    // Pre-allocate array for better performance
    const totalRows = worksheet.rowCount;
    const startRow = headerRowIndex + 1;
    
    if (totalRows - startRow <= 0) {
        return extractedData;
    }
    
    // Use for loop for better performance
    for (let rowIndex = startRow; rowIndex <= totalRows; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        
        // Skip empty rows quickly
        let hasData = false;
        const rowData: EmployeeExcelData = {} as EmployeeExcelData;
        
        // Process only mapped columns
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const colIndex = colIndices[i];
            const cell = row.getCell(colIndex);
            
            // Fast string extraction
            let value = '';
            const cellValue = cell.value;
            
            if (cellValue !== null && cellValue !== undefined) {
                if (typeof cellValue === 'string') {
                    value = cellValue.trim();
                } else if (cellValue instanceof Date) {
                    value = cellValue.toLocaleDateString('en-US');
                } else if (typeof cellValue === 'number') {
                    value = cellValue.toString();
                } else if (cellValue && typeof cellValue === 'object' && 'text' in cellValue) {
                    value = (cellValue as any).text?.trim() || '';
                } else {
                    value = cellValue.toString().trim();
                }
                
                if (value) hasData = true;
            }
            
            rowData[field] = value;
        }
        
        // Only add rows with data
        if (hasData) {
            extractedData.push(rowData);
        }
    }
    return extractedData;
};

/**
 * Optimized: Validate employee data with single pass
 */
export const validateEmployeeData = (data: EmployeeExcelData[]): {
    valid: EmployeeExcelData[];
    invalid: { data: EmployeeExcelData; errors: string[] }[];
} => {
    const startTime = performance.now();
    const valid: EmployeeExcelData[] = [];
    const invalid: { data: EmployeeExcelData; errors: string[] }[] = [];
    
    // Use Set for O(1) duplicate checking
    const existingIds = new Set<string>();
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const errors: string[] = [];
        
        // Check required fields
        const staffId = row.staffId?.trim() || '';
        const name = row.name?.trim() || '';
        
        if (!staffId) {
            errors.push(`Row ${i + 1}: Staff ID is required`);
        } else if (existingIds.has(staffId)) {
            errors.push(`Row ${i + 1}: Duplicate Staff ID "${staffId}"`);
        } else {
            existingIds.add(staffId);
        }
        
        if (!name) {
            errors.push(`Row ${i + 1}: Name is required`);
        }
        
        if (errors.length === 0) {
            valid.push(row);
        } else {
            invalid.push({ data: row, errors });
        }
    }
    
    
    return { valid, invalid };
};

/**
 * Optimized: Get sheet names
 */
export const getExcelSheetNames = async (file: File): Promise<string[]> => {
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

/**
 * Optimized: Extract data from specific sheet
 */
export const extractDataFromSheet = async (
    file: File,
    sheetName: string
): Promise<{ [key: string]: string }[]> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(sheetName);
        if (!worksheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }
        
        // Optimized header detection
        let headers: string[] = [];
        let headerRowIndex = 1;
        
        for (let rowIndex = 1; rowIndex <= Math.min(5, worksheet.rowCount); rowIndex++) {
            const row = worksheet.getRow(rowIndex);
            const rowHeaders: string[] = [];
            
            row.eachCell((cell, colNumber) => {
                if (colNumber > 20) return;
                const value = cell.text || cell.value?.toString() || '';
                if (value.trim()) {
                    rowHeaders.push(value.trim());
                }
            });
            
            if (rowHeaders.length >= 2) {
                headers = rowHeaders;
                headerRowIndex = rowIndex;
                break;
            }
        }
        
        if (headers.length === 0) {
            const firstRow = worksheet.getRow(1);
            firstRow.eachCell((cell, colNumber) => {
                headers.push(`Column ${colNumber}`);
            });
        }
        
        // Optimized data extraction
        const extractedData: { [key: string]: string }[] = [];
        const totalRows = worksheet.rowCount;
        const headerCount = headers.length;
        
        for (let rowIndex = headerRowIndex + 1; rowIndex <= totalRows; rowIndex++) {
            const row = worksheet.getRow(rowIndex);
            const rowData: { [key: string]: string } = {};
            let hasData = false;
            
            for (let colIndex = 1; colIndex <= headerCount; colIndex++) {
                const cell = row.getCell(colIndex);
                let value = '';
                const cellValue = cell.value;
                
                if (cellValue !== null && cellValue !== undefined) {
                    if (typeof cellValue === 'string') {
                        value = cellValue.trim();
                    } else if (cellValue instanceof Date) {
                        value = cellValue.toLocaleDateString('en-US');
                    } else {
                        value = cellValue.toString().trim();
                    }
                    
                    if (value) hasData = true;
                }
                
                rowData[headers[colIndex - 1]] = value;
            }
            
            if (hasData) {
                extractedData.push(rowData);
            }
        }
        
        return extractedData;
        
    } catch (error) {
        console.error('❌ Error extracting data from sheet:', error);
        throw error;
    }
};

// Clear cache if needed (useful for testing)
export const clearHeaderCache = () => {
    headerMatchCache.clear();
};