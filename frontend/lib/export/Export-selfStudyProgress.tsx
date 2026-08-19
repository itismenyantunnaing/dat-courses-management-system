// lib/export/Export-selfStudyProgress.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface SelfStudyProgressRow {
  id: string;
  session: string;
  sessionDeadline: string;
  memberName: string;
  certified: string;
  examTarget: string;
  status: string;
  grammarCurrent: number;
  grammarTarget: number;
  vocabularyCurrent: number;
  vocabularyTarget: number;
  kanjiCurrent: number;
  kanjiTarget: number;
  readingCurrent: number;
  readingTarget: number;
  listeningCurrent: number;
  listeningTarget: number;
  totalGrammarCurrent: number;
  totalGrammarTarget: number;
  totalVocabularyCurrent: number;
  totalVocabularyTarget: number;
  totalKanjiCurrent: number;
  totalKanjiTarget: number;
  totalReadingCurrent: number;
  totalReadingTarget: number;
  totalListeningCurrent: number;
  totalListeningTarget: number;
  percentCompleteCurrent: number;
  percentCompleteActual: number;
  percentCompleteTarget: number;
}

export interface SelfStudyExportOptions {
  fileName?: string;
  courseName?: string;
  viewMode?: 'session' | 'overall';
}

/**
 * Export Self-Study Progress Report to Excel using ExcelJS
 */
