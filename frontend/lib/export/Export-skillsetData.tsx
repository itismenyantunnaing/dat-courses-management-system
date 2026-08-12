// lib/export/Export-skillsetData.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ExportSkillData {
  employee_data: any[];
  skill_headers: any[];
  skillData: any[];
  devCap_headers: any[];
  devCap_data: any[];
  languageSkill_data: any[];
  managementScores_Data: any[];
  employeeJapaneseLevel_Data?: any[];
  dictionary?: any[];
}

export interface ExportSkillOptions {
  showAdministrator?: boolean;
  showDeveloper?: boolean;
  showTechnicalAbility?: boolean;
  fileName?: string;
  language?: 'eng' | 'japan';
}

type GroupedSkill = {
  skill_id: number;
  skill_name: string;
  sub_category_name: string;
};

// Helper function to translate text
function translateText(text: string, language: 'eng' | 'japan', dictionary: any[]): string {
  if (language === 'eng' || !text) return text;

  const translationMap = new Map<string, string>();
  if (dictionary && Array.isArray(dictionary)) {
    dictionary.forEach((entry: any) => {
      translationMap.set(entry.englishText?.toLowerCase() || '', entry.japaneseText || '');
    });
  }

  const lowerText = text.toLowerCase();
  if (translationMap.has(lowerText)) {
    return translationMap.get(lowerText)!;
  }

  const words = text.split(/\b/);
  const translatedWords = words.map((word) => {
    const trimmed = word.trim();
    if (!trimmed || /^[^\w\s]+$/.test(trimmed)) return word;
    const translated = translationMap.get(trimmed.toLowerCase());
    return translated || word;
  });

  return translatedWords.join('');
}

/**
 * Build the data structure for export
 */
