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

// Technical Ability Configuration
interface Skill {
  id: number;
  skill_name: string;
}

interface SkillSubCategory {
  id: number;
  sub_category_name: string;
  skills: Skill[];
}

interface SkillCategory {
  id: number | null;
  category_name: string;
  skill_sub_categories: SkillSubCategory[];
}

const TECHNICAL_ABILITY_CONFIG: SkillCategory[] = [
  {
    id: 1,
    category_name: "Programming Language",
    skill_sub_categories: [
      { id: 1, sub_category_name: "Host Club", skills: [{ id: 1, skill_name: "assembler" }, { id: 2, skill_name: "COBOL" }, { id: 3, skill_name: "JCL" }] },
      { id: 2, sub_category_name: "distributed system", skills: [{ id: 4, skill_name: "JAVA" }, { id: 5, skill_name: ".Net" }, { id: 6, skill_name: "C/C++" }, { id: 7, skill_name: "PL/SQL" }, { id: 8, skill_name: "Python" }, { id: 9, skill_name: "shell" }] }
    ]
  },
  {
    id: 2,
    category_name: "Trending words",
    skill_sub_categories: [
      { id: 8, sub_category_name: "Cloud", skills: [{ id: 15, skill_name: "Amazon Web Services (AWS)" }, { id: 16, skill_name: "Microsoft Azure" }, { id: 17, skill_name: "Google Cloud Platform (GCP)" }, { id: 18, skill_name: "Actual Cloud" }] },
      { id: 9, sub_category_name: "General", skills: [{ id: 19, skill_name: "RPA" }, { id: 20, skill_name: "ChatBot" }, { id: 21, skill_name: "BI tools / Microsoft Power Automate / Microsoft Power App / Tabular" }] },
      { id: 10, sub_category_name: "LowCode", skills: [{ id: 22, skill_name: "Salesforce" }, { id: 23, skill_name: "Outsystems" }] },
      { id: 11, sub_category_name: "Mobile", skills: [{ id: 24, skill_name: "iOS" }, { id: 25, skill_name: "Android" }, { id: 26, skill_name: "Other (Windows Phone, Tizen, Xamarin, Qt, Fluter)" }] },
      { id: 12, sub_category_name: "cutting edge technology", skills: [{ id: 27, skill_name: "BigData" }, { id: 28, skill_name: "BlockChain" }, { id: 29, skill_name: "AI" }] }
    ]
  },
  {
    id: null,
    category_name: "Uncategorized",
    skill_sub_categories: [
      { id: 3, sub_category_name: "DB", skills: [{ id: 10, skill_name: "Oracle" }, { id: 11, skill_name: "SQL Server" }, { id: 12, skill_name: "MySQL" }, { id: 13, skill_name: "PostgreSQL" }, { id: 14, skill_name: "InMemoryDB" }] },
      { id: 4, sub_category_name: "DAT only", skills: [{ id: 30, skill_name: "Ruby" }, { id: 31, skill_name: "NodeJS" }, { id: 32, skill_name: "Typescript" }, { id: 33, skill_name: "GO" }, { id: 34, skill_name: "Solidity" }, { id: 35, skill_name: "PHP" }, { id: 36, skill_name: "ReactJS" }, { id: 37, skill_name: "DataStage (IBM InfoSphere)" }, { id: 38, skill_name: "Job Network Development" }, { id: 39, skill_name: "PowerCenter (Informatica)" }, { id: 40, skill_name: "Window" }, { id: 41, skill_name: "Linux" }, { id: 42, skill_name: "Virtualization" }, { id: 43, skill_name: "HCI" }, { id: 44, skill_name: "Networking" }, { id: 45, skill_name: "Security" }, { id: 46, skill_name: "Automation (RPA and Selenium web driver)" }, { id: 47, skill_name: "VBA" }, { id: 48, skill_name: "Angular" }] },
      { id: 5, sub_category_name: "Framework", skills: [{ id: 49, skill_name: ".Net Framework" }, { id: 50, skill_name: "Silver Light" }, { id: 51, skill_name: "Struts" }, { id: 52, skill_name: "SAP" }, { id: 53, skill_name: "Spring" }, { id: 54, skill_name: "Mybatis" }, { id: 55, skill_name: "Wicket" }, { id: 56, skill_name: "Ionic" }, { id: 57, skill_name: "Junit" }] },
      { id: 6, sub_category_name: "Other Cloud", skills: [{ id: 58, skill_name: "Digital Ocean" }] },
      { id: 7, sub_category_name: "Others", skills: [{ id: 59, skill_name: "React" }, { id: 60, skill_name: "JS" }] }
    ]
  }
];

