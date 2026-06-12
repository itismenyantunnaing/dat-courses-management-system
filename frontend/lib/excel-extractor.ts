import ExcelJS from "exceljs";

export interface EmployeeRow {
  [key: string]: string;
}

export interface ExtractionResult {
  success: boolean;
  headers: string[];
  employees: EmployeeRow[];
  error?: string;
}

function getCellValue(cell: ExcelJS.Cell): string {
  const value = cell.value;
  
  if (value === null || value === undefined) {
    return "";
  }
  
  if (typeof value === "string") {
    return value.trim();
  }
  
  if (typeof value === "number") {
    return value.toString();
  }
  
  if (typeof value === "boolean") {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  
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
      return ""; // Skip error cells
    }
  }
  
  return "";
}

export async function extractEmployeesFromExcel(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    let targetWorksheet: ExcelJS.Worksheet | null = null;
    let headerRowIndex = -1;
    let idColumnIndex = -1;
    let nameColumnIndex = -1;
    const headers: string[] = [];

    // --- PHASE 1: FIND THE CORRECT SHEET WITH ACTUAL DATA ---
    // Look for sheets that contain actual data (not formulas/errors)
    for (const worksheet of workbook.worksheets) {
      console.log(`Checking sheet: "${worksheet.name}"`);
      
      // Skip sheets that are likely reference/summary sheets
      if (worksheet.name.includes("Technical capabilities") || 
          worksheet.name.includes("Scoring") ||
          worksheet.name.includes("Category") ||
          worksheet.name.includes("Master")) {
        console.log(`  Skipping summary sheet: "${worksheet.name}"`);
        continue;
      }
      
      const totalRows = worksheet.rowCount;
      
      // Look for "ID" and "Name" in first 20 rows
      for (let r = 1; r <= Math.min(totalRows, 20); r++) {
        const row = worksheet.getRow(r);
        let foundID = -1;
        let foundName = -1;
        
        for (let c = 1; c <= 20; c++) {
          const cellValue = getCellValue(row.getCell(c)).toLowerCase();
          if (cellValue === "id") {
            foundID = c;
          }
          if (cellValue === "name") {
            foundName = c;
          }
        }
        
        if (foundID !== -1 && foundName !== -1) {
          // Verify this sheet has actual data (not just #REF! errors)
          // Check a few rows below for valid data
          let hasValidData = false;
          for (let checkRow = r + 1; checkRow <= Math.min(r + 20, totalRows); checkRow++) {
            const checkRowData = worksheet.getRow(checkRow);
            const idVal = getCellValue(checkRowData.getCell(foundID));
            const nameVal = getCellValue(checkRowData.getCell(foundName));
            
            // Look for ID pattern or non-empty name
            if (/^\d{2}-\d{5}$/.test(idVal) || (nameVal && nameVal.length > 3 && !nameVal.includes("REF"))) {
              hasValidData = true;
              break;
            }
          }
          
          if (hasValidData) {
            targetWorksheet = worksheet;
            headerRowIndex = r;
            idColumnIndex = foundID;
            nameColumnIndex = foundName;
            console.log(`✅ Found data sheet: "${worksheet.name}"`);
            console.log(`   Header row: ${headerRowIndex}, ID col: ${idColumnIndex}, Name col: ${nameColumnIndex}`);
            break;
          }
        }
      }
      if (targetWorksheet) break;
    }

    if (!targetWorksheet || headerRowIndex === -1) {
      // Fallback: try the "Original data" sheet
      const originalDataSheet = workbook.worksheets.find(ws => ws.name === "Original data");
      if (originalDataSheet) {
        console.log("Trying 'Original data' sheet as fallback");
        targetWorksheet = originalDataSheet;
        // Look for headers in this sheet
        for (let r = 1; r <= 20; r++) {
          const row = originalDataSheet.getRow(r);
          for (let c = 1; c <= 20; c++) {
            const cellValue = getCellValue(row.getCell(c)).toLowerCase();
            if (cellValue === "id") idColumnIndex = c;
            if (cellValue === "name") nameColumnIndex = c;
          }
          if (idColumnIndex !== -1 && nameColumnIndex !== -1) {
            headerRowIndex = r;
            break;
          }
        }
      }
    }
    
    if (!targetWorksheet || headerRowIndex === -1) {
      return {
        success: false,
        headers: [],
        employees: [],
        error: "Could not find a sheet with actual employee data containing 'ID' and 'Name' columns."
      };
    }

    // --- PHASE 2: EXTRACT THE HEADERS ---
    const targetHeaderRow = targetWorksheet.getRow(headerRowIndex);
    const columnCount = targetWorksheet.columnCount;

    for (let colNumber = 1; colNumber <= columnCount; colNumber++) {
      const cell = targetHeaderRow.getCell(colNumber);
      let headerText = getCellValue(cell);
      headerText = headerText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
      headers.push(headerText || `Column_${colNumber}`);
    }

    console.log(`Extracted ${headers.length} headers`);

    // --- PHASE 3: FIND FIRST ACTUAL DATA ROW ---
    let dataStartRow = -1;
    const totalRows = targetWorksheet.rowCount;
    
    for (let r = headerRowIndex + 1; r <= Math.min(headerRowIndex + 500, totalRows); r++) {
      const row = targetWorksheet.getRow(r);
      const idCell = getCellValue(row.getCell(idColumnIndex));
      const nameCell = getCellValue(row.getCell(nameColumnIndex));
      
      // Check for ID pattern: two digits, hyphen, five digits (e.g., 25-00294)
      if (/^\d{2}-\d{5}$/.test(idCell)) {
        dataStartRow = r;
        console.log(`✅ Found first data row at ${r} with ID: ${idCell}, Name: ${nameCell}`);
        break;
      }
      
      // Also check for valid name
      if (nameCell && nameCell.length > 3 && nameCell !== "Name" && nameCell !== "name" && !nameCell.includes("REF")) {
        dataStartRow = r;
        console.log(`✅ Found first data row by name at ${r}: ${nameCell}`);
        break;
      }
    }
    
    if (dataStartRow === -1) {
      return {
        success: true,
        headers: headers,
        employees: [],
        error: "No data rows found after the header"
      };
    }

    // --- PHASE 4: EXTRACT DATA ROWS ---
    const employees: EmployeeRow[] = [];
    
    for (let r = dataStartRow; r <= totalRows; r++) {
      const row = targetWorksheet.getRow(r);
      const idCell = getCellValue(row.getCell(idColumnIndex));
      const nameCell = getCellValue(row.getCell(nameColumnIndex));
      
      // Stop at totalling rows
      if (idCell === "【totalling】" || nameCell === "【totalling】" || idCell === "totalling") {
        console.log(`Stopping at row ${r} - found totalling`);
        break;
      }
      
      // Skip empty rows
      if (!idCell && !nameCell) continue;
      
      // Build employee record
      const rowData: EmployeeRow = {};
      let hasValidData = false;
      
      for (let colNumber = 1; colNumber <= columnCount; colNumber++) {
        const headerName = headers[colNumber - 1];
        const cell = row.getCell(colNumber);
        const cellValue = getCellValue(cell);
        
        rowData[headerName] = cellValue;
        
        if ((headerName.toLowerCase() === "id" || headerName.toLowerCase() === "name") && cellValue !== "") {
          hasValidData = true;
        }
      }
      
      if (hasValidData) {
        employees.push(rowData);
      }
    }
    
    console.log(`✅ Extracted ${employees.length} employees`);
    
    if (employees.length > 0) {
      const idKey = Object.keys(employees[0]).find(k => k.toLowerCase() === "id");
      const nameKey = Object.keys(employees[0]).find(k => k.toLowerCase() === "name");
      console.log("📝 First employee:", {
        id: idKey ? employees[0][idKey] : "Not found",
        name: nameKey ? employees[0][nameKey] : "Not found"
      });
    }

    return {
      success: true,
      headers: headers,
      employees: employees
    };

  } catch (err) {
    console.error("Extraction error:", err);
    return {
      success: false,
      headers: [],
      employees: [],
      error: err instanceof Error ? err.message : "An unexpected parsing error occurred"
    };
  }
}