function buildExportData(data: ExportSkillData, options: ExportSkillOptions) {
  const {
    showAdministrator = true,
    showDeveloper = true,
    showTechnicalAbility = true,
    language = 'eng',
  } = options;

  const {
    employee_data,
    skill_headers,
    skillData,
    devCap_headers,
    devCap_data,
    languageSkill_data,
    managementScores_Data,
    employeeJapaneseLevel_Data = [],
    dictionary = []
  } = data;

  const t = (text: string) => translateText(text, language, dictionary);

  // Build Japanese level map
  const japaneseLevelMap = new Map<string, string | null>();
  if (employeeJapaneseLevel_Data) {
    employeeJapaneseLevel_Data.forEach((item: any) => {
      japaneseLevelMap.set(item.employee_id, item.jlptHighestLevel || null);
    });
  }

  // Build maps for quick lookup
  const skillMap = new Map<string, Map<string, { years: number | null; level: string | null }>>();
  if (skillData) {
    skillData.forEach((skill: any) => {
      const employeeId = skill.employee_id || skill.employeeId;
      if (!employeeId) return;

      if (!skillMap.has(employeeId)) {
        skillMap.set(employeeId, new Map());
      }
      const employeeSkillMap = skillMap.get(employeeId)!;
      const skillName = skill.skill_name || skill.skillName;
      employeeSkillMap.set(skillName, {
        years: skill.years_of_experience || skill.yearsOfExperience || 0,
        level: skill.experience_level || skill.experienceLevel || null
      });
    });
  }

  const devCapMap = new Map<string, Map<string, { years: number | null; experience_process: string | null }>>();
  if (devCap_data) {
    devCap_data.forEach((devCap: any) => {
      const employeeId = devCap.employee_id || devCap.employeeId;
      if (!employeeId) return;

      if (!devCapMap.has(employeeId)) {
        devCapMap.set(employeeId, new Map());
      }
      const employeeDevCapMap = devCapMap.get(employeeId)!;
      const typeName = devCap.development_type_name || devCap.developmentTypeName;
      employeeDevCapMap.set(typeName, {
        years: devCap.years_of_experience || devCap.yearsOfExperience || 0,
        experience_process: devCap.process_name || devCap.processName || null
      });
    });
  }

  const languageSkillMap = new Map<string, { language_skill_level: string | number | null; jlpt_highest_level: string | null }>();
  if (languageSkill_data) {
    languageSkill_data.forEach((skill: any) => {
      const employeeId = skill.employee_id || skill.employeeId;
      if (!employeeId) return;

      languageSkillMap.set(employeeId, {
        language_skill_level: skill.language_skill_level || skill.languageSkillLevel || null,
        jlpt_highest_level: skill.jlpt_highest_level || null
      });
    });
  }

  const managementScoresMap = new Map<string, any>();
  if (managementScores_Data) {
    managementScores_Data.forEach((score: any) => {
      const employeeId = score.employee_id || score.employeeId;
      if (employeeId) {
        managementScoresMap.set(employeeId, score);
      }
    });
  }

  // Build dynamic skills list
  const dynamicSkillsList: { id: number; name: string; category: string; sub_category: string }[] = [];
  if (skill_headers && skill_headers.length > 0) {
    skill_headers.forEach((category: any) => {
      const subCategories = category.skillSubCategories || category.skill_sub_categories || [];
      if (Array.isArray(subCategories)) {
        subCategories.forEach((subCategory: any) => {
          const skills = subCategory.skills || [];
          if (Array.isArray(skills)) {
            skills.forEach((skill: any) => {
              const skillName = skill.skillName || skill.skill_name || 'Unnamed Skill';
              dynamicSkillsList.push({
                id: skill.id,
                name: t(skillName),
                category: t(category.categoryName || category.category_name || 'Uncategorized'),
                sub_category: t(subCategory.subCategoryName || subCategory.sub_category_name || ''),
              });
            });
          }
        });
      }
    });
  }

  // Group skills by category
  const dynamicSkillsByCategory: Record<string, GroupedSkill[]> = {};
  if (skill_headers && skill_headers.length > 0) {
    skill_headers.forEach((category: any) => {
      const categoryName = t(category.categoryName || category.category_name || 'Uncategorized');
      dynamicSkillsByCategory[categoryName] = [];
      const subCategories = category.skillSubCategories || category.skill_sub_categories || [];
      if (Array.isArray(subCategories)) {
        subCategories.forEach((subCategory: any) => {
          const skills = subCategory.skills || [];
          if (Array.isArray(skills)) {
            skills.forEach((skill: any) => {
              dynamicSkillsByCategory[categoryName].push({
                skill_id: skill.id,
                skill_name: t(skill.skillName || skill.skill_name || 'Unnamed Skill'),
                sub_category_name: t(subCategory.subCategoryName || subCategory.sub_category_name || ''),
              });
            });
          }
        });
      }
    });
  }

  // Define headers
  const employeeHeaders = [
    { field: "team", header_name: t("Team") },
    { field: "staff_id", header_name: t("ID") },
    { field: "name", header_name: t("Name") },
    { field: "dept", header_name: t("Name of the commissioning department *Select from the dropdown menu") },
    { field: "is_core_personnel", header_name: t("Core personnel *FPT only") },
    { field: "has_japan_business_trip", header_name: t("Whether or not you have a business trip to Japan") },
  ];

  const administratorHeaders = [
    { field: "managementExperienceLevel", header_name: t("Management experience (Levels 1-5)") },
    { field: "qcdScore", header_name: t("QCD (1-4 points)") },
    { field: "reportConsultScore", header_name: t("Reporting, contacting, and consulting (1-4 points)") },
    { field: "educationScore", header_name: t("Education (1-4 points)") },
    { field: "totalLevel", header_name: t("Total (Levels 1-5)") },
  ];

  const languageSkillHeaders = [
    { field: "language_level", header_name: t("Level (Levels 1-5)") },
    { field: "jlpt_nat_score", header_name: t("JLPT/NAT (N1~N5)") },
  ];

  // Calculate total columns
  const empColCount = employeeHeaders.length;
  const adminColCount = showAdministrator ? administratorHeaders.length : 0;
  const langColCount = showDeveloper ? languageSkillHeaders.length : 0;
  const devCapColCount = showDeveloper ? devCap_headers.length * 2 : 0;
  const techColCount = showTechnicalAbility ? dynamicSkillsList.length * 2 : 0;
  const totalCols = empColCount + adminColCount + langColCount + devCapColCount + techColCount;

  // Sort categories
  const sortedCategories = Object.entries(dynamicSkillsByCategory)
    .sort((a, b) => {
      const aMinId = Math.min(...a[1].map((s) => s.skill_id));
      const bMinId = Math.min(...b[1].map((s) => s.skill_id));
      return aMinId - bMinId;
    });

  // Build header rows
  const row1: any[] = new Array(totalCols).fill('');
  const row2: any[] = new Array(totalCols).fill('');
  const row3: any[] = new Array(totalCols).fill('');
  const row4: any[] = new Array(totalCols).fill('');
  const row5: any[] = new Array(totalCols).fill('');
  const merges: { top: number; left: number; bottom: number; right: number }[] = [];

  // Track section boundaries for coloring
  const sectionBoundaries: { start: number; end: number; section: string }[] = [];

  // --- Employee headers ---
  const empStart = 0;
  const empEnd = empColCount - 1;
  sectionBoundaries.push({ start: empStart, end: empEnd, section: 'employee' });

  for (let i = 0; i < empColCount; i++) {
    row1[i] = employeeHeaders[i].header_name;
    merges.push({ top: 0, left: i, bottom: 4, right: i });
  }

  let col = empColCount;

  // --- Administrator section ---
  let adminStart = -1;
  let adminEnd = -1;
  if (showAdministrator) {
    adminStart = col;
    adminEnd = col + adminColCount - 1;
    sectionBoundaries.push({ start: adminStart, end: adminEnd, section: 'administrator' });

    row1[adminStart] = t("Administrator");
    merges.push({ top: 0, left: adminStart, bottom: 0, right: adminStart + 4 });

    row2[adminStart] = administratorHeaders[0].header_name;
    merges.push({ top: 1, left: adminStart, bottom: 4, right: adminStart });

    row2[adminStart + 1] = t("management ability");
    merges.push({ top: 1, left: adminStart + 1, bottom: 1, right: adminStart + 4 });

    for (let i = 1; i < administratorHeaders.length; i++) {
      row3[adminStart + i] = administratorHeaders[i].header_name;
      merges.push({ top: 2, left: adminStart + i, bottom: 4, right: adminStart + i });
    }

    col += adminColCount;
  }

  // --- Developer section ---
  let devStart = -1;
  let devEnd = -1;
  if (showDeveloper) {
    devStart = col;
    const devTotalCols = langColCount + devCapColCount;
    devEnd = col + devTotalCols - 1;
    sectionBoundaries.push({ start: devStart, end: devEnd, section: 'developer' });

    row1[devStart] = t("Developer (DIR and YSX tasks only)");
    merges.push({ top: 0, left: devStart, bottom: 0, right: devStart + devTotalCols - 1 });

    row2[devStart] = t("language skills");
    merges.push({ top: 1, left: devStart, bottom: 1, right: devStart + 1 });

    for (let i = 0; i < languageSkillHeaders.length; i++) {
      row3[devStart + i] = languageSkillHeaders[i].header_name;
      merges.push({ top: 2, left: devStart + i, bottom: 4, right: devStart + i });
    }

    if (devCap_headers.length > 0) {
      const devCapStart = devStart + langColCount;
      row2[devCapStart] = t("Development capabilities");
      merges.push({ top: 1, left: devCapStart, bottom: 1, right: devCapStart + devCapColCount - 1 });

      devCap_headers.forEach((header: any, index: number) => {
        const headerCol = devCapStart + index * 2;
        const typeName = header.developmentTypeName || header.development_type_name || '';
        row3[headerCol] = t(typeName);
        merges.push({ top: 2, left: headerCol, bottom: 3, right: headerCol + 1 });
      });

      devCap_headers.forEach((_: any, index: number) => {
        const headerCol = devCapStart + index * 2;
        row5[headerCol] = t("Years");
        row5[headerCol + 1] = t("Experience");
      });
    }

    col += devTotalCols;
  }

  // --- Technical Ability section ---
  let techStart = -1;
  let techEnd = -1;
  if (showTechnicalAbility) {
    techStart = col;
    techEnd = col + techColCount - 1;
    if (techColCount > 0) {
      sectionBoundaries.push({ start: techStart, end: techEnd, section: 'technical' });
    }

    if (techColCount > 0) {
      row1[techStart] = t("Technical Ability");
      merges.push({ top: 0, left: techStart, bottom: 0, right: techStart + techColCount - 1 });
    } else {
      row1[techStart] = t("Technical Ability");
    }

    let techCol = techStart;

    sortedCategories.forEach(([categoryName, skills]) => {
      const sortedSkills = [...skills].sort((a, b) => a.skill_id - b.skill_id);
      const isCategoryEmpty = categoryName.includes('empty');

      if (isCategoryEmpty) {
        const subCategoryMap: Record<string, { count: number; skills: GroupedSkill[] }> = {};
        sortedSkills.forEach((skill) => {
          const subName = skill.sub_category_name.includes('empty') ? '' : skill.sub_category_name;
          if (!subCategoryMap[subName]) {
            subCategoryMap[subName] = { count: 0, skills: [] };
          }
          subCategoryMap[subName].count += 2;
          subCategoryMap[subName].skills.push(skill);
        });

        const sortedSubs = Object.entries(subCategoryMap)
          .sort((a, b) => {
            const aMinId = Math.min(...a[1].skills.map((s: GroupedSkill) => s.skill_id));
            const bMinId = Math.min(...b[1].skills.map((s: GroupedSkill) => s.skill_id));
            return aMinId - bMinId;
          });

        sortedSubs.forEach(([subCategoryName, { count, skills: subSkills }]) => {
          const sortedSubSkills = [...subSkills].sort((a, b) => a.skill_id - b.skill_id);

          if (isCategoryEmpty && subCategoryName === '') {
            sortedSubSkills.forEach((skill) => {
              row2[techCol] = skill.skill_name;
              merges.push({ top: 1, left: techCol, bottom: 3, right: techCol + 1 });
              row5[techCol] = t("Years");
              row5[techCol + 1] = t("Experience");
              techCol += 2;
            });
          } else {
            row2[techCol] = subCategoryName || t("Uncategorized");
            merges.push({ top: 1, left: techCol, bottom: 2, right: techCol + count - 1 });
            sortedSubSkills.forEach((skill) => {
              row4[techCol] = skill.skill_name;
              merges.push({ top: 3, left: techCol, bottom: 3, right: techCol + 1 });
              row5[techCol] = t("Years");
              row5[techCol + 1] = t("Experience");
              techCol += 2;
            });
          }
        });
      } else {
        const hasOnlyEmptySubCategories = sortedSkills.every(
          (skill) => skill.sub_category_name.includes('empty')
        );

        if (hasOnlyEmptySubCategories) {
          sortedSkills.forEach((skill) => {
            row2[techCol] = skill.skill_name;
            merges.push({ top: 1, left: techCol, bottom: 3, right: techCol + 1 });
            row5[techCol] = t("Years");
            row5[techCol + 1] = t("Experience");
            techCol += 2;
          });
        } else {
          row2[techCol] = categoryName;
          merges.push({ top: 1, left: techCol, bottom: 1, right: techCol + sortedSkills.length * 2 - 1 });

          const subCategoryMap: Record<string, { count: number; skills: GroupedSkill[] }> = {};
          sortedSkills.forEach((skill) => {
            const subName = skill.sub_category_name.includes('empty') ? '' : skill.sub_category_name;
            if (!subCategoryMap[subName]) {
              subCategoryMap[subName] = { count: 0, skills: [] };
            }
            subCategoryMap[subName].count += 2;
            subCategoryMap[subName].skills.push(skill);
          });

          let subCol = techCol;
          Object.entries(subCategoryMap)
            .sort((a, b) => {
              const aMinId = Math.min(...a[1].skills.map((s: GroupedSkill) => s.skill_id));
              const bMinId = Math.min(...b[1].skills.map((s: GroupedSkill) => s.skill_id));
              return aMinId - bMinId;
            })
            .forEach(([subCategoryName, { count }]) => {
              row3[subCol] = subCategoryName;
              merges.push({ top: 2, left: subCol, bottom: 2, right: subCol + count - 1 });
              subCol += count;
            });

          sortedSkills.forEach((skill) => {
            row4[techCol] = skill.skill_name;
            merges.push({ top: 3, left: techCol, bottom: 3, right: techCol + 1 });
            row5[techCol] = t("Years");
            row5[techCol + 1] = t("Experience");
            techCol += 2;
          });
        }
      }
    });
  }

  const headerRows = [row1, row2, row3, row4, row5];

  // Build data rows
  const dataRows: any[][] = [];
  employee_data.forEach((employee: any) => {
    const row: any[] = [];

    // Employee data
    row.push(employee.team || '-');
    row.push(employee.id || '-');
    row.push(employee.name || '-');
    row.push(employee.dept_dir || '-');
    row.push(employee.is_core_personnel ? 'Yes' : 'No');
    row.push(employee.has_japan_business_trip ? 'Yes' : 'No');

    // Administrator data
    if (showAdministrator) {
      const score = managementScoresMap.get(employee.id);
      administratorHeaders.forEach((header) => {
        const value = score?.[header.field];
        row.push(value !== undefined && value !== null ? value : '-');
      });
    }

    // Developer data
    if (showDeveloper) {
      const langSkill = languageSkillMap.get(employee.id);
      const langLevel = langSkill?.language_skill_level;
      row.push(langLevel !== null && langLevel !== undefined ? `${langLevel}` : '-');
      const jlptLevel = japaneseLevelMap.get(employee.id) || langSkill?.jlpt_highest_level;
      row.push(jlptLevel || '-');

      devCap_headers.forEach((header: any) => {
        const typeName = header.developmentTypeName || header.development_type_name;
        const devCapData = devCapMap.get(employee.id)?.get(typeName);
        row.push(devCapData?.years || '-');
        row.push(devCapData?.experience_process || '-');
      });
    }

    // Technical Skills data
    if (showTechnicalAbility) {
      const employeeSkills = skillMap.get(employee.id) || new Map();
      const sortedSkills = [...dynamicSkillsList].sort((a, b) => a.id - b.id);
      sortedSkills.forEach((skill) => {
        const sd = employeeSkills.get(skill.name);
        row.push(sd?.years || '-');
        row.push(sd?.level || '-');
      });
    }

    dataRows.push(row);
  });

  return {
    headerRows,
    dataRows,
    merges,
    totalCols,
    sectionBoundaries,
    employeeHeaders,
    administratorHeaders,
    languageSkillHeaders,
    dynamicSkillsList,
    dynamicSkillsByCategory,
    devCap_headers,
    showAdministrator,
    showDeveloper,
    showTechnicalAbility
  };
}

