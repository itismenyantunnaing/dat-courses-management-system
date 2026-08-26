
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { FeedbackSuggestionDto } from '@/types/feedback';

// Helper function to format time for export
const formatTimeForExport = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper function to get the effective date (updatedAt or createdAt)
const getEffectiveDate = (feedbackItem: FeedbackSuggestionDto): Date => {
  if (feedbackItem.updatedAt) {
    return new Date(feedbackItem.updatedAt);
  }
  if (feedbackItem.createdAt) {
    return new Date(feedbackItem.createdAt);
  }
  return new Date(0);
};

// Helper function to get display time
const getDisplayTime = (feedbackItem: FeedbackSuggestionDto): string => {
  const date = getEffectiveDate(feedbackItem);
  return formatTimeForExport(date.toISOString());
};

// Helper function to get category label
const getCategoryLabel = (category?: string): string => {
  if (!category) return 'N/A';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

/**
 * Export feedback data to Excel (.xlsx) format
 */
export async function exportFeedbackToExcel(
  feedbackData: FeedbackSuggestionDto[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Feedback_${dateStr}`;

  if (!feedbackData || feedbackData.length === 0) {
    throw new Error('No feedback data to export');
  }

  const exportData = feedbackData.map((feedback: FeedbackSuggestionDto, index: number) => ({
    'Sr.': index + 1,
    'Employee ID': feedback.employeeId || 'N/A',
    'Employee Name': feedback.employeeName || 'N/A',
    'Department': feedback.department || 'N/A',
    'Team': feedback.team || 'N/A',
    'Subject': feedback.subject || 'N/A',
    'Category': getCategoryLabel(feedback.category),
    'Description': feedback.description || 'N/A',
    'Created At': formatTimeForExport(feedback.createdAt),
    'Last Updated': getDisplayTime(feedback),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  const columnWidths = [
    { wch: 8 },   // Sr.
    { wch: 15 },  // Employee ID
    { wch: 25 },  // Employee Name
    { wch: 20 },  // Department
    { wch: 20 },  // Team
    { wch: 35 },  // Subject
    { wch: 20 },  // Category
    { wch: 50 },  // Description
    { wch: 25 },  // Created At
    { wch: 25 },  // Last Updated
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');
  
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${finalFileName}.xlsx`);
}

/**
 * Export feedback data to CSV format
 */
export async function exportFeedbackToCSV(
  feedbackData: FeedbackSuggestionDto[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Feedback_${dateStr}`;

  if (!feedbackData || feedbackData.length === 0) {
    throw new Error('No feedback data to export');
  }

  const exportData = feedbackData.map((feedback: FeedbackSuggestionDto, index: number) => ({
    'Sr.': index + 1,
    'Employee ID': feedback.employeeId || 'N/A',
    'Employee Name': feedback.employeeName || 'N/A',
    'Department': feedback.department || 'N/A',
    'Team': feedback.team || 'N/A',
    'Subject': feedback.subject || 'N/A',
    'Category': getCategoryLabel(feedback.category),
    'Description': feedback.description || 'N/A',
    'Created At': formatTimeForExport(feedback.createdAt),
    'Last Updated': getDisplayTime(feedback),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${finalFileName}.csv`);
}

/**
 * Export feedback data to PDF format
 */
export async function exportFeedbackToPDF(
  feedbackData: FeedbackSuggestionDto[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Feedback_${dateStr}`;

  if (!feedbackData || feedbackData.length === 0) {
    throw new Error('No feedback data to export');
  }

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Add header
  doc.setFontSize(16);
  doc.text('Feedback Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Feedbacks: ${feedbackData.length}`, 14, 40);

  // Prepare table data - match the table view from FeedbackContainer
  const tableHeaders = [
    'Sr.',
    'Employee',
    'Department',
    'Team',
    'Subject',
    'Category',
    'Description',
    'Last Updated'
  ];

  const tableRows = feedbackData.map((feedback: FeedbackSuggestionDto, index: number) => {
    const employeeDisplay = feedback.employeeName 
      ? `${feedback.employeeName}\n(${feedback.employeeId || 'N/A'})`
      : `Employee ${feedback.employeeId || 'N/A'}`;

    return [
      index + 1,
      employeeDisplay,
      feedback.department || 'N/A',
      feedback.team || 'N/A',
      feedback.subject || 'N/A',
      getCategoryLabel(feedback.category),
      feedback.description || 'N/A',
      getDisplayTime(feedback)
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 50,
    theme: 'striped',
    headStyles: { 
      fillStyle: 'fill', 
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    styles: { 
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 30 },     // Sr.
      1: { cellWidth: 100 },    // Employee
      2: { cellWidth: 80 },     // Department
      3: { cellWidth: 80 },     // Team
      4: { cellWidth: 120 },    // Subject
      5: { cellWidth: 70 },     // Category
      6: { cellWidth: 150 },    // Description
      7: { cellWidth: 80 },     // Last Updated
    },
    bodyStyles: {
      valign: 'middle',
    },
    didDrawCell: function(data) {
      // Add border style to match table view
      if (data.section === 'body') {
        // You can add custom cell styling if needed
      }
    }
  });

  doc.save(`${finalFileName}.pdf`);
}

/**
 * Export feedback data in all formats (Excel, CSV, PDF)
 * Useful for batch export options
 */
export async function exportFeedbackAllFormats(
  feedbackData: FeedbackSuggestionDto[],
  baseFileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalBaseName = baseFileName || `Feedback_${dateStr}`;

  // Export all formats
  await Promise.all([
    exportFeedbackToExcel(feedbackData, finalBaseName),
    exportFeedbackToCSV(feedbackData, finalBaseName),
    exportFeedbackToPDF(feedbackData, finalBaseName),
  ]);

  return `Exported ${feedbackData.length} feedback entries in all formats (Excel, CSV, PDF)`;
}

/**
 * Export filtered/sorted feedback data
 * This matches the filteredAndSortedFeedbacks from FeedbackContainer
 */
export async function exportFilteredFeedback(
  feedbackData: FeedbackSuggestionDto[],
  options?: {
    fileName?: string;
    format?: 'excel' | 'csv' | 'pdf' | 'all';
  }
) {
  const { fileName, format = 'excel' } = options || {};

  if (!feedbackData || feedbackData.length === 0) {
    throw new Error('No feedback data to export');
  }

  switch (format) {
    case 'excel':
      await exportFeedbackToExcel(feedbackData, fileName);
      break;
    case 'csv':
      await exportFeedbackToCSV(feedbackData, fileName);
      break;
    case 'pdf':
      await exportFeedbackToPDF(feedbackData, fileName);
      break;
    case 'all':
      await exportFeedbackAllFormats(feedbackData, fileName);
      break;
    default:
      await exportFeedbackToExcel(feedbackData, fileName);
  }

  return `Exported ${feedbackData.length} feedback entries as ${format.toUpperCase()}`;
}