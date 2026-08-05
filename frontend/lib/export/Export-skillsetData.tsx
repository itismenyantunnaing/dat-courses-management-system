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
    { field: "rank", header_name: t("Rank *Select from the dropdown menu") },
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
    row.push(employee.rank || '-');
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
export async function exportSkillsToExcel(
  data: ExportSkillData,
  options?: ExportSkillOptions
): Promise<void> {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const { headerRows, dataRows, merges, totalCols, sectionBoundaries } = buildExportData(data, { ...options, language });
  const allRows = [...headerRows, ...dataRows];
  const headerRowsCount = headerRows.length;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Employee Management System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Skills Report', {
    properties: { tabColor: { argb: 'FF4472C4' } }
  });

  // Add header rows with section-specific styling
  headerRows.forEach((rowData, rowIndex) => {
    const row = worksheet.addRow(rowData);
    row.height = rowIndex === 0 ? 32 : rowIndex < 4 ? 28 : 24;

    row.eachCell((cell, colNumber) => {
      const colIdx = colNumber - 1;

      // Determine which section this cell belongs to
      let section = 'employee';
      for (const boundary of sectionBoundaries) {
        if (colIdx >= boundary.start && colIdx <= boundary.end) {
          section = boundary.section;
          break;
        }
      }

      const bgColor = getCellColor(section, rowIndex, colIdx, false);
      const textColor = getTextColor(section, rowIndex);
      const isMainHeader = rowIndex === 0;
      const isSubHeader = rowIndex === 1 || rowIndex === 2;

      cell.font = {
        name: 'Arial',
        size: isMainHeader ? 11 : isSubHeader ? 10 : 9,
        bold: true,
        color: { argb: textColor }
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
  });

    // Add data rows (Pure White for all rows)
  dataRows.forEach((rowData, rowIndex) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;

    row.eachCell((cell, colNumber) => {
      const colIdx = colNumber - 1;

      // Determine which section this cell belongs to
      let section = 'employee';
      for (const boundary of sectionBoundaries) {
        if (colIdx >= boundary.start && colIdx <= boundary.end) {
          section = boundary.section;
          break;
        }
      }
      
      // 👈 FORCE PURE WHITE FOR ALL DATA ROWS
      const bgColor = 'FFFFFFFF'; 

      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: typeof cell.value === 'number' ? 'center' : 'left',
        wrapText: true
      };

      // Always apply the white fill
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
      };
    });
  });

  // Apply merges
  merges.forEach((merge) => {
    try {
      worksheet.mergeCells(
        merge.top + 1,
        merge.left + 1,
        merge.bottom + 1,
        merge.right + 1
      );
    } catch (e) {
      // Skip if merge fails
    }
  });

  // Set column widths
  for (let i = 0; i < totalCols; i++) {
    let maxLength = 12;
    for (let j = 0; j < Math.min(allRows.length, 100); j++) {
      const cell = allRows[j]?.[i];
      if (cell !== undefined && cell !== null) {
        const cellLength = String(cell).length;
        if (cellLength > maxLength) {
          maxLength = Math.min(cellLength, 60);
        }
      }
    }
    worksheet.getColumn(i + 1).width = Math.max(maxLength + 3, 12);
  }

  // Freeze header rows
  worksheet.views = [{ state: 'frozen', ySplit: headerRowsCount }];

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `${fileName}${language === 'japan' ? '_JP' : '_EN'}.xlsx`);

  console.log(`✅ Skills exported successfully with ${dataRows.length} employees`);
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