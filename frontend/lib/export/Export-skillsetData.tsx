// lib/export/Export-skillset.ts

import * as XLSX from 'xlsx';
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
  dictionary?: any[]; // Add dictionary for translations
}

export interface ExportSkillOptions {
  showAdministrator?: boolean;
  showDeveloper?: boolean;
  showTechnicalAbility?: boolean;
  fileName?: string;
  language?: 'eng' | 'japan'; // Add language option
}

type GroupedSkill = {
  skill_id: number;
  skill_name: string;
  sub_category_name: string;
};

// Helper function to translate text
function translateText(text: string, language: 'eng' | 'japan', dictionary: any[]): string {
  if (language === 'eng' || !text) return text;
  
  // Create translation map
  const translationMap = new Map<string, string>();
  if (dictionary && Array.isArray(dictionary)) {
    dictionary.forEach((entry: any) => {
      translationMap.set(entry.englishText.toLowerCase(), entry.japaneseText);
    });
  }
  
  // Try exact match first
  const lowerText = text.toLowerCase();
  if (translationMap.has(lowerText)) {
    return translationMap.get(lowerText)!;
  }
  
  // Try word by word
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
 * Build the data structure for export - mirrors the UI table exactly
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

  // Helper to translate text based on language
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

  // Build dynamic skills list from skill_headers (same as UI)
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

  // Group skills by category (same as UI's dynamicSkillsByCategory)
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

  // Define headers with translation
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

  // ============================================================
  // CALCULATE TOTAL COLUMNS - must match UI exactly
  // ============================================================
  const empColCount = employeeHeaders.length; // 6
  const adminColCount = showAdministrator ? administratorHeaders.length : 0; // 5
  const devCapHeadersList = devCap_headers || [];
  const langColCount = showDeveloper ? languageSkillHeaders.length : 0; // 2
  const devCapColCount = showDeveloper ? devCapHeadersList.length * 2 : 0;
  const techColCount = showTechnicalAbility ? dynamicSkillsList.length * 2 : 0;
  const totalCols = empColCount + adminColCount + langColCount + devCapColCount + techColCount;

  // Sort categories by minimum skill_id (same as UI)
  const sortedCategories = Object.entries(dynamicSkillsByCategory)
    .sort((a, b) => {
      const aMinId = Math.min(...a[1].map((s) => s.skill_id));
      const bMinId = Math.min(...b[1].map((s) => s.skill_id));
      return aMinId - bMinId;
    });

  // ============================================================
  // BUILD HEADER ROWS - Each row is totalCols wide, one cell per column
  // ============================================================
  const row1: any[] = new Array(totalCols).fill('');
  const row2: any[] = new Array(totalCols).fill('');
  const row3: any[] = new Array(totalCols).fill('');
  const row4: any[] = new Array(totalCols).fill('');
  const row5: any[] = new Array(totalCols).fill('');
  const merges: XLSX.Range[] = [];

  // --- Employee headers: rowSpan=5 (rows 0-4) ---
  for (let i = 0; i < empColCount; i++) {
    row1[i] = employeeHeaders[i].header_name;
    merges.push({ s: { r: 0, c: i }, e: { r: 4, c: i } });
  }

  let col = empColCount;

  // --- Administrator section ---
  if (showAdministrator) {
    const adminStart = col;
    // ROW 1: "Administrator" spans 5 columns
    row1[adminStart] = t("Administrator");
    merges.push({ s: { r: 0, c: adminStart }, e: { r: 0, c: adminStart + 4 } });

    // ROW 2: "Management experience (Levels 1-5)" with rowSpan=4 (rows 1-4)
    row2[adminStart] = administratorHeaders[0].header_name;
    merges.push({ s: { r: 1, c: adminStart }, e: { r: 4, c: adminStart } });

    // ROW 2: "management ability" spans 4 columns (adminStart+1 to adminStart+4)
    row2[adminStart + 1] = t("management ability");
    merges.push({ s: { r: 1, c: adminStart + 1 }, e: { r: 1, c: adminStart + 4 } });

    // ROW 3: Individual management ability headers with rowSpan=3 (rows 2-4)
    for (let i = 1; i < administratorHeaders.length; i++) {
      row3[adminStart + i] = administratorHeaders[i].header_name;
      merges.push({ s: { r: 2, c: adminStart + i }, e: { r: 4, c: adminStart + i } });
    }

    col += adminColCount;
  }

  // --- Developer section ---
  if (showDeveloper) {
    const devStart = col;
    const devTotalCols = langColCount + devCapColCount;

    // ROW 1: "Developer (DIR and YSX tasks only)" spans all developer columns
    row1[devStart] = t("Developer (DIR and YSX tasks only)");
    merges.push({ s: { r: 0, c: devStart }, e: { r: 0, c: devStart + devTotalCols - 1 } });

    // ROW 2: "language skills" spans 2 columns
    row2[devStart] = t("language skills");
    merges.push({ s: { r: 1, c: devStart }, e: { r: 1, c: devStart + 1 } });

    // ROW 3: language skill sub-headers with rowSpan=3 (rows 2-4)
    for (let i = 0; i < languageSkillHeaders.length; i++) {
      row3[devStart + i] = languageSkillHeaders[i].header_name;
      merges.push({ s: { r: 2, c: devStart + i }, e: { r: 4, c: devStart + i } });
    }

    // ROW 2: "Development capabilities" if devCap headers exist
    if (devCapHeadersList.length > 0) {
      const devCapStart = devStart + langColCount;
      row2[devCapStart] = t("Development capabilities");
      merges.push({ s: { r: 1, c: devCapStart }, e: { r: 1, c: devCapStart + devCapColCount - 1 } });

      // ROW 3: Individual devCap type names with rowSpan=2, colSpan=2 (rows 2-3)
      devCapHeadersList.forEach((header: any, index: number) => {
        const headerCol = devCapStart + index * 2;
        const typeName = header.developmentTypeName || header.development_type_name || '';
        row3[headerCol] = t(typeName);
        merges.push({ s: { r: 2, c: headerCol }, e: { r: 3, c: headerCol + 1 } });
      });

      // ROW 5: Years/Experience sub-headers for each devCap
      devCapHeadersList.forEach((_: any, index: number) => {
        const headerCol = devCapStart + index * 2;
        row5[headerCol] = t("Years");
        row5[headerCol + 1] = t("Experience");
      });
    }

    col += devTotalCols;
  }

  // --- Technical Ability section ---
  if (showTechnicalAbility) {
    const techStart = col;

    // ROW 1: "Technical Ability" spans all technical columns
    if (techColCount > 0) {
      row1[techStart] = t("Technical Ability");
      if (skill_headers?.length === 0) {
        merges.push({ s: { r: 0, c: techStart }, e: { r: 4, c: techStart } });
      } else {
        merges.push({ s: { r: 0, c: techStart }, e: { r: 0, c: techStart + techColCount - 1 } });
      }
    } else {
      row1[techStart] = t("Technical Ability");
    }

    // Now build ROW 2, ROW 3, ROW 4 for technical skills
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
            const aMinId = Math.min(...a[1].skills.map(s => s.skill_id));
            const bMinId = Math.min(...b[1].skills.map(s => s.skill_id));
            return aMinId - bMinId;
          });

        sortedSubs.forEach(([subCategoryName, { count, skills: subSkills }]) => {
          const sortedSubSkills = [...subSkills].sort((a, b) => a.skill_id - b.skill_id);

          if (isCategoryEmpty && subCategoryName === '') {
            sortedSubSkills.forEach((skill) => {
              row2[techCol] = skill.skill_name;
              merges.push({ s: { r: 1, c: techCol }, e: { r: 3, c: techCol + 1 } });
              row5[techCol] = t("Years");
              row5[techCol + 1] = t("Experience");
              techCol += 2;
            });
          } else {
            row2[techCol] = subCategoryName || t("Uncategorized");
            merges.push({ s: { r: 1, c: techCol }, e: { r: 2, c: techCol + count - 1 } });
            sortedSubSkills.forEach((skill) => {
              row4[techCol] = skill.skill_name;
              merges.push({ s: { r: 3, c: techCol }, e: { r: 3, c: techCol + 1 } });
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
            merges.push({ s: { r: 1, c: techCol }, e: { r: 3, c: techCol + 1 } });
            row5[techCol] = t("Years");
            row5[techCol + 1] = t("Experience");
            techCol += 2;
          });
        } else {
          row2[techCol] = categoryName;
          merges.push({ s: { r: 1, c: techCol }, e: { r: 1, c: techCol + sortedSkills.length * 2 - 1 } });

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
              const aMinId = Math.min(...a[1].skills.map(s => s.skill_id));
              const bMinId = Math.min(...b[1].skills.map(s => s.skill_id));
              return aMinId - bMinId;
            })
            .forEach(([subCategoryName, { count }]) => {
              row3[subCol] = subCategoryName;
              merges.push({ s: { r: 2, c: subCol }, e: { r: 2, c: subCol + count - 1 } });
              subCol += count;
            });

          sortedSkills.forEach((skill) => {
            row4[techCol] = skill.skill_name;
            merges.push({ s: { r: 3, c: techCol }, e: { r: 3, c: techCol + 1 } });
            row5[techCol] = t("Years");
            row5[techCol + 1] = t("Experience");
            techCol += 2;
          });
        }
      }
    });
  }

  const headerRows = [row1, row2, row3, row4, row5];

  // ============================================================
  // DATA ROWS - Translate data values
  // ============================================================
  const dataRows: any[][] = [];
  employee_data.forEach((employee: any) => {
    const row: any[] = [];
    
    // Employee data (6 columns) - translate values
    row.push(t(employee.team || '-'));
    row.push(employee.id || '-');
    row.push(employee.name || '-');
    row.push(t(employee.dept_dir || '-'));
    row.push(t(employee.is_core_personnel ? 'Yes' : 'No'));
    row.push(t(employee.has_japan_business_trip ? 'Yes' : 'No'));
    
    // Administrator data (5 columns)
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
      row.push(langLevel ? `${langLevel}` : '-');
      const jlptLevel = japaneseLevelMap.get(employee.id) || langSkill?.jlpt_highest_level;
      row.push(t(jlptLevel || '-'));
      
      (devCapHeadersList).forEach((header: any) => {
        const typeName = header.developmentTypeName || header.development_type_name;
        const devCapData = devCapMap.get(employee.id)?.get(typeName);
        row.push(devCapData?.years || '-');
        row.push(t(devCapData?.experience_process || '-'));
      });
    }
    
    // Technical Skills data - translate levels
    if (showTechnicalAbility) {
      const employeeSkills = skillMap.get(employee.id) || new Map();
      const sortedSkills = [...dynamicSkillsList].sort((a, b) => a.id - b.id);
      sortedSkills.forEach((skill) => {
        const sd = employeeSkills.get(skill.name);
        row.push(sd?.years || '-');
        row.push(t(sd?.level || '-'));
      });
    }
    
    dataRows.push(row);
  });
  
  return {
    headerRows,
    dataRows,
    merges,
    totalCols,
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

/**
 * Export skills data to Excel format
 */
export async function exportSkillsToExcel(
  data: ExportSkillData,
  options?: ExportSkillOptions
) {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const { headerRows, dataRows, merges, totalCols } = buildExportData(data, { ...options, language });
  const allRows = [...headerRows, ...dataRows];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  
  // Set column widths
  const colWidths = [];
  for (let i = 0; i < totalCols; i++) {
    let maxLength = 10;
    for (let j = 0; j < allRows.length && j < 50; j++) {
      const cell = allRows[j]?.[i];
      if (cell) {
        const cellLength = String(cell).length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      }
    }
    colWidths.push({ wch: Math.min(Math.max(maxLength + 5, 15), 50) });
  }
  ws['!cols'] = colWidths;
  
  ws['!merges'] = merges;
  ws['!rows'] = allRows.map(() => ({ hpx: 25 }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Skills Report');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${fileName}${language === 'japan' ? '_JP' : '_EN'}.xlsx`);
}

/**
 * Export skills data to CSV format
 */
export async function exportSkillsToCSV(
  data: ExportSkillData,
  options?: ExportSkillOptions
) {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`,
    language = 'eng'
  } = options || {};

  const { headerRows, dataRows } = buildExportData(data, { ...options, language });
  const allRows = [...headerRows, ...dataRows];
  
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}${language === 'japan' ? '_JP' : '_EN'}.csv`);
}

/**
 * Export skills data to PDF format
 */
export async function exportSkillsToPDF(
  data: ExportSkillData,
  options?: ExportSkillOptions
) {
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