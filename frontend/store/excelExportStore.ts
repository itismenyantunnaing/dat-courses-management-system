import { create } from "zustand";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ExcelExportStore {
  exportDashboard: () => void;
  exportProgress: (courseId: number) => void;
}

export const excelExportStore = create<ExcelExportStore>(() => ({
  exportDashboard: () => {
    // Navigate to URL - browser handles the download automatically
    window.location.href = `${apiUrl}/api/excel/export-dashboard`;
  },

  exportProgress: (courseId: number) => {
    window.location.href = `${apiUrl}/api/excel/progress/${courseId}`;
  },
}));