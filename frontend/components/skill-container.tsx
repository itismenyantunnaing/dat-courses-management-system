/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  MoreHorizontalIcon,
  EditIcon,
  Delete02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import { EmployeeSkill, SkillSubCategory, SkillCategory, Skill, DevelopmentCapability, EmployeeDevelopmentExperience, type LanguageSkill, type ManagementScore } from "@/types/skillset"
import { Employee } from "@/types/employee"

const STROKE_WIDTH = 2;

type GroupedSkill = {
  skill_id: number;
  skill_name: string;
  sub_category_name: string;
};

const BorderedTableCell = ({ children, className = "", ...props }: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableCell>
)

const BorderedTableHead = ({ children, className = "", ...props }: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableHead>
)

const getExperienceLevelColor = (level: string): string => {
  const levelColors: Record<string, string> = {
    "Expert": "bg-yellow-100 text-yellow-800",
    "Architecture": "bg-indigo-100 text-indigo-800",
    "Optimization": "bg-orange-100 text-orange-800",
    "Component Design": "bg-cyan-100 text-cyan-800",
    "Deployment": "bg-teal-100 text-teal-800",
    "Type Safety": "bg-pink-100 text-pink-800",
    "API Development": "bg-emerald-100 text-emerald-800",
    "Query Optimization": "bg-amber-100 text-amber-800",
    "Database Administration": "bg-red-100 text-red-800",
    "Caching": "bg-lime-100 text-lime-800",
    "Framework Expert": "bg-violet-100 text-violet-800",
    "Microservices": "bg-fuchsia-100 text-fuchsia-800",
    "Cloud Architecture": "bg-sky-100 text-sky-800",
    "Migration": "bg-rose-100 text-rose-800",
    "Scripting": "bg-stone-100 text-stone-800",
    "Data Modeling": "bg-neutral-100 text-neutral-800",
    "State Management": "bg-blue-100 text-blue-800",
    "Real-time Apps": "bg-green-100 text-green-800",
    "DevOps": "bg-indigo-100 text-indigo-800",
    "Performance Tuning": "bg-orange-100 text-orange-800",
    "Type Integration": "bg-purple-100 text-purple-800",
    "Setup": "bg-gray-100 text-gray-800",
  }
  return levelColors[level] || "bg-gray-100 text-gray-800"
}