// =======================================================
// 🎨 UPDATED COLOR DEFINITIONS BASED ON YOUR IMAGE
// =======================================================
const SECTION_COLORS = {
  employee: {
    // Colors for HEADER ROWS only
    header: {
      row1: 'FF4179e8', // Dark Blue
      row2: 'FF4179e8',
      row3: 'FF4179e8',
      row4: 'FF4179e8',
      row5: 'FF4179e8',
    },
    // Colors for DATA ROWS (Keep your original alternating colors)
    data: {
      even: 'FFEFF6FB', // Original Almost White Blue
      odd: 'FFFFFFFF',  // White
    },
    totalColumn: null // No yellow in employee
  },
  administrator: {
    header: {
      row1: 'FF9df2f1', // Cyan
      row2: 'FF9df2f1',
      row3: 'FF9df2f1',
      row4: 'FF9df2f1',
      row5: 'FF9df2f1',
    },
    data: {
      even: 'FFF2F6EE', // Original Almost White Green
      odd: 'FFFFFFFF',  // White
    },
    totalColumn: 'FFFFEB9C' // 👈 Yellow for the Total column
  },
  developer: {
    header: {
      row1: 'FF9df2f1', // Cyan
      row2: 'FF9df2f1',
      row3: 'FF9df2f1',
      row4: 'FF9df2f1',
      row5: 'FF9df2f1',
    },
    data: {
      even: 'FFEAF5F7', // Original Almost White Teal
      odd: 'FFFFFFFF',  // White
    },
    totalColumn: null
  },
  technical: {
    header: {
      row1: 'FFf6fccf', // Pale Yellow/Cream
      row2: 'FFf6fccf',
      row3: 'FFf6fccf',
      row4: 'FFf6fccf',
      row5: 'FFf6fccf',
    },
    data: {
      even: 'FFFCE8EA', // Original Pale Pink (or leave this as FFFFFF if you want pure white)
      odd: 'FFFFFFFF',  // White
    },
    totalColumn: null
  }
};
// =======================================================

