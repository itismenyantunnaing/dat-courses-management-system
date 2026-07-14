"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlusSignIcon,
  Delete02Icon,
  Link02Icon,
  User02Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { format, addDays } from "date-fns"
import { CourseSession } from "@/types/course"
import { isJLPTType } from "@/types/course"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mainStore } from "@/store/mainStore"

export const formatSelfStudySessionsForAPI = (sessions: CourseSession[], isJLPT: boolean) => {
  return sessions.map((session, index) => ({
    session_no: index + 1,
    duration_per_session: session.durationPerSession || 7,
    session_date: session.date?.toISOString().split('T')[0] || null,
    link: isJLPT ? null : (session.link || null),
    kanji_target: isJLPT ? (session.kanjiCount || 0) : 0,
    vocabulary_target: isJLPT ? (session.vocabularyCount || 0) : 0,
    grammar_target: isJLPT ? (session.grammarCount || 0) : 0,
    reading_target_minutes: isJLPT ? (session.readingMinutes || 0) : 0,
    listening_target_minutes: isJLPT ? (session.listeningMinutes || 0) : 0,
    study_time_target_minutes: session.studyTimeTargetMinutes || 0,
    session_status: session.status || 'PLANNED'
  }));
};

// Status colors and labels for enrolled employees
const statusColors: Record<string, string> = {
  APPROVED: "bg-green-500",
  PENDING: "bg-yellow-500",
  CANCELLED: "bg-gray-500",
  COMPLETED: "bg-blue-500",
}

const statusLabels: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
}

interface EnrolledEmployee {
  id: number
  employeeId: string
  employeeName: string
  email: string
  departmentId: number
  departmentName: string
  teamId: number
  teamName: string
  position: string
  courseGroupId: number
  courseGroupName: string
  enrollmentStatus: string
  enrolledAt: string
  pfImage?: string
}

interface SelfStudySectionProps {
  sessions: CourseSession[]
  selfStudyType: string
  totalKanji: number
  totalVocabulary: number
  totalGrammar: number
  totalReadingMinutes: number
  totalListeningMinutes: number
  onUpdateSessions: (sessions: CourseSession[]) => void
  onUpdateSelfStudyType: (type: string) => void
  onUpdateTotals: (totals: {
    totalKanji: number
    totalVocabulary: number
    totalGrammar: number
    totalReadingMinutes: number
    totalListeningMinutes: number
  }) => void
  sessionPage: number
  onSetSessionPage: (page: number) => void
  itemsPerPage: number
  onSetItemsPerPage: (items: number) => void
  selfStudyBaseDate: Date | null
  onSetSelfStudyBaseDate: (date: Date | null) => void
  courseId?: number | string
  mode?: "add" | "edit"
  mainDurationPerSession?: number
  onUpdateMainDurationPerSession?: (duration: number) => void
}

