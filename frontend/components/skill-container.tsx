/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Settings01Icon,
  EyeIcon,
  Book02Icon,
} from "@hugeicons/core-free-icons"
import React from "react"
import { mainStore } from "@/store/mainStore"
import {
  EmployeeSkill,
  SkillSubCategory,
  SkillCategory,
  Skill,
  DevelopmentCapability,
  EmployeeDevelopmentExperience,
  LanguageSkill,
  type ManagementScore,
} from "@/types/skillset"
import { Employee } from "@/types/employee"
import { SkillsetDrawer } from "@/components/drawers/skillset/skillSet-drawer"
import { DevelopmentHeadersDrawer } from "@/components/drawers/skillset/developmentHeaders-drawer"
import { TechnicalAbilityHeadersDrawer } from "@/components/drawers/skillset/technicalAbilityHeaders-drawer"
import type { EmployeeJapaneseLevel } from "@/types/current_target"
import { DictionaryDrawer } from "./drawers/skillset/dictionary-drawer"

const STROKE_WIDTH = 2

type GroupedSkill = {
  skill_id: number
  skill_name: string
  sub_category_name: string
}

type DictionaryEntry = {
  id: number
  japaneseText: string
  englishText: string
}

const BorderedTableCell = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableCell>) => (
  <TableCell className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableCell>
)