/**
 * Get the appropriate color for a cell based on its section and row
 */
function getCellColor(section: string, rowIndex: number, colIdx: number, isDataRow: boolean = false): string {
  const colors = SECTION_COLORS[section as keyof typeof SECTION_COLORS] || SECTION_COLORS.employee;

  // 👇 HANDLE DATA ROWS (Keep original alternating colors here)
  if (isDataRow) {
    return colors.data.even; // Since 'isEven' logic is handled in the main function, this returns the base even color.
  }

  // 👇 HANDLE HEADER ROWS
  // Special Rule: Yellow "Total" column in Administrator headers
  if (section === 'administrator' && rowIndex === 2 && colIdx === 4) {
    return colors.totalColumn || colors.header.row3;
  }

  switch (rowIndex) {
    case 0: return colors.header.row1;
    case 1: return colors.header.row2;
    case 2: return colors.header.row3;
    case 3: return colors.header.row4;
    case 4: return colors.header.row5;
    default: return colors.header.row1;
  }
}
/**
 * Get the text color (white for dark backgrounds, black for light backgrounds)
 */
function getTextColor(section: string, rowIndex: number): string {
  // Handle heavy blue, green, and teal top rows (white text)
  if (rowIndex === 0) {
    return 'FFFFFFFF'; // White
  }

  // Handle deep teal main developer header
  if (section === 'developer' && rowIndex === 0) {
    return 'FFFFFFFF'; // White
  }

  // All other rows are light/pastel, use black text
  return 'FF000000'; // Black
}

