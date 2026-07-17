import ExcelJS from "exceljs";

// Japanese-to-English header translation map
// Maps Japanese header parts (from 【DAT】①管理･開発能力②技術力_2025 4Q.xlsx) to their English equivalents
const JP_TO_EN_MAP: Record<string, string> = {
  // Name / ID
  '名前': 'name',
  '会社': 'company',
  
  // Administrator / Management
  '管理者': 'administrator',
  '管理経験（レベル1～5）': 'Management experience (Levels 1-5)',
  '管理能力': 'management ability',
  'QCD\n（1～4点）': 'QCD (1-4 points)',
  '報連相\n（1～4点）': 'Reporting, contacting, and consulting (1-4 points)',
  '教育\n（1～4点）': 'Education (1-4 points)',
  '合計\n（レベル1～5）': 'Total (Levels 1-5)',
  
  // Developer
  '開発者（DIR業務、YSX業務限り）': 'Developer (DIR and YSX tasks only)',
  
  // Language skills
  '語学力': 'language skills',
  'レベル\n（レベル1～5）': 'Level (Levels 1-5)',
  'JLPT/NAT\n（N1~N5）': 'JLPT/NAT (N1~N5)',
  
  // Development capabilities
  '開発能力': 'Development capabilities',
  'ホスト/オンライン': 'Host/Online',
  'ホスト/バッチ': 'Host/Batch',
  '分散/オンライン': 'Decentralized/Online',
  '分散/バッチ': 'Distributed/Batch',
  '経験年数': 'Years of experience',
  '経験工程': 'Experience Process',
  
  // Technical ability
  '技術力': 'technical ability',
  '技術力\n\n\n': 'technical ability',
  
  // Programming Language categories
  'プログラミング言語': 'Programming Language',
  'ホスト系': 'Host Club',
  '分散系': 'distributed system',
  'アセンブラ': 'assembler',
  
  // DB (same in both)
  
  // Trending words / Cloud
  'トレンドワード': 'Trending words',
  'クラウド': 'Cloud',
  'Alibaba Cloud': 'Actual Cloud',
  
  // Subcategories
  '先端技術': 'cutting edge technology',
  '※DATのみ': 'DAT only',
  'Other クラウド': 'Other Cloud',
  
  // Skill names with Japanese differences
  'Amazon Web Services（AWS）': 'Amazon Web Services (AWS)',
  'Google Cloud Platform（GCP）': 'Google Cloud Platform (GCP)',
  'その他（WindowsPhone、Tizen、Xamarin、Qt、Fluter）': 'Other (Windows Phone, Tizen, Xamarin, Qt, Fluter)',
  'BIツール / Microsoft Power Automate/\nMicrosoft Power App / Tabular': 'BI tools / Microsoft Power Automate / Microsoft Power App / Tabular',
  'DataStage \n(IBM Info Sphere)': 'DataStage (IBM InfoSphere)',
  'PowerCenter \n(Informatica)': 'PowerCenter (Informatica)',
  '.Net Frame Work': '.Net Framework',
  'Silver Light ': 'Silver Light',
  'SAP ': 'SAP',
  'Spring ': 'Spring',
  'Mybatis ': 'Mybatis',
  'Wicket ': 'Wicket',
  'Ionic ': 'Ionic',
  'Automation\n(RPA and Selenium web driver)': 'Automation (RPA and Selenium web driver)',
  'Shell': 'shell',
  'PostGresSQL': 'PostgreSQL',
  'android': 'Android',
  
  // Bottom-level attributes
  '年数': 'Years',
  '経験': 'experience',
  
  // Other ignored headers
  '委託元部署名\n※プルダウン入力': 'Name of the commissioning department *Select from the dropdown menu',
  'ランク\n※プルダウン入力\n(会社を選択すると\nプルダウン表示されます）': 'Rank *Select from the dropdown menu (The dropdown menu will appear once you select a company)',
  'コア人材\n※FPTのみ': 'Core personnel *FPT only',
  '日本出張\nの有無\n': 'Whether or not you have a business trip to Japan',
  '※プルダウン入力': '※プルダウン入力',
  '自動計算': 'automatic calculation',
  '立場': 'position',
  '管理人数': 'management headcount',
};

