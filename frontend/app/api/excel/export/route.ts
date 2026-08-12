// app/api/excel/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

interface CellUpdate {
  reference: string; // e.g., 'B10'
  value: string;
  rowNumber: number; // e.g., 10
}

// Define all cells to update
const TEMPLATE_UPDATES: CellUpdate[] = [
  { reference: 'B10', value: 'Welcome', rowNumber: 10 },
  { reference: 'B13', value: 'Employee Name', rowNumber: 13 },
  { reference: 'E10', value: 'Department', rowNumber: 10 },
  { reference: 'F14', value: 'Total Skills', rowNumber: 14 },
  // Add more cells as needed
];

async function generateExcel(cellUpdates?: CellUpdate[]) {
  const templatePath = path.join(
    process.cwd(),
    'public/templates/skills_template.xlsx'
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error('Template file not found at path: ' + templatePath);
  }

  const fileBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(fileBuffer);
  
  // Find the worksheet
  let sheetPath = 'xl/worksheets/sheet6.xml';
  let sheetFile = zip.file(sheetPath);
  
  if (!sheetFile) {
    const possiblePaths = [
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
      'xl/worksheets/sheet3.xml',
    ];
    
    for (const path of possiblePaths) {
      sheetFile = zip.file(path);
      if (sheetFile) {
        sheetPath = path;
        break;
      }
    }
  }

  if (!sheetFile) {
    throw new Error('Worksheet XML not found in workbook template.');
  }

  let sheetXml = await sheetFile.async('string');
  
  // Apply all cell updates
  const updates = cellUpdates || TEMPLATE_UPDATES;
  for (const update of updates) {
    sheetXml = updateCellInWorksheet(sheetXml, update);
  }

  zip.file(sheetPath, sheetXml);

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

// Helper function to update a single cell
function updateCellInWorksheet(
  sheetXml: string,
  cellUpdate: CellUpdate
): string {
  const { reference, value, rowNumber } = cellUpdate;
  
  // Create cell XML with inline string
  const cellXml = `<c r="${reference}" t="inlineStr"><is><t>${value}</t></is></c>`;
  
  // Check if cell already exists
  const cellRegex = new RegExp(`<c[^>]*\\br="${reference}"[^>]*>[\\s\\S]*?<\\/c>`);
  
  if (cellRegex.test(sheetXml)) {
    // Cell exists - replace it
    sheetXml = sheetXml.replace(cellRegex, cellXml);
  } else {
    // Cell doesn't exist - insert into row
    const rowRegex = new RegExp(`(<row[^>]*\\br="${rowNumber}"[^>]*>)`);
    if (rowRegex.test(sheetXml)) {
      // Row exists - insert cell at beginning of row
      sheetXml = sheetXml.replace(rowRegex, `$1${cellXml}`);
    } else {
      // Row doesn't exist - create row
      const newRowXml = `<row r="${rowNumber}">${cellXml}</row>`;
      sheetXml = sheetXml.replace('</sheetData>', `${newRowXml}</sheetData>`);
    }
  }
  
  return sheetXml;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const customValue = url.searchParams.get('value');
    const cellRef = url.searchParams.get('cell') || 'B10';
    
    let updates = TEMPLATE_UPDATES;
    
    if (customValue) {
      // Update specific cell with custom value
      updates = TEMPLATE_UPDATES.map(update => ({
        ...update,
        value: update.reference === cellRef ? customValue : update.value
      }));
    }
    
    const buffer = await generateExcel(updates);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="skills_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading template:', error);
    return NextResponse.json(
      { error: 'Failed to download template: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    let updates: CellUpdate[] = [];
    
    if (body.cells && Array.isArray(body.cells)) {
      // Custom cells array provided
      updates = body.cells;
    } else if (body.values && typeof body.values === 'object') {
      // Map of cell references to values
      updates = Object.entries(body.values).map(([reference, value]) => ({
        reference,
        value: String(value),
        rowNumber: parseInt(reference.match(/\d+/)?.[0] || '10') // Extract row number from reference
      }));
    } else if (body.value && body.reference) {
      // Update specific cell
      const rowNumber = parseInt(body.reference.match(/\d+/)?.[0] || '10');
      updates = [{
        reference: body.reference,
        value: body.value,
        rowNumber: rowNumber
      }];
    } else if (body.updateAll && body.value) {
      // Update all cells with same value
      updates = TEMPLATE_UPDATES.map(update => ({
        ...update,
        value: body.value
      }));
    } else {
      // Use default template updates
      updates = TEMPLATE_UPDATES;
    }
    
    const buffer = await generateExcel(updates);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="skills_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export Excel file: ' + (error as Error).message },
      { status: 500 }
    );
  }
}