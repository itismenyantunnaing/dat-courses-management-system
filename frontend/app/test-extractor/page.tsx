"use client";

import React, { useState, useMemo } from "react";
import { extractEmployeesFromExcel, ExtractionResult, EmployeeRow } from "@/lib/excel-extractor";

// ==========================================
// 1. EMBEDDED COMPONENT: EmployeeDataTable
// ==========================================
interface EmployeeDataTableProps {
  headers: string[];
  employees: EmployeeRow[];
}

function EmployeeDataTable({ headers, employees }: EmployeeDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showEmptyColumns, setShowEmptyColumns] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Filter out columns that are completely blank across all records unless explicitly toggled
  const activeHeaders = useMemo(() => {
    if (showEmptyColumns) return headers;
    return headers.filter((header) => {
      if (!header.startsWith("Column_")) return true;
      if (header === "Column_1" || header === "Column_2") return true;
      return employees.some((emp) => emp[header] && emp[header].trim() !== "");
    });
  }, [headers, employees, showEmptyColumns]);

  // Handle row sorting logic
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedEmployees = useMemo(() => {
    const sortableItems = [...employees];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = (a[sortConfig.key] || "").toLowerCase();
        const valB = (b[sortConfig.key] || "").toLowerCase();
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [employees, sortConfig]);

  // Global search implementation
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return sortedEmployees;
    const cleanSearch = searchTerm.toLowerCase();
    return sortedEmployees.filter((emp) => 
      Object.values(emp).some((val) => String(val).toLowerCase().includes(cleanSearch))
    );
  }, [sortedEmployees, searchTerm]);

  // Pagination calculation parameters
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  return (
    <div className="w-full space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm text-slate-100">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-white">Extracted Dataset Workbench</h2>
          <p className="text-xs text-slate-400">Showing {filteredEmployees.length} of {employees.length} records parsed across {activeHeaders.length} valid active columns.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial min-w-[240px]">
            {/* SVG Search Icon */}
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search across fields..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
            />
          </div>

          <button
            onClick={() => setShowEmptyColumns(!showEmptyColumns)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
              showEmptyColumns 
                ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" 
                : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
            }`}
          >
            {/* SVG Eye / EyeOff Icon */}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{showEmptyColumns ? "Hide Empty" : "Show All"}</span>
          </button>
        </div>
      </div>

      <div className="w-full overflow-hidden border border-slate-800 bg-slate-950 rounded-xl">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs font-semibold select-none">
                {/* ✅ FIXED: Appended column index to ensure header key uniqueness */}
                {activeHeaders.map((header, headerIdx) => {
                  const isFallbackKey = header.startsWith("Column_");
                  return (
                    <th 
                      key={`${header}-${headerIdx}`}
                      onClick={() => handleSort(header)}
                      className={`px-4 py-3.5 cursor-pointer hover:bg-slate-800 transition-colors whitespace-nowrap group ${
                        isFallbackKey ? "text-slate-500 font-mono" : "text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 max-w-xs truncate" title={header}>
                        <span>{header}</span>
                        {/* SVG Sort Icon */}
                        <svg className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, rowIdx) => (
                  <tr key={`row-${rowIdx}`} className="hover:bg-slate-900/40 transition-colors group">
                    {/* ✅ FIXED: Appended data index loops to ensure unique row cells layout */}
                    {activeHeaders.map((header, cellIdx) => {
                      const value = emp[header] || "";
                      const isFallbackKey = header.startsWith("Column_");
                      return (
                        <td 
                          key={`cell-${rowIdx}-${cellIdx}`}
                          className={`px-4 py-3 truncate max-w-md ${
                            isFallbackKey ? "text-xs font-mono text-slate-500" : "text-slate-300"
                          } ${value === "" ? "italic text-slate-600" : ""}`}
                          title={value}
                        >
                          {value === "" ? "-" : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeHeaders.length} className="text-center py-12 text-sm text-slate-500 italic">
                    No matching records discovered inside current table indexing pipelines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded focus:outline-none text-slate-300"
          >
            {[5, 10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-800 bg-slate-950 rounded-md hover:bg-slate-900 disabled:opacity-40 transition-all"
            >
              {/* SVG Left Arrow */}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-800 bg-slate-950 rounded-md hover:bg-slate-900 disabled:opacity-40 transition-all"
            >
              {/* SVG Right Arrow */}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ROOT TEST BENCH ENTRY PAGE RUNNER
// ==========================================
export default function TestExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [activeTab, setActiveTab] = useState<"table" | "json">("table");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const runExtractionTest = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const parseResult = await extractEmployeesFromExcel(file);
      setResult(parseResult);
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred during testing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
              {/* SVG Spreadsheet Icon */}
              <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel Extraction Lab Sandbox
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload your workbook to verify dynamic sheet routing, multi-tier header bypass, and raw JSON parsing output.
            </p>
          </div>
          {file && (
            <button
              onClick={runExtractionTest}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-all text-xs"
            >
              {/* SVG Refresh/Spinner Icon */}
              <svg className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" />
              </svg>
              {loading ? "Parsing Workbook..." : "Run Extraction"}
            </button>
          )}
        </div>

        {/* DRAG AND DROP BOX CONTAINER */}
        {!result && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-10 text-center max-w-xl mx-auto backdrop-blur-sm">
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl p-8 transition-colors bg-slate-950 relative group cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-slate-900 rounded-full group-hover:scale-105 transition-transform">
                  {/* SVG Upload Icon */}
                  <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {file ? file.name : "Select Target Excel Spreadsheet"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Excel worksheets (*.xlsx format)</p>
                </div>
                {file && (
                  <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    Ready ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>
            
            {file && (
              <button
                onClick={runExtractionTest}
                disabled={loading}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors"
              >
                {loading ? "Processing Workbook..." : "Begin Extraction Test"}
              </button>
            )}
          </div>
        )}

        {/* RUN METRICS BAR */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${result.success ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                {/* SVG Success/Error Indicator Check */}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {result.success ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Status Outcome</div>
                <div className="text-base font-bold text-slate-200">{result.success ? "Success" : "Extraction Failed"}</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                {/* SVG Grid Table Icon */}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Total Columns</div>
                <div className="text-base font-bold text-slate-200">{result.headers.length} Fields</div>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                {/* SVG Code Brackets Icon */}
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Employee Records</div>
                <div className="text-base font-bold text-slate-200">{result.employees.length} Records</div>
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH VIEWS SWITCHER */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab("table")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "table" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === "json" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 italic">File: {file?.name}</span>
                <label className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium rounded-lg cursor-pointer border border-slate-800 transition-colors">
                  Swap File
                  <input type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* RESULTS VIEWPORT */}
            <div className="mt-4">
              {activeTab === "table" ? (
                result.success ? (
                  <EmployeeDataTable headers={result.headers} employees={result.employees} />
                ) : (
                  <div className="p-4 bg-rose-500/5 text-rose-400 rounded-xl border border-rose-500/20 text-xs">
                    <strong>Error Parsing Grid:</strong> {result.error || "Unknown structure exception framework error."}
                  </div>
                )
              ) : (
                /* RAW Field : value FORMAT DISPLAY MODE FOR ALL EMPLOYEES */
                <div className="bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs max-h-[600px] overflow-y-auto p-6 text-indigo-300">
                  {/* ✅ FIXED: Appended object map index loops to keep unique code blocks */}
                  {result.employees.map((emp, empIdx) => (
                    <div key={`json-block-${empIdx}`} className="mb-6 last:mb-0 bg-slate-950 p-4 rounded-xl border border-slate-800/40">
                      <div className="text-[10px] text-emerald-400 font-bold mb-3 uppercase tracking-wider">// Employee Record #{empIdx + 1}</div>
                      <div className="space-y-1">
                        {Object.entries(emp).map(([field, value], innerIdx) => (
                          <div key={`json-line-${empIdx}-${innerIdx}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-0.5 hover:bg-slate-900 rounded px-1 transition-colors group">
                            <span className="text-slate-400 font-medium truncate group-hover:text-slate-300" title={field}>{field}</span>
                            <span className="text-slate-500 md:col-span-2 text-slate-200">
                              : <span className={value === "" ? "text-slate-700 italic" : "text-amber-200"}>
                                  {value === "" ? "empty" : `"${value}"`}
                                </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}