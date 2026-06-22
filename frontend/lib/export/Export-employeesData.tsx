// lib/Export-employees.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Employee } from '@/types/employee';

export async function exportEmployeesToExcel(
  employee_data: Employee[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Employees_${dateStr}`;

  if (!employee_data || employee_data.length === 0) {
    throw new Error('No employee data to export');
  }

  // Prepare data for export
  const exportData = employee_data.map((employee: Employee, index: number) => ({
    "Sr.": index + 1,
    "Staff ID": employee.id || '',
    "Name": employee.name || '',
    "Email": employee.email || '',
    "Division": employee.div_name || '',
    "Department": employee.dept_dat || '',
    "Team": employee.team || '',
    "Role": employee.role || '',
    "Status": employee.emp_status || employee.status || 'Active',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const columnWidths = [
    { wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 30 },
    { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 12 }
  ];
  worksheet['!cols'] = columnWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${finalFileName}.xlsx`);
}

export async function exportEmployeesToCSV(
  employee_data: Employee[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Employees_${dateStr}`;

  if (!employee_data || employee_data.length === 0) {
    throw new Error('No employee data to export');
  }

  const exportData = employee_data.map((employee: Employee, index: number) => ({
    "Sr.": index + 1,
    "Staff ID": employee.id || '',
    "Name": employee.name || '',
    "Email": employee.email || '',
    "Division": employee.div_name || '',
    "Department": employee.dept_dat || '',
    "Team": employee.team || '',
    "Role": employee.role || '',
    "Status": employee.emp_status || employee.status || 'Active',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${finalFileName}.csv`);
}

export async function exportEmployeesToPDF(
  employee_data: Employee[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `Employees_${dateStr}`;

  if (!employee_data || employee_data.length === 0) {
    throw new Error('No employee data to export');
  }

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  doc.text("Employees Report", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Employees: ${employee_data.length}`, 14, 40);

  const tableColumn = ["Sr.", "Staff ID", "Name", "Email", "Division", "Department", "Team", "Role", "Status"];
  const tableRows = employee_data.map((employee: Employee, index: number) => [
    index + 1,
    employee.id || '',
    employee.name || '',
    employee.email || '',
    employee.div_name || '',
    employee.dept_dat || '',
    employee.team || '',
    employee.role || '',
    employee.emp_status || employee.status || 'Active'
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 50,
    theme: 'striped',
    headStyles: { fillStyle: 'fill', fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { cellWidth: 80 },
      3: { cellWidth: 80 },
      4: { cellWidth: 60 },
      5: { cellWidth: 70 },
      6: { cellWidth: 50 },
      7: { cellWidth: 50 },
      8: { cellWidth: 45 },
    }
  });

  doc.save(`${finalFileName}.pdf`);
}