/**
 * Export skills data to Excel format with section-specific coloring
 */
/**
 * Helper: Read a cell value from ExcelJS (handles merged cells, rich text, formulas, etc.)
 */
function getTemplateCellValue(cell: ExcelJS.Cell): string {
  const actualCell = cell.isMerged ? (cell.master || cell) : cell;
  const value = actualCell.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray((value as any).richText)) {
      return (value as any).richText.map((rt: any) => rt.text || '').join('').trim();
    }
    if ('result' in value) {
      const result = (value as any).result;
      if (result === null || result === undefined) return '';
      return String(result);
    }
    if ('text' in value) return String((value as any).text).trim();
  }
  return String(value);
}

/**
 * Build a column-header map from the template's header rows (1-9).
 * Returns: Map<columnIndex, compositeHeaderKey>
 * e.g. col 24 => "technical ability | Programming language | Host club | assembler | Years"
 */
function buildTemplateColumnMap(worksheet: ExcelJS.Worksheet): Map<number, string> {
  const columnMap = new Map<number, string>();
  const maxCol = worksheet.columnCount;

  for (let c = 1; c <= maxCol; c++) {
    const headerParts: string[] = [];
    for (let r = 1; r <= 9; r++) {
      const val = getTemplateCellValue(worksheet.getRow(r).getCell(c));
      if (val && !headerParts.includes(val)) {
        headerParts.push(val);
      }
    }
    const headerKey = headerParts.join(' | ');
    if (headerKey) {
      columnMap.set(c, headerKey);
    }
  }

  return columnMap;
}

/**
 * Normalize a header key for fuzzy matching (lowercase, trim, collapse whitespace)
 */
function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Export skills data to Excel by loading the template and writing data directly into it.
 * This preserves ALL template formatting (colors, fonts, merges, borders, column widths).
 */
