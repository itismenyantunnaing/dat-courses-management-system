// Tab configuration shared between nav-group and dialogs
import {
  UserGroupIcon,
  CodeIcon,
  CourseIcon
} from "@hugeicons/core-free-icons"

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
    onImport: (file: File) => {
      console.log("Importing employees data:", file)
    },
    onExport: (format: string) => {
      console.log(`Exporting employees data as ${format}`)
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting employees data")
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
      console.log("Importing courses data:", file)
    },
    onExport: (format: string) => {
      console.log(`Exporting courses data as ${format}`)
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting courses data")
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
      console.log("Importing skills data:", file)
    },
    onExport: (format: string) => {
      console.log(`Exporting skills data as ${format}`)
    },
    onDelete: (selectedItems: string[]) => {
      console.log("Deleting skills data")
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