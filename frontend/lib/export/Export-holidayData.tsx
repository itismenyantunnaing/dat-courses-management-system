// lib/Export-holidays.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Holiday } from '@/types/holiday';

export async function exportHolidaysToExcel(
  holiday_data: Holiday[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Holidays_${dateStr}`;

  if (!holiday_data || holiday_data.length === 0) {
    throw new Error('No holiday data to export');
  }

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getStatusLabel = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    if (holidayDate < today) return "Passed";
    if (holidayDate.toDateString() === today.toDateString()) return "Today";
    return "Upcoming";
  };

  const exportData = holiday_data.map((holiday: Holiday, index: number) => ({
    "Sr.": index + 1,
    "Holiday Name": holiday.holidayName || "",
    "Date": new Date(holiday.holidayDate).toLocaleDateString(),
    "Day": getDayName(holiday.holidayDate),
    "Status": getStatusLabel(holiday.holidayDate),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const columnWidths = [
    { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Holidays");
  
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${finalFileName}.xlsx`);
}

export async function exportHolidaysToCSV(
  holiday_data: any[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Holidays_${dateStr}`;

  if (!holiday_data || holiday_data.length === 0) {
    throw new Error('No holiday data to export');
  }

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getStatusLabel = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    if (holidayDate < today) return "Passed";
    if (holidayDate.toDateString() === today.toDateString()) return "Today";
    return "Upcoming";
  };

  const exportData = holiday_data.map((holiday: Holiday, index: number) => ({
    "Sr.": index + 1,
    "Holiday Name": holiday.holidayName || "",
    "Date": new Date(holiday.holidayDate).toLocaleDateString(),
    "Day": getDayName(holiday.holidayDate),
    "Status": getStatusLabel(holiday.holidayDate),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${finalFileName}.csv`);
}

export async function exportHolidaysToPDF(
  holiday_data: Holiday[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Holidays_${dateStr}`;

  if (!holiday_data || holiday_data.length === 0) {
    throw new Error('No holiday data to export');
  }

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getStatusLabel = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    if (holidayDate < today) return "Passed";
    if (holidayDate.toDateString() === today.toDateString()) return "Today";
    return "Upcoming";
  };

  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.text("Holidays Report", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Holidays: ${holiday_data.length}`, 14, 40);

  const tableColumn = ["Sr.", "Holiday Name", "Date", "Day", "Status"];
  const tableRows = holiday_data.map((holiday: Holiday, index: number) => [
    index + 1,
    holiday.holidayName || "",
    new Date(holiday.holidayDate).toLocaleDateString(),
    getDayName(holiday.holidayDate),
    getStatusLabel(holiday.holidayDate)
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: 'striped',
    headStyles: { fillStyle: 'fill', fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 150 },
      2: { cellWidth: 80 },
      3: { cellWidth: 80 },
      4: { cellWidth: 60 },
    }
  });

  doc.save(`${finalFileName}.pdf`);
}