export async function exportSkillsToExcel(
  data: ExportSkillData,
  options?: ExportSkillOptions
): Promise<void> {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const {
    employee_data,
    skill_headers,
    skillData,
    devCap_headers,
    devCap_data,
    languageSkill_data,
    managementScores_Data,
    employeeJapaneseLevel_Data = [],
    dictionary = []
  } = data;

  const t = (text: string) => translateText(text, language, dictionary);

  // ===== STEP 1: Load the template file =====
  const templateResponse = await fetch('/templates/skills_template.xlsx');
  if (!templateResponse.ok) {
    throw new Error('Failed to load skills template file. Please ensure skills_template.xlsx exists in public/templates/');
  }
  const templateBuffer = await templateResponse.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);

  const worksheet = workbook.getWorksheet('Skills');
  if (!worksheet) {
    throw new Error('Template does not contain a "Skills" sheet.');
  }

  // ===== STEP 2: Build column mapping from template headers =====
  const templateColumnMap = buildTemplateColumnMap(worksheet);

  // ===== STEP 3: Build lookup maps for data =====
  // Skill map: employeeId -> Map<skillName, { years, level }>
  const skillMap = new Map<string, Map<string, { years: number | null; level: string | null }>>();
  if (skillData) {
    skillData.forEach((skill: any) => {
      const employeeId = skill.employee_id || skill.employeeId;
      if (!employeeId) return;
      if (!skillMap.has(employeeId)) skillMap.set(employeeId, new Map());
      const skillName = skill.skill_name || skill.skillName;
      skillMap.get(employeeId)!.set(skillName, {
        years: skill.years_of_experience || skill.yearsOfExperience || 0,
        level: skill.experience_level || skill.experienceLevel || null
      });
    });
  }

  // DevCap map: employeeId -> Map<typeName, { years, experience_process }>
  const devCapMap = new Map<string, Map<string, { years: number | null; experience_process: string | null }>>();
  if (devCap_data) {
    devCap_data.forEach((devCap: any) => {
      const employeeId = devCap.employee_id || devCap.employeeId;
      if (!employeeId) return;
      if (!devCapMap.has(employeeId)) devCapMap.set(employeeId, new Map());
      const typeName = devCap.development_type_name || devCap.developmentTypeName;
      devCapMap.get(employeeId)!.set(typeName, {
        years: devCap.years_of_experience || devCap.yearsOfExperience || 0,
        experience_process: devCap.process_name || devCap.processName || null
      });
    });
  }

  // Language skill map: employeeId -> { language_skill_level, jlpt_highest_level }
  const languageSkillMap = new Map<string, { language_skill_level: string | number | null; jlpt_highest_level: string | null }>();
  if (languageSkill_data) {
    languageSkill_data.forEach((skill: any) => {
      const employeeId = skill.employee_id || skill.employeeId;
      if (!employeeId) return;
      languageSkillMap.set(employeeId, {
        language_skill_level: skill.language_skill_level || skill.languageSkillLevel || null,
        jlpt_highest_level: skill.jlpt_highest_level || null
      });
    });
  }

  // Management scores map: employeeId -> score object
  const managementScoresMap = new Map<string, any>();
  if (managementScores_Data) {
    managementScores_Data.forEach((score: any) => {
      const employeeId = score.employee_id || score.employeeId;
      if (employeeId) managementScoresMap.set(employeeId, score);
    });
  }

  // Japanese level map: employeeId -> level
  const japaneseLevelMap = new Map<string, string | null>();
  if (employeeJapaneseLevel_Data) {
    employeeJapaneseLevel_Data.forEach((item: any) => {
      japaneseLevelMap.set(item.employee_id, item.jlptHighestLevel || null);
    });
  }

  // Build dynamic skill name list from headers (in the original English names for matching)
  const dynamicSkillsListOriginal: { name: string; category: string; sub_category: string }[] = [];
  if (skill_headers && skill_headers.length > 0) {
    skill_headers.forEach((category: any) => {
      const subCategories = category.skillSubCategories || category.skill_sub_categories || [];
      if (Array.isArray(subCategories)) {
        subCategories.forEach((subCategory: any) => {
          const skills = subCategory.skills || [];
          if (Array.isArray(skills)) {
            skills.forEach((skill: any) => {
              dynamicSkillsListOriginal.push({
                name: skill.skillName || skill.skill_name || '',
                category: category.categoryName || category.category_name || '',
                sub_category: subCategory.subCategoryName || subCategory.sub_category_name || '',
              });
            });
          }
        });
      }
    });
  }

  // ===== STEP 4: Create a reverse lookup: normalizedTemplateHeader -> columnIndex =====
  // This maps each template column header to a function that extracts the right data
  const normalizedColumnMap = new Map<string, number>();
  templateColumnMap.forEach((headerKey, colIndex) => {
    normalizedColumnMap.set(normalizeHeaderKey(headerKey), colIndex);
  });

  // ===== STEP 5: Build column-to-data resolver =====
  // For each template column, determine what data field to write

  type DataResolver = (employee: any) => string | number;
  const columnResolvers = new Map<number, DataResolver>();

  templateColumnMap.forEach((headerKey, colIndex) => {
    const normKey = normalizeHeaderKey(headerKey);

    // --- Employee fields ---
    if (normKey.includes('team') && !normKey.includes('technical') && !normKey.includes('ability')) {
      columnResolvers.set(colIndex, (emp) => emp.team || '');
      return;
    }
    if (normKey === 'company | id' || normKey === 'id') {
      columnResolvers.set(colIndex, (emp) => emp.id || '');
      return;
    }
    if (normKey === 'dat | name' || normKey === 'name') {
      columnResolvers.set(colIndex, (emp) => emp.name || '');
      return;
    }
    if (normKey.includes('commissioning department') || normKey.includes('※プルダウン入力')) {
      columnResolvers.set(colIndex, (emp) => emp.dept_dir || emp.dept_dat || '');
      return;
    }
    if (normKey.includes('core personnel')) {
      columnResolvers.set(colIndex, (emp) => emp.is_core_personnel ? 'Yes' : '');
      return;
    }
    if (normKey.includes('business trip to japan') || normKey.includes('日本出張')) {
      columnResolvers.set(colIndex, (emp) => emp.has_japan_business_trip ? 'Yes' : '');
      return;
    }
    if (normKey.includes('rank') && normKey.includes('dropdown')) {
      // Skip the Rank column — no data mapped
      return;
    }

    // --- Administrator fields ---
    if (normKey.includes('administrator') || normKey.includes('management')) {
      if (normKey.includes('management experience')) {
        columnResolvers.set(colIndex, (emp) => {
          const score = managementScoresMap.get(emp.id);
          const val = score?.managementExperienceLevel ?? score?.management_experience_level;
          return val !== undefined && val !== null ? val : '';
        });
        return;
      }
      if (normKey.includes('qcd')) {
        columnResolvers.set(colIndex, (emp) => {
          const score = managementScoresMap.get(emp.id);
          const val = score?.qcdScore ?? score?.qcd_score;
          return val !== undefined && val !== null ? val : '';
        });
        return;
      }
      if (normKey.includes('reporting') || normKey.includes('contacting') || normKey.includes('consulting')) {
        columnResolvers.set(colIndex, (emp) => {
          const score = managementScoresMap.get(emp.id);
          const val = score?.reportConsultScore ?? score?.report_consult_score;
          return val !== undefined && val !== null ? val : '';
        });
        return;
      }
      if (normKey.includes('education') && normKey.includes('1-4')) {
        columnResolvers.set(colIndex, (emp) => {
          const score = managementScoresMap.get(emp.id);
          const val = score?.educationScore ?? score?.education_score;
          return val !== undefined && val !== null ? val : '';
        });
        return;
      }
      if (normKey.includes('total') && normKey.includes('level')) {
        columnResolvers.set(colIndex, (emp) => {
          const score = managementScoresMap.get(emp.id);
          const val = score?.totalLevel ?? score?.total_level;
          return val !== undefined && val !== null ? val : '';
        });
        return;
      }
    }

    // --- Developer: Language skills ---
    if (normKey.includes('language skills') || normKey.includes('developer')) {
      if (normKey.includes('level') && normKey.includes('1-5') && !normKey.includes('development')) {
        columnResolvers.set(colIndex, (emp) => {
          const langSkill = languageSkillMap.get(emp.id);
          const val = langSkill?.language_skill_level;
          return val !== null && val !== undefined ? `${val}` : '';
        });
        return;
      }
      if (normKey.includes('jlpt') || normKey.includes('nat')) {
        columnResolvers.set(colIndex, (emp) => {
          const jlptLevel = japaneseLevelMap.get(emp.id) || languageSkillMap.get(emp.id)?.jlpt_highest_level;
          return jlptLevel || '';
        });
        return;
      }

      // --- Developer: Development capabilities ---
      if (normKey.includes('development capabilities') || normKey.includes('host') || normKey.includes('batch') || normKey.includes('decentralized') || normKey.includes('distributed')) {
        // Extract the dev type name from the header
        // Headers like: "Developer (DIR...) | Development capabilities | Host/Online | Years of experience"
        const parts = headerKey.split(' | ').map(p => p.trim());
        let devTypeName = '';
        let isYears = false;
        let isProcess = false;

        for (const part of parts) {
          const lower = part.toLowerCase();
          if (lower.includes('years of experience')) { isYears = true; }
          if (lower.includes('experience process')) { isProcess = true; }
          if (lower.includes('host/online')) devTypeName = 'Host/Online';
          if (lower.includes('host/batch')) devTypeName = 'Host/Batch';
          if (lower.includes('decentralized/online')) devTypeName = 'Decentralized/Online';
          if (lower.includes('distributed/batch')) devTypeName = 'Distributed/Batch';
        }

        if (devTypeName && (isYears || isProcess)) {
          columnResolvers.set(colIndex, (emp) => {
            const devCapData = devCapMap.get(emp.id)?.get(devTypeName);
            if (isYears) return devCapData?.years || '';
            if (isProcess) return devCapData?.experience_process || '';
            return '';
          });
          return;
        }
      }
    }

    // --- Technical ability skills ---
    // Headers like: "technical ability | Programming language | Host club | assembler | Years"
    // Or: "*DAT only | Ruby | Years"
    // Or: "Framework | .Net Framework | Years"
    // Or: "Window | Years" / "experience"
    {
      const parts = headerKey.split(' | ').map(p => p.trim());
      const lastPart = parts[parts.length - 1]?.toLowerCase() || '';
      const isYearsCol = lastPart.includes('years') || lastPart === 'years';
      const isExpCol = lastPart.includes('experience') || lastPart === 'experience';

      if (isYearsCol || isExpCol) {
        // Try to find the skill name from parts (second-to-last typically)
        let skillName = '';

        if (parts.length >= 5) {
          // "technical ability | Category | SubCategory | SkillName | Years/experience"
          skillName = parts[3];
        } else if (parts.length === 4) {
          // "technical ability | SubCategory | SkillName | Years/experience"
          // or "*DAT only | SkillName | Years/experience" (with extra part)
          skillName = parts[2];
        } else if (parts.length === 3) {
          // "SubCategory | SkillName | Years/experience"
          // or "*DAT only | Ruby | Years"
          skillName = parts[1];
        } else if (parts.length === 2) {
          // "SkillName | Years" (e.g. "Window | Years")
          skillName = parts[0];
        } else if (parts.length === 1 && isExpCol) {
          // standalone "experience" column — paired with previous column's skill
          // We'll handle this via a second pass below
          skillName = '';
        }

        if (skillName) {
          // Match against dynamicSkillsListOriginal by skill name
          const matchedSkill = dynamicSkillsListOriginal.find(s =>
            normalizeHeaderKey(s.name) === normalizeHeaderKey(skillName)
          );

          if (matchedSkill) {
            columnResolvers.set(colIndex, (emp) => {
              const employeeSkills = skillMap.get(emp.id);
              const sd = employeeSkills?.get(matchedSkill.name);
              if (isYearsCol) return sd?.years || '';
              if (isExpCol) return sd?.level || '';
              return '';
            });
            return;
          }
        }
      }
    }
  });

  // ===== STEP 5b: Handle standalone "experience" columns =====
  // Some columns only have "experience" as header (no skill name).
  // These are paired with the immediately preceding "Years" column's skill.
  const sortedColIndices = Array.from(templateColumnMap.keys()).sort((a, b) => a - b);
  for (let i = 0; i < sortedColIndices.length; i++) {
    const colIndex = sortedColIndices[i];
    if (columnResolvers.has(colIndex)) continue; // Already resolved

    const headerKey = templateColumnMap.get(colIndex) || '';
    const normKey = normalizeHeaderKey(headerKey);

    if (normKey === 'experience' || normKey === 'Experience') {
      // Find the previous column's resolver and extract the skill name
      const prevColIndex = sortedColIndices[i - 1];
      if (prevColIndex !== undefined) {
        const prevHeader = templateColumnMap.get(prevColIndex) || '';
        const prevParts = prevHeader.split(' | ').map(p => p.trim());

        // The skill name is in the first part (e.g. "Window | Years" => "Window")
        let skillName = '';
        if (prevParts.length >= 2) {
          // Second to last part before "Years"
          const lastPrev = prevParts[prevParts.length - 1]?.toLowerCase();
          if (lastPrev?.includes('years')) {
            skillName = prevParts.length >= 3 ? prevParts[prevParts.length - 2] : prevParts[0];
          }
        }

        if (skillName) {
          const matchedSkill = dynamicSkillsListOriginal.find(s =>
            normalizeHeaderKey(s.name) === normalizeHeaderKey(skillName)
          );

          if (matchedSkill) {
            columnResolvers.set(colIndex, (emp) => {
              const employeeSkills = skillMap.get(emp.id);
              const sd = employeeSkills?.get(matchedSkill.name);
              return sd?.level || '';
            });
          }
        }
      }
    }
  }

  // ===== STEP 6: Write employee data into template rows =====
  const DATA_START_ROW = 10; // Data starts at row 10 in the template

  employee_data.forEach((employee: any, empIndex: number) => {
    const rowNumber = DATA_START_ROW + empIndex;
    const row = worksheet.getRow(rowNumber);

    columnResolvers.forEach((resolver, colIndex) => {
      const value = resolver(employee);
      const cell = row.getCell(colIndex);

      // Write value — only set if there's actual data
      if (value !== '' && value !== null && value !== undefined) {
        cell.value = value;
      }
    });

    row.commit();
  });

  // ===== STEP 7: Generate and download the file =====
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `${fileName}${language === 'japan' ? '_JP' : '_EN'}.xlsx`);

  console.log(`✅ Skills exported to template successfully with ${employee_data.length} employees`);
}

