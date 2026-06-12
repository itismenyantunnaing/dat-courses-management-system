"use server";

import ExcelJS from "exceljs";

export async function extractComplexExcel(formData: FormData) {
  const file = formData.get("excelFile") as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(arrayBuffer));

  // Target the first sheet "Original data"
  const worksheet = workbook.worksheets[0]; 
  const totalRows = worksheet.rowCount;

  // Configuration based on your image
  const HEADER_START_ROW = 4;
  const HEADER_END_ROW = 9;
  const DATA_START_ROW = 10;

  // 1. Build flattened column header strings
  const columnHeaders: { [colIndex: number]: string[] } = {};

  for (let r = HEADER_START_ROW; r <= HEADER_END_ROW; r++) {
    const row = worksheet.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (!columnHeaders[colNumber]) columnHeaders[colNumber] = [];
      
      let cellValue = cell.value;

      // Handle merged cells values correctly
      if (cell.isMerged && !cellValue) {
        // If it's part of a merge, exceljs leaves non-master cells empty.
        // We look for the master cell value or inherit from previous row cell context
        const masterCell = worksheet.getCell(cell.master.address);
        cellValue = masterCell.value;
      }

      const text = cellValue ? String(cellValue).trim().replace(/\n/g, " ") : "";
      if (text && !columnHeaders[colNumber].includes(text)) {
        columnHeaders[colNumber].push(text);
      }
    });
  }

  // Combine layers (e.g. "administrator" + "management ability" + "Total")
  const cleanHeadersMap: { [colNumber: number]: string } = {};
  Object.keys(columnHeaders).forEach((colNumStr) => {
    const colNum = parseInt(colNumStr);
    const joinedName = columnHeaders[colNum].join(" _ ");
    cleanHeadersMap[colNum] = joinedName || `Column_${colNum}`;
  });

  // 2. Extract Data Rows 10 onwards
  const extractedData: any[] = [];

  for (let r = DATA_START_ROW; r <= totalRows; r++) {
    const row = worksheet.getRow(r);
    
    // Check if the row has any real contents to avoid pushing empty spaces
    if (!row.values || (Array.isArray(row.values) && row.values.length === 0)) continue;

    const rowData: any = {};
    let hasValues = false;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const headerName = cleanHeadersMap[colNumber];
      if (headerName) {
        let val = cell.value;
        // Basic object cleanup if exceljs reads nested formula objects
        if (val && typeof val === "object" && "result" in val) {
          val = val.result; 
        }
        rowData[headerName] = val !== null && val !== undefined ? String(val).trim() : "";
        if (rowData[headerName] !== "") hasValues = true;
      }
    });

    if (hasValues) {
      extractedData.push(rowData);
    }
  }

  return extractedData;
}