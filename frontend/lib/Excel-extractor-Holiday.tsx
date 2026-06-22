import ExcelJS from 'exceljs';

// Month mapping for date parsing
const monthMap: { [key: string]: string } = {
  'January': '01', 'February': '02', 'March': '03', 'April': '04',
  'May': '05', 'June': '06', 'July': '07', 'August': '08',
  'September': '09', 'October': '10', 'November': '11', 'December': '12'
};

/**
 * Parse date from text like "1st January, Thursday"
 */
const parseDateFromText = (text: string): string => {
  if (!text) return '';
  if (text.toLowerCase().includes('tbd')) return 'TBD';
  
  const match = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)(?:,|$)/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = match[2];
    const month = monthMap[monthName] || '01';
    const year = '2026';
    return `${year}-${month}-${day}`;
  }
  
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  return text;
};

/**
 * Format Excel date to YYYY-MM-DD
 */
const formatExcelDate = (cell: any): string => {
  const rawValue = cell.value;
  
  if (rawValue instanceof Date) {
    const date = rawValue;
    if (!isNaN(date.getTime())) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    }
  }
  
  if (typeof rawValue === 'number') {
    try {
      const date = new Date(1899, 11, 30 + rawValue);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Fall through to text parsing
    }
  }
  
  if (typeof rawValue === 'string') {
    const parsed = parseDateFromText(rawValue);
    if (parsed) return parsed;
  }
  
  return cell.text || rawValue?.toString() || '';
};

/**
 * Extract holiday data from Excel file
 */
export const extractHolidayDataFromExcel = async (
  file: File
): Promise<{ holidayName: string; holidayDate: string }[]> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const sheetNames = workbook.worksheets.map(ws => ws.name);
    console.log('Available sheets:', sheetNames);

    // Find the Holiday sheet
    let worksheet = workbook.worksheets.find(ws => 
      ws.name.toLowerCase().includes('holiday')
    );
    
    if (!worksheet) {
      worksheet = workbook.worksheets.find(ws => 
        ws.name.includes('#Holidays')
      );
    }
    
    if (!worksheet) {
      const errorMessage = `No Holiday sheet found. }`;
      throw new Error(errorMessage);
    }


    const extractedData: { holidayName: string; holidayDate: string }[] = [];

    worksheet.eachRow((row) => {
      const holidayName = row.getCell(1).text || row.getCell(1).value?.toString() || '';
      let holidayDate = formatExcelDate(row.getCell(2));
      
      if (holidayDate === 'Invalid Date' || holidayDate === '' || holidayDate === 'NaN/NaN/NaN') {
        const col3Text = row.getCell(3).text || row.getCell(3).value?.toString() || '';
        holidayDate = parseDateFromText(col3Text);
      }
      
      if (holidayName && holidayDate && holidayDate !== 'TBD') {
        extractedData.push({ holidayName, holidayDate });
      }
    });

    console.log(`📊 Extracted ${extractedData.length} valid holidays`);
    return extractedData;
    
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw error;
  }
};

/**
 * Get all sheet names from Excel file
 */
export const getExcelSheetNames = async (file: File): Promise<string[]> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    return workbook.worksheets.map(ws => ws.name);
  } catch (error) {
    console.error('❌ Error getting sheet names:', error);
    throw error;
  }
};

/**
 * Extract data from specific sheet
 */
export const extractDataFromSheet = async (
  file: File,
  sheetName: string
): Promise<{ col1: string; col2: string; col3?: string; col4?: string }[]> => {
  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const extractedData: { col1: string; col2: string; col3?: string; col4?: string }[] = [];

    worksheet.eachRow((row) => {
      const col1 = row.getCell(1).text || row.getCell(1).value?.toString() || '';
      const col2 = row.getCell(2).text || row.getCell(2).value?.toString() || '';
      const col3 = row.getCell(3).text || row.getCell(3).value?.toString() || '';
      const col4 = row.getCell(4).text || row.getCell(4).value?.toString() || '';
      
      if (col1 || col2 || col3 || col4) {
        extractedData.push({ col1, col2, col3, col4 });
      }
    });

    return extractedData;
  } catch (error) {
    console.error('❌ Error extracting data from sheet:', error);
    throw error;
  }
};