// ===== CSV EXPORT =====
export async function exportSkillsToCSV(
  data: ExportSkillData,
  options?: ExportSkillOptions
): Promise<void> {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const { headerRows, dataRows } = buildExportData(data, { ...options, language });
  const allRows = [...headerRows, ...dataRows];

  let csvContent = '';
  allRows.forEach((row) => {
    const escapedRow = row.map(cell => {
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csvContent += escapedRow.join(',') + '\n';
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}${language === 'japan' ? '_JP' : '_EN'}.csv`);
}

// ===== PDF EXPORT =====
export async function exportSkillsToPDF(
  data: ExportSkillData,
  options?: ExportSkillOptions
): Promise<void> {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const { headerRows, dataRows, dynamicSkillsList, totalCols } = buildExportData(data, { ...options, language });

  // Build flat headers for PDF
  const flatHeaders: string[] = [];
  for (let i = 0; i < totalCols; i++) {
    let headerParts: string[] = [];
    for (let rowIdx = 0; rowIdx < headerRows.length; rowIdx++) {
      const cellValue = headerRows[rowIdx]?.[i];
      if (cellValue && cellValue.toString().trim()) {
        headerParts.push(cellValue.toString().trim());
      }
    }
    if (headerParts.length > 0) {
      const uniqueParts = headerParts.filter((part, index) =>
        headerParts.indexOf(part) === index
      );
      flatHeaders.push(uniqueParts.join(' - '));
    } else {
      flatHeaders.push(`Column ${i + 1}`);
    }
  }

  const totalColumns = flatHeaders.length;

  if (totalColumns > 15) {
    const shouldContinue = confirm(
      `⚠️ The skills report has ${totalColumns} columns, which may be too wide for PDF.\n\n` +
      `PDF export is best suited for smaller datasets.\n` +
      `For full data export, please use Excel or CSV format.\n\n` +
      `Do you want to continue with PDF export?`
    );
    if (!shouldContinue) {
      throw new Error('PDF export cancelled by user');
    }
  }

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.setFontSize(16);
  const title = language === 'japan' ? 'スキルレポート' : 'Skills Report';
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Employees: ${dataRows.length}`, 14, 40);
  doc.text(`Total Skills: ${dynamicSkillsList?.length || 0}`, 14, 50);
  doc.text(`Total Columns: ${totalColumns}`, 14, 60);

  autoTable(doc, {
    head: [flatHeaders],
    body: dataRows,
    startY: 70,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: Math.min(8, Math.max(5, 12 - Math.floor(totalColumns / 5))),
      halign: 'center'
    },
    styles: {
      fontSize: Math.min(7, Math.max(5, 11 - Math.floor(totalColumns / 5))),
      cellPadding: 1.5,
      overflow: 'linebreak'
    },
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

  doc.save(`${fileName}${language === 'japan' ? '_JP' : '_EN'}.pdf`);
}