// app/components/dialogs/send-mail-dialog.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MailSend02Icon,
  PlusSignIcon,
  CheckmarkCircle01Icon,
  CancelIcon,
  Building04Icon,
  BriefcaseIcon,
  UserGroupIcon,
  UserIcon,
  Setting06Icon,
  Edit03Icon,
  MailEdit02Icon,
} from "@hugeicons/core-free-icons"
import { SystemConfigurationDialog } from "./systemconfiguration-dialog"
import { SettingDialog } from "./setting-dialog"

// Mock employee data for search
const mockEmployees = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@company.com",
    avatar: "",
    division: "Engineering",
    department: "Frontend",
    team: "Team A",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@company.com",
    avatar: "",
    division: "Engineering",
    department: "Backend",
    team: "Team B",
  },
  {
    id: 3,
    name: "Michael Johnson",
    email: "michael.j@company.com",
    avatar: "",
    division: "Design",
    department: "UI/UX",
    team: "Team C",
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah.w@company.com",
    avatar: "",
    division: "Engineering",
    department: "Frontend",
    team: "Team A",
  },
  {
    id: 5,
    name: "David Brown",
    email: "david.b@company.com",
    avatar: "",
    division: "Marketing",
    department: "Digital",
    team: "Team D",
  },
  {
    id: 6,
    name: "Emily Davis",
    email: "emily.d@company.com",
    avatar: "",
    division: "Engineering",
    department: "Backend",
    team: "Team B",
  },
  {
    id: 7,
    name: "Robert Wilson",
    email: "robert.w@company.com",
    avatar: "",
    division: "Design",
    department: "UI/UX",
    team: "Team C",
  },
  {
    id: 8,
    name: "Lisa Anderson",
    email: "lisa.a@company.com",
    avatar: "",
    division: "Marketing",
    department: "Digital",
    team: "Team D",
  },
  {
    id: 9,
    name: "Thomas Martinez",
    email: "thomas.m@company.com",
    avatar: "",
    division: "Engineering",
    department: "Frontend",
    team: "Team A",
  },
  {
    id: 10,
    name: "Jennifer Lee",
    email: "jennifer.l@company.com",
    avatar: "",
    division: "Engineering",
    department: "Backend",
    team: "Team B",
  },
  {
    id: 11,
    name: "James Wilson",
    email: "james.w@company.com",
    avatar: "",
    division: "Design",
    department: "UI/UX",
    team: "Team C",
  },
  {
    id: 12,
    name: "Patricia Moore",
    email: "patricia.m@company.com",
    avatar: "",
    division: "Marketing",
    department: "Digital",
    team: "Team D",
  },
]

// Get unique values for tabs
const getUniqueDivisions = () => [
  ...new Set(mockEmployees.map((emp) => emp.division)),
]
const getUniqueDepartments = () => [
  ...new Set(mockEmployees.map((emp) => emp.department)),
]
const getUniqueTeams = () => [...new Set(mockEmployees.map((emp) => emp.team))]

interface SendMailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

