// lib/export/Export-skillset.ts - Complete fixed version

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
}

export interface ExportSkillOptions {
  showAdministrator?: boolean;
  showDeveloper?: boolean;
  showTechnicalAbility?: boolean;
  fileName?: string;
}

/**
 * Build the data structure for export - mirrors the UI table exactly
 */
function buildExportData(data: ExportSkillData, options: ExportSkillOptions) {
  const {
    showAdministrator = true,
    showDeveloper = true,
    showTechnicalAbility = true,
  } = options;

  const {
    employee_data,
    skill_headers,
    skillData,
    devCap_headers,
    devCap_data,
    languageSkill_data,
    managementScores_Data
  } = data;

  // Build maps for quick lookup
  const skillMap = new Map<string, Map<number, { years: number | null; level: string | null }>>();
  if (skillData) {
    skillData.forEach((skill: any) => {
      const employeeId = skill.employee_id;
      if (!skillMap.has(employeeId)) {
        skillMap.set(employeeId, new Map());
      }
      const employeeSkillMap = skillMap.get(employeeId)!;
      employeeSkillMap.set(skill.skill_id, {
        years: skill.years_of_experience,
        level: skill.experience_level
      });
    });
  }

  const devCapMap = new Map<string, Map<number, { years: number | null; experience: string | null; process_name: string | null }>>();
  if (devCap_data) {
    devCap_data.forEach((devCap: any) => {
      const employeeId = devCap.employee_id;
      if (!devCapMap.has(employeeId)) {
        devCapMap.set(employeeId, new Map());
      }
      const employeeDevCapMap = devCapMap.get(employeeId)!;
      employeeDevCapMap.set(devCap.development_type_id, {
        years: devCap.years_of_experience,
        experience: devCap.development_type_name,
        process_name: devCap.process_name
      });
    });
  }

  const languageSkillMap = new Map<string, { language_skill_level: number | null; jlpt_highest_level: string | null }>();
  if (languageSkill_data) {
    languageSkill_data.forEach((skill: any) => {
      languageSkillMap.set(skill.employee_id, {
        language_skill_level: skill.language_skill_level,
        jlpt_highest_level: skill.jlpt_highest_level
      });
    });
  }

  const managementScoresMap = new Map<string, any>();
  if (managementScores_Data) {
    managementScores_Data.forEach((score: any) => {
      managementScoresMap.set(score.employee_id, score);
    });
  }

  // Build dynamic skills list - preserve the exact order from skill_headers
  const dynamicSkillsList: { id: number; name: string; category: string; sub_category: string }[] = [];
  if (skill_headers) {
    skill_headers.forEach((category: any) => {
      category.skill_sub_categories?.forEach((subCategory: any) => {
        subCategory.skills?.forEach((skill: any) => {
          dynamicSkillsList.push({
            id: skill.id,
            name: skill.skill_name,
            category: category.category_name,
            sub_category: subCategory.sub_category_name,
          });
        });
      });
    });
  }

  // Group skills by category
  const dynamicSkillsByCategory: Record<string, any[]> = {};
  if (skill_headers) {
    skill_headers.forEach((category: any) => {
      const categoryName = category.category_name || "empty";
      if (!dynamicSkillsByCategory[categoryName]) {
        dynamicSkillsByCategory[categoryName] = [];
      }
      category.skill_sub_categories?.forEach((subCategory: any) => {
        subCategory.skills?.forEach((skill: any) => {
          dynamicSkillsByCategory[categoryName].push({
            skill_id: skill.id,
            skill_name: skill.skill_name,
            sub_category_name: subCategory.sub_category_name || "empty",
          });
        });
      });
    });
  }

  // Define headers - matching UI exactly
  const employeeHeaders = [
    { field: "team", header_name: "Team" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "dept", header_name: "Name of the commissioning department *Select from the dropdown menu" },
    { field: "is_core_personnel", header_name: "Core personnel *FPT only" },
    { field: "has_japan_business_trip", header_name: " Whether or not you have a business trip to Japan" },
  ];

  const administratorHeaders = [
    { field: "management_experience_level", header_name: "Management experience (Levels 1-5)" },
    { field: "qcd_score", header_name: "QCD (1-4 points)" },
    { field: "report_consult_score", header_name: "Reporting, contacting, and consulting (1-4 points)" },
    { field: "education_score", header_name: "Education (1-4 points)" },
    { field: "total_level", header_name: "Total (Levels 1-5)" },
  ];

  const languageSkillHeaders = [
    { field: "language_level", header_name: "Level (Levels 1-5)" },
    { field: "jlpt_nat_score", header_name: "JLPT/NAT (N1~N5)" },
  ];

  // ============================================================
  // BUILD HEADER ROWS - EXACTLY MATCHING UI TABLE
  // ============================================================
  const headerRows: any[][] = [];
  
  // ROW 1: Main Categories
  const row1: any[] = [];
  employeeHeaders.forEach((header) => row1.push(header.header_name));
  if (showAdministrator) row1.push('Administrator');
  if (showDeveloper) row1.push('Developer (DIR and YSX tasks only)');
  if (showTechnicalAbility) row1.push('Technical Ability');
  row1.push('Actions');
  headerRows.push(row1);
  
  // ROW 2: Sub-categories
  const row2: any[] = [];
  employeeHeaders.forEach(() => row2.push(''));
  if (showAdministrator) {
    row2.push(administratorHeaders[0].header_name);
    row2.push('management ability');
  }
  if (showDeveloper) {
    row2.push('language skills');
    row2.push('Development capabilities');
  }
  if (showTechnicalAbility) {
    // For "empty" category, show sub-category names with rowSpan 2
    // For non-empty categories, show category names
    Object.entries(dynamicSkillsByCategory).forEach(([categoryName, skills]) => {
      if (categoryName === "empty") {
        // Show sub-category names directly
        const subCategoryMap: Record<string, { count: number }> = {};
        skills.forEach((skill) => {
          const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name;
          if (!subCategoryMap[subName]) {
            subCategoryMap[subName] = { count: 0 };
          }
          subCategoryMap[subName].count += 2;
        });
        Object.entries(subCategoryMap).forEach(([subCategoryName]) => {
          row2.push(subCategoryName);
        });
      } else {
        const hasOnlyEmptySubCategories = skills.every(
          (skill) => skill.sub_category_name === "empty"
        );
        if (hasOnlyEmptySubCategories) {
          row2.push(categoryName);
        } else {
          row2.push(categoryName);
        }
      }
    });
  }
  row2.push('');
  headerRows.push(row2);
  
  // ROW 3: More sub-categories
  const row3: any[] = [];
  employeeHeaders.forEach(() => row3.push(''));
  if (showAdministrator) {
    row3.push('');
    for (let i = 1; i < administratorHeaders.length; i++) {
      row3.push(administratorHeaders[i].header_name);
    }
  }
  if (showDeveloper) {
    languageSkillHeaders.forEach(() => row3.push(''));
    (devCap_headers || []).forEach((header: any) => {
      row3.push(header.development_type);
    });
  }
  if (showTechnicalAbility) {
    // For non-empty categories with sub-categories, show sub-categories in row3
    Object.entries(dynamicSkillsByCategory).forEach(([categoryName, skills]) => {
      if (categoryName === "empty" || skills.every((skill) => skill.sub_category_name === "empty")) {
        return;
      }
      const subCategoryMap: Record<string, { count: number }> = {};
      skills.forEach((skill) => {
        const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name;
        if (!subCategoryMap[subName]) {
          subCategoryMap[subName] = { count: 0 };
        }
        subCategoryMap[subName].count += 2;
      });
      Object.entries(subCategoryMap).forEach(([subCategoryName]) => {
        row3.push(subCategoryName);
      });
    });
  }
  row3.push('');
  headerRows.push(row3);
  
  // ROW 4: Individual Skills
  const row4: any[] = [];
  employeeHeaders.forEach(() => row4.push(''));
  if (showAdministrator) {
    row4.push('');
    for (let i = 1; i < administratorHeaders.length; i++) {
      row4.push('');
    }
  }
  if (showDeveloper) {
    languageSkillHeaders.forEach(() => row4.push(''));
    (devCap_headers || []).forEach(() => row4.push(''));
  }
  if (showTechnicalAbility) {
    dynamicSkillsList.forEach((skill) => {
      row4.push(skill.name);
    });
  }
  row4.push('');
  headerRows.push(row4);
  
  // ROW 5: Years and Experience
  const row5: any[] = [];
  employeeHeaders.forEach(() => row5.push(''));
  if (showAdministrator) {
    row5.push('');
    for (let i = 1; i < administratorHeaders.length; i++) {
      row5.push('');
    }
  }
  if (showDeveloper) {
    languageSkillHeaders.forEach(() => row5.push(''));
    (devCap_headers || []).forEach(() => {
      row5.push('Years');
      row5.push('Experience');
    });
  }
  if (showTechnicalAbility) {
    dynamicSkillsList.forEach(() => {
      row5.push('Years');
      row5.push('Experience');
    });
  }
  row5.push('');
  headerRows.push(row5);
  
  // DATA ROWS
  const dataRows: any[][] = [];
  employee_data.forEach((employee: any) => {
    const row: any[] = [];
    
    // Employee data (6 columns)
    row.push(employee.team || '-');
    row.push(employee.id || '-');
    row.push(employee.name || '-');
    row.push(employee.dept_dir || '-');
    row.push(employee.is_core_personnel ? 'Yes' : 'No');
    row.push(employee.has_japan_business_trip ? 'Yes' : 'No');
    
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
      row.push(langLevel ? `Level ${langLevel}` : '-');
      const jlptLevel = langSkill?.jlpt_highest_level;
      row.push(jlptLevel || '-');
      
      (devCap_headers || []).forEach((header: any) => {
        const devCapData = devCapMap.get(employee.id)?.get(header.id);
        row.push(devCapData?.years || '-');
        row.push(devCapData?.experience || '-');
      });
    }
    
    // Technical Skills data
    if (showTechnicalAbility) {
      const employeeSkills = skillMap.get(employee.id) || new Map();
      dynamicSkillsList.forEach((skill) => {
        const skillData = employeeSkills.get(skill.id);
        row.push(skillData?.years || '-');
        row.push(skillData?.level || '-');
      });
    }
    
    row.push('');
    dataRows.push(row);
  });
  
  return {
    headerRows,
    dataRows,
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
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`
  } = options || {};

  const { headerRows, dataRows, dynamicSkillsList, dynamicSkillsByCategory } = buildExportData(data, options || {});
  const allRows = [...headerRows, ...dataRows];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  
  // Set column widths
  const colWidths = [];
  for (let i = 0; i < (allRows[0]?.length || 0); i++) {
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
    colWidths.push({ wch: Math.min(maxLength + 5, 50) });
  }
  ws['!cols'] = colWidths;
  
  // ============================================================
  // MERGE CELLS - MATCHING UI TABLE EXACTLY
  // ============================================================
  const merges: any[] = [];
  let colIdx = 0;
  
  const employeeHeadersCount = 6;
  
  // 1. Employee headers - rowSpan 5 (rows 0-4)
  for (let i = 0; i < employeeHeadersCount; i++) {
    merges.push({ s: { r: 0, c: colIdx }, e: { r: 4, c: colIdx } });
    colIdx++;
  }
  
  // 2. Administrator main header - colSpan 5, row 0
  if (options?.showAdministrator !== false) {
    const adminStart = colIdx;
    const adminEnd = adminStart + 4;
    merges.push({ s: { r: 0, c: adminStart }, e: { r: 0, c: adminEnd } });
    colIdx = adminEnd + 1;
  }
  
  // 3. Developer main header - colSpan 10, row 0
  if (options?.showDeveloper !== false) {
    const devHeaders = data.devCap_headers || [];
    const devStart = colIdx;
    const devEnd = devStart + 1 + devHeaders.length * 2;
    merges.push({ s: { r: 0, c: devStart }, e: { r: 0, c: devEnd } });
    colIdx = devEnd + 1;
  }
  
  // 4. Technical Ability main header - row 0
  if (options?.showTechnicalAbility !== false) {
    const techStart = colIdx;
    const techEnd = techStart + dynamicSkillsList.length * 2 - 1;
    if (dynamicSkillsList.length > 0) {
      merges.push({ s: { r: 0, c: techStart }, e: { r: 0, c: techEnd } });
    }
    colIdx = techEnd + 1;
  }
  
  // 5. Actions - rowSpan 5 (rows 0-4)
  merges.push({ s: { r: 0, c: colIdx }, e: { r: 4, c: colIdx } });
  
  // ============================================================
  // ROW 2 MERGES (row index 1)
  // ============================================================
  
  // Administrator: Management experience - rowSpan 4 (rows 1-4)
  if (options?.showAdministrator !== false) {
    const mgmtCol = employeeHeadersCount;
    merges.push({ s: { r: 1, c: mgmtCol }, e: { r: 4, c: mgmtCol } });
    // management ability - colSpan 4, row 1
    const mgmtAbilityStart = mgmtCol + 1;
    const mgmtAbilityEnd = mgmtAbilityStart + 3;
    merges.push({ s: { r: 1, c: mgmtAbilityStart }, e: { r: 1, c: mgmtAbilityEnd } });
  }
  
  // Developer: language skills - colSpan 2, row 1
  if (options?.showDeveloper !== false) {
    const offset = employeeHeadersCount + (options?.showAdministrator !== false ? 5 : 0);
    const langStart = offset;
    const langEnd = langStart + 1;
    merges.push({ s: { r: 1, c: langStart }, e: { r: 1, c: langEnd } });
    // Development capabilities - colSpan 8, row 1
    const devHeaders = data.devCap_headers || [];
    const devStart = langEnd + 1;
    const devEnd = devStart + devHeaders.length * 2 - 1;
    if (devHeaders.length > 0) {
      merges.push({ s: { r: 1, c: devStart }, e: { r: 1, c: devEnd } });
    }
  }
  
  // Technical Ability: handle "empty" category with rowSpan 2
  if (options?.showTechnicalAbility !== false) {
    let techCol = employeeHeadersCount + 
      (options?.showAdministrator !== false ? 5 : 0) + 
      (options?.showDeveloper !== false ? 2 + (data.devCap_headers || []).length * 2 : 0);
    
    Object.entries(dynamicSkillsByCategory).forEach(([categoryName, skills]) => {
      if (categoryName === "empty") {
        // For "empty" category, sub-categories have rowSpan 2 (rows 1-2)
        const subCategoryMap: Record<string, { count: number }> = {};
        skills.forEach((skill) => {
          const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name;
          if (!subCategoryMap[subName]) {
            subCategoryMap[subName] = { count: 0 };
          }
          subCategoryMap[subName].count += 2;
        });
        Object.entries(subCategoryMap).forEach(([, { count }]) => {
          const start = techCol;
          const end = techCol + count - 1;
          merges.push({ s: { r: 1, c: start }, e: { r: 2, c: end } });
          techCol = end + 1;
        });
      } else {
        const hasOnlyEmptySubCategories = skills.every(
          (skill) => skill.sub_category_name === "empty"
        );
        if (hasOnlyEmptySubCategories) {
          // Category with only empty sub-categories - rowSpan 2 (rows 1-2)
          const start = techCol;
          const end = techCol + skills.length * 2 - 1;
          merges.push({ s: { r: 1, c: start }, e: { r: 2, c: end } });
          techCol = end + 1;
        } else {
          // Category with sub-categories - only row 1
          const start = techCol;
          const end = techCol + skills.length * 2 - 1;
          merges.push({ s: { r: 1, c: start }, e: { r: 1, c: end } });
          techCol = end + 1;
        }
      }
    });
  }
  
  // ============================================================
  // ROW 3 MERGES (row index 2)
  // ============================================================
  
  // Administrator: QCD, Report/Consult, Education, Total - rowSpan 3 (rows 2-4)
  if (options?.showAdministrator !== false) {
    const offset = employeeHeadersCount + 1;
    for (let i = 1; i < 5; i++) {
      const col = offset + i - 1;
      merges.push({ s: { r: 2, c: col }, e: { r: 4, c: col } });
    }
  }
  
  // Developer: Language skills - rowSpan 3 (rows 2-4)
  if (options?.showDeveloper !== false) {
    const offset = employeeHeadersCount + (options?.showAdministrator !== false ? 5 : 0);
    for (let i = 0; i < 2; i++) {
      const col = offset + i;
      merges.push({ s: { r: 2, c: col }, e: { r: 4, c: col } });
    }
    // Development capabilities - rowSpan 2, colSpan 2 (rows 2-3)
    const devHeaders = data.devCap_headers || [];
    const devStart = offset + 2;
    devHeaders.forEach((header: any, index: number) => {
      const col = devStart + index * 2;
      merges.push({ s: { r: 2, c: col }, e: { r: 3, c: col + 1 } });
    });
  }
  
  // Technical Ability: sub-categories for non-empty categories (row 2 only)
  if (options?.showTechnicalAbility !== false) {
    let techCol = employeeHeadersCount + 
      (options?.showAdministrator !== false ? 5 : 0) + 
      (options?.showDeveloper !== false ? 2 + (data.devCap_headers || []).length * 2 : 0);
    
    Object.entries(dynamicSkillsByCategory).forEach(([categoryName, skills]) => {
      if (categoryName === "empty" || skills.every((skill) => skill.sub_category_name === "empty")) {
        // Skip - already handled in row 2 merges
        if (categoryName === "empty") {
          const subCategoryMap: Record<string, { count: number }> = {};
          skills.forEach((skill) => {
            const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name;
            if (!subCategoryMap[subName]) {
              subCategoryMap[subName] = { count: 0 };
            }
            subCategoryMap[subName].count += 2;
          });
          Object.entries(subCategoryMap).forEach(([, { count }]) => {
            techCol += count;
          });
        } else {
          techCol += skills.length * 2;
        }
        return;
      }
      
      const subCategoryMap: Record<string, { count: number }> = {};
      skills.forEach((skill) => {
        const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name;
        if (!subCategoryMap[subName]) {
          subCategoryMap[subName] = { count: 0 };
        }
        subCategoryMap[subName].count += 2;
      });
      Object.entries(subCategoryMap).forEach(([, { count }]) => {
        const start = techCol;
        const end = techCol + count - 1;
        merges.push({ s: { r: 2, c: start }, e: { r: 2, c: end } });
        techCol = end + 1;
      });
    });
  }
  
  // ============================================================
  // ROW 4 MERGES (row index 3) - Individual skills (each spans 2 columns)
  // ============================================================
  if (options?.showTechnicalAbility !== false) {
    let techCol = employeeHeadersCount + 
      (options?.showAdministrator !== false ? 5 : 0) + 
      (options?.showDeveloper !== false ? 2 + (data.devCap_headers || []).length * 2 : 0);
    
    dynamicSkillsList.forEach(() => {
      const start = techCol;
      const end = techCol + 1;
      merges.push({ s: { r: 3, c: start }, e: { r: 3, c: end } });
      techCol = end + 1;
    });
  }
  
  ws['!merges'] = merges;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Skills Report');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${fileName}.xlsx`);
}

/**
 * Export skills data to CSV format
 */
export async function exportSkillsToCSV(
  data: ExportSkillData,
  options?: ExportSkillOptions
) {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`
  } = options || {};

  const { headerRows, dataRows } = buildExportData(data, options || {});
  const allRows = [...headerRows, ...dataRows];
  
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${fileName}.csv`);
}

/**
 * Export skills data to PDF format
 */
export async function exportSkillsToPDF(
  data: ExportSkillData,
  options?: ExportSkillOptions
) {
  const {
    fileName = `Skills_Report_${new Date().toISOString().split('T')[0]}`
  } = options || {};

  const { headerRows, dataRows, dynamicSkillsList } = buildExportData(data, options || {});
  
  // Build flat headers for PDF
  const flatHeaders: string[] = [];
  const colCount = headerRows[0]?.length || 0;
  
  for (let i = 0; i < colCount; i++) {
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
  doc.text("Skills Report", 14, 20);
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

  doc.save(`${fileName}.pdf`);
}