export function SkillContainer({ searchPlaceholder = "Search employees..." }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [skillMap, setSkillMap] = useState<Map<string, Map<number, { years: number | null; level: string | null }>>>(new Map());
  const [devCapMap, setDevCapMap] = useState<Map<string, Map<number, { years: number | null; experience: string | null; process_name: string | null }>>>(new Map());
  const [languageSkillMap, setLanguageSkillMap] = useState<Map<string, { language_skill_level: number | null; jlpt_highest_level: string | null }>>(new Map());
  const [managementScoresMap, setManagementScoresMap] = useState<Map<string, ManagementScore>>(new Map());

  // Column visibility state using radio-style selection
  const [selectedSection, setSelectedSection] = useState<string>("all")

  const { fetch_EmployeeData, employee_data, fetch_SkillHeaders, skill_headers, fetch_SkillData, skillData, fetch_devCapHeaders, devCap_headers, fetch_devCapData, devCap_data, fetch_languageSkillData, languageSkill_data, fetch_managementScoreData, managementScores_Data } = mainStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetch_EmployeeData(),
        fetch_SkillHeaders(),
        fetch_SkillData(),
        fetch_devCapHeaders(),
        fetch_devCapData(),
        fetch_languageSkillData(),
        fetch_managementScoreData()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetch_EmployeeData, fetch_SkillHeaders, fetch_SkillData, fetch_devCapHeaders, fetch_devCapData]);

  // Employee data
  useEffect(() => {
    if (employee_data && employee_data.length > 0) {
      setEmployees(employee_data);
    }
  }, [employee_data]);

  // Build skill map for quick lookup: employee_id -> Map<skill_id, { years, level }>
  useEffect(() => {
    if (skillData && skillData.length > 0) {
      const map = new Map<string, Map<number, { years: number | null; level: string | null }>>();

      skillData.forEach((skill: EmployeeSkill) => {
        const employeeId = skill.employee_id; // Keep as string "1002"
        if (!map.has(employeeId)) {
          map.set(employeeId, new Map());
        }
        const employeeSkillMap = map.get(employeeId)!;
        employeeSkillMap.set(skill.skill_id, {
          years: skill.years_of_experience,
          level: skill.experience_level
        });
      });

      setSkillMap(map);
    }
  }, [skillData]);

  // Build devCap map for quick lookup: employee_id -> Map<development_type_id, { years, experience, process_name }>
  useEffect(() => {
    if (devCap_data && devCap_data.length > 0) {
      const map = new Map<string, Map<number, { years: number | null; experience: string | null; process_name: string | null }>>();

      devCap_data.forEach((devCap: EmployeeDevelopmentExperience) => {
        const employeeId = devCap.employee_id; // Keep as string "1002"
        if (!map.has(employeeId)) {
          map.set(employeeId, new Map());
        }
        const employeeDevCapMap = map.get(employeeId)!;
        employeeDevCapMap.set(devCap.development_type_id, {
          years: devCap.years_of_experience,
          experience: devCap.development_type_name,
          process_name: devCap.process_name
        });
      });

      setDevCapMap(map);
    }
  }, [devCap_data]);

  // Build language skill map for quick lookup: staff_id -> { language_skill_level, jlpt_highest_level }
  useEffect(() => {
    if (languageSkill_data && languageSkill_data.length > 0) {
      const map = new Map<string, { language_skill_level: number | null; jlpt_highest_level: string | null }>();

      languageSkill_data.forEach((skill: LanguageSkill) => {
        map.set(skill.employee_id, {
          language_skill_level: skill.language_skill_level,
          jlpt_highest_level: skill.jlpt_highest_level
        });
      });

      setLanguageSkillMap(map);
    }
  }, [languageSkill_data]);

  // Build management scores map for quick lookup: employee_id -> ManagementScore
  useEffect(() => {
    if (managementScores_Data && managementScores_Data.length > 0) {
      const map = new Map<string, ManagementScore>();
      managementScores_Data.forEach((score: ManagementScore) => {
        map.set(score.employee_id, score);
      });
      setManagementScoresMap(map);
    }
  }, [managementScores_Data]);


  // Build dynamic skills list from skill_headers
  const dynamicSkillsList = useMemo(() => {
    const skills: { id: number; name: string; category: string; sub_category: string }[] = [];
    (skill_headers || []).forEach((category: SkillCategory) => {
      category.skill_sub_categories?.forEach((subCategory: SkillSubCategory) => {
        subCategory.skills?.forEach((skill: Skill) => {
          skills.push({
            id: skill.id,
            name: skill.skill_name,
            category: category.category_name,
            sub_category: subCategory.sub_category_name,
          });
        });
      });
    });
    return skills;
  }, [skill_headers]);

  // Group skills by category
  const dynamicSkillsByCategory = useMemo(() => {
    const grouped: Record<string, GroupedSkill[]> = {};
    (skill_headers || []).forEach((category) => {
      const categoryName = category.category_name;
      grouped[categoryName] = [];
      category.skill_sub_categories?.forEach((subCategory) => {
        subCategory.skills?.forEach((skill) => {
          grouped[categoryName].push({
            skill_id: skill.id,
            skill_name: skill.skill_name,
            sub_category_name: subCategory.sub_category_name,
          });
        });
      });
    });
    return grouped;
  }, [skill_headers]);

  const filteredEmployees = employees.filter((employee) => {
    return employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage)

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  const handleDeleteClick = (employee: { id: string; name: string }) => {
    setEmployeeToDelete(employee)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      // Handle delete logic here
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1)
      pages.push("...")
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  // Column headers - Employee section (always visible)
  const employeeHeaders = [
    { field: "team", header_name: "Team" },
    { field: "staff_id", header_name: "Staff ID" },
    { field: "name", header_name: "Name" },
    { field: "dept", header_name: "Name of the commissioning department *Select from the dropdown menu" },
    { field: "is_core_personnel", header_name: "Core personnel *FPT only" },
    { field: "has_japan_business_trip", header_name: " Whether or not you have a business trip to Japan" },
  ];

  const administratorHeaders = [
    { field: "management_experience_level", header_name: "Management experience (Levels 1-5)" },
    { field: "qcd_score", header_name: "QCD (1-4 points)" },
    { field: "report_consult_score", header_name: "Reporting, contacting, and consulting (1-4 points)" },
    { field: "education_score", header_name: "Education (1-4 points)" },
    { field: "total_level", header_name: "Total (Levels 1-5)" },
  ];

  const languageSkillHeaders = [
    { field: "language_level", header_name: "Level (Levels 1-5)" },
    { field: "jlpt_nat_score", header_name: "JLPT/NAT (N1~N5)" },
  ];

  const totalSkillColumns = dynamicSkillsList.length * 2
  const totalColumns = employeeHeaders.length + 1 + totalSkillColumns // +1 for Actions

  // Check if a section should be visible based on selected section
  const showAdministrator = selectedSection === "all" || selectedSection === "administrator";
  const showDeveloper = selectedSection === "all" || selectedSection === "developer";
  const showTechnicalAbility = selectedSection === "all" || selectedSection === "technicalAbility";

  // Section display names for the column visibility dropdown
  const sectionDisplayNames = {
    administrator: "Administrator",
    developer: "Developer",
    technicalAbility: "Technical Ability",
  }

  // Handle section selection (radio button style)
  const handleSectionSelect = (sectionKey: string) => {
    if (sectionKey === "all") {
      setSelectedSection("all")
    } else {
      // If clicking the already selected section, go back to "all"
      if (selectedSection === sectionKey) {
        setSelectedSection("all")
      } else {
        setSelectedSection(sectionKey)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading skills data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 py-6">
        <CardContent className="px-4">
          {/* Filters Section */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={STROKE_WIDTH}
                className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground"
              />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              {/* Column Visibility Dropdown with Radio-style selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="h-4 w-4" />
                    {selectedSection === "all" ? "All Sections" : sectionDisplayNames[selectedSection as keyof typeof sectionDisplayNames]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Filter Skill Sections</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Employee columns are always visible
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Show All Sections - acts as a toggle/reset */}
                  <DropdownMenuCheckboxItem
                    checked={selectedSection === "all"}
                    onCheckedChange={() => handleSectionSelect("all")}
                    className="font-medium"
                  >
                    Show All Sections
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Individual Sections - Radio button style */}
                  {Object.entries(sectionDisplayNames).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={selectedSection === key}
                      onCheckedChange={() => handleSectionSelect(key)}
                      className="pl-6"
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs text-muted-foreground">
                      {selectedSection === "all" 
                        ? "Showing all sections" 
                        : `Showing only: ${sectionDisplayNames[selectedSection as keyof typeof sectionDisplayNames]}`}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-md border" style={{ zIndex: 1 }}>
            <Table>
              <TableHeader>
                {/* ROW 1: Main Categories */}
                <TableRow className="bg-muted/50">
                  {/* Base employee headers (Always visible) */}
                  {employeeHeaders.map((header) => (
                    <BorderedTableHead
                      key={header.field}
                      rowSpan={5}
                      className="align-middle"
                    >
                      {header.header_name}
                    </BorderedTableHead>
                  ))}

                  {/* ADMINISTRATOR MAIN HEADER - Column Filterable */}
                  {showAdministrator && (
                    <BorderedTableHead
                      colSpan={5}
                      className="align-middle font-bold"
                    >
                      Administrator
                    </BorderedTableHead>
                  )}

                  {/* DEVELOPER HEADER - Column Filterable */}
                  {showDeveloper && (
                    <BorderedTableHead
                      colSpan={10}
                      className="align-middle whitespace-nowrap"
                    >
                      Developer (DIR and YSX tasks only)
                    </BorderedTableHead>
                  )}

                  {/* TECHNICAL ABILITY HEADER - Column Filterable */}
                  {showTechnicalAbility && (
                    <BorderedTableHead
                      colSpan={Object.values(dynamicSkillsByCategory).reduce(
                        (total, skills) => total + skills.length * 2,
                        0
                      )}
                      className="align-middle whitespace-nowrap"
                    >
                      Technical Ability
                    </BorderedTableHead>
                  )}

                  <BorderedTableHead
                    rowSpan={5}
                    className="text-right align-middle whitespace-nowrap"
                  >
                    Actions
                  </BorderedTableHead>
                </TableRow>

                {/* ROW 2: Administrator Sub-categories & Main Dynamic Skill Categories */}
                <TableRow className="bg-muted/50">
                  {/* Administrator Sub-categories */}
                  {showAdministrator && (
                    <>
                      <BorderedTableHead
                        rowSpan={4}
                        className="align-middle text-center whitespace-normal"
                      >
                        {administratorHeaders[0].header_name}
                      </BorderedTableHead>
                      <BorderedTableHead
                        colSpan={4}
                        className="text-center align-middle"
                      >
                        management ability
                      </BorderedTableHead>
                    </>
                  )}

                  {/* Developer Sub-categories */}
                  {showDeveloper && (
                    <>
                      <BorderedTableHead
                        colSpan={2}
                        className="align-middle text-center"
                      >
                        language skills
                      </BorderedTableHead>
                      <BorderedTableHead
                        colSpan={8}
                        className="align-middle text-center"
                      >
                        Development capabilities
                      </BorderedTableHead>
                    </>
                  )}

                  {/* Technical Ability Sub-categories */}
                  {showTechnicalAbility && (
                    <>
                      {Object.entries(dynamicSkillsByCategory).map(([categoryName, skills]) => {
                        if (categoryName === "empty") {
                          const subCategoryMap: Record<string, { count: number; skills: GroupedSkill[] }> = {}
                          skills.forEach((skill) => {
                            const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name
                            if (!subCategoryMap[subName]) {
                              subCategoryMap[subName] = { count: 0, skills: [] }
                            }
                            subCategoryMap[subName].count += 2
                            subCategoryMap[subName].skills.push(skill)
                          })

                          return Object.entries(subCategoryMap).map(([subCategoryName, { count }]) => (
                            <BorderedTableHead
                              key={`empty-${subCategoryName}`}
                              colSpan={count}
                              rowSpan={2}
                              className="text-center align-middle"
                            >
                              {subCategoryName}
                            </BorderedTableHead>
                          ));
                        }

                        const hasOnlyEmptySubCategories = skills.every(
                          (skill) => skill.sub_category_name === "empty"
                        );

                        if (hasOnlyEmptySubCategories) {
                          return (
                            <BorderedTableHead
                              key={categoryName}
                              colSpan={skills.length * 2}
                              rowSpan={2}
                              className="text-center align-middle"
                            >
                              {categoryName}
                            </BorderedTableHead>
                          );
                        }
                        return (
                          <BorderedTableHead
                            key={categoryName}
                            colSpan={skills.length * 2}
                            className="text-center"
                          >
                            {categoryName}
                          </BorderedTableHead>
                        );
                      })}
                    </>
                  )}
                </TableRow>

                {/* ROW 3: Administrator Ability Sub-columns & Technical Sub Categories */}
                <TableRow className="bg-muted/30">
                  {/* Administrator sub-columns */}
                  {showAdministrator && (
                    <>
                      {administratorHeaders.slice(1, 5).map((header) => (
                        <BorderedTableHead
                          key={header.field}
                          rowSpan={3}
                          className="text-center align-middle"
                          style={{ width: header.field === "report_consult_score" ? "150px" : "100px" }}
                        >
                          {header.header_name}
                        </BorderedTableHead>
                      ))}
                    </>
                  )}

                  {/* Developer sub-columns */}
                  {showDeveloper && (
                    <>
                      {languageSkillHeaders.slice(0, 2).map((header) => (
                        <BorderedTableHead
                          key={header.field}
                          rowSpan={3}
                          className="align-middle text-center"
                        >
                          {header.header_name}
                        </BorderedTableHead>
                      ))}
                      {(devCap_headers || []).map((header: DevelopmentCapability) => (
                        <BorderedTableHead
                          key={header.id}
                          rowSpan={2}
                          colSpan={2}
                          className="align-middle text-center"
                        >
                          {header.development_type}
                        </BorderedTableHead>
                      ))}
                    </>
                  )}

                  {/* Technical Ability sub-categories */}
                  {showTechnicalAbility && (
                    <>
                      {Object.entries(dynamicSkillsByCategory).map(([categoryName, skills]) => {
                        if (categoryName === "empty" || skills.every((skill) => skill.sub_category_name === "empty")) {
                          return null;
                        }

                        const subCategoryMap: Record<string, { count: number; skills: GroupedSkill[] }> = {}
                        skills.forEach((skill) => {
                          const subName = skill.sub_category_name === "empty" ? "" : skill.sub_category_name
                          if (!subCategoryMap[subName]) {
                            subCategoryMap[subName] = { count: 0, skills: [] }
                          }
                          subCategoryMap[subName].count += 2
                          subCategoryMap[subName].skills.push(skill)
                        })

                        return Object.entries(subCategoryMap).map(([subCategoryName, { count }]) => (
                          <BorderedTableHead
                            key={`${categoryName}-${subCategoryName}`}
                            colSpan={count}
                            className="text-center"
                          >
                            {subCategoryName}
                          </BorderedTableHead>
                        ))
                      })}
                    </>
                  )}
                </TableRow>

                {/* ROW 4: Technical Individual Skills */}
                <TableRow className="bg-muted/20">
                  {showTechnicalAbility && (
                    <>
                      {dynamicSkillsList.map((skill) => (
                        <BorderedTableHead key={skill.id} colSpan={2} className="text-center">
                          {skill.name}
                        </BorderedTableHead>
                      ))}
                    </>
                  )}
                </TableRow>

                {/* ROW 5: Technical Years and Experience subheaders */}
                <TableRow className="bg-muted/10">
                  {showDeveloper && (
                    <>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <React.Fragment key={`dev-${index}`}>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            Years
                          </BorderedTableHead>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            Experience
                          </BorderedTableHead>
                        </React.Fragment>
                      ))}
                    </>
                  )}

                  {showTechnicalAbility && (
                    <>
                      {dynamicSkillsList.map((skill) => (
                        <React.Fragment key={`${skill.id}-sub`}>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            Years
                          </BorderedTableHead>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            Experience
                          </BorderedTableHead>
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <BorderedTableCell colSpan={totalColumns} className="py-8 text-center text-muted-foreground">
                      No employees found
                    </BorderedTableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee) => {
                    const employeeId = Number(employee.id)
                    const employeeSkills = skillMap.get(employee.id) || new Map();
                    const employeeDevCaps = devCapMap.get(employee.id) || new Map();
                    const employeeLanguageSkill = languageSkillMap.get(employee.id);
                    const employeeManagementScore = managementScoresMap.get(employee.id);

                    return (
                      <TableRow key={employee.id}>
                        {/* Employee Info Columns - Always visible */}
                        <BorderedTableCell>{employee.team || "-"}</BorderedTableCell>
                        <BorderedTableCell className="font-mono text-sm">
                          {employee.id || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell className="font-medium">
                          {employee.name}
                        </BorderedTableCell>
                        <BorderedTableCell>{employee.dept_dir || "-"}</BorderedTableCell>
                        <BorderedTableCell>
                          <Badge variant={employee.is_core_personnel ? "default" : "outline"}>
                            {employee.is_core_personnel ? "Yes" : "No"}
                          </Badge>
                        </BorderedTableCell>
                        <BorderedTableCell>
                          <Badge variant={employee.has_japan_business_trip ? "default" : "outline"}>
                            {employee.has_japan_business_trip ? "Yes" : "No"}
                          </Badge>
                        </BorderedTableCell>

                        {/* Administrator Columns - Column Filterable */}
                        {showAdministrator && (
                          <>
                            {[
                              { key: 'management_experience_level', fallback: '-' },
                              { key: 'qcd_score', fallback: '-' },
                              { key: 'report_consult_score', fallback: '-' },
                              { key: 'education_score', fallback: '-' },
                              { key: 'total_level', fallback: '-' }
                            ].map((field) => (
                              <BorderedTableCell key={field.key} className="text-center">
                                {employeeManagementScore?.[field.key as keyof ManagementScore] ?? field.fallback}
                              </BorderedTableCell>
                            ))}
                          </>
                        )}

                        {/* Developer Columns - Column Filterable */}
                        {showDeveloper && (
                          <>
                            {/* Language Skills */}
                            {['language_skill_level', 'jlpt_highest_level'].map((field) => (
                              <BorderedTableCell key={field} className="text-center">
                                {employeeLanguageSkill?.[field as keyof typeof employeeLanguageSkill] ? (
                                  <Badge className="text-xs bg-purple-100 text-purple-800">
                                    {field === 'language_skill_level'
                                      ? `Level ${employeeLanguageSkill.language_skill_level}`
                                      : employeeLanguageSkill.jlpt_highest_level}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </BorderedTableCell>
                            ))}

                            {/* Development Capabilities */}
                            {(devCap_headers || []).map((header: DevelopmentCapability) => {
                              const devCapData = employeeDevCaps.get(header.id);
                              const years = devCapData?.years || 0;
                              const experience = devCapData?.experience || null;

                              return (
                                <React.Fragment key={header.id}>
                                  <BorderedTableCell className="text-center">
                                    {years > 0 ? (
                                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                                        {years} year{years !== 1 ? "s" : ""}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </BorderedTableCell>
                                  <BorderedTableCell className="text-center">
                                    {experience ? (
                                      <Badge className="text-xs bg-blue-100 text-blue-800">
                                        {experience}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </BorderedTableCell>
                                </React.Fragment>
                              );
                            })}
                          </>
                        )}

                        {/* Technical Skills Cells - Column Filterable */}
                        {showTechnicalAbility && (
                          <>
                            {dynamicSkillsList.map((skill) => {
                              const skillData = employeeSkills.get(skill.id);
                              const years = skillData?.years;
                              const level = skillData?.level;

                              return (
                                <React.Fragment key={skill.id}>
                                  <BorderedTableCell className="text-center">
                                    {years && years > 0 ? (
                                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                                        {years} year{years !== 1 ? "s" : ""}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </BorderedTableCell>
                                  <BorderedTableCell className="text-center">
                                    {level ? (
                                      <Badge className={`text-xs ${getExperienceLevelColor(level)}`}>
                                        {level}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">-</span>
                                    )}
                                  </BorderedTableCell>
                                </React.Fragment>
                              )
                            })}
                          </>
                        )}

                        {/* Actions */}
                        <BorderedTableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={STROKE_WIDTH} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <HugeiconsIcon icon={EditIcon} strokeWidth={STROKE_WIDTH} />
                                Edit employee
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                variant="destructive"
                                onSelect={() => handleDeleteClick({ id: employee.id, name: employee.name })}
                              >
                                <HugeiconsIcon icon={Delete02Icon} strokeWidth={STROKE_WIDTH} />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </BorderedTableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Field orientation="horizontal" className="w-fit">
              <FieldLabel htmlFor="select-rows-per-page">Rows per page</FieldLabel>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-18" id="select-rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="text-sm text-muted-foreground">
              Showing {filteredEmployees.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </div>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePrevious() }}
                    className={currentPage === 1 || filteredEmployees.length === 0 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "..." ? (
                      <span className="px-2">...</span>
                    ) : (
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => { e.preventDefault(); setCurrentPage(page as number) }}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleNext() }}
                    className={currentPage === totalPages || filteredEmployees.length === 0 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {employeeToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}