import {
  UserGroupIcon,
  CodeIcon,
  CourseIcon,
  CalendarIcon,
  TrendingUp,
} from "@hugeicons/core-free-icons"
import { extractHolidayDataFromExcel } from "@/lib/Excel-extractor-Holiday"
import { extractEmployeeDataFromExcel, validateEmployeeData, EmployeeExcelData } from "@/lib/Excel-extractor-Employee"
import { extractCurrentTargetDataFromExcel, transformToApiFormat, validateCurrentTargetData } from "@/lib/Excel-extractor-currentTarget";
import { exportEmployeesToExcel, exportEmployeesToCSV, exportEmployeesToPDF } from "@/lib/export/Export-employeesData";
import { exportSkillsToCSV, exportSkillsToExcel, exportSkillsToPDF } from "@/lib/export/Export-skillsetData";
import { exportHolidaysToExcel, exportHolidaysToCSV, exportHolidaysToPDF } from "@/lib/export/Export-holidayData";
import { exportCurrentTargetToExcel, exportCurrentTargetToCSV, exportCurrentTargetToPDF } from "@/lib/export/Export-currentTargetData";

export const allTabs = [
  {
    id: "employees",
    label: "Employees",
    importTitle: "Import Employees Data",
    importDescription: "Upload employee data file to import into the system. The system will automatically detect headers like Staff ID, Name, Dept, Team, etc.",
    exportTitle: "Export Employees Data",
    exportDescription: "Export employee data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: UserGroupIcon,
    maxSize: 500,
    onImport: async (file: File) => {
      try {
        const startTime = performance.now();

        // Extract employee data from Excel
        const employeeData = await extractEmployeeDataFromExcel(file);

        if (employeeData.length === 0) {
          alert('No employee data found in the Excel file. Please check the data.');
          return { success: false, message: 'No data found' };
        }

        // Validate the data
        const { valid, invalid } = validateEmployeeData(employeeData);

        // Handle invalid rows
        if (invalid.length > 0) {
          const shouldContinue = confirm(
            `⚠️ ${invalid.length} rows have missing or invalid data.\n\n` +
            `Valid rows: ${valid.length}\n` +
            `Invalid rows: ${invalid.length}\n\n` +
            `Continue with ${valid.length} valid rows?`
          );

          if (!shouldContinue) {
            return { success: false, message: 'Import cancelled by user' };
          }
        }

        if (valid.length === 0) {
          alert('No valid employee records found. Please check the data.');
          return { success: false, message: 'No valid data' };
        }

        const shouldProceed = confirm(
          `You are about to import ${valid.length} employees into the database. This may take a few moments. Continue?`
        );

        if (!shouldProceed) {
          return { success: false, message: 'Import cancelled by user' };
        }

        // Prepare employee data for bulk insert
        const employeeDtos = valid.map((item: EmployeeExcelData) => ({
          id: item.staffId?.trim() || '',
          name: item.name?.trim() || '',
          email: '',
          doorlog: item.doorLog?.trim() || '',
          position: item.position?.trim() || '',
          status: item.status?.trim() || 'active',
          div_name: item.div?.trim() || '',
          dept_dat: item.dept?.trim() || '',
          team: item.team?.trim() || '',
          role: item.role?.trim() || '',
          emp_status: 'active',
          is_core_personnel: false,
          has_japan_business_trip: false,
          noti_setting: true,
          dob: '',
          profile_photo_path: '',
        }));

        // Access store via window
        const store = (window as any).mainStore?.getState();
        if (!store || !store.bulkCreate_EmployeeData) {
          throw new Error('System store not initialized. Please refresh and try again.');
        }

        // Import in smaller batches for better reliability
        const BATCH_SIZE = 50;
        let importedCount = 0;
        const failedRecords: { id: string; name: string }[] = [];

        for (let i = 0; i < employeeDtos.length; i += BATCH_SIZE) {
          const batch = employeeDtos.slice(i, i + BATCH_SIZE);

          try {
            await store.bulkCreate_EmployeeData(batch);
            importedCount += batch.length;
          } catch (error) {
            // Try to import failed batch one by one
            for (let j = 0; j < batch.length; j++) {
              try {
                await store.bulkCreate_EmployeeData([batch[j]]);
                importedCount++;
              } catch (retryError) {
                failedRecords.push({
                  id: batch[j].id || 'MISSING',
                  name: batch[j].name || 'MISSING'
                });
              }
            }
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);

        // Build the result message
        let message = `Successfully imported ${importedCount} out of ${employeeDtos.length} employees in ${totalTime}s!`;

        if (invalid.length > 0) {
          message += ` Skipped ${invalid.length} invalid rows.`;
        }

        if (failedRecords.length > 0) {
          // Create a detailed list of failed records for the alert
          const failedList = failedRecords
            .map((record, index) => `${index + 1}. ID: ${record.id}, Name: ${record.name}`)
            .join('\n');

          message += `\n\n❌ ${failedRecords.length} records failed to import:\n${failedList}`;
        }

        alert(`✅ ${message}`);

        return {
          success: importedCount > 0,
          message: message,
          details: {
            total: employeeDtos.length,
            imported: importedCount,
            invalid: invalid.length,
            failedRecords: failedRecords.length
          }
        };

      } catch (error) {
        console.error('❌ Employee import error:', error);
        alert(`❌ Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting employees data as ${format}`);

      // Get data from store
      const store = (window as any).mainStore?.getState();
      const { employee_data } = store || { employee_data: [] };

      if (!employee_data || employee_data.length === 0) {
        alert("No employee data to export");
        return;
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportEmployeesToExcel(employee_data);
        } else if (format === "csv") {
          await exportEmployeesToCSV(employee_data);
        } else if (format === "pdf") {
          await exportEmployeesToPDF(employee_data);
        } else {
          console.log(`Exporting employees data as ${format}`);
          alert(`Export format "${format}" is not supported for employees.`);
        }
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert(`Failed to export employees data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting employees data", selectedItems)
    },
  },
  {
    id: "courses",
    label: "Courses",
    importTitle: "Import Courses Data",
    importDescription: "Upload course data file to import into the system.",
    exportTitle: "Export Courses Data",
    exportDescription: "Export course data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: CourseIcon,
    maxSize: 500,
    onImport: (file: File) => {
      console.log("📤 Importing courses data:", file.name)
      alert('Course import coming soon!')
      return { success: true, message: 'Course import coming soon!' }
    },
    onExport: (format: string) => {
      console.log(`📤 Exporting courses data as ${format}`)
      alert('Course export coming soon!')
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting courses data", selectedItems)
    },
  },
  {
    id: "skills",
    label: "Skills",
    importTitle: "Import Skills Data",
    importDescription: "Upload skill data file to import into the system.",
    exportTitle: "Export Skills Data",
    exportDescription: "Export skill data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: CodeIcon,
    maxSize: 500,
    onImport: (file: File) => {
      console.log("📤 Importing skills data:", file.name)
      alert('Skills import coming soon!')
      return { success: true, message: 'Skills import coming soon!' }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting skills data as ${format}`);

      // Get data from store
      const store = (window as any).mainStore?.getState();
      if (!store) {
        alert("System store not initialized. Please refresh and try again.");
        return;
      }

      const {
        employee_data,
        skill_headers,
        skillData,
        devCap_headers,
        devCap_data,
        languageSkill_data,
        managementScores_Data
      } = store;

      if (!employee_data || employee_data.length === 0) {
        alert("No employee data to export");
        return;
      }

      try {
        const exportData = {
          employee_data,
          skill_headers,
          skillData,
          devCap_headers,
          devCap_data,
          languageSkill_data,
          managementScores_Data
        };

        const options = {
          showAdministrator: true,
          showDeveloper: true,
          showTechnicalAbility: true,
          fileName: `Skills_Report_${new Date().toISOString().split('T')[0]}`
        };

        if (format === "excel" || format === "xlsx") {
          await exportSkillsToExcel(exportData, options);
        } else if (format === "csv") {
          await exportSkillsToCSV(exportData, options);
        } else if (format === "pdf") {
          await exportSkillsToPDF(exportData, options);
        } else {
          alert(`Export format "${format}" is not supported for skills data.`);
        }

        console.log('✅ Skills exported successfully');
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert(`Failed to export skills data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting skills data", selectedItems)
    },
  },
  {
    id: "current_target_data",
    label: "Current target",
    importTitle: "Import Current Target Data",
    importDescription: "Upload current target data file to import into the system. The system will automatically detect headers like Staff ID, JLPT / NAT Test, JLPT Highest Level, Communication Level, etc.",
    exportTitle: "Export Current Target Data",
    exportDescription: "Export current target data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: TrendingUp,
    maxSize: 500,
    onImport: async (file: File) => {
      console.log("📤 Importing current target data from:", file.name);
      console.log("=".repeat(60));

      try {
        const startTime = performance.now();

        // Extract current target data from Excel
        const extractedData = await extractCurrentTargetDataFromExcel(file);

        if (!extractedData.success || extractedData.data.length === 0) {
          alert('No current target data found in the Excel file. Please check the data.');
          return { success: false, message: extractedData.error || 'No data found' };
        }

        console.log(`📊 Extracted ${extractedData.data.length} records in ${(performance.now() - startTime).toFixed(0)}ms`);

        // Validate the data
        const validationStart = performance.now();
        const { valid, invalid } = validateCurrentTargetData(extractedData.data);
        console.log(`✅ Validation completed in ${(performance.now() - validationStart).toFixed(0)}ms`);

        // Log all invalid rows with details
        if (invalid.length > 0) {
          console.warn(`⚠️ ${invalid.length} invalid rows found:`);
          console.table(invalid.map((item, index) => ({
            Row: index + 1,
            StaffId: item.data["Staff ID"] || 'MISSING',
            Errors: item.errors.join('; ')
          })));

          const shouldContinue = confirm(
            `⚠️ ${invalid.length} rows have missing or invalid data.\n\n` +
            `Valid rows: ${valid.length}\n` +
            `Invalid rows: ${invalid.length}\n\n` +
            `Continue with ${valid.length} valid rows?`
          );

          if (!shouldContinue) {
            return { success: false, message: 'Import cancelled by user' };
          }
        }

        if (valid.length === 0) {
          alert('No valid current target records found. Please check the data.');
          return { success: false, message: 'No valid data' };
        }

        const shouldProceed = confirm(
          `You are about to import ${valid.length} current target profiles into the database. This may take a few moments. Continue?`
        );

        if (!shouldProceed) {
          return { success: false, message: 'Import cancelled by user' };
        }

        // Transform to API format
        const apiData = transformToApiFormat(valid);

        // Access store via window
        const store = (window as any).mainStore?.getState();
        if (!store || !store.bulkCreate_CurrentTargetData) {
          throw new Error('System store not initialized. Please refresh and try again.');
        }

        // Import in smaller batches for better reliability
        const BATCH_SIZE = 50;
        let importedCount = 0;
        const totalBatches = Math.ceil(apiData.length / BATCH_SIZE);

        console.log(`🔄 Starting import with ${totalBatches} batches of ${BATCH_SIZE} records each`);
        console.log("=".repeat(60));

        for (let i = 0; i < apiData.length; i += BATCH_SIZE) {
          const batch = apiData.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const startIndex = i;

          console.log(`\n📦 Processing Batch ${batchNumber}/${totalBatches}`);

          try {
            await store.bulkCreate_CurrentTargetData(batch);
            importedCount += batch.length;
            console.log(`✅ Batch ${batchNumber} completed successfully`);
          } catch (error) {
            console.error(`❌ Batch ${batchNumber} failed:`, error);

            // Try to import failed batch one by one to identify problematic records
            console.log(`🔄 Retrying batch ${batchNumber} records individually...`);

            for (let j = 0; j < batch.length; j++) {
              const recordIndex = startIndex + j;
              try {
                await store.bulkCreate_CurrentTargetData([batch[j]]);
                importedCount++;
                console.log(`   ✅ Record ${recordIndex + 1} (${batch[j].employeeId || 'NO_ID'}) imported successfully`);
              } catch (retryError) {
                console.error(`   ❌ Record ${recordIndex + 1} failed permanently:`, retryError);
              }
            }
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
        const finalMessage = `Successfully imported ${importedCount} out of ${apiData.length} records in ${totalTime}s.`;
        console.log(`\n📊 Import completed: ${finalMessage}`);
        alert(`✅ ${finalMessage}`);

        return { success: true, message: finalMessage };

      } catch (error) {
        console.error('❌ Import failed:', error);
        alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting current target data as ${format}`);

      // Get data from store
      const store = (window as any).mainStore?.getState();
      const { 
        employeeJapaneseLevel_Data, 
        employee_data,
        japaneseTargetDates_Data 
      } = store || { 
        employeeJapaneseLevel_Data: [], 
        employee_data: [],
        japaneseTargetDates_Data: [] 
      };

      if (!employeeJapaneseLevel_Data || employeeJapaneseLevel_Data.length === 0) {
        alert("No current target data to export");
        return;
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportCurrentTargetToExcel(
            employeeJapaneseLevel_Data, 
            employee_data,
            japaneseTargetDates_Data
          );
        } else if (format === "csv") {
          await exportCurrentTargetToCSV(
            employeeJapaneseLevel_Data, 
            employee_data,
            japaneseTargetDates_Data
          );
        } else if (format === "pdf") {
          await exportCurrentTargetToPDF(
            employeeJapaneseLevel_Data, 
            employee_data,
            japaneseTargetDates_Data
          );
        } else {
          console.log(`Exporting current target data as ${format}`);
          alert(`Export format "${format}" is not supported for current target data.`);
        }
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert(`Failed to export current target data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting current target data", selectedItems)
    },
  },
  {
    id: "holidays",
    label: "Holidays",
    importTitle: "Import Holidays Data",
    importDescription: "Upload holiday data file to import into the system. The system will find the '#Holidays' or 'Holiday' sheet.",
    exportTitle: "Export Holidays Data",
    exportDescription: "Export holiday data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: CalendarIcon,
    maxSize: 500,
    onImport: async (file: File) => {
      try {
        const holidayData = await extractHolidayDataFromExcel(file);

        if (holidayData.length === 0) {
          alert('No valid holidays found in the Excel file.');
          return { success: false, message: 'No data found' };
        }

        if (!confirm(`You are about to import ${holidayData.length} holidays into the database. Continue?`)) {
          return { success: false, message: 'Import cancelled by user' };
        }

        const holidayDtos = holidayData.map(item => ({
          holidayName: item.holidayName.trim(),
          holidayDate: item.holidayDate,
        }));

        // Access store via window
        const store = (window as any).mainStore?.getState();
        if (!store || !store.bulkCreate_HolidayData) {
          throw new Error('System store not initialized. Please refresh and try again.');
        }

        await store.bulkCreate_HolidayData(holidayDtos);
        return { success: true, message: `Successfully imported ${holidayData.length} holidays!` };
      } catch (error) {
        console.error('❌ Holiday Import error:', error);
        throw error;
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting holidays data as ${format}`);

      // Get data from store
      const store = (window as any).mainStore?.getState();
      const { holiday_data } = store || { holiday_data: [] };

      if (!holiday_data || holiday_data.length === 0) {
        alert("No holiday data to export");
        return;
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportHolidaysToExcel(holiday_data);
        } else if (format === "csv") {
          await exportHolidaysToCSV(holiday_data);
        } else if (format === "pdf") {
          await exportHolidaysToPDF(holiday_data);
        } else {
          console.log(`Exporting holidays data as ${format}`);
          alert(`Export format "${format}" is not supported for holidays.`);
        }
      } catch (error) {
        console.error('❌ Export failed:', error);
        alert(`Failed to export holidays data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting holidays data", selectedItems)
    },
  },
]

export const importTabs = allTabs
export const exportTabs = allTabs
export const deleteOptions = allTabs.map((tab) => ({
  id: tab.id,
  label: tab.label,
}))

export const VISIBLE_TABS_COUNT = 4