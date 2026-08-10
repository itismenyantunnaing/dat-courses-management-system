// app/components/dialogs/send-mail-dialog.tsx
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
import { SettingDialog } from "./setting-dialog"
import { mainStore } from "@/store/mainStore"
import type { Employee } from "@/types/employee"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface SendMailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

const ITEMS_PER_PAGE = 20

export function SendMailDialog({
  open,
  onOpenChange,
  defaultEmail = "default@company.com",
}: SendMailDialogProps) {
  // Get data from store
  const { 
    employee_data, 
    fetch_EmployeeData,
    systemConfig,
    fetch_SystemConfig,
    getToken,
    getAuthHeaders
  } = mainStore();

  // Local state
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([])
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
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(false)
  
  // Pagination state for employee search
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const commandListRef = useRef<HTMLDivElement>(null)
  const isLoadingMoreRef = useRef(false)
  const searchQueryRef = useRef(searchQuery)
  const searchTabRef = useRef(searchTab)

  const MAX_SELECTED = 6

  // Notification Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    courseAnnouncements: true,
    jlptExamAnnouncements: true,
    certificateUpdates: true,
    emailNotifications: true,
  })

  // Get default provider from system config
  const getDefaultProvider = () => {
    if (!systemConfig) {
      return { name: "Email", email: "" }
    }
    if (systemConfig.activeSmtpProvider === "GMAIL") {
      return { name: "Gmail", email: systemConfig.gmailHost || "" }
    } else if (systemConfig.activeSmtpProvider === "OUTLOOK") {
      return { name: "Outlook", email: systemConfig.outlookHost || "" }
    }
    return { name: "Email", email: "" }
  }

  const defaultProvider = getDefaultProvider()

  // Helper to transform Employee type to component's employee type
  const transformEmployee = (emp: any) => ({
    id: emp.id,
    name: emp.name || "",
    email: emp.email || "",
    avatar: emp.profile_photo_path || "",
    division: emp.div_name || "",
    department: emp.dept_dat || "",
    team: emp.team || "",
  })

  // Helper to get unique categories
  const getUniqueDivisions = () => [
    ...new Set(employee_data.map((emp: any) => emp.div_name || "").filter(Boolean)),
  ]
  const getUniqueDepartments = () => [
    ...new Set(employee_data.map((emp: any) => emp.dept_dat || "").filter(Boolean)),
  ]
  const getUniqueTeams = () => [
    ...new Set(employee_data.map((emp: any) => emp.team || "").filter(Boolean)),
  ]

  // Check if all employees from a category are selected
  const isAllSelected = (category: string, type: string) => {
    let employees: any[] = []
    if (type === "division") {
      employees = employee_data.filter((emp: any) => emp.div_name === category)
    } else if (type === "department") {
      employees = employee_data.filter((emp: any) => emp.dept_dat === category)
    } else if (type === "team") {
      employees = employee_data.filter((emp: any) => emp.team === category)
    }
    return (
      employees.length > 0 &&
      employees.every((emp) =>
        selectedEmployees.some((selected) => selected.id === emp.id)
      )
    )
  }

  

  // Get all filtered data (for group selection and total count)
  const getAllFilteredData = useCallback(() => {
    let filteredData: any[] = []
    const transformedEmployees = employee_data.map(transformEmployee)

    switch (searchTab) {
      case "employee":
        filteredData = transformedEmployees.filter(
          (employee: any) =>
            employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee?.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
            count: employee_data.filter((emp: any) => emp.div_name === div).length,
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
            count: employee_data.filter((emp: any) => emp.dept_dat === dept).length,
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
            count: employee_data.filter((emp: any) => emp.team === team).length,
            icon: UserGroupIcon,
            allSelected: isAllSelected(team, "team"),
          }))
        break
      default:
        break
    }

    return filteredData
  }, [searchTab, searchQuery, employee_data, selectedEmployees])

  // Get visible data based on pagination (only for employee tab)
  const getVisibleData = useCallback(() => {
    const allData = getAllFilteredData()
    
    // For non-employee tabs (division, department, team), show all data
    if (searchTab !== "employee") {
      return allData
    }
    
    // For employee tab, apply pagination
    return allData.slice(0, visibleCount)
  }, [getAllFilteredData, searchTab, visibleCount])

  const filteredData = getVisibleData()
  const allFilteredData = getAllFilteredData()
  const hasMoreEntries = searchTab === "employee" && visibleCount < allFilteredData.length

  // Get display employees (max 6)
  const displayEmployees = selectedEmployees.slice(0, MAX_SELECTED)
  const remainingCount = selectedEmployees.length - MAX_SELECTED

  const handleSelectEmployee = (employee: any) => {
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
    // Get ALL employees in the category (not just visible ones)
    const employeesInCategory = employee_data.map(transformEmployee).filter((emp) => {
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
        const employee = selectedEmployees.find((emp) => emp.id === employeeId)
        return employee ? email !== employee.email : true
      })
    )
  }

  const handleRemoveAll = () => {
    setSelectedEmployees([])
    setSelectedEmails([])
  }

  const handleSend = async () => {
    if (!isFormValid) return;
    setIsSending(true);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {};
      await fetch(`${apiUrl}/api/email/send`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedEmails,
          subject,
          text: description,
        }),
      });
      onOpenChange(false);
      // Reset form
      setSubject("");
      setDescription("");
      setSelectedEmployees([]);
      setSelectedEmails([]);
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingInitial(true);
      Promise.all([
        fetch_EmployeeData(),
        fetch_SystemConfig()
      ]).finally(() => {
        setIsLoadingInitial(false);
      });
    }
  }, [open, fetch_EmployeeData, fetch_SystemConfig]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setSearchTab("employee")
      setVisibleCount(ITEMS_PER_PAGE)
    }
  }, [open])

  // Reset pagination when search query or tab changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
    isLoadingMoreRef.current = false
    // Reset scroll position
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0
    }
  }, [searchQuery, searchTab])

  // Handle scroll to load more (only for employee tab)
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Only enable infinite scroll for employee tab
    if (searchTab !== "employee") return
    
    const target = e.currentTarget
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
    
    if (bottom && hasMoreEntries && !isLoadingMoreRef.current && !isLoading) {
      isLoadingMoreRef.current = true
      setIsLoadingMore(true)
      
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, allFilteredData.length))
        setIsLoadingMore(false)
        setTimeout(() => {
          isLoadingMoreRef.current = false
        }, 100)
      }, 300)
    }
  }, [hasMoreEntries, isLoading, allFilteredData.length, searchTab])

  const isFormValid =
    selectedEmails.length > 0 &&
    subject.trim() !== "" &&
    description.trim() !== ""

  const handleSaveSettings = async (
    updatedNotificationSettings: any
  ) => {
    setIsLoading(true)
    try {
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

          {isLoadingInitial ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading employees...</p>
              </div>
            </div>
          ) : (
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
                            key={employee.email}
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
          )}

          <DialogFooter className="flex border-t p-6 pt-4">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>

            <Button
              className="flex-1"
              onClick={handleSend}
              disabled={!isFormValid || isSending || isLoadingInitial}
            >
              <HugeiconsIcon
                icon={MailSend02Icon}
                strokeWidth={2}
                className="mr-2 h-4 w-4"
              />
              {isSending ? "Sending..." : "Send Email"}
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

          <CommandList 
            ref={commandListRef}
            onScroll={handleScroll}
            className="max-h-[400px] overflow-y-auto"
          >
            <CommandEmpty>No results found.</CommandEmpty>

            {/* Employee Tab - Show All Employees with Pagination */}
            {searchTab === "employee" && (
              <CommandGroup>
                {filteredData.map((employee) => {
             
                  const isSelected = selectedEmployees.some(
                    (selected) => selected.id === employee.id
                  )
                  return (
                    <CommandItem
                      key={employee.email}
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
                            .map((n: any[]) => n[0])
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
                
                {/* Loading more indicator for employee tab */}
                {hasMoreEntries && (
                  <div className="border-t pt-2 mt-2">
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                        <span>Loading more employees...</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Showing {filteredData.length} of {allFilteredData.length} employees
                      </span>
                    </div>
                  </div>
                )}
                
                {/* All loaded indicator */}
                {!hasMoreEntries && allFilteredData.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      Showing all {allFilteredData.length} employees
                    </p>
                  </div>
                )}
              </CommandGroup>
            )}

            {/* Division Tab - Show Divisions with Count (no pagination) */}
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

            {/* Department Tab - Show Departments with Count (no pagination) */}
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

            {/* Team Tab - Show Teams with Count (no pagination) */}
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
                        .map((n: any[]) => n[0])
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
        notificationSettings={notificationSettings}
        onSaveNotificationSettings={handleSaveSettings}
      />
    </>
  )
}