const HEADERS_IN_ORDER: string[] = [
  "ID",
  "name",
  "Name of the commissioning department *Select from the dropdown menu",
  "Core personnel *FPT only",
  "Whether or not you have a business trip to Japan",
  "administrator - Management experience (Levels 1-5)",
  "administrator - management ability - QCD (1-4 points)",
  "administrator - management ability - Reporting, contacting, and consulting (1-4 points)",
  "administrator - management ability - Education (1-4 points)",
  "administrator - management ability - Total (Levels 1-5)",
  "Developer (DIR and YSX tasks only) - language skills - Level (Levels 1-5)",
  "Developer (DIR and YSX tasks only) - language skills - JLPT/NAT (N1~N5)",
  "Developer (DIR and YSX tasks only) - Development capabilities - Host/Online - Years of experience",
  "Developer (DIR and YSX tasks only) - Development capabilities - Host/Online - Experience Process",
  "Developer (DIR and YSX tasks only) - Development capabilities - Host/Batch - Years of experience",
  "Developer (DIR and YSX tasks only) - Development capabilities - Host/Batch - Experience Process",
  "Developer (DIR and YSX tasks only) - Development capabilities - Decentralized/Online - Years of experience",
  "Developer (DIR and YSX tasks only) - Development capabilities - Decentralized/Online - Experience Process",
  "Developer (DIR and YSX tasks only) - Development capabilities - Distributed/Batch - Years of experience",
  "Developer (DIR and YSX tasks only) - Development capabilities - Distributed/Batch - Experience Process"
];

