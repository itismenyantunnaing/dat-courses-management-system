"use client"

import React, { useEffect, useCallback, useRef } from "react"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Delete02Icon,
  Time02Icon,
  UserGroupIcon,
  Calendar03Icon,
  ArrowRight02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CourseGroup,
  CourseSession,
  MentionedLearner,
  DAYS_OF_WEEK,
} from "@/types/course"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"

const DEFAULT_SESSION_DAYS = [4, 5]

export const formatGroupsForAPI = (groups: CourseGroup[]) => {
  return groups
    .filter((group) => group.name && group.name.trim() !== "")
    .map((group) => ({
      group_name: group.name.trim(),
      capacity: group.capacity === undefined ? null : group.capacity,
      start_date: group.startDate?.toISOString().split("T")[0] || null,
      end_date: group.endDate?.toISOString().split("T")[0] || null,
      sessions_per_week: group.sessionsPerWeek || [],
      start_time: group.startTime,
      end_time: group.endTime,
      sessions: (group.sessions || []).map((session) => ({
        session_date: session.date?.toISOString().split("T")[0],
        start_time: session.startTime,
        end_time: session.endTime,
      })),
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
  defaultGroup: CourseGroup
  onDelete?: () => void
  isSubmitting?: boolean
  mode?: "add" | "edit"
  courseId?: number | string
  onAdminChangeGroup?: (
    enrollmentId: number,
    newGroupId: number
  ) => Promise<void>
  isChangingGroup?: boolean
  groupChangeError?: string | null
  groupChangeSuccess?: string | null
}

export const TrainerSection: React.FC<TrainerSectionProps> = ({
  groups,
  onUpdateGroups,
  groupErrors,
  onSetGroupErrors,
  activeGroupTab,
  onSetActiveGroupTab,
  trainerSessionPage,
  onSetTrainerSessionPage,
  trainerItemsPerPage,
  onSetTrainerItemsPerPage,
  courseId,
  onGroupAdded,
  onGroupRemoved,
}) => {
  const previousTotalSessionsRef = useRef<{ [key: string]: number }>({})
  const { enrollments } = mainStore()

  // Helper function to distribute capacity evenly
  const distributeCapacity = useCallback(
    (totalCapacity: number, numberOfGroups: number): number[] => {
      if (numberOfGroups === 0) return []
      const baseCapacity = Math.floor(totalCapacity / numberOfGroups)
      const remainder = totalCapacity % numberOfGroups
      return Array.from({ length: numberOfGroups }, (_, index) => {
        return index < remainder ? baseCapacity + 1 : baseCapacity
      })
    },
    []
  )

  // Calculate total enrolled employees for this specific course
  const getTotalEnrolledForCourse = useCallback(() => {
    if (!enrollments || enrollments.length === 0) return 0
    return enrollments.length
  }, [enrollments])

  // Get enrolled count for a specific group
  const getGroupEnrolledCount = useCallback(
    (groupId: string | number) => {
      if (!enrollments || enrollments.length === 0) return 0
      const numericGroupId =
        typeof groupId === "string"
          ? parseInt(groupId.replace("g", ""))
          : groupId
      return enrollments.filter(
        (e: any) =>
          e.courseGroupId === numericGroupId &&
          e.enrollmentStatus !== "CANCELLED"
      ).length
    },
    [enrollments]
  )

  // Initialize capacities based on total enrolled divided by number of groups
  useEffect(() => {
    if (groups.length === 0) return
    const totalEnrolled = getTotalEnrolledForCourse()
    const hasCapacity = groups.some(
      (g) => g.capacity !== undefined && g.capacity !== null
    )
    if (hasCapacity) return

    if (totalEnrolled === 0) {
      const hasAnyCapacity = groups.some((g) => g.capacity !== undefined)
      if (hasAnyCapacity) {
        const updatedGroups = groups.map((group) => ({
          ...group,
          capacity: undefined,
        }))
        onUpdateGroups(updatedGroups)
      }
      return
    }

    if (groups.length === 1) {
      const updatedGroups = groups.map((group) => ({
        ...group,
        capacity: undefined,
      }))
      onUpdateGroups(updatedGroups)
      return
    }

    const numberOfGroups = groups.length
    const baseCapacity = Math.floor(totalEnrolled / numberOfGroups)
    const remainder = totalEnrolled % numberOfGroups

    const getCapacityForGroup = (index: number) => {
      const extra = index < remainder ? 1 : 0
      return baseCapacity + extra
    }

    const updatedGroups = groups.map((group, index) => {
      const capacity = getCapacityForGroup(index)
      return { ...group, capacity }
    })

    onUpdateGroups(updatedGroups)
  }, [enrollments, groups.length, getTotalEnrolledForCourse, onUpdateGroups])

  const getNewActiveTabAfterRemoval = useCallback(
    (removedGroupId: string, remainingGroups: CourseGroup[]): string | null => {
      if (remainingGroups.length === 0) return null
      const removedIndex = groups.findIndex((g) => g.id === removedGroupId)
      if (removedIndex === -1) {
        return remainingGroups[0].id
      }
      if (removedIndex > 0) {
        const previousGroup = groups[removedIndex - 1]
        if (
          previousGroup &&
          remainingGroups.some((g) => g.id === previousGroup.id)
        ) {
          return previousGroup.id
        }
      }
      if (removedIndex < groups.length - 1) {
        const nextGroup = groups[removedIndex + 1]
        if (nextGroup && remainingGroups.some((g) => g.id === nextGroup.id)) {
          return nextGroup.id
        }
      }
      return remainingGroups[0].id
    },
    [groups]
  )

  const addGroup = useCallback(() => {
    const lastGroup = groups.length > 0 ? groups[groups.length - 1] : null
    const totalEnrolled = getTotalEnrolledForCourse()
    const newNumberOfGroups = groups.length + 1

    if (groups.length === 0) {
      const newGroup: CourseGroup = {
        id: `g${Date.now()}`,
        name: `Group 1`,
        capacity: undefined,
        startDate: new Date(),
        sessionsPerWeek: DEFAULT_SESSION_DAYS,
        startTime: "09:00",
        endTime: "10:00",
        sessions: [],
        registeredCount: 0,
        status: undefined,
        endDate: undefined,
      }
      onUpdateGroups([newGroup])
      onSetActiveGroupTab(newGroup.id)
      onSetTrainerSessionPage(1)
      // Call the callback with the new group
      if (onGroupAdded) {
        onGroupAdded(newGroup, [newGroup])
      }

      return
    }

    const copiedSessions =
      lastGroup?.sessions?.map((session) => ({
        ...session,
        id: `s${Date.now()}-${Math.random()}`,
      })) || []

    const copiedSessionsWithAdjustedDates =
      lastGroup?.startDate && lastGroup?.sessions?.length > 0
        ? copiedSessions.map((session) => session)
        : []

    if (!courseId) {
      const newGroup: CourseGroup = {
        id: `g${Date.now()}`,
        name: `Group ${groups.length + 1}`,
        capacity: undefined,
        startDate: lastGroup?.startDate
          ? new Date(lastGroup.startDate)
          : new Date(),
        sessionsPerWeek: lastGroup?.sessionsPerWeek
          ? [...lastGroup.sessionsPerWeek]
          : DEFAULT_SESSION_DAYS,
        startTime: lastGroup?.startTime ?? "09:00",
        endTime: lastGroup?.endTime ?? "10:00",
        sessions:
          copiedSessionsWithAdjustedDates.length > 0
            ? copiedSessionsWithAdjustedDates
            : lastGroup?.sessions?.map((session) => ({
                ...session,
                id: `s${Date.now()}-${Math.random()}`,
              })) || [],
        registeredCount: 0,
        status: lastGroup?.status,
        endDate: lastGroup?.endDate ? new Date(lastGroup.endDate) : undefined,
      }
      onUpdateGroups([...groups, newGroup])
      onSetActiveGroupTab(newGroup.id)
      onSetTrainerSessionPage(1)
      // Call the callback with the new group
      if (onGroupAdded) {
        onGroupAdded(newGroup, [...groups, newGroup])
      }
      return
    }

    const hasCapacity = groups.some(
      (g) => g.capacity !== undefined && g.capacity !== null
    )

    if (hasCapacity) {
      const totalCapacity = groups.reduce((sum, g) => {
        if (g.capacity !== undefined && g.capacity !== null) {
          return sum + g.capacity
        }
        return sum
      }, 0)

      if (totalCapacity === 0) {
        const existingGroupsWithNoCapacity = groups.map((group) => ({
          ...group,
          capacity: undefined,
        }))

        const newGroup: CourseGroup = {
          id: `g${Date.now()}`,
          name: `Group ${groups.length + 1}`,
          capacity: undefined,
          startDate: lastGroup?.startDate
            ? new Date(lastGroup.startDate)
            : new Date(),
          sessionsPerWeek: lastGroup?.sessionsPerWeek
            ? [...lastGroup.sessionsPerWeek]
            : DEFAULT_SESSION_DAYS,
          startTime: lastGroup?.startTime ?? "09:00",
          endTime: lastGroup?.endTime ?? "10:00",
          sessions:
            copiedSessionsWithAdjustedDates.length > 0
              ? copiedSessionsWithAdjustedDates
              : lastGroup?.sessions?.map((session) => ({
                  ...session,
                  id: `s${Date.now()}-${Math.random()}`,
                })) || [],
          registeredCount: 0,
          status: lastGroup?.status,
          endDate: lastGroup?.endDate ? new Date(lastGroup.endDate) : undefined,
        }

        onUpdateGroups([...existingGroupsWithNoCapacity, newGroup])
        onSetActiveGroupTab(newGroup.id)
        onSetTrainerSessionPage(1)
        return
      }

      const baseCapacity = Math.floor(totalCapacity / newNumberOfGroups)
      const remainder = totalCapacity % newNumberOfGroups

      const getCapacityForGroup = (index: number) => {
        const extra = index < remainder ? 1 : 0
        return baseCapacity + extra
      }

      const existingGroupsWithCapacity = groups.map((group, index) => {
        const capacity = getCapacityForGroup(index)
        return { ...group, capacity }
      })

      const newGroup: CourseGroup = {
        id: `g${Date.now()}`,
        name: `Group ${groups.length + 1}`,
        capacity: getCapacityForGroup(groups.length),
        startDate: lastGroup?.startDate
          ? new Date(lastGroup.startDate)
          : new Date(),
        sessionsPerWeek: lastGroup?.sessionsPerWeek
          ? [...lastGroup.sessionsPerWeek]
          : DEFAULT_SESSION_DAYS,
        startTime: lastGroup?.startTime ?? "09:00",
        endTime: lastGroup?.endTime ?? "10:00",
        sessions:
          copiedSessionsWithAdjustedDates.length > 0
            ? copiedSessionsWithAdjustedDates
            : lastGroup?.sessions?.map((session) => ({
                ...session,
                id: `s${Date.now()}-${Math.random()}`,
              })) || [],
        registeredCount: 0,
        status: lastGroup?.status,
        endDate: lastGroup?.endDate ? new Date(lastGroup.endDate) : undefined,
      }

      onUpdateGroups([...existingGroupsWithCapacity, newGroup])
      onSetActiveGroupTab(newGroup.id)
      onSetTrainerSessionPage(1)
      return
    }

    if (totalEnrolled === 0) {
      const existingGroupsWithNoCapacity = groups.map((group) => ({
        ...group,
        capacity: undefined,
      }))

      const newGroup: CourseGroup = {
        id: `g${Date.now()}`,
        name: `Group ${groups.length + 1}`,
        capacity: undefined,
        startDate: lastGroup?.startDate
          ? new Date(lastGroup.startDate)
          : new Date(),
        sessionsPerWeek: lastGroup?.sessionsPerWeek
          ? [...lastGroup.sessionsPerWeek]
          : DEFAULT_SESSION_DAYS,
        startTime: lastGroup?.startTime ?? "09:00",
        endTime: lastGroup?.endTime ?? "10:00",
        sessions:
          copiedSessionsWithAdjustedDates.length > 0
            ? copiedSessionsWithAdjustedDates
            : lastGroup?.sessions?.map((session) => ({
                ...session,
                id: `s${Date.now()}-${Math.random()}`,
              })) || [],
        registeredCount: 0,
        status: lastGroup?.status,
        endDate: lastGroup?.endDate ? new Date(lastGroup.endDate) : undefined,
      }

      onUpdateGroups([...existingGroupsWithNoCapacity, newGroup])
      onSetActiveGroupTab(newGroup.id)
      onSetTrainerSessionPage(1)
      return
    }

    const baseCapacity = Math.floor(totalEnrolled / newNumberOfGroups)
    const remainder = totalEnrolled % newNumberOfGroups

    const getCapacityForGroup = (index: number) => {
      const extra = index < remainder ? 1 : 0
      return baseCapacity + extra
    }

    const existingGroupsWithCapacity = groups.map((group, index) => {
      const capacity = getCapacityForGroup(index)
      return { ...group, capacity }
    })

    const newGroup: CourseGroup = {
      id: `g${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      capacity: getCapacityForGroup(groups.length),
      startDate: lastGroup?.startDate
        ? new Date(lastGroup.startDate)
        : new Date(),
      sessionsPerWeek: lastGroup?.sessionsPerWeek
        ? [...lastGroup.sessionsPerWeek]
        : DEFAULT_SESSION_DAYS,
      startTime: lastGroup?.startTime ?? "09:00",
      endTime: lastGroup?.endTime ?? "10:00",
      sessions:
        copiedSessionsWithAdjustedDates.length > 0
          ? copiedSessionsWithAdjustedDates
          : lastGroup?.sessions?.map((session) => ({
              ...session,
              id: `s${Date.now()}-${Math.random()}`,
            })) || [],
      registeredCount: 0,
      status: lastGroup?.status,
      endDate: lastGroup?.endDate ? new Date(lastGroup.endDate) : undefined,
    }

    onUpdateGroups([...existingGroupsWithCapacity, newGroup])
    onSetActiveGroupTab(newGroup.id)
    onSetTrainerSessionPage(1)
    // Call the callback with the new group
    if (onGroupAdded) {
      onGroupAdded(newGroup, [...existingGroupsWithCapacity, newGroup])
    }
  }, [
    groups,
    courseId,
    getTotalEnrolledForCourse,
    onUpdateGroups,
    onSetActiveGroupTab,
    onSetTrainerSessionPage,
  ])

  const removeGroup = useCallback(
    (groupId: string) => {
      if (groups.length <= 1) return

      const totalCapacity = groups.reduce((sum, g) => {
        if (g.capacity !== undefined && g.capacity !== null) {
          return sum + g.capacity
        }
        return sum
      }, 0)

      if (totalCapacity === 0) {
        const updatedGroups = groups.filter((g) => g.id !== groupId)
        onUpdateGroups(updatedGroups)
        if (activeGroupTab === groupId) {
          const newActiveTab = getNewActiveTabAfterRemoval(
            groupId,
            updatedGroups
          )
          if (newActiveTab) {
            onSetActiveGroupTab(newActiveTab)
          }
        }
        // Call the callback after removal
        if (onGroupRemoved) {
          onGroupRemoved(groupId, updatedGroups)
        }
        return
      }

      const updatedGroups = groups.filter((g) => g.id !== groupId)
      const numberOfRemainingGroups = updatedGroups.length

      if (numberOfRemainingGroups === 1) {
        const finalGroups = updatedGroups.map((group) => ({
          ...group,
          capacity: undefined,
        }))
        onUpdateGroups(finalGroups)
        if (activeGroupTab === groupId) {
          const newActiveTab = getNewActiveTabAfterRemoval(groupId, finalGroups)
          if (newActiveTab) {
            onSetActiveGroupTab(newActiveTab)
          }
        }
        return
      }

      const baseCapacity = Math.floor(totalCapacity / numberOfRemainingGroups)
      const remainder = totalCapacity % numberOfRemainingGroups

      const getCapacityForGroup = (index: number) => {
        const extra = index < remainder ? 1 : 0
        return baseCapacity + extra
      }

      const recalculatedGroups = updatedGroups.map((group, index) => {
        const newCapacity = getCapacityForGroup(index)
        return { ...group, capacity: newCapacity }
      })

      onUpdateGroups(recalculatedGroups)

      if (activeGroupTab === groupId) {
        const newActiveTab = getNewActiveTabAfterRemoval(
          groupId,
          recalculatedGroups
        )
        if (newActiveTab) {
          onSetActiveGroupTab(newActiveTab)
        }
      }
      // Call the callback after removal
      if (onGroupRemoved) {
        onGroupRemoved(groupId, recalculatedGroups)
      }
    },
    [groups, activeGroupTab, onUpdateGroups, onSetActiveGroupTab]
  )

  const updateGroup = useCallback(
    (groupId: string, field: string, value: any) => {
      let updatedGroups = groups.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group
      )

      if (field === "startTime" || field === "endTime") {
        const group = updatedGroups.find((g) => g.id === groupId)
        if (group && group.sessions.length > 0) {
          const updatedSessions = group.sessions.map((session) => ({
            ...session,
            startTime: field === "startTime" ? value : session.startTime,
            endTime: field === "endTime" ? value : session.endTime,
          }))
          updatedGroups = updatedGroups.map((g) =>
            g.id === groupId ? { ...g, sessions: updatedSessions } : g
          )
        }
        onUpdateGroups(updatedGroups)
        return
      }

      if (field === "sessionsPerWeek") {
        const group = updatedGroups.find((g) => g.id === groupId)
        if (group && group.sessions.length > 0) {
          const startDate = group.startDate || new Date()
          const sessionDays = group.sessionsPerWeek || DEFAULT_SESSION_DAYS
          const sortedDays = [...sessionDays].sort((a, b) => a - b)
          const startTime = group.startTime || "09:00"
          const endTime = group.endTime || "10:00"

          const newSessions: CourseSession[] = []
          const currentDate = new Date(startDate)
          let sessionCount = 0
          const totalSessions = group.sessions.length

          while (sessionCount < totalSessions) {
            const dayOfWeek = currentDate.getDay()
            if (sortedDays.includes(dayOfWeek)) {
              if (group.endDate && currentDate > group.endDate) break
              const originalSession = group.sessions[sessionCount]
              newSessions.push({
                id: originalSession?.id || `s${Date.now()}-${sessionCount}`,
                date: new Date(currentDate),
                startTime: startTime,
                endTime: endTime,
                status: originalSession?.status || "PLANNED",
              })
              sessionCount++
            }
            currentDate.setDate(currentDate.getDate() + 1)
          }

          updatedGroups = updatedGroups.map((g) =>
            g.id === groupId ? { ...g, sessions: newSessions } : g
          )
          onUpdateGroups(updatedGroups)
          onSetTrainerSessionPage(1)
          return
        }
      }

      onUpdateGroups(updatedGroups)
    },
    [groups, onUpdateGroups, onSetTrainerSessionPage]
  )

  const updateGroupSession = useCallback(
    (groupId: string, sessionId: string, field: string, value: any) => {
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

      if (field === "startTime" || field === "endTime") {
        const group = updatedGroups.find((g) => g.id === groupId)
        if (group && group.sessions.length > 0) {
          const allSameStartTime = group.sessions.every(
            (s) => s.startTime === group.sessions[0].startTime
          )
          const allSameEndTime = group.sessions.every(
            (s) => s.endTime === group.sessions[0].endTime
          )

          if (allSameStartTime && field === "startTime") {
            const updatedWithGroupTime = updatedGroups.map((g) =>
              g.id === groupId ? { ...g, startTime: value } : g
            )
            onUpdateGroups(updatedWithGroupTime)
            return
          }
          if (allSameEndTime && field === "endTime") {
            const updatedWithGroupTime = updatedGroups.map((g) =>
              g.id === groupId ? { ...g, endTime: value } : g
            )
            onUpdateGroups(updatedWithGroupTime)
            return
          }
        }
      }

      onUpdateGroups(updatedGroups)
    },
    [groups, onUpdateGroups]
  )

  const addGroupSession = useCallback(
    (groupId: string) => {
      const group = groups.find((g) => g.id === groupId)
      if (!group) return

      let lastDate: Date
      if (group.sessions.length > 0) {
        const lastSession = group.sessions[group.sessions.length - 1]
        lastDate = lastSession.date || group.startDate || new Date()
      } else {
        lastDate = group.startDate || new Date()
      }

      const sessionDays = group.sessionsPerWeek || DEFAULT_SESSION_DAYS
      const sortedDays = [...sessionDays].sort((a, b) => a - b)

      let nextDate = new Date(lastDate)
      let foundNextDay = false
      let attempts = 0
      const maxAttempts = 30

      while (!foundNextDay && attempts < maxAttempts) {
        nextDate.setDate(nextDate.getDate() + 1)
        const dayOfWeek = nextDate.getDay()
        if (sortedDays.includes(dayOfWeek)) {
          foundNextDay = true
          break
        }
        attempts++
      }

      if (!foundNextDay) {
        nextDate = new Date(lastDate)
        nextDate.setDate(nextDate.getDate() + 1)
      }

      if (group.endDate && nextDate > group.endDate) {
        alert("Cannot add session: would exceed the group end date")
        return
      }

      const newSession: CourseSession = {
        id: `s${Date.now()}`,
        date: nextDate,
        startTime: group.startTime || "09:00",
        endTime: group.endTime || "10:00",
        status: "PLANNED",
      }

      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, sessions: [...g.sessions, newSession] } : g
      )
      onUpdateGroups(updatedGroups)
      const totalPages = Math.ceil(
        (updatedGroups.find((g) => g.id === groupId)?.sessions.length || 0) /
          trainerItemsPerPage
      )
      onSetTrainerSessionPage(totalPages > 0 ? totalPages : 1)
    },
    [groups, trainerItemsPerPage, onUpdateGroups, onSetTrainerSessionPage]
  )

  const removeGroupSession = useCallback(
    (groupId: string, sessionId: string) => {
      const updatedGroups = groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              sessions: group.sessions.filter((s) => s.id !== sessionId),
            }
          : group
      )
      onUpdateGroups(updatedGroups)
    },
    [groups, onUpdateGroups]
  )

  const handleGroupDayToggle = useCallback(
    (groupId: string, day: number) => {
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
    },
    [groups, updateGroup]
  )

  const handleStartDateChange = useCallback(
    (groupId: string, date: Date | undefined) => {
      if (!date) return
      const group = groups.find((g) => g.id === groupId)
      if (!group) return

      if (group.sessions.length > 0) {
        const firstSessionDate = group.sessions[0].date
        if (firstSessionDate && date > firstSessionDate) {
          if (
            window.confirm(
              "Some existing sessions are before the new start date. They will be removed. Continue?"
            )
          ) {
            const filteredSessions = group.sessions.filter(
              (s) => s.date && s.date >= date
            )
            const updatedGroups = groups.map((g) =>
              g.id === groupId
                ? { ...g, startDate: date, sessions: filteredSessions }
                : g
            )
            onUpdateGroups(updatedGroups)
            return
          }
          return
        }
      }

      const updatedGroups = groups.map((g) =>
        g.id === groupId ? { ...g, startDate: date } : g
      )
      onUpdateGroups(updatedGroups)
    },
    [groups, onUpdateGroups]
  )

  const handleGroupSessionDateChange = useCallback(
    (groupId: string, sessionId: string, date: Date | undefined) => {
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

      if (group.startDate && date < group.startDate) {
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
    },
    [groups, groupErrors, onSetGroupErrors, updateGroupSession]
  )

  const handleTrainerItemsPerPageChange = useCallback(
    (value: string) => {
      const newItemsPerPage = parseInt(value)
      onSetTrainerItemsPerPage(newItemsPerPage)
      onSetTrainerSessionPage(1)
    },
    [onSetTrainerItemsPerPage, onSetTrainerSessionPage]
  )

  const lastUpdateRef = useRef<string>("")

  useEffect(() => {
    const updatedGroups = groups.map((group) => {
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

        const currentDate = new Date(startDate)
        let sessionCount = 0

        while (sessionCount < totalSessions) {
          const dayOfWeek = currentDate.getDay()

          if (sortedDays.includes(dayOfWeek)) {
            if (group.endDate && currentDate > group.endDate) {
              break
            }
            const existingSession = group.sessions[sessionCount]
            newSessions.push({
              id: existingSession?.id || `s${Date.now()}-${sessionCount}`,
              date: new Date(currentDate),
              startTime: existingSession?.startTime || startTime,
              endTime: existingSession?.endTime || endTime,
              status: existingSession?.status || "PLANNED",
            })
            sessionCount++
          }

          currentDate.setDate(currentDate.getDate() + 1)
        }

        return { ...group, sessions: newSessions }
      }
      return group
    })

    const updateSignature = JSON.stringify(
      updatedGroups.map((g) => ({
        id: g.id,
        sessionCount: g.sessions.length,
        startDate: g.startDate?.getTime(),
        endDate: g.endDate?.getTime(),
        days: g.sessionsPerWeek,
        start: g.startTime,
        end: g.endTime,
      }))
    )

    if (lastUpdateRef.current !== updateSignature) {
      lastUpdateRef.current = updateSignature
      onUpdateGroups(updatedGroups)
    }
  }, [groups, onUpdateGroups])

  const renderGroupFields = useCallback(
    (group: CourseGroup) => {
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
              <Label>
                Capacity
                {groups.length > 1 && (
                  <>
                    <span className="text-red-500">*</span>
                  </>
                )}
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    value={
                      group.capacity !== undefined && group.capacity !== null
                        ? group.capacity
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : undefined

                      // Get current enrolled count for this group
                      const enrolledCount = getGroupEnrolledCount(group.id)

                      if (value !== undefined && value > 0) {
                        //  Check if capacity is less than enrolled count
                        if (value < enrolledCount) {
                          // Revert to previous valid value or show error
                          return
                        }

                        // Clear any previous errors for this group
                        const newErrors = { ...groupErrors }
                        delete newErrors[group.id]
                        onSetGroupErrors(newErrors)

                        const updatedGroups = groups.map((g) =>
                          g.id === group.id ? { ...g, capacity: value } : g
                        )
                        const totalCapacity =
                          value +
                          groups
                            .filter(
                              (g) =>
                                g.id !== group.id &&
                                g.capacity !== undefined &&
                                g.capacity !== null
                            )
                            .reduce((sum, g) => sum + (g.capacity || 0), 0)

                        const otherGroups = updatedGroups.filter(
                          (g) =>
                            g.id !== group.id &&
                            g.capacity !== undefined &&
                            g.capacity !== null
                        )
                        if (otherGroups.length > 0) {
                          const remainingCapacity = totalCapacity - value
                          const newCapacities = distributeCapacity(
                            remainingCapacity,
                            otherGroups.length
                          )
                          const finalGroups = updatedGroups.map((g) => {
                            if (g.id === group.id)
                              return { ...g, capacity: value }
                            if (
                              g.capacity !== undefined &&
                              g.capacity !== null
                            ) {
                              const index = otherGroups.findIndex(
                                (og) => og.id === g.id
                              )
                              return {
                                ...g,
                                capacity: newCapacities[index] || 0,
                              }
                            }
                            return g
                          })
                          onUpdateGroups(finalGroups)
                        } else {
                          onUpdateGroups(updatedGroups)
                        }
                      } else {
                        // Only allow undefined if there's only one group OR enrolled count is 0
                        if (groups.length === 1 || enrolledCount === 0) {
                          updateGroup(group.id, "capacity", undefined)
                        }
                      }
                    }}
                    placeholder={
                      groups.length > 1 ? "Enter capacity" : "Optional"
                    }
                    min={1}
                    required={groups.length > 1}
                    className={cn(
                      groups.length > 1 &&
                        (group.capacity === undefined ||
                          group.capacity === null)
                        ? "border-destructive"
                        : "",
                      groupErrors[group.id] ? "border-destructive" : ""
                    )}
                  />
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Switch
                    checked={
                      group.capacity === undefined && groups.length === 1
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateGroup(group.id, "capacity", undefined)
                      } else {
                        const totalEnrolled = getTotalEnrolledForCourse()
                        const defaultCap = Math.max(
                          Math.floor(totalEnrolled / groups.length) + 2,
                          5
                        )
                        updateGroup(group.id, "capacity", defaultCap)
                      }
                    }}
                    disabled={groups.length !== 1}
                  />
                  <Label className="cursor-pointer text-sm">Unlimited</Label>
                </div>
              </div>
            </div>
          </div>

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
                      handleStartDateChange(group.id, date || undefined)
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
                <Input
                  type="time"
                  value={group.startTime || ""}
                  onChange={(e) => {
                    updateGroup(group.id, "startTime", e.target.value)
                  }}
                  className="cursor-pointer appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
                <HugeiconsIcon
                  icon={Time02Icon}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                End Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  value={group.endTime || ""}
                  onChange={(e) => {
                    updateGroup(group.id, "endTime", e.target.value)
                  }}
                  className="bg-background [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
                <HugeiconsIcon
                  icon={Time02Icon}
                  strokeWidth={1.5}
                  className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Sessions Per Week <span className="text-red-500">*</span>
                </Label>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 px-3"
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
                  className="h-8 flex-1 px-3"
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
                  className="h-8 flex-1 px-3"
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
                      "h-8 flex-1 px-3",
                      group.sessionsPerWeek?.includes(day.value) &&
                        "bg-primary text-primary-foreground hover:bg-primary/85 hover:text-white"
                    )}
                    onClick={() => handleGroupDayToggle(group.id, day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
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

                  const existingSessions = group.sessions || []

                  while (sessionCount < value) {
                    const dayOfWeek = currentDate.getDay()
                    if (sortedDays.includes(dayOfWeek)) {
                      if (group.endDate && currentDate > group.endDate) break
                      const existingSession = existingSessions[sessionCount]
                      newSessions.push({
                        id:
                          existingSession?.id ||
                          `s${Date.now()}-${sessionCount}`,
                        date: new Date(currentDate),
                        startTime: existingSession?.startTime || startTime,
                        endTime: existingSession?.endTime || endTime,
                        status: existingSession?.status || "PLANNED",
                      })
                      sessionCount++
                    }
                    currentDate.setDate(currentDate.getDate() + 1)
                  }

                  lastUpdateRef.current = ""
                  updateGroup(group.id, "sessions", newSessions)
                  onSetTrainerSessionPage(1)
                }}
                placeholder="Enter total number of sessions"
                min={1}
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
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
                No sessions added yet. Enter &quot;Total Sessions&quot; above or
                click &quot;Add Session&quot; to create one.
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
                                className="flex-1 text-left font-normal"
                              >
                                {session.date ? (
                                  format(session.date, "MMM d, yyyy")
                                ) : (
                                  <span className="text-muted-foreground">
                                    Pick date
                                  </span>
                                )}
                                <HugeiconsIcon
                                  icon={Calendar03Icon}
                                  strokeWidth={1.5}
                                  className="ml-auto h-3 w-3 text-muted-foreground"
                                />
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
                              className="h-7 cursor-pointer appearance-none bg-background text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                            <HugeiconsIcon
                              icon={Time02Icon}
                              strokeWidth={1.5}
                              className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                            />
                          </div>
                          <span className="text-muted-foreground">
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              strokeWidth={2}
                              className="h-4 w-4"
                            />
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
                              className="h-7 cursor-pointer appearance-none bg-background text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                            <HugeiconsIcon
                              icon={Time02Icon}
                              strokeWidth={1.5}
                              className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
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
                              if (trainerSessionPage > 1)
                                onSetTrainerSessionPage(trainerSessionPage - 1)
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
                              if (trainerSessionPage < totalTrainerPages)
                                onSetTrainerSessionPage(trainerSessionPage + 1)
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
    },
    [
      groupErrors,
      groups,
      trainerItemsPerPage,
      trainerSessionPage,
      updateGroup,
      distributeCapacity,
      getTotalEnrolledForCourse,
      onUpdateGroups,
      handleStartDateChange,
      handleGroupDayToggle,
      handleGroupSessionDateChange,
      addGroupSession,
      removeGroupSession,
      handleTrainerItemsPerPageChange,
      onSetTrainerSessionPage,
      updateGroupSession,
    ]
  )

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
            <div key={group.id} className="relative inline-flex items-center">
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
    </div>
  )
}