export const Self_Study_Section: React.FC<SelfStudySectionProps> = ({
  sessions,
  selfStudyType,
  totalKanji,
  totalVocabulary,
  totalGrammar,
  totalReadingMinutes,
  totalListeningMinutes,
  onUpdateSessions,
  onUpdateSelfStudyType,
  onUpdateTotals,
  sessionPage,
  onSetSessionPage,
  itemsPerPage,
  onSetItemsPerPage,
  selfStudyBaseDate,
  onSetSelfStudyBaseDate,
  courseId,
  mode = "add",
  mainDurationPerSession = 7,
  onUpdateMainDurationPerSession,
}) => {
  const isJLPT = isJLPTType(selfStudyType)
  const { enrollments } = mainStore()

  // Add this useEffect for non-JLPT total updates
  useEffect(() => {
    if (sessions.length > 0 && !isJLPT) {
      // For non-JLPT, we just need to ensure dates are correct
      const sessionsWithDates = recalculateSessionDates(sessions)

      const updateSignature = JSON.stringify({
        sessionsLength: sessions.length,
        isJLPT,
        baseDate: (selfStudyBaseDate || sessions[0]?.date || new Date()).getTime(),
        durations: sessions.map(s => s.durationPerSession || 7).join(','),
        type: 'non-jlpt-dates'
      })

      if (lastUpdateRef.current !== updateSignature) {
        lastUpdateRef.current = updateSignature
        onUpdateSessions(sessionsWithDates)
      }
    }
  }, [sessions.map(s => s.durationPerSession).join(','), selfStudyBaseDate, isJLPT, onUpdateSessions])

  // Get enrolled employees for this course from store
  const enrolledEmployees = React.useMemo(() => {
    if (mode === "add" || !courseId) return []
    if (!enrollments || enrollments.length === 0) return []
    return enrollments
  }, [enrollments, courseId, mode])

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "??"
    const parts = name.split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    onSetItemsPerPage(newItemsPerPage)
    onSetSessionPage(1)
  }

  const addSelfStudySession = () => {
    const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()
    const newIndex = sessions.length
    const defaultDuration = mainDurationPerSession || 7

    // Calculate cumulative days from all previous sessions
    let cumulativeDays = 0
    for (let i = 0; i < sessions.length; i++) {
      cumulativeDays += sessions[i]?.durationPerSession || mainDurationPerSession || 7
    }

    const newSession: CourseSession = {
      id: `s${Date.now()}`,
      sessionNo: sessions.length + 1,
      date: addDays(baseDate, cumulativeDays),
      durationPerSession: defaultDuration,
      kanjiCount: isJLPT ? 0 : undefined,
      vocabularyCount: isJLPT ? 0 : undefined,
      grammarCount: isJLPT ? 0 : undefined,
      readingMinutes: isJLPT ? 0 : undefined,
      listeningMinutes: isJLPT ? 0 : undefined,
      link: !isJLPT ? "" : undefined,
      status: 'PLANNED'
    }

    lastUpdateRef.current = ""
    onUpdateSessions([...sessions, newSession])
    const totalPages = Math.ceil((sessions.length + 1) / itemsPerPage)
    onSetSessionPage(totalPages)
  }

  const removeSelfStudySession = (sessionId: string) => {
    onUpdateSessions(sessions.filter((s) => s.id !== sessionId))
  }

  const updateSelfStudySession = (
    sessionId: string,
    field: string,
    value: any
  ) => {
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)

    if (field === "date" && sessionIndex === 0) {
      onSetSelfStudyBaseDate(value)
    }

    // If updating duration, recalculate all dates
    let updatedSessions = sessions.map((s) =>
      s.id === sessionId ? { ...s, [field]: value } : s
    )

    if (field === "durationPerSession") {
      // Recalculate all dates based on new duration
      const sessionsWithRecalculatedDates = recalculateSessionDates(updatedSessions)
      updatedSessions = sessionsWithRecalculatedDates
    }

    onUpdateSessions(updatedSessions)
  }

  // Helper function to recalculate all session dates based on cumulative durations
  const recalculateSessionDates = (sessionsList: CourseSession[]): CourseSession[] => {
    const baseDate = selfStudyBaseDate || sessionsList[0]?.date || new Date()
    let cumulativeDays = 0

    return sessionsList.map((session, index) => {
      if (index === 0) {
        return {
          ...session,
          date: baseDate,
          durationPerSession: session.durationPerSession || mainDurationPerSession || 7
        }
      } else {
        // Calculate cumulative days from previous sessions
        cumulativeDays = 0
        for (let i = 0; i < index; i++) {
          cumulativeDays += sessionsList[i]?.durationPerSession || mainDurationPerSession || 7
        }
        return {
          ...session,
          date: addDays(baseDate, cumulativeDays),
          durationPerSession: session.durationPerSession || mainDurationPerSession || 7
        }
      }
    })
  }

  const lastUpdateRef = React.useRef<string>("")

  // Auto-calculate self-study session values from totals
  useEffect(() => {
    if (sessions.length > 0 && isJLPT) {
      const sessionCount = sessions.length

      const avgKanji = Math.floor((totalKanji || 0) / sessionCount)
      const avgVocab = Math.floor((totalVocabulary || 0) / sessionCount)
      const avgGrammar = Math.floor((totalGrammar || 0) / sessionCount)
      const avgReading = Math.floor((totalReadingMinutes || 0) / sessionCount)
      const avgListening = Math.floor((totalListeningMinutes || 0) / sessionCount)

      const extraKanji = (totalKanji || 0) % sessionCount
      const extraVocab = (totalVocabulary || 0) % sessionCount
      const extraGrammar = (totalGrammar || 0) % sessionCount
      const extraReading = (totalReadingMinutes || 0) % sessionCount
      const extraListening = (totalListeningMinutes || 0) % sessionCount

      // First, recalculate dates based on current durations
      const sessionsWithDates = recalculateSessionDates(sessions)

      const updatedSessions = sessionsWithDates.map((session, index) => ({
        ...session,
        kanjiCount: avgKanji + (index < extraKanji ? 1 : 0),
        vocabularyCount: avgVocab + (index < extraVocab ? 1 : 0),
        grammarCount: avgGrammar + (index < extraGrammar ? 1 : 0),
        readingMinutes: avgReading + (index < extraReading ? 1 : 0),
        listeningMinutes: avgListening + (index < extraListening ? 1 : 0),
      }))

      const updateSignature = JSON.stringify({
        totalKanji,
        totalVocabulary,
        totalGrammar,
        totalReadingMinutes,
        totalListeningMinutes,
        sessionsLength: sessions.length,
        isJLPT,
        baseDate: (selfStudyBaseDate || sessions[0]?.date || new Date()).getTime(),
        durations: sessions.map(s => s.durationPerSession || mainDurationPerSession || 7).join(',')
      })

      if (lastUpdateRef.current !== updateSignature) {
        lastUpdateRef.current = updateSignature
        onUpdateSessions(updatedSessions)
      }
    }
  }, [totalKanji, totalVocabulary, totalGrammar, totalReadingMinutes, totalListeningMinutes, sessions.length, isJLPT, selfStudyBaseDate, onUpdateSessions, mainDurationPerSession])

  // Update dates for non-JLPT self-study when duration changes
  useEffect(() => {
    if (sessions.length > 0 && !isJLPT) {
      const sessionsWithDates = recalculateSessionDates(sessions)

      const updateSignature = JSON.stringify({
        sessionsLength: sessions.length,
        isJLPT,
        baseDate: (selfStudyBaseDate || sessions[0]?.date || new Date()).getTime(),
        durations: sessions.map(s => s.durationPerSession || mainDurationPerSession || 7).join(','),
        type: 'non-jlpt-dates'
      })

      if (lastUpdateRef.current !== updateSignature) {
        lastUpdateRef.current = updateSignature
        onUpdateSessions(sessionsWithDates)
      }
    }
  }, [sessions.length, selfStudyBaseDate, isJLPT, onUpdateSessions, mainDurationPerSession])

  const totalSessionPages = Math.ceil(sessions.length / itemsPerPage)
  const paginatedSessions = sessions.slice(
    (sessionPage - 1) * itemsPerPage,
    sessionPage * itemsPerPage
  )

  const goToSessionPage = (page: number) => {
    if (page >= 1 && page <= totalSessionPages) {
      onSetSessionPage(page)
    }
  }

  return (
    <>
      {/* JLPT fields - show when selfStudyType is "jlpt" */}
      {isJLPT && (
        <>
          {/* Total Kanji, Vocabulary, Grammar */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Total Kanji</Label>
              <Input
                type="number"
                value={totalKanji ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji: parseInt(e.target.value) || 0,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total kanji"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Vocabulary</Label>
              <Input
                type="number"
                value={totalVocabulary ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary: parseInt(e.target.value) || 0,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total vocabulary"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Grammar</Label>
              <Input
                type="number"
                value={totalGrammar ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar: parseInt(e.target.value) || 0,
                      totalReadingMinutes,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total grammar"
                min={0}
              />
            </div>
          </div>

          {/* Total Reading & Listening */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Total Reading (minutes)</Label>
              <Input
                type="number"
                value={totalReadingMinutes ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes: parseInt(e.target.value) || 0,
                      totalListeningMinutes,
                    },
                  })
                }
                placeholder="Total reading minutes"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Listening (minutes)</Label>
              <Input
                type="number"
                value={totalListeningMinutes ?? ""}
                onChange={(e) =>
                  onUpdateTotals({
                    ...{
                      totalKanji,
                      totalVocabulary,
                      totalGrammar,
                      totalReadingMinutes,
                      totalListeningMinutes: parseInt(e.target.value) || 0,
                    },
                  })
                }
                placeholder="Total listening minutes"
                min={0}
              />
            </div>
          </div>
        </>
      )}

      {/* Total Sessions & Duration Per Session - Side by Side */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Total Sessions */}
        <div className="space-y-2">
          <Label>
            Total Sessions <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={sessions.length || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              const baseDate = selfStudyBaseDate || sessions[0]?.date || new Date()

              const currentSessions = sessions || []

              const newSessions: CourseSession[] = Array.from(
                { length: value },
                (_, i) => {
                  let cumulativeDays = 0
                  for (let j = 0; j < i; j++) {
                    cumulativeDays += (currentSessions[j]?.durationPerSession || mainDurationPerSession || 7)
                  }

                  const existingSession = currentSessions[i]

                  return {
                    id: existingSession?.id || `s${Date.now()}-${i}`,
                    date: addDays(baseDate, cumulativeDays),
                    durationPerSession: existingSession?.durationPerSession || mainDurationPerSession || 7,
                    kanjiCount: isJLPT ? (existingSession?.kanjiCount || 0) : undefined,
                    vocabularyCount: isJLPT ? (existingSession?.vocabularyCount || 0) : undefined,
                    grammarCount: isJLPT ? (existingSession?.grammarCount || 0) : undefined,
                    readingMinutes: isJLPT ? (existingSession?.readingMinutes || 0) : undefined,
                    listeningMinutes: isJLPT ? (existingSession?.listeningMinutes || 0) : undefined,
                    link: !isJLPT ? (existingSession?.link || "") : undefined,
                    status: existingSession?.status || 'PLANNED'
                  }
                }
              )

              lastUpdateRef.current = ""
              onUpdateSessions(newSessions)
              onSetSessionPage(1)
            }}
            placeholder="Enter total sessions"
            min={1}
            required
          />
          {sessions.length > 0 && (
            <p className="text-xs text-green-600">
              ✓ {sessions.length} sessions configured
            </p>
          )}
        </div>

        {/* Duration Per Session - Side by side with Total Sessions */}
        <div className="space-y-2">
          <Label>
            Duration Per Session (days)
            <span className="ml-2 text-xs text-muted-foreground">
              (applies to all sessions)
            </span>
          </Label>
          <Input
            type="number"
            value={mainDurationPerSession || 7}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1
              onUpdateMainDurationPerSession?.(value)

              // If there are sessions, update them all
              if (sessions.length > 0) {
                const updatedSessions = sessions.map((session) => ({
                  ...session,
                  durationPerSession: value
                }))
                const sessionsWithRecalculatedDates = recalculateSessionDates(updatedSessions)
                lastUpdateRef.current = ""
                onUpdateSessions(sessionsWithRecalculatedDates)
              }
            }}
            className="h-8 text-sm"
            min={1}
            disabled={sessions.length === 0}  
          />
          <p className="text-xs text-muted-foreground">
            {sessions.length === 0
              ? "🔒 Duration is locked. Modify individual sessions below."
              : "ℹ️ Set the default duration for new sessions."}
          </p>
        </div>
      </div>

      {/* Self-Study Sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sessions</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addSelfStudySession}
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
        {sessions.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-4 text-center text-sm text-muted-foreground">
            No sessions added yet. Enter "Total Sessions" above or click
            "Add Session" to create one.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedSessions.map((session, idx) => {
                const globalIndex = (sessionPage - 1) * itemsPerPage + idx
                return (
                  <div
                    key={session.id}
                    className="space-y-2 rounded-lg border bg-muted/5 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Session #{globalIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeSelfStudySession(session.id)}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          strokeWidth={2}
                          className="h-3 w-3"
                        />
                      </Button>
                    </div>

                    {/* Duration Per Session - Independent per session */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Duration Between Sessions (days)
                        </Label>
                        {session.durationPerSession === mainDurationPerSession && mainDurationPerSession !== undefined && (
                          <span className="text-[10px] text-green-600">(synced)</span>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={session.durationPerSession ?? mainDurationPerSession ?? 7}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1

                          // Update ONLY this session's duration
                          const updatedSessions = sessions.map((s) =>
                            s.id === session.id ? { ...s, durationPerSession: value } : s
                          )

                          // Recalculate all dates based on updated durations
                          const sessionsWithRecalculatedDates = recalculateSessionDates(updatedSessions)

                          lastUpdateRef.current = ""
                          onUpdateSessions(sessionsWithRecalculatedDates)

                          // Check if all sessions now have the same duration, update main
                          const allSame = sessionsWithRecalculatedDates.every(
                            s => s.durationPerSession === value
                          )
                          if (allSame) {
                            onUpdateMainDurationPerSession?.(value)
                          }
                        }}
                        className="h-8 text-sm"
                        min={1}
                      />
                    </div>

                    {/* Show date for reference */}
                    {session.date && (
                      <div className="text-xs text-muted-foreground">
                        📅 {format(new Date(session.date), "MMM d, yyyy")}
                      </div>
                    )}

                    {/* JLPT Self-Study - Show metrics fields */}
                    {isJLPT ? (
                      <div className="grid grid-cols-5 gap-1">
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Kanji
                          </Label>
                          <Input
                            type="number"
                            value={session.kanjiCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "kanjiCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Vocab
                          </Label>
                          <Input
                            type="number"
                            value={session.vocabularyCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "vocabularyCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Grammar
                          </Label>
                          <Input
                            type="number"
                            value={session.grammarCount ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "grammarCount",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Reading
                          </Label>
                          <Input
                            type="number"
                            value={session.readingMinutes ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "readingMinutes",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="col-span-1 space-y-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Listening
                          </Label>
                          <Input
                            type="number"
                            value={session.listeningMinutes ?? 0}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "listeningMinutes",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="h-6 text-xs"
                            min={0}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Non-JLPT Self-Study - Show link field */
                      <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">
                          Link
                        </Label>
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Link02Icon}
                            strokeWidth={1.5}
                            className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
                          />
                          <Input
                            type="url"
                            value={session.link ?? ""}
                            onChange={(e) =>
                              updateSelfStudySession(
                                session.id,
                                "link",
                                e.target.value
                              )
                            }
                            className="h-7 pl-6 text-xs"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {totalSessionPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <Field orientation="horizontal" className="w-fit">
                  <FieldLabel
                    htmlFor="select-rows-per-page"
                    className="text-sm whitespace-nowrap text-foreground"
                  >
                    Rows per page
                  </FieldLabel>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger
                      className="w-15"
                      id="select-rows-per-page"
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
                          if (sessionPage > 1)
                            goToSessionPage(sessionPage - 1)
                        }}
                        className={
                          sessionPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: totalSessionPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            goToSessionPage(page)
                          }}
                          isActive={sessionPage === page}
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
                          if (sessionPage < totalSessionPages) {
                            goToSessionPage(sessionPage + 1)
                          }
                        }}
                        className={
                          sessionPage === totalSessionPages
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

      {/* ================================================ */}
      {/* ENROLLED EMPLOYEES - ONLY SHOW IN EDIT MODE */}
      {/* ================================================ */}
      {mode === "edit" && courseId && (
        <>
          {enrolledEmployees.length > 0 ? (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <HugeiconsIcon
                  icon={User02Icon}
                  strokeWidth={1.5}
                  className="h-5 w-5 text-muted-foreground"
                />
                <Label className="text-base font-semibold">
                  Enrolled Employees
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({enrolledEmployees.length})
                  </span>
                </Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrolledEmployees.map((employee: any) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 rounded-lg border bg-muted/5 p-3 transition-colors hover:bg-muted/10"
                  >
                    <Avatar className="h-10 w-10 rounded-lg shrink-0">
                      <AvatarImage src={employee.pfImage || ""} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(employee.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {employee.employeeName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 px-1.5 py-0 text-[10px]",
                            statusColors[employee.enrollmentStatus],
                            "bg-opacity-10"
                          )}
                        >
                          {statusLabels[employee.enrollmentStatus] || employee.enrollmentStatus}
                        </Badge>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {employee.email}
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{employee.departmentName}</span>
                        {employee.departmentName && employee.teamName && <span>•</span>}
                        {employee.teamName && <span className="truncate">{employee.teamName}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(employee.enrolledAt), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-3">
                <HugeiconsIcon
                  icon={User02Icon}
                  strokeWidth={1.5}
                  className="h-5 w-5 text-muted-foreground"
                />
                <Label className="text-base font-semibold">
                  Enrolled Employees
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    (0)
                  </span>
                </Label>
              </div>
              <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No employees enrolled in this course yet
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}