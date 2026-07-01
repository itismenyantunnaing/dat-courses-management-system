"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    PlusSignIcon,
    Delete02Icon,
    Time02Icon,
    UserGroupIcon,
    Calendar03Icon,
    ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    CourseGroup,
    CourseSession,
    MentionedLearner,
    DAYS_OF_WEEK,
} from "@/types/course"
import { cn } from "@/lib/utils"

// Status colors and labels for learners
const statusColors: Record<string, string> = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    completed: "bg-blue-500",
    inactive: "bg-gray-500",
}

const statusLabels: Record<string, string> = {
    active: "Active",
    pending: "Pending",
    completed: "Completed",
    inactive: "Inactive",
}

const DEFAULT_SESSION_DAYS = [4, 5]
const AVAILABLE_LEARNERS_PER_PAGE = 10

export const formatGroupsForAPI = (groups: CourseGroup[]) => {
  return groups.map(group => ({
    group_name: group.name,
    capacity: group.capacity === 'unlimited' ? null : group.capacity,
    start_date: group.startDate?.toISOString().split('T')[0] || null,
    end_date: group.endDate?.toISOString().split('T')[0] || null,
    sessions_per_week: group.sessionsPerWeek || [],
    start_time: group.startTime,
    end_time: group.endTime,
    sessions: group.sessions.map(session => ({
      session_date: session.date?.toISOString().split('T')[0],
      start_time: session.startTime,
      end_time: session.endTime,
    })) || [],
  }))
}


interface TrainerSectionProps {
    groups: CourseGroup[]
    mentionedLearners: MentionedLearner[]
    availableLearners: MentionedLearner[]
    allEmployees: MentionedLearner[]
    onUpdateGroups: (groups: CourseGroup[]) => void
    onUpdateMentionedLearners: (learners: MentionedLearner[]) => void
    onAddLearner: (learner: MentionedLearner) => void
    onRemoveLearner: (learnerId: string) => void
    groupErrors: { [key: string]: string }
    onSetGroupErrors: (errors: { [key: string]: string }) => void
    activeGroupTab: string
    onSetActiveGroupTab: (tab: string) => void
    trainerSessionPage: number
    onSetTrainerSessionPage: (page: number) => void
    trainerItemsPerPage: number
    onSetTrainerItemsPerPage: (items: number) => void
    learnersPage: number
    onSetLearnersPage: (page: number) => void
    learnersItemsPerPage: number
    onSetLearnersItemsPerPage: (items: number) => void
    learnersCommandOpen: boolean
    onSetLearnersCommandOpen: (open: boolean) => void
    defaultGroup: CourseGroup
    onDelete?: () => void
    isSubmitting?: boolean
    mode?: "add" | "edit"
}