/**
 * Translates a single header part from Japanese to English.
 * If no translation is found, returns the original string.
 */
function translateHeaderPart(part: string): string {
  // Try exact match first
  if (JP_TO_EN_MAP[part] !== undefined) {
    return JP_TO_EN_MAP[part];
  }
  // Try trimmed match
  const trimmed = part.trim();
  if (JP_TO_EN_MAP[trimmed] !== undefined) {
    return JP_TO_EN_MAP[trimmed];
  }
  // Try matching with stripped newlines
  const stripped = part.replace(/\n+/g, '\n').trim();
  if (JP_TO_EN_MAP[stripped] !== undefined) {
    return JP_TO_EN_MAP[stripped];
  }
  return part;
}

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
export interface Skill {
  id: number;
  skill_name: string;
}

export interface SkillSubCategory {
  id: number;
  sub_category_name: string;
  skills: Skill[];
}

export interface SkillCategory {
  id: number | null;
  category_name: string;
  skill_sub_categories: SkillSubCategory[];
}


export function isYearsHeader(header: string): boolean {
  const lower = header.toLowerCase();
  // Also detect Japanese 年数 (years)
  return (lower.includes('year') && !lower.includes('experience') && !lower.includes('exp')) || header.includes('年数');
}

export function isExperienceHeader(header: string): boolean {
  const lower = header.toLowerCase();
  // Also detect Japanese 経験 (experience)
  return lower.includes('experience') || lower.includes('exp') || header.includes('経験');
}


export const TECHNICAL_ABILITY_CONFIG: SkillCategory[] = [
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
      { id: 9, sub_category_name: "empty-2", skills: [{ id: 19, skill_name: "RPA" }, { id: 20, skill_name: "ChatBot" }, { id: 21, skill_name: "BI tools / Microsoft Power Automate / Microsoft Power App / Tabular" }] },
      { id: 10, sub_category_name: "LowCode", skills: [{ id: 22, skill_name: "Salesforce" }, { id: 23, skill_name: "Outsystems" }] },
      { id: 11, sub_category_name: "Mobile", skills: [{ id: 24, skill_name: "iOS" }, { id: 25, skill_name: "Android" }, { id: 26, skill_name: "Other (Windows Phone, Tizen, Xamarin, Qt, Fluter)" }] },
      { id: 12, sub_category_name: "cutting edge technology", skills: [{ id: 27, skill_name: "BigData" }, { id: 28, skill_name: "BlockChain" }, { id: 29, skill_name: "AI" }] }
    ]
  },
  {
    id: null,
    category_name: "empty-1",
    skill_sub_categories: [
      { id: 3, sub_category_name: "DB", skills: [{ id: 10, skill_name: "Oracle" }, { id: 11, skill_name: "SQL Server" }, { id: 12, skill_name: "MySQL" }, { id: 13, skill_name: "PostgreSQL" }, { id: 14, skill_name: "InMemoryDB" }] },
      { id: 4, sub_category_name: "DAT only", skills: [{ id: 30, skill_name: "Ruby" }, { id: 31, skill_name: "NodeJS" }, { id: 32, skill_name: "Typescript" }, { id: 33, skill_name: "GO" }, { id: 34, skill_name: "Solidity" }, { id: 35, skill_name: "PHP" }, { id: 36, skill_name: "ReactJS" }, { id: 37, skill_name: "DataStage (IBM InfoSphere)" }, { id: 38, skill_name: "Job Network Development" }, { id: 39, skill_name: "PowerCenter (Informatica)" }, { id: 40, skill_name: "Window" }, { id: 41, skill_name: "Linux" }, { id: 42, skill_name: "Virtualization" }, { id: 43, skill_name: "HCI" }, { id: 44, skill_name: "Networking" }, { id: 45, skill_name: "Security" }, { id: 46, skill_name: "Automation (RPA and Selenium web driver)" }, { id: 47, skill_name: "VBA" }, { id: 48, skill_name: "Angular" }] },
      { id: 5, sub_category_name: "Framework", skills: [{ id: 49, skill_name: ".Net Framework" }, { id: 50, skill_name: "Silver Light" }, { id: 51, skill_name: "Struts" }, { id: 52, skill_name: "SAP" }, { id: 53, skill_name: "Spring" }, { id: 54, skill_name: "Mybatis" }, { id: 55, skill_name: "Wicket" }, { id: 56, skill_name: "Ionic" }, { id: 57, skill_name: "Junit" }] },
      { id: 6, sub_category_name: "Other Cloud", skills: [{ id: 58, skill_name: "Digital Ocean" }] },
      { id: 7, sub_category_name: "Others", skills: [{ id: 59, skill_name: "React" }, { id: 60, skill_name: "JS" }] }
    ]
  }
];

