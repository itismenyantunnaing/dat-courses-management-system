import {
  UserGroupIcon,
  CodeIcon,
  CalendarIcon,
  TrendingUp,
} from "@hugeicons/core-free-icons"
import { extractHolidayDataFromExcel } from "@/lib/Excel-extractor-Holiday"
import {
  extractEmployeeDataFromExcel,
  validateEmployeeData,
  EmployeeExcelData,
} from "@/lib/Excel-extractor-Employee"
import {
  extractCurrentTargetDataFromExcel,
  transformToApiFormat,
  validateCurrentTargetData,
  validateCurrentTargetDataWithEmployees,
  type CurrentTargetRow,
} from "@/lib/Excel-extractor-currentTarget"
import {
  exportEmployeesToExcel,
  exportEmployeesToCSV,
  exportEmployeesToPDF,
} from "@/lib/export/Export-employeesData"
import {
  exportSkillsToCSV,
  exportSkillsToExcel,
  exportSkillsToPDF,
} from "@/lib/export/Export-skillsetData"
import {
  exportHolidaysToExcel,
  exportHolidaysToCSV,
  exportHolidaysToPDF,
} from "@/lib/export/Export-holidayData"
import {
  exportCurrentTargetToExcel,
  exportCurrentTargetToCSV,
  exportCurrentTargetToPDF,
} from "@/lib/export/Export-currentTargetData"