export async function exportSelfStudyProgressToExcel(
  data: SelfStudyProgressRow[],
  options: SelfStudyExportOptions = {}
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = options.fileName || `SelfStudy_Progress_${dateStr}`;
  const viewMode = options.viewMode || 'session';

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Self-Study Progress', {
    properties: { tabColor: { argb: 'FF4472C4' } },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  // Set column widths
  const colWidths = [10, 18, 22, 12, 12, 10, 10, 12, 12, 10, 10, 12, 12, 12, 12, 12, 14];
  worksheet.columns = [
    { header: 'Session', key: 'session', width: 10 },
    { header: 'Session deadline', key: 'deadline', width: 18 },
    { header: 'Member Name', key: 'memberName', width: 22 },
    { header: 'Certified', key: 'certified', width: 12 },
    { header: 'Exam Target', key: 'examTarget', width: 12 },
    { header: 'Current', key: 'gCurrent', width: 10 },
    { header: 'Target', key: 'gTarget', width: 10 },
    { header: 'Current', key: 'vCurrent', width: 12 },
    { header: 'Target', key: 'vTarget', width: 12 },
    { header: 'Current', key: 'kCurrent', width: 10 },
    { header: 'Target', key: 'kTarget', width: 10 },
    { header: 'Current', key: 'rCurrent', width: 12 },
    { header: 'Target', key: 'rTarget', width: 12 },
    { header: 'Current', key: 'lCurrent', width: 12 },
    { header: 'Target', key: 'lTarget', width: 12 },
    { header: '% Complete', key: 'percentComplete', width: 12 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  // Create header rows
  // Row 1: Parent headers
  const headerRow1 = worksheet.getRow(1);
  headerRow1.height = 25;
  headerRow1.getCell(1).value = 'Session';
  headerRow1.getCell(2).value = 'Session deadline';
  headerRow1.getCell(3).value = 'Member Name';
  headerRow1.getCell(4).value = 'JLPT Level';
  headerRow1.getCell(5).value = ''; // Will be merged with JLPT Level
  headerRow1.getCell(6).value = 'Grammar Count';
  headerRow1.getCell(7).value = '';
  headerRow1.getCell(8).value = 'Vocabulary Count';
  headerRow1.getCell(9).value = '';
  headerRow1.getCell(10).value = 'Kanji Count';
  headerRow1.getCell(11).value = '';
  headerRow1.getCell(12).value = 'Reading (min)';
  headerRow1.getCell(13).value = '';
  headerRow1.getCell(14).value = 'Listening (min)';
  headerRow1.getCell(15).value = '';
  headerRow1.getCell(16).value = '% Complete';
  headerRow1.getCell(17).value = 'Status';

  // Style Row 1
  for (let i = 1; i <= 17; i++) {
    const cell = headerRow1.getCell(i);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  }

  // Row 2: Child headers
  const headerRow2 = worksheet.getRow(2);
  headerRow2.height = 25;
  headerRow2.getCell(1).value = '';
  headerRow2.getCell(2).value = '';
  headerRow2.getCell(3).value = '';
  headerRow2.getCell(4).value = 'Certified';
  headerRow2.getCell(5).value = 'Exam Target';
  headerRow2.getCell(6).value = 'Current';
  headerRow2.getCell(7).value = 'Target';
  headerRow2.getCell(8).value = 'Current';
  headerRow2.getCell(9).value = 'Target';
  headerRow2.getCell(10).value = 'Current';
  headerRow2.getCell(11).value = 'Target';
  headerRow2.getCell(12).value = 'Current';
  headerRow2.getCell(13).value = 'Target';
  headerRow2.getCell(14).value = 'Current';
  headerRow2.getCell(15).value = 'Target';
  headerRow2.getCell(16).value = '';
  headerRow2.getCell(17).value = '';

  // Style Row 2
  for (let i = 1; i <= 17; i++) {
    const cell = headerRow2.getCell(i);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  }

  // Merge cells for Row 1 & 2
  // Session (col 1)
  worksheet.mergeCells(1, 1, 2, 1);
  // Session deadline (col 2)
  worksheet.mergeCells(1, 2, 2, 2);
  // Member Name (col 3)
  worksheet.mergeCells(1, 3, 2, 3);
  // JLPT Level (cols 4-5)
  worksheet.mergeCells(1, 4, 1, 5);
  // Grammar Count (cols 6-7)
  worksheet.mergeCells(1, 6, 1, 7);
  // Vocabulary Count (cols 8-9)
  worksheet.mergeCells(1, 8, 1, 9);
  // Kanji Count (cols 10-11)
  worksheet.mergeCells(1, 10, 1, 11);
  // Reading (min) (cols 12-13)
  worksheet.mergeCells(1, 12, 1, 13);
  // Listening (min) (cols 14-15)
  worksheet.mergeCells(1, 14, 1, 15);
  // % Complete (col 16)
  worksheet.mergeCells(1, 16, 2, 16);
  // Status (col 17)
  worksheet.mergeCells(1, 17, 2, 17);

  // Add data rows
  data.forEach((row, index) => {
    const rowNum = index + 3;
    const excelRow = worksheet.getRow(rowNum);
    excelRow.height = 22;

    const values = [
      row.session,
      row.sessionDeadline || '',
      row.memberName,
      row.certified || '-',
      row.examTarget || '-',
      row.grammarCurrent,
      row.grammarTarget,
      row.vocabularyCurrent,
      row.vocabularyTarget,
      row.kanjiCurrent,
      row.kanjiTarget,
      row.readingCurrent,
      row.readingTarget,
      row.listeningCurrent,
      row.listeningTarget,
      `${row.percentCompleteCurrent}%`,
      row.status
    ];

    for (let i = 0; i < values.length; i++) {
      const cell = excelRow.getCell(i + 1);
      cell.value = values[i];
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      // Color status column
      if (i === 16) {
        const status = row.status;
        if (status === 'Completed') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
          cell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (status === 'In Progress') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007BFF' } };
          cell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (status === 'Overdue') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } };
          cell.font = { color: { argb: 'FFFFFFFF' } };
        } else if (status === 'Upcoming') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } };
          cell.font = { color: { argb: 'FF000000' } };
        }
      }
    }
  });

  // Freeze header rows
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${finalFileName}.xlsx`);

  return { success: true, fileName: finalFileName };
}

/**
 * Export Self-Study Progress Report to CSV
 */
export async function exportSelfStudyProgressToCSV(
  data: SelfStudyProgressRow[],
  options: SelfStudyExportOptions = {}
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = options.fileName || `SelfStudy_Progress_${dateStr}`;
  const viewMode = options.viewMode || 'session';

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // For CSV, use a simple format without merged headers
  const exportData = data.map((row) => {
    const baseRow: any = {
      'Session': row.session,
      'Session Deadline': row.sessionDeadline || '',
      'Member Name': row.memberName,
      'Certified': row.certified || '-',
      'Exam Target': row.examTarget || '-',
    };

    if (viewMode === 'session') {
      baseRow['Grammar Current'] = row.grammarCurrent;
      baseRow['Grammar Target'] = row.grammarTarget;
      baseRow['Vocabulary Current'] = row.vocabularyCurrent;
      baseRow['Vocabulary Target'] = row.vocabularyTarget;
      baseRow['Kanji Current'] = row.kanjiCurrent;
      baseRow['Kanji Target'] = row.kanjiTarget;
      baseRow['Reading Current'] = row.readingCurrent;
      baseRow['Reading Target'] = row.readingTarget;
      baseRow['Listening Current'] = row.listeningCurrent;
      baseRow['Listening Target'] = row.listeningTarget;
      baseRow['% Complete'] = `${row.percentCompleteCurrent}%`;
    } else {
      baseRow['Total Grammar Current'] = row.totalGrammarCurrent;
      baseRow['Total Grammar Target'] = row.totalGrammarTarget;
      baseRow['Total Vocabulary Current'] = row.totalVocabularyCurrent;
      baseRow['Total Vocabulary Target'] = row.totalVocabularyTarget;
      baseRow['Total Kanji Current'] = row.totalKanjiCurrent;
      baseRow['Total Kanji Target'] = row.totalKanjiTarget;
      baseRow['Total Reading Current'] = row.totalReadingCurrent;
      baseRow['Total Reading Target'] = row.totalReadingTarget;
      baseRow['Total Listening Current'] = row.totalListeningCurrent;
      baseRow['Total Listening Target'] = row.totalListeningTarget;
      baseRow['% Complete (Actual)'] = `${row.percentCompleteActual}%`;
      baseRow['% Complete (Target)'] = `${row.percentCompleteTarget}%`;
    }

    baseRow['Status'] = row.status;
    return baseRow;
  });

  const worksheet = ExcelJS.utils.json_to_sheet(exportData);
  const csvContent = ExcelJS.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${finalFileName}.csv`);

  return { success: true, fileName: finalFileName };
}