for (const category of TECHNICAL_ABILITY_CONFIG) {
  for (const subCategory of category.skill_sub_categories) {
    for (const skill of subCategory.skills) {
      HEADERS_IN_ORDER.push(`technical ability - ${category.category_name} - ${subCategory.sub_category_name} - ${skill.skill_name} - Years`);
      HEADERS_IN_ORDER.push(`technical ability - ${category.category_name} - ${subCategory.sub_category_name} - ${skill.skill_name} - experience`);
    }
  }
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

export async function extractEmployeesFromExcel(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    let targetWorksheet: ExcelJS.Worksheet | null = null;
    let idColumnIndex = -1;
    let nameColumnIndex = -1;
    let headerRowNumber = -1;

    // --- PHASE 1: FIND THE DATA SHEET AND STRUCTURAL HEADER ROW INDEX ---
    for (const worksheet of workbook.worksheets) {
      if (worksheet.name.includes("Technical capabilities") || 
          worksheet.name.includes("Scoring") ||
          worksheet.name.includes("Category") ||
          worksheet.name.includes("Master")) {
        continue;
      }
      
      const totalRows = worksheet.rowCount;
      for (let r = 1; r <= Math.min(totalRows, 50); r++) {
        const row = worksheet.getRow(r);
        let foundID = -1;
        let foundName = -1;
        
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const cellValue = getCellValue(cell).toLowerCase();
          if (cellValue === "id" || cellValue === "staff id") foundID = colNumber;
          if (cellValue === "name") foundName = colNumber;
        });
        
        if (foundID !== -1 && foundName !== -1) {
          targetWorksheet = worksheet;
          idColumnIndex = foundID;
          nameColumnIndex = foundName;
          headerRowNumber = r; // Row where "ID" and "name" exist as base descriptors
          break;
        }
      }
      if (targetWorksheet) break;
    }

    if (!targetWorksheet || idColumnIndex === -1 || headerRowNumber === -1) {
      return {
        success: false,
        headers: [],
        employees: [],
        error: "Could not find a valid sheet containing 'ID' and 'Name' columns."
      };
    }

    // --- PHASE 2: CALCULATE DATA START ROW (MUST BE BEYOND THE HEADER TIERS) ---
    const totalRows = targetWorksheet.rowCount;
    let dataStartRow = -1;
    
    // Header blocks take up multiple rows (Rows 5, 6, 7). 
    // Start scanning strictly past the found structural header labels row
    for (let r = headerRowNumber + 1; r <= totalRows; r++) {
      const row = targetWorksheet.getRow(r);
      const idValue = getCellValue(row.getCell(idColumnIndex));
      const nameValue = getCellValue(row.getCell(nameColumnIndex));
      
      // Skip cells that simply echo structural header words or system category identifiers
      if (idValue.toLowerCase() === "id" || nameValue.toLowerCase() === "name" || 
          nameValue.toLowerCase().includes("commissioning department")) {
        continue;
      }

      const hasValidID = /^\d{2}-\d{5}$/.test(idValue);
      const hasValidName = nameValue && nameValue.length > 2 && nameValue.length < 100 && 
                           !nameValue.includes("management ability") &&
                           !nameValue.includes("Development capabilities") &&
                           !nameValue.includes("Technical Ability") &&
                           !nameValue.includes("administrator");
      
      if (hasValidID || hasValidName) {
        dataStartRow = r;
        break;
      }
    }
    
    if (dataStartRow === -1) {
      return {
        success: false,
        headers: [],
        employees: [],
        error: "Could not find data rows with valid employee records."
      };
    }
    
    console.log(`Data starts at row: ${dataStartRow}`);
    
    // --- PHASE 3: DETERMINE MAX COLUMN ---
    let maxColumn = 1;
    for (let r = dataStartRow; r <= Math.min(dataStartRow + 5, totalRows); r++) {
      const row = targetWorksheet.getRow(r);
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (colNumber > maxColumn) maxColumn = colNumber;
      });
    }
    
    // --- PHASE 4: EXTRACT EMPLOYEE DATA BY POSITION ---
    const employees: EmployeeRow[] = [];
    
    for (let r = dataStartRow; r <= totalRows; r++) {
      const row = targetWorksheet.getRow(r);
      const idValue = getCellValue(row.getCell(idColumnIndex));
      const nameValue = getCellValue(row.getCell(nameColumnIndex));
      
      if (idValue.toLowerCase().includes("totalling") || 
          nameValue.toLowerCase().includes("totalling") || 
          idValue === "【totalling】") {
        break;
      }
      
      if (!idValue && !nameValue) continue;
      
      const employeeData: EmployeeRow = {};
      for (const header of HEADERS_IN_ORDER) {
        employeeData[header] = "";
      }
      
      employeeData["ID"] = idValue;
      employeeData["name"] = nameValue;
      
      for (let col = 1; col <= maxColumn; col++) {
        if (col === idColumnIndex || col === nameColumnIndex) {
          continue;
        }
        
        const cellValue = getCellValue(row.getCell(col));
        let headerPosition = col;
        
        if (col < idColumnIndex) {
          headerPosition = col;
        } else if (col > idColumnIndex && col < nameColumnIndex) {
          headerPosition = col - 1;
        } else if (col > nameColumnIndex) {
          headerPosition = col - 2;
        }
        
        if (headerPosition >= 2 && headerPosition < HEADERS_IN_ORDER.length) {
          const headerName = HEADERS_IN_ORDER[headerPosition];
          if (headerName && cellValue) {
            employeeData[headerName] = cellValue;
          }
        }
      }
      
      // Fallback alignment map by header text strings 
      const headerRow = targetWorksheet.getRow(headerRowNumber);
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const headerText = getCellValue(cell);
        if (!headerText) return;
        
        const cellValue = getCellValue(row.getCell(colNumber));
        if (!cellValue) return;
        
        for (const expectedHeader of HEADERS_IN_ORDER) {
          const normalizedExpected = expectedHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedActual = headerText.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (normalizedActual.includes(normalizedExpected) || normalizedExpected.includes(normalizedActual)) {
            if (employeeData[expectedHeader] === "") {
              employeeData[expectedHeader] = cellValue;
            }
            break;
          }
        }
      });
      
      employees.push(employeeData);
    }
    
    return {
      success: true,
      headers: HEADERS_IN_ORDER,
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