export const allTabs = [
  {
    id: "employees",
    label: "Employees",
    importTitle: "Import Employees Data",
    importDescription: "Upload employee data file to import into the system.",
    exportTitle: "Export Employees Data",
    exportDescription: "Export employee data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: UserGroupIcon,
    maxSize: 500,
    onImport: async (file: File) => {
      try {
        const startTime = performance.now()

        // Extract employee data from Excel
        const employeeData = await extractEmployeeDataFromExcel(file)

        if (employeeData.length === 0) {
          alert(
            "No employee data found in the Excel file. Please check the data."
          )
          return { success: false, message: "No data found" }
        }

        // Validate the data
        const { valid, invalid } = validateEmployeeData(employeeData)

        // Handle invalid rows
        if (invalid.length > 0) {
          const shouldContinue = confirm(
            `⚠️ ${invalid.length} rows have missing or invalid data.\n\n` +
              `Valid rows: ${valid.length}\n` +
              `Invalid rows: ${invalid.length}\n\n` +
              `Continue with ${valid.length} valid rows?`
          )

          if (!shouldContinue) {
            return { success: false, message: "Import cancelled by user" }
          }
        }

        if (valid.length === 0) {
          alert("No valid employee records found. Please check the data.")
          return { success: false, message: "No valid data" }
        }

        const shouldProceed = confirm(
          `You are about to import ${valid.length} employees into the database. This may take a few moments. Continue?`
        )

        if (!shouldProceed) {
          return { success: false, message: "Import cancelled by user" }
        }

        // Prepare employee data for bulk insert
        const employeeDtos = valid.map((item: EmployeeExcelData) => ({
          id: item.staffId?.trim() || "",
          name: item.name?.trim() || "",
          email: "",
          doorlog: item.doorLog?.trim() || "",
          position: item.position?.trim() || "",
          status: item.status?.trim() || "active",
          div_name: item.div?.trim() || "",
          dept_dat: item.dept?.trim() || "",
          team: item.team?.trim() || "",
          role: item.role?.trim() || "",
          emp_status: "active",
          is_core_personnel: false,
          has_japan_business_trip: false,
          noti_setting: true,
          dob: "",
          profile_photo_path: "",
        }))

        // Access store via window
        const store = (window as any).mainStore?.getState()
        if (!store || !store.bulkCreate_EmployeeData) {
          throw new Error(
            "System store not initialized. Please refresh and try again."
          )
        }

        // Import in smaller batches for better reliability
        const BATCH_SIZE = 50
        let importedCount = 0
        const failedRecords: { id: string; name: string }[] = []

        for (let i = 0; i < employeeDtos.length; i += BATCH_SIZE) {
          const batch = employeeDtos.slice(i, i + BATCH_SIZE)

          try {
            await store.bulkCreate_EmployeeData(batch)
            importedCount += batch.length
          } catch (error) {
            // Try to import failed batch one by one
            for (let j = 0; j < batch.length; j++) {
              try {
                await store.bulkCreate_EmployeeData([batch[j]])
                importedCount++
              } catch (retryError) {
                failedRecords.push({
                  id: batch[j].id || "MISSING",
                  name: batch[j].name || "MISSING",
                })
              }
            }
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1)

        // Build the result message
        let message = `Successfully imported ${importedCount} out of ${employeeDtos.length} employees in ${totalTime}s!`

        if (invalid.length > 0) {
          message += ` Skipped ${invalid.length} invalid rows.`
        }

        if (failedRecords.length > 0) {
          // Create a detailed list of failed records for the alert
          const failedList = failedRecords
            .map(
              (record, index) =>
                `${index + 1}. ID: ${record.id}, Name: ${record.name}`
            )
            .join("\n")

          message += `\n\n❌ ${failedRecords.length} records failed to import:\n${failedList}`
        }

        alert(`✅ ${message}`)

        return {
          success: importedCount > 0,
          message: message,
          details: {
            total: employeeDtos.length,
            imported: importedCount,
            invalid: invalid.length,
            failedRecords: failedRecords.length,
          },
        }
      } catch (error) {
        console.error("❌ Employee import error:", error)
        alert(
          `❌ Failed to import: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        throw error
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting employees data as ${format}`)

      // Get data from store
      const store = (window as any).mainStore?.getState()
      const { employee_data } = store || { employee_data: [] }

      if (!employee_data || employee_data.length === 0) {
        alert("No employee data to export")
        return
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportEmployeesToExcel(employee_data)
        } else if (format === "csv") {
          await exportEmployeesToCSV(employee_data)
        } else if (format === "pdf") {
          await exportEmployeesToPDF(employee_data)
        } else {
          console.log(`Exporting employees data as ${format}`)
          alert(`Export format "${format}" is not supported for employees.`)
        }
      } catch (error) {
        console.error("❌ Export failed:", error)
        alert(
          `Failed to export employees data: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting employees data", selectedItems)
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
      alert("Skills import coming soon!")
      return { success: true, message: "Skills import coming soon!" }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting skills data as ${format}`)

      // Get data from store
      const store = (window as any).mainStore?.getState()
      if (!store) {
        alert("System store not initialized. Please refresh and try again.")
        return
      }

      const {
        employee_data,
        skill_headers,
        skillData,
        devCap_headers,
        devCap_data,
        languageSkill_data,
        managementScores_Data,
      } = store

      if (!employee_data || employee_data.length === 0) {
        alert("No employee data to export")
        return
      }

      try {
        const exportData = {
          employee_data,
          skill_headers,
          skillData,
          devCap_headers,
          devCap_data,
          languageSkill_data,
          managementScores_Data,
        }

        const options = {
          showAdministrator: true,
          showDeveloper: true,
          showTechnicalAbility: true,
          fileName: `Skills_Report_${new Date().toISOString().split("T")[0]}`,
        }

        if (format === "excel" || format === "xlsx") {
          await exportSkillsToExcel(exportData, options)
        } else if (format === "csv") {
          await exportSkillsToCSV(exportData, options)
        } else if (format === "pdf") {
          await exportSkillsToPDF(exportData, options)
        } else {
          alert(`Export format "${format}" is not supported for skills data.`)
        }

        console.log("✅ Skills exported successfully")
      } catch (error) {
        console.error("❌ Export failed:", error)
        alert(
          `Failed to export skills data: ${error instanceof Error ? error.message : "Unknown error"}`
        )
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
    importDescription:
      "Upload current target data file to import into the system. The system will automatically detect headers like Staff ID, JLPT / NAT Test, JLPT Highest Level, Communication Level, etc.",
    exportTitle: "Export Current Target Data",
    exportDescription: "Export current target data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: TrendingUp,
    maxSize: 500,
    onImport: async (file: File) => {
      try {
        const startTime = performance.now()

        // Extract current target data from Excel
        const extractedData = await extractCurrentTargetDataFromExcel(file)

        if (!extractedData.success || extractedData.data.length === 0) {
          alert(
            "No current target data found in the Excel file. Please check the data."
          )
          return {
            success: false,
            message: extractedData.error || "No data found",
          }
        }

        // Access store via window
        const store = (window as any).mainStore?.getState()
        if (!store || !store.bulkCreate_CurrentTargetData) {
          throw new Error(
            "System store not initialized. Please refresh and try again."
          )
        }

        // ===== FETCH EMPLOYEE DATA FIRST =====
        let existingEmployeeIds = new Set<string>()
        try {
          console.log("📋 Checking employee data in store...")

          // Check if employee_data is empty
          if (!store.employee_data || store.employee_data.length === 0) {
            console.log("📋 Employee data is empty. Fetching from API...")

            // Show loading message
            const loadingMessage =
              "Fetching employee data from system. Please wait..."
            console.log(loadingMessage)

            // Fetch employee data
            await store.fetch_EmployeeData()

            // Get fresh state after fetch
            const freshStore = (window as any).mainStore?.getState()
            if (
              !freshStore ||
              !freshStore.employee_data ||
              freshStore.employee_data.length === 0
            ) {
              console.warn(
                "⚠️ Still no employee data after fetch. Proceeding without employee validation."
              )
            } else {
              console.log(
                `✅ Fetched ${freshStore.employee_data.length} employees from system`
              )
            }
          } else {
            console.log(
              `✅ Found ${store.employee_data.length} employees in store`
            )
          }

          // Get the latest employee data (either from store or after fetch)
          const currentStore = (window as any).mainStore?.getState()
          const employeeData = currentStore?.employee_data || []

          // Extract employee IDs
          existingEmployeeIds = new Set(
            employeeData.map(
              (emp: any) => emp.id || emp.employeeId || emp.staffId
            )
          )

          console.log(
            `📋 Extracted ${existingEmployeeIds.size} unique employee IDs`
          )

          // Log first few IDs for debugging
          if (existingEmployeeIds.size > 0) {
            const sampleIds = Array.from(existingEmployeeIds).slice(0, 5)
            console.log("📋 Sample employee IDs:", sampleIds)
          }
        } catch (error) {
          console.warn("⚠️ Error fetching employee data:", error)
          console.warn(
            "⚠️ Proceeding without employee validation. Backend will validate."
          )
        }

        // ===== VALIDATE WITH EMPLOYEE EXISTENCE CHECK =====
        const validationStart = performance.now()

        let valid: CurrentTargetRow[] = []
        let invalid: { data: CurrentTargetRow; errors: string[] }[] = []

        if (existingEmployeeIds.size > 0) {
          // Use employee validation
          const result = validateCurrentTargetDataWithEmployees(
            extractedData.data,
            existingEmployeeIds
          )
          valid = result.valid
          invalid = result.invalid
        } else {
          // Fallback to basic validation (only checks Staff ID presence and duplicates)
          console.warn(
            "⚠️ No employee data available. Using basic validation only."
          )
          const result = validateCurrentTargetData(extractedData.data)
          valid = result.valid
          invalid = result.invalid
        }

        console.log(
          `✅ Validation completed in ${(performance.now() - validationStart).toFixed(0)}ms`
        )
        console.log(`📊 Valid: ${valid.length}, Invalid: ${invalid.length}`)

        // Log all invalid rows with details
        if (invalid.length > 0) {
          console.warn(`⚠️ ${invalid.length} invalid rows found:`)
          console.table(
            invalid.map((item, index) => ({
              Row: index + 1,
              StaffId: item.data["Staff ID"] || "MISSING",
              Errors: item.errors.join("; "),
            }))
          )

          // Separate errors by type
          const missingEmployeeErrors = invalid.filter((item) =>
            item.errors.some((e) => e.includes("does NOT exist"))
          )
          const duplicateErrors = invalid.filter((item) =>
            item.errors.some((e) => e.includes("Duplicate"))
          )
          const missingIdErrors = invalid.filter((item) =>
            item.errors.some((e) => e.includes("required"))
          )

          let message = `⚠️ ${invalid.length} rows have issues:\n\n`
          message += `✅ Valid rows: ${valid.length}\n`
          message += `❌ Invalid rows: ${invalid.length}\n\n`

          if (missingEmployeeErrors.length > 0) {
            message += `🚫 ${missingEmployeeErrors.length} rows: Staff ID does not exist in system\n`
            message += `   Please create these employees first or correct the Staff IDs.\n\n`
          }
          if (duplicateErrors.length > 0) {
            message += `🔄 ${duplicateErrors.length} rows: Duplicate Staff IDs\n\n`
          }
          if (missingIdErrors.length > 0) {
            message += `❌ ${missingIdErrors.length} rows: Missing Staff ID\n\n`
          }

          message += `Continue with ${valid.length} valid rows?`

          const shouldContinue = confirm(message)
          if (!shouldContinue) {
            return { success: false, message: "Import cancelled by user" }
          }
        }

        if (valid.length === 0) {
          alert("No valid current target records found. Please check the data.")
          return { success: false, message: "No valid data" }
        }

        // ===== DOUBLE-CHECK: Filter out any records with invalid employee IDs =====
        const apiData = transformToApiFormat(valid)
        let filteredApiData = apiData

        if (existingEmployeeIds.size > 0) {
          filteredApiData = apiData.filter((record) => {
            if (!record.employeeId) {
              console.warn(`⚠️ Skipping record with no employee ID`)
              return false
            }
            if (!existingEmployeeIds.has(record.employeeId)) {
              console.warn(
                `⚠️ Skipping employee "${record.employeeId}" - does not exist in system`
              )
              return false
            }
            return true
          })

          const skippedCount = apiData.length - filteredApiData.length
          if (skippedCount > 0) {
            console.log(
              `📊 Skipped ${skippedCount} records with invalid employee IDs`
            )
            alert(
              `ℹ️ ${skippedCount} records were skipped because the employee IDs don't exist in the system.\n\nContinuing with ${filteredApiData.length} records.`
            )
          }
        }

        if (filteredApiData.length === 0) {
          alert(
            "No valid records to import. All records have invalid employee IDs."
          )
          return { success: false, message: "No valid records to import" }
        }

        const shouldProceed = confirm(
          `You are about to import ${filteredApiData.length} current target profiles into the database. This may take a few moments.\n\n` +
            `Continue?`
        )

        if (!shouldProceed) {
          return { success: false, message: "Import cancelled by user" }
        }

        // Import in smaller batches for better reliability
        const BATCH_SIZE = 25
        let importedCount = 0
        const totalBatches = Math.ceil(filteredApiData.length / BATCH_SIZE)

        for (let i = 0; i < filteredApiData.length; i += BATCH_SIZE) {
          const batch = filteredApiData.slice(i, i + BATCH_SIZE)
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1
          const startIndex = i
          let batchImported = false

          try {
            console.log(`\n📦 Processing Batch ${batchNumber}/${totalBatches}`)
            await store.bulkCreate_CurrentTargetData(batch)
            importedCount += batch.length
            console.log(`✅ Batch ${batchNumber} completed successfully`)
            batchImported = true
          } catch (error) {
            // Don't log the full error here - it's handled by retry
            console.warn(
              `⚠️ Batch ${batchNumber} failed as batch, retrying individually...`
            )

            // Try to import failed batch one by one
            let successCount = 0
            for (let j = 0; j < batch.length; j++) {
              const recordIndex = startIndex + j
              try {
                await store.bulkCreate_CurrentTargetData([batch[j]])
                importedCount++
                successCount++
                // Log progress every 10 records
                if (successCount % 10 === 0 || successCount === batch.length) {
                  console.log(
                    `   📊 Imported ${successCount}/${batch.length} records from batch ${batchNumber}`
                  )
                }
              } catch (retryError) {
                // Silently log the failure (or skip logging entirely)
                console.debug(
                  `   ⚠️ Record ${recordIndex + 1} (${batch[j].employeeId || "NO_ID"}) failed`
                )
              }
            }

            if (successCount === batch.length) {
              console.log(
                `✅ Batch ${batchNumber} completed successfully (individual imports)`
              )
            } else {
              console.log(
                `⚠️ Batch ${batchNumber} partially completed: ${successCount}/${batch.length} records`
              )
            }
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1)
        const finalMessage = `Successfully imported ${importedCount} out of ${filteredApiData.length} records in ${totalTime}s.`
        console.log(`\n📊 Import completed: ${finalMessage}`)
        alert(`✅ ${finalMessage}`)

        return { success: true, message: finalMessage }
      } catch (error) {
        console.error("❌ Import failed:", error)
        alert(
          `❌ Import failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting current target data as ${format}`)

      // Get data from store
      const store = (window as any).mainStore?.getState()
      const {
        employeeJapaneseLevel_Data,
        employee_data,
        japaneseTargetDates_Data,
      } = store || {
        employeeJapaneseLevel_Data: [],
        employee_data: [],
        japaneseTargetDates_Data: [],
      }

      if (
        !employeeJapaneseLevel_Data ||
        employeeJapaneseLevel_Data.length === 0
      ) {
        alert("No current target data to export")
        return
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportCurrentTargetToExcel(
            employeeJapaneseLevel_Data,
            employee_data,
            japaneseTargetDates_Data
          )
        } else if (format === "csv") {
          await exportCurrentTargetToCSV(
            employeeJapaneseLevel_Data,
            employee_data,
            japaneseTargetDates_Data
          )
        } else if (format === "pdf") {
          await exportCurrentTargetToPDF(
            employeeJapaneseLevel_Data,
            employee_data,
            japaneseTargetDates_Data
          )
        } else {
          console.log(`Exporting current target data as ${format}`)
          alert(
            `Export format "${format}" is not supported for current target data.`
          )
        }
      } catch (error) {
        console.error("❌ Export failed:", error)
        alert(
          `Failed to export current target data: ${error instanceof Error ? error.message : "Unknown error"}`
        )
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
    importDescription:
      "Upload holiday data file to import into the system. The system will automatically find the '#Holidays' or 'Holiday' sheet.",
    exportTitle: "Export Holidays Data",
    exportDescription: "Export holiday data from the system.",
    accept: ".csv,.json,.xlsx,.xls",
    icon: CalendarIcon,
    maxSize: 500,
    onImport: async (file: File) => {
      try {
        const holidayData = await extractHolidayDataFromExcel(file)

        if (holidayData.length === 0) {
          alert("No valid holidays found in the Excel file.")
          return { success: false, message: "No data found" }
        }

        if (
          !confirm(
            `You are about to import ${holidayData.length} holidays into the database. Continue?`
          )
        ) {
          return { success: false, message: "Import cancelled by user" }
        }

        const holidayDtos = holidayData.map((item) => ({
          holidayName: item.holidayName.trim(),
          holidayDate: item.holidayDate,
        }))

        // Access store via window
        const store = (window as any).mainStore?.getState()
        if (!store || !store.bulkCreate_HolidayData) {
          throw new Error(
            "System store not initialized. Please refresh and try again."
          )
        }

        await store.bulkCreate_HolidayData(holidayDtos)
        return {
          success: true,
          message: `Successfully imported ${holidayData.length} holidays!`,
        }
      } catch (error) {
        console.error("❌ Holiday Import error:", error)
        throw error
      }
    },
    onExport: async (format: string) => {
      console.log(`📤 Exporting holidays data as ${format}`)

      // Get data from store
      const store = (window as any).mainStore?.getState()
      const { holiday_data } = store || { holiday_data: [] }

      if (!holiday_data || holiday_data.length === 0) {
        alert("No holiday data to export")
        return
      }

      try {
        if (format === "excel" || format === "xlsx") {
          await exportHolidaysToExcel(holiday_data)
        } else if (format === "csv") {
          await exportHolidaysToCSV(holiday_data)
        } else if (format === "pdf") {
          await exportHolidaysToPDF(holiday_data)
        } else {
          console.log(`Exporting holidays data as ${format}`)
          alert(`Export format "${format}" is not supported for holidays.`)
        }
      } catch (error) {
        console.error("❌ Export failed:", error)
        alert(
          `Failed to export holidays data: ${error instanceof Error ? error.message : "Unknown error"}`
        )
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