// Helper function to parse header from right to left
export function parseTechnicalHeader(header: string): {
  skill: string;
  subcategory: string;
  category: string;
  attribute: string;
} {
  // Split by " - "
  const parts = header.split(' - ').map(p => p.trim());
  
  // Default values
  let skill = '';
  let subcategory = '';
  let category = '';
  let attribute = '';
  
  // Start from right side
  // Rightmost part is the attribute (Years, experience, etc.)
  if (parts.length > 0) {
    attribute = parts[parts.length - 1];
  }
  
  // Second from right is the skill name
  if (parts.length > 1) {
    skill = parts[parts.length - 2];
  }
  
  // Third from right is subcategory (if exists)
  if (parts.length > 2) {
    subcategory = parts[parts.length - 3];
  }
  
  // Fourth from right is category (if exists)
  if (parts.length > 3) {
    category = parts[parts.length - 4];
  }
  
  // If the first part is "technical ability", remove it from category
  if (category === 'technical ability' || category === 'Technical Ability') {
    // Generate a random ID and use "empty-{randomId}" format
    const randomId = Math.random().toString(36).substring(2, 10); // Generates a random 8-character string
    category = parts.length > 4 ? parts[parts.length - 5] : `empty-${randomId}`;
  }
  
  return { skill, subcategory, category, attribute };
}

