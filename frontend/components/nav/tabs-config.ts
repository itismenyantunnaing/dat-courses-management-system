import {
  UserGroupIcon,
  CodeIcon,
  CourseIcon,
  CalendarIcon,
  TrendingUp,
} from "@hugeicons/core-free-icons"
import { extractHolidayDataFromExcel } from "@/lib/Excel-extractor-Holiday"
import { extractEmployeeDataFromExcel, validateEmployeeData, EmployeeExcelData } from "@/lib/Excel-extractor-Employee"
import { extractCurrentTargetDataFromExcel, transformToApiFormat, validateCurrentTargetData, validateCurrentTargetDataWithEmployees, type CurrentTargetRow } from "@/lib/Excel-extractor-currentTarget";
import { extractEmployeesFromExcel, parseTechnicalHeader, TECHNICAL_ABILITY_CONFIG, isYearsHeader, isExperienceHeader } from "@/lib/Excel-extractor-Skillset";
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
    onImport: async (file: File) => {
      try {
        const startTime = performance.now();
        const store = (window as any).mainStore?.getState();

        if (!store) {
          throw new Error('System store not initialized. Please refresh and try again.');
        }

        await Promise.all([
          store.fetch_EmployeeData(),
          store.fetch_languageSkillData(),
          store.fetch_managementScoreData(),
          store.fetch_devCapData(),
          store.fetch_SkillData(),
          store.fetch_SkillHeaders()
        ]);

        const currentStore = (window as any).mainStore?.getState();
        const extractionResult = await extractEmployeesFromExcel(file, currentStore.skill_headers || []);

        // ===== SEE FULL HEADERS =====
        console.log('📊 Full Headers:', extractionResult.headers);
        console.log('📊 Total Headers Count:', extractionResult.headers.length);

        if (!extractionResult.success) {
          alert(`❌ Extraction failed: ${extractionResult.error}`);
          return { success: false, message: extractionResult.error };
        }

        const employees = extractionResult.employees;
        if (employees.length === 0) {
          alert('⚠️ No data found in the Excel file.');
          return { success: false, message: 'No data found' };
        }

        const normalizeId = (id: any) => id?.toString().trim() || '';
        const normalizeString = (str: any) => str?.toString().trim().toLowerCase() || '';

        // ===== FETCH EXISTING DEVELOPMENT HEADERS (NO CREATION) =====
        console.log('🔄 Fetching existing development types from database...');

        try {
          await store.fetch_devCapHeaders();
          console.log('✅ Development types fetched successfully');
        } catch (fetchError) {
          console.error('❌ Failed to fetch development types:', fetchError);
        }

        await store.fetch_devCapData();
        const refreshedStore = (window as any).mainStore?.getState();

        Object.assign(currentStore, {
          devCap_data: refreshedStore.devCap_data || [],
          devCap_headers: refreshedStore.devCap_headers || []
        });

        console.log('📊 Existing development types:', currentStore.devCap_headers);

        // ===== SYNC TECHNICAL SKILL HEADERS =====
        console.log('🔄 Syncing technical skill headers from local config...');

        const formattedConfig = TECHNICAL_ABILITY_CONFIG.map(cat => ({
          categoryName: cat.category_name,
          skillSubCategories: cat.skill_sub_categories.map(sub => ({
            subCategoryName: sub.sub_category_name,
            skills: sub.skills.map(sk => ({
              skillName: sk.skill_name
            }))
          }))
        }));

        try {
          await store.add_BulkSkillCategories(formattedConfig);
          console.log('✅ Technical skill headers synced successfully');
        } catch (syncError) {
          console.error('❌ Failed to sync technical skill headers:', syncError);
        }

        await store.fetch_SkillHeaders();
        const refreshedStore2 = (window as any).mainStore?.getState();

        Object.assign(currentStore, {
          skill_headers: refreshedStore2.skill_headers || [],
          skillData: refreshedStore2.skillData || []
        });

        // ===== BUILD skillIdLookup =====
        const skillIdLookup = new Map<string, number>();
        for (const cat of currentStore.skill_headers || []) {
          const catName = normalizeString(cat.categoryName || cat.category_name);
          for (const sub of cat.skillSubCategories || cat.skill_sub_categories || []) {
            const subName = normalizeString(sub.subCategoryName || sub.sub_category_name);
            for (const sk of sub.skills || []) {
              const skName = normalizeString(sk.skillName || sk.skill_name);
              const key = `${catName}|${subName}|${skName}`;
              skillIdLookup.set(key, sk.id);
            }
          }
        }
        console.log(`📋 Built skillIdLookup with ${skillIdLookup.size} entries`);

        // ===== DETECT AND CREATE NEW TECHNICAL SKILLS =====
        console.log('🔍 Detecting new technical skills not in config...');

        // Build a set of existing skill names from config (case insensitive)
        const existingSkillNames = new Set<string>();
        for (const cat of TECHNICAL_ABILITY_CONFIG) {
          for (const sub of cat.skill_sub_categories) {
            for (const sk of sub.skills) {
              existingSkillNames.add(normalizeString(sk.skill_name));
            }
          }
        }

        // Build a map of existing categories and subcategories
        const existingCategories = new Set<string>();
        const existingSubCategories = new Set<string>();
        for (const cat of TECHNICAL_ABILITY_CONFIG) {
          existingCategories.add(normalizeString(cat.category_name));
          for (const sub of cat.skill_sub_categories) {
            existingSubCategories.add(normalizeString(sub.sub_category_name));
          }
        }

        // Get all headers
        const allHeaders = extractionResult.headers;

        // Find new skill headers with their category and subcategory
        const newSkillsMap = new Map<string, {
          yearsHeader: string;
          expHeader: string;
          category: string;
          subcategory: string
        }>();

        for (const header of allHeaders) {
          // ✅ Use the helper functions (case-insensitive)
          const isYear = isYearsHeader(header);
          const isExp = isExperienceHeader(header);

          // Skip if not a technical skill header
          if (!isYear && !isExp && !header.includes('technical ability')) {
            continue;
          }

          // Skip if it's a development header or other known headers
          if (header.includes('Developer') || header.includes('administrator')) {
            continue;
          }

          // Parse the header to extract skill name, category, subcategory
          const parsed = parseTechnicalHeader(header);
          if (!parsed.skill) continue;

          const skillName = parsed.skill;
          const skillNameNorm = normalizeString(skillName);
          const categoryName = parsed.category || '';
          const subcategoryName = parsed.subcategory || '';

          // Check if this skill already exists in config
          if (!existingSkillNames.has(skillNameNorm)) {
            // This is a new skill!
            const key = skillName;
            if (!newSkillsMap.has(key)) {
              newSkillsMap.set(key, {
                yearsHeader: '',
                expHeader: '',
                category: categoryName,
                subcategory: subcategoryName
              });
            }

            const entry = newSkillsMap.get(key)!;
            if (isYear) {
              entry.yearsHeader = header;
            } else if (isExp) {
              entry.expHeader = header;
            }
          }
        }

        // Create new skills if any found
        if (newSkillsMap.size > 0) {
          console.log(`✅ Found ${newSkillsMap.size} new skills:`, Array.from(newSkillsMap.keys()));

          // Group new skills by category and subcategory
          const categoryMap = new Map<string, Map<string, string[]>>();

          for (const [skillName, info] of newSkillsMap) {
            // Helper function to generate random number
            const getRandomNumber = () => Math.floor(Math.random() * 10000);

            // Use the actual category/subcategory from the header, or generate empty-{randomNumber}
            const categoryKey = info.category && info.category.trim() !== ''
              ? info.category
              : `empty-${getRandomNumber()}`;

            const subcategoryKey = info.subcategory && info.subcategory.trim() !== ''
              ? info.subcategory
              : `empty-${getRandomNumber()}`;

            if (!categoryMap.has(categoryKey)) {
              categoryMap.set(categoryKey, new Map());
            }
            const subMap = categoryMap.get(categoryKey)!;
            if (!subMap.has(subcategoryKey)) {
              subMap.set(subcategoryKey, []);
            }
            subMap.get(subcategoryKey)!.push(skillName);
          }

          // Build the new skill categories based on existing structure
          const newSkillCategories = [];

          for (const [categoryName, subMap] of categoryMap) {
            // Check if category already exists in config
            const categoryExists = existingCategories.has(normalizeString(categoryName));

            const skillSubCategories = [];
            for (const [subcategoryName, skills] of subMap) {
              // Check if subcategory already exists in config
              const subcategoryExists = existingSubCategories.has(normalizeString(subcategoryName));

              skillSubCategories.push({
                subCategoryName: subcategoryName,
                skills: skills.map(skillName => ({ skillName: skillName }))
              });
            }

            newSkillCategories.push({
              categoryName: categoryName,
              skillSubCategories: skillSubCategories
            });
          }

          try {
            await store.add_BulkSkillCategories(newSkillCategories);
            console.log(`✅ Created ${newSkillsMap.size} new skills in their respective categories`);

            // Refresh skill headers to get new skill IDs
            await store.fetch_SkillHeaders();
            const refreshedStore3 = (window as any).mainStore?.getState();
            Object.assign(currentStore, {
              skill_headers: refreshedStore3.skill_headers || [],
              skillData: refreshedStore3.skillData || []
            });

            // Rebuild skillIdLookup to include new skills
            for (const cat of currentStore.skill_headers || []) {
              const catName = normalizeString(cat.categoryName || cat.category_name);
              for (const sub of cat.skillSubCategories || cat.skill_sub_categories || []) {
                const subName = normalizeString(sub.subCategoryName || sub.sub_category_name);
                for (const sk of sub.skills || []) {
                  const skName = normalizeString(sk.skillName || sk.skill_name);
                  const key = `${catName}|${subName}|${skName}`;
                  skillIdLookup.set(key, sk.id);
                }
              }
            }
            console.log(`📋 Updated skillIdLookup with ${skillIdLookup.size} entries (including new skills)`);

          } catch (error) {
            console.error('❌ Failed to create new skills:', error);
          }
        } else {
          console.log('ℹ️ No new skills detected');
        }

        // ===== EXISTING DATA =====
        const existingEmployeeIds = new Set(
          (currentStore?.employee_data || []).map((emp: any) => (emp.id || emp.employeeId || emp.staffId)?.toString().trim())
        );

        const existingLanguageSkills = currentStore?.languageSkill_data || [];
        const existingManagementScores = currentStore?.managementScores_Data || [];
        const existingDevExperience = currentStore?.devCap_data || [];
        const existingTechnicalSkills = currentStore?.skillData || [];

        // Maps for create/update operations
        const managementToCreate = new Map<string, any>();
        const managementToUpdate = new Map<string, { id: number; data: any }>();

        const languageToCreate = new Map<string, any>();
        const languageToUpdate = new Map<string, { id: number; data: any }>();

        const developmentToCreate = new Map<string, any>();
        const developmentToUpdate = new Map<string, { id: number; data: any }>();

        const technicalToCreate = new Map<string, any>();
        const technicalToUpdate = new Map<string, { id: number; data: any }>();

        const skippedEmployees = new Set<string>();

        // ===== PROCESS EACH EMPLOYEE =====
        for (const emp of employees) {
          const employeeId = emp["ID"]?.toString().trim();
          if (!employeeId) continue;

          if (existingEmployeeIds.size > 0 && !existingEmployeeIds.has(employeeId)) {
            skippedEmployees.add(employeeId);
            continue;
          }

          // 1. Management Skills
          const mgmtExp = parseInt(emp["administrator - Management experience (Levels 1-5)"]);
          const qcd = parseInt(emp["administrator - management ability - QCD (1-4 points)"]);
          const report = parseInt(emp["administrator - management ability - Reporting, contacting, and consulting (1-4 points)"]);
          const edu = parseInt(emp["administrator - management ability - Education (1-4 points)"]);

          if (!isNaN(mgmtExp) || !isNaN(qcd) || !isNaN(report) || !isNaN(edu)) {
            const mgmtData = {
              employeeId,
              managementExperienceLevel: isNaN(mgmtExp) ? 1 : Math.max(1, Math.min(5, mgmtExp)),
              qcdScore: isNaN(qcd) ? 1 : Math.max(1, Math.min(4, qcd)),
              reportConsultScore: isNaN(report) ? 1 : Math.max(1, Math.min(4, report)),
              educationScore: isNaN(edu) ? 1 : Math.max(1, Math.min(4, edu)),
            };

            const existing = existingManagementScores.find((m: any) => normalizeId(m.employeeId || m.employee_id) === employeeId);
            if (existing) {
              const hasChanged =
                (existing.managementExperienceLevel || existing.management_experience_level) !== mgmtData.managementExperienceLevel ||
                (existing.qcdScore || existing.qcd_score) !== mgmtData.qcdScore ||
                (existing.reportConsultScore || existing.report_consult_score) !== mgmtData.reportConsultScore ||
                (existing.educationScore || existing.education_score) !== mgmtData.educationScore;

              if (hasChanged) {
                managementToUpdate.set(employeeId, { id: existing.id, data: mgmtData });
              }
            } else {
              managementToCreate.set(employeeId, mgmtData);
            }
          }

          // 2. Language Skills
          const langLevel = parseInt(emp["Developer (DIR and YSX tasks only) - language skills - Level (Levels 1-5)"]);
          if (!isNaN(langLevel)) {
            const langData = {
              employeeId,
              languageSkillLevel: Math.max(1, Math.min(5, langLevel)),
            };

            const existing = existingLanguageSkills.find((l: any) => normalizeId(l.employeeId || l.employee_id) === employeeId);
            if (existing) {
              if ((existing.languageSkillLevel || existing.language_skill_level) !== langData.languageSkillLevel) {
                languageToUpdate.set(employeeId, { id: existing.id, data: langData });
              }
            } else {
              languageToCreate.set(employeeId, langData);
            }
          }

          // 3. Development Skills
          const devTypes = [
            { name: "Host/Online", yearsHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Host/Online - Years of experience", processHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Host/Online - Experience Process" },
            { name: "Host/Batch", yearsHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Host/Batch - Years of experience", processHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Host/Batch - Experience Process" },
            { name: "Decentralized/Online", yearsHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Decentralized/Online - Years of experience", processHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Decentralized/Online - Experience Process" },
            { name: "Distributed/Batch", yearsHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Distributed/Batch - Years of experience", processHeader: "Developer (DIR and YSX tasks only) - Development capabilities - Distributed/Batch - Experience Process" },
          ];

          for (const type of devTypes) {
            const years = parseFloat(emp[type.yearsHeader]);
            const process = emp[type.processHeader];

            if (isNaN(years) || years <= 0) continue;

            const devData = {
              employeeId: employeeId,
              developmentTypeName: type.name,
              processName: (process || "").toString().trim().substring(0, 255),
              yearsOfExperience: Math.min(99.9, years),
            };

            const devKey = `${employeeId}|${normalizeString(type.name)}`;
            const existing = existingDevExperience.find((d: any) =>
              normalizeId(d.employeeId || d.employee_id) === employeeId &&
              normalizeString(d.developmentTypeName || d.development_type_name) === normalizeString(type.name)
            );

            if (existing) {
              const existingYears = existing.yearsOfExperience || 0;
              const existingProcess = (existing.processName || existing.process_name || "").toString().trim();

              const hasChanged =
                Math.abs(existingYears - years) > 0.01 ||
                normalizeString(existingProcess) !== normalizeString(process || "");

              if (hasChanged) {
                const updateData = {
                  employeeId: employeeId,
                  developmentTypeName: type.name,
                  processName: (process || existingProcess).toString().trim().substring(0, 255),
                  yearsOfExperience: Math.min(99.9, years),
                };
                developmentToUpdate.set(devKey, { id: existing.id, data: updateData });
              }
            } else {
              if (!developmentToCreate.has(devKey)) {
                developmentToCreate.set(devKey, devData);
              }
            }
          }

          // ===== 4. TECHNICAL SKILLS - FAST WITH RPA SPECIAL CASE =====
          const technicalHeaders = Object.keys(emp).filter(key =>
            isYearsHeader(key) || isExperienceHeader(key) || key.includes('technical ability')
          );

          const processedSkills = new Set<string>();

          // Process existing skills from config
          for (const cat of TECHNICAL_ABILITY_CONFIG) {
            for (const sub of cat.skill_sub_categories) {
              for (const sk of sub.skills) {
                const skillKey = `${normalizeString(cat.category_name)}|${normalizeString(sub.sub_category_name)}|${normalizeString(sk.skill_name)}`;

                if (processedSkills.has(skillKey)) {
                  continue;
                }

                let yearsHeader = '';
                let expHeader = '';
                let foundYears = false;
                let foundExp = false;

                const skillLower = sk.skill_name.toLowerCase();
                const isRPASkill = skillLower === 'rpa';

                for (const header of technicalHeaders) {
                  const headerLower = header.toLowerCase();
                  let isMatch = false;

                  if (isRPASkill) {
                    isMatch = headerLower.endsWith(` - rpa - years`) ||
                      headerLower.endsWith(` - rpa - experience`) ||
                      headerLower.includes(` - rpa - `);
                  } else {
                    isMatch = headerLower.includes(skillLower);
                  }

                  if (isMatch) {
                    if (isYearsHeader(header)) {
                      yearsHeader = header;
                      foundYears = true;
                    } else if (isExperienceHeader(header)) {
                      expHeader = header;
                      foundExp = true;
                    }
                  }
                }


                if (!foundYears || !foundExp) {
                  for (const header of technicalHeaders) {
                    const headerLower = header.toLowerCase();

                    if (isRPASkill) {
                      break;
                    }

                    if (headerLower.includes(skillLower) ||
                      headerLower.endsWith(skillLower) ||
                      headerLower.includes(` - ${skillLower}`)) {
                      if (headerLower.includes('years') || headerLower.includes('year')) {
                        yearsHeader = header;
                        foundYears = true;
                      } else if (headerLower.includes('experience') || headerLower.includes('exp')) {
                        expHeader = header;
                        foundExp = true;
                      }
                    }
                  }
                }

                const headerFormats = [
                  `technical ability - ${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - Years`,
                  `technical ability - ${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - experience`,
                  `${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - Years`,
                  `${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - experience`,
                  `${cat.category_name} - ${sk.skill_name} - Years`,
                  `${cat.category_name} - ${sk.skill_name} - experience`,
                  `${sk.skill_name} - Years`,
                  `${sk.skill_name} - experience`,
                ];

                if (!foundYears) {
                  for (const format of headerFormats) {
                    if (format.includes('Years') && emp[format] !== undefined) {
                      yearsHeader = format;
                      foundYears = true;
                      break;
                    }
                  }
                  if (!foundYears) {
                    yearsHeader = `technical ability - ${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - Years`;
                  }
                }

                if (!foundExp) {
                  for (const format of headerFormats) {
                    if (format.includes('experience') && emp[format] !== undefined) {
                      expHeader = format;
                      foundExp = true;
                      break;
                    }
                  }
                  if (!foundExp) {
                    expHeader = `technical ability - ${cat.category_name} - ${sub.sub_category_name} - ${sk.skill_name} - experience`;
                  }
                }

                const yearsRaw = emp[yearsHeader];
                const experienceRaw = emp[expHeader];

                const hasYears = yearsRaw !== undefined && yearsRaw !== null && yearsRaw !== '' && !isNaN(parseFloat(yearsRaw)) && parseFloat(yearsRaw) > 0;
                const hasExperience = experienceRaw !== undefined && experienceRaw !== null && experienceRaw.toString().trim().length > 0;

                if (hasYears || hasExperience) {
                  const catNameNorm = normalizeString(cat.category_name);
                  const subNameNorm = normalizeString(sub.sub_category_name);
                  const skNameNorm = normalizeString(sk.skill_name);
                  const lookupKey = `${catNameNorm}|${subNameNorm}|${skNameNorm}`;
                  const skillId = skillIdLookup.get(lookupKey);

                  if (!skillId) {
                    processedSkills.add(skillKey);
                    continue;
                  }

                  const techData = {
                    employeeId: employeeId,
                    skillId: skillId,
                    skillName: sk.skill_name,
                    categoryName: cat.category_name,
                    subCategoryName: sub.sub_category_name,
                    yearsOfExperience: hasYears ? parseFloat(yearsRaw) : 0,
                    experienceLevel: hasExperience ? experienceRaw.toString().trim() : "",
                  };

                  const existing = existingTechnicalSkills.find((s: any) =>
                    normalizeId(s.employeeId || s.employee_id) === employeeId &&
                    (s.skillId === skillId ||
                      (normalizeString(s.skillName || s.skill_name) === skNameNorm &&
                        normalizeString(s.categoryName || s.category_name) === catNameNorm &&
                        normalizeString(s.subCategoryName || s.sub_category_name) === subNameNorm))
                  );

                  const key = `${employeeId}|${skillId}`;
                  if (existing) {
                    const existingYears = existing.yearsOfExperience || existing.years_of_experience || 0;
                    const existingExp = (existing.experienceLevel || existing.experience_level || "").toString().trim();

                    const epsilon = 0.00001;
                    const hasChanged =
                      Math.abs(existingYears - techData.yearsOfExperience) > epsilon ||
                      normalizeString(existingExp) !== normalizeString(techData.experienceLevel);

                    if (hasChanged) {
                      technicalToUpdate.set(key, { id: existing.id, data: techData });
                    }
                  } else {
                    technicalToCreate.set(key, techData);
                  }
                }

                processedSkills.add(skillKey);
              }
            }
          }

          // ===== PROCESS NEW SKILLS (AA, etc.) =====
          if (newSkillsMap.size > 0) {
            for (const [skillName, info] of newSkillsMap) {
              const yearsRaw = emp[info.yearsHeader];
              const experienceRaw = emp[info.expHeader];

              const hasYears = yearsRaw !== undefined && yearsRaw !== null && yearsRaw !== '' && !isNaN(parseFloat(yearsRaw)) && parseFloat(yearsRaw) > 0;
              const hasExperience = experienceRaw !== undefined && experienceRaw !== null && experienceRaw.toString().trim().length > 0;

              if (hasYears || hasExperience) {
                const skNameNorm = normalizeString(skillName);
                let skillId = null;

                for (const [key, id] of skillIdLookup) {
                  if (key.includes(`|${skNameNorm}`)) {
                    skillId = id;
                    break;
                  }
                }

                if (!skillId) {
                  console.warn(`⚠️ Could not find ID for new skill: ${skillName}`);
                  continue;
                }

                const techData = {
                  employeeId: employeeId,
                  skillId: skillId,
                  skillName: skillName,
                  categoryName: info.category || 'Uncategorized',
                  subCategoryName: info.subcategory || 'Uncategorized',
                  yearsOfExperience: hasYears ? parseFloat(yearsRaw) : 0,
                  experienceLevel: hasExperience ? experienceRaw.toString().trim() : "",
                };

                const existing = existingTechnicalSkills.find((s: any) =>
                  normalizeId(s.employeeId || s.employee_id) === employeeId &&
                  normalizeString(s.skillName || s.skill_name) === skNameNorm
                );

                const key = `${employeeId}|${skillId}`;
                if (existing) {
                  const existingYears = existing.yearsOfExperience || existing.years_of_experience || 0;
                  const existingExp = (existing.experienceLevel || existing.experience_level || "").toString().trim();

                  const epsilon = 0.00001;
                  const hasChanged =
                    Math.abs(existingYears - techData.yearsOfExperience) > epsilon ||
                    normalizeString(existingExp) !== normalizeString(techData.experienceLevel);

                  if (hasChanged) {
                    technicalToUpdate.set(key, { id: existing.id, data: techData });
                  }
                } else {
                  technicalToCreate.set(key, techData);
                }
              }
            }
          }
        }

        // ===== PREPARE ARRAYS FOR BULK OPERATIONS =====
        const mgmtCreateArr = Array.from(managementToCreate.values());
        const langCreateArr = Array.from(languageToCreate.values());
        const devCreateArr = Array.from(developmentToCreate.values());
        const techCreateArr = Array.from(technicalToCreate.values());

        const mgmtUpdateArr = Array.from(managementToUpdate.values());
        const langUpdateArr = Array.from(languageToUpdate.values());
        const devUpdateArr = Array.from(developmentToUpdate.values());
        const techUpdateArr = Array.from(technicalToUpdate.values());

        const totalCreate = mgmtCreateArr.length + langCreateArr.length + devCreateArr.length + techCreateArr.length;
        const totalUpdate = mgmtUpdateArr.length + langUpdateArr.length + devUpdateArr.length + techUpdateArr.length;

        if (totalCreate === 0 && totalUpdate === 0) {
          let msg = '⚠️ No new or updated skill data to import.';
          if (skippedEmployees.size > 0) {
            msg += ` ${skippedEmployees.size} employees were skipped because they don't exist in the system.`;
          }
          alert(msg);
          return { success: false, message: 'No data to import' };
        }

        let confirmMsg = `Import summary for ${employees.length - skippedEmployees.size} employees:\n\n` +
          `Create New Records:\n` +
          `- Management: ${mgmtCreateArr.length}\n` +
          `- Language: ${langCreateArr.length}\n` +
          `- Development: ${devCreateArr.length}\n` +
          `- Technical: ${techCreateArr.length}\n\n` +
          `Update Existing Records:\n` +
          `- Management: ${mgmtUpdateArr.length}\n` +
          `- Language: ${langUpdateArr.length}\n` +
          `- Development: ${devUpdateArr.length}\n` +
          `- Technical: ${techUpdateArr.length}\n`;

        if (skippedEmployees.size > 0) {
          confirmMsg += `\n⚠️ ${skippedEmployees.size} employees will be skipped (ID not found in system).`;
        }

        confirmMsg += `\n\nContinue?`;

        const shouldProceed = confirm(confirmMsg);

        if (!shouldProceed) return { success: false, message: 'Import cancelled' };

        // ===== PERFORM OPERATIONS =====
        let successCount = 0;

        // 1. Bulk Creates
        if (mgmtCreateArr.length > 0) {
          try {
            await store.add_BulkManagementSkills(mgmtCreateArr);
            successCount += mgmtCreateArr.length;
            console.log(`✅ Created ${mgmtCreateArr.length} management skills`);
          } catch (error) {
            console.error('❌ Failed to create management skills:', error);
          }
        }

        if (langCreateArr.length > 0) {
          try {
            await store.add_BulkLanguageSkills(langCreateArr);
            successCount += langCreateArr.length;
            console.log(`✅ Created ${langCreateArr.length} language skills`);
          } catch (error) {
            console.error('❌ Failed to create language skills:', error);
          }
        }

        if (devCreateArr.length > 0) {
          try {
            await store.add_BulkDevelopmentSkills(devCreateArr);
            successCount += devCreateArr.length;
            console.log(`✅ Created ${devCreateArr.length} development skills`);
          } catch (error) {
            console.error('❌ Failed to create development skills:', error);
            for (const item of devCreateArr) {
              try {
                await store.add_devCapData(item);
                successCount++;
              } catch (indError) {
                console.error(`❌ Failed to create development for employee ${item.employeeId}:`, indError);
              }
            }
          }
        }

        if (techCreateArr.length > 0) {
          try {
            await store.add_BulkTechnicalSkills(techCreateArr);
            successCount += techCreateArr.length;
            console.log(`✅ Created ${techCreateArr.length} technical skills`);
          } catch (error) {
            console.error('❌ Failed to create technical skills:', error);
            for (const item of techCreateArr) {
              try {
                await store.add_SkillData(item);
                successCount++;
              } catch (indError) {
                console.error(`❌ Failed to create technical for employee ${item.employeeId}:`, indError);
              }
            }
          }
        }

        // 2. Individual Updates
        for (const item of mgmtUpdateArr) {
          try {
            await store.update_managementScoreData(item.id, item.data);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update management skill ${item.id}:`, error);
          }
        }

        for (const item of langUpdateArr) {
          try {
            await store.update_japaneseLevel(item.id, item.data);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update language skill ${item.id}:`, error);
          }
        }

        for (const item of devUpdateArr) {
          try {
            await store.update_devCapData(item.id, item.data);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update development skill ${item.id}:`, error);
          }
        }

        for (const item of techUpdateArr) {
          try {
            await store.update_SkillData(item.id, item.data);
            successCount++;
          } catch (error) {
            console.error(`❌ Failed to update technical skill ${item.id}:`, error);
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
        alert(`✅ Successfully processed ${successCount} skill records in ${totalTime}s!`);

        return { success: true, message: `Processed ${successCount} records` };

      } catch (error) {
        console.error('❌ Skills import error:', error);
        alert(`❌ Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
      }
    },
    onExport: async (format: string) => {

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
      try {
        const startTime = performance.now();

        // Extract current target data from Excel
        const extractedData = await extractCurrentTargetDataFromExcel(file);

        if (!extractedData.success || extractedData.data.length === 0) {
          alert('No current target data found in the Excel file. Please check the data.');
          return { success: false, message: extractedData.error || 'No data found' };
        }

        // Access store via window
        const store = (window as any).mainStore?.getState();
        if (!store || !store.bulkCreate_CurrentTargetData) {
          throw new Error('System store not initialized. Please refresh and try again.');
        }


        // ===== FETCH EMPLOYEE DATA FIRST =====
        let existingEmployeeIds = new Set<string>();
        try {
          console.log('📋 Checking employee data in store...');

          // Check if employee_data is empty
          if (!store.employee_data || store.employee_data.length === 0) {
            console.log('📋 Employee data is empty. Fetching from API...');

            // Show loading message
            const loadingMessage = 'Fetching employee data from system. Please wait...';
            console.log(loadingMessage);

            // Fetch employee data
            await store.fetch_EmployeeData();

            // Get fresh state after fetch
            const freshStore = (window as any).mainStore?.getState();
            if (!freshStore || !freshStore.employee_data || freshStore.employee_data.length === 0) {
              console.warn('⚠️ Still no employee data after fetch. Proceeding without employee validation.');
            } else {
              console.log(`✅ Fetched ${freshStore.employee_data.length} employees from system`);
            }
          } else {
            console.log(`✅ Found ${store.employee_data.length} employees in store`);
          }

          // Get the latest employee data (either from store or after fetch)
          const currentStore = (window as any).mainStore?.getState();
          const employeeData = currentStore?.employee_data || [];

          // Extract employee IDs
          existingEmployeeIds = new Set(
            employeeData.map((emp: any) => emp.id || emp.employeeId || emp.staffId)
          );

          console.log(`📋 Extracted ${existingEmployeeIds.size} unique employee IDs`);

          // Log first few IDs for debugging
          if (existingEmployeeIds.size > 0) {
            const sampleIds = Array.from(existingEmployeeIds).slice(0, 5);
            console.log('📋 Sample employee IDs:', sampleIds);
          }

        } catch (error) {
          console.warn('⚠️ Error fetching employee data:', error);
          console.warn('⚠️ Proceeding without employee validation. Backend will validate.');
        }

        // ===== VALIDATE WITH EMPLOYEE EXISTENCE CHECK =====
        const validationStart = performance.now();

        let valid: CurrentTargetRow[] = [];
        let invalid: { data: CurrentTargetRow; errors: string[] }[] = [];

        if (existingEmployeeIds.size > 0) {
          // Use employee validation
          const result = validateCurrentTargetDataWithEmployees(
            extractedData.data,
            existingEmployeeIds
          );
          valid = result.valid;
          invalid = result.invalid;
        } else {
          // Fallback to basic validation (only checks Staff ID presence and duplicates)
          console.warn('⚠️ No employee data available. Using basic validation only.');
          const result = validateCurrentTargetData(extractedData.data);
          valid = result.valid;
          invalid = result.invalid;
        }

        console.log(`✅ Validation completed in ${(performance.now() - validationStart).toFixed(0)}ms`);
        console.log(`📊 Valid: ${valid.length}, Invalid: ${invalid.length}`);

        // Log all invalid rows with details
        if (invalid.length > 0) {
          console.warn(`⚠️ ${invalid.length} invalid rows found:`);
          console.table(invalid.map((item, index) => ({
            Row: index + 1,
            StaffId: item.data["Staff ID"] || 'MISSING',
            Errors: item.errors.join('; ')
          })));

          // Separate errors by type
          const missingEmployeeErrors = invalid.filter(
            item => item.errors.some(e => e.includes('does NOT exist'))
          );
          const duplicateErrors = invalid.filter(
            item => item.errors.some(e => e.includes('Duplicate'))
          );
          const missingIdErrors = invalid.filter(
            item => item.errors.some(e => e.includes('required'))
          );

          let message = `⚠️ ${invalid.length} rows have issues:\n\n`;
          message += `✅ Valid rows: ${valid.length}\n`;
          message += `❌ Invalid rows: ${invalid.length}\n\n`;

          if (missingEmployeeErrors.length > 0) {
            message += `🚫 ${missingEmployeeErrors.length} rows: Staff ID does not exist in system\n`;
            message += `   Please create these employees first or correct the Staff IDs.\n\n`;
          }
          if (duplicateErrors.length > 0) {
            message += `🔄 ${duplicateErrors.length} rows: Duplicate Staff IDs\n\n`;
          }
          if (missingIdErrors.length > 0) {
            message += `❌ ${missingIdErrors.length} rows: Missing Staff ID\n\n`;
          }

          message += `Continue with ${valid.length} valid rows?`;

          const shouldContinue = confirm(message);
          if (!shouldContinue) {
            return { success: false, message: 'Import cancelled by user' };
          }
        }

        if (valid.length === 0) {
          alert('No valid current target records found. Please check the data.');
          return { success: false, message: 'No valid data' };
        }

        // ===== DOUBLE-CHECK: Filter out any records with invalid employee IDs =====
        const apiData = transformToApiFormat(valid);
        let filteredApiData = apiData;

        if (existingEmployeeIds.size > 0) {
          filteredApiData = apiData.filter(record => {
            if (!record.employeeId) {
              console.warn(`⚠️ Skipping record with no employee ID`);
              return false;
            }
            if (!existingEmployeeIds.has(record.employeeId)) {
              console.warn(`⚠️ Skipping employee "${record.employeeId}" - does not exist in system`);
              return false;
            }
            return true;
          });

          const skippedCount = apiData.length - filteredApiData.length;
          if (skippedCount > 0) {
            console.log(`📊 Skipped ${skippedCount} records with invalid employee IDs`);
            alert(`ℹ️ ${skippedCount} records were skipped because the employee IDs don't exist in the system.\n\nContinuing with ${filteredApiData.length} records.`);
          }
        }

        if (filteredApiData.length === 0) {
          alert('No valid records to import. All records have invalid employee IDs.');
          return { success: false, message: 'No valid records to import' };
        }

        const shouldProceed = confirm(
          `You are about to import ${filteredApiData.length} current target profiles into the database. This may take a few moments.\n\n` +
          `Continue?`
        );

        if (!shouldProceed) {
          return { success: false, message: 'Import cancelled by user' };
        }

        // Import in smaller batches for better reliability
        const BATCH_SIZE = 25;
        let importedCount = 0;
        const totalBatches = Math.ceil(filteredApiData.length / BATCH_SIZE);


        for (let i = 0; i < filteredApiData.length; i += BATCH_SIZE) {
          const batch = filteredApiData.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const startIndex = i;
          let batchImported = false;

          try {
            console.log(`\n📦 Processing Batch ${batchNumber}/${totalBatches}`);
            await store.bulkCreate_CurrentTargetData(batch);
            importedCount += batch.length;
            console.log(`✅ Batch ${batchNumber} completed successfully`);
            batchImported = true;
          } catch (error) {
            // Don't log the full error here - it's handled by retry
            console.warn(`⚠️ Batch ${batchNumber} failed as batch, retrying individually...`);

            // Try to import failed batch one by one
            let successCount = 0;
            for (let j = 0; j < batch.length; j++) {
              const recordIndex = startIndex + j;
              try {
                await store.bulkCreate_CurrentTargetData([batch[j]]);
                importedCount++;
                successCount++;
                // Log progress every 10 records
                if (successCount % 10 === 0 || successCount === batch.length) {
                  console.log(`   📊 Imported ${successCount}/${batch.length} records from batch ${batchNumber}`);
                }
              } catch (retryError) {
                // Silently log the failure (or skip logging entirely)
                console.debug(`   ⚠️ Record ${recordIndex + 1} (${batch[j].employeeId || 'NO_ID'}) failed`);
              }
            }

            if (successCount === batch.length) {
              console.log(`✅ Batch ${batchNumber} completed successfully (individual imports)`);
            } else {
              console.log(`⚠️ Batch ${batchNumber} partially completed: ${successCount}/${batch.length} records`);
            }
          }
        }

        const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
        const finalMessage = `Successfully imported ${importedCount} out of ${filteredApiData.length} records in ${totalTime}s.`;
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