/**
 * Export Self-Study Progress Report to PDF
 */
export async function exportSelfStudyProgressToPDF(
  data: SelfStudyProgressRow[],
  options: SelfStudyExportOptions = {}
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = options.fileName || `SelfStudy_Progress_${dateStr}`;
  const viewMode = options.viewMode || 'session';

  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Dynamic import for jsPDF
  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Title
  doc.setFontSize(16);
  doc.text('Self-Study Progress Report', 14, 20);

  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`View Mode: ${viewMode === 'session' ? 'Session Breakdown' : 'Overall Progress'}`, 14, 40);
  doc.text(`Total Records: ${data.length}`, 14, 50);

  // Table columns - matching UI
  const tableColumns = [
    'Session', 'Session Deadline', 'Member Name',
    'Certified', 'Exam Target',
    'Grammar', 'Vocabulary', 'Kanji', 'Reading', 'Listening',
    '% Complete', 'Status'
  ];

  const tableRows = data.map((row) => {
    if (viewMode === 'session') {
      return [
        row.session,
        row.sessionDeadline || '-',
        row.memberName,
        row.certified || '-',
        row.examTarget || '-',
        `${row.grammarCurrent}/${row.grammarTarget}`,
        `${row.vocabularyCurrent}/${row.vocabularyTarget}`,
        `${row.kanjiCurrent}/${row.kanjiTarget}`,
        `${row.readingCurrent}/${row.readingTarget}`,
        `${row.listeningCurrent}/${row.listeningTarget}`,
        `${row.percentCompleteCurrent}%`,
        row.status
      ];
    } else {
      return [
        row.session,
        row.sessionDeadline || '-',
        row.memberName,
        row.certified || '-',
        row.examTarget || '-',
        `${row.totalGrammarCurrent}/${row.totalGrammarTarget}`,
        `${row.totalVocabularyCurrent}/${row.totalVocabularyTarget}`,
        `${row.totalKanjiCurrent}/${row.totalKanjiTarget}`,
        `${row.totalReadingCurrent}/${row.totalReadingTarget}`,
        `${row.totalListeningCurrent}/${row.totalListeningTarget}`,
        `${row.percentCompleteActual}% / ${row.percentCompleteTarget}%`,
        row.status
      ];
    }
  });

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 60,
    theme: 'striped',
    headStyles: {
      fillStyle: 'fill',
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
    },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { cellWidth: 70 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
    },
    didDrawCell: (data: any) => {
      if (data.column.index === tableColumns.length - 1 && data.cell) {
        const status = data.cell.raw;
        if (status === 'Completed') {
          data.cell.styles.fillColor = [40, 167, 69];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === 'In Progress') {
          data.cell.styles.fillColor = [0, 123, 255];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === 'Overdue') {
          data.cell.styles.fillColor = [220, 53, 69];
          data.cell.styles.textColor = [255, 255, 255];
        } else if (status === 'Upcoming') {
          data.cell.styles.fillColor = [255, 193, 7];
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    }
  });

  doc.save(`${finalFileName}.pdf`);

  return { success: true, fileName: finalFileName };
}