export const HEADERS_IN_ORDER: string[] = [
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

// Generate technical headers dynamically from config
for (const category of TECHNICAL_ABILITY_CONFIG) {
  for (const subCategory of category.skill_sub_categories) {
    for (const skill of subCategory.skills) {
      HEADERS_IN_ORDER.push(`technical ability - ${category.category_name} - ${subCategory.sub_category_name} - ${skill.skill_name} - Years`);
      HEADERS_IN_ORDER.push(`technical ability - ${category.category_name} - ${subCategory.sub_category_name} - ${skill.skill_name} - experience`);
    }
  }
}

function getCellValue(cell: ExcelJS.Cell): string {
  const actualCell = cell.isMerged ? (cell.master || cell) : cell;
  const value = actualCell.value;
  
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (value instanceof Date) return value.toISOString().split('T')[0];
  
  if (typeof value === "object") {
    if ("result" in value) {
      const result = (value as any).result;
      if (result === null || result === undefined) return "";
      if (typeof result === "string") return result.trim();
      if (typeof result === "number") return result.toString();
      return String(result);
    }
    if ("richText" in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((rt: any) => rt.text || "").join("").trim();
    }
    if ("text" in value && (value as any).text) {
      return String((value as any).text).trim();
    }
    if ("error" in value) {
      return "";
    }
  }
  return "";
}

export async function extractEmployeesFromExcel(
  file: File, 
  skill_headers: string[], 
  limit?: number
): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    let targetWorksheet: ExcelJS.Worksheet | null = null;
    const headerRowRange: number[] = [];
    let idColumnIndex = -1;
    let nameColumnIndex = -1;

    // --- PHASE 1: FIND THE BEST SHEET ---
    // Support both English "Original data" and Japanese "元データ" sheet names
    targetWorksheet = workbook.worksheets.find(ws => 
      ws.name.includes("Original data") || ws.name.includes("Original") || ws.name.includes("元データ")
    ) || null;

    // Detect if this is a Japanese-format file
    let isJapaneseFormat = false;
    if (targetWorksheet) {
      // Check if sheet name contains Japanese characters (元データ without English "Original")
      const sheetName = targetWorksheet.name;
      if (sheetName.includes("元データ") && !sheetName.includes("Original data")) {
        isJapaneseFormat = true;
      }
      // Also check if header cells contain Japanese like 名前
      for (let r = 1; r <= 15; r++) {
        const row = targetWorksheet.getRow(r);
        row.eachCell({ includeEmpty: false }, (cell) => {
          const val = getCellValue(cell);
          if (val === '名前') isJapaneseFormat = true;
        });
        if (isJapaneseFormat) break;
      }
    }

    if (!targetWorksheet) {
      for (const worksheet of workbook.worksheets) {
        if (worksheet.name.includes("Scoring") || worksheet.name.includes("Category") || worksheet.name.includes("Master")) continue;
        
        for (let r = 1; r <= 20; r++) {
          const row = worksheet.getRow(r);
          let foundID = -1;
          let foundName = -1;
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            const val = getCellValue(cell);
            const lower = val.toLowerCase();
            if (lower === "id" || lower === "staff id") foundID = colNumber;
            if (lower === "name" || val === "名前") foundName = colNumber;
          });
          if (foundID !== -1 && foundName !== -1) {
            targetWorksheet = worksheet;
            // Check if Japanese format
            row.eachCell({ includeEmpty: false }, (cell) => {
              if (getCellValue(cell) === '名前') isJapaneseFormat = true;
            });
            break;
          }
        }
        if (targetWorksheet) break;
      }
    }

    if (!targetWorksheet) {
      return { success: false, headers: [], employees: [], error: "Could not find a valid data sheet." };
    }

    // --- PHASE 2: DETECT HEADER BLOCK ---
    let anchorRow = -1;
    for (let r = 1; r <= 20; r++) {
      const row = targetWorksheet.getRow(r);
      let foundID = -1;
      let foundName = -1;
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const val = getCellValue(cell);
        const lower = val.toLowerCase();
        if (lower === "id" || lower === "staff id") foundID = colNumber;
        // Support both English "name" and Japanese "名前"
        if (lower === "name" || val === "名前") foundName = colNumber;
      });
      if (foundID !== -1 && foundName !== -1) {
        anchorRow = r;
        idColumnIndex = foundID;
        nameColumnIndex = foundName;
        break;
      }
    }

    if (anchorRow === -1) {
      return { success: false, headers: [], employees: [], error: "Could not find ID and Name columns." };
    }

    const startHeader = Math.max(1, anchorRow - 4);
    const endHeader = anchorRow + 4;
    
    for (let r = startHeader; r <= endHeader; r++) {
      const row = targetWorksheet.getRow(r);
      const rowValues = [];
      row.eachCell({ includeEmpty: false }, (cell) => rowValues.push(getCellValue(cell)));
      
      if (rowValues.length > 0) {
        headerRowRange.push(r);
      }
    }

    // --- PHASE 3: CONSTRUCT DYNAMIC HEADERS ---
    const allHeaders: { name: string; col: number }[] = [];
    const maxColumn = targetWorksheet.columnCount;
    const headerMap = new Map<string, number>();

    const IGNORED_HEADERS = [
      "company - ID",
      "DAT - name",
      "※プルダウン入力 - Name of the commissioning department *Select from the dropdown menu",
      "Rank *Select from the dropdown menu (The dropdown menu will appear once you select a company)",
      "Core personnel *FPT only",
      "Whether or not you have a business trip to Japan",
      // Japanese equivalents
      "会社 - ID",
      "DAT - 名前",
      "※プルダウン入力 - 委託元部署名\n※プルダウン入力",
    ];

    // Additional headers to ignore (checked via .includes for partial matches)
    const IGNORED_HEADER_PARTS = [
      "ランク",
      "Rank *Select",
      "コア人材",
      "Core personnel",
      "日本出張",
      "Whether or not you have a business trip",
      "自動計算",
      "automatic calculation",
      "立場",
      "管理人数",
      "position",
      "management headcount",
    ];
    
    for (let col = 1; col <= maxColumn; col++) {
      const parts: string[] = [];
      for (const rowNum of headerRowRange) {
        const cell = targetWorksheet!.getRow(rowNum).getCell(col);
        let val = getCellValue(cell);
        
        // If Japanese format, translate each header part to English
        if (isJapaneseFormat && val) {
          val = translateHeaderPart(val);
        }
        
        if (val && !parts.includes(val)) {
          parts.push(val);
        }
      }
      
      let headerName = parts.join(" - ");
      if (!headerName) {
        headerName = `Column_${col}`;
      }

      if (headerMap.has(headerName)) {
        const count = headerMap.get(headerName)! + 1;
        headerMap.set(headerName, count);
        headerName = `${headerName}_${count}`;
      } else {
        headerMap.set(headerName, 1);
      }

      // Check if header should be ignored
      const isIgnored = headerName.startsWith("Column_") ||
        IGNORED_HEADERS.includes(headerName) ||
        IGNORED_HEADER_PARTS.some(part => headerName.includes(part));
      
      if (!isIgnored) {
        allHeaders.push({ name: headerName, col });
      }
    }

    const dynamicHeaders = allHeaders.map(h => h.name);
    const finalHeaders = ["ID", "name", ...dynamicHeaders];

    // --- PHASE 4: EXTRACT DATA ---
    const employees: EmployeeRow[] = [];
    const dataStartRow = Math.max(...headerRowRange) + 1;
    const totalRows = targetWorksheet.rowCount;

    // Keep track of previous skill for handling "experience" only headers
    let previousSkill = '';
    let previousSubcategory = '';
    let previousCategory = '';

    for (let r = dataStartRow; r <= totalRows; r++) {
      const row = targetWorksheet.getRow(r);
      const idVal = getCellValue(row.getCell(idColumnIndex));
      const nameVal = getCellValue(row.getCell(nameColumnIndex));

      if (!idVal && !nameVal) continue;
      if (idVal.toLowerCase().includes("total") || nameVal.toLowerCase().includes("total")) break;

      const employeeData: EmployeeRow = {};
      
      for (const headerInfo of allHeaders) {
        const headerName = headerInfo.name;
        const cellValue = getCellValue(row.getCell(headerInfo.col));
        
        // Check if this is a technical header using right-to-left parsing
        const parsed = parseTechnicalHeader(headerName);
        
        // Only process if it looks like a technical skill (has attribute and skill)
        if (parsed.attribute && (parsed.skill || headerName.toLowerCase().includes('experience'))) {
          // If header is just "experience" without skill name, use previous skill
          if (parsed.skill === '' && headerName.toLowerCase().includes('experience')) {
            // This is an experience-only header, map to previous skill
            // We'll handle this by storing the value with the previous skill
            const expKey = `${previousCategory} - ${previousSubcategory} - ${previousSkill} - experience`.trim();
            // Remove extra spaces and dashes
            const cleanKey = expKey.replace(/^ - | - $/g, '').replace(/ - - /g, ' - ');
            if (cleanKey) {
              employeeData[cleanKey] = cellValue;
            }
          } else {
            // Normal header with skill name
            employeeData[headerName] = cellValue;
            
            // Store the current skill for future experience-only headers
            if (parsed.skill) {
              previousSkill = parsed.skill;
              previousSubcategory = parsed.subcategory || '';
              previousCategory = parsed.category || '';
            }
          }
        } else {
          // Non-technical header
          employeeData[headerName] = cellValue;
        }
      }
      
      employeeData["ID"] = idVal;
      employeeData["name"] = nameVal;
      
      employees.push(employeeData);

      // Log first 10 employees
      if (employees.length <= 10) {
        const techKeys = Object.keys(employeeData).filter(key => 
          key.includes('Years') || key.includes('experience')
        );

      }

      if (limit && employees.length >= limit) {
        console.log(`📊 Stopping extraction after ${limit} employees (limit reached)`);
        break;
      }
    }


    return {
      success: true,
      headers: finalHeaders,
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