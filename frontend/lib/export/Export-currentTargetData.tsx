// lib/export/Export-currentTargetData.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export current target data to Excel format
 * Matches the UI table structure in CurrentTargetContainer
 */
export async function exportCurrentTargetToExcel(
  employeeJapaneseLevel_Data: any[],
  employee_data: any[],
  targetDates_Data: any[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `CurrentTarget_${dateStr}`;

  if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
    throw new Error('No current target data to export');
  }

  // Create a map for quick employee lookup
  const employeeMap = new Map();
  employee_data.forEach((emp: any) => {
    employeeMap.set(emp.id, emp);
  });

  // Get target dates for dynamic headers
  const targetDate = targetDates_Data?.[0] || null;
  
  const formatGroupDate = (date: any): string => {
    if (!date) return "TBD";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "TBD";
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  // Dynamic target dates
  const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
  const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
  const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

  // Employee Headers (matching UI exactly)
  const employeeHeaders = [
    "Sr",
    "Staff ID",
    "Name",
    "Email",
    "Post",
    "Team",
    "Dept",
    "JLPT / NAT Test"
  ];

  // Japanese Groups matching UI
  const japaneseGroups = [
    { 
      name: "Certified Level", 
      children: [
        "JLPT Highest Level (Certified)",
        "Other Highest Japanese Level (Certified) if any",
        "Preferred Joining Group & Level"
      ] 
    },
    { 
      name: "Current", 
      children: ["Communication Level"] 
    },
    { 
      name: `Target Level to be on ${target1Date}`, 
      children: [
        "JLPT / NAT Test Level",
        "Communication Level"
      ] 
    },
    { 
      name: `Target Level to be on ${target2Date}`, 
      children: [
        "JLPT / NAT Test Level",
        "Communication Level"
      ] 
    },
    { 
      name: "Current Learning Level and Method", 
      children: [
        "Japanese Level (Current Learning)",
        "Learning Method"
      ] 
    },
    { 
      name: "JLPT Exam Target", 
      children: [
        `Want to sit JLPT exam on ${examDateStr}`,
        "If Yes, Which Level?",
        "Confidence Level to Pass Exam"
      ] 
    }
  ];

  // Row 1: Group Headers (spans across children)
  const row1: any[] = [];
  
  // Employee headers - empty for row 1 (will be merged vertically with row 2)
  employeeHeaders.forEach(() => {
    row1.push("");
  });
  
  // Japanese group headers with horizontal merging
  japaneseGroups.forEach(group => {
    // Push the group name once
    row1.push(group.name);
    // Push empty strings for remaining children (will be merged)
    for (let i = 1; i < group.children.length; i++) {
      row1.push("");
    }
  });

  // Row 2: Sub Headers (all individual columns)
  const row2 = [...employeeHeaders];
  japaneseGroups.forEach(group => {
    group.children.forEach(child => {
      row2.push(child);
    });
  });

  // Data rows
  const dataRows = employeeJapaneseLevel_Data.map((profile: any, index: number) => {
    const employee = employeeMap.get(profile.employee_id || profile.employeeId);
    return [
      index + 1,  // Sr
      employee?.id || profile.employee_id || profile.employeeId || '',
      employee?.name || '',
      employee?.email || '',
      employee?.position || '',
      employee?.team || '',
      employee?.dept_dat || '',
      profile.jlptNatTest || '',
      profile.jlptHighestLevel || '',
      profile.otherJapaneseLevel || '',
      profile.preferredLearningGroup || '',
      profile.currentCommunicationLevel || '',
      profile.target1JlptNatLevel || '',
      profile.target1CommunicationLevel || '',
      profile.target2JlptNatLevel || '',
      profile.target2CommunicationLevel || '',
      profile.currentLearningLevel || '',
      profile.learningMethod || '',
      profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
      profile.examTargetLevel || '',
      profile.confidenceLevel || '',
    ];
  });

  // Combine all rows
  const allRows = [row1, row2, ...dataRows];
  
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);

  // Set up merges
  const merges: any[] = [];

  // Merge employee headers vertically (row 1 & 2)
  for (let i = 0; i < employeeHeaders.length; i++) {
    merges.push({ s: { r: 0, c: i }, e: { r: 1, c: i } });
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
    worksheet[cellAddress] = { v: employeeHeaders[i], t: 's' };
  }

  // Merge Japanese groups horizontally in row 1
  let currentCol = employeeHeaders.length;
  japaneseGroups.forEach(group => {
    if (group.children.length > 1) {
      merges.push({ 
        s: { r: 0, c: currentCol }, 
        e: { r: 0, c: currentCol + group.children.length - 1 } 
      });
    }
    currentCol += group.children.length;
  });

  worksheet['!merges'] = merges;

  // Set column widths (matching UI column sizes)
  const columnWidths = [
    { wch: 5 },   // Sr
    { wch: 15 },  // Staff ID
    { wch: 25 },  // Name
    { wch: 30 },  // Email
    { wch: 15 },  // Post
    { wch: 15 },  // Team
    { wch: 15 },  // Dept
    { wch: 18 },  // JLPT / NAT Test
    { wch: 25 },  // JLPT Highest Level
    { wch: 35 },  // Other Japanese Level
    { wch: 25 },  // Preferred Group
    { wch: 20 },  // Communication Level
    { wch: 22 },  // Target 1 JLPT
    { wch: 22 },  // Target 1 Comm
    { wch: 22 },  // Target 2 JLPT
    { wch: 22 },  // Target 2 Comm
    { wch: 25 },  // Learning Level
    { wch: 35 },  // Learning Method
    { wch: 30 },  // Want to sit exam
    { wch: 18 },  // Exam Target Level
    { wch: 25 }   // Confidence Level
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Current Target");
  
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, `${finalFileName}.xlsx`);
}