const BorderedTableHead = ({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof TableHead>) => (
  <TableHead className={`border-r border-l ${className}`} {...props}>
    {children}
  </TableHead>
)

const getExperienceLevelColor = (level: string): string => {
  const levelColors: Record<string, string> = {
    Expert: "bg-yellow-100 text-yellow-800",
    Architecture: "bg-indigo-100 text-indigo-800",
    Optimization: "bg-orange-100 text-orange-800",
    "Component Design": "bg-cyan-100 text-cyan-800",
    Deployment: "bg-teal-100 text-teal-800",
    "Type Safety": "bg-pink-100 text-pink-800",
    "API Development": "bg-emerald-100 text-emerald-800",
    "Query Optimization": "bg-amber-100 text-amber-800",
    "Database Administration": "bg-red-100 text-red-800",
    Caching: "bg-lime-100 text-lime-800",
    "Framework Expert": "bg-violet-100 text-violet-800",
    Microservices: "bg-fuchsia-100 text-fuchsia-800",
    "Cloud Architecture": "bg-sky-100 text-sky-800",
    Migration: "bg-rose-100 text-rose-800",
    Scripting: "bg-stone-100 text-stone-800",
    "Data Modeling": "bg-neutral-100 text-neutral-800",
    "State Management": "bg-blue-100 text-blue-800",
    "Real-time Apps": "bg-green-100 text-green-800",
    DevOps: "bg-indigo-100 text-indigo-800",
    "Performance Tuning": "bg-orange-100 text-orange-800",
    "Type Integration": "bg-purple-100 text-purple-800",
    Setup: "bg-gray-100 text-gray-800",
  }
  return levelColors[level] || "bg-gray-100 text-gray-800"
}

export function SkillContainer({ searchPlaceholder = "Search employees..." }) {
  const [language, setLanguage] = useState<"eng" | "japan">("eng")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dictionaryDrawerOpen, setDictionaryDrawerOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string
    name: string
  } | null>(null)
  const [developmentHeadersDrawerOpen, setDevelopmentHeadersDrawerOpen] =
    useState(false)
  const [technicalHeadersDrawerOpen, setTechnicalHeadersDrawerOpen] =
    useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [japaneseLevelMap, setJapaneseLevelMap] = useState<
    Map<string, string | null>
  >(new Map())
  const [skillMap, setSkillMap] = useState<
    Map<string, Map<string, { years: number | null; level: string | null }>>
  >(new Map())
  const [devCapMap, setDevCapMap] = useState<
    Map<
      string,
      Map<string, { years: number | null; experience_process: string | null }>
    >
  >(new Map())
  const [languageSkillMap, setLanguageSkillMap] = useState<
    Map<
      string,
      {
        language_skill_level: string | number | null
        jlpt_highest_level: string | null
      }
    >
  >(new Map())
  const [managementScoresMap, setManagementScoresMap] = useState<
    Map<string, ManagementScore>
  >(new Map())

  // Column visibility state using radio-style selection
  const [selectedSection, setSelectedSection] = useState<string>("all")

  const {
    fetch_EmployeeData,
    employee_data,
    fetch_managementScoreData,
    managementScores_Data,
    fetch_EmployeeJapaneseLevel,
    employeeJapaneseLevel_Data,
    fetch_SkillHeaders,
    skill_headers,
    fetch_SkillData,
    skillData,
    fetch_devCapHeaders,
    devCap_headers,
    fetch_devCapData,
    devCap_data,
    fetch_languageSkillData,
    languageSkill_data,
    add_devCapHeaders,
    update_SkillCategory,
    add_BulkSkillCategories,
    fetch_dictionary,
    dictionary,
  } = mainStore()

  // Helper function to escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  // Create translation map for quick lookup - case insensitive
  const translationMap = useMemo(() => {
    const map = new Map<string, string>()
    if (dictionary && Array.isArray(dictionary)) {
      dictionary.forEach((entry: DictionaryEntry) => {
        // Store with lowercase key for case-insensitive lookup
        map.set(entry.englishText.toLowerCase(), entry.japaneseText)
      })
    }
    return map
  }, [dictionary])

  // Helper function to translate text based on current language
  const translate = (text: string): string => {
    if (language === "eng") return text
    if (!text) return text

    const lowerText = text.toLowerCase()

    // 1. Try exact match first
    if (translationMap.has(lowerText)) {
      return translationMap.get(lowerText)!
    }

    // 2. Try to find matching phrases (longest first)
    const sortedEntries = Array.from(translationMap.entries()).sort(
      (a, b) => b[0].length - a[0].length
    )

    let result = text
    let hasReplacement = false

    for (const [english, japanese] of sortedEntries) {
      // Skip single-character entries to avoid false positives
      if (english.length < 2) continue

      // Use includes for case-insensitive matching
      if (result.toLowerCase().includes(english.toLowerCase())) {
        // Replace the matched text with Japanese translation
        // Use a case-insensitive replacement
        const regex = new RegExp(escapeRegex(english), "gi")
        result = result.replace(regex, japanese)
        hasReplacement = true
      }
    }

    // 3. If no phrase replacements, try word-by-word
    if (!hasReplacement) {
      const words = text.split(/\b/)
      const translatedWords = words.map((word) => {
        const trimmed = word.trim()
        if (!trimmed || /^[^\w\s]+$/.test(trimmed)) return word

        const translated = translationMap.get(trimmed.toLowerCase())
        return translated || word
      })
      result = translatedWords.join("")
    }

    return result
  }

  // Add this ref with the other state declarations
  const hasLoadedRef = useRef(false)

  // Replace the existing useEffect with this:
  useEffect(() => {
    const loadData = async () => {
      // Skip if already loaded
      if (hasLoadedRef.current) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const promises = []

        if (!employee_data || employee_data.length === 0) {
          promises.push(fetch_EmployeeData())
        }

        if (
          !employeeJapaneseLevel_Data ||
          employeeJapaneseLevel_Data.length === 0
        ) {
          promises.push(fetch_EmployeeJapaneseLevel())
        }

        if (!skill_headers || skill_headers.length === 0) {
          promises.push(fetch_SkillHeaders())
        }

        if (!skillData || skillData.length === 0) {
          promises.push(fetch_SkillData())
        }

        if (!devCap_headers || devCap_headers.length === 0) {
          promises.push(fetch_devCapHeaders())
        }

        if (!devCap_data || devCap_data.length === 0) {
          promises.push(fetch_devCapData())
        }

        if (!languageSkill_data || languageSkill_data.length === 0) {
          promises.push(fetch_languageSkillData())
        }

        if (!managementScores_Data || managementScores_Data.length === 0) {
          promises.push(fetch_managementScoreData())
        }

        if (!dictionary || dictionary.length === 0) {
          promises.push(fetch_dictionary())
        }

        if (promises.length > 0) {
          await Promise.all(promises)
        }

        hasLoadedRef.current = true
      } catch (error) {
        console.error("❌ Error loading skills data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])
  // Employee data
  useEffect(() => {
    if (employee_data && employee_data.length > 0) {
      setEmployees(employee_data)
    }
  }, [employee_data])

  // Build Japanese level map for quick lookup: employee_id -> jlptHighestLevel
  useEffect(() => {
    if (employeeJapaneseLevel_Data && employeeJapaneseLevel_Data.length > 0) {
      const map = new Map<string, string | null>()

      employeeJapaneseLevel_Data.forEach((item: EmployeeJapaneseLevel) => {
        // Store jlptHighestLevel field
        map.set(item.employee_id, item.jlptHighestLevel || null)
      })

      setJapaneseLevelMap(map)
    }
  }, [employeeJapaneseLevel_Data])

  // Build skill map for quick lookup: employee_id -> Map<skillName, { years, level }>
  useEffect(() => {
    if (skillData && skillData.length > 0) {
      const map = new Map<
        string,
        Map<string, { years: number | null; level: string | null }>
      >()

      skillData.forEach((skill: EmployeeSkill) => {
        // Get employee ID
        const employeeId = skill.employeeId

        if (!employeeId) {
          console.warn("Skill missing employeeId:", skill)
          return
        }

        if (!map.has(employeeId)) {
          map.set(employeeId, new Map())
        }

        const employeeSkillMap = map.get(employeeId)!

        // Use skillName as the key instead of skillId
        const skillName = skill.skillName

        if (!skillName) {
          console.warn("Skill missing skillName:", skill)
          return
        }

        employeeSkillMap.set(skillName, {
          years: skill.yearsOfExperience || 0,
          level: skill.experienceLevel || null,
        })
      })

      setSkillMap(map)
    }
  }, [skillData])

  // Build devCap map for quick lookup: employee_id -> Map<developmentTypeName, { years, experience_process }>
  useEffect(() => {
    if (devCap_data && devCap_data.length > 0) {
      const map = new Map<
        string,
        Map<string, { years: number | null; experience_process: string | null }>
      >()

      devCap_data.forEach((devCap: DevelopmentCapability) => {
        const employeeId = devCap.employeeId

        if (!map.has(employeeId)) {
          map.set(employeeId, new Map())
        }

        const employeeDevCapMap = map.get(employeeId)!
        const typeName = devCap.developmentTypeName

        employeeDevCapMap.set(typeName, {
          years: devCap.yearsOfExperience || 0,
          experience_process: devCap.processName,
        })
      })

      setDevCapMap(map)
    }
  }, [devCap_data])

  // Build language skill map for quick lookup: staff_id -> { language_skill_level, jlpt_highest_level }
  useEffect(() => {
    if (languageSkill_data && languageSkill_data.length > 0) {
      const map = new Map<
        string,
        {
          language_skill_level: string | number | null
          jlpt_highest_level: string | null
        }
      >()

      languageSkill_data.forEach((skill: LanguageSkill) => {
        // Handle both camelCase (from API) and snake_case (from mock data)
        const employeeId = skill.employeeId
        const languageLevel =
          skill.languageSkillLevel === undefined ? "" : skill.languageSkillLevel

        map.set(employeeId, {
          language_skill_level:
            languageLevel !== undefined ? languageLevel : null,
          jlpt_highest_level: skill.jlpt_highest_level || null,
        })
      })

      setLanguageSkillMap(map)
    }
  }, [languageSkill_data])

  // Build management scores map for quick lookup: employee_id -> ManagementScore
  useEffect(() => {
    if (managementScores_Data && managementScores_Data.length > 0) {
      const map = new Map<string, ManagementScore>()
      managementScores_Data.forEach((score: ManagementScore) => {
        map.set(score.employeeId, score)
      })
      setManagementScoresMap(map)
    }
  }, [managementScores_Data])

  // Build dynamic skills list from skill_headers (API returns camelCase)
  const dynamicSkillsList = useMemo(() => {
    const skills: {
      id: number
      name: string
      category: string
      sub_category: string
    }[] = []
      ; (skill_headers || []).forEach((category: SkillCategory) => {
        // API returns: categoryName, skillSubCategories
        category.skillSubCategories?.forEach((subCategory: SkillSubCategory) => {
          // API returns: subCategoryName, skills
          subCategory.skills?.forEach((skill: Skill) => {
            // API returns: id, skillName
            skills.push({
              id: skill.id,
              name: skill.skillName,
              category: category.categoryName,
              sub_category: subCategory.subCategoryName,
            })
          })
        })
      })
    return skills
  }, [skill_headers])

  // Group skills by category
  const dynamicSkillsByCategory = useMemo(() => {
    const grouped: Record<string, GroupedSkill[]> = {}
      ; (skill_headers || []).forEach((category: SkillCategory) => {
        const categoryName = category.categoryName
        grouped[categoryName] = []
        category.skillSubCategories?.forEach((subCategory: SkillSubCategory) => {
          subCategory.skills?.forEach((skill: Skill) => {
            grouped[categoryName].push({
              skill_id: skill.id,
              skill_name: skill.skillName,
              sub_category_name: subCategory.subCategoryName,
            })
          })
        })
      })
    return grouped
  }, [skill_headers])

  // Flat list of skills, ordered to match the category/subcategory grouping
  // used in the table headers (NOT a global id sort).
  const orderedSkillsList = useMemo(() => {
    const result: {
      id: number
      name: string
      category: string
      sub_category: string
    }[] = []

    Object.entries(dynamicSkillsByCategory)
      .sort((a, b) => {
        const aMinId = Math.min(...a[1].map((s) => s.skill_id))
        const bMinId = Math.min(...b[1].map((s) => s.skill_id))
        return aMinId - bMinId
      })
      .forEach(([categoryName, skills]) => {
        const subCategoryMap: Record<string, GroupedSkill[]> = {}
        skills.forEach((skill) => {
          const subName = skill.sub_category_name
          if (!subCategoryMap[subName]) subCategoryMap[subName] = []
          subCategoryMap[subName].push(skill)
        })

        Object.entries(subCategoryMap)
          .sort((a, b) => {
            const aMinId = Math.min(...a[1].map((s) => s.skill_id))
            const bMinId = Math.min(...b[1].map((s) => s.skill_id))
            return aMinId - bMinId
          })
          .forEach(([, subSkills]) => {
            ;[...subSkills]
              .sort((a, b) => a.skill_id - b.skill_id)
              .forEach((skill) => {
                result.push({
                  id: skill.skill_id,
                  name: skill.skill_name,
                  category: categoryName,
                  sub_category: skill.sub_category_name,
                })
              })
          })
      })

    return result
  }, [dynamicSkillsByCategory])

  const filteredEmployees = employees.filter((employee) => {
    return (
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  )

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      // Add delete API call here if needed
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    } catch (error) {
      console.error("Delete failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle row click to open drawer
  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee({
      id: employee.id,
      name: employee.name,
    })
    setDrawerOpen(true)
  }

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedEmployee(null)
  }

  // Handle drawer success
  const handleDrawerSuccess = async () => {
    // Refresh data
    await Promise.all([
      fetch_devCapData(),
      fetch_languageSkillData(),
      fetch_managementScoreData(),
    ])
  }

  // Handle development headers click
  const handleDevelopmentHeadersClick = () => {
    setDevelopmentHeadersDrawerOpen(true)
  }

  // Handle technical ability headers click
  const handleTechnicalHeadersClick = () => {
    setTechnicalHeadersDrawerOpen(true)
  }

  // Handle development types save
  const handleDevTypesSave = async (types: string[]) => {
    await add_devCapHeaders(types)
  }

  // Handle technical categories save (single update)
  const handleCategorySave = async (category: SkillCategory) => {
    try {
      await update_SkillCategory(category)
      await fetch_SkillHeaders()
    } catch (error) {
      console.error("Failed to save category:", error)
      throw error
    }
  }

  // Handle bulk category create
  const handleBulkCategoryCreate = async (categories: SkillCategory[]) => {
    try {
      await add_BulkSkillCategories(categories)
      await fetch_SkillHeaders()
    } catch (error) {
      console.error("Failed to create categories:", error)
      throw error
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

  // Column headers - Employee section (always visible) - Now using translate function
  const employeeHeaders = [
    { field: "team", header_name: "Team" },
    { field: "staff_id", header_name: "ID" },
    { field: "name", header_name: "Name" },
    {
      field: "dept",
      header_name:
        "Name of the commissioning department *Select from the dropdown menu",
    },
    { field: "is_core_personnel", header_name: "Core personnel (FPT only)" },
    {
      field: "has_japan_business_trip",
      header_name: "Whether or not you have a business trip to Japan",
    },
  ]

  const administratorHeaders = [
    {
      field: "management_experience_level",
      header_name: "Management experience (Levels 1-5)",
    },
    { field: "qcd_score", header_name: "QCD (1-4 points)" },
    {
      field: "report_consult_score",
      header_name: "Reporting, contacting, and consulting (1-4 points)",
    },
    { field: "education_score", header_name: "Education (1-4 points)" },
    { field: "total_level", header_name: "Total (Levels 1-5)" },
  ]

  const languageSkillHeaders = [
    { field: "language_level", header_name: "Level (Levels 1-5)" },
    { field: "jlpt_nat_score", header_name: "JLPT/NAT (N1~N5)" },
  ]

  const totalSkillColumns = dynamicSkillsList.length * 2
  const totalColumns = employeeHeaders.length + 1 + totalSkillColumns

  // Check if a section should be visible based on selected section
  const showAdministrator =
    selectedSection === "all" || selectedSection === "administrator"
  const showDeveloper =
    selectedSection === "all" || selectedSection === "developer"
  const showTechnicalAbility =
    selectedSection === "all" || selectedSection === "technicalAbility"

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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading skills data...</p>
        </div>
      </div>
    )
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setDictionaryDrawerOpen(true)}
                  >
                    <HugeiconsIcon icon={Book02Icon} strokeWidth={2} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Japanese</p>
                </TooltipContent>
              </Tooltip>

              {/* Property Visibility Dropdown */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <HugeiconsIcon
                          icon={EyeIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Property Visibility</p>
                  </TooltipContent>
                </Tooltip>

                <DropdownMenuContent className="w-48">
                  {/* Language Toggle Section */}
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                      <Button
                        variant={language === "eng" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={() => setLanguage("eng")}
                      >
                        Eng
                      </Button>
                      <Button
                        variant={language === "japan" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={() => setLanguage("japan")}
                      >
                        日本語
                      </Button>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* All Sections option */}
                  <DropdownMenuCheckboxItem
                    checked={selectedSection === "all"}
                    onCheckedChange={() => handleSectionSelect("all")}
                    onSelect={(e) => e.preventDefault()}
                  >
                    All Sections
                  </DropdownMenuCheckboxItem>

                  {/* Individual Sections - Checkbox style (not radio) */}
                  {Object.entries(sectionDisplayNames).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={selectedSection === key}
                      onCheckedChange={() => handleSectionSelect(key)}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            className="relative overflow-x-auto rounded-md border"
            style={{ zIndex: 1 }}
          >
            <Table>
              <TableHeader>
                {/* ROW 1: Main Categories */}
                <TableRow className="bg-muted/50">
                  {employeeHeaders.map((header) => (
                    <BorderedTableHead
                      key={header.field}
                      rowSpan={5}
                      className="align-middle"
                    >
                      {translate(header.header_name)}
                    </BorderedTableHead>
                  ))}
                  {showAdministrator && (
                    <BorderedTableHead
                      colSpan={5}
                      className="align-middle font-bold"
                    >
                      {translate("Administrator")}
                    </BorderedTableHead>
                  )}
                  {showDeveloper && (
                    <BorderedTableHead
                      colSpan={
                        devCap_headers?.length !== 0
                          ? devCap_headers?.length &&
                          languageSkillHeaders.length +
                          devCap_headers.length * 2
                          : languageSkillHeaders.length
                      }
                      className="cursor-pointer align-middle whitespace-nowrap transition-colors hover:bg-muted/70"
                      onClick={handleDevelopmentHeadersClick}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {translate("Developer (DIR and YSX tasks only)")}
                        <HugeiconsIcon
                          icon={Settings01Icon}
                          strokeWidth={2}
                          className="h-3 w-3 opacity-60"
                        />
                      </div>
                    </BorderedTableHead>
                  )}
                  {showTechnicalAbility && (
                    <BorderedTableHead
                      colSpan={Object.values(dynamicSkillsByCategory).reduce(
                        (total, skills) => total + skills.length * 2,
                        0
                      )}
                      rowSpan={skill_headers?.length === 0 ? 5 : 1}
                      className="cursor-pointer align-middle whitespace-nowrap transition-colors hover:bg-muted/70"
                      onClick={handleTechnicalHeadersClick}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {translate("Technical Ability")}
                        <HugeiconsIcon
                          icon={Settings01Icon}
                          strokeWidth={2}
                          className="h-3 w-3 opacity-60"
                        />
                      </div>
                    </BorderedTableHead>
                  )}
                </TableRow>

                {/* ROW 2: Administrator Sub-categories & Main Dynamic Skill Categories */}
                <TableRow className="bg-muted/50">
                  {showAdministrator && (
                    <>
                      <BorderedTableHead
                        rowSpan={4}
                        className="text-center align-middle whitespace-normal"
                      >
                        {translate(administratorHeaders[0].header_name)}
                      </BorderedTableHead>
                      <BorderedTableHead
                        colSpan={4}
                        className="text-center align-middle"
                      >
                        {translate("management ability")}
                      </BorderedTableHead>
                    </>
                  )}
                  {showDeveloper && (
                    <>
                      <BorderedTableHead
                        colSpan={2}
                        className="text-center align-middle"
                      >
                        {translate("language skills")}
                      </BorderedTableHead>
                      {devCap_headers?.length !== 0 && (
                        <BorderedTableHead
                          colSpan={
                            devCap_headers?.length && devCap_headers?.length * 2
                          }
                          className="text-center align-middle transition-colors hover:bg-muted/70"
                        >
                          <div className="flex items-center justify-center gap-2">
                            {translate("Development capabilities")}
                          </div>
                        </BorderedTableHead>
                      )}
                    </>
                  )}
                  {showTechnicalAbility &&
                    Object.entries(dynamicSkillsByCategory)
                      .sort((a, b) => {
                        const aMinId = Math.min(...a[1].map((s) => s.skill_id))
                        const bMinId = Math.min(...b[1].map((s) => s.skill_id))
                        return aMinId - bMinId
                      })
                      .map(([categoryName, skills]) => {
                        const sortedSkills = [...skills].sort(
                          (a, b) => a.skill_id - b.skill_id
                        )

                        // Only handle "empty" categories in ROW 2
                        if (categoryName.includes("empty")) {
                          const subCategoryMap: Record<
                            string,
                            { count: number; skills: GroupedSkill[] }
                          > = {}
                          sortedSkills.forEach((skill) => {
                            const subName = skill.sub_category_name.includes(
                              "empty"
                            )
                              ? ""
                              : skill.sub_category_name
                            if (!subCategoryMap[subName]) {
                              subCategoryMap[subName] = { count: 0, skills: [] }
                            }
                            subCategoryMap[subName].count += 2
                            subCategoryMap[subName].skills.push(skill)
                          })

                          return Object.entries(subCategoryMap)
                            .sort((a, b) => {
                              const aMinId = Math.min(
                                ...a[1].skills.map((s) => s.skill_id)
                              )
                              const bMinId = Math.min(
                                ...b[1].skills.map((s) => s.skill_id)
                              )
                              return aMinId - bMinId
                            })
                            .map(
                              ([
                                subCategoryName,
                                { count, skills: subSkills },
                              ]) => {
                                const sortedSubSkills = [...subSkills].sort(
                                  (a, b) => a.skill_id - b.skill_id
                                )

                                // Only show individual skills when BOTH category and subcategory are "empty"
                                if (
                                  categoryName.includes("empty") &&
                                  subCategoryName === ""
                                ) {
                                  return sortedSubSkills.map((skill) => (
                                    <BorderedTableHead
                                      key={`skill-${skill.skill_id}`}
                                      colSpan={2}
                                      rowSpan={3}
                                      className="text-center align-middle"
                                    >
                                      {translate(skill.skill_name)}
                                    </BorderedTableHead>
                                  ))
                                }

                                return (
                                  <BorderedTableHead
                                    key={`empty-${subCategoryName}`}
                                    colSpan={count}
                                    rowSpan={2}
                                    className="text-center align-middle"
                                  >
                                    {translate(subCategoryName)}
                                  </BorderedTableHead>
                                )
                              }
                            )
                        }

                        // For non-empty categories, check if all subcategories are empty
                        const hasOnlyEmptySubCategories = sortedSkills.every(
                          (skill) => skill.sub_category_name.includes("empty")
                        )

                        if (hasOnlyEmptySubCategories) {
                          // When category is NOT empty but all subcategories are empty
                          return sortedSkills.map((skill) => (
                            <BorderedTableHead
                              key={`skill-${skill.skill_id}`}
                              colSpan={2}
                              rowSpan={3}
                              className="text-center align-middle"
                            >
                              {translate(skill.skill_name)}
                            </BorderedTableHead>
                          ))
                        }

                        // Normal case - show the category name
                        return (
                          <BorderedTableHead
                            key={categoryName}
                            colSpan={sortedSkills.length * 2}
                            className="text-center"
                          >
                            {translate(categoryName)}
                          </BorderedTableHead>
                        )
                      })}
                </TableRow>

                {/* ROW 3: Administrator Ability Sub-columns & Technical Sub Categories */}
                <TableRow className="bg-muted/30">
                  {showAdministrator &&
                    administratorHeaders.slice(1, 5).map((header) => (
                      <BorderedTableHead
                        key={header.field}
                        rowSpan={3}
                        className="text-center align-middle"
                        style={{
                          width:
                            header.field === "report_consult_score"
                              ? "150px"
                              : "100px",
                        }}
                      >
                        {translate(header.header_name)}
                      </BorderedTableHead>
                    ))}
                  {showDeveloper && (
                    <>
                      {languageSkillHeaders.slice(0, 2).map((header) => (
                        <BorderedTableHead
                          key={header.field}
                          rowSpan={3}
                          className="text-center align-middle"
                        >
                          {translate(header.header_name)}
                        </BorderedTableHead>
                      ))}
                      {(devCap_headers || []).map(
                        (header: DevelopmentCapability) => (
                          <BorderedTableHead
                            key={header.id}
                            rowSpan={2}
                            colSpan={2}
                            className="text-center align-middle"
                          >
                            {translate(header.developmentTypeName)}
                          </BorderedTableHead>
                        )
                      )}
                    </>
                  )}
                  {showTechnicalAbility &&
                    dynamicSkillsList.length > 0 &&
                    Object.entries(dynamicSkillsByCategory)
                      .sort((a, b) => {
                        const aMinId = Math.min(...a[1].map((s) => s.skill_id))
                        const bMinId = Math.min(...b[1].map((s) => s.skill_id))
                        return aMinId - bMinId
                      })
                      .map(([categoryName, skills]) => {
                        if (
                          categoryName.includes("empty") ||
                          skills.every((skill) =>
                            skill.sub_category_name.includes("empty")
                          )
                        ) {
                          return null
                        }

                        const subCategoryMap: Record<
                          string,
                          {
                            count: number
                            skills: GroupedSkill[]
                            isSkillName: boolean
                          }
                        > = {}

                        skills.forEach((skill) => {
                          const isSkillName =
                            skill.sub_category_name.includes("empty")
                          const subName = isSkillName
                            ? skill.skill_name
                            : skill.sub_category_name

                          if (!subCategoryMap[subName]) {
                            subCategoryMap[subName] = {
                              count: 0,
                              skills: [],
                              isSkillName,
                            }
                          }
                          subCategoryMap[subName].count += 2
                          subCategoryMap[subName].skills.push(skill)
                        })

                        return Object.entries(subCategoryMap)
                          .sort((a, b) => {
                            const aMinId = Math.min(
                              ...a[1].skills.map((s) => s.skill_id)
                            )
                            const bMinId = Math.min(
                              ...b[1].skills.map((s) => s.skill_id)
                            )
                            return aMinId - bMinId
                          })
                          .map(([subCategoryName, { count, isSkillName }]) => (
                            <BorderedTableHead
                              key={`${categoryName}-${subCategoryName}`}
                              rowSpan={isSkillName ? 2 : 1}
                              colSpan={count}
                              className="text-center"
                            >
                              {translate(subCategoryName)}
                            </BorderedTableHead>
                          ))
                      })}
                </TableRow>

                {/* ROW 4: Technical Individual Skills */}
                <TableRow className="bg-muted/20">
                  {showTechnicalAbility &&
                   orderedSkillsList.length > 0 &&
                    orderedSkillsList.map((skill) => {
                        // Check if this skill was already used as a sub-category header in Row 3
                        // A skill is shown as a sub-category header when its sub_category_name contains "empty"
                        let isSkillNameHeader = false

                        for (const [, skills] of Object.entries(
                          dynamicSkillsByCategory
                        )) {
                          const foundSkill = skills.find(
                            (s) => s.skill_id === skill.id
                          )
                          if (
                            foundSkill &&
                            foundSkill.sub_category_name.includes("empty")
                          ) {
                            isSkillNameHeader = true
                            break
                          }
                        }

                        // Skip if this skill was already rendered as a sub-category header in Row 3
                        if (isSkillNameHeader) return null

                        return (
                          <BorderedTableHead
                            key={skill.id}
                            colSpan={2}
                            className="text-center"
                          >
                            {translate(skill.name)}
                          </BorderedTableHead>
                        )
                      })
                      .filter(Boolean)}
                </TableRow>

                {/* ROW 5: Technical Years and Experience subheaders */}
                <TableRow className="bg-muted/10">
                  {showDeveloper &&
                    devCap_headers?.length !== 0 &&
                    Array.from({ length: devCap_headers?.length || 0 }).map(
                      (_, index) => (
                        <React.Fragment key={`dev-${index}`}>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            {translate("Years of experience")}
                          </BorderedTableHead>
                          <BorderedTableHead className="text-center whitespace-nowrap">
                            {translate("Experience Process")}
                          </BorderedTableHead>
                        </React.Fragment>
                      )
                    )}
                  {showTechnicalAbility &&
                    orderedSkillsList.map((skill) => (
                      <React.Fragment key={`${skill.id}-sub`}>
                        <BorderedTableHead className="text-center whitespace-nowrap">
                          {translate("Years")}
                        </BorderedTableHead>
                        <BorderedTableHead className="text-center whitespace-nowrap">
                          {translate("Experience")}
                        </BorderedTableHead>
                      </React.Fragment>
                    ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <BorderedTableCell
                      colSpan={totalColumns}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No employees found
                    </BorderedTableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((employee) => {
                    const employeeId = Number(employee.id)
                    const employeeSkills =
                      skillMap.get(employee.id) || new Map()
                    const employeeDevCaps =
                      devCapMap.get(employee.id) || new Map()
                    const employeeLanguageSkill = languageSkillMap.get(
                      employee.id
                    )
                    const employeeManagementScore = managementScoresMap.get(
                      employee.id
                    )

                    return (
                      <TableRow
                        key={employee.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleRowClick(employee)}
                      >
                        {/* Employee Info Columns - Always visible */}
                        <BorderedTableCell>
                          {translate(employee.team || "-")}
                        </BorderedTableCell>
                        <BorderedTableCell className="text-sm">
                          {employee.id || "-"}
                        </BorderedTableCell>
                        <BorderedTableCell className="font-medium">
                          {employee.name}
                        </BorderedTableCell>
                        <BorderedTableCell>
                          {translate(employee.dept_dir || "-")}
                        </BorderedTableCell>
                        <BorderedTableCell>
                          <Badge
                            variant={
                              employee.is_core_personnel ? "default" : "outline"
                            }
                          >
                            {employee.is_core_personnel
                              ? translate("Yes")
                              : translate("No")}
                          </Badge>
                        </BorderedTableCell>
                        <BorderedTableCell>
                          <Badge
                            variant={
                              employee.has_japan_business_trip
                                ? "default"
                                : "outline"
                            }
                          >
                            {employee.has_japan_business_trip
                              ? translate("Yes")
                              : translate("No")}
                          </Badge>
                        </BorderedTableCell>

                        {/* Administrator Columns - Column Filterable */}
                        {showAdministrator && (
                          <>
                            {[
                              {
                                key: "managementExperienceLevel",
                                fallback: "-",
                              },
                              { key: "qcdScore", fallback: "-" },
                              { key: "reportConsultScore", fallback: "-" },
                              { key: "educationScore", fallback: "-" },
                              { key: "totalLevel", fallback: "-" },
                            ].map((field) => (
                              <BorderedTableCell
                                key={field.key}
                                className="text-center"
                              >
                                {employeeManagementScore?.[
                                  field.key as keyof ManagementScore
                                ] ?? field.fallback}
                              </BorderedTableCell>
                            ))}
                          </>
                        )}

                        {/* Developer Columns - Column Filterable */}
                        {showDeveloper && (
                          <>
                            {/* Language Skills */}
                            {/* First field - Language Skill Level (from languageSkillMap) */}
                            <BorderedTableCell className="text-center">
                              {employeeLanguageSkill?.language_skill_level ? (
                                employeeLanguageSkill.language_skill_level
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              )}
                            </BorderedTableCell>

                            {/* Second field - JLPT Highest Level (from employeeJapaneseLevel_Data) */}
                            <BorderedTableCell className="text-center">
                              {(() => {
                                const jlptLevel = japaneseLevelMap.get(
                                  employee.id
                                )
                                return jlptLevel ? (
                                  <Badge className="bg-blue-100 text-xs text-blue-800">
                                    {translate(jlptLevel)}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    -
                                  </span>
                                )
                              })()}
                            </BorderedTableCell>

                            {/* Development Capabilities */}
                            {(devCap_headers || []).map(
                              (header: DevelopmentCapability) => {
                                const devCapData = employeeDevCaps.get(
                                  header.developmentTypeName
                                )
                                const years = devCapData?.years || 0
                                const experience_process =
                                  devCapData?.experience_process || null

                                return (
                                  <React.Fragment key={header.id}>
                                    <BorderedTableCell className="text-center">
                                      {years > 0 ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs whitespace-nowrap"
                                        >
                                          {years}{" "}
                                          {years !== 1
                                            ? translate("years")
                                            : translate("year")}
                                        </Badge>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </BorderedTableCell>
                                    <BorderedTableCell className="text-center">
                                      {experience_process ? (
                                        <Badge className="bg-blue-100 text-xs text-blue-800">
                                          {translate(experience_process)}
                                        </Badge>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </BorderedTableCell>
                                  </React.Fragment>
                                )
                              }
                            )}
                          </>
                        )}

                        {/* Technical Skills Cells - Column Filterable */}
                        {showTechnicalAbility && (
                          <>
                            {orderedSkillsList.map((skill) => {
                              // Now use skill.name instead of skill.id
                              const skillData = employeeSkills.get(skill.name)
                              const years = skillData?.years
                              const level = skillData?.level

                              return (
                                <React.Fragment key={skill.id}>
                                  <BorderedTableCell className="text-center">
                                    {years && years > 0 ? (
                                      <Badge
                                        variant="outline"
                                        className="text-xs whitespace-nowrap"
                                      >
                                        {years}{" "}
                                        {years !== 1
                                          ? translate("years")
                                          : translate("year")}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </BorderedTableCell>
                                  <BorderedTableCell className="text-center">
                                    {level ? (
                                      <Badge
                                        className={`text-xs ${getExperienceLevelColor(level)}`}
                                      >
                                        {translate(level)}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        -
                                      </span>
                                    )}
                                  </BorderedTableCell>
                                </React.Fragment>
                              )
                            })}
                          </>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Field orientation="horizontal" className="w-fit">
              <FieldLabel htmlFor="select-rows-per-page">
                {translate("Rows per page")}
              </FieldLabel>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
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
              {translate("Showing")}{" "}
              {filteredEmployees.length === 0 ? 0 : startIndex + 1}{" "}
              {translate("to")}{" "}
              {Math.min(startIndex + itemsPerPage, filteredEmployees.length)}{" "}
              {translate("of")} {filteredEmployees.length}{" "}
              {translate("employees")}
            </div>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePrevious()
                    }}
                    className={
                      currentPage === 1 || filteredEmployees.length === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
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
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page as number)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNext()
                    }}
                    className={
                      currentPage === totalPages ||
                        filteredEmployees.length === 0
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </div>

      {/* disctionary Drawer - Combined Create/Edit/delete */}
      <DictionaryDrawer
        open={dictionaryDrawerOpen}
        onOpenChange={setDictionaryDrawerOpen}
        onSuccess={async () => {
          await fetch_dictionary()
        }}
      />

      {/* Skillset Drawer - Combined Create/Edit */}
      <SkillsetDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerClose}
        employee={selectedEmployee}
        onSuccess={handleDrawerSuccess}
      />

      {/* Development Headers Drawer */}
      <DevelopmentHeadersDrawer
        open={developmentHeadersDrawerOpen}
        onOpenChange={setDevelopmentHeadersDrawerOpen}
        initialTypes={
          devCap_headers?.map(
            (header: DevelopmentCapability) => header.developmentTypeName
          ) || []
        }
        onSave={handleDevTypesSave}
      />

      {/* Technical Ability Headers Drawer */}
      <TechnicalAbilityHeadersDrawer
        open={technicalHeadersDrawerOpen}
        onOpenChange={setTechnicalHeadersDrawerOpen}
        initialCategories={skill_headers || []}
        onSaveCategory={handleCategorySave}
        onBulkCreate={handleBulkCategoryCreate}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("Confirm Delete")}</DialogTitle>
            <DialogDescription>
              {translate("Are you sure you want to delete")}{" "}
              {employeeToDelete?.name}?{" "}
              {translate("This action cannot be undone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {translate("Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? translate("Deleting...") : translate("Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
