// app/api/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

// Define types for your data structure
interface SheetData {
  name: string;
  rows: any[][];
  mergedCells: any[];
  formulas: Record<string, string>;
}

interface TemplateData {
  sheets: Record<string, SheetData>;
  employeeData: any;
  validationLists: Record<string, string[]>;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Extract all sheet data
    const sheets: Record<string, SheetData> = {};
    const validationLists: Record<string, string[]> = {};

    // Process each sheet
    for (const sheet of workbook.worksheets) {
      const sheetName = sheet.name;
      const rows: any[][] = [];
      const mergedCells: any[] = [];
      const formulas: Record<string, string> = {};

      // Get merged cells
      if (sheet._merges) {
        sheet._merges.forEach((merge: any) => {
          mergedCells.push({
            top: merge.top,
            left: merge.left,
            bottom: merge.bottom,
            right: merge.right,
          });
        });
      }

      // Get all rows
      sheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell((cell, colNumber) => {
          // Store value
          let value = cell.value;

          // Handle formulas
          if (cell.formula) {
            formulas[`${rowNumber},${colNumber}`] = cell.formula;
            // Try to get calculated value or use formula string
            value = cell.result || `=${cell.formula}`;
          }

          // Handle rich text
          if (typeof value === 'object' && value !== null && 'richText' in value) {
            value = (value as any).richText.map((rt: any) => rt.text).join('');
          }

          rowData.push(value);
        });
        rows.push(rowData);
      });

      // Extract data validation lists (dropdown options)
      if (sheet.dataValidations) {
        sheet.dataValidations.model.forEach((dv: any) => {
          if (dv.type === 'list' && dv.formulae && dv.formulae.length > 0) {
            const listName = dv.formulae[0].replace(/'/g, '');
            if (!validationLists[listName]) {
              // Try to find the list in the workbook
              const listSheet = workbook.getWorksheet(listName);
              if (listSheet) {
                const options: string[] = [];
                listSheet.eachRow((row) => {
                  row.eachCell((cell) => {
                    if (cell.value) {
                      options.push(String(cell.value));
                    }
                  });
                });
                validationLists[listName] = options;
              }
            }
          }
        });
      }

      sheets[sheetName] = {
        name: sheetName,
        rows,
        mergedCells,
        formulas,
      };
    }

    // Parse the template structure and extract employee data
    const employeeData = extractEmployeeData(sheets);

    return NextResponse.json({
      success: true,
      sheets,
      employeeData,
      validationLists,
      sheetNames: workbook.worksheets.map((s) => s.name),
    });
  } catch (error) {
    console.error('Error processing Excel:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file' },
      { status: 500 }
    );
  }
}

// Helper: Extract employee data from Sheet1
function extractEmployeeData(sheets: Record<string, SheetData>) {
  const sheet1 = sheets['Sheet1'];
  if (!sheet1) return null;

  const employees: any[] = [];
  const rows = sheet1.rows;

  // Find the data section (skip header rows)
  let startRow = 0;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === 'local') {
      startRow = i;
      break;
    }
  }

  // Map each employee row
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 3) continue;

    const employee = {
      team: row[0] || '',
      id: row[1] || '',
      name: row[2] || '',
      department: row[3] || '',
      rank: row[4] || '',
      corePersonnel: row[5] || '',
      hasBusinessTrip: row[6] || '',
      managementExperience: row[7] || '',
      managementAbility: {
        qcd: row[8] || '',
        reporting: row[9] || '',
        education: row[10] || '',
        total: row[11] || '',
      },
      languageSkills: {
        level: row[12] || '',
        jlpt: row[13] || '',
      },
      developmentCapabilities: {
        hostOnline: extractProcessData(row, 14, 22),
        hostBatch: extractProcessData(row, 23, 31),
        distributedOnline: extractProcessData(row, 32, 40),
        distributedBatch: extractProcessData(row, 41, 49),
      },
      technicalSkills: {
        programmingLanguages: extractTechnicalSkills(row, 50, 89),
        databases: extractTechnicalSkills(row, 90, 94),
        trendingWords: extractTechnicalSkills(row, 95, 120),
        // ... additional categories as needed
      },
    };

    employees.push(employee);
  }

  return employees;
}

// Helper: Extract process data (years and experience type)
function extractProcessData(row: any[], startCol: number, endCol: number) {
  const processes: any[] = [];
  for (let i = startCol; i <= endCol; i += 2) {
    if (row[i] || row[i + 1]) {
      processes.push({
        years: row[i] || '',
        experienceType: row[i + 1] || '',
      });
    }
  }
  return processes;
}

// Helper: Extract technical skills
function extractTechnicalSkills(row: any[], startCol: number, endCol: number) {
  const skills: any[] = [];
  for (let i = startCol; i <= endCol; i++) {
    if (row[i]) {
      skills.push(row[i]);
    }
  }
  return skills;
}