export function SendMailDialog({
  open,
  onOpenChange,
  defaultEmail = "default@company.com",
}: SendMailDialogProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<
    typeof mockEmployees
  >([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [searchTab, setSearchTab] = useState("employee")
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [isInteractingWithDropdown, setIsInteractingWithDropdown] =
    useState(false)
  const dropdownCloseTimer = useRef<NodeJS.Timeout | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  

  const MAX_SELECTED = 6

  // Mock config for display - Outlook is default
  // Configuration states - Outlook is default
  const [config, setConfig] = useState({
    fileUploadSize: 5,
    sessionTimeout: 30,
    jwtExpiry: 24,
    maxLoginAttempts: 5,
    smtp: {
      gmailHost: "smtp.gmail.com",
      gmailPassword: "",
      gmailDefault: false,
      outlookHost: "smtp.office365.com",
      outlookPassword: "",
      outlookDefault: true,
    },
  })

  // Notification Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    courseAnnouncements: true,
    jlptExamAnnouncements: true,
    certificateUpdates: true,
    systemNotifications: true,
    emailNotifications: true,
  })

  // Get default provider
  const getDefaultProvider = () => {
    if (config.smtp.outlookDefault) {
      return { name: "Outlook", email: config.smtp.outlookHost }
    } else if (config.smtp.gmailDefault) {
      return { name: "Gmail", email: config.smtp.gmailHost }
    }
    return { name: "Outlook", email: config.smtp.outlookHost }
  }

  const defaultProvider = getDefaultProvider()

  // Check if all employees from a category are selected
  const isAllSelected = (category: string, type: string) => {
    let employees: typeof mockEmployees = []
    if (type === "division") {
      employees = mockEmployees.filter((emp) => emp.division === category)
    } else if (type === "department") {
      employees = mockEmployees.filter((emp) => emp.department === category)
    } else if (type === "team") {
      employees = mockEmployees.filter((emp) => emp.team === category)
    }
    return (
      employees.length > 0 &&
      employees.every((emp) =>
        selectedEmployees.some((selected) => selected.id === emp.id)
      )
    )
  }

  // Filter employees based on search query and tab
  const getFilteredData = () => {
    let filteredData: any[] = []

    switch (searchTab) {
      case "employee":
        filteredData = mockEmployees.filter(
          (employee) =>
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        break
      case "division":
        const divisions = getUniqueDivisions()
        filteredData = divisions
          .filter((div) =>
            div.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((div) => ({
            type: "division",
            name: div,
            count: mockEmployees.filter((emp) => emp.division === div).length,
            icon: Building04Icon,
            allSelected: isAllSelected(div, "division"),
          }))
        break
      case "department":
        const departments = getUniqueDepartments()
        filteredData = departments
          .filter((dept) =>
            dept.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((dept) => ({
            type: "department",
            name: dept,
            count: mockEmployees.filter((emp) => emp.department === dept)
              .length,
            icon: BriefcaseIcon,
            allSelected: isAllSelected(dept, "department"),
          }))
        break
      case "team":
        const teams = getUniqueTeams()
        filteredData = teams
          .filter((team) =>
            team.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((team) => ({
            type: "team",
            name: team,
            count: mockEmployees.filter((emp) => emp.team === team).length,
            icon: UserGroupIcon,
            allSelected: isAllSelected(team, "team"),
          }))
        break
      default:
        break
    }

    return filteredData
  }

  const filteredData = getFilteredData()

  // Get display employees (max 6)
  const displayEmployees = selectedEmployees.slice(0, MAX_SELECTED)
  const remainingCount = selectedEmployees.length - MAX_SELECTED

  const handleSelectEmployee = (employee: (typeof mockEmployees)[0]) => {
    // Check if already selected
    const isAlreadySelected = selectedEmployees.some(
      (selected) => selected.id === employee.id
    )

    if (isAlreadySelected) {
      // Remove if already selected
      setSelectedEmployees(
        selectedEmployees.filter((emp) => emp.id !== employee.id)
      )
      setSelectedEmails(
        selectedEmails.filter((email) => email !== employee.email)
      )
    } else {
      // Add if not selected
      setSelectedEmployees([...selectedEmployees, employee])
      setSelectedEmails([...selectedEmails, employee.email])
    }
  }

  const handleSelectCategory = (category: string, type: string) => {
    const employeesInCategory = mockEmployees.filter((emp) => {
      if (type === "division") return emp.division === category
      if (type === "department") return emp.department === category
      if (type === "team") return emp.team === category
      return false
    })

    const allSelected = employeesInCategory.every((emp) =>
      selectedEmployees.some((selected) => selected.id === emp.id)
    )

    if (allSelected) {
      // Remove all from category
      const idsToRemove = employeesInCategory.map((emp) => emp.id)
      setSelectedEmployees(
        selectedEmployees.filter((emp) => !idsToRemove.includes(emp.id))
      )
      setSelectedEmails(
        selectedEmails.filter(
          (email) => !employeesInCategory.some((emp) => emp.email === email)
        )
      )
    } else {
      // Add all from category
      const employeesToAdd = employeesInCategory.filter(
        (emp) => !selectedEmployees.some((selected) => selected.id === emp.id)
      )
      setSelectedEmployees([...selectedEmployees, ...employeesToAdd])
      setSelectedEmails([
        ...selectedEmails,
        ...employeesToAdd.map((emp) => emp.email),
      ])
    }
  }

  const handleRemoveEmployee = (employeeId: number) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.id !== employeeId)
    )
    setSelectedEmails(
      selectedEmails.filter((email) => {
        const employee = mockEmployees.find((emp) => emp.id === employeeId)
        return employee ? email !== employee.email : true
      })
    )
  }

  const handleRemoveAll = () => {
    setSelectedEmployees([])
    setSelectedEmails([])
  }

  const handleSend = () => {
    console.log("Sending email:", {
      to: selectedEmails,
      provider: defaultProvider.name,
      subject,
      description,
    })
    onOpenChange(false)
    // Reset form
    setSubject("")
    setDescription("")
    setSelectedEmployees([])
    setSelectedEmails([])
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSearchTab("employee")
    }
  }, [open])

  const isFormValid =
    selectedEmails.length > 0 &&
    subject.trim() !== "" &&
    description.trim() !== ""

  const handleSaveSettings = async (
    updatedConfig: any,
    updatedNotificationSettings: any
  ) => {
    setIsLoading(true)
    try {
      console.log("Saving settings:", {
        updatedConfig,
        updatedNotificationSettings,
      })
      setConfig(updatedConfig)
      setNotificationSettings(updatedNotificationSettings)
      setSettingsDialogOpen(false)
    } catch (error) {
      console.error("Failed to save settings:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleDropdownOpenChange = (isOpen: boolean) => {
    // Clear any pending timer
    if (dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }

    if (isOpen) {
      setIsInteractingWithDropdown(true)
    } else {
      // Delay setting to false to prevent dialog from closing when clicking outside dropdown
      dropdownCloseTimer.current = setTimeout(() => {
        setIsInteractingWithDropdown(false)
        dropdownCloseTimer.current = null
      }, 150)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if we're interacting with a dropdown
    if (!newOpen && isInteractingWithDropdown) {
      return
    }
    // Clear any pending timer when dialog closes
    if (!newOpen && dropdownCloseTimer.current) {
      clearTimeout(dropdownCloseTimer.current)
      dropdownCloseTimer.current = null
    }
    onOpenChange(newOpen)
  }

  // Handle pointer down outside - only prevent if clicking on dropdown
  const handlePointerDownOutside = (e: Event) => {
    const target = e.target as HTMLElement
    // Allow closing when clicking on the overlay or outside
    // But prevent if clicking on dropdown items or the select trigger
    if (
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest("[data-select-trigger]") ||
      target.closest("[data-command-dialog]")
    ) {
      e.preventDefault()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] flex-col p-0 sm:max-w-[550px]"
          onPointerDownOutside={handlePointerDownOutside}
          onEscapeKeyDown={(e) => {
            // Prevent escape key from closing when dropdown is open
            if (isInteractingWithDropdown) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={MailSend02Icon}
                strokeWidth={2}
                className="h-5 w-5"
              />
              Send Mail
            </DialogTitle>
            <DialogDescription>
              Compose and send an email to employees.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
              {/* To: Field with Search */}
              <Field>
                <FieldLabel
                  className="flex w-full justify-between"
                  htmlFor="to-field"
                >
                  <div>
                    To <span className="text-destructive">*</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setSearchOpen(true)}
                      >
                        <HugeiconsIcon
                          icon={PlusSignIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                        Add
                      </Button>
                      {selectedEmployees.length > 0 && (
                        <Button
                          variant="destructive"
                          size="xs"
                          onClick={handleRemoveAll}
                          className="text-red-500 hover:text-red-600"
                        >
                          <HugeiconsIcon
                            icon={CancelIcon}
                            strokeWidth={2}
                            className="h-4 w-4"
                          />
                          Remove All
                        </Button>
                      )}
                    </div>
                  </div>
                </FieldLabel>
              </Field>
              <div className="space-y-2">
                {/* Selected Employees Display as Chips or No Selection Message */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEmployees.length > 0 ? (
                    <>
                      {displayEmployees.map((employee) => (
                        <Badge
                          key={employee.id}
                          variant="secondary"
                          className="flex cursor-pointer items-center px-2 py-1.5 text-sm font-normal hover:bg-muted/80"
                          onClick={() => setViewAllOpen(true)}
                        >
                          <span className="text-xs">{employee.email}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveEmployee(employee.id)
                            }}
                            className="rounded-full p-0.5 transition-colors hover:bg-muted"
                          >
                            <HugeiconsIcon
                              icon={CancelIcon}
                              strokeWidth={2}
                              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                            />
                          </button>
                        </Badge>
                      ))}
                      {remainingCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer px-3 py-1.5 text-sm font-medium hover:bg-muted/80"
                          onClick={() => setViewAllOpen(true)}
                        >
                          +{remainingCount} more
                        </Badge>
                      )}
                    </>
                  ) : (
                    <div className="w-full rounded-lg border-2 border-dashed p-4 text-center">
                      <span className="text-sm text-muted-foreground">
                        No employee selected
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Provider - Display only with Change Default button */}
              <Field>
                <FieldLabel htmlFor="email-provider">Email Provider</FieldLabel>
                <div className="flex items-center justify-between rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{defaultProvider.name}</span>
                    <span className="text-sm text-muted-foreground">
                      (will use {defaultProvider.email})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSettingsDialogOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon
                      icon={MailEdit02Icon}
                      strokeWidth={2}
                      className="h-4 w-4"
                    />
                    Change mail
                  </Button>
                </div>
              </Field>

              {/* Subject */}
              <Field>
                <FieldLabel htmlFor="subject">
                  Subject <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </Field>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  id="description"
                  placeholder="Write your message here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px] resize-none"
                  required
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="flex border-t p-6 pt-4">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              className="flex-1"
              onClick={handleSend}
              disabled={!isFormValid}
            >
              <HugeiconsIcon
                icon={MailSend02Icon}
                strokeWidth={2}
                className="mr-2 h-4 w-4"
              />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Search Command Dialog */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={(newOpen) => {
          setSearchOpen(newOpen)
          if (!newOpen) {
            setSearchQuery("")
          }
        }}
        data-command-dialog
      >
        <Command>
          <div className="border-b py-2">
            <Tabs
              className="px-1"
              value={searchTab}
              onValueChange={setSearchTab}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="employee"
                  className="flex items-center gap-1"
                >
                  Employee
                </TabsTrigger>
                <TabsTrigger
                  value="division"
                  className="flex items-center gap-1"
                >
                  Division
                </TabsTrigger>
                <TabsTrigger
                  value="department"
                  className="flex items-center gap-1"
                >
                  Department
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-1">
                  Team
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <CommandInput
              placeholder={
                searchTab === "employee"
                  ? "Search employees..."
                  : `Search ${searchTab}...`
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Employee Tab - Show All Employees */}
            {searchTab === "employee" && (
              <CommandGroup>
                {filteredData.map((employee) => {
                  const isSelected = selectedEmployees.some(
                    (selected) => selected.id === employee.id
                  )
                  return (
                    <CommandItem
                      key={employee.id}
                      onSelect={() => handleSelectEmployee(employee)}
                      className="group flex cursor-pointer items-center gap-3"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={employee.avatar || "/avatars/default.jpg"}
                          alt={employee.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {employee.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {employee.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {employee.email}
                        </span>
                      </div>
                      <CommandShortcut>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectEmployee(employee)
                          }}
                          className={`rounded-full p-1 ${isSelected ? "" : "opacity-0 transition-opacity group-hover:opacity-100"} hover:bg-muted`}
                        >
                          <HugeiconsIcon
                            icon={isSelected ? CancelIcon : PlusSignIcon}
                            strokeWidth={2}
                            className={`h-4 w-4 text-muted-foreground hover:text-foreground`}
                          />
                        </button>
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Division Tab - Show Divisions with Count */}
            {searchTab === "division" && (
              <CommandGroup>
                {filteredData.map((division) => {
                  const isSelected = division.allSelected
                  return (
                    <CommandItem
                      key={division.name}
                      onSelect={() =>
                        handleSelectCategory(division.name, "division")
                      }
                      className="group flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <span className="font-medium">{division.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({division.count} employees)
                        </span>
                      </div>

                      <CommandShortcut>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCategory(division.name, "division")
                          }}
                          className={`rounded-full p-1 ${isSelected ? "" : "opacity-0 transition-opacity group-hover:opacity-100"} hover:bg-muted`}
                        >
                          <HugeiconsIcon
                            icon={isSelected ? CancelIcon : PlusSignIcon}
                            strokeWidth={2}
                            className={`h-4 w-4 text-muted-foreground hover:text-foreground`}
                          />
                        </button>
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Department Tab - Show Departments with Count */}
            {searchTab === "department" && (
              <CommandGroup>
                {filteredData.map((department) => {
                  const isSelected = department.allSelected
                  return (
                    <CommandItem
                      key={department.name}
                      onSelect={() =>
                        handleSelectCategory(department.name, "department")
                      }
                      className="group flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{department.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({department.count} employees)
                        </span>
                      </div>

                      <CommandShortcut>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCategory(department.name, "department")
                          }}
                          className={`rounded-full p-1 ${isSelected ? "" : "opacity-0 transition-opacity group-hover:opacity-100"} hover:bg-muted`}
                        >
                          <HugeiconsIcon
                            icon={isSelected ? CancelIcon : PlusSignIcon}
                            strokeWidth={2}
                            className={`h-4 w-4 text-muted-foreground hover:text-foreground`}
                          />
                        </button>
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Team Tab - Show Teams with Count */}
            {searchTab === "team" && (
              <CommandGroup>
                {filteredData.map((team) => {
                  const isSelected = team.allSelected
                  return (
                    <CommandItem
                      key={team.name}
                      onSelect={() => handleSelectCategory(team.name, "team")}
                      className="group flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({team.count} employees)
                        </span>
                      </div>
                      <CommandShortcut>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectCategory(team.name, "team")
                          }}
                          className={`rounded-full p-1 ${isSelected ? "" : "opacity-0 transition-opacity group-hover:opacity-100"} hover:bg-muted`}
                        >
                          <HugeiconsIcon
                            icon={isSelected ? CancelIcon : PlusSignIcon}
                            strokeWidth={2}
                            className="h-4 w-4 text-muted-foreground hover:text-foreground"
                          />
                        </button>
                      </CommandShortcut>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {/* View All Selected Employees Command Dialog */}
      <CommandDialog
        open={viewAllOpen}
        onOpenChange={setViewAllOpen}
        data-command-dialog
      >
        <Command>
          <div className="border-b px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Selected Employees ({selectedEmployees.length})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="xs"
                  onClick={handleRemoveAll}
                >
                  <HugeiconsIcon
                    icon={CancelIcon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                  Remove All
                </Button>
              </div>
            </div>
          </div>
          <CommandList>
            <CommandGroup>
              {selectedEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  onSelect={() => handleRemoveEmployee(employee.id)}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={employee.avatar || "/avatars/default.jpg"}
                      alt={employee.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {employee.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {employee.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {employee.email}
                    </span>
                  </div>
                  <CommandShortcut>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveEmployee(employee.id)
                      }}
                      className="rounded-full p-1 transition-colors hover:bg-muted"
                    >
                      <HugeiconsIcon
                        icon={CancelIcon}
                        strokeWidth={2}
                        className="h-4 w-4"
                      />
                    </button>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedEmployees.length === 0 && (
              <CommandEmpty>No employees selected.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </CommandDialog>



      {/* Setting Dialog */}
      <SettingDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        config={config}
        notificationSettings={notificationSettings}
        onSave={handleSaveSettings}
        isLoading={isLoading}
      />
    </>
  )
}