/**
 * Export current target data to CSV format
 */
export async function exportCurrentTargetToCSV(
  employeeJapaneseLevel_Data: any[],
  employee_data: any[],
  targetDates_Data: any[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `CurrentTarget_${dateStr}`;

  if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
    throw new Error('No current target data to export');
  }

  const employeeMap = new Map();
  employee_data.forEach((emp: any) => {
    employeeMap.set(emp.id, emp);
  });

  const targetDate = targetDates_Data?.[0] || null;
  
  const formatGroupDate = (date: any): string => {
    if (!date) return "TBD";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "TBD";
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
  const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
  const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

  const employeeHeaders = [
    "Sr",
    "Staff ID",
    "Name",
    "Email",
    "Post",
    "Team",
    "Dept",
    "JLPT / NAT Test"
  ];

  const japaneseGroups = [
    { 
      name: "Certified Level", 
      children: [
        "JLPT Highest Level (Certified)",
        "Other Highest Japanese Level (Certified) if any",
        "Preferred Joining Group & Level"
      ] 
    },
    { 
      name: "Current", 
      children: ["Communication Level"] 
    },
    { 
      name: `Target Level to be on ${target1Date}`, 
      children: [
        "JLPT / NAT Test Level",
        "Communication Level"
      ] 
    },
    { 
      name: `Target Level to be on ${target2Date}`, 
      children: [
        "JLPT / NAT Test Level",
        "Communication Level"
      ] 
    },
    { 
      name: "Current Learning Level and Method", 
      children: [
        "Japanese Level (Current Learning)",
        "Learning Method"
      ] 
    },
    { 
      name: "JLPT Exam Target", 
      children: [
        `Want to sit JLPT exam on ${examDateStr}`,
        "If Yes, Which Level?",
        "Confidence Level to Pass Exam"
      ] 
    }
  ];

  const row1: any[] = [];
  employeeHeaders.forEach(() => row1.push(""));
  japaneseGroups.forEach(group => {
    row1.push(group.name);
    for (let i = 1; i < group.children.length; i++) {
      row1.push("");
    }
  });

  const row2 = [...employeeHeaders];
  japaneseGroups.forEach(group => {
    group.children.forEach(child => {
      row2.push(child);
    });
  });

  const dataRows = employeeJapaneseLevel_Data.map((profile: any, index: number) => {
    const employee = employeeMap.get(profile.employee_id || profile.employeeId);
    return [
      index + 1,
      employee?.id || profile.employee_id || profile.employeeId || '',
      employee?.name || '',
      employee?.email || '',
      employee?.position || '',
      employee?.team || '',
      employee?.dept_dat || '',
      profile.jlptNatTest || '',
      profile.jlptHighestLevel || '',
      profile.otherJapaneseLevel || '',
      profile.preferredLearningGroup || '',
      profile.currentCommunicationLevel || '',
      profile.target1JlptNatLevel || '',
      profile.target1CommunicationLevel || '',
      profile.target2JlptNatLevel || '',
      profile.target2CommunicationLevel || '',
      profile.currentLearningLevel || '',
      profile.learningMethod || '',
      profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
      profile.examTargetLevel || '',
      profile.confidenceLevel || '',
    ];
  });

  const allRows = [row1, row2, ...dataRows];
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${finalFileName}.csv`);
}

/**
 * Export current target data to PDF format
 * Uses a clean single header row with proper column headers
 */
export async function exportCurrentTargetToPDF(
  employeeJapaneseLevel_Data: any[],
  employee_data: any[],
  targetDates_Data: any[],
  fileName?: string
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const finalFileName = fileName || `CurrentTarget_${dateStr}`;

  if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
    throw new Error('No current target data to export');
  }

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);

  const { default: jsPDF } = jsPDFModule;
  const autoTable = autoTableModule.default;

  const employeeMap = new Map();
  employee_data.forEach((emp: any) => {
    employeeMap.set(emp.id, emp);
  });

  // Get target dates for dynamic headers
  const targetDate = targetDates_Data?.[0] || null;
  
  const formatGroupDate = (date: any): string => {
    if (!date) return "TBD";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "TBD";
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const target1Date = targetDate?.target1Date ? formatGroupDate(targetDate.target1Date) : "Target 1";
  const target2Date = targetDate?.target2Date ? formatGroupDate(targetDate.target2Date) : "Target 2";
  const examDateStr = targetDate?.examDate ? formatGroupDate(targetDate.examDate) : "Exam Date";

  // Define all columns as a flat list for PDF
  const allColumns = [
    "Sr",
    "Staff ID",
    "Name",
    "Email",
    "Post",
    "Team",
    "Dept",
    "JLPT / NAT Test",
    "JLPT Highest Level (Certified)",
    "Other Highest Japanese Level (Certified) if any",
    "Preferred Joining Group & Level",
    "Communication Level",
    `Target Level to be on ${target1Date}: JLPT / NAT Test Level`,
    `Target Level to be on ${target1Date}: Communication Level`,
    `Target Level to be on ${target2Date}: JLPT / NAT Test Level`,
    `Target Level to be on ${target2Date}: Communication Level`,
    "Japanese Level (Current Learning)",
    "Learning Method",
    `Want to sit JLPT exam on ${examDateStr}`,
    "If Yes, Which Level?",
    "Confidence Level to Pass Exam"
  ];

  // Data rows
  const dataRows = employeeJapaneseLevel_Data.map((profile: any, index: number) => {
    const employee = employeeMap.get(profile.employee_id || profile.employeeId);
    return [
      index + 1,
      employee?.id || profile.employee_id || profile.employeeId || '',
      employee?.name || '',
      employee?.email || '',
      employee?.position || '',
      employee?.team || '',
      employee?.dept_dat || '',
      profile.jlptNatTest || '',
      profile.jlptHighestLevel || '',
      profile.otherJapaneseLevel || '',
      profile.preferredLearningGroup || '',
      profile.currentCommunicationLevel || '',
      profile.target1JlptNatLevel || '',
      profile.target1CommunicationLevel || '',
      profile.target2JlptNatLevel || '',
      profile.target2CommunicationLevel || '',
      profile.currentLearningLevel || '',
      profile.learningMethod || '',
      profile.wantToSitExam === true ? "Yes" : profile.wantToSitExam === false ? "No" : "-",
      profile.examTargetLevel || '',
      profile.confidenceLevel || '',
    ];
  });

  // Create PDF with landscape orientation
  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Add title
  doc.setFontSize(16);
  doc.text("Current Target Report", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  doc.text(`Total Records: ${employeeJapaneseLevel_Data.length}`, 14, 40);

  // Create table with flat headers
  autoTable(doc, {
    head: [allColumns],
    body: dataRows,
    startY: 50,
    theme: 'striped',
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center'
    },
    styles: { 
      fontSize: 7, 
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 20 },  // Sr
      1: { cellWidth: 45 },  // Staff ID
      2: { cellWidth: 60 },  // Name
      3: { cellWidth: 60 },  // Email
      4: { cellWidth: 35 },  // Post
      5: { cellWidth: 35 },  // Team
      6: { cellWidth: 35 },  // Dept
      7: { cellWidth: 40 },  // JLPT Test
      8: { cellWidth: 50 },  // Highest Level
      9: { cellWidth: 55 },  // Other Level
      10: { cellWidth: 45 }, // Preferred Group
      11: { cellWidth: 40 }, // Comm Level
      12: { cellWidth: 45 }, // Target 1 JLPT
      13: { cellWidth: 45 }, // Target 1 Comm
      14: { cellWidth: 45 }, // Target 2 JLPT
      15: { cellWidth: 45 }, // Target 2 Comm
      16: { cellWidth: 45 }, // Learning Level
      17: { cellWidth: 50 }, // Method
      18: { cellWidth: 45 }, // Sit exam
      19: { cellWidth: 35 }, // Level
      20: { cellWidth: 40 }, // Confidence
    },
    didDrawPage: function (data) {
      // Add page number at the bottom
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

  doc.save(`${finalFileName}.pdf`);
}