export const TrainerSection: React.FC<TrainerSectionProps> = ({
    groups,
    mentionedLearners,
    availableLearners,
    allEmployees,
    onUpdateGroups,
    onUpdateMentionedLearners,
    onAddLearner,
    onRemoveLearner,
    groupErrors,
    onSetGroupErrors,
    activeGroupTab,
    onSetActiveGroupTab,
    trainerSessionPage,
    onSetTrainerSessionPage,
    trainerItemsPerPage,
    onSetTrainerItemsPerPage,
    learnersPage,
    onSetLearnersPage,
    learnersItemsPerPage,
    onSetLearnersItemsPerPage,
    learnersCommandOpen,
    onSetLearnersCommandOpen,
    defaultGroup,
    isSubmitting,
    mode,
}) => {
    const previousTotalSessionsRef = React.useRef<{ [key: string]: number }>({})

    // State for available learners - track how many to show
    const [visibleLearnersCount, setVisibleLearnersCount] = useState(AVAILABLE_LEARNERS_PER_PAGE)
    const [searchQuery, setSearchQuery] = useState("")

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!learnersCommandOpen) {
            setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
            setSearchQuery("")
        }
    }, [learnersCommandOpen])

    // DEBUG: Log the data to check if it's being passed correctly
    useEffect(() => {
        if (learnersCommandOpen) {
            console.log("=== LEARNER SEARCH DEBUG ===")
            console.log("allEmployees count:", allEmployees.length)
            console.log("availableLearners count:", availableLearners.length)
            console.log("mentionedLearners count:", mentionedLearners.length)
            console.log("searchQuery:", searchQuery)
            if (allEmployees.length > 0) {
                console.log("Sample employee name:", allEmployees[0]?.name)
                console.log("Sample employee email:", allEmployees[0]?.email)
                console.log("Sample employee department:", allEmployees[0]?.department)
                console.log("Sample employee team:", allEmployees[0]?.team)
            }
            console.log("=== END DEBUG ===")
        }
    }, [learnersCommandOpen, allEmployees, availableLearners, mentionedLearners, searchQuery])

    // Get the list of learners to display based on search
    const displayedLearners = React.useMemo(() => {
        const mentionedIds = new Set(mentionedLearners.map((l) => l.id))

        // If no search query, use availableLearners (already filtered)
        if (!searchQuery.trim()) {
            return availableLearners
        }

        // Search across ALL employees
        const query = searchQuery.toLowerCase().trim()

        const results = allEmployees.filter(
            (learner) => {
                // Skip if already mentioned
                if (mentionedIds.has(learner.id)) {
                    return false
                }

                // Search in all fields with null safety
                const searchableFields = [
                    learner.name || '',
                    learner.email || '',
                    learner.department || '',
                    learner.team || ''
                ]

                // Check if any field contains the search query
                return searchableFields.some(field =>
                    field.toLowerCase().includes(query)
                )
            }
        )

        // DEBUG: Log search results
        if (searchQuery.trim()) {
            console.log(`Search query: "${query}"`)
            console.log(`Found ${results.length} matching learners`)
            if (results.length > 0) {
                console.log("First match:", results[0].name)
            }
        }

        return results
    }, [allEmployees, searchQuery, availableLearners, mentionedLearners])

    // Get visible learners (first N items)
    const visibleLearners = React.useMemo(() => {
        return displayedLearners.slice(0, visibleLearnersCount)
    }, [displayedLearners, visibleLearnersCount])

    const hasMoreLearners = visibleLearnersCount < displayedLearners.length

    // Handle "See More" click - add 10 more
    const handleSeeMore = () => {
        setVisibleLearnersCount(prev => prev + AVAILABLE_LEARNERS_PER_PAGE)
    }

    const addGroup = () => {
        const newGroup: CourseGroup = {
            id: `g${Date.now()}`,
            name: `Group ${groups.length + 1}`,
            capacity: "unlimited",
            startDate: new Date(),
            sessionsPerWeek: DEFAULT_SESSION_DAYS,
            startTime: "09:00",
            endTime: "10:00",
            sessions: [],
            registeredCount: 0,
        }
        onUpdateGroups([...groups, newGroup])
        onSetActiveGroupTab(newGroup.id)
        onSetTrainerSessionPage(1)
    }

    const removeGroup = (groupId: string) => {
        if (groups.length <= 1) return
        const updatedGroups = groups.filter((g) => g.id !== groupId)
        onUpdateGroups(updatedGroups)
        if (activeGroupTab === groupId) {
            if (updatedGroups.length > 0) {
                onSetActiveGroupTab(updatedGroups[0].id)
            }
        }
    }

    const updateGroup = (groupId: string, field: string, value: any) => {
        const updatedGroups = groups.map((group) =>
            group.id === groupId ? { ...group, [field]: value } : group
        )
        onUpdateGroups(updatedGroups)

        if (
            [
                "startDate",
                "endDate",
                "sessionsPerWeek",
                "startTime",
                "endTime",
            ].includes(field)
        ) {
            const resetSessions = updatedGroups.map((group) =>
                group.id === groupId ? { ...group, sessions: [] } : group
            )
            onUpdateGroups(resetSessions)
            previousTotalSessionsRef.current[groupId] = 0
        }
    }

    const updateGroupSession = (
        groupId: string,
        sessionId: string,
        field: string,
        value: any
    ) => {
        const updatedGroups = groups.map((group) =>
            group.id === groupId
                ? {
                    ...group,
                    sessions: group.sessions.map((s) =>
                        s.id === sessionId ? { ...s, [field]: value } : s
                    ),
                }
                : group
        )
        onUpdateGroups(updatedGroups)
    }

    const addGroupSession = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId)
        if (!group) return

        const newSession: CourseSession = {
            id: `s${Date.now()}`,
            date: new Date(),
            startTime: group.startTime || "09:00",
            endTime: group.endTime || "10:00",
        }

        const updatedGroups = groups.map((g) =>
            g.id === groupId ? { ...g, sessions: [...g.sessions, newSession] } : g
        )
        onUpdateGroups(updatedGroups)
        const totalPages = Math.ceil(
            (groups.find((g) => g.id === groupId)?.sessions.length || 0 + 1) /
            trainerItemsPerPage
        )
        onSetTrainerSessionPage(totalPages)
    }

    const removeGroupSession = (groupId: string, sessionId: string) => {
        const updatedGroups = groups.map((group) =>
            group.id === groupId
                ? {
                    ...group,
                    sessions: group.sessions.filter((s) => s.id !== sessionId),
                }
                : group
        )
        onUpdateGroups(updatedGroups)
    }

    const handleGroupDayToggle = (groupId: string, day: number) => {
        const group = groups.find((g) => g.id === groupId)
        if (!group) return

        const currentDays = group.sessionsPerWeek || []
        let newDays: number[]

        if (currentDays.includes(day)) {
            newDays = currentDays.filter((d) => d !== day)
        } else {
            newDays = [...currentDays, day].sort((a, b) => a - b)
        }

        updateGroup(groupId, "sessionsPerWeek", newDays)
    }

    const handleGroupSessionDateChange = (
        groupId: string,
        sessionId: string,
        date: Date | undefined
    ) => {
        if (!date) return

        const group = groups.find((g) => g.id === groupId)
        if (!group) return

        if (group.endDate && date > group.endDate) {
            onSetGroupErrors({
                ...groupErrors,
                [groupId]: "Session date cannot be after the end date",
            })
            return
        }

        if (date < group.startDate) {
            onSetGroupErrors({
                ...groupErrors,
                [groupId]: "Session date cannot be before the start date",
            })
            return
        }

        const newErrors = { ...groupErrors }
        delete newErrors[groupId]
        onSetGroupErrors(newErrors)

        updateGroupSession(groupId, sessionId, "date", date)
    }

    const handleTrainerItemsPerPageChange = (value: string) => {
        const newItemsPerPage = parseInt(value)
        onSetTrainerItemsPerPage(newItemsPerPage)
        onSetTrainerSessionPage(1)
    }

    const handleLearnersItemsPerPageChange = (value: string) => {
        const newItemsPerPage = parseInt(value)
        onSetLearnersItemsPerPage(newItemsPerPage)
        onSetLearnersPage(1)
    }

    const lastUpdateRef = React.useRef<string>("")

    // Auto-generate sessions for each group when settings change
    useEffect(() => {
        let updatedGroups = groups.map((group) => {
            const totalSessions = group.sessions.length
            const previousTotal = previousTotalSessionsRef.current[group.id] || 0

            if (totalSessions > 0 && totalSessions !== previousTotal) {
                previousTotalSessionsRef.current[group.id] = totalSessions

                const newSessions: CourseSession[] = []
                const startDate = group.startDate || new Date()
                const sessionDays = group.sessionsPerWeek || DEFAULT_SESSION_DAYS
                const sortedDays = [...sessionDays].sort((a, b) => a - b)
                const startTime = group.startTime || "09:00"
                const endTime = group.endTime || "10:00"

                let currentDate = new Date(startDate)
                let sessionCount = 0

                while (sessionCount < totalSessions) {
                    const dayOfWeek = currentDate.getDay()

                    if (sortedDays.includes(dayOfWeek)) {
                        if (group.endDate && currentDate > group.endDate) {
                            break
                        }
                        newSessions.push({
                            id: `s${Date.now()}-${sessionCount}`,
                            date: new Date(currentDate),
                            startTime: startTime,
                            endTime: endTime,
                        })
                        sessionCount++
                    }

                    currentDate.setDate(currentDate.getDate() + 1)
                }

                return { ...group, sessions: newSessions }
            }
            return group
        })

        // Check if groups changed using a signature to avoid infinite loops
        const updateSignature = JSON.stringify(updatedGroups.map(g => ({
            id: g.id,
            sessionCount: g.sessions.length,
            startDate: g.startDate?.getTime(),
            endDate: g.endDate?.getTime(),
            days: g.sessionsPerWeek,
            start: g.startTime,
            end: g.endTime
        })))

        if (lastUpdateRef.current !== updateSignature) {
            lastUpdateRef.current = updateSignature
            onUpdateGroups(updatedGroups)
        }
    }, [groups, onUpdateGroups])

    const renderGroupFields = (group: CourseGroup) => {
        const groupError = groupErrors[group.id]

        const totalTrainerPages = Math.ceil(
            group.sessions.length / trainerItemsPerPage
        )
        const paginatedTrainerSessions = group.sessions.slice(
            (trainerSessionPage - 1) * trainerItemsPerPage,
            trainerSessionPage * trainerItemsPerPage
        )

        return (
            <div className="space-y-6">
                {groupError && <p className="text-sm text-red-500">{groupError}</p>}

                {/* Group Name & Capacity */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Group Name</Label>
                        <Input
                            value={group.name || ""}
                            onChange={(e) => updateGroup(group.id, "name", e.target.value)}
                            placeholder="Enter group name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Capacity</Label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Input
                                    type="number"
                                    value={group.capacity === "unlimited" ? "" : (group.capacity ?? "")}
                                    onChange={(e) =>
                                        updateGroup(
                                            group.id,
                                            "capacity",
                                            parseInt(e.target.value) || 0
                                        )
                                    }
                                    placeholder="Enter capacity"
                                    disabled={group.capacity === "unlimited"}
                                    min={1}
                                />
                            </div>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                <Switch
                                    checked={group.capacity === "unlimited"}
                                    onCheckedChange={(checked) => {
                                        updateGroup(
                                            group.id,
                                            "capacity",
                                            checked ? "unlimited" : 1
                                        )
                                    }}
                                />
                                <Label className="cursor-pointer text-sm">Unlimited</Label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Start Date & End Date & Start Time & End Time */}
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                        <Label>
                            Start Date <span className="text-red-500">*</span>
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-left font-normal"
                                >
                                    {group.startDate
                                        ? format(group.startDate, "PPP")
                                        : "Pick a date"}
                                    <HugeiconsIcon
                                        icon={Calendar03Icon}
                                        strokeWidth={1.5}
                                        className="h-4 w-4 opacity-50"
                                    />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={group.startDate}
                                    onSelect={(date) =>
                                        updateGroup(group.id, "startDate", date || undefined)
                                    }
                                    defaultMonth={group.startDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-left font-normal"
                                >
                                    {group.endDate
                                        ? format(group.endDate, "PPP")
                                        : "Pick a date"}
                                    <HugeiconsIcon
                                        icon={Calendar03Icon}
                                        strokeWidth={1.5}
                                        className="h-4 w-4 opacity-50"
                                    />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={group.endDate}
                                    onSelect={(date) => {
                                        if (date && group.startDate && date < group.startDate)
                                            return
                                        updateGroup(group.id, "endDate", date || undefined)
                                    }}
                                    defaultMonth={group.endDate || group.startDate}
                                    disabled={(date) => {
                                        if (group.startDate && date < group.startDate) return true
                                        return false
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label>
                            Start Time <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <HugeiconsIcon
                                icon={Time02Icon}
                                strokeWidth={1.5}
                                className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                type="time"
                                value={group.startTime || ""}
                                onChange={(e) => {
                                    updateGroup(group.id, "startTime", e.target.value)
                                    if (group.sessions.length > 0) {
                                        const updatedSessions = group.sessions.map((s) => ({
                                            ...s,
                                            startTime: e.target.value,
                                        }))
                                        updateGroup(group.id, "sessions", updatedSessions)
                                    }
                                }}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>
                            End Time <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <HugeiconsIcon
                                icon={Time02Icon}
                                strokeWidth={1.5}
                                className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                type="time"
                                value={group.endTime || ""}
                                onChange={(e) => {
                                    updateGroup(group.id, "endTime", e.target.value)
                                    if (group.sessions.length > 0) {
                                        const updatedSessions = group.sessions.map((s) => ({
                                            ...s,
                                            endTime: e.target.value,
                                        }))
                                        updateGroup(group.id, "sessions", updatedSessions)
                                    }
                                }}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </div>

                {/* Sessions Per Week & Total Sessions */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>
                                Sessions Per Week <span className="text-red-500">*</span>
                            </Label>
                        </div>
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => {
                                    const allDays = DAYS_OF_WEEK.map((d) => d.value)
                                    updateGroup(group.id, "sessionsPerWeek", allDays)
                                }}
                            >
                                All
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => {
                                    const weekdays = [1, 2, 3, 4, 5]
                                    updateGroup(group.id, "sessionsPerWeek", weekdays)
                                }}
                            >
                                Weekday
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => {
                                    const weekend = [0, 6]
                                    updateGroup(group.id, "sessionsPerWeek", weekend)
                                }}
                            >
                                Weekend
                            </Button>
                            {DAYS_OF_WEEK.map((day) => (
                                <Button
                                    key={day.value}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-3",
                                        group.sessionsPerWeek?.includes(day.value) &&
                                        "bg-primary text-primary-foreground hover:bg-primary/85 hover:text-white"
                                    )}
                                    onClick={() => handleGroupDayToggle(group.id, day.value)}
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>
                        {group.sessionsPerWeek && group.sessionsPerWeek.length > 0 && (
                            <p className="text-xs text-green-600">
                                ✓ {group.sessionsPerWeek.length} day
                                {group.sessionsPerWeek.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>
                            Total Sessions <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="number"
                            value={group.sessions?.length ?? 0}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                const startDate = group.startDate || new Date()
                                const sessionDays =
                                    group.sessionsPerWeek || DEFAULT_SESSION_DAYS
                                const sortedDays = [...sessionDays].sort((a, b) => a - b)
                                const startTime = group.startTime || "09:00"
                                const endTime = group.endTime || "10:00"

                                const newSessions: CourseSession[] = []
                                const currentDate = new Date(startDate)
                                let sessionCount = 0

                                while (sessionCount < value) {
                                    const dayOfWeek = currentDate.getDay()
                                    if (sortedDays.includes(dayOfWeek)) {
                                        if (group.endDate && currentDate > group.endDate) break
                                        newSessions.push({
                                            id: `s${Date.now()}-${sessionCount}`,
                                            date: new Date(currentDate),
                                            startTime: startTime,
                                            endTime: endTime,
                                        })
                                        sessionCount++
                                    }
                                    currentDate.setDate(currentDate.getDate() + 1)
                                }
                                
                                // Reset the signature to ensure the change is accepted
                                lastUpdateRef.current = ""
                                
                                updateGroup(group.id, "sessions", newSessions)
                                onSetTrainerSessionPage(1)
                            }}
                            placeholder="Enter total number of sessions"
                            min={1}
                            required
                        />
                        {group.sessions.length > 0 && (
                            <p className="text-xs text-green-600">
                                ✓ {group.sessions.length} sessions configured
                            </p>
                        )}
                    </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Sessions</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addGroupSession(group.id)}
                            className="gap-1"
                        >
                            <HugeiconsIcon
                                icon={PlusSignIcon}
                                strokeWidth={2}
                                className="h-4 w-4"
                            />
                            Add Session
                        </Button>
                    </div>
                    {group.sessions.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed py-4 text-center text-sm text-muted-foreground">
                            No sessions added yet. Enter "Total Sessions" above or click
                            "Add Session" to create one.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                {paginatedTrainerSessions.map((session, idx) => {
                                    const globalIndex =
                                        (trainerSessionPage - 1) * trainerItemsPerPage + idx
                                    return (
                                        <div
                                            key={session.id}
                                            className="space-y-1 rounded-lg border bg-muted/5 p-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">
                                                    Session #{globalIndex + 1}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        removeGroupSession(group.id, session.id)
                                                    }
                                                >
                                                    <HugeiconsIcon
                                                        icon={Delete02Icon}
                                                        strokeWidth={2}
                                                        className="h-3 w-3"
                                                    />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 justify-start text-left font-normal"
                                                        >
                                                            <HugeiconsIcon
                                                                icon={Calendar03Icon}
                                                                strokeWidth={1.5}
                                                                className="mr-1 h-3 w-3"
                                                            />
                                                            {session.date ? (
                                                                format(session.date, "MMM d, yyyy")
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    Pick date
                                                                </span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-auto p-0"
                                                        align="start"
                                                    >
                                                        <Calendar
                                                            mode="single"
                                                            selected={session.date}
                                                            onSelect={(date) =>
                                                                handleGroupSessionDateChange(
                                                                    group.id,
                                                                    session.id,
                                                                    date
                                                                )
                                                            }
                                                            defaultMonth={session.date || group.startDate}
                                                            disabled={(date) => {
                                                                if (date < group.startDate) return true
                                                                if (group.endDate && date > group.endDate)
                                                                    return true
                                                                return false
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {session.date && (
                                                    <span className="text-[14px] text-muted-foreground">
                                                        {format(session.date, "EEE")}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="time"
                                                        value={session.startTime || ""}
                                                        onChange={(e) =>
                                                            updateGroupSession(
                                                                group.id,
                                                                session.id,
                                                                "startTime",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    to
                                                </span>
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="time"
                                                        value={session.endTime || ""}
                                                        onChange={(e) =>
                                                            updateGroupSession(
                                                                group.id,
                                                                session.id,
                                                                "endTime",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {totalTrainerPages > 1 && (
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <Field orientation="horizontal" className="w-fit">
                                        <FieldLabel
                                            htmlFor="select-trainer-rows-per-page"
                                            className="text-sm whitespace-nowrap text-foreground"
                                        >
                                            Rows per page
                                        </FieldLabel>
                                        <Select
                                            value={trainerItemsPerPage.toString()}
                                            onValueChange={handleTrainerItemsPerPageChange}
                                        >
                                            <SelectTrigger
                                                className="w-15"
                                                id="select-trainer-rows-per-page"
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent align="start">
                                                <SelectGroup>
                                                    <SelectItem value="8">8</SelectItem>
                                                    <SelectItem value="12">12</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Pagination className="justify-end">
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (trainerSessionPage > 1) {
                                                            onSetTrainerSessionPage(trainerSessionPage - 1)
                                                        }
                                                    }}
                                                    className={
                                                        trainerSessionPage === 1
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                { length: totalTrainerPages },
                                                (_, i) => i + 1
                                            ).map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            onSetTrainerSessionPage(page)
                                                        }}
                                                        isActive={trainerSessionPage === page}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        if (trainerSessionPage < totalTrainerPages) {
                                                            onSetTrainerSessionPage(trainerSessionPage + 1)
                                                        }
                                                    }}
                                                    className={
                                                        trainerSessionPage === totalTrainerPages
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                    Groups <span className="text-red-500">*</span>
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addGroup}
                    className="gap-1"
                >
                    <HugeiconsIcon
                        icon={PlusSignIcon}
                        strokeWidth={2}
                        className="h-4 w-4"
                    />
                    Add Group
                </Button>
            </div>

            <Tabs
                value={activeGroupTab}
                onValueChange={onSetActiveGroupTab}
                className="w-full"
            >
                <TabsList className="flex-wrap justify-start">
                    {groups.map((group) => (
                        <div
                            key={group.id}
                            className="relative inline-flex items-center"
                        >
                            <TabsTrigger
                                value={group.id}
                                className={cn(
                                    "flex items-center gap-2",
                                    groups.length > 1 && "pr-8"
                                )}
                            >
                                <HugeiconsIcon
                                    icon={UserGroupIcon}
                                    strokeWidth={2}
                                    className="h-4 w-4"
                                />
                                {group.name}
                            </TabsTrigger>
                            {groups.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 h-5 w-5 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        removeGroup(group.id)
                                    }}
                                >
                                    <HugeiconsIcon
                                        icon={Delete02Icon}
                                        strokeWidth={2}
                                        className="h-3 w-3"
                                    />
                                </Button>
                            )}
                        </div>
                    ))}
                </TabsList>
                {groups.map((group) => (
                    <TabsContent key={group.id} value={group.id} className="mt-4">
                        {renderGroupFields(group)}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Mention Learners Section */}
            <div className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                        Mention Learners
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({mentionedLearners.length} mentioned)
                        </span>
                    </Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetLearnersCommandOpen(true)}
                        className="gap-2"
                    >
                        <HugeiconsIcon
                            icon={PlusSignIcon}
                            strokeWidth={2}
                            className="h-4 w-4"
                        />
                        Mention Learners
                    </Button>
                </div>

                {mentionedLearners.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
                        No learners mentioned yet. Click "Mention Learners" to add.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {mentionedLearners
                                .slice(
                                    (learnersPage - 1) * learnersItemsPerPage,
                                    learnersPage * learnersItemsPerPage
                                )
                                .map((learner) => (
                                    <div
                                        key={learner.id}
                                        className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 transition-colors hover:bg-muted/10"
                                    >
                                        <Avatar className="h-10 w-10 rounded-lg">
                                            <AvatarImage
                                                src={learner.avatar}
                                                alt={learner.name}
                                            />
                                            <AvatarFallback className="rounded-lg">
                                                {learner.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-medium">
                                                    {learner.name}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "h-4 px-1.5 py-0 text-[10px]",
                                                        statusColors[learner.status],
                                                        "bg-opacity-10"
                                                    )}
                                                >
                                                    {statusLabels[learner.status]}
                                                </Badge>
                                            </div>
                                            <div className="truncate text-xs text-muted-foreground">
                                                {learner.email}
                                            </div>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                {learner.department && (
                                                    <span>{learner.department}</span>
                                                )}
                                                {learner.department && learner.team && (
                                                    <span>•</span>
                                                )}
                                                {learner.team && <span>{learner.team}</span>}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => onRemoveLearner(learner.id)}
                                        >
                                            <HugeiconsIcon
                                                icon={Delete02Icon}
                                                strokeWidth={2}
                                                className="h-4 w-4"
                                            />
                                        </Button>
                                    </div>
                                ))}
                        </div>

                        {Math.ceil(mentionedLearners.length / learnersItemsPerPage) > 1 && (
                            <div className="mt-4 flex items-center justify-between gap-4">
                                <Field orientation="horizontal" className="w-fit">
                                    <FieldLabel
                                        htmlFor="select-learners-rows-per-page"
                                        className="text-sm whitespace-nowrap text-foreground"
                                    >
                                        Rows per page
                                    </FieldLabel>
                                    <Select
                                        value={learnersItemsPerPage.toString()}
                                        onValueChange={handleLearnersItemsPerPageChange}
                                    >
                                        <SelectTrigger
                                            className="w-15"
                                            id="select-learners-rows-per-page"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="start">
                                            <SelectGroup>
                                                <SelectItem value="6">6</SelectItem>
                                                <SelectItem value="12">12</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Pagination className="justify-end">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    if (learnersPage > 1) {
                                                        onSetLearnersPage(learnersPage - 1)
                                                    }
                                                }}
                                                className={
                                                    learnersPage === 1
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>
                                        {Array.from(
                                            {
                                                length: Math.ceil(
                                                    mentionedLearners.length / learnersItemsPerPage
                                                ),
                                            },
                                            (_, i) => i + 1
                                        ).map((page) => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        onSetLearnersPage(page)
                                                    }}
                                                    isActive={learnersPage === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    const totalPages = Math.ceil(
                                                        mentionedLearners.length / learnersItemsPerPage
                                                    )
                                                    if (learnersPage < totalPages) {
                                                        onSetLearnersPage(learnersPage + 1)
                                                    }
                                                }}
                                                className={
                                                    learnersPage ===
                                                        Math.ceil(
                                                            mentionedLearners.length / learnersItemsPerPage
                                                        )
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Learners Command Dialog with "See More" Button */}
            <CommandDialog
                open={learnersCommandOpen}
                onOpenChange={onSetLearnersCommandOpen}
            >
                <Command className="gap-3" shouldFilter={false}>
                    <CommandInput
                        placeholder="Search learners by name, email, department..."
                        value={searchQuery}
                        onValueChange={(value) => {
                            setSearchQuery(value)
                            // Reset visible count when searching to show results from beginning
                            setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {searchQuery && displayedLearners.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No learners found matching "{searchQuery}"
                                </div>
                            ) : availableLearners.length === 0 && !searchQuery ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    All learners have been mentioned
                                </div>
                            ) : null}
                        </CommandEmpty>
                        <CommandGroup className="gap-2">
                            {visibleLearners.map((learner) => (
                                <CommandItem
                                    key={learner.id}
                                    onSelect={() => {
                                        onAddLearner(learner)
                                        setVisibleLearnersCount(AVAILABLE_LEARNERS_PER_PAGE)
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={learner.avatar} alt={learner.name} />
                                        <AvatarFallback className=" rounded-lg">
                                            {learner.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {learner.name}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {learner.department} • {learner.team}
                                        </span>
                                    </div>
                                    <CommandShortcut>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                        >
                                            <HugeiconsIcon
                                                icon={PlusSignIcon}
                                                strokeWidth={2}
                                                className="h-4 w-4"
                                            />
                                        </Button>
                                    </CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {/* See More Button - Show when there are more learners to load */}
                        {hasMoreLearners && (
                            <div className="border-t p-3">
                                <div className="flex flex-col items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="default"
                                        onClick={handleSeeMore}
                                        className="w-full gap-2"
                                    >
                                        <span>See More</span>
                                        <HugeiconsIcon
                                            icon={ArrowDown01Icon}
                                            strokeWidth={2}
                                            className="h-4 w-4"
                                        />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Showing {visibleLearners.length} of {displayedLearners.length} learners
                                    </span>
                                </div>
                            </div>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </div>
    )
}